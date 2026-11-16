// Shared bounded encoding; never leave a missing callback spinning indefinitely.
export function canvasBlob(canvas: HTMLCanvasElement, format: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const release = () => { canvas.width = 0; canvas.height = 0; };
    const fail = () => { if (settled) return; settled = true; clearTimeout(timer); release(); reject(new Error('exportError')); };
    const timer = setTimeout(fail, 30_000);
    try {
      canvas.toBlob(blob => {
        if (settled) return;
        settled = true; clearTimeout(timer); release();
        if (blob?.type === format && blob.size > 0) resolve(blob); else reject(new Error('exportError'));
      }, format, quality / 100);
    } catch { fail(); }
  });
}