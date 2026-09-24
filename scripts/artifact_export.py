"""Export a built page as an Artifact-ready page + supporting files (preview only)."""
import re, sys, os, shutil
page, outdir = sys.argv[1], sys.argv[2]
D='/home/claude/ral-site/dist'
h=open(f'{D}/{page}').read()
files=set()
def keepwidths(srcset, want):
    items=[s.strip() for s in srcset.split(',') if s.strip()]
    parsed=[(it.rsplit(' ',1)[0], int(it.rsplit(' ',1)[1][:-1])) for it in items]
    best=[]
    for w in want:
        c=min(parsed,key=lambda x:abs(x[1]-w)); 
        if c not in best: best.append(c)
    return ', '.join(f'{u} {w}w' for u,w in best), [u for u,_ in best]
def pic(m):
    block=m.group(0)
    block=re.sub(r'<source type="image/avif"[^>]*>','',block)
    def src_repl(mm):
        ss,urls=keepwidths(mm.group(1),[800,1600,2560]); files.update(urls); return f'srcset="{ss}"'
    block=re.sub(r'srcset="([^"]+)"',src_repl,block)
    def img_src(mm): files.add(mm.group(1)); return f'src="{mm.group(1)}"'
    block=re.sub(r'src="(/_astro/[^"]+)"',img_src,block)
    return block
h=re.sub(r'<picture>.*?</picture>',pic,h,flags=re.S)
for u in re.findall(r'(?:href|src)="(/_astro/[^"]+\.(?:css|js))"',h): files.add(u)
# strip document skeleton
h=re.sub(r'<!DOCTYPE html>|<!doctype html>','',h,flags=re.I)
h=re.sub(r'<html[^>]*>|</html>|<head>|</head>|<body>|</body>','',h)
h=re.sub(r'<meta charset[^>]*>|<meta name="viewport"[^>]*>','',h)
# relative asset paths
h=h.replace('"/_astro/','"assets/').replace(', /_astro/',', _astro/')
# move <title> first
t=re.search(r'<title>.*?</title>',h,re.S).group(0); h=t+'\n'+h.replace(t,'',1)
os.makedirs(outdir,exist_ok=True)
open(f'{outdir}/index.html','w').write(h)
tot=0
for u in files:
    src=D+u; dst=outdir+'/'+u.lstrip('/')
    os.makedirs(os.path.dirname(dst),exist_ok=True); shutil.copy(src,dst); tot+=os.path.getsize(src)
# css may reference other assets
for u in [x for x in files if x.endswith('.css')]:
    css=open(outdir+u).read()
    for ref in re.findall(r'url\((/_astro/[^)]+)\)',css):
        shutil.copy(D+ref,outdir+ref); tot+=os.path.getsize(D+ref)
    open(outdir+u,'w').write(css.replace('url(/_astro/','url(./'))
print(len(files),'files',round(tot/1e6,1),'MB')
