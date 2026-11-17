export const birefnetLimits = { fileBytes: 20 * 1024 * 1024, pixels: 50_000_000, side: 12_000, workingPixels: 2_000_000, timeout: 240_000 };
export function birefnetTarget(width: number, height: number) {
  const scale = Math.min(1, Math.sqrt(birefnetLimits.workingPixels / (width * height)));
  return { width: Math.max(1, Math.floor(width * scale)), height: Math.max(1, Math.floor(height * scale)) };
}
export function birefnetInput(rgba: Uint8ClampedArray, side = 1024) {
  const pixels = side * side;
  if (rgba.length !== pixels * 4) throw new Error('input');
  const tensor = new Float32Array(pixels * 3);
  const means = [.485, .456, .406], deviations = [.229, .224, .225];
  for (let c = 0; c < 3; c++) for (let i = 0; i < pixels; i++) tensor[c * pixels + i] = ((rgba[i * 4 + c] ?? 0) / 255 - (means[c] ?? 0)) / (deviations[c] ?? 1);
  return tensor;
}
export function birefnetMask(logits: Float32Array) {
  const rgba = new Uint8ClampedArray(logits.length * 4);
  for (let i = 0; i < logits.length; i++) {
    const value = logits[i];
    if (value === undefined || !Number.isFinite(value)) throw new Error('output');
    rgba[i * 4 + 3] = Math.round(255 / (1 + Math.exp(-value)));
  }
  return rgba;
}