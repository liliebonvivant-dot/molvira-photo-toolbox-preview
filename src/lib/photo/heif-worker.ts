import { heicTo } from 'heic-to/next';
import { conversionDimensionError } from './convert';

// Owned worker: termination also disposes the library's nested decoder worker.
self.onmessage = async (event: MessageEvent<File>) => {
  let bitmap: ImageBitmap | undefined;
  let canvas: OffscreenCanvas | undefined;
  try {
    bitmap = await heicTo({ blob: event.data, type: 'bitmap' });
    if (conversionDimensionError(bitmap.width, bitmap.height)) throw new Error('inputLimit');
    canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('heicError');
    context.drawImage(bitmap, 0, 0);
    const blob = await canvas.convertToBlob({ type: 'image/png' });
    self.postMessage({ blob });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'heicError' });
  } finally {
    bitmap?.close();
    if (canvas) { canvas.width = 0; canvas.height = 0; }
  }
};