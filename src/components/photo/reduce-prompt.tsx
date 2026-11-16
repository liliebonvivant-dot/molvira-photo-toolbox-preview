import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Language } from '@/lib/photo/content';
import { largeCopy } from '@/lib/photo/large-copy';
import type { ReduceOffer } from '@/lib/photo/large-image';
export const px = (w: number, h: number, lang: Language) => `${w.toLocaleString(lang)} × ${h.toLocaleString(lang)}`;
export function ReducePrompt({ offer, lang, onReduce, onCancel }: { offer: ReduceOffer; lang: Language; onReduce: () => void; onCancel: () => void }) {
  const l = largeCopy[lang], o = px(offer.width, offer.height, lang), r = px(offer.reduced.width, offer.reduced.height, lang);
  return <section className="preview-section" role="alert"><div className="phase-notice"><ShieldCheck size={18}/><div><p>{l.tooLarge.replace('{o}', o)}</p><p>{l.reduceAsk}</p><p>{l.original}: {o} px · {l.working}: {r} px</p><div className="mt-3 flex flex-wrap gap-2"><Button onClick={onReduce}>{l.reduceTo.replace('{r}', r)}</Button><Button variant="outline" onClick={onCancel}>{l.cancel}</Button></div></div></div></section>;
}
export function ResolutionNote({ source, lang }: { source: { width: number; height: number; originalWidth: number; originalHeight: number; reduced: boolean }; lang: Language }) {
  const l = largeCopy[lang];
  return <p className="settings-hint">{l.original}: {px(source.originalWidth, source.originalHeight, lang)} px · {l.working}: {px(source.width, source.height, lang)} px{source.reduced ? <><br/>{l.reducedNote}</> : null}</p>;
}
