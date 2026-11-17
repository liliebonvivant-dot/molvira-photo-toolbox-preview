import { describe, expect, it, vi, afterEach } from 'vitest';
import { birefnetInput, birefnetMask, birefnetTarget } from '@/lib/photo/birefnet-math';
import { BiRefnetClient } from '@/lib/photo/birefnet-client';
afterEach(() => vi.unstubAllGlobals());
describe('isolated BiRefNet prototype', () => {
  it('limits experimental working copies to 2 MP without enlarging small files', () => {
    expect(birefnetTarget(1536, 1024)).toEqual({ width: 1536, height: 1024 });
    const t = birefnetTarget(8064, 6048); expect(t.width * t.height).toBeLessThanOrEqual(2_000_000);
  });
  it('normalizes RGB to the official NCHW ImageNet contract', () => {
    const t = birefnetInput(new Uint8ClampedArray([255, 0, 128, 0]), 1);
    expect(t[0]).toBeCloseTo((1 - .485) / .229, 5);
    expect(t[1]).toBeCloseTo(-.456 / .224, 5);
    expect(t[2]).toBeCloseTo((128 / 255 - .406) / .225, 5);
  });
  it('uses sigmoid logits without binary alpha hardening', () => {
    expect([...birefnetMask(new Float32Array([-20, 0, 20]))].filter((_, i) => i % 4 === 3)).toEqual([0, 128, 255]);
    expect(() => birefnetMask(new Float32Array([NaN]))).toThrow('output');
  });
  it('does not create a worker before an explicit processing request', () => {
    const worker = vi.fn(); vi.stubGlobal('Worker', worker); const client = new BiRefnetClient();
    expect(worker).not.toHaveBeenCalled(); client.dispose(); expect(worker).not.toHaveBeenCalled();
  });
  it('terminates processing and releases the worker on cancellation', async () => {
    const terminate = vi.fn(); vi.stubGlobal('Worker', class { postMessage = vi.fn(); terminate = terminate; });
    const client = new BiRefnetClient(); const abort = new AbortController();
    const result = client.run(new File(['x'], 'x.png'), { width: 1, height: 1 }, abort.signal, vi.fn());
    abort.abort(); await expect(result).rejects.toThrow('cancelled'); expect(terminate).toHaveBeenCalledOnce();
  });
});