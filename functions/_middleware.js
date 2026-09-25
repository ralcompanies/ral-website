// Password-protects every deployment on *.pages.dev (previews and staging).
// The production domain (ralcompanies.com) is not affected.
// Set PREVIEW_PASSWORD in Cloudflare Pages > Settings > Variables.
export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);
  const host = url.hostname;
  // Send the bare domain to www so there is one canonical address.
  if (host === 'ralcompanies.com') { url.hostname = 'www.ralcompanies.com'; return Response.redirect(url.toString(), 301); }
  const protectedHost = host.endsWith('.pages.dev');
  if (!protectedHost || !env.PREVIEW_PASSWORD) return next();
  const auth = request.headers.get('Authorization') || '';
  const [scheme, encoded] = auth.split(' ');
  if (scheme === 'Basic' && encoded) {
    const [user, pass] = atob(encoded).split(':');
    if (user === 'ral' && pass === env.PREVIEW_PASSWORD) {
      const res = await next();
      const out = new Response(res.body, res);
      out.headers.set('X-Robots-Tag', 'noindex, nofollow');
      return out;
    }
  }
  return new Response('RAL website preview. Sign in to continue.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="RAL preview", charset="UTF-8"', 'X-Robots-Tag': 'noindex, nofollow' },
  });
}
