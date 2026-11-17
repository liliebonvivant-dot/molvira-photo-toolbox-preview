// Browser-safe geometry for the internal-only harness; no route imports this file.
export function letterbox(width, height, side = 512) {
  if (![width, height, side].every(v => Number.isInteger(v) && v > 0)) throw new Error('dimensions');
  const scale = Math.min(side / width, side / height);
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  return { width: w, height: h, x: Math.floor((side - w) / 2), y: Math.floor((side - h) / 2), side };
}
export function validateWorkingSize(width, height) {
  if (![width, height].every(v => Number.isInteger(v) && v > 0) || width * height > 2_000_000) throw new Error('explicit-reduction-required');
  return { width, height };
}