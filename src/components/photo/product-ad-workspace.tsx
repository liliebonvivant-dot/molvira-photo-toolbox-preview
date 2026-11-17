import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { ChevronRight, ImagePlus, Undo2, Redo2, RotateCw, RotateCcw, Trash2, LoaderCircle, ShieldCheck, Wand2, Stamp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { copy, langIndex, type Language, type Tool } from '@/lib/photo/content';
import { productAdCopy } from '@/lib/photo/product-ad-copy';
import { adFields, adFormats, adTemplates, initialAd, selectAdTemplate, selectAdFormat, commitAd, undoAd, redoAd, resetAd, usedAdAssets, drawAd, encodeAd, adFilename, loadAdSource, adSourceAllowance, adPhotoCell, type AdState, type AdHistory, type AdField } from '@/lib/photo/product-ad';
import { releaseCollageSource, type CollageSource } from '@/lib/photo/collage';
import { inspectImage, type ImageFormat } from '@/lib/photo/resize';
import { reducedDimensions } from '@/lib/photo/convert';
import { clamp, currencies, editorFonts, hitLayer, type LayerRect } from '@/lib/photo/text-editor';
import type { ReduceOffer, Size } from '@/lib/photo/large-image';
import { Shell, ReservedSpace } from './shell';
import { ToolIcon } from './tool-card';
import { ReducePrompt, ResolutionNote } from './reduce-prompt';
import { FileSaving } from './file-saving';

type AdError = 'fileType' | 'fileSize' | 'inputLimit' | 'decode' | 'exportError' | 'memory' | 'dimensions' | 'outputLimit';
const errorCode = (e: unknown): AdError => { const m = e instanceof Error ? e.message : 'decode'; return ['fileType','fileSize','inputLimit','decode','exportError','memory','dimensions','outputLimit'].includes(m) ? m as AdError : 'decode'; };
export function ProductAdWorkspace({ tool, lang, slug }: { tool: Tool; lang: Language; slug: string }) {
  const c=copy[lang], r=productAdCopy[lang];
  const canvas=useRef<HTMLCanvasElement>(null), photoInput=useRef<HTMLInputElement>(null), logoInput=useRef<HTMLInputElement>(null), assets=useRef(new Map<string,CollageSource>()), sequence=useRef(0), alive=useRef(true), lock=useRef(false), output=useRef<string | undefined>(undefined);
  const [history,setHistory]=useState<AdHistory>(()=>({past:[],present:initialAd(),future:[]})), [selected,setSelected]=useState<AdField | 'photo' | 'logo'>('photo');
  const [format,setFormat]=useState<ImageFormat>('image/png'), [quality,setQuality]=useState(95), [loading,setLoading]=useState(false), [busy,setBusy]=useState(false), [error,setError]=useState<AdError>(), [pending,setPending]=useState<{offer:ReduceOffer; kind:'photo'|'logo'}>(), [reset,setReset]=useState(false), [result,setResult]=useState<{blob:Blob;url:string;key:string}>();
  const s=history.present, latest=useRef(s); latest.current=s;
  const photo=s.photo ? assets.current.get(s.photo) : undefined;
  const key=JSON.stringify([s,format,quality]);
  const current=result?.key===key && !error && !pending ? result : undefined;
  const rects=useRef<{id:string;rect:LayerRect}[]>([]), drag=useRef<{id:number; x:number;y:number;before:AdHistory;selected:typeof selected} | undefined>(undefined);
  function discard() { if(output.current)URL.revokeObjectURL(output.current); output.current=undefined; setResult(undefined); }
  function change(next:AdState) { if(lock.current || pending || drag.current)return; discard();setError(undefined);setHistory(h=>commitAd(h,next)); }
  function patch(p:Partial<AdState>) { change({...s,...p}); }
  function textPatch(field:AdField,p:Partial<AdState['texts'][AdField]>) { change({...s,texts:{...s.texts,[field]:{...s.texts[field],...p}}}); }
  function travel(action:(h:AdHistory)=>AdHistory) { discard();setError(undefined);setHistory(action); }
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;for(const source of assets.current.values())releaseCollageSource(source);assets.current.clear();if(output.current)URL.revokeObjectURL(output.current);const stage=canvas.current;if(stage){stage.width=0;stage.height=0;}};},[]);
  useEffect(()=>{const used=usedAdAssets(history);for(const [id,source] of assets.current)if(!used.has(id)){releaseCollageSource(source);assets.current.delete(id);}},[history]);
  async function load(file:File | undefined,kind:'photo'|'logo',target?:Size) {
    if(!file || lock.current || drag.current)return;lock.current=true;setLoading(true);setPending(undefined);setError(undefined);discard();
    try {
      const header=await inspectImage(file);if(kind==='logo' && header.format==='image/jpeg')throw new Error('fileType');
      const loaded=await loadAdSource(file,latest.current,assets.current,kind==='logo',target);
      if(!alive.current){if('image' in loaded)releaseCollageSource(loaded);return;}
      if(!('image' in loaded)){setPending({offer:loaded,kind});return;}
      const id=`ad-asset-${++sequence.current}`;assets.current.set(id,loaded);
      setHistory(h=>commitAd(h,{...h.present,[kind]:id,...(kind==='photo'?{zoom:1,x:0,y:0,rotation:0}:{})}));setSelected(kind);
    } catch(e) {
      if(!alive.current)return;const code=errorCode(e);
      if(!target && (code==='decode'||code==='exportError')) {
        const header=await inspectImage(file).catch(()=>undefined), allowance=adSourceAllowance(latest.current,assets.current,kind==='logo');
        if(!alive.current)return;
        if(header && allowance>0 && header.width*header.height>1){setPending({kind,offer:{file,...header,reduced:reducedDimensions(header.width,header.height,Math.max(1,Math.min(allowance,Math.floor(header.width*header.height/2))))}});return;}
      }
      setError(code);
    } finally {lock.current=false;if(alive.current)setLoading(false);}
  }
  useEffect(()=>{
    const stage=canvas.current;if(!stage)return;stage.width=s.width;stage.height=s.height;const ctx=stage.getContext('2d');if(!ctx)return;
    rects.current=drawAd(ctx,s,assets.current);
  },[s,lang]);
  function point(e:PointerEvent<HTMLCanvasElement>){const b=e.currentTarget.getBoundingClientRect();return{x:(e.clientX-b.left)/b.width*s.width,y:(e.clientY-b.top)/b.height*s.height};}
  function down(e:PointerEvent<HTMLCanvasElement>){if(lock.current||pending)return;const p=point(e);const hit=hitLayer(rects.current,p.x,p.y);const active=hit && (hit==='logo'||adFields.includes(hit as AdField)) ? hit as AdField|'logo' : 'photo';setSelected(active);if(active==='photo'&&!photo)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);discard();drag.current={id:e.pointerId,...p,before:history,selected:active};}
  function move(e:PointerEvent<HTMLCanvasElement>){const d=drag.current;if(!d||d.id!==e.pointerId)return;const p=point(e), base=d.before.present, dx=(p.x-d.x)/s.width*100,dy=(p.y-d.y)/s.height*100;let next:AdState;
    if(d.selected==='photo'){const cell=adPhotoCell(s);next={...base,x:clamp(base.x+dx*s.width/cell.width,-100,100),y:clamp(base.y+dy*s.height/cell.height,-100,100)};}
    else if(d.selected==='logo')next={...base,logoX:clamp(base.logoX+dx,0,100),logoY:clamp(base.logoY+dy,0,100)};
    else {const t=base.texts[d.selected];next={...base,texts:{...base.texts,[d.selected]:{...t,x:clamp(t.x+dx,0,100),y:clamp(t.y+dy,0,100)}}};}
    latest.current=next;setHistory({...d.before,present:next});
  }
  function finish(cancel=false){const d=drag.current;if(!d)return;drag.current=undefined;setHistory(h=>cancel?d.before:commitAd(d.before,h.present));}
  async function prepare(){if(!photo||lock.current||pending||drag.current)return;lock.current=true;setBusy(true);setError(undefined);discard();try{const blob=await encodeAd(s,assets.current,format,format==='image/png'?100:quality);if(!alive.current)return;const url=URL.createObjectURL(blob);output.current=url;setResult({blob,url,key});}
    catch(e){if(alive.current){setError(errorCode(e));const allowance=adSourceAllowance(s,assets.current,false);if(allowance>0&&photo.width*photo.height>1)setPending({kind:'photo',offer:{file:photo.file,width:photo.originalWidth,height:photo.originalHeight,reduced:reducedDimensions(photo.width,photo.height,Math.max(1,Math.min(allowance,Math.floor(photo.width*photo.height/2))))}});}}
    finally{lock.current=false;if(alive.current)setBusy(false);}}
  const disabled=loading||busy||!!pending;
  const icon=(label:string,node:ReactNode,action:()=>void,off=false)=><Button variant="outline" size="icon" title={label} aria-label={label} disabled={disabled||off} onClick={action}>{node}</Button>;
  const slider=(label:string,value:number,min:number,max:number,action:(v:number)=>void,step=1)=><label className="setting-field"><span>{label}<small>{Math.round(value*100)/100}</small></span><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={e=>action(Number(e.target.value))}/></label>;
  const templateLabels={simple:r.simple,promotion:r.promotionTemplate,catalog:r.catalog,whatsapp:r.whatsapp,instagram:r.instagram};
  const field=selected!=='photo'&&selected!=='logo'?selected:undefined, active=field?s.texts[field]:undefined;
  return <Shell lang={lang} slug={slug}><main id="main" className="content-width tool-page resize-page instagram-page product-ad-page">
    <nav className="breadcrumbs"><Link to="/$lang" params={{lang}}>{c.home}</Link><ChevronRight size={13}/><span>{tool.titles[langIndex(lang)]}</span></nav>
    <div className="tool-page-heading"><ToolIcon tool={tool}/><div><h1>{tool.titles[langIndex(lang)]}</h1><p>{tool.descriptions[langIndex(lang)]}</p></div></div>
    <div className="phase-notice"><ShieldCheck size={18}/><p>{r.local}</p></div>
    <div className="workspace"><div className="workspace-main">
      <section className="upload-area" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(!disabled)void load(e.dataTransfer.files[0],'photo');}}><ImagePlus size={32}/><h2>{r.upload}</h2><p>{r.drop}</p><input ref={photoInput} type="file" className="sr-only" aria-label={r.choose} accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" disabled={disabled} onChange={e=>{void load(e.target.files?.[0],'photo');e.target.value='';}}/><Button size="lg" disabled={disabled} onClick={()=>photoInput.current?.click()}>{loading?<LoaderCircle className="animate-spin"/>:<ImagePlus/>}{photo?r.replace:r.choose}</Button><small>{r.formats}</small></section>
      {pending&&<ReducePrompt offer={pending.offer} lang={lang} onCancel={()=>setPending(undefined)} onReduce={()=>void load(pending.offer.file,pending.kind,pending.offer.reduced)}/>}
      {photo&&<><p className="resize-filename">{photo.file.name}</p><ResolutionNote source={photo} lang={lang}/></>}
      <section className="preview-section"><h2>{r.preview} · {s.width} × {s.height} px</h2><div className="instagram-toolbar">{icon(r.undo,<Undo2/>,()=>travel(undoAd),!history.past.length)}{icon(r.redo,<Redo2/>,()=>travel(redoAd),!history.future.length)}{icon(r.rotate,<RotateCw/>,()=>patch({rotation:(s.rotation+90)%360}),!photo)}{icon(r.reset,<RotateCcw/>,()=>setReset(true))}{icon(r.remove,<Trash2/>,()=>patch({photo:undefined}),!photo)}</div>
        <div className="instagram-stage"><canvas ref={canvas} aria-label={r.preview} tabIndex={0} onPointerDown={down} onPointerMove={move} onPointerUp={()=>finish()} onPointerCancel={()=>finish(true)} onLostPointerCapture={()=>finish()} onKeyDown={e=>{if(disabled)return;const directions:Record<string,[number,number]>={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};const d=directions[e.key];if(!d)return;e.preventDefault();if(field&&active)textPatch(field,{x:clamp(active.x+d[0],0,100),y:clamp(active.y+d[1],0,100)});else if(selected==='logo')patch({logoX:clamp(s.logoX+d[0],0,100),logoY:clamp(s.logoY+d[1],0,100)});else patch({x:clamp(s.x+d[0],-100,100),y:clamp(s.y+d[1],-100,100)});}}/></div>
        <p role="status" className="instagram-status settings-hint">{loading||busy?r.processing:'\u00a0'}</p>
      </section>
      <fieldset className="ad-content-fields" disabled={disabled}><div className="settings-two"><label className="setting-field"><span>{r.template}</span><select aria-label={r.template} value={s.template} onChange={e=>change(selectAdTemplate(s,e.target.value as AdState['template']))}>{adTemplates.map(t=><option key={t} value={t}>{templateLabels[t]}</option>)}</select></label><label className="setting-field"><span>{r.preset}</span><select aria-label={r.preset} value={s.preset} onChange={e=>change(selectAdFormat(s,e.target.value as AdState['preset']))}>{(Object.keys(adFormats) as AdState['preset'][]).map(p=><option key={p} value={p}>{r[p]}</option>)}</select></label></div>
        {adFields.map(f=><label className="setting-field" key={f}><span>{r[f]}</span><textarea aria-label={r[f]} rows={f==='description'?3:1} maxLength={500} value={s.texts[f].text} onFocus={()=>setSelected(f)} onChange={e=>textPatch(f,{text:e.target.value})}/></label>)}
        <label className="setting-field"><span>{r.currency}</span><input aria-label={r.currency} list="ad-currencies" maxLength={12} value={s.currency} onChange={e=>patch({currency:e.target.value})}/><datalist id="ad-currencies">{currencies.map(v=><option key={v} value={v}/>)}</datalist></label>
      </fieldset>
    </div><aside className="settings-panel"><h2>{c.settings}</h2><fieldset className="resize-fields" disabled={disabled}>
      <label className="setting-field"><span>{r.element}</span><select aria-label={r.element} value={selected} onChange={e=>setSelected(e.target.value as typeof selected)}><option value="photo">{r.photo}</option>{adFields.map(f=><option key={f} value={f}>{r[f]}</option>)}<option value="logo">{r.logo}</option></select></label>
      {selected==='photo'&&<><div className="instagram-fit"><Button variant={s.fit==='contain'?'default':'outline'} aria-pressed={s.fit==='contain'} onClick={()=>patch({fit:'contain',zoom:1})}>{r.contain}</Button><Button variant={s.fit==='cover'?'default':'outline'} aria-pressed={s.fit==='cover'} onClick={()=>patch({fit:'cover',zoom:1})}>{r.cover}</Button></div>{slider(r.zoom,s.zoom,.1,4,zoom=>patch({zoom}),.01)}{slider(r.x,s.x,-100,100,x=>patch({x}))}{slider(r.y,s.y,-100,100,y=>patch({y}))}</>}
      {field&&active&&<><label className="setting-field"><span>{r.textColor}</span><input aria-label={r.textColor} type="color" value={active.color} onChange={e=>textPatch(field,{color:e.target.value})}/></label><label className="setting-field"><span>{r.font}</span><select aria-label={r.font} value={active.font} onChange={e=>textPatch(field,{font:e.target.value})}>{editorFonts.map(f=><option key={f}>{f}</option>)}</select></label>{slider(r.size,active.size,.5,20,size=>textPatch(field,{size}),.1)}{slider(r.x,active.x,0,100,x=>textPatch(field,{x}))}{slider(r.y,active.y,0,100,y=>textPatch(field,{y}))}</>}
      {selected==='logo'&&<>{slider(r.size,s.logoSize,1,40,logoSize=>patch({logoSize}))}{slider(r.x,s.logoX,0,100,logoX=>patch({logoX}))}{slider(r.y,s.logoY,0,100,logoY=>patch({logoY}))}</>}
      <div className="ad-logo-controls"><input ref={logoInput} type="file" className="sr-only" aria-label={r.chooseLogo} accept="image/png,image/webp,.png,.webp" disabled={disabled} onChange={e=>{void load(e.target.files?.[0],'logo');e.target.value='';}}/><Button variant="outline" onClick={()=>logoInput.current?.click()}><Stamp/>{r.chooseLogo}</Button>{icon(r.removeLogo,<Trash2/>,()=>patch({logo:undefined}),!s.logo)}<p className="settings-hint">{r.logoFormats}</p></div>
      <label className="setting-field"><span>{r.background}</span><input type="color" aria-label={r.background} value={s.background} onChange={e=>patch({background:e.target.value})}/></label>
      {s.template==='promotion'&&<label className="setting-field"><span>{r.accent}</span><input type="color" aria-label={r.accent} value={s.accent} onChange={e=>patch({accent:e.target.value})}/></label>}
      <label className="setting-field"><span>{c.output}</span><select aria-label={c.output} value={format} onChange={e=>{discard();setError(undefined);setFormat(e.target.value as ImageFormat);}}><option value="image/png">PNG</option><option value="image/jpeg">JPG</option><option value="image/webp">WebP</option></select></label>{format!=='image/png'&&slider(r.quality,quality,1,100,v=>{discard();setQuality(v);})}
    </fieldset>{error&&<p role="alert" className="resize-error">{r[error]}</p>}<Button variant="outline" className="resize-download mt-5" disabled={!photo||disabled} onClick={()=>void prepare()}>{busy?<LoaderCircle className="animate-spin"/>:<Wand2/>}{busy?r.processing:r.prepare}</Button><FileSaving lang={lang} result={current} filename={adFilename(format)} title={c.export} label={r.download} processing={r.processing} busy={loading||busy} disabled={!current||disabled} mode="auto"/>
    </aside></div><ReservedSpace lang={lang}/>
    <AlertDialog open={reset} onOpenChange={setReset}><AlertDialogContent><AlertDialogTitle>{r.resetTitle}</AlertDialogTitle><AlertDialogDescription>{r.resetBody}</AlertDialogDescription><AlertDialogFooter><AlertDialogCancel>{r.cancelReset}</AlertDialogCancel><AlertDialogAction onClick={()=>change(resetAd(s))}>{r.confirm}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </main></Shell>;
}
