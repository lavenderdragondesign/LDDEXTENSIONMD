/* LDD offscreen PDF text extractor.
   Runs in an offscreen document (extension origin, extension CSP),
   so pdf.js can use its real worker. */
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = './pdf.worker.min.js';
} catch (e) {}
chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  if (!msg || msg.type !== 'LDD_PDF_PARSE_INNER') return;
  (async () => {
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(msg.data) }).promise;
    const pages = [];
    try {
      for (let i = 1; i <= doc.numPages; i++) {
        const pg = await doc.getPage(i);
        const tc = await pg.getTextContent();
        let t = '';
        for (const it of tc.items) {
          t += it.str || '';
          t += it.hasEOL ? '\n' : ' ';
        }
        pages.push(t.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim());
      }
    } finally {
      try { await doc.destroy(); } catch (e) {}
    }
    return { ok: true, pages };
  })().then(respond, e => respond({ ok: false, error: String((e && e.message) || e) }));
  return true;
});
