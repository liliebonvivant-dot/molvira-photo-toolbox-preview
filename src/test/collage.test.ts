import { afterEach, describe, expect, it, vi } from 'vitest';
import { collageCells, collageLayouts, collageOutputError, commitCollage, drawCollage, encodeCollage, initialCollage, loadCollageSource, moveCollagePhoto, newCollagePhoto, photoPlacement, redoCollage, sourceAllowance, undoCollage, type CollageHistory, type CollageSource } from '@/lib/photo/collage';
import { inspectImage } from '@/lib/photo/resize';
afterEach(() => vi.restoreAllMocks());
const photo = newCollagePhoto('a');
const source = { image: {} as HTMLImageElement, width: 400, height: 200 } as CollageSource;
function ctx() { return { clearRect: vi.fn(), fillRect: vi.fn(), fillStyle: '', save: vi.fn(), restore: vi.fn(), beginPath: vi.fn(), roundRect: vi.fn(), clip: vi.fn(), drawImage: vi.fn() } as unknown as CanvasRenderingContext2D; }
function file(w: number, h: number) { const b = new Uint8Array(24); b.set([137,80,78,71,13,10,26,10]); b.set([73,72,68,82], 12); const v = new DataView(b.buffer); v.setUint32(16,w); v.setUint32(20,h); const f = new File([b], 'photo.png'); Object.defineProperty(f, 'arrayBuffer', { value: async () => b.buffer }); return f; }
describe('collage layouts and framing', () => {
  it.each([2,3,4,5,6,9,12])('provides exactly %i cells without overlaps or overflow in every layout', count => {
    for (const layout of collageLayouts) { const cells = collageCells(count, { ...initialCollage(), layout, gap: 20 }); expect(cells.length).toBe(count);
      for (const cell of cells) { expect(cell.x).toBeGreaterThanOrEqual(0); expect(cell.y).toBeGreaterThanOrEqual(0); expect(cell.x + cell.width).toBeLessThanOrEqual(1080); expect(cell.y + cell.height).toBeLessThanOrEqual(1080); expect(cell.width).toBeGreaterThan(0); }
      for (let i=0;i<cells.length;i++) for(let j=i+1;j<cells.length;j++) { const a=cells[i],b=cells[j]; if(a&&b) expect(a.x+a.width<=b.x || b.x+b.width<=a.x || a.y+a.height<=b.y || b.y+b.height<=a.y).toBe(true); }
    }
  });
  it('offers genuine horizontal, vertical and asymmetric choices', () => { const s=initialCollage(); expect(collageCells(2,{...s,layout:'horizontal'})[0]).toEqual({x:0,y:0,width:540,height:1080}); expect(collageCells(2,{...s,layout:'vertical'})[0]).toEqual({x:0,y:0,width:1080,height:540}); expect(collageCells(3,{...s,layout:'left'})[0]?.height).toBe(1080); });
  it('applies the chosen spacing without empty grid slots',()=> { const cells=collageCells(5,{...initialCollage(),gap:20}); expect(cells[3]?.width).toBe(520); expect(cells[0]?.x).toBe(10); });
  it('fills a cell without distorting the photo',()=> { const p=photoPlacement(source,{x:0,y:0,width:100,height:100},photo); expect(p).toEqual({x:-50,y:0,width:200,height:100}); });
  it('fits the entire photo without distortion',()=> { expect(photoPlacement(source,{x:0,y:0,width:100,height:100},{...photo,fit:'contain'})).toEqual({x:0,y:25,width:100,height:50}); });
  it('zooms and repositions within clipped cells',()=> { expect(photoPlacement(source,{x:0,y:0,width:100,height:100},{...photo,zoom:2,x:100,y:0})).toEqual({x:-300,y:0,width:400,height:200}); });
  it('preserves all four output aspect ratios',()=> { for(const [w,h] of [[1080,1080],[1080,1350],[1080,1920],[1920,1080]]) { const cells=collageCells(2,{...initialCollage(),width:w??1,height:h??1}); expect(cells.reduce((n,c)=>n+c.width*c.height,0)).toBe((w??1)*(h??1)); } });
});
describe('photo order and bounded history',()=> {
  it('reorders photos while retaining framing',()=> { const photos=[{...photo,zoom:2},newCollagePhoto('b')]; expect(moveCollagePhoto(photos,'a',1)).toEqual([photos[1],photos[0]]); expect(moveCollagePhoto(photos,'a',-1)).toBe(photos); });
  it('undoes and redoes additions, removal and settings',()=> { const a=initialCollage(), b={...a,photos:[photo]}, c={...b,photos:[],gap:24}; let h=commitCollage({past:[],present:a,future:[]},b); h=commitCollage(h,c); expect(undoCollage(h).present).toEqual(b); expect(redoCollage(undoCollage(h)).present).toEqual(c); expect(commitCollage(undoCollage(h),{...b,gap:10}).future).toEqual([]); });
  it('retains no more than 30 undo steps',()=> { let h:CollageHistory={past:[],present:initialCollage(),future:[]}; for(let i=1;i<=40;i++) h=commitCollage(h,{...h.present,gap:i}); expect(h.past.length).toBe(30); expect(h.past[0]?.gap).toBe(10); });
});
describe('memory and validation',()=> {
  it('accounts for already decoded photos and output before adding a source',()=> { expect(sourceAllowance(4_000_000,{width:1000,height:1000},16_000_000)).toBe(11_000_000); expect(sourceAllowance(16_000_000,{width:1,height:1},16_000_000)).toBe(0); });
  it('does not silently change chosen output dimensions',()=> { const s={width:8000,height:6000}; expect(collageOutputError(s,4_000_000,50_000_000)).toBe('memory'); expect(s).toEqual({width:8000,height:6000}); });
  it('allows more than 16 MP when total device budget permits',()=> { expect(collageOutputError({width:6000,height:4000},1_000_000,50_000_000)).toBeUndefined(); });
  it('rejects invalid output dimensions and absolute limits',()=> { expect(collageOutputError({width:0,height:10},0,50_000_000)).toBe('dimensions'); expect(collageOutputError({width:12001,height:1},0,50_000_000)).toBe('outputLimit'); });
  it('offers source reduction before allocating an Image and only with explicit consent',async()=> { const spy=vi.spyOn(globalThis,'Image'); const result=await loadCollageSource(file(8000,6000),12_000_000); expect('reduced' in result).toBe(true); if('reduced' in result && typeof result.reduced==='object') expect(result.reduced.width*result.reduced.height).toBeLessThanOrEqual(12_000_000); expect(spy).not.toHaveBeenCalled(); });
  it('rejects disguised files by header',async()=> { const f=new File(['no'],'photo.jpg',{type:'image/jpeg'}); Object.defineProperty(f,'arrayBuffer',{value:async()=>new Uint8Array([1,2]).buffer}); await expect(inspectImage(f)).rejects.toThrow('fileType'); });
  it('rejects files over 20 MiB',async()=> { const f=file(1,1); Object.defineProperty(f,'size',{value:20*1024*1024+1}); await expect(inspectImage(f)).rejects.toThrow('fileSize'); });
  it('rejects photos exceeding 50 MP',async()=> { await expect(inspectImage(file(8000,7000))).rejects.toThrow('inputLimit'); });
});
describe('composition and export',()=> {
  it('uses clipping and chosen rounded corners',()=> { const context=ctx(), s={...initialCollage(),photos:[photo],radius:24}; drawCollage(context,s,new Map([['a',source]]),'image/png'); expect(context.roundRect).toHaveBeenCalledWith(0,0,1080,1080,24); expect(context.clip).toHaveBeenCalledOnce(); expect(context.restore).toHaveBeenCalledOnce(); });
  it('keeps transparent pixels in PNG and WebP, and chosen matte for JPG',()=> { for(const format of ['image/png','image/webp','image/jpeg'] as const) { const context=ctx(); drawCollage(context,{...initialCollage(),transparent:true,color:'#12ab34'},new Map(),format); expect(context.fillRect).toHaveBeenCalledTimes(format==='image/jpeg'?1:0); if(format==='image/jpeg') expect(context.fillStyle).toBe('#12ab34'); } });
  it('uses the same exact placements for preview and export',()=> { const a=ctx(),b=ctx(),s={...initialCollage(),photos:[photo],width:800,height:500,gap:20}; drawCollage(a,s,new Map([['a',source]]),'image/png'); drawCollage(b,s,new Map([['a',source]]),'image/png'); expect(a.drawImage).toHaveBeenCalledWith(source.image,-80,10,960,480); expect(vi.mocked(a.drawImage).mock.calls).toEqual(vi.mocked(b.drawImage).mock.calls); });
  it.each(['image/jpeg','image/png','image/webp'] as const)('encodes %s at chosen dimensions and releases the output canvas',async format=> { const context=ctx(), canvas={width:0,height:0,getContext:()=>context,toBlob:(cb:BlobCallback,mime:string)=>cb(new Blob(['image'],{type:mime}))}; vi.spyOn(document,'createElement').mockReturnValue(canvas as unknown as HTMLCanvasElement); const s={...initialCollage(),width:800,height:500,photos:[photo,newCollagePhoto('b')]}; const b=await encodeCollage(s,new Map([['a',source],['b',source]]),format,95); expect(b.type).toBe(format); expect(context.clearRect).toHaveBeenCalledWith(0,0,800,500); expect([canvas.width,canvas.height]).toEqual([0,0]); });
  it('requires between 2 and 12 photos and no missing sources',async()=> { await expect(encodeCollage({...initialCollage(),photos:[photo]},new Map(),'image/png',100)).rejects.toThrow('photos'); await expect(encodeCollage({...initialCollage(),photos:Array.from({length:13},()=>photo)},new Map(),'image/png',100)).rejects.toThrow('photos'); });
});
