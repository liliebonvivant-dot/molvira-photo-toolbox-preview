import { afterEach, describe, expect, it, vi } from 'vitest';
import { deliverConversion } from '@/lib/photo/convert-delivery';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });
function setup(touch = false) {
  vi.stubGlobal('matchMedia', () => ({ matches: touch }));
  const share = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('navigator', { canShare: () => touch, share });
  const create = vi.fn().mockReturnValue('blob:test'), revoke = vi.fn();
  vi.stubGlobal('URL', { createObjectURL: create, revokeObjectURL: revoke });
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  return { share, click, create, revoke };
}
describe('conversion file delivery', () => {
  it('starts native sharing synchronously on supported touch devices with correct file type/name/content', async () => {
    const { share, click } = setup(true);
    const blob = new Blob(['encoded-png'], { type: 'image/png' });
    const pending = deliverConversion(blob, 'photo-converted.png');
    expect(share).toHaveBeenCalledTimes(1);
    const call = share.mock.calls[0];
    if (!call) throw new Error('Sharing was not invoked');
    const file = call[0].files[0];
    expect([file.name, file.type, file.size]).toEqual(['photo-converted.png', 'image/png', 11]);
    expect(await pending).toBe('shared');
    expect(click).not.toHaveBeenCalled();
  });
  it('reports cancellation without trying an automatic download after losing the gesture', async () => {
    const { share, click } = setup(true);
    share.mockRejectedValue(new DOMException('cancelled', 'AbortError'));
    expect(await deliverConversion(new Blob(['jpg'], { type: 'image/jpeg' }), 'photo.jpg')).toBe('cancelled');
    expect(click).not.toHaveBeenCalled();
  });
  it('reports share failures so the UI can offer a manual alternative', async () => {
    const { share } = setup(true); share.mockRejectedValue(new Error('blocked'));
    expect(await deliverConversion(new Blob(['x']), 'photo.png')).toBe('saveError');
  });
  it('clicks synchronously with correct extension and delays revocation, without claiming a saved download', async () => {
    vi.useFakeTimers();
    const { click, revoke } = setup();
    let name = '';
    click.mockImplementation(function (this: HTMLAnchorElement) { name = this.download; });
    const pending = deliverConversion(new Blob(['webp'], { type: 'image/webp' }), 'photo-converted.webp');
    expect(click).toHaveBeenCalledTimes(1); expect(name).toBe('photo-converted.webp');
    expect(await pending).toBe('downloadStarted');
    expect(revoke).not.toHaveBeenCalled();
    vi.advanceTimersByTime(30_000); expect(revoke).toHaveBeenCalledWith('blob:test');
  });
  it('reports click errors and removes the temporary link', async () => {
    const { click } = setup(); click.mockImplementation(() => { throw new Error('blocked'); });
    expect(await deliverConversion(new Blob(['x']), 'photo.png')).toBe('saveError');
    expect(document.querySelector('a[download]')).toBeNull();
  });
});