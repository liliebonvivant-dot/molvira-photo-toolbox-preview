import { useEffect } from 'react';
import { trackPage, trackToolSelection } from '@/lib/analytics';
import { onConsentChange } from '@/lib/consent';
import { resolvePage, type Language } from '@/lib/photo/content';
import { isToolAvailable } from '@/lib/photo/availability';

export function AnalyticsObserver({lang,slug}:{lang:Language;slug?:string | undefined}) {
  useEffect(()=>{
    let sent=false, stopped=false, running=false;
    const tool=slug?resolvePage(lang,slug).tool:undefined;
    const path=slug?`/${lang}/${slug}`:`/${lang}`;
    const send=async()=>{if(sent||stopped||running)return;running=true;try{sent=await trackPage(path,lang,tool&&isToolAvailable(tool.id)?tool.id:undefined);}finally{running=false;}};
    void send();const off=onConsentChange(()=>void send());
    const selected=(event:Event)=>{const el=event.target;if(tool&&isToolAvailable(tool.id)&&el instanceof HTMLInputElement&&el.type==='file'&&el.files?.length)void trackToolSelection(tool.id,lang);};
    const dropped=(event:DragEvent)=>{if(tool&&isToolAvailable(tool.id)&&event.dataTransfer?.files.length)void trackToolSelection(tool.id,lang);};
    document.addEventListener('change',selected,true);document.addEventListener('drop',dropped,true);
    return()=>{stopped=true;off();document.removeEventListener('change',selected,true);document.removeEventListener('drop',dropped,true);};
  },[lang,slug]);
  return null;
}