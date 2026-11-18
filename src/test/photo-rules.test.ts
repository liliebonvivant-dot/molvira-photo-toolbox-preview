import { describe, expect, it } from 'vitest';
import { tools, languages, equivalentSlug, resolvePage, pageHead } from '@/lib/photo/content';
describe('MOLVIRA PHOTO approved rules',()=>{
 it('preserves the approved catalog and adds the authorized WhatsApp tool',()=>{expect(tools.map(t=>t.titles[0])).toEqual(['Remove Image Background','Instagram Image Maker','WhatsApp Image Maker','Product Ad Maker','White Background Maker','Add Text, Prices & Logos','Resize Images','Compress Images','Convert Images','Photo Collage Maker','Add Watermark','Crop & Rotate Images','E-commerce Image Maker']);});
 it('supports English, Brazilian Portuguese and Spanish',()=>{expect(languages).toEqual(['en','pt','es']);});
 it('preserves the same tool when switching languages',()=>{for(const tool of tools)for(const lang of languages){const slug=equivalentSlug('en',tool.slugs[0],lang);expect(slug).toBe(tool.slugs[languages.indexOf(lang)]);expect(resolvePage(lang,slug??'').tool?.id).toBe(tool.id);}});
 it('allows indexing of the 12 public tools in all three languages',()=>{const publicTools=tools.filter(t=>t.id!=='remove-background');expect(publicTools).toHaveLength(12);for(const tool of publicTools)for(const lang of languages){expect(pageHead(lang,tool.slugs[languages.indexOf(lang)]).meta.find(m=>'name'in m&&m.name==='robots')?.content).toBe('index, follow');}});
 it('keeps background removal excluded from indexing in every language',()=>{const tool=tools.find(t=>t.id==='remove-background');expect(tool).toBeDefined();if(!tool)throw new Error('Missing held tool');for(const lang of languages){expect(pageHead(lang,tool.slugs[languages.indexOf(lang)]).meta.find(m=>'name'in m&&m.name==='robots')?.content).toBe('noindex, nofollow');}});
});
