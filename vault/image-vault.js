(() => {
  'use strict';

  const DB_NAME = 'ldd-prompt-vault-image-db';
  const DB_VERSION = 1;
  const STORE_IMAGES = 'images';
  const STORE_FOLDERS = 'imageFolders';
  const SETTINGS_KEY = 'lddImageVaultSettings';
  const THUMB_MAX = 420;
  const JSZIP_CDN = './vendor/jszip.min.js';
  const state = {
    db: null,
    images: [],
    folders: [],
    activeFolder: 'all',
    query: '',
    sort: 'newest',
    selected: new Set(),
    previewId: null,
    objectUrls: new Map(),
  };

  function $(selector, root = document) { return root.querySelector(selector); }
  function $all(selector, root = document) { return Array.from(root.querySelectorAll(selector)); }
  function uid(prefix = 'img') { return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`; }
  function nowIso() { return new Date().toISOString(); }
  function formatBytes(bytes = 0) {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / Math.pow(1024, index)).toFixed(index ? 1 : 0)} ${units[index]}`;
  }
  function safeName(name = '') { return name.replace(/[\\/:*?"<>|]/g, '-'); }
  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ activeFolder: state.activeFolder, sort: state.sort }));
  }
  function loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      if (saved.activeFolder) state.activeFolder = saved.activeFolder;
      if (saved.sort) state.sort = saved.sort;
    } catch (_) {}
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_IMAGES)) {
          const store = db.createObjectStore(STORE_IMAGES, { keyPath: 'id' });
          store.createIndex('folderId', 'folderId', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('name', 'name', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_FOLDERS)) {
          const folderStore = db.createObjectStore(STORE_FOLDERS, { keyPath: 'id' });
          folderStore.createIndex('name', 'name', { unique: false });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  function tx(storeName, mode = 'readonly') { return state.db.transaction(storeName, mode).objectStore(storeName); }
  function idbGetAll(storeName) {
    return new Promise((resolve, reject) => {
      const req = tx(storeName).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }
  function idbPut(storeName, value) {
    return new Promise((resolve, reject) => {
      const req = tx(storeName, 'readwrite').put(value);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  function idbDelete(storeName, id) {
    return new Promise((resolve, reject) => {
      const req = tx(storeName, 'readwrite').delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async function refreshData() {
    state.images = await idbGetAll(STORE_IMAGES);
    state.folders = await idbGetAll(STORE_FOLDERS);
    if (!state.folders.length) {
      await idbPut(STORE_FOLDERS, { id: 'general', name: 'General', createdAt: nowIso() });
      state.folders = await idbGetAll(STORE_FOLDERS);
    }
    if (state.activeFolder !== 'all' && state.activeFolder !== 'favorites' && !state.folders.some(f => f.id === state.activeFolder)) {
      state.activeFolder = 'all';
    }
    render();
  }

  function createThumb(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const src = URL.createObjectURL(file);
      img.onload = () => {
        const scale = Math.min(1, THUMB_MAX / Math.max(img.naturalWidth, img.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => {
          URL.revokeObjectURL(src);
          if (!blob) reject(new Error('Could not create thumbnail'));
          else resolve({ blob, width: img.naturalWidth, height: img.naturalHeight });
        }, 'image/webp', 0.82);
      };
      img.onerror = () => { URL.revokeObjectURL(src); reject(new Error(`Could not read ${file.name}`)); };
      img.src = src;
    });
  }

  async function addFiles(files) {
    const list = Array.from(files || []);
    const zipFiles = list.filter(file => isZipFile(file));
    const imageFiles = list.filter(file => file.type.startsWith('image/'));
    let total = 0;
    if (imageFiles.length) total += await addImageFiles(imageFiles);
    for (const zipFile of zipFiles) total += await importImageZip(zipFile);
    if (!total) return toast('No image files found. PNG goblins escaped.');
    await refreshData();
    toast(`${total} image${total === 1 ? '' : 's'} saved to Image Vault`);
  }

  async function addImageFiles(files, preferredFolderId) {
    const valid = Array.from(files || []).filter(file => file && file.type && file.type.startsWith('image/'));
    if (!valid.length) return 0;
    const folderId = preferredFolderId || (state.activeFolder === 'all' || state.activeFolder === 'favorites' ? 'general' : state.activeFolder);
    let count = 0;
    for (const file of valid) {
      try {
        const thumb = await createThumb(file);
        const record = {
          id: uid('img'),
          name: file.name,
          folderId,
          tags: [],
          type: file.type,
          size: file.size,
          width: thumb.width,
          height: thumb.height,
          createdAt: nowIso(),
          updatedAt: nowIso(),
          favorite: false,
          notes: '',
          linkedPromptId: '',
          blob: file,
          thumbnailBlob: thumb.blob,
        };
        await idbPut(STORE_IMAGES, record);
        count++;
      } catch (error) {
        console.warn(error);
      }
    }
    return count;
  }

  function isZipFile(file) {
    return !!file && (/\.zip$/i.test(file.name || '') || file.type === 'application/zip' || file.type === 'application/x-zip-compressed');
  }

  function mimeFromName(name = '') {
    const lower = name.toLowerCase();
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.gif')) return 'image/gif';
    if (lower.endsWith('.svg')) return 'image/svg+xml';
    return '';
  }

  function isImagePath(path = '') {
    return /\.(png|jpe?g|webp|gif|svg)$/i.test(path) && !/(^|\/)__MACOSX\//i.test(path);
  }

  function ensureJSZip() {
    return new Promise((resolve, reject) => {
      if (window.JSZip) return resolve(window.JSZip);
      const existing = document.querySelector('script[data-ldd-jszip]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.JSZip));
        existing.addEventListener('error', () => reject(new Error('JSZip could not load')));
        return;
      }
      const script = document.createElement('script');
      script.src = JSZIP_CDN;
      script.async = true;
      script.dataset.lddJszip = 'true';
      script.onload = () => window.JSZip ? resolve(window.JSZip) : reject(new Error('JSZip unavailable'));
      script.onerror = () => reject(new Error('JSZip could not load'));
      document.head.appendChild(script);
    });
  }

  async function importImageZip(zipFile) {
    try {
      toast(`Reading ${zipFile.name}...`);
      const JSZip = await ensureJSZip();
      const zip = await JSZip.loadAsync(zipFile);
      const files = [];
      const entries = Object.values(zip.files).filter(entry => !entry.dir && isImagePath(entry.name));
      for (const entry of entries) {
        const blob = await entry.async('blob');
        const shortName = entry.name.split('/').filter(Boolean).pop() || entry.name;
        files.push(new File([blob], shortName, { type: mimeFromName(shortName) || blob.type || 'application/octet-stream' }));
      }
      const count = await addImageFiles(files);
      toast(`Imported ${count} image${count === 1 ? '' : 's'} from ZIP`);
      return count;
    } catch (error) {
      console.error(error);
      toast('Could not import ZIP. JSZip/CDN may be blocked.');
      return 0;
    }
  }

  function getThumbUrl(image) {
    const key = `${image.id}:thumb`;
    if (!state.objectUrls.has(key)) state.objectUrls.set(key, URL.createObjectURL(image.thumbnailBlob || image.blob));
    return state.objectUrls.get(key);
  }
  function getImageUrl(image) {
    const key = `${image.id}:full`;
    if (!state.objectUrls.has(key)) state.objectUrls.set(key, URL.createObjectURL(image.blob));
    return state.objectUrls.get(key);
  }
  function currentImages() {
    const q = state.query.trim().toLowerCase();
    let images = state.images.filter(img => {
      const folderOk = state.activeFolder === 'all' || (state.activeFolder === 'favorites' ? img.favorite : img.folderId === state.activeFolder);
      if (!folderOk) return false;
      if (!q) return true;
      const haystack = [img.name, img.notes, img.linkedPromptId, ...(img.tags || [])].join(' ').toLowerCase();
      return haystack.includes(q);
    });
    images.sort((a, b) => {
      if (state.sort === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (state.sort === 'name') return a.name.localeCompare(b.name);
      if (state.sort === 'largest') return (b.size || 0) - (a.size || 0);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    return images;
  }
  function folderName(id) { return (state.folders.find(f => f.id === id) || {}).name || 'General'; }


  function promptVaultTitle() {
    try {
      const raw = localStorage.getItem('ldd-prompt-vault:v1');
      const data = raw ? JSON.parse(raw) : null;
      const owner = data && data.settings && data.settings.ownerName ? String(data.settings.ownerName).trim() : '';
      return owner ? `${owner}'s Prompt Vault` : 'LDD Prompt Vault';
    } catch (error) {
      return 'LDD Prompt Vault';
    }
  }

  function normalizePromptVaultBranding() {
    const shell = document.getElementById('ldd-image-vault-shell');
    const imageOpen = shell && shell.classList.contains('is-open');
    const title = document.querySelector('.topbar-brand h1');
    if (title && !imageOpen) {
      const nextTitle = promptVaultTitle();
      if (title.textContent !== nextTitle) title.textContent = nextTitle;
    }
    if (!imageOpen && document.title !== 'LDD Creative Vault') document.title = 'LDD Creative Vault';
  }

  function buildUI() {
    if ($('#ldd-image-vault-shell')) return;
    const promptTab = document.createElement('button');
    promptTab.className = 'ldd-prompt-vault-tab is-active';
    promptTab.type = 'button';
    promptTab.innerHTML = '<span class="ldd-vault-tab-label">Prompt Vault</span>';
    promptTab.setAttribute('aria-label', 'Prompt Vault');
    promptTab.addEventListener('click', closeVault);

    const launcher = document.createElement('button');
    launcher.className = 'ldd-image-vault-launcher';
    launcher.type = 'button';
    launcher.innerHTML = '<span class="ldd-vault-tab-label">Image Vault</span>';
    launcher.setAttribute('aria-label', 'Image Vault');
    launcher.addEventListener('click', openVault);

    const shell = document.createElement('div');
    shell.id = 'ldd-image-vault-shell';
    shell.className = 'ldd-image-vault-shell ldd-image-vault-page';
    shell.innerHTML = `
      <section class="ldd-image-vault-panel" role="region" aria-label="LDD Image Vault">
        <aside class="ldd-iv-sidebar">
          <div class="ldd-iv-dropzone" id="ldd-iv-dropzone">
            <strong>Drop images here</strong>
            <span>PNG, JPG, WEBP, SVG, or ZIP full of images — stored locally in IndexedDB</span>
            <input class="ldd-iv-file-input" id="ldd-iv-file-input" type="file" accept="image/*,.zip,application/zip" multiple />
          </div>
          <div class="ldd-iv-quick-actions">
            <button class="ldd-iv-btn secondary" id="ldd-iv-upload-zip" type="button">Upload image ZIP</button>
            <button class="ldd-iv-btn secondary" id="ldd-iv-backup-all" type="button">Backup all</button>
            <button class="ldd-iv-btn secondary" id="ldd-iv-restore-backup" type="button">Restore backup</button>
            <input class="ldd-iv-file-input" id="ldd-iv-zip-input" type="file" accept=".zip,application/zip" multiple />
            <input class="ldd-iv-file-input" id="ldd-iv-backup-input" type="file" accept=".zip,application/zip,.json,application/json" />
          </div>
          <div class="ldd-iv-folder-title">Folders</div>
          <div class="ldd-iv-folder-list" id="ldd-iv-folder-list"></div>
          <div class="ldd-iv-new-folder">
            <input class="ldd-iv-input" id="ldd-iv-folder-name" placeholder="New folder" />
            <button class="ldd-iv-icon-btn" id="ldd-iv-add-folder" type="button" title="Add folder">+</button>
          </div>
        </aside>
        <main class="ldd-iv-main">
          <header class="ldd-iv-header">
            <div class="ldd-iv-brand">
              <img class="ldd-iv-logo" src="./logo.png" alt="LDDTools logo" />
              <div class="ldd-iv-brand-copy">
                <h2 class="ldd-iv-title" id="ldd-iv-app-title">LDD Image Vault</h2>
              </div>
            </div>
            <!-- Tabs are provided by the single global dock near Settings.
                 Keep Image Vault header clean so duplicate tabs do not appear. -->
          </header>
          <div class="ldd-iv-controls">
            <input class="ldd-iv-input" id="ldd-iv-search" placeholder="Search name, tag, note, linked prompt…" />
            <select class="ldd-iv-select" id="ldd-iv-sort">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="name">Name</option>
              <option value="largest">Largest</option>
            </select>
            <button class="ldd-iv-btn secondary" id="ldd-iv-select-all" type="button">Select visible</button>
            <button class="ldd-iv-btn secondary" id="ldd-iv-download-selected" type="button">Download selected ZIP</button>
            <button class="ldd-iv-btn secondary" id="ldd-iv-download-visible" type="button">Download visible ZIP</button>
            <button class="ldd-iv-btn secondary" id="ldd-iv-export-index" type="button">Export index JSON</button>
            <button class="ldd-iv-btn danger" id="ldd-iv-delete-selected" type="button">Delete selected</button>
          </div>
          <div class="ldd-iv-grid-wrap">
            <div class="ldd-iv-stats" id="ldd-iv-stats"></div>
            <div class="ldd-iv-grid" id="ldd-iv-grid"></div>
          </div>
        </main>
      </section>`;

    const modal = document.createElement('div');
    modal.id = 'ldd-iv-modal';
    modal.className = 'ldd-iv-modal';
    modal.innerHTML = `
      <div class="ldd-iv-modal-card">
        <div class="ldd-iv-modal-head">
          <strong id="ldd-iv-modal-title">Image preview</strong>
          <button class="ldd-iv-close" id="ldd-iv-modal-close" type="button">×</button>
        </div>
        <div class="ldd-iv-modal-body">
          <div><img class="ldd-iv-preview-img" id="ldd-iv-preview-img" alt="Selected vault image" /></div>
          <div class="ldd-iv-form">
            <label>Name<input class="ldd-iv-input" id="ldd-iv-edit-name" /></label>
            <label>Folder<select class="ldd-iv-select" id="ldd-iv-edit-folder"></select></label>
            <label>Tags<input class="ldd-iv-input" id="ldd-iv-edit-tags" placeholder="comma, separated, tags" /></label>
            <label>Linked Prompt ID / note<input class="ldd-iv-input" id="ldd-iv-edit-linked" placeholder="optional prompt reference" /></label>
            <label>Notes<textarea class="ldd-iv-textarea" id="ldd-iv-edit-notes" placeholder="Mockup use, Etsy niche, transformation notes..."></textarea></label>
            <button class="ldd-iv-btn" id="ldd-iv-save-meta" type="button">Save details</button>
            <button class="ldd-iv-btn secondary" id="ldd-iv-download" type="button">Download image</button>
            <button class="ldd-iv-btn secondary" id="ldd-iv-toggle-favorite" type="button">Toggle favorite</button>
            <button class="ldd-iv-btn danger" id="ldd-iv-delete-one" type="button">Delete image</button>
          </div>
        </div>
      </div>`;

    const toastEl = document.createElement('div');
    toastEl.id = 'ldd-iv-toast';
    toastEl.className = 'ldd-iv-toast';

    document.body.append(promptTab, launcher, modal, toastEl);
    const root = document.getElementById('root');
    if (root && root.parentElement) root.insertAdjacentElement('afterend', shell);
    else document.body.appendChild(shell);
    wireEvents();
    normalizePromptVaultBranding();
  }

  function wireEvents() {
    const shell = $('#ldd-image-vault-shell');
    $all('[data-iv-close]').forEach(el => el.addEventListener('click', closeVault));
    const dropzone = $('#ldd-iv-dropzone');
    const input = $('#ldd-iv-file-input');
    dropzone.addEventListener('click', () => input.click());
    input.addEventListener('change', event => addFiles(event.target.files).then(() => { event.target.value = ''; }));
    $('#ldd-iv-upload-zip').addEventListener('click', () => $('#ldd-iv-zip-input').click());
    $('#ldd-iv-zip-input').addEventListener('change', event => addFiles(event.target.files).then(() => { event.target.value = ''; }));
    $('#ldd-iv-backup-all').addEventListener('click', backupAll);
    $('#ldd-iv-restore-backup').addEventListener('click', () => $('#ldd-iv-backup-input').click());
    $('#ldd-iv-backup-input').addEventListener('change', event => restoreBackup(event.target.files && event.target.files[0]).then(() => { event.target.value = ''; }));
    ['dragenter', 'dragover'].forEach(type => dropzone.addEventListener(type, event => {
      event.preventDefault();
      dropzone.classList.add('is-dragging');
    }));
    ['dragleave', 'drop'].forEach(type => dropzone.addEventListener(type, event => {
      event.preventDefault();
      dropzone.classList.remove('is-dragging');
    }));
    dropzone.addEventListener('drop', event => addFiles(event.dataTransfer.files));

    $('#ldd-iv-search').addEventListener('input', event => { state.query = event.target.value; renderGrid(); });
    $('#ldd-iv-sort').addEventListener('change', event => { state.sort = event.target.value; saveSettings(); renderGrid(); });
    $('#ldd-iv-add-folder').addEventListener('click', addFolderFromInput);
    $('#ldd-iv-folder-name').addEventListener('keydown', event => { if (event.key === 'Enter') addFolderFromInput(); });
    $('#ldd-iv-select-all').addEventListener('click', () => {
      const visible = currentImages();
      const allSelected = visible.length && visible.every(img => state.selected.has(img.id));
      visible.forEach(img => allSelected ? state.selected.delete(img.id) : state.selected.add(img.id));
      renderGrid();
    });
    $('#ldd-iv-download-selected').addEventListener('click', () => downloadImagesAsZip(Array.from(state.selected).map(id => state.images.find(img => img.id === id)).filter(Boolean), 'ldd-image-vault-selected.zip'));
    $('#ldd-iv-download-visible').addEventListener('click', () => downloadImagesAsZip(currentImages(), 'ldd-image-vault-visible.zip'));
    $('#ldd-iv-export-index').addEventListener('click', exportIndexJson);
    $('#ldd-iv-delete-selected').addEventListener('click', deleteSelected);
    $('#ldd-iv-modal-close').addEventListener('click', closeModal);
    $('#ldd-iv-modal').addEventListener('click', event => { if (event.target.id === 'ldd-iv-modal') closeModal(); });
    $('#ldd-iv-save-meta').addEventListener('click', saveCurrentMeta);
    $('#ldd-iv-download').addEventListener('click', downloadCurrent);
    $('#ldd-iv-toggle-favorite').addEventListener('click', toggleCurrentFavorite);
    $('#ldd-iv-delete-one').addEventListener('click', deleteCurrent);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        if ($('#ldd-iv-modal').classList.contains('is-open')) closeModal();
        else if (shell.classList.contains('is-open')) closeVault();
      }
    });
  }

  async function addFolderFromInput() {
    const input = $('#ldd-iv-folder-name');
    const name = input.value.trim();
    if (!name) return;
    const folder = { id: uid('folder'), name, createdAt: nowIso() };
    await idbPut(STORE_FOLDERS, folder);
    input.value = '';
    state.activeFolder = folder.id;
    saveSettings();
    await refreshData();
    toast(`Folder “${name}” created`);
  }

  function render() {
    const sort = $('#ldd-iv-sort');
    if (sort) sort.value = state.sort;
    renderFolders();
    renderGrid();
  }
  function renderFolders() {
    const counts = state.images.reduce((acc, img) => {
      acc[img.folderId] = (acc[img.folderId] || 0) + 1;
      return acc;
    }, {});
    const favCount = state.images.filter(img => img.favorite).length;
    const list = $('#ldd-iv-folder-list');
    list.innerHTML = '';
    const folderItems = [
      { id: 'all', name: 'All Images', count: state.images.length },
      { id: 'favorites', name: 'Favorites', count: favCount },
      ...state.folders.map(f => ({ ...f, count: counts[f.id] || 0 })),
    ];
    for (const folder of folderItems) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `ldd-iv-folder-btn${state.activeFolder === folder.id ? ' is-active' : ''}`;
      if (folder.id === 'all' || folder.id === 'favorites') {
        btn.innerHTML = `<span>${escapeHtml(folder.name)}</span><span class="ldd-iv-count">${folder.count}</span>`;
        btn.addEventListener('click', () => {
          state.activeFolder = folder.id;
          state.selected.clear();
          saveSettings();
          render();
        });
        list.appendChild(btn);
      } else {
        const row = document.createElement('div');
        row.className = 'ldd-iv-folder-row';
        btn.innerHTML = `<span>${escapeHtml(folder.name)}</span><span class="ldd-iv-count">${folder.count}</span>`;
        btn.addEventListener('click', () => {
          state.activeFolder = folder.id;
          state.selected.clear();
          saveSettings();
          render();
        });
        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'ldd-iv-folder-delete';
        del.title = 'Delete folder';
        del.textContent = '×';
        del.addEventListener('click', event => {
          event.stopPropagation();
          deleteFolder(folder.id);
        });
        row.append(btn, del);
        list.appendChild(row);
      }
    }
  }
  function renderGrid() {
    const images = currentImages();
    const grid = $('#ldd-iv-grid');
    const totalBytes = state.images.reduce((sum, img) => sum + (img.size || 0), 0);
    $('#ldd-iv-stats').innerHTML = `<span>${images.length} visible / ${state.images.length} saved · ${formatBytes(totalBytes)} local storage used by image files</span><span>${state.selected.size} selected</span>`;
    grid.innerHTML = '';
    if (!images.length) {
      grid.innerHTML = `<div class="ldd-iv-empty" style="grid-column:1/-1;"><strong>No images here yet.</strong><br/>Drop a few PNGs in and this vault stops looking like a haunted closet.</div>`;
      return;
    }
    for (const image of images) {
      const card = document.createElement('article');
      card.className = 'ldd-iv-card';
      const tags = (image.tags || []).slice(0, 4).map(tag => `<span class="ldd-iv-tag">${escapeHtml(tag)}</span>`).join('');
      card.innerHTML = `
        <div class="ldd-iv-thumb-wrap">
          <input class="ldd-iv-check" type="checkbox" ${state.selected.has(image.id) ? 'checked' : ''} aria-label="Select image" />
          <img class="ldd-iv-thumb" src="${getThumbUrl(image)}" alt="${escapeAttr(image.name)}" loading="lazy" />
        </div>
        <div class="ldd-iv-card-body">
          <div class="ldd-iv-name" title="${escapeAttr(image.name)}">${image.favorite ? '⭐ ' : ''}${escapeHtml(image.name)}</div>
          <div class="ldd-iv-meta">${image.width || '?'}×${image.height || '?'} · ${formatBytes(image.size)} · ${escapeHtml(folderName(image.folderId))}</div>
          <div class="ldd-iv-tags">${tags}</div>
          <div class="ldd-iv-card-actions">
            <button class="ldd-iv-btn secondary" type="button" data-action="open">Open</button>
            <button class="ldd-iv-btn secondary" type="button" data-action="download">Save</button>
          </div>
        </div>`;
      $('.ldd-iv-check', card).addEventListener('change', event => {
        event.target.checked ? state.selected.add(image.id) : state.selected.delete(image.id);
        renderGrid();
      });
      $('[data-action="open"]', card).addEventListener('click', () => openModal(image.id));
      $('[data-action="download"]', card).addEventListener('click', () => downloadImage(image));
      $('.ldd-iv-thumb', card).addEventListener('dblclick', () => openModal(image.id));
      grid.appendChild(card);
    }
  }

  function getVaultTitle() {
    try {
      const raw = localStorage.getItem('ldd-prompt-vault:v1');
      const data = raw ? JSON.parse(raw) : null;
      const owner = data && data.settings && data.settings.ownerName ? String(data.settings.ownerName).trim() : '';
      return owner ? `${owner}'s Image Vault` : 'LDD Image Vault';
    } catch {
      return 'LDD Image Vault';
    }
  }

  function setTabState(isImageVaultOpen) {
    document.querySelectorAll('.ldd-prompt-vault-tab').forEach(el => { if (!el.querySelector('.ldd-vault-tab-label')) el.innerHTML = '<span class="ldd-vault-tab-label">Prompt Vault</span>'; });
    document.querySelectorAll('.ldd-image-vault-launcher').forEach(el => { if (!el.querySelector('.ldd-vault-tab-label')) el.innerHTML = '<span class="ldd-vault-tab-label">Image Vault</span>'; });
    document.querySelectorAll('.ldd-prompt-vault-tab').forEach(el => el.classList.toggle('is-active', !isImageVaultOpen));
    document.querySelectorAll('.ldd-image-vault-launcher').forEach(el => el.classList.toggle('is-active', isImageVaultOpen));
    const title = $('#ldd-iv-app-title');
    if (title) title.textContent = getVaultTitle();
  }

  function openVault() {
    const shell = $('#ldd-image-vault-shell');
    const root = document.getElementById('root');
    if (root) root.classList.add('ldd-iv-hide-root');
    shell.classList.add('is-open');
    document.title = 'LDD Image Vault';
    setTabState(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function closeVault() {
    const shell = $('#ldd-image-vault-shell');
    const root = document.getElementById('root');
    shell.classList.remove('is-open');
    if (root) root.classList.remove('ldd-iv-hide-root');
    setTabState(false);
    normalizePromptVaultBranding();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function closeModal() { $('#ldd-iv-modal').classList.remove('is-open'); state.previewId = null; }
  function openModal(id) {
    const image = state.images.find(img => img.id === id);
    if (!image) return;
    state.previewId = id;
    $('#ldd-iv-modal-title').textContent = image.name;
    $('#ldd-iv-preview-img').src = getImageUrl(image);
    $('#ldd-iv-edit-name').value = image.name || '';
    $('#ldd-iv-edit-tags').value = (image.tags || []).join(', ');
    $('#ldd-iv-edit-linked').value = image.linkedPromptId || '';
    $('#ldd-iv-edit-notes').value = image.notes || '';
    const folderSelect = $('#ldd-iv-edit-folder');
    folderSelect.innerHTML = state.folders.map(f => `<option value="${escapeAttr(f.id)}">${escapeHtml(f.name)}</option>`).join('');
    folderSelect.value = image.folderId || 'general';
    $('#ldd-iv-modal').classList.add('is-open');
  }
  async function saveCurrentMeta() {
    const image = state.images.find(img => img.id === state.previewId);
    if (!image) return;
    image.name = $('#ldd-iv-edit-name').value.trim() || image.name;
    image.folderId = $('#ldd-iv-edit-folder').value || 'general';
    image.tags = $('#ldd-iv-edit-tags').value.split(',').map(t => t.trim()).filter(Boolean);
    image.linkedPromptId = $('#ldd-iv-edit-linked').value.trim();
    image.notes = $('#ldd-iv-edit-notes').value.trim();
    image.updatedAt = nowIso();
    await idbPut(STORE_IMAGES, image);
    await refreshData();
    openModal(image.id);
    toast('Image details saved');
  }
  async function toggleCurrentFavorite() {
    const image = state.images.find(img => img.id === state.previewId);
    if (!image) return;
    image.favorite = !image.favorite;
    image.updatedAt = nowIso();
    await idbPut(STORE_IMAGES, image);
    await refreshData();
    openModal(image.id);
    toast(image.favorite ? 'Added to favorites' : 'Removed from favorites');
  }
  function downloadCurrent() {
    const image = state.images.find(img => img.id === state.previewId);
    if (image) downloadImage(image);
  }
  function downloadImage(image) {
    const a = document.createElement('a');
    a.href = getImageUrl(image);
    a.download = safeName(image.name || 'vault-image');
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  async function deleteCurrent() {
    const image = state.images.find(img => img.id === state.previewId);
    if (!image) return;
    if (!confirm(`Delete ${image.name} from Image Vault?`)) return;
    await idbDelete(STORE_IMAGES, image.id);
    state.selected.delete(image.id);
    closeModal();
    await refreshData();
    toast('Image deleted');
  }
  async function deleteSelected() {
    const ids = Array.from(state.selected);
    if (!ids.length) return toast('No images selected');
    if (!confirm(`Delete ${ids.length} selected image${ids.length === 1 ? '' : 's'}?`)) return;
    for (const id of ids) await idbDelete(STORE_IMAGES, id);
    state.selected.clear();
    await refreshData();
    toast('Selected images deleted');
  }


  async function deleteFolder(folderId) {
    const folder = state.folders.find(f => f.id === folderId);
    if (!folder || folder.id === 'general') {
      return toast(folder ? 'General folder stays put so orphan images have a home.' : 'Folder not found');
    }
    const imagesInFolder = state.images.filter(img => img.folderId === folderId);
    const msg = imagesInFolder.length
      ? `Delete folder "${folder.name}"? ${imagesInFolder.length} image${imagesInFolder.length === 1 ? '' : 's'} will be moved to General.`
      : `Delete folder "${folder.name}"?`;
    if (!confirm(msg)) return;
    for (const image of imagesInFolder) {
      image.folderId = 'general';
      image.updatedAt = nowIso();
      await idbPut(STORE_IMAGES, image);
    }
    await idbDelete(STORE_FOLDERS, folderId);
    if (state.activeFolder === folderId) state.activeFolder = 'all';
    saveSettings();
    await refreshData();
    toast(`Folder "${folder.name}" deleted`);
  }

  async function downloadImagesAsZip(images, filename) {
    if (!images.length) return toast('No images to download');
    try {
      const JSZip = await ensureJSZip();
      const zip = new JSZip();
      const seen = new Map();
      for (const image of images) {
        let name = safeName(image.name || `${image.id}.png`);
        const count = seen.get(name) || 0;
        seen.set(name, count + 1);
        if (count) {
          const dot = name.lastIndexOf('.');
          name = dot > -1 ? `${name.slice(0, dot)}-${count + 1}${name.slice(dot)}` : `${name}-${count + 1}`;
        }
        zip.file(name, image.blob);
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      saveBlob(blob, filename);
      toast(`Downloaded ${images.length} image${images.length === 1 ? '' : 's'} as ZIP`);
    } catch (error) {
      console.error(error);
      toast('Could not create ZIP. JSZip/CDN may be blocked.');
    }
  }

  function imageIndexRecord(image) {
    return {
      id: image.id,
      name: image.name,
      folderId: image.folderId,
      folderName: folderName(image.folderId),
      tags: image.tags || [],
      type: image.type,
      size: image.size,
      width: image.width,
      height: image.height,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt,
      favorite: !!image.favorite,
      notes: image.notes || '',
      linkedPromptId: image.linkedPromptId || ''
    };
  }

  function exportIndexJson() {
    const payload = {
      app: 'LDD Image Vault',
      exportedAt: nowIso(),
      folders: state.folders,
      images: state.images.map(imageIndexRecord)
    };
    saveBlob(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), 'ldd-image-vault-index.json');
    toast('Image index JSON exported');
  }

  async function backupAll() {
    if (!state.images.length) return toast('No images to backup yet');
    try {
      const JSZip = await ensureJSZip();
      const zip = new JSZip();
      zip.file('image-vault-manifest.json', JSON.stringify({
        app: 'LDD Image Vault',
        version: 1,
        exportedAt: nowIso(),
        folders: state.folders,
        images: state.images.map(imageIndexRecord)
      }, null, 2));
      const filesFolder = zip.folder('images');
      const seen = new Map();
      for (const image of state.images) {
        let name = safeName(image.name || `${image.id}.png`);
        const count = seen.get(name) || 0;
        seen.set(name, count + 1);
        if (count) {
          const dot = name.lastIndexOf('.');
          name = dot > -1 ? `${name.slice(0, dot)}-${image.id}${name.slice(dot)}` : `${name}-${image.id}`;
        }
        filesFolder.file(name, image.blob);
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      saveBlob(blob, `ldd-image-vault-backup-${new Date().toISOString().slice(0,10)}.zip`);
      toast('Full Image Vault backup downloaded');
    } catch (error) {
      console.error(error);
      toast('Could not create backup ZIP.');
    }
  }

  async function restoreBackup(file) {
    if (!file) return;
    if (file.type === 'application/json' || /\.json$/i.test(file.name || '')) {
      toast('JSON index imported as reference only. Use backup ZIP to restore images.');
      return;
    }
    if (!isZipFile(file)) return toast('Choose a ZIP backup or image ZIP');
    try {
      const JSZip = await ensureJSZip();
      const zip = await JSZip.loadAsync(file);
      const manifestEntry = zip.file('image-vault-manifest.json');
      if (!manifestEntry) {
        const count = await importImageZip(file);
        await refreshData();
        return toast(`Restored ${count} image${count === 1 ? '' : 's'} from image ZIP`);
      }
      const manifest = JSON.parse(await manifestEntry.async('string'));
      if (Array.isArray(manifest.folders)) {
        for (const folder of manifest.folders) {
          if (folder && folder.id && folder.name) await idbPut(STORE_FOLDERS, folder);
        }
      }
      const entries = Object.values(zip.files).filter(entry => !entry.dir && entry.name.startsWith('images/') && isImagePath(entry.name));
      let count = 0;
      for (const entry of entries) {
        const shortName = entry.name.split('/').filter(Boolean).pop() || entry.name;
        const blob = await entry.async('blob');
        const meta = (manifest.images || []).find(img => img.name === shortName) || {};
        const fileObj = new File([blob], shortName, { type: mimeFromName(shortName) || blob.type || 'application/octet-stream' });
        const thumb = await createThumb(fileObj);
        await idbPut(STORE_IMAGES, {
          id: uid('img'),
          name: shortName,
          folderId: meta.folderId && (manifest.folders || []).some(f => f.id === meta.folderId) ? meta.folderId : 'general',
          tags: meta.tags || [],
          type: fileObj.type,
          size: fileObj.size,
          width: thumb.width,
          height: thumb.height,
          createdAt: meta.createdAt || nowIso(),
          updatedAt: nowIso(),
          favorite: !!meta.favorite,
          notes: meta.notes || '',
          linkedPromptId: meta.linkedPromptId || '',
          blob: fileObj,
          thumbnailBlob: thumb.blob,
        });
        count++;
      }
      await refreshData();
      toast(`Backup restored: ${count} image${count === 1 ? '' : 's'}`);
    } catch (error) {
      console.error(error);
      toast('Could not restore backup ZIP');
    }
  }

  function saveBlob(blob, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    a.remove();
  }

  function findSettingsGear() {
    const selectors = [
      '.topbar-settings',
      '.topbar .icon-button[title="Settings"]',
      'button[title="Settings"]',
      'button[aria-label="Settings"]',
      '[aria-label="Settings"]',
      '[title="Settings"]'
    ];
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) return el;
    }

    // Fallback for the built/minified app: find the small square icon button
    // closest to the top-right area that looks like the settings gear.
    const candidates = Array.from(document.querySelectorAll('button'))
      .filter(btn => !btn.closest('#ldd-vault-top-tabs') && !btn.closest('#ldd-image-vault-shell'))
      .map(btn => ({ btn, rect: btn.getBoundingClientRect(), text: (btn.textContent || '').trim().toLowerCase() }))
      .filter(item => {
        const { rect, text } = item;
        return rect.width >= 24 && rect.width <= 58 && rect.height >= 24 && rect.height <= 58 &&
          rect.top >= 0 && rect.top <= 120 && rect.left > (window.innerWidth || 1200) * 0.55 &&
          !/new prompt|import|prompt vault|image vault/.test(text);
      })
      .sort((a, b) => {
        // Prefer the button immediately left of the hamburger/menu button.
        const ar = a.rect, br = b.rect;
        return (br.left - ar.left) || (ar.top - br.top);
      });
    return candidates[0]?.btn || null;
  }

  function placeLauncherNearSettings() {
    const launcher = document.querySelector('.ldd-image-vault-launcher');
    const promptTab = document.querySelector('.ldd-prompt-vault-tab');
    if (!launcher || !promptTab) return;
    let holder = document.getElementById('ldd-vault-top-tabs');
    if (!holder) {
      holder = document.createElement('div');
      holder.id = 'ldd-vault-top-tabs';
    }
    holder.className = 'ldd-vault-safe-dock';
    promptTab.className = 'ldd-prompt-vault-tab is-inline';
    launcher.className = 'ldd-image-vault-launcher is-inline';
    promptTab.innerHTML = '<span class="ldd-vault-tab-label">Prompt Vault</span>';
    launcher.innerHTML = '<span class="ldd-vault-tab-label">Image Vault</span>';
    if (promptTab.parentElement !== holder) holder.appendChild(promptTab);
    if (launcher.parentElement !== holder) holder.appendChild(launcher);
    let themeBtn = holder.querySelector('#ldd-vault-theme-btn');
    if (!themeBtn) {
      themeBtn = document.createElement('button');
      themeBtn.id = 'ldd-vault-theme-btn';
      themeBtn.type = 'button';
      themeBtn.title = 'Vault theme';
      themeBtn.setAttribute('aria-label', 'Vault theme');
      themeBtn.textContent = '◈';
      themeBtn.addEventListener('click', e => { e.stopPropagation(); lddToggleThemePop(); });
      holder.appendChild(themeBtn);
    }
    let vintageTab = holder.querySelector('#ldd-vault-vintage-tab');
    if (!vintageTab) {
      vintageTab = document.createElement('button');
      vintageTab.id = 'ldd-vault-vintage-tab';
      vintageTab.type = 'button';
      vintageTab.innerHTML = '<span class="ldd-vault-tab-label">Vintage</span>';
      vintageTab.setAttribute('aria-label', 'Vintage image tool');
      vintageTab.addEventListener('click', () => { window.location.href = 'vintage/index.html'; });
      holder.appendChild(vintageTab);
    }
    if (holder.parentElement !== document.body) document.body.appendChild(holder);

    const settings = findSettingsGear();
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1200;
    const compact = viewportWidth < 760;
    if (settings && !compact) {
      const rect = settings.getBoundingClientRect();
      const gap = 10;
      holder.style.setProperty('--ldd-dock-top', `${Math.max(8, rect.top + rect.height / 2)}px`);
      holder.style.setProperty('--ldd-dock-right', `${Math.max(8, viewportWidth - rect.left + gap)}px`);
      holder.style.setProperty('--ldd-dock-left', 'auto');
      holder.style.setProperty('--ldd-dock-transform', 'translateY(-50%)');
    } else {
      holder.style.setProperty('--ldd-dock-top', '72px');
      holder.style.setProperty('--ldd-dock-right', '12px');
      holder.style.setProperty('--ldd-dock-left', 'auto');
      holder.style.setProperty('--ldd-dock-transform', 'none');
    }
    setTabState(!!document.getElementById('ldd-image-vault-shell')?.classList.contains('is-open'));
    normalizePromptVaultBranding();
  }

  function escapeHtml(value = '') {
    return String(value).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  }
  function escapeAttr(value = '') { return escapeHtml(value).replace(/'/g, '&#39;'); }
  let toastTimer;
  function toast(message) {
    const el = $('#ldd-iv-toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('is-showing');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-showing'), 2300);
  }


  function watchPromptVaultBranding() {
    normalizePromptVaultBranding();
    let pending = false;
    const schedule = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        normalizePromptVaultBranding();
      });
    };
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  /* ===== Vault theme engine: mirrors the LDD Tools extension's One-Click Themes ===== */
  const VAULT_THEMES = [
    { id: 'purple-haze',  name: 'Purple Haze',  colors: ['#9d4dff','#7c3cff','#c084fc','#e879f9','#a78bfa'] },
    { id: 'neon-rainbow', name: 'Neon Rainbow', colors: ['#39ff14','#00eaff','#ff2bd6','#9d4dff','#ffe600'] },
    { id: 'matrix',       name: 'Matrix',       colors: ['#39ff14','#00ff88','#b6ff00','#00c853','#d7ff00'] },
    { id: 'cyberpunk',    name: 'Cyberpunk',    colors: ['#00f5ff','#ff2bd6','#9d4dff','#ffe600','#39ff14'] },
    { id: 'electric-blue',name: 'Electric Blue',colors: ['#2684ff','#00eaff','#7df9ff','#8aa4ff','#4dffea'] },
    { id: 'hot-pink',     name: 'Hot Pink',     colors: ['#ff2bd6','#ff4fa3','#c43cff','#7c3cff','#ff7ad9'] },
    { id: 'fire',         name: 'Neon Fire',    colors: ['#ff5a1f','#ff1744','#ff9f0a','#ffe600','#ff3d00'] },
    { id: 'ice',          name: 'Neon Ice',     colors: ['#00eaff','#7df9ff','#00b8ff','#6ee7ff','#4dffea'] },
    { id: 'midnight',     name: 'Midnight',     colors: ['#5b7cff','#7c3cff','#00d9ff','#a78bfa','#39ffcc'] },
    { id: 'native',       name: 'Native',       colors: ['#3b82f6','#60a5fa','#2563eb','#93c5fd','#1d4ed8'] },
  ];
  const VAULT_THEME_KEY = 'lddVaultTheme';
  function lddApplyVaultTheme(id) {
    const theme = VAULT_THEMES.find(t => t.id === id) || VAULT_THEMES[0];
    document.documentElement.dataset.vaultTheme = theme.id;
    try { localStorage.setItem(VAULT_THEME_KEY, theme.id); } catch (_) {}
    document.querySelectorAll('.ldd-vt-card').forEach(c => c.classList.toggle('is-active', c.dataset.vtTheme === theme.id));
  }
  function lddInitVaultTheme() {
    let saved = null;
    try { saved = localStorage.getItem(VAULT_THEME_KEY); } catch (_) {}
    lddApplyVaultTheme(saved || 'purple-haze');
  }
  function lddToggleThemePop() {
    let pop = document.getElementById('ldd-vault-theme-pop');
    if (!pop) {
      pop = document.createElement('div');
      pop.id = 'ldd-vault-theme-pop';
      pop.innerHTML = '<h4>Vault Theme</h4><div class="ldd-vt-grid">' + VAULT_THEMES.map(t =>
        `<button type="button" class="ldd-vt-card" data-vt-theme="${t.id}"><span class="ldd-vt-swatches">${t.colors.map(c => `<i style="background:${c}"></i>`).join('')}</span><span>${t.name}</span></button>`
      ).join('') + '</div>';
      document.body.appendChild(pop);
      pop.querySelectorAll('.ldd-vt-card').forEach(card => card.addEventListener('click', () => {
        lddApplyVaultTheme(card.dataset.vtTheme);
        toast(`Theme: ${VAULT_THEMES.find(t => t.id === card.dataset.vtTheme)?.name || ''}`);
      }));
      document.addEventListener('click', e => {
        if (pop.classList.contains('is-open') && !pop.contains(e.target) && !e.target.closest('#ldd-vault-theme-btn')) pop.classList.remove('is-open');
      });
    }
    const holder = document.getElementById('ldd-vault-top-tabs');
    if (holder) {
      const r = holder.getBoundingClientRect();
      pop.style.top = `${Math.min(window.innerHeight - 320, r.bottom + 10)}px`;
      pop.style.right = `${Math.max(10, window.innerWidth - r.right)}px`;
      pop.style.left = 'auto';
    } else { pop.style.top = '80px'; pop.style.right = '12px'; }
    pop.classList.toggle('is-open');
    pop.querySelectorAll('.ldd-vt-card').forEach(c => c.classList.toggle('is-active', c.dataset.vtTheme === document.documentElement.dataset.vaultTheme));
  }

  async function init() {
    if (!('indexedDB' in window)) return console.warn('IndexedDB is not available. Image Vault disabled.');
    lddInitVaultTheme();
    loadSettings();
    buildUI();
    state.db = await openDatabase();
    await refreshData();
    placeLauncherNearSettings();
    if (location.hash === '#image') openVault();
    setTimeout(placeLauncherNearSettings, 700);
    setTimeout(placeLauncherNearSettings, 1800);
    window.addEventListener('resize', placeLauncherNearSettings, { passive: true });
    window.addEventListener('scroll', placeLauncherNearSettings, { passive: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
