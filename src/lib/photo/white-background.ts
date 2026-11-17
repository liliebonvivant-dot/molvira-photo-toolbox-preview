import { canvasBlob } from './canvas-blob';
import { imageHeader, resizeLimits, validDimensions, type ImageFormat } from './resize';
import { decodeLocal, type Decoded, type Size } from './large-image';

export function alphaChannel(bytes: Uint8Array): boolean {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tag = (offset: number) => String.fromCharCode(...bytes.subarray(offset, offset + 4));
  if (bytes[0] === 137 && bytes.length >= 26) {
    if (bytes[25] === 4 || bytes[25] === 6) return true;
    for (let offset = 8; offset + 12 <= bytes.length;) {
      const size = view.getUint32(offset);
      if (size > bytes.length - offset - 12) break;
      if (tag(offset + 4) === 'tRNS') return true;
      offset += size + 12;
    }
  }
  if (tag(0) === 'RIFF' && tag(8) === 'WEBP') {
    for (let offset = 12; offset + 8 <= bytes.length;) {
      const size = view.getUint32(offset + 4, true), data = offset + 8;
      if (size > bytes.length - data) break;
      const chunk = tag(offset);
      if (chunk === 'ALPH' || (chunk === 'VP8X' && size >= 1 && ((bytes[data] ?? 0) & 16) !== 0) ||
        (chunk === 'VP8L' && size >= 5 && (view.getUint32(data + 1, true) & 0x10000000) !== 0)) return true;
      offset = data + size + (size % 2);
    }
  }
  return false;
}

/** Straight-alpha compositing, without mask alteration, resizing or recoloring opaque pixels. */
export function flattenWhite(pixels: Uint8ClampedArray): boolean {
  let transparent = false;
  for (let i = 0; i + 3 < pixels.length; i += 4) {
    const alpha = pixels[i + 3];
    if (alpha === undefined) continue;
    if (alpha === 255) continue;
    transparent = true;
    for (let channel = 0; channel < 3; channel++) {
      pixels[i + channel] = Math.round(((pixels[i + channel] ?? 0) * alpha + 255 * (255 - alpha)) / 255);
    }
    pixels[i + 3] = 255;
  }
  return transparent;
}

export async function inspectWhiteImage(file: File) {
  if (file.size > resizeLimits.fileBytes) throw new Error('fileSize');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const header = imageHeader(bytes);
  if (!header) throw new Error('fileType');
  if (header.format !== 'image/png' && header.format !== 'image/webp') throw new Error('fileType');
  if (!validDimensions(header.width, header.height)) throw new Error('decode');
  if (header.width > resizeLimits.side || header.height > resizeLimits.side || header.width * header.height > resizeLimits.pixels) throw new Error('inputLimit');
  return { ...header, channel: alphaChannel(bytes) };
}

export type WhiteSource = Decoded & { file: File; channel: boolean };
export async function loadWhiteSource(file: File, header: Awaited<ReturnType<typeof inspectWhiteImage>>, target?: Size) {
  const decoded = await decodeLocal(file, header, target);
  return 'image' in decoded ? { ...decoded, file, channel: header.channel } : decoded;
}
export function releaseWhiteSource(source?: WhiteSource) {
  if (!source) return;
  source.image.src = ''; URL.revokeObjectURL(source.url);
}

export async function encodeWhite(image: HTMLImageElement, format: ImageFormat, quality: number, signal?: AbortSignal) {
  if (signal?.aborted) throw new Error('cancelled');
  const width = image.naturalWidth, height = image.naturalHeight;
  if (!width || !height) throw new Error('decode');
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  let transparent = false;
  try {
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('exportError');
    context.drawImage(image, 0, 0);
    // Bound extra pixel memory to roughly 4 MiB at the chosen working resolution.
    const rows = Math.max(1, Math.floor(1_048_576 / width));
    for (let y = 0; y < height; y += rows) {
      if (signal?.aborted) throw new Error('cancelled');
      const pixels = context.getImageData(0, y, width, Math.min(rows, height - y));
      transparent = flattenWhite(pixels.data) || transparent;
      context.putImageData(pixels, 0, y);
      await new Promise<void>(resolve => setTimeout(resolve, 0));
    }
    if (signal?.aborted) throw new Error('cancelled');
    const blob = await canvasBlob(canvas, format, quality);
    return { blob, transparent, width, height };
  } catch {
    throw new Error('exportError');
  } finally { canvas.width = 0; canvas.height = 0; }
}

export function whiteFilename(name: string, format: ImageFormat) {
  return `${name.replace(/\.[^.]+$/, '') || 'image'}-white.${format === 'image/jpeg' ? 'jpg' : format === 'image/png' ? 'png' : 'webp'}`;
}