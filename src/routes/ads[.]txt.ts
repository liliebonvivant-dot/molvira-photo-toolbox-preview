import { createFileRoute } from '@tanstack/react-router';
import { adsTxt } from '@/lib/site-config';
export const Route = createFileRoute('/ads.txt')({
  server: { handlers: { GET: () => { const body = adsTxt(); return body ? new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }) : new Response('Not found', { status: 404 }); } } },
});
