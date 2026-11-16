export type ImageFormat = 'image/jpeg' | 'image/png' | 'image/webp';
export const resizeLimits = { fileBytes: 20 * 1024 * 1024, side: 12_000, pixels: 50_000_000 };
export type ResizeError = 'fileType' | 'fileSize' | 'decode' | 'inputLimit' | 'dimensions' | 'outputLimit' | 'exportError';
export function validDimensions(width: number, height: number): boolean {
  return Number.isSafeInteger(width) && Number.isSafeInteger(height) && width > 0 && height > 0;
}
// budget: device-safe pixel area (see safePixelBudget); never above the absolute cap.
export function dimensionError(width: number, height: number, budget: number = resizeLimits.pixels): ResizeError | undefined {
  if (!validDimensions(width, height)) return 'dimensions';
  if (width > resizeLimits.side || height > resizeLimits.side || width * height > Math.min(budget, resizeLimits.pixels)) return 'outputLimit';
  return undefined;
}
export function proportionalDimension(value: number, sourceAxis: number, otherAxis: number) {
  return Math.max(1, Math.round(value * otherAxis / sourceAxis));
}
export function presetDimensions(width: number, height: number, percent: number) {
  return { width: Math.max(1, Math.round(width * percent / 100)), height: Math.max(1, Math.round(height * percent / 100)) };
}
// Read dimensions before allocating a decoded bitmap. Headers are not trusted as a decoder.
export function imageHeader(bytes: Uint8Array): { format: ImageFormat; width: number; height: number } | undefined {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length >= 24 && [137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v) && String.fromCharCode(...bytes.slice(12,16)) === 'IHDR') {
    return { format: 'image/png', width: view.getUint32(16), height: view.getUint32(20) };
  }
  if (bytes.length >= 30 && String.fromCharCode(...bytes.slice(0,4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8,12)) === 'WEBP') {
    const chunk = String.fromCharCode(...bytes.slice(12,16));
    if (chunk === 'VP8X') return { format: 'image/webp', width: 1 + view.getUint8(24) + view.getUint8(25)*256 + view.getUint8(26)*65536, height: 1 + view.getUint8(27) + view.getUint8(28)*256 + view.getUint8(29)*65536 };
    if (chunk === 'VP8 ' && bytes[23]===157 && bytes[24]===1 && bytes[25]===42) return { format: 'image/webp', width: view.getUint16(26,true)&16383, height: view.getUint16(28,true)&16383 };
    if (chunk === 'VP8L' && bytes[20]===47) { const bits=view.getUint32(21,true); return { format:'image/webp', width: (bits&16383)+1, height: ((bits>>>14)&16383)+1 }; }
  }
  if (bytes[0]===255 && bytes[1]===216) {
    let offset=2;
    while(offset+4<=bytes.length) {
      if(bytes[offset++]!==255) return;
      while(bytes[offset]===255) offset++;
      const marker=bytes[offset++];
      if(marker===undefined) return undefined;
      if(marker===217 || marker===218) return;
      if(marker===1 || marker>=208&&marker<=215) continue;
      if(offset+2>bytes.length) return;
      const length=view.getUint16(offset);
      if(length<2 || offset+length>bytes.length) return;
      if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker) && length>=8) return {format:'image/jpeg',height:view.getUint16(offset+3),width:view.getUint16(offset+5)};
      offset+=length;
    }
  }
  return undefined;
}
export async function inspectImage(file: File) {
  if(file.size > resizeLimits.fileBytes) throw new Error('fileSize');
  const header=imageHeader(new Uint8Array(await file.arrayBuffer()));
  if(!header) throw new Error('fileType');
  if(!validDimensions(header.width,header.height)) throw new Error('decode');
  if(header.width>resizeLimits.side || header.height>resizeLimits.side || header.width*header.height>resizeLimits.pixels) throw new Error('inputLimit');
  return header;
}
export function exportCanvas(image: HTMLImageElement, width: number, height: number, format: ImageFormat, quality: number): Promise<Blob> {
  const error=dimensionError(width,height);
  if(error) return Promise.reject(new Error(error));
  const canvas=document.createElement('canvas'); canvas.width=width; canvas.height=height;
  const context=canvas.getContext('2d');
  if(!context) {canvas.width=0;canvas.height=0;return Promise.reject(new Error('exportError'));}
  // JPEG has no alpha channel. This is an encoding rule, not a UI color.
  if(format==='image/jpeg') {context.fillStyle='#ffffff';context.fillRect(0,0,width,height);}
  context.imageSmoothingEnabled=true; context.imageSmoothingQuality='high';
  context.drawImage(image,0,0,width,height);
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>{canvas.width=0;canvas.height=0;if(blob?.type===format) resolve(blob);else reject(new Error('exportError'));},format,quality/100));
}