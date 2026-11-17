import { useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ChevronRight, ImagePlus, Image as ImageIcon, LoaderCircle, ShieldCheck, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { copy, langIndex, type Language, type Tool } from '@/lib/photo/content';
import { whiteBackgroundCopy } from '@/lib/photo/white-background-copy';
import { encodeWhite, inspectWhiteImage, loadWhiteSource, releaseWhiteSource, whiteFilename, type WhiteSource } from '@/lib/photo/white-background';
import { fallbackOffer, type ReduceOffer, type Size } from '@/lib/photo/large-image';
import type { ImageFormat } from '@/lib/photo/resize';
import { Shell, ReservedSpace } from './shell';
import { ToolIcon } from './tool-card';
import { FileSaving } from './file-saving';
import { ReducePrompt, ResolutionNote } from './reduce-prompt';

type Result = { blob: Blob; url: string; key: string; transparent: boolean; width: number; height: number };
type ErrorCode = 'fileType' | 'fileSize' | 'inputLimit' | 'decode' | 'exportError';
export function WhiteBackgroundWorkspace({ tool, lang, slug }: { tool: Tool; lang: Language; slug: string }) {
  const c = copy[lang], r = whiteBackgroundCopy[lang];
  const input = useRef<HTMLInputElement>(null), generation = useRef(0), urls = useRef(new Set<string>()), active = useRef<WhiteSource | undefined>(undefined);
  const encoding = useRef<Promise<void>>(Promise.resolve());
  const [source, setSource] = useState<WhiteSource>(), [result, setResult] = useState<Result>();
  const [pending, setPending] = useState<{ offer: ReduceOffer; header: Awaited<ReturnType<typeof inspectWhiteImage>> }>();
  const [format, setFormat] = useState<ImageFormat>('image/png'), [quality, setQuality] = useState(95);
  const [loading, setLoading] = useState(false), [busy, setBusy] = useState(false), [dragging, setDragging] = useState(false);
  const [error, setError] = useState<ErrorCode>(), [retry, setRetry] = useState(0);
  const key = `${source?.url}|${format}|${format === 'image/png' ? 100 : quality}`;
  const current = !loading && !pending && result?.key === key ? result : undefined;
  function own(blob: Blob) { const url = URL.createObjectURL(blob); urls.current.add(url); return url; }
  function revoke(url: string) { URL.revokeObjectURL(url); urls.current.delete(url); }
  useEffect(() => () => { generation.current++; releaseWhiteSource(active.current); for (const url of urls.current) URL.revokeObjectURL(url); urls.current.clear(); }, []);
  async function load(file?: File, target?: Size, knownHeader?: Awaited<ReturnType<typeof inspectWhiteImage>>) {
    if (!file || loading || busy) return;
    const id = ++generation.current;
    setLoading(true); setError(undefined); setPending(undefined);
    let header: Awaited<ReturnType<typeof inspectWhiteImage>> | undefined;
    try {
      header = knownHeader ?? await inspectWhiteImage(file);
      if (id !== generation.current) return;
      // Release the previous bitmap before decoding its replacement, never hold both.
      await encoding.current;
      if (id !== generation.current) return;
      releaseWhiteSource(active.current); active.current = undefined; setSource(undefined);
      for (const url of urls.current) URL.revokeObjectURL(url); urls.current.clear(); setResult(undefined);
      const decoded = await loadWhiteSource(file, header, target);
      if (id !== generation.current) { if ('image' in decoded) releaseWhiteSource(decoded); return; }
      if (!('image' in decoded)) { setPending({ offer: decoded, header }); return; }
      active.current = decoded; setSource(decoded);
    } catch (e) {
      const code = e instanceof Error ? e.message : '';
      if (id === generation.current) {
        const offer = header && !target ? fallbackOffer(file, header.width, header.height) : undefined;
        if (offer && header) setPending({ offer, header });
        else setError(['fileType','fileSize','inputLimit','decode'].includes(code) ? code as ErrorCode : 'decode');
      }
    } finally { if (id === generation.current) setLoading(false); }
  }
  useEffect(() => {
    const controller = new AbortController(); let output: string | undefined;
    setResult(undefined); setBusy(false);
    if (!source || loading) return;
    setBusy(true);
    const timer = setTimeout(() => {
      encoding.current = encoding.current.then(async () => {
      if (controller.signal.aborted) return;
      try {
        const encoded = await encodeWhite(source.image, format, format === 'image/png' ? 100 : quality, controller.signal);
        if (controller.signal.aborted) return;
        output = own(encoded.blob); setResult({ ...encoded, url: output, key });
      } catch { if (!controller.signal.aborted) {
        const offer = !source.reduced ? fallbackOffer(source.file, source.width, source.height) : undefined;
        if (offer) setPending({ offer, header: { width: source.originalWidth, height: source.originalHeight, format: 'image/png', channel: source.channel } });
        setError('exportError');
      } }
      finally { if (!controller.signal.aborted) setBusy(false); }
      });
    }, 200);
    return () => { controller.abort(); clearTimeout(timer); if (output) revoke(output); };
  }, [source, loading, format, quality, key, retry]);
  const dimensions = source ? `${source.image.naturalWidth.toLocaleString(lang)} × ${source.image.naturalHeight.toLocaleString(lang)} px` : '';
  return <Shell lang={lang} slug={slug}><main id="main" className="content-width tool-page resize-page background-page">
    <nav className="breadcrumbs"><Link to="/$lang" params={{ lang }}>{c.home}</Link><ChevronRight size={13}/><span>{tool.titles[langIndex(lang)]}</span></nav>
    <div className="tool-page-heading"><ToolIcon tool={tool}/><div><h1>{tool.titles[langIndex(lang)]}</h1><p>{tool.descriptions[langIndex(lang)]}</p></div></div>
    <div className="phase-notice"><ShieldCheck size={18}/><p>{r.local}</p></div>
    <div className="workspace" aria-busy={loading || busy}><div className="workspace-main">
      <section className={`upload-area ${dragging ? 'resize-dragging' : ''}`} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); void load(e.dataTransfer.files[0]); }}>
        <ImagePlus size={32}/><h2>{c.upload}</h2><p>{c.drop}</p>
        <input ref={input} className="sr-only" type="file" accept="image/png,image/webp,.png,.webp" aria-label={c.choose} disabled={loading || busy} onChange={e => { void load(e.target.files?.[0]); e.target.value = ''; }}/>
        <Button size="lg" disabled={loading || busy} onClick={() => input.current?.click()}>{loading ? <LoaderCircle className="animate-spin"/> : <ImagePlus/>}{loading ? r.processing : source ? r.another : c.choose}</Button><small>{r.formats}</small>
      </section>
      {pending && <ReducePrompt offer={pending.offer} lang={lang} onReduce={() => void load(pending.offer.file, pending.offer.reduced, pending.header)} onCancel={() => setPending(undefined)}/>}
      <div className="background-comparison mt-5">{[{ title: r.original, url: source?.url }, { title: r.result, url: current?.url }].map(item => <section className="preview-section" key={item.title}><h2>{item.title}</h2><div className="resize-image-frame">{item.url ? <img src={item.url} alt={item.title}/> : <div className="resize-empty">{busy || loading ? <LoaderCircle size={30} className="animate-spin"/> : <ImageIcon size={40}/>}<p>{busy || loading ? r.processing : r.empty}</p></div>}</div></section>)}</div>
      <p className="resize-filename">{source ? `${source.file.name} · ${dimensions}` : '\u00a0'}</p>
      {source && <ResolutionNote source={source} lang={lang}/>}
      <p className="background-progress settings-hint" role="status" aria-live="polite">{loading || busy ? r.processing : current ? `${source?.channel ? r.channel : r.noChannel}. ${current.transparent ? r.transparent : r.opaque}` : '\u00a0'}</p>
    </div><aside className="settings-panel"><h2>{c.settings}</h2>
      <fieldset className="resize-fields" disabled={!source || loading || busy}>
        <label className="setting-field"><span>{c.output}</span><select aria-label={c.output} value={format} onChange={e => { setError(undefined); setFormat(e.target.value as ImageFormat); }}><option value="image/png">PNG</option><option value="image/jpeg">JPG</option><option value="image/webp">WebP</option></select></label>
        {format !== 'image/png' && <label className="setting-field"><span>{r.quality}<small>{quality}%</small></span><input aria-label={r.quality} type="range" min={1} max={100} value={quality} onChange={e => { setError(undefined); setQuality(Number(e.target.value)); }}/></label>}
      </fieldset>
      <p className="settings-hint mt-4">{source ? `${source.reduced ? r.workingResolution : r.resolution}: ${dimensions}.` : r.formats}</p><p className="settings-hint mt-4">{r.encoding}</p>
      {error && <p className="resize-error" role="alert">{r[error]}</p>}
      <FileSaving lang={lang} result={current} filename={whiteFilename(source?.file.name ?? 'image', format)} title={c.export} label={r.download} processing={r.processing} busy={loading || busy} disabled={!current || !!error} mode="auto"/>
      {error && source && <Button variant="outline" onClick={() => { setError(undefined); setRetry(n => n + 1); }}><RotateCcw/>{r.retry}</Button>}
    </aside></div><ReservedSpace lang={lang}/>
  </main></Shell>;
}