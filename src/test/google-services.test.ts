import { describe, expect, it, vi, beforeEach } from 'vitest';
import { canTrack, readChoice, saveChoices } from '@/lib/consent';
import { isToolAvailable, isUnavailablePath } from '@/lib/photo/availability';
import { adsenseId, siteConfig } from '@/lib/site-config';

beforeEach(()=>{localStorage.clear();vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,text:async()=>`h=${location.hostname}\nloc=CA\n`}));});
describe('Google preparation rules',()=>{
  it('denies background removal while preserving other tools',()=>{
    expect(isToolAvailable('remove-background')).toBe(false);
    for(const id of ['instagram','whatsapp','product-ad','white-background','text','resize','compress','convert','collage','watermark','crop','ecommerce'])expect(isToolAvailable(id)).toBe(true);
    for(const path of ['/en/remove-image-background','/pt/remover-fundo-de-imagem','/es/eliminar-fondo-de-imagen','/en/%72emove-image-background/'])expect(isUnavailablePath(path)).toBe(true);
    expect(isUnavailablePath('/en/white-background-maker')).toBe(false);
  });
  it('keeps AdSense without a publisher and indexing unapproved',()=>{
    expect(adsenseId()).toBe('');expect(siteConfig.indexingApproved).toBe(false);
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