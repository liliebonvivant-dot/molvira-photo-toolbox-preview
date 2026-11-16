export type DeliveryOutcome = 'shared' | 'cancelled' | 'downloadStarted' | 'saveError';

// Called directly by a gesture with an already encoded file: no await before share/click.
export async function deliverConversion(blob: Blob, filename: string): Promise<DeliveryOutcome> {
  try {
    const file = new File([blob], filename, { type: blob.type });
    if (matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: filename });
        return 'shared';
      } catch (error) {
        return error instanceof Error && error.name === 'AbortError' ? 'cancelled' : 'saveError';
      }
    }
    const url = URL.createObjectURL(blob);
    try {
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      try { anchor.click(); } finally { anchor.remove(); }
      return 'downloadStarted';
    } finally {
      // Safari must still be able to read the Blob after the click.
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    }
  } catch { return 'saveError'; }
}