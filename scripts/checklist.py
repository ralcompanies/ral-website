"""Build docs/PRELAUNCH_CHECKLIST.md from every internal_notes field plus standing items. Run any time."""
import glob, re, yaml, os, datetime
C='src/content'
def fm(path):
    s=open(path).read()
    if path.endswith('.md'):
        m=re.match(r'---\n(.*?)\n---',s,re.S); return yaml.safe_load(m.group(1)) if m else {}, s
    return yaml.safe_load(s) or {}, s
cats={'Facts to verify':[], 'Team':[], 'Assets':[], 'Legal':[], 'Press':[], 'SEO':[], 'Infrastructure':[]}
def cat_for(note, kind):
    n=note.lower()
    if kind=='people': return 'Team'
    if kind=='press': return 'Press'
    if any(k in n for k in ['image','photo','licen','getty','rendering','logo','px','original','headshot','credit']): return 'Assets'
    return 'Facts to verify'
for kind in ['projects','people','press','settings','timeline','pages']:
    for f in sorted(glob.glob(f'{C}/{kind}/*')):
        d,_=fm(f)
        name=d.get('name') or d.get('headline') or d.get('title') or os.path.basename(f)
        for n in d.get('internal_notes') or []:
            if n.startswith('Imported from live-site clipping'): continue
            cats[cat_for(n,kind)].append(f'**{name}**: {n}')
        if kind=='people' and d.get('active',True):
            body=_.split('---',2)[-1].strip() if f.endswith('.md') else ''
            if not d.get('headshot'): cats['Team'].append(f'**{name}**: headshot missing (placeholder shows).')
            if not body: cats['Team'].append(f'**{name}**: no biography yet (profile shows title and projects only).')
standing={
 'Legal':['Privacy Policy and Terms of Use pages: draft copy and legal review (links exist in footer).','Contact form consent/privacy language before a form goes live.','Confirm licence/usage rights: Getty images (ROAN folder, not used), operator photography (Four Seasons), listing photos (Franklin Tower), Mandarin Oriental name and marks.','Photographer credit lines where contracts require them (Evan Joseph, CTC, Binyan).'],
 'SEO':['Final redirect map from ralcompanies.com (13 URLs + /site/assets/files PDFs).','Per-page titles/descriptions for templates built at Gate 2.','Open Graph share image per page.','XML sitemap + robots.txt, noindex on previews.','Google Search Console verification and sitemap submission at launch.'],
 'Infrastructure':['GitHub organization/repository for RAL (owner account).','Cloudflare account for RAL (hosting, previews, DNS, Turnstile, Access on /admin).','Registrar + DNS access for ralcompanies.com (move DNS to Cloudflare at launch).','Analytics decision (Cloudflare Web Analytics vs GA4); existing GA/Search Console access.','Developer handoff: WordPress export + DB dump, Bluehost account ownership.','Editor accounts for the admin (who at RAL).'],
 'Press':['25 clippings imported from the live site with dates read from the PDFs; 3 have confirmed original URLs, the rest link to the archived PDF. Find original URLs.','Find original article URLs for clippings (PDF fallbacks used now).','Import remaining ~85 live-site clippings progressively.'],
}
for k,v in standing.items(): cats[k]+=v
out=[f'# RAL website: pre-launch checklist','',f'Internal. Generated {datetime.date.today():%B %d, %Y} from the content files (`internal_notes`) plus standing items. Launch-readiness list, not a development blocker.','']
for k,v in cats.items():
    out.append(f'## {k} ({len(v)})'); out.append('')
    out+= [f'- [ ] {x}' for x in v]; out.append('')
open('docs/PRELAUNCH_CHECKLIST.md','w').write('\n'.join(out))
print({k:len(v) for k,v in cats.items()})
