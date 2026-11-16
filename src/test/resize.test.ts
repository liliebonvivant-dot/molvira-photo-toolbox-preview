import { describe, it, expect } from 'vitest';
import { dimensionError, imageHeader, inspectImage, presetDimensions, proportionalDimension, resizeLimits } from '@/lib/photo/resize';
describe('local resize rules',()=>{
 for(const [percent,w,h] of [[25,100,50],[50,200,100],[75,300,150],[200,800,400]])it(`uses ${percent}% of original dimensions`,()=>expect(presetDimensions(400,200,percent)).toEqual({width:w,height:h}));
 it('updates the other dimension proportionally',()=>expect(proportionalDimension(300,400,200)).toBe(150));
 it('permits independent dimensions',()=>expect(dimensionError(301,177)).toBeUndefined());
 it.each([[0,10],[-1,10],[10,0],[1.5,10],[NaN,10],[Infinity,10]])('rejects invalid dimensions %s × %s',(w,h)=>expect(dimensionError(w,h)).toBe('dimensions'));
 it('limits output memory',()=>{expect(dimensionError(4000,2000)).toBeUndefined();expect(dimensionError(4000,2001)).toBe('outputLimit');});
 it('limits each side',()=>expect(dimensionError(8193,1)).toBe('outputLimit'));
 it('keeps tiny presets nonzero',()=>expect(presetDimensions(1,1,25)).toEqual({width:1,height:1}));
 it('rejects non-image bytes',()=>expect(imageHeader(new Uint8Array([1,2,3]))).toBeUndefined());
 it('validates file contents instead of a forged MIME type',async()=>{const file={size:4,arrayBuffer:async()=>new Uint8Array([1,2,3,4]).buffer} as File;await expect(inspectImage(file)).rejects.toThrow('fileType');});
 it('rejects files over the 20 MiB input cap before reading',async()=>{const file={size:resizeLimits.fileBytes+1} as File;await expect(inspectImage(file)).rejects.toThrow('fileSize');});
 it('rejects oversized image headers before decoding',async()=>{const bytes=new Uint8Array(24);bytes.set([137,80,78,71,13,10,26,10]);bytes.set([73,72,68,82],12);const v=new DataView(bytes.buffer);v.setUint32(16,5000);v.setUint32(20,4000);await expect(inspectImage({size:24,arrayBuffer:async()=>bytes.buffer} as File)).rejects.toThrow('inputLimit');});
});
