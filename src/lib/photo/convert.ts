import { imageHeader, validDimensions, type ImageFormat } from './resize';

export type SourceFormat = ImageFormat | 'image/heic' | 'image/heif';
export type ConvertError = 'fileType' | 'fileSize' | 'decode' | 'inputLimit' | 'exportError' | 'heicError';
export const convertLimits = { fileBytes: 20 * 1024 * 1024, heicBytes: 20 * 1024 * 1024, pixels: 50_000_000, side: 12_000, compatiblePixels: 16_000_000 };
// iOS Safari caps canvas area at 16,777,216 px; low-memory devices get a conservative budget.
export function safePixelBudget(nav: { userAgent: string; platform?: string; maxTouchPoints?: number; deviceMemory?: number } = navigator): number {
  const ios = /iP(hone|ad|od)/.test(nav.userAgent) || (nav.platform === 'MacIntel' && (nav.maxTouchPoints ?? 0) > 1);
  if (ios) return convertLimits.compatiblePixels;
  const mem = nav.deviceMemory;
  if (mem !== undefined && mem <= 2) return convertLimits.compatiblePixels;
  if (mem !== undefined && mem <= 4) return 24_500_000;
  return convertLimits.pixels;
}
// Probes whether a canvas of this size really works (browsers fail silently past their limits).
export function canvasSupports(width: number, height: number): boolean {
  const canvas = document.createElement('canvas');
  try {
    canvas.width = width; canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context || canvas.width !== width || canvas.height !== height) return false;
    context.fillRect(width - 1, height - 1, 1, 1);
    return context.getImageData(width - 1, height - 1, 1, 1).data[3] === 255;
  } catch { return false; } finally { canvas.width = 0; canvas.height = 0; }
}
export function canProcessOriginal(width: number, height: number) {
  return width * height <= safePixelBudget() && canvasSupports(width, height);
}
// Proportional reduction that fits the pixel budget; only used after an explicit user choice.
export function reducedDimensions(width: number, height: number, maxPixels: number = convertLimits.compatiblePixels) {
  if (width * height <= maxPixels) return { width, height };
  const scale = Math.sqrt(maxPixels / (width * height));
  let w = Math.max(1, Math.floor(width * scale)), h = Math.max(1, Math.round(w * height / width));
  while (w * h > maxPixels) { w--; h = Math.max(1, Math.round(w * height / width)); }
  return { width: w, height: h };
}
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
export function encodeConversion(image: HTMLImageElement, format: ImageFormat, quality: number, width = image.naturalWidth, height = image.naturalHeight): Promise<Blob> {
  if (conversionDimensionError(width, height)) return Promise.reject(new Error('inputLimit'));
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext('2d');
  const release = () => { canvas.width = 0; canvas.height = 0; };
  if (!context) { release(); return Promise.reject(new Error('exportError')); }
  // JPEG's white matte is an encoding requirement, not a UI color.
  try {
    if (format === 'image/jpeg') { context.fillStyle = '#ffffff'; context.fillRect(0, 0, width, height); }
    if (width === image.naturalWidth && height === image.naturalHeight) context.drawImage(image, 0, 0);
    else { context.imageSmoothingQuality = 'high'; context.drawImage(image, 0, 0, width, height); }
  } catch { release(); return Promise.reject(new Error('exportError')); }
  return new Promise((resolve, reject) => {
    let settled = false;
    const fail = () => { if (settled) return; settled = true; clearTimeout(timer); release(); reject(new Error('exportError')); };
    const timer = setTimeout(fail, 30_000);
    try { canvas.toBlob(blob => {
      if (settled) return;
      settled = true; clearTimeout(timer); release();
      if (blob?.type === format && blob.size > 0) resolve(blob); else reject(new Error('exportError'));
    }, format, quality / 100); }
    catch { fail(); }
  });
}
// The decoder chunk and its worker exist only for an actual HEIF upload.
export function decodeHeif(file: File, signal: AbortSignal, target?: { width: number; height: number }): Promise<Blob> {
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
    worker.postMessage({ file, target });
  });
}