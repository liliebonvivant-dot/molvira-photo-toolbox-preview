import * as ort from 'ort-birefnet/wasm';
import model from '@/assets/experimental/birefnet-lite-512.onnx.asset.json';
import wasm from '@/assets/experimental/birefnet-ort.wasm.asset.json';
import { birefnetInput, birefnetMask } from './birefnet-math';
import { composeBackgroundMatte } from './background-matte';
import type { BiMetrics } from './birefnet-client';

// This entry is reachable only from the experimental worker. No IMG.LY imports.
ort.env.wasm.numThreads = 1;
ort.env.wasm.proxy = false;
ort.env.wasm.wasmPaths = { mjs: new URL('/experimental/birefnet/ort-wasm-simd-threaded.mjs', self.location.origin).href, wasm: new URL(wasm.url, self.location.origin).href };
let session: ort.InferenceSession | undefined;
const expectedHash = 'dff37bed4e94479a6a8f6b0e64d69030557bdcb79d53c9993b277f5c0cee4c93';
type HeapPerformance = Performance & { memory?: { usedJSHeapSize: number } };
self.onmessage = async (event: MessageEvent<{ id: number; file: File; target: { width: number; height: number } }>) => {
  const { id, file, target } = event.data;
  const started = performance.now();
  let bitmap: ImageBitmap | undefined, canvas: OffscreenCanvas | undefined, small: OffscreenCanvas | undefined;
  let peak: number | undefined;
  const sample = () => { const used = (performance as HeapPerformance).memory?.usedJSHeapSize; if (used !== undefined) peak = Math.max(peak ?? 0, used); };
  const sampling = setInterval(sample, 100);
  const stage = (value: string) => self.postMessage({ id, stage: value });
  try {
    if (typeof OffscreenCanvas === 'undefined' || typeof createImageBitmap === 'undefined') throw new Error('unsupported');
    const reused = !!session;
    let downloadMs = 0, sessionMs = 0;
    if (!session) {
      stage('download'); const begin = performance.now();
      const response = await fetch(model.url, { credentials: 'omit', cache: 'force-cache' });
      if (!response.ok) throw new Error('download');
      const bytes = await response.arrayBuffer(); downloadMs = performance.now() - begin;
      if (bytes.byteLength !== model.size) throw new Error('integrity');
      const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(x => x.toString(16).padStart(2, '0')).join('');
      if (hash !== expectedHash) throw new Error('integrity');
      stage('session'); const start = performance.now();
      session = await ort.InferenceSession.create(bytes, { executionProviders: ['wasm'], graphOptimizationLevel: 'all' });
      sessionMs = performance.now() - start;
    }
    stage('process');
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const rotated = (bitmap.width > bitmap.height) !== (target.width > target.height);
    const width = rotated ? target.height : target.width, height = rotated ? target.width : target.height;
    if (width * height > 2_000_000) throw new Error('limit');
    canvas = new OffscreenCanvas(width, height); const ctx = canvas.getContext('2d');
    small = new OffscreenCanvas(512, 512); const sc = small.getContext('2d');
    if (!ctx || !sc) throw new Error('unsupported');
    ctx.drawImage(bitmap, 0, 0, width, height); bitmap.close(); bitmap = undefined;
    sc.drawImage(canvas, 0, 0, 512, 512);
    const guide = sc.getImageData(0, 0, 512, 512);
    const values = birefnetInput(guide.data, 512);
    const tensor = new ort.Tensor('float32', values, [1, 3, 512, 512]);
    const inferenceStart = performance.now();
    const output = await session.run({ input_image: tensor });
    const inferenceMs = performance.now() - inferenceStart;
    const logits = output['output_image'];
    if (!logits || !(logits.data instanceof Float32Array) || logits.data.length !== 512 * 512) throw new Error('output');
    const mask = birefnetMask(logits.data);
    const pixels = ctx.getImageData(0, 0, width, height);
    composeBackgroundMatte(pixels.data, width, height, guide.data, mask, 512, 512);
    ctx.putImageData(pixels, 0, 0);
    stage('encode'); const blob = await canvas.convertToBlob({ type: 'image/png' });
    sample();
    const metrics: BiMetrics = { modelBytes: model.size, downloadMs, sessionMs, inferenceMs, totalMs: performance.now() - started, reused, heapPeak: peak, tensorBytes: values.byteLength + logits.data.byteLength, width, height };
    tensor.dispose(); for (const value of Object.values(output)) value.dispose();
    self.postMessage({ id, result: { blob, metrics } });
  } catch (error) { self.postMessage({ id, error: error instanceof Error ? error.message : 'process' }); }
  finally { clearInterval(sampling); bitmap?.close(); if (canvas) { canvas.width = 0; canvas.height = 0; } if (small) { small.width = 0; small.height = 0; } }
};