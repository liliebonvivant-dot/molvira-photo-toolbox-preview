import { describe, expect, it } from 'vitest';
import { composeBackgroundMatte } from '@/lib/photo/background-matte';
const rgba = (values: number[][]) => new Uint8ClampedArray(values.flat());
describe('background matte edge composition', () => {
  it('preserves original partial transparency by multiplying, never replacing alpha', () => {
    const output = composeBackgroundMatte(rgba([[80,90,100,128]]),1,1,rgba([[80,90,100,255]]),rgba([[255,255,255,128]]),1,1);
    expect([...output]).toEqual([80,90,100,64]);
  });
  it('retains soft hair/fur alpha and original RGB without a white or black matte', () => {
    const output = composeBackgroundMatte(rgba([[10,30,50,255]]),1,1,rgba([[10,30,50,255]]),rgba([[255,255,255,20]]),1,1);
    expect([...output]).toEqual([10,30,50,20]);
  });
  it('removes only near-zero residual haze', () => {
    const output = composeBackgroundMatte(rgba([[120,30,50,255]]),1,1,rgba([[120,30,50,255]]),rgba([[0,0,0,2]]),1,1);
    expect([...output]).toEqual([0,0,0,0]);
  });
  it('never restores pixels transparent in the source', () => {
    expect([...composeBackgroundMatte(rgba([[10,20,30,0]]),1,1,rgba([[10,20,30,255]]),rgba([[0,0,0,255]]),1,1)]).toEqual([0,0,0,0]);
  });
  it('guides interpolation away from differently colored background pixels', () => {
    const guide=rgba([[200,30,20,255],[20,200,30,255]]), mask=rgba([[0,0,0,255],[0,0,0,0]]);
    const source=rgba([[200,30,20,255],[200,30,20,255],[20,200,30,255],[20,200,30,255]]);
    const out=composeBackgroundMatte(source,4,1,guide,mask,2,1);
    expect(out[7]).toBeGreaterThan(250); expect(out[11]).toBe(0);
    expect([...out.slice(4,7)]).toEqual([200,30,20]);
  });
  it('retains disconnected opaque subjects instead of deleting smaller components', () => {
    const source=rgba([[50,50,50,255],[50,50,50,255],[50,50,50,255]]);
    const mask=rgba([[0,0,0,255],[0,0,0,0],[0,0,0,255]]);
    const out=composeBackgroundMatte(source,3,1,source.slice(),mask,3,1);
    expect([out[3],out[7],out[11]]).toEqual([255,0,255]);
  });
});