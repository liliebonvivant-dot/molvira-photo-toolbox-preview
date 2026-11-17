import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ChevronRight, ImagePlus, Image as ImageIcon, ShieldCheck, LoaderCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { copy, langIndex, tools, type Language, type Tool } from '@/lib/photo/content';
import { resizeCopy } from '@/lib/photo/resize-copy';
import { convertCopy } from '@/lib/photo/convert-copy';
import { compressCopy } from '@/lib/photo/compress-copy';
import { compressImage, compressionLevels, compressionName, compressionStats, compressionReduceOffer } from '@/lib/photo/compress';
import { conversionDimensionError, decodeHeif, encodeConversion, formatLabel, inspectConversion, type SourceFormat } from '@/lib/photo/convert';
import type { ImageFormat } from '@/lib/photo/resize';
import { type ReduceOffer, type Size } from '@/lib/photo/large-image';
import { ReducePrompt, px } from './reduce-prompt';
import { Shell, ReservedSpace } from './shell';
import { ToolCard, ToolIcon } from './tool-card';
import { FileSaving } from './file-saving';

type Source = { file: File; image: HTMLImageElement; url: string; originalUrl: string; format: SourceFormat; width: number; height: number; originalWidth: number; originalHeight: number; reduced: boolean };
type Result = { blob: Blob; url: string; key: string };
type ErrorCode = 'fileType' | 'fileSize' | 'decode' | 'inputLimit' | 'exportError' | 'heicError';
function errorCode(e: unknown): ErrorCode {
 const code = e instanceof Error ? e.message : '';
 return ['fileType','fileSize','decode','inputLimit','exportError','heicError'].includes(code) ? code as ErrorCode : 'decode';
}
export function CompressWorkspace({ tool, lang, slug }: { tool: Tool; lang: Language; slug: string }) {
 const c = copy[lang], r = { ...resizeCopy[lang], ...convertCopy[lang], ...compressCopy[lang] };
 const input = useRef<HTMLInputElement>(null), request = useRef(0), controller = useRef<AbortController | undefined>(undefined), urls = useRef(new Set<string>());
 const [source, setSource] = useState<Source>(), [result, setResult] = useState<Result>();
 const [format, setFormat] = useState<ImageFormat>('image/jpeg'), [quality, setQuality] = useState(75);
 const [loading, setLoading] = useState(false), [busy, setBusy] = useState(false), [dragging, setDragging] = useState(false);
 const [error, setError] = useState<ErrorCode>(), [pending, setPending] = useState<ReduceOffer>(), [retry, setRetry] = useState(0);
 const key = `${source?.url}|${format}|${format === 'image/png' ? 100 : quality}`;
 const current = !loading && result?.key === key ? result : undefined;
 const originalResult = useMemo(() => source ? { blob: source.file, url: source.originalUrl, key: source.originalUrl } : undefined, [source]);
 function chooseFormat(value: ImageFormat) { setError(undefined); setFormat(value); }
 function chooseQuality(value: number) { setError(undefined); setQuality(value); }
 const level = (Object.keys(compressionLevels) as (keyof typeof compressionLevels)[]).find(k => compressionLevels[k] === quality) ?? 'custom';
 function own(blob: Blob) { const url = URL.createObjectURL(blob); urls.current.add(url); return url; }
 function revoke(url: string) { URL.revokeObjectURL(url); urls.current.delete(url); }
 useEffect(() => () => { request.current++; controller.current?.abort(); for (const url of urls.current) URL.revokeObjectURL(url); urls.current.clear(); }, []);
 async function load(file?: File, target?: Size) {
  if (!file || loading) return;
  const id = ++request.current; controller.current?.abort(); const abort = new AbortController(); controller.current = abort;
  setLoading(true); setPending(undefined); setError(undefined);
  const localUrls: string[] = [];
  try {
   const header = await inspectConversion(file);
   if (id !== request.current) return;
   const offer = !target ? compressionReduceOffer(file, header.width, header.height) : undefined;
   if (offer) { setPending(offer); return; }
   const originalUrl = own(file); localUrls.push(originalUrl);
   let url = originalUrl, image = new window.Image(); image.src = url;
   try { await image.decode(); }
   catch {
    if (header.format !== 'image/heic' && header.format !== 'image/heif') throw new Error('decode');
    const blob = await decodeHeif(file, abort.signal, target);
    url = own(blob); localUrls.push(url); image = new window.Image(); image.src = url; await image.decode();
   }
   if (id !== request.current) { localUrls.forEach(revoke); return; }
   const iw = image.naturalWidth, ih = image.naturalHeight;
   if (conversionDimensionError(iw, ih)) throw new Error('inputLimit');
   // Native decoders honor orientation. A target follows the decoded axes.
   const dimensions = target ? ((iw > ih) === (target.width > target.height) ? target : { width: target.height, height: target.width }) : { width: iw, height: ih };
   if (target && (iw !== dimensions.width || ih !== dimensions.height)) {
    const blob = await encodeConversion(image, 'image/png', 100, dimensions.width, dimensions.height);
    const reducedUrl = own(blob); localUrls.push(reducedUrl);
    image.src = ''; if (url !== originalUrl) revoke(url);
    url = reducedUrl; image = new window.Image(); image.src = url; await image.decode();
   }
   if (id !== request.current) { localUrls.forEach(revoke); return; }
   if (source) { source.image.src = ''; revoke(source.url); if (source.originalUrl !== source.url) revoke(source.originalUrl); }
   setSource({ file, image, url, originalUrl, format: header.format, width: dimensions.width, height: dimensions.height,
    originalWidth: target ? header.width : iw, originalHeight: target ? header.height : ih, reduced: !!target });
   setFormat(header.format === 'image/heic' || header.format === 'image/heif' ? 'image/jpeg' : header.format); setQuality(75);
  } catch (e) {
   localUrls.forEach(revoke);
   if (id === request.current) {
     try { const header = await inspectConversion(file); const offer = !target ? compressionReduceOffer(file, header.width, header.height, true) : undefined;
     if (offer) setPending(offer); else setError(errorCode(e));
    } catch { setError(errorCode(e)); }
   }
  } finally { if (id === request.current) setLoading(false); }
 }
 useEffect(() => {
  let cancelled = false, output: string | undefined;
  setResult(undefined); setBusy(false);
  if (!source || loading) return;
  setBusy(true);
  const timer = setTimeout(async () => {
   try {
    const blob = await compressImage(source, format, quality);
    if (cancelled) return;
    output = own(blob); setResult({ blob, url: output, key });
   } catch (e) {
    if (cancelled) return;
    const offer = !source.reduced ? compressionReduceOffer(source.file, source.originalWidth, source.originalHeight, true) : undefined;
    if (offer) setPending(offer); else setError(errorCode(e));
   } finally { if (!cancelled) setBusy(false); }
  }, 250);
  return () => { cancelled = true; clearTimeout(timer); if (output) revoke(output); };
 }, [source, loading, key, format, quality, retry]);
 const stats = source && current ? compressionStats(source.file.size, current.blob.size) : undefined;
 const size = (n: number) => n >= 1048576 ? `${(n / 1048576).toLocaleString(lang, { maximumFractionDigits: 2 })} MiB` : `${(n / 1024).toLocaleString(lang, { maximumFractionDigits: 2 })} KiB`;
 return <Shell lang={lang} slug={slug}><main id="main" className="content-width tool-page resize-page">
  <nav className="breadcrumbs"><Link to="/$lang" params={{ lang }}>{c.home}</Link><ChevronRight size={13}/><span>{tool.titles[langIndex(lang)]}</span></nav>
  <div className="tool-page-heading"><ToolIcon tool={tool}/><div><h1>{tool.titles[langIndex(lang)]}</h1><p>{tool.descriptions[langIndex(lang)]}</p></div></div>
  <div className="phase-notice"><ShieldCheck size={18}/><p>{r.local}</p></div>
  <div className="workspace" aria-busy={loading || busy}><div className="workspace-main">
   <section className={`upload-area ${dragging ? 'resize-dragging' : ''}`} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); void load(e.dataTransfer.files[0]); }}>
    <ImagePlus size={32}/><h2>{c.upload}</h2><p>{c.drop}</p>
    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif" className="sr-only" aria-label={c.choose} tabIndex={-1} onChange={e => { void load(e.target.files?.[0]); e.target.value = ''; }}/>
    <Button size="lg" disabled={loading} onClick={() => input.current?.click()}>{loading ? <LoaderCircle className="animate-spin"/> : <ImagePlus/>}{loading ? r.processing : source ? r.another : c.choose}</Button><small>{r.formats}</small>
   </section>
   {pending && <ReducePrompt offer={pending} lang={lang} onReduce={() => void load(pending.file, pending.reduced)} onCancel={() => setPending(undefined)}/>}
   {source && <section className="preview-section"><h2>{r.original} · {px(source.originalWidth, source.originalHeight, lang)} px</h2><div className="resize-image-frame"><img src={source.url} alt={r.original}/></div>{source.reduced && <p className="settings-hint">{r.reducedNote} {r.outputRes}: {px(source.width, source.height, lang)} px</p>}<p className="resize-filename">{source.file.name} · {formatLabel(source.format)} · {size(source.file.size)}</p></section>}
   <section className="preview-section"><h2>{r.result}{current && source ? ` · ${px(source.width, source.height, lang)} px` : ''}</h2><div className="resize-image-frame" aria-live="polite">{current ? <img src={current.url} alt={r.result}/> : <div className="resize-empty">{busy || loading ? <LoaderCircle className="animate-spin" size={30}/> : <ImageIcon size={40} strokeWidth={1}/>}<p>{busy || loading ? r.processing : r.empty}</p></div>}</div>
    {current && <p className="resize-file-size">{r.actual}: {size(current.blob.size)} · {formatLabel(format)}</p>}
    {stats && source && current && <div role="status" aria-live="polite"><h3 className="mt-4">{r.comparison}</h3><p className="resize-file-size">{r.original}: {size(source.file.size)} · {formatLabel(source.format)}<br/>{r.result}: {size(current.blob.size)} · {formatLabel(format)}</p><p className="resize-file-size">{stats.smaller ? r.reduction : r.increase}: {Math.abs(stats.percent).toLocaleString(lang, { maximumFractionDigits: 2 })}% · {stats.smaller ? r.saved : r.larger}: {size(Math.abs(stats.saved))}</p>{!stats.smaller ? <p className="resize-error">{r.noReduction}</p> : !stats.significant ? <p className="settings-hint">{r.insignificant}</p> : null}</div>}
   </section>
  </div><aside className="settings-panel"><div className="panel-heading"><h2>{c.settings}</h2></div>
   <fieldset disabled={!source || loading} className="resize-fields">
    <label className="setting-field"><span>{c.source}</span><input readOnly aria-label={c.source} value={source ? formatLabel(source.format) : c.auto}/></label>
    <label className="setting-field"><span>{c.output}</span><select aria-label={c.output} value={format} onChange={e => chooseFormat(e.target.value as ImageFormat)}><option value="image/jpeg">JPG</option><option value="image/webp">WebP</option>{source?.format !== 'image/heic' && source?.format !== 'image/heif' && <option value="image/png">PNG</option>}</select></label>
    {format !== 'image/png' && <><label className="setting-field"><span>{r.level}</span><select aria-label={r.level} value={level} onChange={e => { const selected = e.target.value; if (selected in compressionLevels) chooseQuality(compressionLevels[selected as keyof typeof compressionLevels]); }}><option value="high">{r.high}</option><option value="balanced">{r.balanced}</option><option value="small">{r.small}</option><option value="custom" disabled>{r.custom}</option></select></label><label className="setting-field"><span>{r.quality}<small>{quality}%</small></span><input aria-label={r.quality} type="range" min={1} max={100} value={quality} onChange={e => chooseQuality(Number(e.target.value))}/></label></>}
    {source && <p className="settings-hint">{r.originalRes}: {px(source.originalWidth, source.originalHeight, lang)} px<br/>{r.outputRes}: {px(source.width, source.height, lang)} px<br/>{source.reduced ? r.reducedNote : r.unchanged}</p>}
    <p className="settings-hint">{format === 'image/png' && source?.format === 'image/png' && !source.reduced ? r.png : format === 'image/png' ? `${r.reducedPng} ${r.qualityInfo}` : r.lossy}</p>
    {source && source.format !== format && <p className="settings-hint">{r.change}</p>}
   </fieldset>
   <p className="settings-hint mt-4">{r.limits}</p><p className="settings-hint mt-4">{r.heicInfo}</p>
   {error && <p role="alert" className="resize-error">{r[error]}</p>}
   <FileSaving lang={lang} result={current} filename={compressionName(source?.file.name ?? 'image', format)} title={c.export} label={r.download} processing={r.processing} busy={busy || loading} disabled={!current || !!error || !!pending} mode="auto"/>
   {error && source && !pending && <Button variant="outline" onClick={() => { setError(undefined); setRetry(n => n + 1); }}><RotateCcw/>{r.retry}</Button>}
   {source && current && <FileSaving lang={lang} result={originalResult} filename={source.file.name} title={r.original} label={r.keep} processing={r.processing} busy={loading} disabled={false} mode="auto"/>}
  </aside></div>
  <ReservedSpace lang={lang}/>
  <section className="how-section"><h2>{r.how}</h2><div className="steps-grid">{[[r.first,r.firstDesc],[r.second,r.secondDesc],[r.third,r.thirdDesc]].map(([title,desc],n) => <div key={title}><span className="step-number">{n + 1}</span><h3>{title}</h3><p>{desc}</p></div>)}</div></section>
  <section className="privacy-strip"><ShieldCheck size={25}/><div><h3>{c.private}</h3><p>{r.local}</p></div></section>
  <section className="related-section"><h2>{c.related}</h2><div className="tool-grid related-grid">{tools.filter(t => t.id !== tool.id && t.category === tool.category).slice(0,3).map(t => <ToolCard key={t.id} tool={t} lang={lang}/>)}</div></section>
 </main></Shell>;
}