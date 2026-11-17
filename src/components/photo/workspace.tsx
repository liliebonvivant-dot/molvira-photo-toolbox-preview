import { WhatsAppWorkspace } from './whatsapp-workspace';
import { ImagePlus, Image, Download, LockKeyhole, ChevronRight, ShieldCheck } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { copy, langIndex, tools, type Language, type Tool } from '@/lib/photo/content';
import { Shell, ReservedSpace } from './shell';
import { ToolCard, ToolIcon } from './tool-card';
import { ResizeWorkspace } from './resize-workspace';
import { CropWorkspace } from './crop-workspace';
import { ConvertWorkspace } from './convert-workspace';
import { CompressWorkspace } from './compress-workspace';
import { WatermarkWorkspace } from './watermark-workspace';
import { BackgroundWorkspace } from './background-workspace';
import { TextEditorWorkspace } from './text-editor-workspace';
import { WhiteBackgroundWorkspace } from './white-background-workspace';
import { CollageWorkspace } from './collage-workspace';
import { InstagramWorkspace } from './instagram-workspace';
function Settings({tool,lang}:{tool:Tool,lang:Language}) {
 const c=copy[lang];
 const select=(label:string,values:string[]) => <label className="setting-field" key={label}><span>{label}</span><select disabled defaultValue={values[0]}>{values.map(v=><option key={v}>{v}</option>)}</select></label>;
 const input=(label:string,value:string,type='text')=><label className="setting-field" key={label}><span>{label}</span><input disabled type={type} defaultValue={value}/></label>;
 const range=(label:string,value:number)=><label className="setting-field" key={label}><span>{label}<small>{value}%</small></span><input disabled type="range" defaultValue={value}/></label>;
 const check=(label:string)=><label className="setting-check" key={label}><input disabled type="checkbox" defaultChecked/>{label}</label>;
 const dimensions=<><div className="settings-two">{input(c.width,'1080','number')}{input(c.height,'1080','number')}</div>{check(c.lock)}</>;
 const background=select(c.background,[c.transparent,c.white]);
 const template=select(c.template,['1:1','4:5','9:16','16:9']);
 const position=select(c.position,['↖','↑','↗','←','•','→','↙','↓','↘']);
 let controls;
 switch(tool.id){
 case 'remove-background': controls=<>{background}{select(c.output,['PNG','WebP'])}{select(lang==='pt'?'Comparação':lang==='es'?'Comparación':'Comparison',[lang==='pt'?'Antes / depois':lang==='es'?'Antes / después':'Before / after'])}</>;break;
 case 'white-background':controls=<>{select(c.background,[c.white])}{range(c.margin,10)}{select(c.output,['JPG','PNG','WebP'])}</>;break;
 case 'instagram':controls=<>{template}{select(c.ratio,['1:1','4:5','9:16'])}{input(c.text,'')}{background}</>;break;
 case 'product-ad':controls=<>{template}{input(c.text,'')}{input(c.price,'')}{input(c.logo,'')}{background}</>;break;
 case 'text':controls=<>{input(c.text,'')}{input(c.price,'')}{input(c.logo,'')}{position}{select(lang==='pt'?'Cor':lang==='es'?'Color':'Color',['●','○'])}{input(lang==='pt'?'Tamanho':lang==='es'?'Tamaño':'Size','32','number')}</>;break;
 case 'resize':controls=<>{dimensions}{select(c.ratio,['1:1','4:5','9:16','16:9'])}</>;break;
 case 'compress':controls=<>{range(c.quality,80)}{input(c.target,'500','number')}<p className="settings-hint">{lang==='pt'?'A qualidade e o tamanho final dependem da imagem.':lang==='es'?'La calidad y el tamaño final dependen de la imagen.':'Quality and final file size depend on the image.'}</p></>;break;
 case 'convert':controls=<>{select(c.source,[c.auto,'JPG','PNG','WebP','HEIC'])}{select(c.output,['JPG','PNG','WebP','HEIC'])}<p className="settings-hint">{c.formats}</p></>;break;
 case 'collage':controls=<>{select(c.template,['▧','▦','▤'])}{range(c.spacing,10)}{background}{dimensions}</>;break;
 case 'watermark':controls=<>{input(c.text,'')}{input(c.logo,'')}{position}{range(c.opacity,50)}{range(lang==='pt'?'Tamanho':lang==='es'?'Tamaño':'Size',25)}{check(c.repeat)}</>;break;
 case 'crop':controls=<>{select(c.ratio,[lang==='pt'?'Livre':lang==='es'?'Libre':'Free','1:1','4:5','9:16','16:9'])}{select(c.rotation,['0°','90°','180°','270°'])}</>;break;
 case 'ecommerce':controls=<>{template}{dimensions}{range(c.margin,10)}{background}{position}</>;break;
 }
 return <aside className="settings-panel"><div className="panel-heading"><h2>{c.settings}</h2><LockKeyhole size={15}/></div><p className="settings-status">{c.development}</p><fieldset disabled>{controls}</fieldset><div className="export-section"><h3>{c.export}</h3><Button disabled className="w-full" size="lg"><Download/>{c.download}</Button><small>{c.development}</small></div></aside>;
}
export function Workspace({tool,lang,slug}:{tool:Tool,lang:Language,slug:string}) {if(tool.id==='whatsapp')return <WhatsAppWorkspace tool={tool} lang={lang} slug={slug}/>;if(tool.id==='instagram')return <InstagramWorkspace tool={tool} lang={lang} slug={slug}/>;if(tool.id==='collage')return <CollageWorkspace tool={tool} lang={lang} slug={slug}/>;if(tool.id==='text')return <TextEditorWorkspace tool={tool} lang={lang} slug={slug}/>;if(tool.id==='white-background')return <WhiteBackgroundWorkspace tool={tool} lang={lang} slug={slug}/>;if(tool.id==='remove-background')return <BackgroundWorkspace tool={tool} lang={lang} slug={slug}/>;if(tool.id==='watermark')return <WatermarkWorkspace tool={tool} lang={lang} slug={slug}/>;if(tool.id==='compress')return <CompressWorkspace tool={tool} lang={lang} slug={slug}/>;if(tool.id==='resize')return <ResizeWorkspace tool={tool} lang={lang} slug={slug}/>;if(tool.id==='crop')return <CropWorkspace tool={tool} lang={lang} slug={slug}/>;if(tool.id==='convert')return <ConvertWorkspace tool={tool} lang={lang} slug={slug}/>;const c=copy[lang];const i=langIndex(lang);return <Shell lang={lang} slug={slug}><main id="main" className="content-width tool-page"><nav className="breadcrumbs"><Link to="/$lang" params={{lang}}>{c.home}</Link><ChevronRight size={13}/><span>{tool.titles[i]}</span></nav><div className="tool-page-heading"><ToolIcon tool={tool}/><div><h1>{tool.titles[i]}</h1><p>{tool.descriptions[i]}</p></div></div><div className="phase-notice"><LockKeyhole size={18}/><p>{c.notice}</p></div><div className={`workspace ${tool.category==='create'?'commercial-workspace':''}`}><div className="workspace-main"><section className="upload-area"><ImagePlus size={32}/><h2>{c.upload}</h2><p>{c.drop}</p><Button disabled size="lg"><ImagePlus/>{c.choose}</Button><small>{c.formats}</small></section><section className="preview-section"><h2>{c.preview}</h2><div className="image-preview"><Image size={45} strokeWidth={1}/><p>{c.empty}</p><span>{c.development}</span></div></section></div><Settings tool={tool} lang={lang}/></div><ReservedSpace lang={lang}/><section className="how-section"><h2>{c.how}</h2><div className="steps-grid">{[[c.first,c.firstDesc],[c.second,c.secondDesc],[c.third,c.thirdDesc]].map(([title,desc],n)=><div key={title}><span className="step-number">{n+1}</span><h3>{title}</h3><p>{desc}</p></div>)}</div></section><section className="privacy-strip"><ShieldCheck size={25}/><div><h3>{c.private}</h3><p>{c.privateDesc}</p></div></section><section className="faq-section"><h2>{c.faq}</h2>{[[c.q1,c.a1],[c.q2,c.a2],[c.q3,c.a3]].map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</section><section className="related-section"><h2>{c.related}</h2><div className="tool-grid related-grid">{tools.filter(t=>t.id!==tool.id&&t.category===tool.category).slice(0,3).map(t=><ToolCard key={t.id} tool={t} lang={lang}/>)}</div></section></main></Shell>;}
