import { canProcessOriginal, convertLimits, reducedDimensions, safePixelBudget } from './convert';
export type Size = { width: number; height: number };
export type Decoded = { image: HTMLImageElement; url: string; width: number; height: number; originalWidth: number; originalHeight: number; reduced: boolean };
export type ReduceOffer = { file: File; width: number; height: number; reduced: Size };
export function reduceOffer(file: File, width: number, height: number): ReduceOffer {
  const budget = Math.min(safePixelBudget(), width * height - 1);
  return { file, width, height, reduced: reducedDimensions(width, height, Math.max(1, Math.min(budget, convertLimits.pixels))) };
}
// Retry target after a full-resolution failure: the conservative canvas-safe size.
export function fallbackOffer(file: File, width: number, height: number): ReduceOffer | undefined {
  return width * height > convertLimits.compatiblePixels ? { file, width, height, reduced: reducedDimensions(width, height) } : undefined;
}
async function decode(url: string) { const image = new window.Image(); image.src = url; await image.decode(); return image; }
// Decide from header dimensions before decoding; reduce only when the user passed an explicit target.
export async function decodeLocal(file: File, header: Size, target?: Size): Promise<Decoded | ReduceOffer> {
  if (!target && !canProcessOriginal(header.width, header.height)) return reduceOffer(file, header.width, header.height);
  const url = URL.createObjectURL(file);
  let image: HTMLImageElement;
  try { image = await decode(url); } catch (e) { URL.revokeObjectURL(url); throw e; }
  const width = image.naturalWidth, height = image.naturalHeight;
  if (!width || !height) { URL.revokeObjectURL(url); throw new Error('decode'); }
  if (!target) return { image, url, width, height, originalWidth: width, originalHeight: height, reduced: false };
  // Orientation may swap axes relative to the encoded header.
  const t = (width > height) === (target.width > target.height) ? target : { width: target.height, height: target.width };
  const canvas = document.createElement('canvas');
  try {
    canvas.width = t.width; canvas.height = t.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('exportError');
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, 0, 0, t.width, t.height);
    image.src = ''; URL.revokeObjectURL(url);
    // PNG keeps transparency and adds no lossy step before editing.
    const blob = await new Promise<Blob>((res, rej) => canvas.toBlob(b => b ? res(b) : rej(new Error('exportError')), 'image/png'));
    const reducedUrl = URL.createObjectURL(blob);
    try { const reducedImage = await decode(reducedUrl); return { image: reducedImage, url: reducedUrl, width: t.width, height: t.height, originalWidth: width, originalHeight: height, reduced: true }; }
    catch (e) { URL.revokeObjectURL(reducedUrl); throw e; }
  } catch (e) { URL.revokeObjectURL(url); throw e; } finally { canvas.width = 0; canvas.height = 0; }
}
