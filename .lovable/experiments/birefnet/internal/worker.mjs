import * as ort from '/__internal-birefnet/ort.mjs';
import { letterbox, validateWorkingSize } from '/__internal-birefnet/geometry.mjs';
import { birefnetInput, birefnetMask } from '/__internal-birefnet/math.mjs';
import { composeBackgroundMatte } from '/__internal-birefnet/matte.mjs';

// Served only through a Playwright interception. No app endpoint serves this harness.
ort.env.wasm.numThreads = 1;
ort.env.wasm.proxy = false;
ort.env.wasm.wasmPaths = { mjs: '/__internal-birefnet/runtime.mjs', wasm: '/__internal-birefnet/runtime.wasm' };
let session;
self.onmessage = async ({ data }) => {
  const started = performance.now();
  let tensor, output;
  const canvases = [];
  const canvas = (w, h) => { const c = new OffscreenCanvas(w, h); canvases.push(c); return c; };
  try {
    const { width, height } = validateWorkingSize(data.width, data.height);
    const rgba = new Uint8ClampedArray(data.rgba);
    if (rgba.length !== width * height * 4) throw new Error('input');
    let downloadMs = 0, sessionMs = 0;
    const reused = Boolean(session);
    if (!session) {
      self.postMessage({ stage: 'download' });
      const begin = performance.now();
      const response = await fetch('/__internal-birefnet/model.onnx');
      if (!response.ok) throw new Error('download');
      const bytes = await response.arrayBuffer();
      const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), v => v.toString(16).padStart(2, '0')).join('');
      if (bytes.byteLength !== 180638623 || hash !== 'dff37bed4e94479a6a8f6b0e64d69030557bdcb79d53c9993b277f5c0cee4c93') throw new Error('integrity');
      downloadMs = performance.now() - begin;
      self.postMessage({ stage: 'session' });
      const beginSession = performance.now();
      session = await ort.InferenceSession.create(bytes, { executionProviders: ['wasm'] });
      sessionMs = performance.now() - beginSession;
    }
    const source = canvas(width, height), sourceCtx = source.getContext('2d');
    const small = canvas(512, 512), smallCtx = small.getContext('2d');
    if (!sourceCtx || !smallCtx) throw new Error('canvas');
    sourceCtx.putImageData(new ImageData(rgba, width, height), 0, 0);
    const box = letterbox(width, height);
    smallCtx.drawImage(source, box.x, box.y, box.width, box.height);
    tensor = new ort.Tensor('float32', birefnetInput(smallCtx.getImageData(0, 0, 512, 512).data, 512), [1, 3, 512, 512]);
    self.postMessage({ stage: 'inference' });
    const inferenceStart = performance.now();
    output = await session.run({ input_image: tensor });
    const inferenceMs = performance.now() - inferenceStart;
    const logits = output.output_image;
    if (!logits || !(logits.data instanceof Float32Array) || logits.data.length !== 512 * 512) throw new Error('output');
    const maskCanvas = canvas(512, 512), maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) throw new Error('canvas');
    maskCtx.putImageData(new ImageData(birefnetMask(logits.data), 512, 512), 0, 0);
    const guide = smallCtx.getImageData(box.x, box.y, box.width, box.height);
    const mask = maskCtx.getImageData(box.x, box.y, box.width, box.height);
    const result = composeBackgroundMatte(rgba, width, height, guide.data, mask.data, box.width, box.height);
    sourceCtx.putImageData(new ImageData(result, width, height), 0, 0);
    const blob = await source.convertToBlob({ type: 'image/png' });
    self.postMessage({ blob, metrics: { width, height, box, reused, downloadMs, sessionMs, inferenceMs, totalMs: performance.now() - started, outputBytes: blob.size } });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'process' });
  } finally {
    tensor?.dispose();
    if (output) for (const t of Object.values(output)) t.dispose();
    for (const c of canvases) { c.width = 0; c.height = 0; }
  }
};