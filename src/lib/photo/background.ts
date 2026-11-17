import { inspectImage } from './resize';
export const backgroundLimits = { fileBytes: 20 * 1024 * 1024, pixels: 50_000_000, side: 12_000, timeout: 180_000 };
export type BackgroundSize = { width: number; height: number };
export type BackgroundProgress = { stage: 'download' | 'process'; percent?: number };
export function backgroundBudget(mobile: boolean) { return mobile ? 2_000_000 : 4_000_000; }
export function backgroundTarget(width: number, height: number, budget: number): BackgroundSize {
  const scale = Math.min(1, Math.sqrt(budget / (width * height)));
  return { width: Math.max(1, Math.floor(width * scale)), height: Math.max(1, Math.floor(height * scale)) };
}
export async function inspectBackground(file: File) { return inspectImage(file); }
export function backgroundName(name: string) { return `${name.replace(/\.[^.]+$/, '') || 'image'}-no-background.png`; }
export function removeLocalBackground(file: File, target: BackgroundSize | undefined, signal: AbortSignal, progress: (value: BackgroundProgress) => void): Promise<{ blob: Blob; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException('Cancelled', 'AbortError')); return; }
    let worker: Worker;
    try { worker = new Worker(new URL('./background-worker.ts', import.meta.url), { type: 'module' }); }
    catch { reject(new Error('unsupported')); return; }
    const finish = () => { clearTimeout(timer); signal.removeEventListener('abort', abort); worker.terminate(); };
    const abort = () => { finish(); reject(new DOMException('Cancelled', 'AbortError')); };
    const timer = setTimeout(() => { finish(); reject(new Error('timeout')); }, backgroundLimits.timeout);
    signal.addEventListener('abort', abort, { once: true });
    worker.onerror = () => { finish(); reject(new Error('processError')); };
    worker.onmessage = (event: MessageEvent<{ progress?: BackgroundProgress; error?: string; blob?: Blob; width: number; height: number }>) => {
      const data = event.data;
      if (data.progress) { progress(data.progress); return; }
      finish();
      if (data.blob?.type === 'image/png' && data.blob.size > 0) resolve({ blob: data.blob, width: data.width, height: data.height });
      else reject(new Error(data.error || 'processError'));
    };
    worker.postMessage({ file, target });
  });
}