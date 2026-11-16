import { dimensionError, type ImageFormat } from './resize';
import { canvasBlob } from './canvas-blob';
export type Point = { x: number; y: number };
export type Matrix = [number, number, number, number, number, number];
export type Edit = { width: number; height: number; matrix: Matrix; clips: Point[][] };
export type Rect = { x: number; y: number; width: number; height: number };
export const historyLimit = 30;
export function originalEdit(width: number, height: number): Edit { return { width, height, matrix: [1,0,0,1,0,0], clips: [] }; }
export function point(m: Matrix, p: Point): Point { return { x: m[0]*p.x+m[2]*p.y+m[4], y: m[1]*p.x+m[3]*p.y+m[5] }; }
function multiply(a: Matrix, b: Matrix): Matrix { return [a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]]; }
function transform(edit: Edit, m: Matrix, width: number, height: number): Edit { return {width,height,matrix:multiply(m,edit.matrix),clips:edit.clips.map(poly=>poly.map(p=>point(m,p)))}; }
function rectangle(width: number,height: number): Point[] { return [{x:0,y:0},{x:width,y:0},{x:width,y:height},{x:0,y:height}]; }
export function cropEdit(edit: Edit, rect: Rect): Edit {
 const x=Math.max(0,Math.min(edit.width-1,Math.round(rect.x))),y=Math.max(0,Math.min(edit.height-1,Math.round(rect.y)));
 const width=Math.max(1,Math.min(edit.width-x,Math.round(rect.width))),height=Math.max(1,Math.min(edit.height-y,Math.round(rect.height)));
 const next=transform(edit,[1,0,0,1,-x,-y],width,height);
 return {...next,clips:[...next.clips,rectangle(width,height)]};
}
export function rotateEdit(edit: Edit, angle: number, expand: boolean): Edit {
 const radians=angle*Math.PI/180, c=Math.round(Math.cos(radians)*1e12)/1e12,s=Math.round(Math.sin(radians)*1e12)/1e12;
 const width=expand?Math.ceil(Math.abs(edit.width*c)+Math.abs(edit.height*s)):edit.width;
 const height=expand?Math.ceil(Math.abs(edit.width*s)+Math.abs(edit.height*c)):edit.height;
 const next=transform(edit,[c,s,-s,c,width/2-c*edit.width/2+s*edit.height/2,height/2-s*edit.width/2-c*edit.height/2],width,height);
 return expand?next:{...next,clips:[...next.clips,rectangle(width,height)]};
}
export function flipEdit(edit: Edit, horizontal: boolean): Edit { return transform(edit,horizontal?[-1,0,0,1,edit.width,0]:[1,0,0,-1,0,edit.height],edit.width,edit.height); }
export function fitRatio(width:number,height:number,ratio?:number): Rect {
 if(!ratio)return {x:0,y:0,width,height};
 const w=Math.min(width,height*ratio),h=w/ratio;return {x:(width-w)/2,y:(height-h)/2,width:w,height:h};
}
// Only numeric transforms are retained. Each render samples the original once, never an encoded intermediate.
export function renderEdit(image: HTMLImageElement, edit: Edit, canvas: HTMLCanvasElement, preview=false, white=false) {
 const scale=preview?Math.min(1,1000/edit.width,800/edit.height):1;
 canvas.width=Math.max(1,Math.round(edit.width*scale));canvas.height=Math.max(1,Math.round(edit.height*scale));
 const ctx=canvas.getContext('2d');if(!ctx)throw new Error('exportError');
 if(white){ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);}
 ctx.save();ctx.scale(canvas.width/edit.width,canvas.height/edit.height);
 for(const poly of edit.clips){ctx.beginPath();poly.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.clip();}
 ctx.transform(...edit.matrix);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(image,0,0);ctx.restore();
}
export async function exportEdit(image: HTMLImageElement, edit: Edit, format: ImageFormat, quality:number): Promise<Blob> {
 const error=dimensionError(edit.width,edit.height);if(error)throw new Error(error);
 const canvas=document.createElement('canvas');
 try { renderEdit(image,edit,canvas,false,format==='image/jpeg');return await canvasBlob(canvas,format,quality); }
 finally {canvas.width=0;canvas.height=0;}
}