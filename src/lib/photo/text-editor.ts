import { canvasBlob } from './canvas-blob';
import { displayPrice } from './currency';
import { conversionDimensionError } from './convert';
import type { ImageFormat } from './resize';

export const editorFonts = ['Arial', 'Georgia', 'Courier New'] as const;
export const currencies = ['R$', '$', '€', '£'] as const;
export const editorLimits = { history: 30, elements: 50, logoPixels: 16_000_000 };
export type EditorLayer = {
  id: string; kind: 'text' | 'price' | 'logo'; text: string; currency: typeof currencies[number];
  font: string; bold: boolean; italic: boolean; color: string; opacity: number;
  size: number; x: number; y: number; tag: boolean; tagColor: string; asset?: string | undefined;
};
export type EditorHistory = { past: EditorLayer[][]; present: EditorLayer[]; future: EditorLayer[][] };
export type LogoImages = ReadonlyMap<string, HTMLImageElement>;
export type LayerRect = { x: number; y: number; width: number; height: number; fontSize: number; pad: number; lines: string[] };
export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, Number.isFinite(n) ? n : min));
export function newLayer(id: string, kind: EditorLayer['kind'], asset?: string): EditorLayer {
  return { id, kind, text: '', currency: '$', font: 'Arial', bold: false, italic: false, color: '#ffffff',
    opacity: 100, size: kind === 'logo' ? 20 : 6, x: 10, y: 10, tag: false, tagColor: '#202020', asset };
}
export function commitLayers(history: EditorHistory, layers: EditorLayer[]): EditorHistory {
  if (JSON.stringify(layers) === JSON.stringify(history.present)) return history;
  return { past: [...history.past, history.present].slice(-editorLimits.history), present: layers, future: [] };
}
export function undoLayers(h: EditorHistory): EditorHistory {
  const last = h.past.at(-1); return last ? { past: h.past.slice(0, -1), present: last, future: [h.present, ...h.future] } : h;
}
export function redoLayers(h: EditorHistory): EditorHistory {
  const next = h.future[0]; return next ? { past: [...h.past, h.present].slice(-editorLimits.history), present: next, future: h.future.slice(1) } : h;
}
export function reorderLayer(layers: EditorLayer[], id: string, direction: 'front' | 'back') {
  const layer = layers.find(l => l.id === id); if (!layer) return layers;
  const rest = layers.filter(l => l.id !== id); return direction === 'front' ? [...rest, layer] : [layer, ...rest];
}
export function duplicateLayer(layers: EditorLayer[], id: string, nextId: string) {
  const layer = layers.find(l => l.id === id); if (!layer || layers.length >= editorLimits.elements) return layers;
  const index = layers.indexOf(layer);
  return [...layers.slice(0, index + 1), { ...layer, id: nextId, x: clamp(layer.x + 3, 0, 95), y: clamp(layer.y + 3, 0, 95) }, ...layers.slice(index + 1)];
}
export function layerText(layer: EditorLayer) { return layer.kind === 'price' ? displayPrice(layer.text, layer.currency) : layer.text; }
function font(layer: EditorLayer, size: number) {
  return `${layer.italic ? 'italic ' : ''}${layer.bold ? 'bold ' : ''}${size}px "${editorFonts.find(f => f === layer.font) ?? 'Arial'}"`;
}
export function layerRect(ctx: Pick<CanvasRenderingContext2D, 'font' | 'measureText'>, width: number, height: number, layer: EditorLayer, logos: LogoImages): LayerRect {
  let fs = width * clamp(layer.size, .5, 100) / 100;
  ctx.font = font(layer, fs);
  const lines = layerText(layer).slice(0, 500).split('\n');
  const logo = layer.asset ? logos.get(layer.asset) : undefined;
  let pad = layer.kind === 'price' && layer.tag ? fs * .25 : 0;
  let w = layer.kind === 'logo' ? fs : Math.max(fs * .5, ...lines.map(line => ctx.measureText(line).width)) + pad * 2;
  let h = layer.kind === 'logo' ? fs * (logo ? logo.naturalHeight / logo.naturalWidth : 1) : fs * 1.25 * lines.length + pad * 2;
  const scale = Math.min(1, width * .96 / w, height * .96 / h);
  w *= scale; h *= scale; fs *= scale; pad *= scale;
  return { x: clamp(layer.x / 100 * width, 0, width - w), y: clamp(layer.y / 100 * height, 0, height - h), width: w, height: h, fontSize: fs, pad, lines };
}
export function hitLayer(rects: { id: string; rect: LayerRect }[], x: number, y: number) {
  return [...rects].reverse().find(({ rect: r }) => x >= r.x && y >= r.y && x <= r.x + r.width && y <= r.y + r.height)?.id;
}
// Both views draw in source-pixel coordinates; only the preview context is scaled.
export function drawEditor(ctx: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number, layers: EditorLayer[], logos: LogoImages, format: ImageFormat) {
  ctx.clearRect(0, 0, width, height);
  if (format === 'image/jpeg') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, width, height); }
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(image, 0, 0, width, height);
  return layers.map(layer => {
    const rect = layerRect(ctx, width, height, layer, logos);
    ctx.save();
    try {
      ctx.globalAlpha = clamp(layer.opacity, 0, 100) / 100;
      if (layer.kind === 'logo') { const logo = layer.asset ? logos.get(layer.asset) : undefined; if (logo) ctx.drawImage(logo, rect.x, rect.y, rect.width, rect.height); }
      else {
        if (layer.kind === 'price' && layer.tag) { ctx.fillStyle = /^#[0-9a-f]{6}$/i.test(layer.tagColor) ? layer.tagColor : '#202020'; ctx.fillRect(rect.x, rect.y, rect.width, rect.height); }
        ctx.font = font(layer, rect.fontSize); ctx.textBaseline = 'top'; ctx.fillStyle = /^#[0-9a-f]{6}$/i.test(layer.color) ? layer.color : '#ffffff';
        rect.lines.forEach((line, i) => ctx.fillText(line, rect.x + rect.pad, rect.y + rect.pad + i * rect.fontSize * 1.25));
      }
    } finally { ctx.restore(); }
    return { id: layer.id, rect };
  });
}
export async function encodeEditor(image: HTMLImageElement, width: number, height: number, layers: EditorLayer[], logos: LogoImages, format: ImageFormat, quality: number) {
  if (conversionDimensionError(width, height)) throw new Error('inputLimit');
  const canvas = document.createElement('canvas');
  try { canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('exportError'); drawEditor(ctx, image, width, height, layers, logos, format); return await canvasBlob(canvas, format, quality); }
  finally { canvas.width = 0; canvas.height = 0; }
}
export function editorFilename(name: string, format: ImageFormat) {
  const base = (name.replace(/\.[^.]+$/, '') || 'image').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_');
  return `${base}-edited.${format === 'image/jpeg' ? 'jpg' : format === 'image/png' ? 'png' : 'webp'}`;
}