import { afterEach, describe, expect, it, vi } from 'vitest';
import { commitLayers, currencies, drawEditor, duplicateLayer, editorFilename, editorLimits, encodeEditor, hitLayer, layerRect, layerText, newLayer, redoLayers, reorderLayer, undoLayers, type EditorHistory } from '@/lib/photo/text-editor';
import { inspectImage } from '@/lib/photo/resize';
afterEach(() => vi.restoreAllMocks());
function context() {
  const ctx = { font: '', globalAlpha: 1, fillStyle: '', textBaseline: '', clearRect: vi.fn(), fillRect: vi.fn(), drawImage: vi.fn(), save: vi.fn(), restore: vi.fn(), fillText: vi.fn(), measureText: vi.fn(() => ({ width: 120 })), imageSmoothingEnabled: false, imageSmoothingQuality: '' };
  return ctx as unknown as CanvasRenderingContext2D;
}
describe('independent editable local layers', () => {
  it('adds multiple independent texts and edits only the selected one', () => {
    const a = { ...newLayer('a', 'text'), text: 'Arthur' }, b = { ...newLayer('b', 'text'), text: 'MOLVIRA' };
    const h = commitLayers({ past: [], present: [a, b], future: [] }, [a, { ...b, text: 'PHOTO' }]);
    expect(h.present.map(l => l.text)).toEqual(['Arthur', 'PHOTO']); expect(h.past[0]?.[1]?.text).toBe('MOLVIRA');
  });
  it.each(currencies)('keeps the literal price value with %s, without currency conversion', currency => {
    expect(layerText({ ...newLayer('price', 'price'), currency, text: '1.234,56' })).toBe(`${currency} 1.234,56`);
  });
  it.each([
    ['R$', 'R$ 19,90', 'R$ 19,90'], ['R$', '19,90', 'R$ 19,90'],
    ['$', 'USD 2,345.67', '$ 2,345.67'], ['€', '1.234,56 €', '€ 1.234,56'],
    ['£', '$ 1,234.56', '£ 1,234.56'], ['R$', 'R$ R$ 19,90', 'R$ 19,90'],
    ['$', '€', ''],
  ] as const)('normalizes recognized markers in %s / %s without altering the amount', (currency, text, expected) => {
    const layer = { ...newLayer('price', 'price'), currency, text };
    expect(layerText(layer)).toBe(expected); expect(layer.text).toBe(text);
  });
  it('brings a layer to front and sends it to back', () => {
    const layers = [newLayer('a', 'text'), newLayer('b', 'price'), newLayer('c', 'logo')];
    expect(reorderLayer(layers, 'a', 'front').map(l => l.id)).toEqual(['b', 'c', 'a']);
    expect(reorderLayer(layers, 'c', 'back').map(l => l.id)).toEqual(['c', 'a', 'b']);
  });
  it('duplicates editable elements without cloning decoded logo memory', () => {
    const logo = newLayer('a', 'logo', 'asset'); const layers = duplicateLayer([logo], 'a', 'b');
    expect(layers.map(l => l.id)).toEqual(['a', 'b']); expect(layers[1]?.asset).toBe('asset'); expect(layers[1]?.x).toBe(13);
  });
  it('undoes and redoes individual deletion and clears redo after a new edit', () => {
    const a = newLayer('a', 'text'), b = newLayer('b', 'logo', 'asset');
    const h = commitLayers({ past: [], present: [a, b], future: [] }, [a]);
    expect(undoLayers(h).present).toEqual([a, b]); expect(redoLayers(undoLayers(h)).present).toEqual([a]);
    expect(commitLayers(undoLayers(h), [b]).future).toEqual([]);
  });
  it('bounds undo history to 30 steps', () => {
    let h: EditorHistory = { past: [], present: [], future: [] };
    for (let i = 0; i < 40; i++) h = commitLayers(h, [{ ...newLayer('a', 'text'), text: String(i) }]);
    expect(h.past.length).toBe(30); expect(h.past[0]?.[0]?.text).toBe('9');
  });
  it('bounds elements to 50 on duplication', () => {
    const layers = Array.from({ length: 50 }, (_, i) => newLayer(String(i), 'text'));
    expect(duplicateLayer(layers, '0', 'new')).toBe(layers); expect(editorLimits.logoPixels).toBe(16_000_000);
  });
  it('selects the topmost overlapping element', () => {
    const rect = layerRect(context(), 1000, 800, newLayer('a', 'text'), new Map());
    expect(hitLayer([{ id: 'back', rect }, { id: 'front', rect }], 110, 90)).toBe('front'); expect(hitLayer([{ id: 'a', rect }], 1, 1)).toBeUndefined();
  });
});
describe('native-resolution editor composition', () => {
  it('keeps logo proportions at different sizes and retains alpha through drawImage', () => {
    const logo = { naturalWidth: 200, naturalHeight: 100 } as HTMLImageElement;
    const ctx = context(), layer = { ...newLayer('a', 'logo', 'logo'), opacity: 25 };
    const rect = layerRect(ctx, 1000, 800, layer, new Map([['logo', logo]]));
    expect([rect.width, rect.height]).toEqual([200, 100]);
    expect(layerRect(ctx, 1000, 800, { ...layer, size: 40 }, new Map([['logo', logo]])).height).toBe(200);
    drawEditor(ctx, {} as HTMLImageElement, 1000, 800, [layer], new Map([['logo', logo]]), 'image/png');
    expect(ctx.drawImage).toHaveBeenLastCalledWith(logo, 100, 80, 200, 100); expect(ctx.globalAlpha).toBe(.25);
  });
  it('renders text color, font, bold, italic, multiline content and opacity', () => {
    const ctx = context(); drawEditor(ctx, {} as HTMLImageElement, 1000, 800, [{ ...newLayer('a', 'text'), text: 'Line 1\nLine 2', font: 'Georgia', bold: true, italic: true, color: '#ff0000', opacity: 40 }], new Map(), 'image/png');
    expect(ctx.font).toBe('italic bold 60px "Georgia"'); expect(ctx.globalAlpha).toBe(.4); expect(ctx.fillStyle).toBe('#ff0000'); expect(ctx.fillText).toHaveBeenNthCalledWith(2, 'Line 2', 100, 155);
  });
  it('draws prices with or without a background tag', () => {
    const ctx = context(), price = { ...newLayer('p', 'price'), text: '99', currency: '€' as const, tag: true, tagColor: '#ff0000' };
    drawEditor(ctx, {} as HTMLImageElement, 1000, 800, [price], new Map(), 'image/png');
    expect(ctx.fillRect).toHaveBeenCalledWith(100, 80, 150, 105); expect(ctx.fillText).toHaveBeenCalledWith('€ 99', 115, 95);
    const simple = context(); drawEditor(simple, {} as HTMLImageElement, 1000, 800, [{ ...price, tag: false }], new Map(), 'image/png'); expect(simple.fillRect).not.toHaveBeenCalled();
  });
  it('uses the same source-coordinate layout for preview and export', () => {
    const ctx = context(), layer = { ...newLayer('a', 'text'), text: 'Sharp', x: 25, y: 30 };
    const a = drawEditor(ctx, {} as HTMLImageElement, 6000, 4000, [layer], new Map(), 'image/png');
    const b = drawEditor(context(), {} as HTMLImageElement, 6000, 4000, [layer], new Map(), 'image/png');
    expect(a).toEqual(b); expect(a[0]?.rect.x).toBe(1500); expect(a[0]?.rect.y).toBe(1200);
  });
  it('adds pure white only for JPG transparency', () => {
    for (const format of ['image/jpeg', 'image/png', 'image/webp'] as const) { const ctx = context(); drawEditor(ctx, {} as HTMLImageElement, 400, 300, [], new Map(), format); expect(ctx.fillRect).toHaveBeenCalledTimes(format === 'image/jpeg' ? 1 : 0); if (format === 'image/jpeg') expect(ctx.fillStyle).toBe('#ffffff'); }
  });
  it.each(['image/jpeg', 'image/png', 'image/webp'] as const)('exports %s at original dimensions and releases canvas', async format => {
    const ctx = context(), canvas = { width: 0, height: 0, getContext: () => ctx, toBlob: (callback: BlobCallback, mime: string) => callback(new Blob(['image'], { type: mime })) };
    vi.spyOn(document, 'createElement').mockReturnValue(canvas as unknown as HTMLCanvasElement);
    const blob = await encodeEditor({} as HTMLImageElement, 6000, 4000, [], new Map(), format, 95);
    expect(blob.type).toBe(format); expect(ctx.drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 6000, 4000); expect([canvas.width, canvas.height]).toEqual([0, 0]);
    expect(editorFilename('photo.png', format)).toBe(`photo-edited.${format === 'image/jpeg' ? 'jpg' : format === 'image/png' ? 'png' : 'webp'}`);
  });
  it('rejects invalid image content rather than trusting a JPG extension', async () => {
    const file = new File(['invalid'], 'image.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('invalid').buffer });
    await expect(inspectImage(file)).rejects.toThrow('fileType');
  });
});