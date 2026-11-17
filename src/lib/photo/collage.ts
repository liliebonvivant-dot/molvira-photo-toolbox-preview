import { canvasBlob } from './canvas-blob';
import { reducedDimensions, safePixelBudget } from './convert';
import { dimensionError, inspectImage, type ImageFormat } from './resize';
import type { ReduceOffer, Size } from './large-image';

export const collageLimits = { photos: 12, history: 30 };
export const collageLayouts = ['grid', 'horizontal', 'vertical', 'left', 'top'] as const;
export type CollageLayout = typeof collageLayouts[number];
export type CollagePhoto = { id: string; fit: 'cover' | 'contain'; zoom: number; x: number; y: number };
export type CollageState = { photos: CollagePhoto[]; width: number; height: number; layout: CollageLayout; gap: number; radius: number; color: string; transparent: boolean };
export type CollageHistory = { past: CollageState[]; present: CollageState; future: CollageState[] };
export type Cell = { x: number; y: number; width: number; height: number };
export type CollageSource = { file: File; image: HTMLImageElement; url: string; width: number; height: number; originalWidth: number; originalHeight: number; reduced: boolean };
export const clampCollage = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Number.isFinite(v) ? v : lo));
export const initialCollage = (): CollageState => ({ photos: [], width: 1080, height: 1080, layout: 'grid', gap: 0, radius: 0, color: '#ffffff', transparent: false });
export const newCollagePhoto = (id: string): CollagePhoto => ({ id, fit: 'cover', zoom: 1, x: 50, y: 50 });
export function commitCollage(h: CollageHistory, state: CollageState): CollageHistory {
  if (JSON.stringify(h.present) === JSON.stringify(state)) return h;
  return { past: [...h.past, h.present].slice(-collageLimits.history), present: state, future: [] };
}
export function undoCollage(h: CollageHistory): CollageHistory { const prev = h.past.at(-1); return prev ? { past: h.past.slice(0, -1), present: prev, future: [h.present, ...h.future] } : h; }
export function redoCollage(h: CollageHistory): CollageHistory { const next = h.future[0]; return next ? { past: [...h.past, h.present].slice(-collageLimits.history), present: next, future: h.future.slice(1) } : h; }
export function moveCollagePhoto(photos: CollagePhoto[], id: string, direction: number) {
  const from = photos.findIndex(p => p.id === id), to = from + direction;
  if (from < 0 || to < 0 || to >= photos.length) return photos;
  const next = [...photos], photo = next.splice(from, 1)[0]; if (!photo) return photos; next.splice(to, 0, photo); return next;
}
function gridCells(count: number, box: Cell, columns: number): Cell[] {
  const rows = Math.ceil(count / columns), cells: Cell[] = [];
  for (let row = 0; row < rows; row++) {
    const n = Math.min(columns, count - row * columns);
    for (let col = 0; col < n; col++) cells.push({ x: box.x + col * box.width / n, y: box.y + row * box.height / rows, width: box.width / n, height: box.height / rows });
  }
  return cells;
}
export function collageCells(count: number, s: CollageState): Cell[] {
  if (!count) return [];
  const box = { x: 0, y: 0, width: s.width, height: s.height };
  let cells: Cell[];
  if ((s.layout === 'left' || s.layout === 'top') && count > 1) {
    const left = s.layout === 'left';
    const hero = { ...box, width: left ? s.width / 2 : s.width, height: left ? s.height : s.height / 2 };
    const rest = { x: left ? s.width / 2 : 0, y: left ? 0 : s.height / 2, width: left ? s.width / 2 : s.width, height: left ? s.height : s.height / 2 };
    cells = [hero, ...gridCells(count - 1, rest, left ? (count <= 4 ? 1 : 2) : Math.min(3, count - 1))];
  } else cells = gridCells(count, box, s.layout === 'horizontal' ? count : s.layout === 'vertical' ? 1 : Math.ceil(Math.sqrt(count)));
  const gap = clampCollage(s.gap, 0, Math.min(...cells.map(c => Math.min(c.width, c.height))) / 2);
  return cells.map(c => ({ x: c.x + gap / 2, y: c.y + gap / 2, width: c.width - gap, height: c.height - gap }));
}
export function photoPlacement(source: Size, cell: Cell, photo: CollagePhoto): Cell {
  const fit = photo.fit === 'cover' ? Math.max : Math.min;
  const scale = fit(cell.width / source.width, cell.height / source.height) * clampCollage(photo.zoom, 1, 4);
  const width = source.width * scale, height = source.height * scale;
  return { x: cell.x + (cell.width - width) * clampCollage(photo.x, 0, 100) / 100, y: cell.y + (cell.height - height) * clampCollage(photo.y, 0, 100) / 100, width, height };
}
// Both preview and export use output-pixel coordinates, including clipping and rounded corners.
export function drawCollage(ctx: CanvasRenderingContext2D, state: CollageState, sources: ReadonlyMap<string, CollageSource>, format: ImageFormat) {
  ctx.clearRect(0, 0, state.width, state.height);
  if (!state.transparent || format === 'image/jpeg') { ctx.fillStyle = /^#[0-9a-f]{6}$/i.test(state.color) ? state.color : '#ffffff'; ctx.fillRect(0, 0, state.width, state.height); }
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  const cells = collageCells(state.photos.length, state);
  state.photos.forEach((photo, i) => {
    const source = sources.get(photo.id), cell = cells[i]; if (!source || !cell) return;
    const dest = photoPlacement(source, cell, photo);
    ctx.save();
    try { ctx.beginPath(); ctx.roundRect(cell.x, cell.y, cell.width, cell.height, clampCollage(state.radius, 0, Math.min(cell.width, cell.height) / 2)); ctx.clip(); ctx.drawImage(source.image, dest.x, dest.y, dest.width, dest.height); }
    finally { ctx.restore(); }
  });
  return cells;
}
export function collageOutputError(state: Size, heldPixels: number, budget = safePixelBudget()) {
  return dimensionError(state.width, state.height) ?? (state.width * state.height + heldPixels > budget ? 'memory' : undefined);
}
export function collageOutputReduction(state: Size, heldPixels: number, failed = false): Size | undefined {
  const budget = Math.min(safePixelBudget() - heldPixels, failed ? Math.floor(state.width * state.height / 2) : state.width * state.height - 1);
  return budget >= 1 && state.width * state.height > 1 ? reducedDimensions(state.width, state.height, budget) : undefined;
}
export function sourceAllowance(heldPixels: number, output: Size, budget = safePixelBudget()) { return Math.max(0, budget - heldPixels - output.width * output.height); }
export async function loadCollageSource(file: File, allowance: number, target?: Size): Promise<CollageSource | ReduceOffer> {
  const header = await inspectImage(file);
  if (allowance < 1 || (target && target.width * target.height > allowance)) throw new Error('memory');
  if (!target && header.width * header.height > allowance) return { file, ...header, reduced: reducedDimensions(header.width, header.height, allowance) };
  let url = URL.createObjectURL(file), image = new Image();
  const decode = async () => { let timer: ReturnType<typeof setTimeout> | undefined; try { await Promise.race([image.decode(), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('decode')), 30_000); })]); } finally { clearTimeout(timer); } };
  try {
    image.src = url; await decode();
    const originalWidth = image.naturalWidth, originalHeight = image.naturalHeight;
    if (dimensionError(originalWidth, originalHeight)) throw new Error('inputLimit');
    const size = target ? ((originalWidth > originalHeight) === (target.width > target.height) ? target : { width: target.height, height: target.width }) : { width: originalWidth, height: originalHeight };
    if (size.width * size.height > allowance) throw new Error('memory');
    if (target) {
      const canvas = document.createElement('canvas');
      try { canvas.width = size.width; canvas.height = size.height; const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('decode'); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(image, 0, 0, size.width, size.height); const blob = await canvasBlob(canvas, 'image/png', 100); image.src = ''; URL.revokeObjectURL(url); url = URL.createObjectURL(blob); image = new Image(); image.src = url; await decode(); }
      finally { canvas.width = 0; canvas.height = 0; }
    }
    return { file, image, url, ...size, originalWidth, originalHeight, reduced: !!target };
  } catch (e) { image.src = ''; URL.revokeObjectURL(url); throw e; }
}
export function releaseCollageSource(s: CollageSource) { s.image.src = ''; URL.revokeObjectURL(s.url); }
export async function encodeCollage(state: CollageState, sources: ReadonlyMap<string, CollageSource>, format: ImageFormat, quality: number) {
  if (state.photos.length < 2 || state.photos.length > collageLimits.photos || state.photos.some(p => !sources.has(p.id))) throw new Error('photos');
  const held = [...sources.values()].reduce((sum, s) => sum + s.width * s.height, 0);
  const error = collageOutputError(state, held); if (error) throw new Error(error);
  const canvas = document.createElement('canvas');
  try { canvas.width = state.width; canvas.height = state.height; const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('exportError'); drawCollage(ctx, state, sources, format); return await canvasBlob(canvas, format, quality); }
  finally { canvas.width = 0; canvas.height = 0; }
}
export const collageFilename = (format: ImageFormat) => `molvira-collage.${format === 'image/jpeg' ? 'jpg' : format === 'image/png' ? 'png' : 'webp'}`;
