import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { publicProjects, projectUrl } from '../lib/site';
import { hasBio } from '../lib/site';

export const GET: APIRoute = async ({ site }) => {
  const paths = ['/', '/projects/', '/about/', '/team/', '/press/', '/contact/'];
  for (const p of await publicProjects()) { const u = projectUrl(p); if (u) paths.push(u); }
  for (const p of await getCollection('people', (x) => x.data.active && hasBio(x))) paths.push(`/team/${p.id}/`);
  const urls = [...new Set(paths)].map((p) => `  <url><loc>${new URL(p, site)}</loc></url>`).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, { headers: { 'Content-Type': 'application/xml' } });
};
