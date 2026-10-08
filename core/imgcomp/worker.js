// LDD Image Compressor worker (ES module).
// Receives raw RGBA pixels + WASM bytes, returns compressed bytes.
// All WASM compilation happens here (extension context), never in the page.
import {init as jpegInit, default as jpegEncode} from './jpeg/encode.js';
import {init as pngInit, default as pngEncode} from './png/encode.js';

const ready = {};

async function ensure(kind, wasmBytes) {
  if (ready[kind]) return;
  // Throws if the extension CSP blocks WASM compilation -> caller falls back.
  const mod = await WebAssembly.compile(wasmBytes);
  if (kind === 'jpg') await jpegInit(mod);
  else await pngInit(mod);
  ready[kind] = true;
}

onmessage = async (e) => {
  const d = e.data;
  try {
    await ensure(d.kind, new Uint8Array(d.wasm));
    const px = new Uint8ClampedArray(d.pixels);
    let buf;
    if (d.kind === 'jpg') {
      buf = await jpegEncode(
        {data: px, width: d.width, height: d.height},
        {quality: d.quality}
      );
    } else {
      buf = await pngEncode({data: px, width: d.width, height: d.height});
    }
    postMessage({id: d.id, ok: true, bytes: buf}, [buf]);
  } catch (err) {
    postMessage({id: d.id, ok: false,
      error: String((err && err.message) || err)});
  }
};
