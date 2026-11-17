import { initialInstagram, instagramFilename, type InstagramState } from './instagram';

export const whatsappPresets = {
  story: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
  landscape: { width: 1200, height: 675 },
  profile: { width: 1080, height: 1080 },
} as const;
export const initialWhatsApp = (): InstagramState => ({ ...initialInstagram(), ...whatsappPresets.story, preset: 'story' });
export const whatsappFilename = (format: Parameters<typeof instagramFilename>[0]) => instagramFilename(format).replace('instagram', 'whatsapp');
export const hasWhatsAppProfileGuide = (state: InstagramState) => state.preset === 'profile';
