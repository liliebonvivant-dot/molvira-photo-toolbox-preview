import { canvasBlob } from './canvas-blob';
import { collageOutputError, collageOutputReduction, loadCollageSource, releaseCollageSource, sourceAllowance, type CollageSource } from './collage';
import type { Size } from './large-image';
import type { ImageFormat } from './resize';

export const instagramPresets = { square: { width: 1080, height: 1080 }, portrait: { width: 1080, height: 1350 }, landscape: { width: 1080, height: 566 }, story: { width: 1080, height: 1920 }, reel: { width: 1080, height: 1920 } } as const;
export type InstagramPreset = keyof typeof instagramPresets | 'custom';
export type InstagramState = Size & { preset: InstagramPreset; fit: 'cover' | 'contain'; zoom: number; x: number; y: number; rotation: number; color: string; transparent: boolean };
export type InstagramHistory = { past: InstagramState[]; present: InstagramState; future: InstagramState[] };
export type InstagramSource = CollageSource;
export const initialInstagram = (): InstagramState => ({ ...instagramPresets.square, preset: 'square', fit: 'cover', zoom: 1, x: 0, y: 0, rotation: 0, color: '#ffffff', transparent: false });
export const clampInstagram = (v: number, min: number, max: number) => Math.max(min, Math.min(max, Number.isFinite(v) ? v : min));
export function commitInstagram(h: InstagramHistory, next: InstagramState): InstagramHistory { return JSON.stringify(h.present) === JSON.stringify(next) ? h : { past: [...h.past, h.present].slice(-30), present: next, future: [] }; }
export function undoInstagram(h: InstagramHistory): InstagramHistory { const next = h.past.at(-1); return next ? { past: h.past.slice(0, -1), present: next, future: [h.present, ...h.future] } : h; }
export function redoInstagram(h: InstagramHistory): InstagramHistory { const next = h.future[0]; return next ? { past: [...h.past, h.present].slice(-30), present: next, future: h.future.slice(1) } : h; }
export function instagramPlacement(source: Size, state: InstagramState) {
  const rotation = ((state.rotation % 360) + 360) % 360;
  const sideways = rotation === 90 || rotation === 270;
  const w = sideways ? source.height : source.width, h = sideways ? source.width : source.height;
  const scale = (state.fit === 'cover' ? Math.max : Math.min)(state.width / w, state.height / h) * clampInstagram(state.zoom, .1, 4);
  return { width: source.width * scale, height: source.height * scale, centerX: state.width * (.5 + clampInstagram(state.x, -100, 100) / 100), centerY: state.height * (.5 + clampInstagram(state.y, -100, 100) / 100), rotation: rotation * Math.PI / 180 };
}
// Shared output-coordinate renderer: the preview scales this same composition, never the source.
export function drawInstagram(ctx: CanvasRenderingContext2D, source: InstagramSource, state: InstagramState, format: ImageFormat) {
  ctx.clearRect(0, 0, state.width, state.height);
  if (!state.transparent || format === 'image/jpeg') { ctx.fillStyle = /^#[0-9a-f]{6}$/i.test(state.color) ? state.color : '#ffffff'; ctx.fillRect(0, 0, state.width, state.height); }
  const p = instagramPlacement(source, state);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.save();
  try { ctx.translate(p.centerX, p.centerY); ctx.rotate(p.rotation); ctx.drawImage(source.image, -p.width / 2, -p.height / 2, p.width, p.height); }
  finally { ctx.restore(); }
}
export const instagramOutputError = (size: Size, source?: Size) => collageOutputError(size, source ? source.width * source.height : 0);
export const instagramOutputReduction = (size: Size, source?: Size, failed = false) => collageOutputReduction(size, source ? source.width * source.height : 0, failed);
export const loadInstagramSource = (file: File, output: Size, target?: Size) => loadCollageSource(file, sourceAllowance(0, output), target);
export const releaseInstagramSource = releaseCollageSource;
export async function encodeInstagram(source: InstagramSource, state: InstagramState, format: ImageFormat, quality: number) {
  const error = instagramOutputError(state, source); if (error) throw new Error(error);
  const canvas = document.createElement('canvas');
  try { canvas.width = state.width; canvas.height = state.height; const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('exportError'); drawInstagram(ctx, source, state, format); return await canvasBlob(canvas, format, quality); }
  finally { canvas.width = 0; canvas.height = 0; }
}
export const instagramFilename = (format: ImageFormat) => `molvira-instagram.${format === 'image/jpeg' ? 'jpg' : format === 'image/png' ? 'png' : 'webp'}`;