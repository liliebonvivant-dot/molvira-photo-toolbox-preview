import { canvasBlob } from './canvas-blob';
import { displayPrice } from './currency';
import { collageOutputError, loadCollageSource, sourceAllowance, type CollageSource, type Cell } from './collage';
import { instagramPlacement } from './instagram';
import { clamp, editorFonts, type LayerRect } from './text-editor';
import type { ImageFormat } from './resize';
import type { Size } from './large-image';

export const adTemplates = ['simple', 'promotion', 'catalog', 'whatsapp', 'instagram'] as const;
export const adFormats = { square: { width: 1080, height: 1080 }, portrait: { width: 1080, height: 1350 }, story: { width: 1080, height: 1920 }, landscape: { width: 1200, height: 675 } } as const;
export const adFields = ['name', 'description', 'price', 'oldPrice', 'promotion'] as const;
export type AdField = typeof adFields[number];
export type AdText = { text: string; x: number; y: number; size: number; color: string; font: string };
export type AdState = Size & { template: typeof adTemplates[number]; preset: keyof typeof adFormats; background: string; accent: string; currency: string; photo?: string | undefined; logo?: string | undefined; fit: 'cover' | 'contain'; zoom: number; x: number; y: number; rotation: number; texts: Record<AdField, AdText>; logoX: number; logoY: number; logoSize: number };
export type AdHistory = { past: AdState[]; present: AdState; future: AdState[] };
export const adLimits = { history: 30, logoPixels: 16_000_000, text: 500 };
export type AdSources = ReadonlyMap<string, CollageSource>;
const defaults: Record<AdField, [number, number, number]> = { name: [6, 65, 5.5], description: [6, 73, 2.7], oldPrice: [6, 81, 3], price: [6, 87, 7], promotion: [6, 3, 3.5] };
export function initialAd(): AdState {
  return { ...adFormats.square, template: 'simple', preset: 'square', background: '#ffffff', accent: '#202020', currency: '$', fit: 'contain', zoom: 1, x: 0, y: 0, rotation: 0, logoX: 78, logoY: 3, logoSize: 16,
    texts: Object.fromEntries(adFields.map(key => { const [x,y,size] = defaults[key]; return [key, { text: '', x, y, size, color: '#202020', font: 'Arial' }]; })) as Record<AdField, AdText> };
}
export function selectAdTemplate(s: AdState, template: AdState['template']): AdState {
  const texts = { ...s.texts };
  for (const key of adFields) { const [x,y] = defaults[key]; texts[key] = { ...texts[key], x, y }; }
  if (template === 'catalog') { texts.name = { ...texts.name, y: 4 }; texts.description = { ...texts.description, y: 73 }; }
  return { ...s, template, texts, logoX: 78, logoY: template === 'catalog' ? 88 : 3, ...(template === 'whatsapp' ? { ...adFormats.story, preset: 'story' as const } : template === 'instagram' ? { ...adFormats.square, preset: 'square' as const } : {}) };
}
export function selectAdFormat(s: AdState, preset: AdState['preset']): AdState { return { ...s, preset, ...adFormats[preset] }; }
export function commitAd(h: AdHistory, next: AdState): AdHistory { return JSON.stringify(h.present) === JSON.stringify(next) ? h : { past: [...h.past, h.present].slice(-adLimits.history), present: next, future: [] }; }
export function undoAd(h: AdHistory): AdHistory { const p = h.past.at(-1); return p ? { past: h.past.slice(0,-1), present: p, future: [h.present,...h.future] } : h; }
export function redoAd(h: AdHistory): AdHistory { const p = h.future[0]; return p ? { past: [...h.past,h.present].slice(-adLimits.history), present: p, future: h.future.slice(1) } : h; }
export function usedAdAssets(h: AdHistory) { return new Set([...h.past,h.present,...h.future].flatMap(s => [s.photo,s.logo]).filter((id): id is string => !!id)); }
export function resetAd(s: AdState): AdState { return selectAdFormat(selectAdTemplate({ ...initialAd(), photo: s.photo }, s.template), s.preset); }
export function adPhotoCell(s: AdState): Cell { return { x: s.width * .05, y: s.height * (s.template === 'catalog' ? .15 : .12), width: s.width * .9, height: s.height * (s.template === 'catalog' ? .53 : .49) }; }
export function adDisplayText(s: AdState, key: AdField) {
  if (key !== 'price' && key !== 'oldPrice') return s.texts[key].text;
  return displayPrice(s.texts[key].text, s.currency);
}
export function visibleAdFields(s: AdState): AdField[] { return adFields.filter(k => adDisplayText(s,k).trim()); }
function font(t: AdText, size: number, bold: boolean) { return `${bold ? 'bold ' : ''}${size}px "${editorFonts.find(f => f === t.font) ?? 'Arial'}"`; }
// Bound every text box and wrap by Unicode code point; prices stay literal on a single fitted line.
export function adTextRect(ctx: Pick<CanvasRenderingContext2D, 'font' | 'measureText'>, s: AdState, key: AdField): LayerRect {
  const t = s.texts[key], price = key === 'price' || key === 'oldPrice', bold = key === 'price' || key === 'name';
  const maxW = s.width * (key === 'promotion' ? .66 : .88), maxH = s.height * (key === 'description' ? .075 : key === 'oldPrice' ? .045 : .085);
  let fs = s.width * clamp(t.size,.5,20) / 100, lines: string[] = [];
  const text = adDisplayText(s,key).slice(0,adLimits.text + 13);
  for (let attempt=0; attempt<20; attempt++) {
    ctx.font = font(t,fs,bold); lines = [];
    if (price) lines = [text.replace(/\n/g,' ')];
    else for (const paragraph of text.split('\n')) {
      let line = '';
      for (const char of paragraph) { if (line && ctx.measureText(line + char).width > maxW) { lines.push(line); line = char; } else line += char; }
      lines.push(line);
    }
    const width = Math.max(1,...lines.map(l => ctx.measureText(l).width)), height = lines.length * fs * 1.2;
    const ratio = Math.min(1,maxW/width,maxH/height);
    if (ratio >= .999) break;
    fs *= ratio * .98;
  }
  ctx.font = font(t,fs,bold);
  const pad = key === 'promotion' && s.template === 'promotion' ? fs * .22 : 0;
  const width = Math.min(s.width * .96,Math.max(1,...lines.map(l => ctx.measureText(l).width)) + 2*pad), height = Math.min(s.height * .96,fs * 1.2 * lines.length + 2*pad);
  return { x: clamp(t.x / 100 * s.width,0,s.width-width), y: clamp(t.y / 100 * s.height,0,s.height-height), width, height, fontSize: fs, pad, lines };
}
export function adLogoRect(s: AdState, logo: Size): Cell {
  const scale = Math.min(s.width * clamp(s.logoSize,1,40) / 100 / logo.width,s.height * .18 / logo.height);
  const width = logo.width*scale, height = logo.height*scale;
  return { x: clamp(s.logoX / 100 * s.width,0,s.width-width), y: clamp(s.logoY / 100 * s.height,0,s.height-height), width,height };
}
const color = (value: string, fallback: string) => /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
// Preview and export call this exact renderer in output-pixel coordinates; no editor guides are painted.
export function drawAd(ctx: CanvasRenderingContext2D, s: AdState, sources: AdSources) {
  ctx.clearRect(0,0,s.width,s.height); ctx.fillStyle = color(s.background,'#ffffff'); ctx.fillRect(0,0,s.width,s.height);
  const photo = s.photo ? sources.get(s.photo) : undefined, cell = adPhotoCell(s);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  if (photo) {
    const p = instagramPlacement(photo,{...s,width:cell.width,height:cell.height,preset:'custom',color:s.background,transparent:false});
    ctx.save(); try { ctx.beginPath(); ctx.rect(cell.x,cell.y,cell.width,cell.height); ctx.clip(); ctx.translate(cell.x+p.centerX,cell.y+p.centerY); ctx.rotate(p.rotation); ctx.drawImage(photo.image,-p.width/2,-p.height/2,p.width,p.height); } finally { ctx.restore(); }
  }
  const rects: { id: string; rect: LayerRect }[] = visibleAdFields(s).map(key => {
    const t = s.texts[key], rect = adTextRect(ctx,s,key);
    ctx.save(); try {
      if (rect.pad) { ctx.fillStyle = color(s.accent,'#202020'); ctx.fillRect(rect.x,rect.y,rect.width,rect.height); }
      ctx.font = font(t,rect.fontSize,key === 'price' || key === 'name'); ctx.textBaseline = 'top'; ctx.fillStyle = color(t.color,'#202020');
      if (key === 'oldPrice') ctx.globalAlpha = .65;
      rect.lines.forEach((line,i) => ctx.fillText(line,rect.x+rect.pad,rect.y+rect.pad+i*rect.fontSize*1.2));
      if (key === 'oldPrice') { ctx.strokeStyle=ctx.fillStyle; ctx.lineWidth=Math.max(1,rect.fontSize*.06); ctx.beginPath(); ctx.moveTo(rect.x,rect.y+rect.fontSize*.5); ctx.lineTo(rect.x+rect.width,rect.y+rect.fontSize*.5); ctx.stroke(); }
    } finally { ctx.restore(); }
    return { id:key, rect };
  });
  const logo = s.logo ? sources.get(s.logo) : undefined;
  if (logo) { const box = adLogoRect(s,logo); ctx.drawImage(logo.image,box.x,box.y,box.width,box.height); rects.push({id:'logo',rect:{...box,fontSize:0,pad:0,lines:[]}}); }
  return rects;
}
export const heldAdPixels = (sources: AdSources) => [...sources.values()].reduce((sum,s) => sum+s.width*s.height,0);
export const adOutputError = (s: Size, sources: AdSources) => collageOutputError(s,heldAdPixels(sources));
export const adSourceAllowance = (s: Size, sources: AdSources, logo: boolean) => Math.min(logo ? adLimits.logoPixels : Infinity,sourceAllowance(heldAdPixels(sources),s));
export const loadAdSource = (file: File,s: Size,sources: AdSources,logo: boolean,target?: Size) => loadCollageSource(file,adSourceAllowance(s,sources,logo),target);
export async function encodeAd(s: AdState,sources: AdSources,format: ImageFormat,quality: number) {
  if (!s.photo || !sources.has(s.photo)) throw new Error('decode');
  const error = adOutputError(s,sources); if (error) throw new Error(error);
  const canvas=document.createElement('canvas');
  try { canvas.width=s.width; canvas.height=s.height; const ctx=canvas.getContext('2d'); if (!ctx) throw new Error('exportError'); drawAd(ctx,s,sources); return await canvasBlob(canvas,format,quality); }
  finally { canvas.width=0; canvas.height=0; }
}
export const adFilename = (format: ImageFormat) => `molvira-product-ad.${format === 'image/jpeg' ? 'jpg' : format === 'image/png' ? 'png' : 'webp'}`;
