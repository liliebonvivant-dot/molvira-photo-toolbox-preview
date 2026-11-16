import { useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ChevronRight, Download, ImagePlus, Image as ImageIcon, RotateCcw, ShieldCheck, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { copy, langIndex, tools, type Language, type Tool } from '@/lib/photo/content';
import { resizeCopy } from '@/lib/photo/resize-copy';
import { dimensionError, exportCanvas, inspectImage, presetDimensions, proportionalDimension, resizeLimits, type ImageFormat, type ResizeError } from '@/lib/photo/resize';
import { safePixelBudget } from '@/lib/photo/convert';
import { decodeLocal, fallbackOffer, type ReduceOffer, type Size } from '@/lib/photo/large-image';
import { ReducePrompt, ResolutionNote } from './reduce-prompt';
import { Shell, ReservedSpace } from './shell';
import { ToolCard, ToolIcon } from './tool-card';
import { FileSaving } from './file-saving';
type Source = { image: HTMLImageElement; url: string; name: string; width: number; height: number; file: File; originalWidth: number; originalHeight: number; reduced: boolean };
type Result = { blob: Blob; url: string; key: string };
function errorCode(error: unknown): ResizeError {
 const code=error instanceof Error ? error.message : '';
 return ['fileType','fileSize','decode','inputLimit','dimensions','outputLimit','exportError'].includes(code) ? code as ResizeError : 'decode';
}
export function ResizeWorkspace({ tool, lang, slug }: {tool: Tool; lang: Language; slug: string}) {
 const c=copy[lang], r=resizeCopy[lang];
 const input=useRef<HTMLInputElement>(null), loadId=useRef(0), urls=useRef(new Set<string>());
 const [source,setSource]=useState<Source>();
 const [width,setWidth]=useState(''), [height,setHeight]=useState('');
 const [locked,setLocked]=useState(true), [preset,setPreset]=useState('custom');
 const [format,setFormat]=useState<ImageFormat>('image/png'), [quality,setQuality]=useState(90);
 const [result,setResult]=useState<Result>(), [busy,setBusy]=useState(false), [loading,setLoading]=useState(false);
 const [error,setError]=useState<ResizeError>(), [dragging,setDragging]=useState(false), [pending,setPending]=useState<ReduceOffer>();
 const w=Number(width),h=Number(height), validation=source ? dimensionError(w,h,safePixelBudget()) : undefined;
 const key=`${source?.url}|${width}|${height}|${format}|${format==='image/png'?100:quality}`;
 const current=result?.key===key && !validation && !loading ? result : undefined;
 function revoke(url:string) {URL.revokeObjectURL(url);urls.current.delete(url);}
 useEffect(()=>()=>{loadId.current++;for(const url of urls.current)URL.revokeObjectURL(url);urls.current.clear();},[]);
 useEffect(()=>{
  let cancelled=false, outputUrl:string|undefined;
  setResult(undefined);setBusy(false);
  if(!source || validation || loading) return;
  setBusy(true);
  const timer=setTimeout(async()=>{
   try {
    const blob=await exportCanvas(source.image,w,h,format,quality);
    if(cancelled)return;
    outputUrl=URL.createObjectURL(blob);urls.current.add(outputUrl);
    setResult({blob,url:outputUrl,key});
   } catch(e) {if(cancelled)return;const offer=!source.reduced && errorCode(e)==='exportError' ? fallbackOffer(source.file,source.originalWidth,source.originalHeight) : undefined;if(offer)setPending(offer);else setError(errorCode(e));}
   finally {if(!cancelled)setBusy(false);}
  },250);
  return ()=>{cancelled=true;clearTimeout(timer);if(outputUrl)revoke(outputUrl);};
 },[source,key,validation,loading,w,h,format,quality]);
 async function load(file?:File,target?:Size) {
  if(!file)return;
  const id=++loadId.current;setLoading(true);setError(undefined);setPending(undefined);
  try {
   const header=await inspectImage(file);
   if(id!==loadId.current)return;
   const out=await decodeLocal(file,header,target);
   if(id!==loadId.current){if('image' in out)URL.revokeObjectURL(out.url);return;}
   if(!('image' in out)){setPending(out);return;}
   urls.current.add(out.url);
   if(source)revoke(source.url);
   setSource({...out,name:file.name,file});
   setWidth(String(out.width));setHeight(String(out.height));setPreset('custom');setLocked(true);setFormat(header.format);setQuality(90);
  } catch(e) {if(id===loadId.current)setError(errorCode(e));}
  finally {if(id===loadId.current)setLoading(false);}
 }
 function changeDimension(axis:'width'|'height',value:string) {
  setError(undefined);setPreset('custom');
  if(axis==='width')setWidth(value);else setHeight(value);
  if(locked && source && Number(value)>0 && Number.isSafeInteger(Number(value))) {
   const other=proportionalDimension(Number(value),axis==='width'?source.width:source.height,axis==='width'?source.height:source.width);
   if(axis==='width')setHeight(String(other));else setWidth(String(other));
  }
 }
 function applyPreset(value:string) {
  setPreset(value);setError(undefined);
  if(!source || value==='custom')return;
  const dims=presetDimensions(source.width,source.height,Number(value));setWidth(String(dims.width));setHeight(String(dims.height));
 }
 const name=(source?.name.replace(/\.[^.]+$/,'') || 'image').replace(/[<>:"/\\|?*\u0000-\u001f]/g,'_');
 const filename=`${name}-${w}x${h}.${format==='image/jpeg'?'jpg':format==='image/png'?'png':'webp'}`;
 const shownError=error || validation;
 return <Shell lang={lang} slug={slug}><main id="main" className="content-width tool-page resize-page">
  <nav className="breadcrumbs"><Link to="/$lang" params={{lang}}>{c.home}</Link><ChevronRight size={13}/><span>{tool.titles[langIndex(lang)]}</span></nav>
  <div className="tool-page-heading"><ToolIcon tool={tool}/><div><h1>{tool.titles[langIndex(lang)]}</h1><p>{tool.descriptions[langIndex(lang)]}</p></div></div>
  <div className="phase-notice"><ShieldCheck size={18}/><p>{r.local}</p></div>
  <div className="workspace" aria-busy={loading || busy}>
   <div className="workspace-main">
    <section className={`upload-area ${dragging?'resize-dragging':''}`} onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);void load(e.dataTransfer.files[0]);}}>
     <ImagePlus size={32}/><h2>{c.upload}</h2><p>{c.drop}</p>
     <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" className="sr-only" aria-label={c.choose} tabIndex={-1} onChange={e=>{void load(e.target.files?.[0]);e.target.value='';}}/>
     <Button size="lg" disabled={loading} onClick={()=>input.current?.click()}>{loading?<LoaderCircle className="animate-spin"/>:<ImagePlus/>}{loading?r.processing:source?r.another:c.choose}</Button><small>{r.formats}</small>
    </section>
    {pending && <ReducePrompt offer={pending} lang={lang} onReduce={()=>void load(pending.file,pending.reduced)} onCancel={()=>setPending(undefined)}/>}
    {source && <section className="preview-section"><h2>{r.original} · {source.width} × {source.height} px</h2><div className="resize-image-frame"><img src={source.url} alt={r.original}/></div><p className="resize-filename">{source.name}</p></section>}
    <section className="preview-section"><h2>{r.result}{current?` · ${w} × ${h} px`:''}</h2><div className="resize-image-frame" aria-live="polite">{current?<img src={current.url} alt={r.result}/>:<div className="resize-empty">{busy || loading?<LoaderCircle className="animate-spin" size={30}/>:<ImageIcon size={40} strokeWidth={1}/>}<p>{busy || loading?r.processing:r.empty}</p></div>}</div>{current && <p className="resize-file-size">{r.actual}: {(current.blob.size/1024).toLocaleString(lang,{maximumFractionDigits:1})} KiB · {format==='image/jpeg'?'JPG':format==='image/png'?'PNG':'WebP'}</p>}</section>
   </div>
   <aside className="settings-panel"><div className="panel-heading"><h2>{c.settings}</h2></div>
    <fieldset disabled={!source || loading} className="resize-fields">
     <label className="setting-field"><span>{r.preset}</span><select value={preset} onChange={e=>applyPreset(e.target.value)}><option value="custom">{r.custom}</option>{[25,50,75,200].map(n=><option key={n} value={n}>{n}%</option>)}</select></label>
     <div className="settings-two">{(['width','height'] as const).map(axis=><label className="setting-field" key={axis}><span>{c[axis]} (px)</span><input type="number" inputMode="numeric" min={1} max={resizeLimits.side} step={1} value={axis==='width'?width:height} onChange={e=>changeDimension(axis,e.target.value)} aria-invalid={!!validation}/></label>)}</div>
     <label className="setting-check"><input type="checkbox" checked={locked} onChange={e=>{setLocked(e.target.checked);setError(undefined);setPreset('custom');if(e.target.checked && source && w>0)setHeight(String(proportionalDimension(w,source.width,source.height)));}}/>{c.lock}</label>
     <Button variant="outline" className="resize-restore" onClick={()=>{if(!source)return;setWidth(String(source.width));setHeight(String(source.height));setPreset('custom');setError(undefined);}}><RotateCcw/>{r.restore}</Button>
     <label className="setting-field"><span>{c.output}</span><select value={format} onChange={e=>{setFormat(e.target.value as ImageFormat);setError(undefined);}}><option value="image/jpeg">JPG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option></select></label>
     {format!=='image/png' && <label className="setting-field"><span>{r.quality}<small>{quality}%</small></span><input aria-label={r.quality} type="range" min={1} max={100} value={quality} onChange={e=>{setQuality(Number(e.target.value));setError(undefined);}}/></label>}
     {format==='image/jpeg' && <p className="settings-hint">{r.jpg}</p>}
    </fieldset>
    {source && <ResolutionNote source={source} lang={lang}/>}
    <p className="settings-hint">{r.limits}</p>
    <div aria-live="polite">{shownError && <p role="alert" className="resize-error">{r[shownError]}</p>}</div>
    <FileSaving lang={lang} result={current} filename={filename} title={c.export} label={r.download} processing={r.processing} busy={busy || loading} disabled={!current || !!shownError}/>
   </aside>
  </div>
  <ReservedSpace lang={lang}/>
  <section className="how-section"><h2>{r.how}</h2><div className="steps-grid">{[[r.first,r.firstDesc],[r.second,r.secondDesc],[r.third,r.thirdDesc]].map(([title,desc],n)=><div key={title}><span className="step-number">{n+1}</span><h3>{title}</h3><p>{desc}</p></div>)}</div></section>
  <section className="privacy-strip"><ShieldCheck size={25}/><div><h3>{c.private}</h3><p>{r.local}</p></div></section>
  <section className="faq-section"><h2>{c.faq}</h2>{[[r.faq1,r.answer1],[r.faq2,r.answer2],[r.faq3,r.answer3]].map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</section>
  <section className="related-section"><h2>{c.related}</h2><div className="tool-grid related-grid">{tools.filter(t=>t.id!==tool.id&&t.category===tool.category).slice(0,3).map(t=><ToolCard key={t.id} tool={t} lang={lang}/>)}</div></section>
 </main></Shell>;
}
