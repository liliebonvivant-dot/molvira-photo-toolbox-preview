import { decodeHeif, encodeConversion, inspectConversion, safePixelBudget, reducedDimensions, conversionDimensionError, convertLimits } from './convert';
import type { ReduceOffer, Size } from './large-image';
export type WatermarkSource = { file:File; image:HTMLImageElement; url:string; width:number; height:number; originalWidth:number; originalHeight:number; reduced:boolean };
export function watermarkReduceOffer(file:File,width:number,height:number,failed=false):ReduceOffer|undefined {
 const budget=safePixelBudget();
 if(!failed && width*height<=budget)return;
 const max=failed?Math.min(budget,convertLimits.compatiblePixels,Math.floor(width*height/2)):budget;
 if(width*height<=1)return;
 return {file,width,height,reduced:reducedDimensions(width,height,Math.max(1,max))};
}
export async function loadWatermarkSource(file:File,signal:AbortSignal,target?:Size):Promise<WatermarkSource|ReduceOffer> {
 const header=await inspectConversion(file);
 const offer=!target?watermarkReduceOffer(file,header.width,header.height):undefined;
 if(offer)return offer;
 let url=URL.createObjectURL(file), image=new Image();
 try {
  image.src=url;
  try { await image.decode(); }
  catch { if(header.format!=='image/heic' && header.format!=='image/heif')throw new Error('decode');
   const blob=await decodeHeif(file,signal,target);URL.revokeObjectURL(url);url=URL.createObjectURL(blob);image.src=url;await image.decode(); }
  if(signal.aborted)throw new Error('decode');
  const iw=image.naturalWidth,ih=image.naturalHeight;
  if(conversionDimensionError(iw,ih))throw new Error('inputLimit');
  const output=target?((iw>ih)===(target.width>target.height)?target:{width:target.height,height:target.width}):{width:iw,height:ih};
  if(iw!==output.width || ih!==output.height){ const blob=await encodeConversion(image,'image/png',100,output.width,output.height);image.src='';URL.revokeObjectURL(url);url=URL.createObjectURL(blob);image=new Image();image.src=url;await image.decode(); }
  if(signal.aborted)throw new Error('decode');
  return {file,image,url,...output,originalWidth:target?header.width:iw,originalHeight:target?header.height:ih,reduced:!!target};
 } catch(e) {image.src='';URL.revokeObjectURL(url);throw e;}
}
export function releaseWatermarkSource(source:WatermarkSource|undefined){if(source){source.image.src='';URL.revokeObjectURL(source.url);}}