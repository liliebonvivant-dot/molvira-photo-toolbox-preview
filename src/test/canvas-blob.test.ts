import { afterEach, describe, expect, it, vi } from 'vitest';
import { canvasBlob } from '@/lib/photo/canvas-blob';
afterEach(() => vi.useRealTimers());
describe('shared encoding safety', () => {
  it.each(['image/jpeg', 'image/png', 'image/webp'])('returns nonempty %s with quality intact and releases memory', async format => {
    const canvas = { width: 4618, height: 3464, toBlob: vi.fn((cb: BlobCallback, mime: string) => cb(new Blob(['encoded'], { type: mime }))) };
    expect((await canvasBlob(canvas as unknown as HTMLCanvasElement, format, 85)).type).toBe(format);
    expect(canvas.toBlob).toHaveBeenCalledWith(expect.any(Function), format, .85);
    expect([canvas.width, canvas.height]).toEqual([0, 0]);
  });
  it.each([null, new Blob([], { type: 'image/png' }), new Blob(['x'], { type: 'image/jpeg' })])('rejects missing, empty or mismatched output', async blob => {
    const canvas = { width: 400, height: 300, toBlob: (cb: BlobCallback) => cb(blob) };
    await expect(canvasBlob(canvas as unknown as HTMLCanvasElement, 'image/png', 90)).rejects.toThrow('exportError');
    expect([canvas.width, canvas.height]).toEqual([0, 0]);
  });
  it('stops processing after 30 seconds if the browser never returns a file', async () => {
    vi.useFakeTimers();
    const canvas = { width: 400, height: 300, toBlob: vi.fn() };
    const check = expect(canvasBlob(canvas as unknown as HTMLCanvasElement, 'image/png', 90)).rejects.toThrow('exportError');
    await vi.advanceTimersByTimeAsync(30_000); await check;
    expect([canvas.width, canvas.height]).toEqual([0, 0]);
  });
});