import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Link } from '@tanstack/react-router';
import { ChevronRight, ImagePlus, LoaderCircle, ShieldCheck, Type, Stamp, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { copy, langIndex, tools, type Language, type Tool } from '@/lib/photo/content';
import { watermarkCopy } from '@/lib/photo/watermark-copy';
import { defaultWatermark, drawWatermark, encodeWatermark, watermarkFonts, watermarkName, type WatermarkOptions, type WatermarkRect } from '@/lib/photo/watermark';
import { loadWatermarkSource, releaseWatermarkSource, watermarkReduceOffer, type WatermarkSource } from '@/lib/photo/watermark-source';
import { inspectConversion } from '@/lib/photo/convert';
import type { ImageFormat } from '@/lib/photo/resize';
import type { ReduceOffer, Size } from '@/lib/photo/large-image';
import { ReducePrompt, ResolutionNote, px } from './reduce-prompt';
import { FileSaving } from './file-saving';
import { Shell, ReservedSpace } from './shell';
import { ToolCard, ToolIcon } from './tool-card';

type ErrorCode='fileType'|'fileSize'|'inputLimit'|'decode'|'heicError'|'exportError';
function errorCode(e:unknown):ErrorCode { const message=e instanceof Error?e.message:'';return ['fileType','fileSize','inputLimit','decode','heicError','exportError'].includes(message)?message as ErrorCode:'exportError'; }
export function WatermarkWorkspace({tool,lang,slug}:{tool:Tool;lang:Language;slug:string}) {
 const c=copy[lang],r=watermarkCopy[lang];
 const photoInput=useRef<HTMLInputElement>(null),logoInput=useRef<HTMLInputElement>(null),canvas=useRef<HTMLCanvasElement>(null);
 const sources=useRef<{photo?:WatermarkSource;logo?:WatermarkSource}>({}),controllers=useRef<{photo?:AbortController;logo?:AbortController}>({});
 const [source,setSource]=useState<WatermarkSource>(),[logo,setLogo]=useState<WatermarkSource>();
 const [options,setOptions]=useState<WatermarkOptions>({...defaultWatermark}),[format,setFormat]=useState<ImageFormat>('image/png'),[quality,setQuality]=useState(90);
 const [loading,setLoading]=useState<'photo'|'logo'>(),[busy,setBusy]=useState(false),[error,setError]=useState<ErrorCode>(),[retry,setRetry]=useState(0);
 const [pending,setPending]=useState<{offer:ReduceOffer;kind:'photo'|'logo'}>();
 const encoding=useRef<Promise<void>>(Promise.resolve());
 const [result,setResult]=useState<{blob:Blob;url:string;key:string}>();
 const rect=useRef<WatermarkRect | undefined>(undefined),drag=useRef<{id:number;offsetX:number;offsetY:number} | undefined>(undefined);
 const key=JSON.stringify([source?.url,logo?.url,options,format,quality]);
 const ready=!!source && (options.mode==='text'?!!options.text.trim():!!logo);
 const current=result?.key===key && !loading && !pending?result:undefined;
 function update<K extends keyof WatermarkOptions>(name:K,value:WatermarkOptions[K]){setError(undefined);setOptions(previous=>({...previous,[name]:value}));}
 useEffect(()=>()=>{controllers.current.photo?.abort();controllers.current.logo?.abort();releaseWatermarkSource(sources.current.photo);releaseWatermarkSource(sources.current.logo);},[]);
 async function load(file:File|undefined,kind:'photo'|'logo',target?:Size){
  if(!file || loading)return;
  controllers.current[kind]?.abort();const controller=new AbortController();controllers.current[kind]=controller;
  setLoading(kind);setError(undefined);setPending(undefined);
  try {
   const decoded=await loadWatermarkSource(file,controller.signal,target);
   if(controller.signal.aborted){if('image' in decoded)releaseWatermarkSource(decoded);return;}
   if(!('image' in decoded)){setPending({offer:decoded,kind});return;}
   releaseWatermarkSource(sources.current[kind]);sources.current[kind]=decoded;
   if(kind==='photo'){setSource(decoded);setFormat('image/png');}else{setLogo(decoded);update('mode','logo');}
  }catch(e){if(!controller.signal.aborted){
   try {const header=await inspectConversion(file);const offer=!target?watermarkReduceOffer(file,header.width,header.height,true):undefined;if(offer)setPending({offer,kind});else setError(errorCode(e));}
   catch{setError(errorCode(e));}
  }}finally{if(!controller.signal.aborted)setLoading(undefined);}
 }
 useEffect(()=>{
  const stage=canvas.current;if(!stage || !source)return;
  const scale=Math.min(1,1000/source.width,700/source.height);stage.width=Math.max(1,Math.round(source.width*scale));stage.height=Math.max(1,Math.round(source.height*scale));
  const ctx=stage.getContext('2d');if(!ctx)return;
  try{rect.current=drawWatermark(ctx,source.image,stage.width,stage.height,options,logo?.image,format);}catch{setError('exportError');}
 },[source,logo,options,format]);
 useEffect(()=>{
  let cancelled=false,url:string|undefined;setResult(undefined);setBusy(false);
  if(!source || !ready || loading || pending)return;
  setBusy(true);
  const timer=setTimeout(()=>{
   const job=encoding.current.then(async()=>{
   if(cancelled)return;
   try{const blob=await encodeWatermark(source.image,source.width,source.height,options,logo?.image,format,quality);
    if(cancelled)return;url=URL.createObjectURL(blob);setResult({blob,url,key});
   }catch(e){if(!cancelled){const offer=!source.reduced?watermarkReduceOffer(source.file,source.originalWidth,source.originalHeight,true):undefined;if(offer)setPending({offer,kind:'photo'});else setError(errorCode(e));}}
   finally{if(!cancelled)setBusy(false);}
   });
   encoding.current=job.catch(()=>{});
  },400);
  return()=>{cancelled=true;clearTimeout(timer);if(url)URL.revokeObjectURL(url);};
 },[source,logo,options,format,quality,key,ready,loading,pending,retry]);
 function point(event:PointerEvent<HTMLCanvasElement>){const stage=event.currentTarget,bounds=stage.getBoundingClientRect();return{x:(event.clientX-bounds.left)*stage.width/bounds.width,y:(event.clientY-bounds.top)*stage.height/bounds.height};}
 function pointerDown(event:PointerEvent<HTMLCanvasElement>){const box=rect.current;if(!ready || !box)return;const p=point(event);drag.current={id:event.pointerId,offsetX:p.x>=box.x && p.x<=box.x+box.width?p.x-box.x:box.width/2,offsetY:p.y>=box.y && p.y<=box.y+box.height?p.y-box.y:box.height/2};event.currentTarget.setPointerCapture(event.pointerId);pointerMove(event);}
 function pointerMove(event:PointerEvent<HTMLCanvasElement>){const active=drag.current,box=rect.current;if(!active || active.id!==event.pointerId || !box)return;const p=point(event),stage=event.currentTarget;setOptions(o=>({...o,x:Math.min(100,Math.max(0,(p.x-active.offsetX)/Math.max(1,stage.width-box.width)*100)),y:Math.min(100,Math.max(0,(p.y-active.offsetY)/Math.max(1,stage.height-box.height)*100))}));}
 const slider=(name:'size'|'opacity'|'x'|'y'|'spacing',label:string,min:number,max:number)=><label className="setting-field"><span>{label}<small>{Math.round(options[name])}%</small></span><input aria-label={label} type="range" min={min} max={max} value={options[name]} onChange={e=>update(name,Number(e.target.value))}/></label>;
 return <Shell lang={lang} slug={slug}><main id="main" className="content-width tool-page resize-page watermark-page">
  <nav className="breadcrumbs"><Link to="/$lang" params={{lang}}>{c.home}</Link><ChevronRight size={13}/><span>{tool.titles[langIndex(lang)]}</span></nav>
  <div className="tool-page-heading"><ToolIcon tool={tool}/><div><h1>{tool.titles[langIndex(lang)]}</h1><p>{tool.descriptions[langIndex(lang)]}</p></div></div>
  <div className="phase-notice"><ShieldCheck size={18}/><div><p>{r.local}</p><p>{r.pending}</p></div></div>
  <div className="workspace"><div className="workspace-main">
   <section className="upload-area" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();void load(e.dataTransfer.files[0],'photo');}}><ImagePlus size={32}/><h2>{c.upload}</h2><p>{c.drop}</p>
    <input ref={photoInput} type="file" className="sr-only" aria-label={c.choose} accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" onChange={e=>{void load(e.target.files?.[0],'photo');e.target.value='';}}/>
    <Button size="lg" disabled={!!loading} onClick={()=>photoInput.current?.click()}>{loading==='photo'?<LoaderCircle className="animate-spin"/>:<ImagePlus/>}{loading==='photo'?r.processing:source?r.another:c.choose}</Button><small>{r.formats}</small>
   </section>
   {pending && <ReducePrompt offer={pending.offer} lang={lang} onReduce={()=>void load(pending.offer.file,pending.kind,pending.offer.reduced)} onCancel={()=>setPending(undefined)}/>}
   <section className="preview-section"><h2>{r.preview}{source?` · ${px(source.width,source.height,lang)} px`:''}</h2>
    <div className="watermark-stage">{source?<canvas ref={canvas} aria-label={r.preview} tabIndex={0} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={()=>{drag.current=undefined;}} onPointerCancel={()=>{drag.current=undefined;}} onKeyDown={e=>{const directions:Record<string,[number,number]>={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};const d=directions[e.key];if(d){e.preventDefault();setOptions(o=>({...o,x:Math.max(0,Math.min(100,o.x+d[0])),y:Math.max(0,Math.min(100,o.y+d[1]))}));}}}/>:<div className="resize-empty"><Stamp size={40}/><p>{r.empty}</p></div>}</div>
    {source && <><ResolutionNote source={source} lang={lang}/><p className="resize-filename">{source.file.name}</p></>}
    <p role="status" aria-live="polite" className="settings-hint mt-3">{busy||loading?r.processing:source && !ready?r.required:null}</p>
   </section>
   {current && <section className="preview-section"><h2>{c.preview} · {px(source?.width??0,source?.height??0,lang)} px</h2><div className="resize-image-frame"><img src={current.url} alt={r.preview}/></div><p className="resize-file-size">{(current.blob.size/1024).toLocaleString(lang,{maximumFractionDigits:1})} KiB · {format==='image/jpeg'?'JPG':format==='image/png'?'PNG':'WebP'}</p></section>}
  </div><aside className="settings-panel"><div className="panel-heading"><h2>{c.settings}</h2></div>
   <fieldset className="resize-fields" disabled={!source || !!loading}><legend className="sr-only">{r.mode}</legend>
    <div className="watermark-modes" role="group" aria-label={r.mode}><Button variant={options.mode==='text'?'default':'outline'} aria-pressed={options.mode==='text'} onClick={()=>update('mode','text')}><Type/>{r.text}</Button><Button variant={options.mode==='logo'?'default':'outline'} aria-pressed={options.mode==='logo'} onClick={()=>update('mode','logo')}><Stamp/>{r.logo}</Button></div>
    {options.mode==='text'?<><label className="setting-field"><span>{r.content}</span><input aria-label={r.content} value={options.text} maxLength={500} onChange={e=>update('text',e.target.value)}/></label><label className="setting-field"><span>{r.font}</span><select aria-label={r.font} value={options.font} onChange={e=>update('font',e.target.value)}>{watermarkFonts.map(f=><option key={f}>{f}</option>)}</select></label><label className="setting-field"><span>{r.color}</span><input aria-label={r.color} type="color" value={options.color} onChange={e=>update('color',e.target.value)}/></label></>:<><input ref={logoInput} type="file" className="sr-only" aria-label={r.chooseLogo} accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" onChange={e=>{void load(e.target.files?.[0],'logo');e.target.value='';}}/><Button variant="outline" className="resize-restore" onClick={()=>logoInput.current?.click()}><ImagePlus/>{r.chooseLogo}</Button>{logo && <div className="watermark-logo"><img src={logo.url} alt={r.logo}/><p className="resize-filename">{logo.file.name}</p><ResolutionNote source={logo} lang={lang}/></div>}</>}
    {slider('size',r.size,1,80)}{slider('opacity',r.opacity,0,100)}
    <label className="setting-field"><span>{r.position}</span><select aria-label={r.position} value={r.positions.findIndex((_,i)=>options.x===[5,50,95][i%3] && options.y===[5,50,95][Math.floor(i/3)])} onChange={e=>{const i=Number(e.target.value);setOptions(o=>({...o,x:[5,50,95][i%3]??50,y:[5,50,95][Math.floor(i/3)]??50}));}}><option value={-1} disabled>↔ ↕</option>{r.positions.map((label,i)=><option value={i} key={label}>{label}</option>)}</select></label>
    {slider('x',r.horizontal,0,100)}{slider('y',r.vertical,0,100)}
    <label className="setting-check"><input type="checkbox" checked={options.repeat} onChange={e=>update('repeat',e.target.checked)}/>{r.repeat}</label>{options.repeat && slider('spacing',r.spacing,10,200)}
    <label className="setting-field"><span>{c.output}</span><select aria-label={c.output} value={format} onChange={e=>{setError(undefined);setFormat(e.target.value as ImageFormat);}}><option value="image/jpeg">JPG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option></select></label>
    {format!=='image/png' && <label className="setting-field"><span>{r.quality}<small>{quality}%</small></span><input aria-label={r.quality} type="range" min={1} max={100} value={quality} onChange={e=>{setError(undefined);setQuality(Number(e.target.value));}}/></label>}
    <p className="settings-hint">{r.jpg}</p>
   </fieldset><p className="settings-hint mt-4">{r.limits}</p>{error && <p className="resize-error" role="alert">{r[error]}</p>}
   <FileSaving lang={lang} result={current} filename={watermarkName(source?.file.name??'image',format)} title={c.export} label={r.download} processing={r.processing} busy={busy || !!loading} disabled={!current || !!error || !!pending} mode="auto"/>
   {error && source && <Button variant="outline" onClick={()=>{setError(undefined);setRetry(n=>n+1);}}><RotateCcw/>{r.retry}</Button>}
  </aside></div><ReservedSpace lang={lang}/>
  <section className="how-section"><h2>{r.how}</h2><div className="steps-grid">{[[r.first,r.firstDesc],[r.second,r.secondDesc],[r.third,r.thirdDesc]].map(([title,desc],i)=><div key={title}><span className="step-number">{i+1}</span><h3>{title}</h3><p>{desc}</p></div>)}</div></section>
  <section className="privacy-strip"><ShieldCheck size={25}/><div><h3>{c.private}</h3><p>{r.local}</p></div></section>
  <section className="related-section"><h2>{c.related}</h2><div className="tool-grid related-grid">{tools.filter(t=>t.id!==tool.id && t.category===tool.category).slice(0,3).map(t=><ToolCard key={t.id} tool={t} lang={lang}/>)}</div></section>
 </main></Shell>;
}
