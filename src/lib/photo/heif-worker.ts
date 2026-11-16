import { heicTo } from 'heic-to/next';
import { conversionDimensionError } from './convert';

// Owned worker: termination also disposes the library's nested decoder worker.
self.onmessage = async (event: MessageEvent<{ file: File; target?: { width: number; height: number } }>) => {
  let bitmap: ImageBitmap | undefined;
  let canvas: OffscreenCanvas | undefined;
  try {
    bitmap = await heicTo({ blob: event.data.file, type: 'bitmap' });
    if (conversionDimensionError(bitmap.width, bitmap.height)) throw new Error('inputLimit');
    // A user-chosen reduced target keeps the output canvas within the device's limits.
    const { width, height } = event.data.target ?? { width: bitmap.width, height: bitmap.height };
    canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('heicError');
    context.imageSmoothingQuality = 'high';
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await canvas.convertToBlob({ type: 'image/png' });
    self.postMessage({ blob });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'heicError' });
  } finally {
    bitmap?.close();
    if (canvas) { canvas.width = 0; canvas.height = 0; }
  }
};