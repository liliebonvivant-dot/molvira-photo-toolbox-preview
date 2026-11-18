import { describe, expect, it, vi } from 'vitest';
import { saveChoices } from '@/lib/consent';
import { trackPage, trackToolSelection } from '@/lib/analytics';
describe('GA4 anonymous consent-gated events',()=>{
  it('loads once, sends only catalog data and stops after rejection',async()=>{
    localStorage.clear();vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false}));
    const gtag=vi.fn();Object.assign(window,{gtag});
    saveChoices({analytics:'denied'});gtag.mockClear();
    expect(await trackPage('/pt/redimensionar-imagens','pt','resize')).toBe(false);
    expect(gtag).not.toHaveBeenCalled();
    saveChoices({analytics:'granted'});gtag.mockClear();
    expect(await trackPage('/pt/redimensionar-imagens','pt','resize')).toBe(true);
    expect(gtag).toHaveBeenCalledWith('config','G-8DVNVSTRCH',{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false});
    expect(gtag).toHaveBeenCalledWith('event','tool_open',{tool_id:'resize',language:'pt',send_to:'G-8DVNVSTRCH'});
    await trackPage('/pt/redimensionar-imagens','pt','resize');
    expect(gtag.mock.calls.filter(args=>args[0]==='event'&&args[1]==='page_view')).toHaveLength(1);
    await trackPage('/pt/comprimir-imagens','pt','compress');
    expect(gtag.mock.calls.filter(args=>args[0]==='config')).toHaveLength(1);
    expect(await trackToolSelection('compress','pt')).toBe(true);
    expect(gtag).toHaveBeenCalledWith('event','tool_image_selected',{tool_id:'compress',language:'pt',send_to:'G-8DVNVSTRCH'});
    saveChoices({analytics:'denied'});gtag.mockClear();
    expect(await trackToolSelection('compress','pt')).toBe(false);
    expect(await trackPage('/pt','pt')).toBe(false);
    expect(gtag).not.toHaveBeenCalled();
  });
});