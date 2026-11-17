import { afterEach, describe, expect, it, vi } from 'vitest';
import { backgroundBudget, backgroundName, backgroundTarget, inspectBackground, removeLocalBackground } from '@/lib/photo/background';
function png(width:number,height:number){const bytes=new Uint8Array(24);bytes.set([137,80,78,71,13,10,26,10]);bytes.set([73,72,68,82],12);const view=new DataView(bytes.buffer);view.setUint32(16,width);view.setUint32(20,height);return {size:24,arrayBuffer:async()=>bytes.buffer} as File;}
afterEach(()=>{vi.unstubAllGlobals();vi.useRealTimers();});
describe('local background removal boundaries',()=>{
 it('accepts JPG, PNG and WebP through the existing header validator',async()=>{const h=await inspectBackground(png(6000,4000));expect(h).toEqual({format:'image/png',width:6000,height:4000});});
 it('rejects inputs above 50 MP',async()=>{await expect(inspectBackground(png(10000,6000))).rejects.toThrow('inputLimit');});
 it('rejects sides above 12000 pixels',async()=>{await expect(inspectBackground(png(12001,100))).rejects.toThrow('inputLimit');});
 it('rejects files above 20 MiB',async()=>{await expect(inspectBackground({size:20*1024*1024+1} as File)).rejects.toThrow('fileSize');});
 it('rejects unrelated encoded formats',async()=>{await expect(inspectBackground({size:3,arrayBuffer:async()=>new Uint8Array([1,2,3]).buffer} as File)).rejects.toThrow('fileType');});
 it('bounds touch working copies to 2 MP and desktop to 4 MP',()=>{expect(backgroundBudget(true)).toBe(2_000_000);expect(backgroundBudget(false)).toBe(4_000_000);const t=backgroundTarget(8064,6048,backgroundBudget(true));expect(t.width*t.height).toBeLessThanOrEqual(2_000_000);expect(t.width/t.height).toBeCloseTo(4/3,2);});
 it('preserves dimensions of small images',()=>{expect(backgroundTarget(640,480,2_000_000)).toEqual({width:640,height:480});});
 it('exports only a PNG filename',()=>{expect(backgroundName('product.webp')).toBe('product-no-background.png');});
 it('cancellation terminates the local worker',async()=>{const terminate=vi.fn();vi.stubGlobal('Worker',class {postMessage=vi.fn();terminate=terminate;});const controller=new AbortController();const promise=removeLocalBackground(png(20,20),undefined,controller.signal,vi.fn());controller.abort();await expect(promise).rejects.toMatchObject({name:'AbortError'});expect(terminate).toHaveBeenCalledOnce();});
 it('stops processing after 180 seconds',async()=>{vi.useFakeTimers();const terminate=vi.fn();vi.stubGlobal('Worker',class {postMessage=vi.fn();terminate=terminate;});const promise=removeLocalBackground(png(20,20),undefined,new AbortController().signal,vi.fn());const check=expect(promise).rejects.toThrow('timeout');await vi.advanceTimersByTimeAsync(180_000);await check;expect(terminate).toHaveBeenCalledOnce();});
});