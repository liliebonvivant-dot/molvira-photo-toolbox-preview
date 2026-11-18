import { useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { needsAnswer, onConsentChange, readChoice, saveChoices } from '@/lib/consent';
import { institutional, langIndex, type Language } from '@/lib/photo/content';

const text = {
  en: { title:'Privacy choices', body:'We use analytics cookies to measure page views and tool interactions. We also count visits without cookies and, with your acceptance, measure clicks.', accept:'Accept all', reject:'Reject all', settings:'Cookie settings', necessary:'Necessary', analytics:'Analytics, provided by Google and Lovable', save:'Save choices', privacy:'Privacy Policy', signal:'Your browser’s privacy signal applies.' },
  pt: { title:'Preferências de privacidade', body:'Usamos cookies de análise para medir visualizações de páginas e interações com ferramentas. Também contamos visitas sem cookies e, com sua aceitação, medimos cliques.', accept:'Aceitar tudo', reject:'Recusar tudo', settings:'Configurações de cookies', necessary:'Necessários', analytics:'Análise, fornecida por Google e Lovable', save:'Salvar escolhas', privacy:'Política de Privacidade', signal:'O sinal de privacidade do seu navegador se aplica.' },
  es: { title:'Preferencias de privacidad', body:'Usamos cookies de análisis para medir vistas de páginas e interacciones con herramientas. También contamos visitas sin cookies y, con tu aceptación, medimos clics.', accept:'Aceptar todo', reject:'Rechazar todo', settings:'Configuración de cookies', necessary:'Necesarios', analytics:'Análisis, proporcionado por Google y Lovable', save:'Guardar preferencias', privacy:'Política de Privacidad', signal:'Se aplica la señal de privacidad de tu navegador.' },
};
export function CookieConsent({ lang }: { lang: Language }) {
  const c=text[lang];
  const [open,setOpen]=useState(false), [settings,setSettings]=useState(false), [analytics,setAnalytics]=useState(false), [gpc,setGpc]=useState(false);
  const panel=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    let live=true;
    const sync=()=>{setAnalytics(readChoice('analytics')==='granted');setGpc((navigator as Navigator & {globalPrivacyControl?:boolean}).globalPrivacyControl===true);void needsAnswer(['analytics']).then(v=>{if(live)setOpen(v);});};
    sync();const off=onConsentChange(sync);return()=>{live=false;off();};
  },[]);
  useEffect(()=>{if(open)panel.current?.focus();},[open]);
  function save(granted:boolean){saveChoices({analytics:granted?'granted':'denied'});setOpen(false);setSettings(false);}
  return <><Button variant="link" className="h-auto justify-start p-0" onClick={()=>{setAnalytics(readChoice('analytics')==='granted');setSettings(true);setOpen(true);}}>{c.settings}</Button>{open&&<div ref={panel} tabIndex={-1} role="dialog" aria-label={c.title} className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-h-[80vh] max-w-xl overflow-y-auto rounded-md border border-border bg-background p-5 text-foreground shadow-lg"><h2 className="mb-2 text-lg font-semibold">{c.title}</h2><p className="mb-3 text-sm">{c.body} <Link className="underline" to="/$lang/$page" params={{lang,page:institutional.privacy[langIndex(lang)]}}>{c.privacy}</Link></p>{settings&&<div className="mb-4 space-y-3"><div>{c.necessary}</div>{gpc&&<p className="text-sm">{c.signal}</p>}<label className="flex items-center justify-between gap-4"><span>{c.analytics}</span><Switch aria-label={c.analytics} checked={analytics&&!gpc} disabled={gpc} onCheckedChange={setAnalytics}/></label><Button onClick={()=>save(analytics)}>{c.save}</Button></div>}<div className="grid grid-cols-2 gap-2"><Button variant="outline" onClick={()=>save(true)}>{c.accept}</Button><Button variant="outline" onClick={()=>save(false)}>{c.reject}</Button></div><Button variant="link" className="mt-2" onClick={()=>setSettings(true)}>{c.settings}</Button></div>}</>;
}