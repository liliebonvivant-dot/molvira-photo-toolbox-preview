import { afterEach, describe, expect, it, vi } from 'vitest';
import { alphaChannel, encodeWhite, flattenWhite, inspectWhiteImage, whiteFilename } from '@/lib/photo/white-background';
afterEach(() => vi.restoreAllMocks());

describe('white background rules', () => {
  it('replaces fully transparent pixels with pure #FFFFFF regardless of hidden RGB', () => {
    const pixels = new Uint8ClampedArray([18, 42, 93, 0]);
    expect(flattenWhite(pixels)).toBe(true);
    expect([...pixels]).toEqual([255, 255, 255, 255]);
  });
  it('composites partial transparency over white without hardening the edge', () => {
    const pixels = new Uint8ClampedArray([255, 0, 0, 128]);
    flattenWhite(pixels); expect([...pixels]).toEqual([255, 127, 127, 255]);
  });
  it('preserves softened edge progression without erosion or extra matte', () => {
    const pixels = new Uint8ClampedArray([0,0,0,1, 0,0,0,64, 0,0,0,192, 0,0,0,254]);
    flattenWhite(pixels); expect([...pixels]).toEqual([254,254,254,255, 191,191,191,255, 63,63,63,255, 1,1,1,255]);
  });
  it('reports no transparency and preserves all visible RGB for opaque input', () => {
    const pixels = new Uint8ClampedArray([23, 71, 193, 255]);
    expect(flattenWhite(pixels)).toBe(false); expect([...pixels]).toEqual([23,71,193,255]);
  });
  it('detects PNG alpha and palette transparency separately from opacity', () => {
    const bytes = new Uint8Array(45); bytes[0]=137; bytes[25]=6;
    expect(alphaChannel(bytes)).toBe(true); bytes[25]=2;
    expect(alphaChannel(bytes)).toBe(false);
    bytes.set([...('tRNS')].map(c=>c.charCodeAt(0)), 12);
    expect(alphaChannel(bytes)).toBe(true);
  });
  it('detects WebP alpha flags', () => {
    const bytes = new Uint8Array(30); const tag=(offset:number,value:string)=>bytes.set([...value].map(c=>c.charCodeAt(0)),offset);
    tag(0,'RIFF'); tag(8,'WEBP'); tag(12,'VP8X'); bytes[16]=10; bytes[20]=16;
    expect(alphaChannel(bytes)).toBe(true); bytes[20]=0; expect(alphaChannel(bytes)).toBe(false);
  });
  it('names all three export formats without changing the source filename', () => {
    expect(whiteFilename('logo.png','image/jpeg')).toBe('logo-white.jpg');
    expect(whiteFilename('logo.png','image/png')).toBe('logo-white.png');
    expect(whiteFilename('logo.png','image/webp')).toBe('logo-white.webp');
  });
  it('rejects JPG uploads instead of suggesting background removal', async () => {
    const bytes = new Uint8Array([255,216,255,192,0,8,8,0,1,0,1,1]);
    const file = { size: bytes.length, arrayBuffer: async () => bytes.buffer } as File;
    await expect(inspectWhiteImage(file)).rejects.toThrow('fileType');
  });
  it.each(['image/jpeg','image/png','image/webp'] as const)('encodes %s at original resolution and releases canvas memory', async format => {
    const pixels = new Uint8ClampedArray([0,0,0,0, 23,71,193,255]);
    const context = { drawImage: vi.fn(), getImageData: vi.fn(() => ({ data: pixels })), putImageData: vi.fn() };
    const canvas = { width: 0, height: 0, getContext: () => context, toBlob: vi.fn((cb: BlobCallback, mime: string) => {
      expect([canvas.width,canvas.height]).toEqual([2,1]);
      expect([...pixels]).toEqual([255,255,255,255,23,71,193,255]);
      cb(new Blob(['encoded'], { type: mime }));
    }) };
    vi.spyOn(document,'createElement').mockReturnValue(canvas as unknown as HTMLCanvasElement);
    const result = await encodeWhite({ naturalWidth: 2, naturalHeight: 1 } as HTMLImageElement, format, 95);
    expect(result.blob.type).toBe(format); expect(result.transparent).toBe(true);
    expect([result.width,result.height]).toEqual([2,1]);
    expect([canvas.width,canvas.height]).toEqual([0,0]);
  });
});