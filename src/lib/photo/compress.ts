import type { ImageFormat } from './resize';
import { encodeConversion, conversionName, safePixelBudget, reducedDimensions, convertLimits } from './convert';
import type { ReduceOffer } from './large-image';

// Within the estimated device budget, try the real encoder instead of treating
// a failed temporary canvas probe as proof that the image needs resizing.
export function compressionReduceOffer(file: File, width: number, height: number, failed = false): ReduceOffer | undefined {
  const pixels = width * height, budget = safePixelBudget();
  if (!failed && pixels <= budget) return;
  const targetBudget = failed ? Math.min(budget, convertLimits.compatiblePixels, Math.floor(pixels * 0.75)) : budget;
  return { file, width, height, reduced: reducedDimensions(width, height, Math.max(1, targetBudget)) };
}

export const compressionLevels = { high: 90, balanced: 75, small: 50 } as const;
export function compressionStats(original: number, final: number) {
  if (original <= 0 || final <= 0) throw new Error('exportError');
  const saved = original - final;
  return { saved, percent: (1 - final / original) * 100, smaller: saved > 0, significant: saved / original >= 0.01 };
}
export function compressionName(name: string, format: ImageFormat) {
  return conversionName(name, format).replace(/-converted\./, '-compressed.');
}
// Remove only descriptive PNG metadata. Keep image data, color, transparency,
// EXIF orientation and unknown chunks byte-for-byte; no quantization/re-encoding.
export async function optimizePng(file: File): Promise<Blob> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(bytes.buffer);
  const parts: BlobPart[] = [bytes.slice(0, 8)];
  let offset = 8, ended = false;
  while (offset + 12 <= bytes.length) {
    const size = view.getUint32(offset), end = offset + size + 12;
    if (end > bytes.length) throw new Error('decode');
    const type = String.fromCharCode(...bytes.slice(offset + 4, offset + 8));
    if (!['tEXt', 'zTXt', 'iTXt', 'tIME'].includes(type)) parts.push(bytes.slice(offset, end));
    offset = end;
    if (type === 'IEND') { ended = true; break; }
  }
  if (!ended || offset !== bytes.length) throw new Error('decode');
  return new Blob(parts, { type: 'image/png' });
}
export function compressImage(source: { file: File; image: HTMLImageElement; format: string; reduced: boolean; width: number; height: number }, format: ImageFormat, quality: number) {
  if (source.format === 'image/png' && format === 'image/png' && !source.reduced) return optimizePng(source.file);
  return encodeConversion(source.image, format, quality, source.width, source.height);
}