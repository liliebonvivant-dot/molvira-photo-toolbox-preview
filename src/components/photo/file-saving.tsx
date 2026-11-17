import { useEffect, useRef, useState } from 'react';
import { Download, ExternalLink, LoaderCircle, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Language } from '@/lib/photo/content';
import { savingCopy } from '@/lib/photo/saving-copy';
import { deliverConversion, type DeliveryOutcome } from '@/lib/photo/convert-delivery';

type Result = { blob: Blob; url: string; key: string };
export function FileSaving({ lang, result, filename, title, label, processing, busy, disabled, mode = 'download' }: {
  lang: Language; result: Result | undefined; filename: string; title: string; label: string;
  processing: string; busy: boolean; disabled: boolean; mode?: 'auto' | 'download';
}) {
  const r = savingCopy[lang], id = useRef(0);
  const [status, setStatus] = useState<{ key: string; value: DeliveryOutcome | 'saving' }>();
  const [canShare, setCanShare] = useState(false);
  const key = `${result?.key}|${filename}`;
  const value = status?.key === key ? status.value : undefined;
  useEffect(() => {
    id.current++; setStatus(undefined); setCanShare(false);
    if (result) try { setCanShare(!!navigator.canShare?.({ files: [new File([result.blob], filename, { type: result.blob.type })] })); } catch {}
    return () => { id.current++; };
  }, [result, filename]);
  async function save(mode: 'download' | 'share') {
    if (!result || disabled || busy) return;
    const request = ++id.current;
    setStatus({ key, value: 'saving' });
    const value = await deliverConversion(result.blob, filename, mode === 'download' ? primaryMode : mode);
    if (request === id.current) setStatus({ key, value });
  }
  const primaryMode = mode;
  return <div className="export-section"><h3>{title}</h3>
    <Button className="resize-download" size="lg" disabled={disabled || busy || value === 'saving'} onClick={() => void save('download')}>
      {busy || value === 'saving' ? <LoaderCircle className="animate-spin"/> : <Download/>}{busy ? processing : value === 'saving' ? r.saving : label}
    </Button>
    <div role="status" aria-live="polite" aria-atomic="true"><p className="settings-hint mt-3">{busy ? processing : value ? r[value] : result && !disabled ? r.ready : null}</p></div>
    {result && !disabled && <div className="mt-3 flex flex-col gap-2">
      {canShare && <Button variant="outline" disabled={value === 'saving'} onClick={() => void save('share')}><Share2/>{r.shareFile}</Button>}
      <Button variant="outline" asChild><a href={result.url} target="_blank" rel="noopener noreferrer"><ExternalLink/>{r.openFile}</a></Button>
      <p className="settings-hint">{r.openHint}</p>
    </div>}
  </div>;
}