(() => {
  const storageKey = 'lddLowKeyBetaNoticeDismissed_v01';

  function hasDismissedNotice() {
    try {
      return localStorage.getItem(storageKey) === 'true';
    } catch (error) {
      return false;
    }
  }

  function saveDismissedNotice() {
    try {
      localStorage.setItem(storageKey, 'true');
    } catch (error) {
      // localStorage can fail in privacy modes; the popup still closes.
    }
  }

  function createBetaNotice() {
    if (hasDismissedNotice() || document.getElementById('ldd-beta-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'ldd-beta-overlay';
    overlay.className = 'ldd-beta-overlay';

    overlay.innerHTML = `
      <div class="ldd-beta-card" role="dialog" aria-modal="true" aria-labelledby="ldd-beta-title">
        <img class="ldd-beta-logo" src="./icon128.png" alt="LavenderDragonDesign logo" />
        <h2 id="ldd-beta-title">LavenderDragonDesign’s Low-Key Vintage Image Generator</h2>
        <h2 class="ldd-beta-version">Beta Notice v0.1</h2>
        <h2 class="ldd-beta-release">This is the first release. There might be bugs and issues — please report them.</h2>
        <h2 class="ldd-beta-message">Tool works best with background removed images.</h2>

        <div class="ldd-beta-hints" aria-label="Tips">
          <h2 class="ldd-beta-hint-title">Hints:</h2>
          <ul>
            <li><strong>Hint 1:</strong> Start with Vintage Low Key Mode.</li>
            <li><strong>Hint 2:</strong> Test first with one of the sample animals that already has the background removed.</li>
            <li><strong>Hint 3:</strong> Removing the background from your own image is optional, but recommended for best results.</li>
          </ul>
        </div>

        <div class="ldd-beta-actions">
          <label class="ldd-beta-check" for="ldd-beta-dont-show">
            <input id="ldd-beta-dont-show" type="checkbox" />
            Don’t show again
          </label>
          <button id="ldd-beta-close" class="ldd-beta-close" type="button">Got it</button>
        </div>

        <h2 class="ldd-beta-made-by">Made By Andrea With ❤️</h2>
      </div>
    `;

    document.body.prepend(overlay);

    const closeButton = overlay.querySelector('#ldd-beta-close');
    const dontShow = overlay.querySelector('#ldd-beta-dont-show');

    closeButton?.addEventListener('click', () => {
      if (dontShow?.checked) saveDismissedNotice();
      overlay.remove();
    });
  }

  window.addEventListener('DOMContentLoaded', createBetaNotice, { once: true });
})();