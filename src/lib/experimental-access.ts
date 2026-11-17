/** Fail closed until the owner approves an actual private access boundary. */
export function rejectExperimentalRequest(request: Request): Response | undefined {
  let path = new URL(request.url).pathname;
  try { path = decodeURIComponent(path); } catch { /* Invalid encoding cannot enable access. */ }
  if (!/^\/experimental\/birefnet(?:\/|$)/i.test(path)) return undefined;
  return new Response('Not Found', {
    status: 404,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow, noarchive',
    },
  });
}