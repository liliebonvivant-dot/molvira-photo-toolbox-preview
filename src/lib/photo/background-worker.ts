import { removeBackground } from '@imgly/background-removal';
import type { BackgroundSize } from './background';

// This module is imported only by an owned worker, never by SSR or other processors.
self.onmessage = async (event: MessageEvent<{ file: File; target?: BackgroundSize }>) => {
  let bitmap: ImageBitmap | undefined;
  let source: OffscreenCanvas | undefined;
  let small: OffscreenCanvas | undefined;
  try {
    if (typeof OffscreenCanvas === 'undefined' || typeof createImageBitmap === 'undefined') throw new Error('unsupported');
    bitmap = await createImageBitmap(event.data.file, { imageOrientation: 'from-image' });
    const natural = { width: bitmap.width, height: bitmap.height };
    const t = event.data.target;
    const size = t && ((natural.width > natural.height) !== (t.width > t.height)) ? { width: t.height, height: t.width } : t ?? natural;
    if (size.width * size.height > 4_000_000) throw new Error('processError');
    source = new OffscreenCanvas(size.width, size.height);
    const ctx = source.getContext('2d');
    if (!ctx) throw new Error('unsupported');
    ctx.drawImage(bitmap, 0, 0, size.width, size.height); bitmap.close(); bitmap = undefined;
    const scale = Math.min(1, 1024 / size.width, 1024 / size.height);
    const w = Math.max(1, Math.round(size.width * scale)), h = Math.max(1, Math.round(size.height * scale));
    small = new OffscreenCanvas(w, h);
    const sc = small.getContext('2d');
    if (!sc) throw new Error('unsupported');
    sc.drawImage(source, 0, 0, w, h);
    const raw = sc.getImageData(0, 0, w, h);
    self.postMessage({ progress: { stage: 'process' } });
    const segmented = await removeBackground(new Blob([raw.data], { type: `image/x-rgba8;width=${w};height=${h}` }), {
      model: 'isnet_quint8', device: 'cpu', proxyToWorker: false,
      output: { format: 'image/x-rgba8' },
      fetchArgs: { credentials: 'omit', cache: 'force-cache' },
      progress: (key, current, total) => self.postMessage({ progress: key.startsWith('fetch:') ? { stage: 'download', percent: total > 0 ? Math.round(current / total * 100) : undefined } : { stage: 'process' } }),
    });
    const rgba = new Uint8ClampedArray(await segmented.arrayBuffer());
    if (rgba.length !== w * h * 4) throw new Error('processError');
    for (let i = 0; i < rgba.length; i += 4) { rgba[i] = 255; rgba[i + 1] = 255; rgba[i + 2] = 255; }
    sc.putImageData(new ImageData(rgba, w, h), 0, 0);
    // destination-in multiplies the model mask by the original alpha channel.
    ctx.globalCompositeOperation = 'destination-in';
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(small, 0, 0, size.width, size.height);
    const blob = await source.convertToBlob({ type: 'image/png' });
    self.postMessage({ blob, width: size.width, height: size.height });
  } catch (error) { self.postMessage({ error: error instanceof Error && error.message === 'unsupported' ? 'unsupported' : 'processError' }); }
  finally { bitmap?.close(); if (source) { source.width = 0; source.height = 0; } if (small) { small.width = 0; small.height = 0; } }
};