/** Joint bilateral upsampling: spatial interpolation guided by the source's RGB.
 * No erosion, largest-component pruning, recoloring or opacity hardening: fine
 * strands, separate objects and partial source transparency remain eligible.
 * Both arrays contain straight (not premultiplied) RGBA, as returned by Canvas.
 */
export function composeBackgroundMatte(source: Uint8ClampedArray, width: number, height: number, guide: Uint8ClampedArray, mask: Uint8ClampedArray, maskWidth: number, maskHeight: number) {
  if (source.length !== width * height * 4 || guide.length !== maskWidth * maskHeight * 4 || mask.length !== guide.length) throw new Error('processError');
  const colorVariance = 2 * 24 * 24;
  for (let y = 0; y < height; y++) {
    const fy = Math.max(0, Math.min(maskHeight - 1, (y + .5) * maskHeight / height - .5));
    const y0 = Math.floor(fy), y1 = Math.min(y0 + 1, maskHeight - 1), dy = fy - y0;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (source[i + 3] === 0) { source[i] = source[i + 1] = source[i + 2] = 0; continue; }
      const fx = Math.max(0, Math.min(maskWidth - 1, (x + .5) * maskWidth / width - .5));
      const x0 = Math.floor(fx), x1 = Math.min(x0 + 1, maskWidth - 1), dx = fx - x0;
      let sum = 0, weights = 0;
      for (let corner = 0; corner < 4; corner++) {
        const right = corner & 1, bottom = corner & 2;
        const j = ((bottom ? y1 : y0) * maskWidth + (right ? x1 : x0)) * 4;
        const spatial = (right ? dx : 1 - dx) * (bottom ? dy : 1 - dy);
        const dr = (source[i] ?? 0) - (guide[j] ?? 0), dg = (source[i + 1] ?? 0) - (guide[j + 1] ?? 0), db = (source[i + 2] ?? 0) - (guide[j + 2] ?? 0);
        const weight = spatial * Math.max(.001, Math.exp(-(dr * dr + dg * dg + db * db) / colorVariance));
        sum += (mask[j + 3] ?? 0) * weight; weights += weight;
      }
      const alpha = sum / weights;
      // Only eliminate near-zero quantization haze, not a binary hair threshold.
      source[i + 3] = Math.round((source[i + 3] ?? 0) * (alpha <= 2 ? 0 : alpha) / 255);
      if (source[i + 3] === 0) source[i] = source[i + 1] = source[i + 2] = 0;
    }
  }
  return source;
}