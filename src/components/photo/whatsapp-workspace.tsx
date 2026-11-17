import { MessageCircle } from 'lucide-react';
import type { Language, Tool } from '@/lib/photo/content';
import { whatsappCopy } from '@/lib/photo/whatsapp-copy';
import { hasWhatsAppProfileGuide, initialWhatsApp, whatsappFilename, whatsappPresets } from '@/lib/photo/whatsapp';
import { InstagramWorkspace } from './instagram-workspace';

export function WhatsAppWorkspace({ tool, lang, slug }: { tool: Tool; lang: Language; slug: string }) {
  return <InstagramWorkspace tool={tool} lang={lang} slug={slug} configuration={{
    copy: whatsappCopy[lang], presets: whatsappPresets, presetLabels: whatsappCopy[lang], initial: initialWhatsApp,
    filename: whatsappFilename, custom: false, pageClass: 'whatsapp-page',
    emptyIcon: <MessageCircle size={40}/>, guide: hasWhatsAppProfileGuide,
    guideLabel: whatsappCopy[lang].guide,
  }}/>;
}
