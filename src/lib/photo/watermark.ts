import { canvasBlob } from './canvas-blob';
import { conversionDimensionError } from './convert';
import type { ImageFormat } from './resize';

export type WatermarkOptions = { mode:'text'|'logo'; text:string; font:string; size:number; color:string; opacity:number; x:number; y:number; repeat:boolean; spacing:number };
export const watermarkFonts = ['Arial', 'Georgia', 'Courier New'] as const;
export const defaultWatermark: WatermarkOptions = { mode:'text', text:'', font:'Arial', size:6, color:'#ffffff', opacity:50, x:95, y:95, repeat:false, spacing:50 };
export type WatermarkRect = { x:number; y:number; width:number; height:number; fontSize:number };
const clamp = (n:number, min:number, max:number) => Math.min(max, Math.max(min, Number.isFinite(n) ? n : min));
export function watermarkLayout(ctx: Pick<CanvasRenderingContext2D, 'font'|'measureText'>, width:number, height:number, options:WatermarkOptions, logo?: { naturalWidth:number; naturalHeight:number }): WatermarkRect {
 let fontSize = width * clamp(options.size, 1, 80) / 100;
 ctx.font = `${fontSize}px "${watermarkFonts.find(f => f === options.font) ?? 'Arial'}"`;
 let w = options.mode === 'logo' && logo ? fontSize : Math.max(1, ctx.measureText(options.text).width);
 let h = options.mode === 'logo' && logo ? w * logo.naturalHeight / logo.naturalWidth : fontSize * 1.2;
 const scale = Math.min(1, width * .96 / w, height * .96 / h);
 w *= scale; h *= scale; fontSize *= scale;
 return { x:(width-w)*clamp(options.x,0,100)/100, y:(height-h)*clamp(options.y,0,100)/100, width:w, height:h, fontSize };
}
export function watermarkPositions(rect:WatermarkRect, width:number, height:number, options:WatermarkOptions) {
 if (!options.repeat) return [{x:rect.x,y:rect.y}];
 // Minimum grid step bounds work to at most ~1,100 marks, even for tiny text.
 const gap = Math.min(width,height)*clamp(options.spacing,10,200)/100;
 const dx = Math.max(rect.width+gap,width/32), dy = Math.max(rect.height+gap,height/32);
 const startX = ((rect.x % dx)+dx)%dx-dx, startY = ((rect.y % dy)+dy)%dy-dy;
 const positions: {x:number;y:number}[] = [];
 for (let y=startY;y<height;y+=dy) for(let x=startX;x<width;x+=dx) positions.push({x,y});
 return positions;
}
export function drawWatermark(ctx:CanvasRenderingContext2D, image:HTMLImageElement, width:number, height:number, options:WatermarkOptions, logo?:HTMLImageElement, format:ImageFormat='image/png'): WatermarkRect {
 ctx.clearRect(0,0,width,height);
 if(format==='image/jpeg'){ ctx.fillStyle='#ffffff';ctx.fillRect(0,0,width,height); }
 ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
 ctx.drawImage(image,0,0,width,height);
 const rect=watermarkLayout(ctx,width,height,options,logo);
 if ((options.mode==='text' && !options.text.trim()) || (options.mode==='logo' && !logo)) return rect;
 ctx.save();
 try {
  ctx.globalAlpha=clamp(options.opacity,0,100)/100;
  ctx.font=`${rect.fontSize}px "${watermarkFonts.find(f=>f===options.font)??'Arial'}"`;ctx.textBaseline='top';
  ctx.fillStyle=/^#[0-9a-f]{6}$/i.test(options.color)?options.color:'#ffffff';
  for(const p of watermarkPositions(rect,width,height,options)) {
   if(options.mode==='logo' && logo)ctx.drawImage(logo,p.x,p.y,rect.width,rect.height);
   else ctx.fillText(options.text,p.x,p.y);
  }
 } finally {ctx.restore();}
 return rect;
}
export async function encodeWatermark(image:HTMLImageElement,width:number,height:number,options:WatermarkOptions,logo:HTMLImageElement|undefined,format:ImageFormat,quality:number) {
 if(conversionDimensionError(width,height))throw new Error('inputLimit');
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 try { const ctx=canvas.getContext('2d');if(!ctx)throw new Error('exportError');drawWatermark(ctx,image,width,height,options,logo,format);return await canvasBlob(canvas,format,quality); }
 finally {canvas.width=0;canvas.height=0;}
}
export function watermarkName(name:string, format:ImageFormat) {
 const base=(name.replace(/\.[^.]+$/,'')||'image').replace(/[<>:"/\\|?*\u0000-\u001f]/g,'_');
 return `${base}-watermark.${format==='image/jpeg'?'jpg':format==='image/png'?'png':'webp'}`;
}