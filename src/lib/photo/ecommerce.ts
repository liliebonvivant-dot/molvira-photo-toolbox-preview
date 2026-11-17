import { canvasBlob } from './canvas-blob';
import { clampInstagram, instagramPlacement, instagramOutputError, instagramOutputReduction, loadInstagramSource, releaseInstagramSource, type InstagramSource } from './instagram';
import { alphaChannel } from './white-background';
import { inspectImage, type ImageFormat } from './resize';

export const ecommercePresets = { square: { width: 1000, height: 1000 }, hd: { width: 1200, height: 1200 }, high: { width: 2000, height: 2000 }, portrait: { width: 1000, height: 1250 }, landscape: { width: 1200, height: 900 } } as const;
export const ecommerceMargins = { none: 0, small: 5, medium: 10, large: 15 } as const;
export const ecommerceBackgrounds = { white: '#ffffff', black: '#000000', gray: '#eeeeee' } as const;
export type EcommerceState = { width: number; height: number; preset: keyof typeof ecommercePresets | 'custom'; fit: 'cover' | 'contain'; zoom: number; x: number; y: number; rotation: number; color: string; transparent: boolean; margin: number };
export type EcommerceHistory = { past: EcommerceState[]; present: EcommerceState; future: EcommerceState[] };
export type EcommerceSource = InstagramSource & { alpha: boolean };
export const initialEcommerce = (): EcommerceState => ({ ...ecommercePresets.square, preset: 'square', fit: 'contain', zoom: 1, x: 0, y: 0, rotation: 0, color: ecommerceBackgrounds.white, transparent: false, margin: 5 });
export const centerEcommerce = (s: EcommerceState): EcommerceState => ({ ...s, x: 0, y: 0 });
export function commitEcommerce(h: EcommerceHistory, next: EcommerceState): EcommerceHistory { return JSON.stringify(h.present) === JSON.stringify(next) ? h : { past: [...h.past,h.present].slice(-30), present: next, future: [] }; }
export function undoEcommerce(h: EcommerceHistory): EcommerceHistory { const s = h.past.at(-1); return s ? { past: h.past.slice(0,-1), present: s, future: [h.present,...h.future] } : h; }
export function redoEcommerce(h: EcommerceHistory): EcommerceHistory { const s = h.future[0]; return s ? { past: [...h.past,h.present].slice(-30), present: s, future: h.future.slice(1) } : h; }
export function ecommerceCell(s: EcommerceState) {
  const inset = Math.min(s.width,s.height) * clampInstagram(s.margin,0,40) / 100;
  return { x: inset, y: inset, width: s.width-2*inset, height: s.height-2*inset };
}
export function ecommercePlacement(source: Pick<EcommerceSource,'width'|'height'>, s: EcommerceState) {
  const cell = ecommerceCell(s);
  const p = instagramPlacement(source,{ ...s, ...cell, preset: 'custom', x: 0, y: 0 });
  return { ...p, centerX: s.width * (.5 + clampInstagram(s.x,-100,100)/100), centerY: s.height * (.5 + clampInstagram(s.y,-100,100)/100) };
}
// The reserved inset is clipped in output pixels, preserving margins even when zoomed or moved.
export function drawEcommerce(ctx: CanvasRenderingContext2D, source: EcommerceSource, s: EcommerceState, format: ImageFormat) {
  ctx.clearRect(0,0,s.width,s.height);
  if (!s.transparent || format === 'image/jpeg') { ctx.fillStyle = /^#[0-9a-f]{6}$/i.test(s.color) ? s.color : ecommerceBackgrounds.white; ctx.fillRect(0,0,s.width,s.height); }
  const cell = ecommerceCell(s), p = ecommercePlacement(source,s);
  ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
  ctx.save();
  try { ctx.beginPath(); ctx.rect(cell.x,cell.y,cell.width,cell.height); ctx.clip(); ctx.translate(p.centerX,p.centerY); ctx.rotate(p.rotation); ctx.drawImage(source.image,-p.width/2,-p.height/2,p.width,p.height); }
  finally { ctx.restore(); }
}
export const ecommerceOutputError = instagramOutputError;
export const ecommerceOutputReduction = instagramOutputReduction;
export const releaseEcommerceSource = releaseInstagramSource;
export async function loadEcommerceSource(file: File, output: Pick<EcommerceState,'width'|'height'>, target?: Pick<EcommerceState,'width'|'height'>) {
  const header = await inspectImage(file);
  const alpha = header.format !== 'image/jpeg' && alphaChannel(new Uint8Array(await file.arrayBuffer()));
  const source = await loadInstagramSource(file,output,target);
  return 'image' in source ? { ...source, alpha } : source;
}
export async function encodeEcommerce(source: EcommerceSource, s: EcommerceState, format: ImageFormat, quality: number) {
  const error=ecommerceOutputError(s,source); if(error) throw new Error(error);
  const canvas=document.createElement('canvas');
  try { canvas.width=s.width;canvas.height=s.height;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('exportError');drawEcommerce(ctx,source,s,format);return await canvasBlob(canvas,format,quality); }
  finally {canvas.width=0;canvas.height=0;}
}
export const ecommerceFilename = (format: ImageFormat) => `molvira-ecommerce.${format==='image/jpeg'?'jpg':format==='image/png'?'png':'webp'}`;