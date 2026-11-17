import { useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ChevronRight, ImagePlus, Image as ImageIcon, LoaderCircle, ShieldCheck, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { copy, langIndex, type Language, type Tool } from '@/lib/photo/content';
import { whiteBackgroundCopy } from '@/lib/photo/white-background-copy';
import { encodeWhite, inspectWhiteImage, whiteFilename } from '@/lib/photo/white-background';
import type { ImageFormat } from '@/lib/photo/resize';
import { Shell, ReservedSpace } from './shell';
import { ToolIcon } from './tool-card';
import { FileSaving } from './file-saving';

type Source = { file: File; image: HTMLImageElement; url: string; channel: boolean };
type Result = { blob: Blob; url: string; key: string; transparent: boolean; width: number; height: number };
type ErrorCode = 'fileType' | 'fileSize' | 'inputLimit' | 'decode' | 'exportError';
export function WhiteBackgroundWorkspace({ tool, lang, slug }: { tool: Tool; lang: Language; slug: string }) {
  const c = copy[lang], r = whiteBackgroundCopy[lang];
  const input = useRef<HTMLInputElement>(null), generation = useRef(0), urls = useRef(new Set<string>()), active = useRef<HTMLImageElement | undefined>(undefined);
  const [source, setSource] = useState<Source>(), [result, setResult] = useState<Result>();
  const [format, setFormat] = useState<ImageFormat>('image/png'), [quality, setQuality] = useState(95);
  const [loading, setLoading] = useState(false), [busy, setBusy] = useState(false), [dragging, setDragging] = useState(false);
  const [error, setError] = useState<ErrorCode>(), [retry, setRetry] = useState(0);
  const key = `${source?.url}|${format}|${format === 'image/png' ? 100 : quality}`;
  const current = !loading && result?.key === key ? result : undefined;
  function own(blob: Blob) { const url = URL.createObjectURL(blob); urls.current.add(url); return url; }
  function revoke(url: string) { URL.revokeObjectURL(url); urls.current.delete(url); }
  useEffect(() => () => { generation.current++; if (active.current) active.current.src = ''; for (const url of urls.current) URL.revokeObjectURL(url); urls.current.clear(); }, []);
  async function load(file?: File) {
    if (!file || loading || busy) return;
    const id = ++generation.current; let url: string | undefined;
    setLoading(true); setError(undefined);
    try {
      const header = await inspectWhiteImage(file);
      if (id !== generation.current) return;
      url = own(file); const image = new window.Image(); image.src = url; await image.decode();
      if (id !== generation.current) { image.src = ''; revoke(url); return; }
      if (!image.naturalWidth || !image.naturalHeight) throw new Error('decode');
      if (source) { source.image.src = ''; revoke(source.url); }
      active.current = image;
      setSource({ file, image, url, channel: header.channel });
    } catch (e) {
      if (url) revoke(url);
      const code = e instanceof Error ? e.message : '';
      if (id === generation.current) setError(['fileType','fileSize','inputLimit','decode'].includes(code) ? code as ErrorCode : 'decode');
    } finally { if (id === generation.current) setLoading(false); }
  }
  useEffect(() => {
    let cancelled = false, output: string | undefined;
    setResult(undefined); setBusy(false);
    if (!source || loading) return;
    setBusy(true);
    const timer = setTimeout(async () => {
      try {
        const encoded = await encodeWhite(source.image, format, format === 'image/png' ? 100 : quality);
        if (cancelled) return;
        output = own(encoded.blob); setResult({ ...encoded, url: output, key });
      } catch { if (!cancelled) setError('exportError'); }
      finally { if (!cancelled) setBusy(false); }
    }, 200);
    return () => { cancelled = true; clearTimeout(timer); if (output) revoke(output); };
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
      <div className="background-comparison mt-5">{[{ title: r.original, url: source?.url }, { title: r.result, url: current?.url }].map(item => <section className="preview-section" key={item.title}><h2>{item.title}</h2><div className="resize-image-frame">{item.url ? <img src={item.url} alt={item.title}/> : <div className="resize-empty">{busy || loading ? <LoaderCircle size={30} className="animate-spin"/> : <ImageIcon size={40}/>}<p>{busy || loading ? r.processing : r.empty}</p></div>}</div></section>)}</div>
      <p className="resize-filename">{source ? `${source.file.name} · ${dimensions}` : '\u00a0'}</p>
      <p className="background-progress settings-hint" role="status" aria-live="polite">{loading || busy ? r.processing : current ? `${source?.channel ? r.channel : r.noChannel}. ${current.transparent ? r.transparent : r.opaque}` : '\u00a0'}</p>
    </div><aside className="settings-panel"><h2>{c.settings}</h2>
      <fieldset className="resize-fields" disabled={!source || loading || busy}>
        <label className="setting-field"><span>{c.output}</span><select aria-label={c.output} value={format} onChange={e => { setError(undefined); setFormat(e.target.value as ImageFormat); }}><option value="image/png">PNG</option><option value="image/jpeg">JPG</option><option value="image/webp">WebP</option></select></label>
        {format !== 'image/png' && <label className="setting-field"><span>{r.quality}<small>{quality}%</small></span><input aria-label={r.quality} type="range" min={1} max={100} value={quality} onChange={e => { setError(undefined); setQuality(Number(e.target.value)); }}/></label>}
      </fieldset>
      <p className="settings-hint mt-4">{source ? `${r.resolution}: ${dimensions}.` : r.formats}</p><p className="settings-hint mt-4">{r.encoding}</p>
      {error && <p className="resize-error" role="alert">{r[error]}</p>}
      <FileSaving lang={lang} result={current} filename={whiteFilename(source?.file.name ?? 'image', format)} title={c.export} label={r.download} processing={r.processing} busy={loading || busy} disabled={!current || !!error} mode="auto"/>
      {error && source && <Button variant="outline" onClick={() => { setError(undefined); setRetry(n => n + 1); }}><RotateCcw/>{r.retry}</Button>}
    </aside></div><ReservedSpace lang={lang}/>
  </main></Shell>;
}