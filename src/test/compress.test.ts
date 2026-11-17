import { describe, expect, it, vi } from 'vitest';
import { compressionStats, compressionName, compressionLevels, optimizePng, compressImage, compressionReduceOffer } from '@/lib/photo/compress';
function chunk(type: string, data = new Uint8Array()) {
 const bytes = new Uint8Array(12 + data.length); new DataView(bytes.buffer).setUint32(0, data.length);
 bytes.set(new TextEncoder().encode(type), 4); bytes.set(data, 8); return bytes;
}
function png(text = true) {
 const parts = [new Uint8Array([137,80,78,71,13,10,26,10]), chunk('IHDR', new Uint8Array(13)), chunk('iCCP', new Uint8Array([7])), chunk('eXIf', new Uint8Array([1])), chunk('tRNS', new Uint8Array([0])), chunk('IDAT', new Uint8Array([1,2,3]))];
 if (text) parts.push(chunk('tEXt', new Uint8Array([65,0,66])), chunk('tIME', new Uint8Array(7)));
 parts.push(chunk('IEND'));
 const bytes = new Uint8Array(parts.reduce((n, p) => n + p.length, 0)); let offset = 0; for (const p of parts) { bytes.set(p,offset); offset += p.length; } return bytes;
}
const file = (bytes: Uint8Array) => ({ arrayBuffer: async () => bytes.buffer } as File);
describe('truthful local compression', () => {
 it('calculates the requested percentage from real byte sizes', () => expect(compressionStats(1000,750)).toEqual({ saved:250, percent:25, smaller:true, significant:true }));
 it('reports larger files with a negative reduction', () => expect(compressionStats(1000,1500)).toEqual({ saved:-500, percent:-50, smaller:false, significant:false }));
 it('does not claim reduction for equal sizes', () => expect(compressionStats(1000,1000).smaller).toBe(false));
 it('flags reductions below one percent as insignificant', () => expect(compressionStats(1000,995).significant).toBe(false));
 it('rejects empty results', () => expect(() => compressionStats(1000,0)).toThrow('exportError'));
  it('keeps the existing JPEG/WebP quality levels', () => expect(compressionLevels).toEqual({ high:90, balanced:75, small:50 }));
  it('does not reduce 3024 × 4032 on iPhone when real processing has not failed, even if a canvas probe would fail', () => {
   const ua = vi.spyOn(navigator,'userAgent','get').mockReturnValue('iPhone');
   const canvas = vi.spyOn(document,'createElement').mockImplementation(() => { throw new Error('probe failed'); });
   try { expect(compressionReduceOffer(file(png()),3024,4032)).toBeUndefined(); expect(canvas).not.toHaveBeenCalled(); }
   finally { ua.mockRestore(); canvas.mockRestore(); }
  });
  it('offers a meaningful optional fallback, not 3023 × 4031, after actual processing fails', () => {
   const offer = compressionReduceOffer(file(png()),3024,4032,true);
   expect(offer?.reduced).toEqual({width:2618,height:3491});
  });
  it('offers 4618 × 3464 only with explicit choice for 48 MP on iPhone', () => {
   const ua = vi.spyOn(navigator,'userAgent','get').mockReturnValue('iPhone');
   try { expect(compressionReduceOffer(file(png()),8064,6048)?.reduced).toEqual({width:4618,height:3464}); }
   finally { ua.mockRestore(); }
  });
  it('HEIF → JPG compares against uploaded HEIF bytes, not a decoded PNG, and reports no savings when larger', async () => {
   const image = {naturalWidth:3024,naturalHeight:4032} as HTMLImageElement;
   const canvas = {width:0,height:0,getContext:()=>({drawImage:vi.fn(),fillRect:vi.fn()}),toBlob:(cb:BlobCallback)=>cb(new Blob([new Uint8Array(1500)],{type:'image/jpeg'}))};
   const spy = vi.spyOn(document,'createElement').mockReturnValue(canvas as unknown as HTMLCanvasElement);
   try { const original = {size:1000} as File;
    const result = await compressImage({file:original,image,format:'image/heif',reduced:false,width:3024,height:4032},'image/jpeg',75);
    expect(compressionStats(original.size,result.size)).toEqual({saved:-500,percent:-50,smaller:false,significant:false});
    expect(canvas.width).toBe(0); // released after encoding
   } finally { spy.mockRestore(); }
  });
 it('matches output extensions', () => { expect(compressionName('a.jpeg','image/jpeg')).toBe('a-compressed.jpg'); expect(compressionName('a.heic','image/webp')).toBe('a-compressed.webp'); expect(compressionName('a.png','image/png')).toBe('a-compressed.png'); });
 it('removes descriptive PNG metadata without changing pixel, transparency, color or orientation bytes', async () => {
  const blob = await optimizePng(file(png()));
  expect(blob.size).toBe(png(false).length); expect(blob.type).toBe('image/png');
  // jsdom Blob lacks arrayBuffer: read via FileReader.
  const reader = new FileReader(); const read = new Promise<ArrayBuffer>((resolve,reject) => { reader.onload = () => reader.result instanceof ArrayBuffer ? resolve(reader.result) : reject(); reader.onerror = reject; });
  reader.readAsArrayBuffer(blob); expect(new Uint8Array(await read)).toEqual(png(false));
 });
 it('already optimized PNG remains exactly the same size', async () => expect((await optimizePng(file(png(false)))).size).toBe(png(false).length));
 it('rejects truncated PNG instead of manufacturing a result', async () => { await expect(optimizePng(file(png().slice(0,-4)))).rejects.toThrow('decode'); });
 it.each(['image/jpeg','image/webp'] as const)('preserves original dimensions for %s', async format => {
  const image = { naturalWidth:6000,naturalHeight:4000 } as HTMLImageElement;
  const drawImage = vi.fn(); const canvas = { width:0,height:0,getContext:()=>({ drawImage, fillRect:vi.fn() }),toBlob:vi.fn((cb:BlobCallback,mime:string)=>cb(new Blob(['encoded'],{type:mime}))) };
  const spy = vi.spyOn(document,'createElement').mockReturnValue(canvas as unknown as HTMLCanvasElement);
  try { const blob = await compressImage({ file:file(png()),image,format,reduced:false,width:6000,height:4000 },format,75);
   expect(blob.type).toBe(format); expect(drawImage).toHaveBeenCalledWith(image,0,0); expect(canvas.toBlob).toHaveBeenCalledWith(expect.any(Function),format,.75);
  } finally { spy.mockRestore(); }
 });
 it('only encodes reduced dimensions when source explicitly marks reduction', async () => {
  const drawImage = vi.fn(); const canvas = { width:0,height:0,getContext:()=>({drawImage}),toBlob:(cb:BlobCallback,mime:string)=>cb(new Blob(['encoded'],{type:mime})) };
  const spy = vi.spyOn(document,'createElement').mockReturnValue(canvas as unknown as HTMLCanvasElement);
  try { const image = {naturalWidth:4618,naturalHeight:3464} as HTMLImageElement;
   await compressImage({file:file(png()),image,format:'image/png',reduced:true,width:4618,height:3464},'image/png',100); expect(drawImage).toHaveBeenCalledWith(image,0,0);
  } finally { spy.mockRestore(); }
 });
});