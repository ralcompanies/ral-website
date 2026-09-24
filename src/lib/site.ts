import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

export async function company() {
  const e = await getEntry('settings', 'company');
  if (!e) throw new Error('Missing src/content/settings/company.yml');
  return e.data;
}
export async function homepage() {
  const e = await getEntry('settings', 'homepage');
  if (!e) throw new Error('Missing src/content/settings/homepage.yml');
  return e.data;
}
export const yearsSince = (founded: number) => new Date().getFullYear() - founded;
export const statValue = (v: string, founded: number) => v.replace('{years}', String(yearsSince(founded)));

export async function publicProjects() {
  const all = await getCollection('projects');
  return all.filter((p) => p.data.tier !== 'hidden').sort((a, b) => a.data.display_order - b.data.display_order);
}
export async function lookups() {
  const [types, regions, roles] = await Promise.all([getCollection('projectTypes'), getCollection('regions'), getCollection('roles')]);
  const m = (xs: any[]) => Object.fromEntries(xs.map((x) => [x.id, x.data]));
  return { types: m(types), regions: m(regions), roles: m(roles) };
}
export function projectUrl(p: CollectionEntry<'projects'>) {
  return p.data.tier === 'featured' ? `/projects/${p.id}/` : null;
}
export async function visiblePress() {
  const all = await getCollection('press');
  const pubs = Object.fromEntries((await getCollection('publications')).map((p) => [p.id, p.data]));
  return all
    .filter((p) => !p.data.hidden)
    .sort((a, b) => +b.data.date - +a.data.date)
    .map((p) => ({ ...p, pub: pubs[p.data.publication.id] }));
}
export const fmtDate = (d: Date, precision: 'day' | 'month' | 'year' = 'day') =>
  precision === 'year'
    ? String(d.getUTCFullYear())
    : d.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', year: 'numeric', ...(precision === 'day' ? { day: 'numeric' } : {}) });

export const statusLabel: Record<string, string> = { completed: 'Completed', current: 'Under construction', 'in-development': 'In development' };
export function rolesOf(p: CollectionEntry<'projects'>, roles: Record<string, any>) {
  return p.data.roles.map((r) => roles[r.id]?.label).filter(Boolean).join(', ');
}
export function typesOf(p: CollectionEntry<'projects'>, types: Record<string, any>) {
  return p.data.types.map((t) => types[t.id]?.label).filter(Boolean).join(' · ');
}
export async function activePeople() {
  return (await getCollection('people')).filter((p) => p.data.active);
}
export async function legalPages() {
  const pages = await getCollection('pages');
  return { privacy: pages.some((p) => p.id === 'privacy'), terms: pages.some((p) => p.id === 'terms') };
}
