import { ShieldCheck, UserRoundCheck, Languages, Sparkles } from 'lucide-react';
import { copy, tools, type Language } from '@/lib/photo/content';
import { Shell, ReservedSpace } from './shell';
import { ToolCard } from './tool-card';
export function Home({lang}:{lang:Language}) {
 const c=copy[lang];
 return <Shell lang={lang}><main id="main"><section className="home-intro"><div className="intro-eyebrow"><Sparkles size={14}/>Easy · Free · Private.</div><h1>MOLVIRA PHOTO</h1><h2>{c.headline}</h2><p>{c.description}</p><div className="intro-benefits"><span><UserRoundCheck size={16}/>{c.account}</span><span><ShieldCheck size={16}/>{c.private}</span><span><Languages size={16}/>EN · PT · ES</span></div></section><div className="content-width"><ReservedSpace lang={lang}/><section className="catalog"><div className="catalog-heading"><div><h2>{c.catalog}</h2><p>{c.catalogDesc}</p></div></div><div className="tool-grid">{tools.map(tool=><ToolCard key={tool.id} tool={tool} lang={lang}/>)}</div><p className="development-note"><span className="status-dot"/>{c.notice}</p></section><ReservedSpace lang={lang}/><section className="benefits-section"><h2>{c.simple}</h2><div className="benefits-grid">{[[UserRoundCheck,c.account,c.accountDesc],[ShieldCheck,c.private,c.privateDesc],[Languages,c.international,c.internationalDesc]].map(([Icon,title,description])=>{const BenefitIcon=Icon as typeof ShieldCheck;return <div className="benefit" key={String(title)}><BenefitIcon size={24}/><h3>{String(title)}</h3><p>{String(description)}</p></div>;})}</div></section></div></main></Shell>;
}
