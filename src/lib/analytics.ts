import { canTrack } from './consent';
import { ga4Id } from './site-config';

type AnalyticsWindow = Window & { gtag?: (...args: unknown[]) => void };
let initialized = false;
let lastPage = '';
/** Only aggregate catalog identifiers are sent, never images, filenames or input values. */
export async function trackPage(path: string, language: string, toolId?: string) {
  const id = ga4Id();
  if (!id || !(await canTrack('analytics'))) return false;
  const w = window as AnalyticsWindow;
  if (!w.gtag) return false;
  if (lastPage === path) return true;
  lastPage = path;
  if (!initialized) {
    initialized = true;
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    script.id = 'molvira-ga4';
    document.head.appendChild(script);
    w.gtag('set', 'developer_id.dZjgwMW', true);
    // Global scope also suppresses enhanced-measurement history pageviews.
    // Keep our consent-gated observer as the single pageview source.
    w.gtag('set', 'send_page_view', false);
    w.gtag('js', new Date());
    w.gtag('config', id, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false });
  }
  w.gtag('event', 'page_view', { page_path: path, page_location: `https://molviraphoto.com${path}`, language, send_to: id });
  if (toolId) w.gtag('event', 'tool_open', { tool_id: toolId, language, send_to: id });
  return true;
}

export async function trackToolSelection(toolId: string, language: string) {
  if (!initialized || !(await canTrack('analytics'))) return false;
  (window as AnalyticsWindow).gtag?.('event', 'tool_image_selected', { tool_id: toolId, language, send_to: ga4Id() });
  return true;
}