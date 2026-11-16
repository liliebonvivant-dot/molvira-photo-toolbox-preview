import { imageHeader, validDimensions, type ImageFormat } from './resize';

export type SourceFormat = ImageFormat | 'image/heic' | 'image/heif';
export type ConvertError = 'fileType' | 'fileSize' | 'decode' | 'inputLimit' | 'exportError' | 'heicError';
export const convertLimits = { fileBytes: 20 * 1024 * 1024, heicBytes: 10 * 1024 * 1024, pixels: 16_000_000, side: 8192 };
export function conversionDimensionError(width: number, height: number) {
  return !validDimensions(width, height) || width > convertLimits.side || height > convertLimits.side || width * height > convertLimits.pixels;
}
export function formatLabel(format: SourceFormat) {
  return ({ 'image/jpeg': 'JPG', 'image/png': 'PNG', 'image/webp': 'WebP', 'image/heic': 'HEIC', 'image/heif': 'HEIF' })[format];
}
export function conversionName(name: string, format: ImageFormat) {
  const base = (name.replace(/\.[^.]+$/, '') || 'image').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_');
  return `${base}-converted.${format === 'image/jpeg' ? 'jpg' : format === 'image/png' ? 'png' : 'webp'}`;
}
// ISO BMFF brands, not the extension or caller-supplied MIME, identify HEIF.
export function heifHeader(bytes: Uint8Array): { format: 'image/heic' | 'image/heif'; width: number; height: number } | undefined {
  if (bytes.length < 24) return;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const text = (start: number) => String.fromCharCode(...bytes.slice(start, start + 4));
  const size = view.getUint32(0);
  if (text(4) !== 'ftyp' || size < 16 || size > bytes.length || size % 4 !== 0) return;
  const brands = [text(8)];
  for (let offset = 16; offset < size; offset += 4) brands.push(text(offset));
  if (brands.some(b => b === 'avif' || b === 'avis')) return;
  const heic = brands.some(b => ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis'].includes(b));
  if (!heic && !brands.some(b => ['mif1', 'msf1'].includes(b))) return;
  let width = 0, height = 0;
  function boxes(start: number, end: number, depth: number) {
    if (depth > 8) return;
    for (let offset = start; offset + 8 <= end;) {
      const length = view.getUint32(offset), type = text(offset + 4);
      if (length < 8 || offset + length > end) break;
      if (type === 'ispe' && length >= 20) {
        width = Math.max(width, view.getUint32(offset + 12));
        height = Math.max(height, view.getUint32(offset + 16));
      } else if (['meta', 'iprp', 'ipco'].includes(type)) boxes(offset + (type === 'meta' ? 12 : 8), offset + length, depth + 1);
      offset += length;
    }
  }
  boxes(0, bytes.length, 0);
  return { format: heic ? 'image/heic' : 'image/heif', width, height };
}
export async function inspectConversion(file: File) {
  if (file.size > convertLimits.fileBytes) throw new Error('fileSize');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const header = imageHeader(bytes) ?? heifHeader(bytes);
  if (!header) throw new Error('fileType');
  const heif = header.format === 'image/heic' || header.format === 'image/heif';
  if (heif && file.size > convertLimits.heicBytes) throw new Error('fileSize');
  if (heif && (!header.width || !header.height)) throw new Error('heicError');
  if (conversionDimensionError(header.width, header.height)) throw new Error('inputLimit');
  return header;
}
export function encodeConversion(image: HTMLImageElement, format: ImageFormat, quality: number): Promise<Blob> {
  const width = image.naturalWidth, height = image.naturalHeight;
  if (conversionDimensionError(width, height)) return Promise.reject(new Error('inputLimit'));
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext('2d');
  const release = () => { canvas.width = 0; canvas.height = 0; };
  if (!context) { release(); return Promise.reject(new Error('exportError')); }
  // JPEG's white matte is an encoding requirement, not a UI color.
  if (format === 'image/jpeg') { context.fillStyle = '#ffffff'; context.fillRect(0, 0, width, height); }
  context.drawImage(image, 0, 0);
  return new Promise((resolve, reject) => {
    try { canvas.toBlob(blob => { release(); if (blob?.type === format) resolve(blob); else reject(new Error('exportError')); }, format, quality / 100); }
    catch { release(); reject(new Error('exportError')); }
  });
}
// The decoder chunk and its worker exist only for an actual HEIF upload.
export function decodeHeif(file: File, signal: AbortSignal): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new Error('heicError')); return; }
    const worker = new Worker(new URL('./heif-worker.ts', import.meta.url), { type: 'module' });
    const cleanup = () => { clearTimeout(timer); signal.removeEventListener('abort', abort); worker.terminate(); };
    const fail = () => { cleanup(); reject(new Error('heicError')); };
    const abort = () => fail();
    const timer = setTimeout(fail, 45_000);
    signal.addEventListener('abort', abort, { once: true });
    worker.onerror = fail;
    worker.onmessage = (event: MessageEvent<{ blob?: Blob; error?: string }>) => {
      cleanup();
      if (event.data.blob) resolve(event.data.blob);
      else reject(new Error(event.data.error === 'inputLimit' ? 'inputLimit' : 'heicError'));
    };
    worker.postMessage(file);
  });
}