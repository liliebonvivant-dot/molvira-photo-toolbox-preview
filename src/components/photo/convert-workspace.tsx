import { useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ChevronRight, Download, ImagePlus, Image as ImageIcon, ShieldCheck, LoaderCircle, ExternalLink, Share2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { copy, langIndex, tools, type Language, type Tool } from '@/lib/photo/content';
import { resizeCopy } from '@/lib/photo/resize-copy';
import type { ImageFormat } from '@/lib/photo/resize';
import { convertCopy } from '@/lib/photo/convert-copy';
import { canProcessOriginal, convertLimits, reducedDimensions, conversionDimensionError, conversionName, decodeHeif, encodeConversion, formatLabel, inspectConversion, type ConvertError, type SourceFormat } from '@/lib/photo/convert';
import { Shell, ReservedSpace } from './shell';
import { ToolCard, ToolIcon } from './tool-card';
import { deliverConversion, type DeliveryOutcome } from '@/lib/photo/convert-delivery';
type Source = { image: HTMLImageElement; url: string; name: string; width: number; height: number; outW: number; outH: number; reduced: boolean; file: File; size: number; format: SourceFormat };
type Pending = { file: File; width: number; height: number; reduced: { width: number; height: number } };
const px=(w:number,h:number,lang:string)=>`${w.toLocaleString(lang)} × ${h.toLocaleString(lang)}`;
type Result = { blob: Blob; url: string; key: string };
function errorCode(error: unknown): ConvertError {
 const code=error instanceof Error ? error.message : '';
 return ['fileType','fileSize','decode','inputLimit','exportError','heicError'].includes(code) ? code as ConvertError : 'decode';
}
export function ConvertWorkspace({ tool, lang, slug }: {tool: Tool; lang: Language; slug: string}) {
 const c=copy[lang], r={...resizeCopy[lang],...convertCopy[lang]};
 const input=useRef<HTMLInputElement>(null), loadId=useRef(0), urls=useRef(new Set<string>());
 const [source,setSource]=useState<Source>();
 const abortLoad=useRef<AbortController | undefined>(undefined);
 const [format,setFormat]=useState<ImageFormat>('image/png'), [quality,setQuality]=useState(90);
 const [result,setResult]=useState<Result>(), [busy,setBusy]=useState(false), [loading,setLoading]=useState(false);
 const [error,setError]=useState<ConvertError>(), [dragging,setDragging]=useState(false), [pending,setPending]=useState<Pending>();
  const [delivery,setDelivery]=useState<{key:string;status:DeliveryOutcome|'saving'}>();
  const [retry,setRetry]=useState(0), [shareSupported,setShareSupported]=useState(false);
  const deliveryId=useRef(0);
 const w=source?.outW ?? 0,h=source?.outH ?? 0;
 const key=`${source?.url}|${w}|${h}|${format}|${format==='image/png'?100:quality}`;
 const current=result?.key===key && !loading ? result : undefined;
  const deliveryStatus=delivery?.key===key ? delivery.status : undefined;
 function revoke(url:string) {URL.revokeObjectURL(url);urls.current.delete(url);}
  useEffect(()=>()=>{loadId.current++;deliveryId.current++;abortLoad.current?.abort();for(const url of urls.current)URL.revokeObjectURL(url);urls.current.clear();},[]);
  useEffect(()=>{
   setShareSupported(false);
   if(!current)return;
   try {setShareSupported(!!navigator.canShare?.({files:[new File([current.blob],conversionName(source?.name ?? 'image',format),{type:current.blob.type})]}));}catch{}
  },[current,source?.name,format]);
 useEffect(()=>{
  let cancelled=false, outputUrl:string|undefined;
   setResult(undefined);setBusy(false);setDelivery(undefined);deliveryId.current++;
  if(!source || loading) return;
  setBusy(true);
  const timer=setTimeout(async()=>{
   try {
    const blob=await encodeConversion(source.image,format,quality,source.outW,source.outH);
    if(cancelled)return;
    outputUrl=URL.createObjectURL(blob);urls.current.add(outputUrl);
    setResult({blob,url:outputUrl,key});
   } catch(e) {
     if(cancelled)return;
     // A full-resolution encode failing on this device offers, never applies, a reduction.
     if(!source.reduced && source.outW*source.outH>convertLimits.compatiblePixels)setPending({file:source.file,width:source.width,height:source.height,reduced:reducedDimensions(source.width,source.height)});
     else setError(errorCode(e));
    }
   finally {if(!cancelled)setBusy(false);}
  },250);
  return ()=>{cancelled=true;clearTimeout(timer);if(outputUrl)revoke(outputUrl);};
  },[source,key,loading,format,quality,retry]);
 async function load(file?:File, target?:{width:number;height:number}) {
  if(!file || loading)return;
  setPending(undefined);
  abortLoad.current?.abort();
  const controller=new AbortController();abortLoad.current=controller;
  const id=++loadId.current;setLoading(true);setError(undefined);
  let url:string|undefined;
  try {
   const header=await inspectConversion(file);
    if(id!==loadId.current)return;
   if(!target && !canProcessOriginal(header.width,header.height)){setPending({file,width:header.width,height:header.height,reduced:reducedDimensions(header.width,header.height)});return;}
   url=URL.createObjectURL(file);urls.current.add(url);
   let image=new window.Image();image.src=url;
   try {await image.decode();}
   catch {
    if(header.format!=='image/heic' && header.format!=='image/heif')throw new Error('decode');
    revoke(url);url=undefined;
    const decoded=await decodeHeif(file,controller.signal,target);
    if(id!==loadId.current)return;
    url=URL.createObjectURL(decoded);urls.current.add(url);
    image=new window.Image();image.src=url;await image.decode();
   }
   if(id!==loadId.current){if(url)revoke(url);return;}
   const iw=image.naturalWidth,ih=image.naturalHeight;
   if(conversionDimensionError(iw,ih))throw new Error('inputLimit');
   const out=target?reducedDimensions(iw,ih):{width:iw,height:ih};
   if(source)revoke(source.url);
   setSource({image,url,name:file.name,width:target?header.width:iw,height:target?header.height:ih,outW:out.width,outH:out.height,reduced:!!target,file,size:file.size,format:header.format});
   setFormat(header.format==='image/heic'||header.format==='image/heif'?'image/jpeg':header.format);setQuality(90);
  } catch(e) {if(url)revoke(url);if(id===loadId.current)setError(errorCode(e));}
  finally {if(id===loadId.current)setLoading(false);}
 }
  async function download(shareOnly=false) {
  if(!current)return;
   const id=++deliveryId.current;
   setDelivery({key,status:'saving'});
   const name=conversionName(source?.name ?? 'image',format);
   let status:DeliveryOutcome;
   if(shareOnly){
    try {await navigator.share({files:[new File([current.blob],name,{type:current.blob.type})],title:name});status='shared';}
    catch(e){status=e instanceof Error && e.name==='AbortError'?'cancelled':'saveError';}
   }else status=await deliverConversion(current.blob,name);
   if(id===deliveryId.current)setDelivery({key,status});
 }
 const shownError=error;
 return <Shell lang={lang} slug={slug}><main id="main" className="content-width tool-page resize-page">
  <nav className="breadcrumbs"><Link to="/$lang" params={{lang}}>{c.home}</Link><ChevronRight size={13}/><span>{tool.titles[langIndex(lang)]}</span></nav>
  <div className="tool-page-heading"><ToolIcon tool={tool}/><div><h1>{tool.titles[langIndex(lang)]}</h1><p>{tool.descriptions[langIndex(lang)]}</p></div></div>
  <div className="phase-notice"><ShieldCheck size={18}/><p>{r.local}</p></div>
  <div className="workspace" aria-busy={loading || busy}>
   <div className="workspace-main">
    <section className={`upload-area ${dragging?'resize-dragging':''}`} onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);void load(e.dataTransfer.files[0]);}}>
     <ImagePlus size={32}/><h2>{c.upload}</h2><p>{c.drop}</p>
     <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif" className="sr-only" aria-label={c.choose} tabIndex={-1} onChange={e=>{void load(e.target.files?.[0]);e.target.value='';}}/>
     <Button size="lg" disabled={loading} onClick={()=>input.current?.click()}>{loading?<LoaderCircle className="animate-spin"/>:<ImagePlus/>}{loading?r.processing:source?r.another:c.choose}</Button><small>{r.formats}</small>
    </section>
     {pending && <section className="preview-section" role="alert"><div className="phase-notice"><ShieldCheck size={18}/><div><p>{r.tooLarge.replace('{o}',px(pending.width,pending.height,lang))}</p><p>{r.reduceAsk}</p><p>{r.originalRes}: {px(pending.width,pending.height,lang)} px · {r.outputRes}: {px(pending.reduced.width,pending.reduced.height,lang)} px</p><div className="mt-3 flex flex-wrap gap-2"><Button onClick={()=>void load(pending.file,pending.reduced)}>{r.reduceTo.replace('{r}',px(pending.reduced.width,pending.reduced.height,lang))}</Button><Button variant="outline" onClick={()=>setPending(undefined)}>{r.cancelReduce}</Button></div></div></div></section>}
     {source && <section className="preview-section"><h2>{r.original} · {px(source.width,source.height,lang)} px</h2><div className="resize-image-frame"><img src={source.url} alt={r.original}/></div><p className="resize-filename">{source.name} · {formatLabel(source.format)} · {(source.size/1024).toLocaleString(lang,{maximumFractionDigits:1})} KiB</p></section>}
    <section className="preview-section"><h2>{r.result}{current?` · ${px(w,h,lang)} px`:''}</h2><div className="resize-image-frame" aria-live="polite">{current?<img src={current.url} alt={r.result}/>:<div className="resize-empty">{busy || loading?<LoaderCircle className="animate-spin" size={30}/>:<ImageIcon size={40} strokeWidth={1}/>}<p>{busy || loading?r.processing:r.empty}</p></div>}</div>{current && <p className="resize-file-size">{r.actual}: {(current.blob.size/1024).toLocaleString(lang,{maximumFractionDigits:1})} KiB · {format==='image/jpeg'?'JPG':format==='image/png'?'PNG':'WebP'}</p>}</section>
   </div>
   <aside className="settings-panel"><div className="panel-heading"><h2>{c.settings}</h2></div>
    <fieldset disabled={!source || loading} className="resize-fields">
     <label className="setting-field"><span>{c.source}</span><input aria-label={c.source} readOnly value={source?formatLabel(source.format):c.auto}/></label>
     <label className="setting-field"><span>{c.output}</span><select aria-label={c.output} value={format} onChange={e=>{setFormat(e.target.value as ImageFormat);setError(undefined);}}><option value="image/jpeg">JPG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option></select></label>
     {format!=='image/png' && <label className="setting-field"><span>{r.quality}<small>{quality}%</small></span><input aria-label={r.quality} type="range" min={1} max={100} value={quality} onChange={e=>{setQuality(Number(e.target.value));setError(undefined);}}/></label>}
     {source && <p className="settings-hint">{r.originalRes}: {px(source.width,source.height,lang)} px<br/>{r.outputRes}: {px(source.outW,source.outH,lang)} px{source.reduced?<><br/>{r.reducedNote}</>:null}</p>}
      <p className="settings-hint">{r.qualityInfo}</p>
    </fieldset>
    <p className="settings-hint mt-4">{r.limits}</p><p className="settings-hint mt-4">{r.heicInfo}</p>
    <div aria-live="polite">{shownError && <p role="alert" className="resize-error">{r[shownError]}</p>}</div>
     <div className="export-section"><h3>{c.export}</h3><Button className="resize-download" disabled={!current || !!shownError || busy || loading || deliveryStatus==='saving'} size="lg" onClick={()=>void download()}>{busy || loading || deliveryStatus==='saving'?<LoaderCircle className="animate-spin"/>:<Download/>}{busy || loading?r.processing:deliveryStatus==='saving'?r.saving:r.download}</Button>
      <div role="status" aria-live="polite" aria-atomic="true"><p className="settings-hint mt-3">{busy || loading?r.processing:deliveryStatus?r[deliveryStatus]:current?r.ready:null}</p></div>
      {shownError && source && !pending && <Button variant="outline" onClick={()=>{setError(undefined);setRetry(n=>n+1);}}><RotateCcw/>{r.retry}</Button>}
      {current && <div className="mt-3 flex flex-col gap-2">
       {shareSupported && <Button variant="outline" disabled={deliveryStatus==='saving'} onClick={()=>void download(true)}><Share2/>{r.shareFile}</Button>}
       <Button variant="outline" asChild><a href={current.url} target="_blank" rel="noopener noreferrer"><ExternalLink/>{r.openFile}</a></Button>
       <p className="settings-hint">{r.openHint}</p>
      </div>}
     </div>
   </aside>
  </div>
  <ReservedSpace lang={lang}/>
  <section className="how-section"><h2>{r.how}</h2><div className="steps-grid">{[[r.first,r.firstDesc],[r.second,r.secondDesc],[r.third,r.thirdDesc]].map(([title,desc],n)=><div key={title}><span className="step-number">{n+1}</span><h3>{title}</h3><p>{desc}</p></div>)}</div></section>
  <section className="privacy-strip"><ShieldCheck size={25}/><div><h3>{c.private}</h3><p>{r.local}</p></div></section>
  <section className="faq-section"><h2>{c.faq}</h2>{[[r.faq1,r.answer1],[r.faq2,r.answer2],[r.faq3,r.answer3]].map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</section>
  <section className="related-section"><h2>{c.related}</h2><div className="tool-grid related-grid">{tools.filter(t=>t.id!==tool.id&&t.category===tool.category).slice(0,3).map(t=><ToolCard key={t.id} tool={t} lang={lang}/>)}</div></section>
 </main></Shell>;
}
