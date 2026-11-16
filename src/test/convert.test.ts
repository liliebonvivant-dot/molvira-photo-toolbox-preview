import { describe, expect, it, vi } from 'vitest';
import { conversionDimensionError, conversionName, encodeConversion, heifHeader, inspectConversion } from '@/lib/photo/convert';
function heif(width=400,height=300,brand='heic') {
 const b=new Uint8Array(68),v=new DataView(b.buffer);
 const box=(o:number,n:number,t:string)=>{v.setUint32(o,n);b.set(new TextEncoder().encode(t),o+4);};
 box(0,24,'ftyp');b.set(new TextEncoder().encode(brand),8);b.set(new TextEncoder().encode('mif1'),16);
 box(24,44,'meta');box(36,32,'iprp');box(44,24,'ipco');box(52,16,'free');
 // complete ispe nested property
 const out=new Uint8Array(72);out.set(b);const d=new DataView(out.buffer);
 d.setUint32(24,48);d.setUint32(36,36);d.setUint32(44,28);d.setUint32(52,20);out.set(new TextEncoder().encode('ispe'),56);d.setUint32(64,width);d.setUint32(68,height);
 return out;
}
describe('local conversion rules',()=>{
 it('recognizes HEIC from bytes and reads dimensions before decoding',()=>expect(heifHeader(heif())).toEqual({format:'image/heic',width:400,height:300}));
 it('recognizes generic HEIF',()=>expect(heifHeader(heif(400,300,'mif1'))?.format).toBe('image/heif'));
 it('does not mistake AVIF for HEIC',()=>expect(heifHeader(heif(400,300,'avif'))).toBeUndefined());
 it('rejects forged file types',async()=>{await expect(inspectConversion({size:3,arrayBuffer:async()=>new Uint8Array([1,2,3]).buffer} as File)).rejects.toThrow('fileType');});
 it('limits regular files to 20 MiB before reading',async()=>{await expect(inspectConversion({size:20*1024*1024+1} as File)).rejects.toThrow('fileSize');});
 it('limits HEIF files to 10 MiB',async()=>{await expect(inspectConversion({size:10*1024*1024+1,arrayBuffer:async()=>heif().buffer} as File)).rejects.toThrow('fileSize');});
 it('rejects oversized HEIC before allocating a decoder',async()=>{await expect(inspectConversion({size:72,arrayBuffer:async()=>heif(5000,4000).buffer} as File)).rejects.toThrow('inputLimit');});
 it('allows 16 megapixels without resizing',()=>expect(conversionDimensionError(4000,4000)).toBe(false));
 it('rejects over 16 megapixels',()=>expect(conversionDimensionError(4000,4001)).toBe(true));
 it('limits each side to 8192',()=>expect(conversionDimensionError(8193,1)).toBe(true));
 it.each([['image/jpeg','jpg'],['image/png','png'],['image/webp','webp']] as const)('matches extension for %s',(mime,ext)=>expect(conversionName('photo.jpeg',mime)).toBe(`photo-converted.${ext}`));
 it.each(['image/jpeg','image/png','image/webp'] as const)('preserves dimensions and sends quality for %s',async format=>{
  const fillRect=vi.fn(),drawImage=vi.fn(),ctx={fillStyle:'',fillRect,drawImage};
  const canvas={width:0,height:0,getContext:()=>ctx,toBlob:vi.fn((cb:BlobCallback,mime:string)=>cb(new Blob(['bytes'],{type:mime})))};
  const spy=vi.spyOn(document,'createElement').mockReturnValue(canvas as unknown as HTMLCanvasElement);
  try {
   const image={naturalWidth:400,naturalHeight:300} as HTMLImageElement;
   const blob=await encodeConversion(image,format,37);
   expect(drawImage).toHaveBeenCalledWith(image,0,0);
   expect(canvas.toBlob).toHaveBeenCalledWith(expect.any(Function),format,.37);
   expect(blob.type).toBe(format);
   if(format==='image/jpeg'){expect(ctx.fillStyle).toBe('#ffffff');expect(fillRect).toHaveBeenCalledWith(0,0,400,300);}else expect(fillRect).not.toHaveBeenCalled();
   expect([canvas.width,canvas.height]).toEqual([0,0]);
  }finally{spy.mockRestore();}
 });
 it('rejects browser fallback MIME instead of downloading a mislabeled file',async()=>{
  const spy=vi.spyOn(document,'createElement').mockReturnValue({width:0,height:0,getContext:()=>({drawImage:vi.fn()}),toBlob:(cb:BlobCallback)=>cb(new Blob(['x'],{type:'image/png'}))} as unknown as HTMLCanvasElement);
  try{await expect(encodeConversion({naturalWidth:400,naturalHeight:300} as HTMLImageElement,'image/webp',90)).rejects.toThrow('exportError');}finally{spy.mockRestore();}
 });
});