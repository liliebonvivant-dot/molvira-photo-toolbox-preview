import { useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import ReactCrop, { type PercentCrop } from 'react-image-crop';
import { ChevronRight, ImagePlus, Download, Crop, RotateCcw, RotateCw, Undo2, Redo2, FlipHorizontal2, FlipVertical2, ShieldCheck, LoaderCircle, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { copy, langIndex, tools, type Language, type Tool } from '@/lib/photo/content';
import { resizeCopy } from '@/lib/photo/resize-copy';
import { cropCopy } from '@/lib/photo/crop-copy';
import { inspectImage, resizeLimits, dimensionError, type ImageFormat, type ResizeError } from '@/lib/photo/resize';
import { originalEdit, rotateEdit, flipEdit, cropEdit, fitRatio, renderEdit, exportEdit, historyLimit, type Edit } from '@/lib/photo/crop';
import { Shell, ReservedSpace } from './shell';
import { ToolIcon, ToolCard } from './tool-card';
type Source={image:HTMLImageElement;url:string;name:string;width:number;height:number};
const fullCrop:PercentCrop={unit:'%',x:0,y:0,width:100,height:100};
const codes:ResizeError[]=['fileType','fileSize','decode','inputLimit','dimensions','outputLimit','exportError'];
export function CropWorkspace({tool,lang,slug}:{tool:Tool;lang:Language;slug:string}) {
 const c=copy[lang],r=resizeCopy[lang],t=cropCopy[lang];
 const input=useRef<HTMLInputElement>(null),canvas=useRef<HTMLCanvasElement>(null),loadId=useRef(0),urls=useRef(new Set<string>());
 const [source,setSource]=useState<Source>(),[history,setHistory]=useState<Edit[]>([]),[index,setIndex]=useState(0);
 const [selection,setSelection]=useState<PercentCrop>(fullCrop),[ratio,setRatio]=useState('free'),[angle,setAngle]=useState(0),[expand,setExpand]=useState(true);
 const [format,setFormat]=useState<ImageFormat>('image/png'),[quality,setQuality]=useState(90),[loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[dragging,setDragging]=useState(false),[error,setError]=useState<ResizeError>();
 const [result,setResult]=useState<{url:string;blob:Blob;key:string}>();
 const committed=history[index],edit=committed?(angle?rotateEdit(committed,angle,expand):committed):undefined;
 const key=JSON.stringify([edit,format,format==='image/png'?100:quality,source?.url]);
 const validation=edit&&source?dimensionError(edit.width,edit.height,source.width*source.height):undefined;
 const current=result?.key===key&&!loading&&!validation&&!error?result:undefined;
 const aspect=ratio==='free'?undefined:Number(ratio.split(':')[0])/Number(ratio.split(':')[1]);
 function revoke(url:string){URL.revokeObjectURL(url);urls.current.delete(url);}
 function fail(e:unknown){const message=e instanceof Error?e.message:'';setError(codes.find(code=>code===message)??'exportError');}
 useEffect(()=>()=>{loadId.current++;for(const url of urls.current)URL.revokeObjectURL(url);urls.current.clear();},[]);
 useEffect(()=>{const target=canvas.current;if(!target||!source||!edit)return;try{renderEdit(source.image,edit,target,true);}catch(e){fail(e);}return()=>{target.width=0;target.height=0;};},[source,key]);
 useEffect(()=>{
  let cancelled=false,url:string|undefined;setResult(undefined);setBusy(false);if(!source||!edit||validation||loading)return;
  setBusy(true);setError(undefined);const timer=setTimeout(async()=>{try{const blob=await exportEdit(source.image,edit,format,quality);if(cancelled)return;url=URL.createObjectURL(blob);urls.current.add(url);setResult({url,blob,key});}catch(e){if(!cancelled)fail(e);}finally{if(!cancelled)setBusy(false);}},250);
  return()=>{cancelled=true;clearTimeout(timer);if(url)revoke(url);};
 },[source,key,validation,loading]);
 async function load(file?:File){
  if(!file)return;const id=++loadId.current;setLoading(true);setError(undefined);let url:string|undefined;
  try{const header=await inspectImage(file);if(id!==loadId.current)return;url=URL.createObjectURL(file);urls.current.add(url);const image=new window.Image();image.src=url;await image.decode();if(id!==loadId.current){revoke(url);return;}
   const width=image.naturalWidth,height=image.naturalHeight;if(!width||!height)throw new Error('decode');if(width>resizeLimits.side||height>resizeLimits.side||width*height>resizeLimits.inputPixels)throw new Error('inputLimit');
   if(source)revoke(source.url);setSource({image,url,name:file.name,width,height});setHistory([originalEdit(width,height)]);setIndex(0);setSelection(fullCrop);setRatio('free');setAngle(0);setExpand(true);setFormat(header.format);setQuality(90);
  }catch(e){if(url)revoke(url);if(id===loadId.current)fail(e);}finally{if(id===loadId.current)setLoading(false);}
 }
 function selectRatio(value:string,base=edit){setRatio(value);if(!base)return;const a=value==='free'?undefined:Number(value.split(':')[0])/Number(value.split(':')[1]);const rect=fitRatio(base.width,base.height,a);setSelection({unit:'%',x:rect.x/base.width*100,y:rect.y/base.height*100,width:rect.width/base.width*100,height:rect.height/base.height*100});}
 function commit(next:Edit){setHistory([...history.slice(0,index+1),next].slice(-(historyLimit+1)));setIndex(Math.min(index+1,historyLimit));setAngle(0);setError(undefined);selectRatio(ratio,next);}
 function navigate(next:number){setIndex(next);setAngle(0);setError(undefined);selectRatio(ratio,history[next]);}
 function restore(){if(!source)return;commit(originalEdit(source.width,source.height));setRatio('free');setSelection(fullCrop);}
 function download(){if(!current||!edit)return;const a=document.createElement('a');a.href=current.url;const name=(source?.name.replace(/\.[^.]+$/,'')||'image').replace(/[<>:"/\\|?*\u0000-\u001f]/g,'_');a.download=`${name}-edited-${edit.width}x${edit.height}.${format==='image/jpeg'?'jpg':format==='image/png'?'png':'webp'}`;document.body.appendChild(a);a.click();a.remove();}
 const icon=(label:string,Icon:typeof Undo2,action:()=>void,disabled=false)=><Button type="button" variant="outline" size="icon" aria-label={label} title={label} disabled={disabled} onClick={action}><Icon/></Button>;
 function manual(value:number){if(!Number.isFinite(value))return;setAngle(Math.max(-180,Math.min(180,value)));setError(undefined);setSelection(fullCrop);setRatio('free');}
 return <Shell lang={lang} slug={slug}><main id="main" className="content-width tool-page resize-page crop-page">
  <nav className="breadcrumbs"><Link to="/$lang" params={{lang}}>{c.home}</Link><ChevronRight size={13}/><span>{tool.titles[langIndex(lang)]}</span></nav>
  <div className="tool-page-heading"><ToolIcon tool={tool}/><div><h1>{tool.titles[langIndex(lang)]}</h1><p>{tool.descriptions[langIndex(lang)]}</p></div></div><div className="phase-notice"><ShieldCheck size={18}/><p>{r.local}</p></div>
  <div className="workspace" aria-busy={loading||busy}><div className="workspace-main">
   <section className={`upload-area ${dragging?'resize-dragging':''}`} onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);void load(e.dataTransfer.files[0]);}}><ImagePlus size={32}/><h2>{c.upload}</h2><p>{c.drop}</p><input ref={input} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" className="sr-only" aria-label={c.choose} tabIndex={-1} onChange={e=>{void load(e.target.files?.[0]);e.target.value='';}}/><Button size="lg" disabled={loading} onClick={()=>input.current?.click()}>{loading?<LoaderCircle className="animate-spin"/>:<ImagePlus/>}{loading?r.processing:source?r.another:c.choose}</Button><small>{r.formats}</small></section>
   {source&&edit&&<><section className="preview-section"><h2>{r.original} · {source.width} × {source.height} px</h2><div className="resize-image-frame crop-original"><img src={source.url} alt={r.original}/></div><p className="resize-filename">{source.name}</p></section><section className="preview-section"><h2>{t.selection} · {Math.max(1,Math.round(edit.width*selection.width/100))} × {Math.max(1,Math.round(edit.height*selection.height/100))} px</h2><div className="crop-stage"><ReactCrop crop={selection} onChange={(_,percent)=>setSelection(percent)} aspect={aspect} keepSelection ruleOfThirds ariaLabels={{cropArea:t.selection,n:t.selection,ne:t.selection,e:t.selection,se:t.selection,s:t.selection,sw:t.selection,w:t.selection,nw:t.selection}}><canvas ref={canvas} aria-label={t.selection}/></ReactCrop></div></section></>}
   <section className="preview-section"><h2>{t.result}{current&&edit?` · ${edit.width} × ${edit.height} px`:''}</h2><div className="resize-image-frame" aria-live="polite">{current?<img src={current.url} alt={t.result}/>:<div className="resize-empty">{busy||loading?<LoaderCircle className="animate-spin" size={30}/>:<ImageIcon size={40}/>}<p>{busy||loading?r.processing:t.empty}</p></div>}</div>{current&&<p className="resize-file-size">{r.actual}: {(current.blob.size/1024).toLocaleString(lang,{maximumFractionDigits:1})} KiB · {format==='image/jpeg'?'JPG':format==='image/png'?'PNG':'WebP'}</p>}</section>
  </div><aside className="settings-panel"><div className="panel-heading"><h2>{c.settings}</h2></div><fieldset className="resize-fields" disabled={!source||loading}>
   <div className="crop-toolbar">{icon(t.undo,Undo2,()=>navigate(index-1),index===0)}{icon(t.redo,Redo2,()=>navigate(index+1),index>=history.length-1)}{icon(t.restore,RotateCcw,restore)}</div>
   <label className="setting-field"><span>{c.ratio}</span><select value={ratio} onChange={e=>selectRatio(e.target.value)}>{[['free',t.free],['1:1',`1:1 — ${t.square}`],['4:3',`4:3 — ${t.landscape}`],['3:4',`3:4 — ${t.portrait}`],['16:9',`16:9 — ${t.wide}`],['9:16',`9:16 — ${t.vertical}`]].map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
   <Button className="resize-restore" variant="outline" onClick={()=>{if(edit)commit(cropEdit(edit,{x:edit.width*selection.x/100,y:edit.height*selection.y/100,width:edit.width*selection.width/100,height:edit.height*selection.height/100}));}}><Crop/>{t.apply}</Button>
   <div className="crop-toolbar">{icon(t.left,RotateCcw,()=>{if(edit)commit(rotateEdit(edit,-90,true));})}{icon(t.right,RotateCw,()=>{if(edit)commit(rotateEdit(edit,90,true));})}{icon(t.half,RotateCw,()=>{if(edit)commit(rotateEdit(edit,180,true));})}</div>
   <label className="setting-field"><span>{t.angle}<small>{angle}°</small></span><input type="range" aria-label={t.angle} min={-180} max={180} step={1} value={angle} onChange={e=>manual(Number(e.target.value))}/><input type="number" aria-label={`${t.angle} (°)`} min={-180} max={180} value={angle} onChange={e=>manual(Number(e.target.value))}/></label>
   <label className="setting-check"><input type="checkbox" checked={expand} onChange={e=>{setExpand(e.target.checked);setError(undefined);setSelection(fullCrop);setRatio('free');}}/>{t.expand}</label><p className="settings-hint">{expand?t.expanded:t.cut}</p><Button variant="outline" className="resize-restore crop-angle-apply" disabled={!angle} onClick={()=>{if(edit)commit(edit);}}><RotateCw/>{t.applyAngle}</Button>
   <div className="crop-toolbar">{icon(t.horizontal,FlipHorizontal2,()=>{if(edit)commit(flipEdit(edit,true));})}{icon(t.verticalFlip,FlipVertical2,()=>{if(edit)commit(flipEdit(edit,false));})}</div>
   <label className="setting-field"><span>{c.output}</span><select value={format} onChange={e=>{setFormat(e.target.value as ImageFormat);setError(undefined);}}><option value="image/jpeg">JPG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option></select></label>{format!=='image/png'&&<label className="setting-field"><span>{r.quality}<small>{quality}%</small></span><input type="range" aria-label={r.quality} min={1} max={100} value={quality} onChange={e=>{setQuality(Number(e.target.value));setError(undefined);}}/></label>}{format==='image/jpeg'&&<p className="settings-hint">{r.jpg}</p>}
  </fieldset><p className="settings-hint">{t.history}</p><p className="settings-hint">{r.limits}</p><div aria-live="polite">{(error||validation)&&<p role="alert" className="resize-error">{r[error||validation||'exportError']}</p>}</div><div className="export-section"><h3>{c.export}</h3><Button className="resize-download" size="lg" disabled={!current||busy} onClick={download}>{busy?<LoaderCircle className="animate-spin"/>:<Download/>}{busy?r.processing:t.download}</Button></div></aside></div>
  <ReservedSpace lang={lang}/><section className="how-section"><h2>{t.how}</h2><div className="steps-grid">{[[r.first,r.firstDesc],[t.second,t.secondDesc],[r.third,t.thirdDesc]].map(([title,desc],n)=><div key={title}><span className="step-number">{n+1}</span><h3>{title}</h3><p>{desc}</p></div>)}</div></section><section className="privacy-strip"><ShieldCheck size={25}/><div><h3>{c.private}</h3><p>{r.local}</p></div></section><section className="faq-section"><h2>{c.faq}</h2>{[[t.faq1,t.answer1],[t.faq2,t.answer2],[t.faq3,t.answer3]].map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</section><section className="related-section"><h2>{c.related}</h2><div className="tool-grid related-grid">{tools.filter(item=>item.id!==tool.id&&item.category===tool.category).slice(0,3).map(item=><ToolCard key={item.id} tool={item} lang={lang}/>)}</div></section>
 </main></Shell>;
}