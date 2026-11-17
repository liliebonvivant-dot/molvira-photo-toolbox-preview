import { describe, expect, it } from 'vitest';
import { letterbox, validateWorkingSize } from '../../.lovable/experiments/birefnet/internal/geometry.mjs';

describe('internal-only BiRefNet geometry', () => {
  it('preserves landscape proportions instead of stretching to a square', () => {
    expect(letterbox(1536, 1024)).toEqual({ width: 512, height: 341, x: 0, y: 85, side: 512 });
  });
  it('preserves portrait proportions and centers padding', () => {
    expect(letterbox(1024, 1536)).toEqual({ width: 341, height: 512, x: 85, y: 0, side: 512 });
  });
  it('leaves square geometry unchanged', () => {
    expect(letterbox(512, 512)).toEqual({ width: 512, height: 512, x: 0, y: 0, side: 512 });
  });
  it('rejects excessive working size without silently reducing it', () => {
    expect(() => validateWorkingSize(8064, 6048)).toThrow('explicit-reduction-required');
    expect(validateWorkingSize(1536, 1024)).toEqual({ width: 1536, height: 1024 });
  });
  it('rejects invalid dimensions before allocating canvas or model resources', () => {
    expect(() => letterbox(0, 1024)).toThrow('dimensions');
    expect(() => validateWorkingSize(-1, 100)).toThrow('explicit-reduction-required');
  });
});