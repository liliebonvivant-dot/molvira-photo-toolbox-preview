export type BiMetrics = { downloadMs: number; modelBytes: number; reused: boolean; sessionMs: number; inferenceMs: number; totalMs: number; heapPeak?: number | undefined; tensorBytes: number; width: number; height: number };
export type BiResult = { blob: Blob; metrics: BiMetrics };
export class BiRefnetClient {
  private worker: Worker | undefined;
  private active: ((error: Error) => void) | undefined;
  private sequence = 0;
  dispose() { this.worker?.terminate(); this.worker = undefined; this.active?.(new Error('cancelled')); this.active = undefined; }
  run(file: File, target: { width: number; height: number }, signal: AbortSignal, progress: (stage: string) => void): Promise<BiResult> {
    if (signal.aborted) return Promise.reject(new Error('cancelled'));
    if (this.active) return Promise.reject(new Error('busy'));
    return new Promise((resolve, reject) => {
      const id = ++this.sequence;
      if (!this.worker) this.worker = new Worker(new URL('./birefnet-worker.ts', import.meta.url), { type: 'module' });
      const worker = this.worker;
      const finish = () => { clearTimeout(timer); signal.removeEventListener('abort', abort); this.active = undefined; };
      this.active = error => { finish(); reject(error); };
      const abort = () => this.dispose();
      const timer = setTimeout(() => { finish(); this.dispose(); reject(new Error('timeout')); }, 240_000);
      signal.addEventListener('abort', abort, { once: true });
      worker.onerror = () => { finish(); this.dispose(); reject(new Error('process')); };
      worker.onmessage = (event: MessageEvent<{ id: number; stage?: string; error?: string; result?: BiResult }>) => {
        if (event.data.id !== id) return;
        if (event.data.stage) { progress(event.data.stage); return; }
        finish();
        if (event.data.result?.blob.size) resolve(event.data.result);
        else { this.dispose(); reject(new Error(event.data.error ?? 'process')); }
      };
      worker.postMessage({ id, file, target });
    });
  }
}