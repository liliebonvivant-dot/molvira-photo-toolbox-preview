import { useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ChevronRight, ImagePlus, LoaderCircle, Scissors, ShieldCheck, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { copy, langIndex, tools, type Language, type Tool } from '@/lib/photo/content';
import { backgroundCopy } from '@/lib/photo/background-copy';
import { backgroundBudget, backgroundName, backgroundTarget, inspectBackground, removeLocalBackground, type BackgroundSize, type BackgroundProgress } from '@/lib/photo/background';
import { FileSaving } from './file-saving';
import { Shell, ReservedSpace } from './shell';
import { ToolCard, ToolIcon } from './tool-card';
type Source = { file: File; width: number; height: number; target?: BackgroundSize; url: string };
type ErrorCode = 'fileType' | 'fileSize' | 'inputLimit' | 'decode' | 'unsupported' | 'timeout' | 'processError';
export function BackgroundWorkspace({ tool, lang, slug }: { tool: Tool; lang: Language; slug: string }) {
 const c=copy[lang],r=backgroundCopy[lang];
 const input=useRef<HTMLInputElement>(null),controller=useRef<AbortController | undefined>(undefined),request=useRef(0);
 const urls=useRef<{source?:string;result?:string}>({});
 const [source,setSource]=useState<Source>(),[pending,setPending]=useState<Omit<Source,'url'>>();
 const [result,setResult]=useState<{blob:Blob;url:string;key:string;width:number;height:number}>();
 const [busy,setBusy]=useState(false),[reading,setReading]=useState(false),[progress,setProgress]=useState<BackgroundProgress>(),[error,setError]=useState<ErrorCode>();
 const dimensions=(size:BackgroundSize)=>`${size.width.toLocaleString(lang)} × ${size.height.toLocaleString(lang)} px`;
 useEffect(()=>()=>{request.current++;controller.current?.abort();for(const url of Object.values(urls.current))if(url)URL.revokeObjectURL(url);},[]);
 function clearResult(){if(urls.current.result)URL.revokeObjectURL(urls.current.result);delete urls.current.result;setResult(undefined);}
 function accept(value:Omit<Source,'url'>){if(urls.current.source)URL.revokeObjectURL(urls.current.source);const url=URL.createObjectURL(value.file);urls.current.source=url;setSource({...value,url});setPending(undefined);clearResult();setError(undefined);}
 async function load(file?:File){
  if(!file || busy || reading)return;const id=++request.current;setReading(true);setError(undefined);setPending(undefined);
  try{const header=await inspectBackground(file);if(id!==request.current)return;const target=backgroundTarget(header.width,header.height,backgroundBudget(matchMedia('(pointer: coarse)').matches));const value={file,width:header.width,height:header.height};if(target.width!==header.width || target.height!==header.height)setPending({...value,target});else accept(value);}
  catch(e){if(id===request.current)setError(e instanceof Error && ['fileType','fileSize','inputLimit','decode'].includes(e.message)?e.message as ErrorCode:'decode');}
  finally{if(id===request.current)setReading(false);}
 }
 async function process(){
  if(!source || busy || pending)return;const abort=new AbortController();controller.current=abort;const id=++request.current;setBusy(true);setError(undefined);clearResult();setProgress({stage:'download'});
  try{const output=await removeLocalBackground(source.file,source.target,abort.signal,value=>{if(id===request.current)setProgress(value);});if(id!==request.current || abort.signal.aborted)return;const url=URL.createObjectURL(output.blob);urls.current.result=url;setResult({...output,url,key:`${id}`});}
  catch(e){if(id===request.current && !abort.signal.aborted)setError(e instanceof Error && ['unsupported','timeout'].includes(e.message)?e.message as ErrorCode:'processError');}
  finally{if(id===request.current){setBusy(false);setProgress(undefined);}}
 }
 function cancel(){request.current++;controller.current?.abort();setBusy(false);setProgress(undefined);}
 const status=reading?r.loading:busy?progress?.stage==='download'?`${r.downloading}${progress.percent===undefined?'…':` · ${progress.percent}%`}`:r.processing:result?r.done:'\u00a0';
 return <Shell lang={lang} slug={slug}><main id="main" className="content-width tool-page resize-page background-page">
  <nav className="breadcrumbs"><Link to="/$lang" params={{lang}}>{c.home}</Link><ChevronRight size={13}/><span>{tool.titles[langIndex(lang)]}</span></nav>
  <div className="tool-page-heading"><ToolIcon tool={tool}/><div><h1>{tool.titles[langIndex(lang)]}</h1><p>{tool.descriptions[langIndex(lang)]}</p></div></div>
  <div className="phase-notice"><ShieldCheck size={18}/><p>{r.local}</p></div>
  <div className="workspace"><div className="workspace-main">
   <section className="upload-area" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();void load(e.dataTransfer.files[0]);}}><ImagePlus size={32}/><h2>{c.upload}</h2><p>{c.drop}</p>
    <input ref={input} className="sr-only" type="file" aria-label={c.choose} accept="image/jpeg,image/png,image/webp" disabled={busy || reading} onChange={e=>{void load(e.target.files?.[0]);e.target.value='';}}/>
    <Button size="lg" disabled={busy || reading} onClick={()=>input.current?.click()}>{reading?<LoaderCircle className="animate-spin"/>:<ImagePlus/>}{reading?r.loading:source?r.another:c.choose}</Button><small>{r.formats}</small>
   </section>
   {pending && <section className="phase-notice mt-5" role="alert"><div><p>{r.reduction} {dimensions(pending)}</p><p>{r.output} {pending.target?dimensions(pending.target):''}</p><div className="mt-3 flex flex-wrap gap-2"><Button onClick={()=>accept(pending)}>{r.reduce}</Button><Button variant="outline" onClick={()=>setPending(undefined)}>{r.cancel}</Button></div></div></section>}
   <div className="background-comparison">
    <section className="preview-section"><h2>{r.original}</h2><div className="resize-image-frame">{source?<img src={source.url} alt={r.original}/>:<div className="resize-empty"><ImagePlus size={36}/><p>{r.empty}</p></div>}</div><p className="resize-file-size">{source?dimensions(source):'\u00a0'}</p></section>
    <section className="preview-section"><h2>{r.result}</h2><div className="resize-image-frame">{result?<img src={result.url} alt={r.result}/>:busy?<LoaderCircle className="animate-spin" aria-label={r.processing}/>:<div className="resize-empty"><Scissors size={36}/></div>}</div><p className="resize-file-size">{result?`${dimensions(result)} · ${(result.blob.size/1024).toLocaleString(lang,{maximumFractionDigits:1})} KiB · PNG`:source?`${r.output} ${dimensions(source.target??source)}`:'\u00a0'}</p></section>
   </div><p className="background-progress settings-hint" role="status" aria-live="polite">{status}</p>
   {busy && <progress className="background-meter" aria-label={progress?.stage==='download'?r.downloading:r.processing} max={100} value={progress?.stage==='download'?progress.percent:undefined}/>}
  </div><aside className="settings-panel"><div className="panel-heading"><h2>{c.settings}</h2></div><p className="settings-hint mt-4">{r.dependency}</p><p className="settings-hint mt-4">{r.limits}</p><p className="settings-hint mt-4">{r.quality}</p>
   <Button className="resize-download mt-5" disabled={!source || busy || reading || !!pending} onClick={()=>void process()}>{busy?<LoaderCircle className="animate-spin"/>:<Scissors/>}{error?r.retry:r.remove}</Button>
   {busy && <Button variant="outline" className="resize-download mt-3" onClick={cancel}><X/>{r.cancel}</Button>}{error && <p className="resize-error" role="alert">{r[error]}</p>}
   {error && source && (source.target??source).width*(source.target??source).height>500_000 && <Button variant="outline" className="resize-download mt-3" onClick={()=>setPending({...source,target:backgroundTarget(source.width,source.height,500_000)})}><RotateCcw/>{r.smaller}</Button>}
   <FileSaving lang={lang} result={result} filename={backgroundName(source?.file.name??'image')} title={c.export} label={r.download} processing={r.processing} busy={busy || reading} disabled={!result || !!pending} mode="auto"/>
  </aside></div><ReservedSpace lang={lang}/><section className="privacy-strip"><ShieldCheck size={25}/><div><h3>{c.private}</h3><p>{r.local}</p></div></section>
  <section className="related-section"><h2>{c.related}</h2><div className="tool-grid related-grid">{tools.filter(t=>t.id!==tool.id && t.category===tool.category).slice(0,3).map(t=><ToolCard key={t.id} tool={t} lang={lang}/>)}</div></section>
 </main></Shell>;
}
