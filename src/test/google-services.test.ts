import { describe, expect, it, vi, beforeEach } from 'vitest';
import { canTrack, readChoice, saveChoices } from '@/lib/consent';
import { isToolAvailable, isUnavailablePath } from '@/lib/photo/availability';
import { adsenseId, siteConfig } from '@/lib/site-config';

beforeEach(()=>{localStorage.clear();vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,text:async()=>`h=${location.hostname}\nloc=CA\n`}));});
describe('Google preparation rules',()=>{
  it('makes background removal and all other tools available',()=>{
    expect(isToolAvailable('remove-background')).toBe(true);
    for(const id of ['instagram','whatsapp','product-ad','white-background','text','resize','compress','convert','collage','watermark','crop','ecommerce'])expect(isToolAvailable(id)).toBe(true);
    for(const path of ['/en/remove-image-background','/pt/remover-fundo-de-imagem','/es/eliminar-fondo-de-imagen','/en/%72emove-image-background/'])expect(isUnavailablePath(path)).toBe(false);
    expect(isUnavailablePath('/en/white-background-maker')).toBe(false);
  });
  it('serves the authorized AdSense publisher only in ads.txt, with ads still disabled',()=>{
    expect(adsenseId()).toBe('pub-2354052146318758');expect(siteConfig.indexingApproved).toBe(true);
  });
  it('requires analytics permission in Canada and honors withdrawal without granting advertising',async()=>{
    expect(await canTrack('analytics')).toBe(false);
    saveChoices({analytics:'granted'});
    expect(await canTrack('analytics')).toBe(true);
    expect(readChoice('advertising')).toBeNull();
    saveChoices({analytics:'denied'});
    expect(await canTrack('analytics')).toBe(false);
  });
});