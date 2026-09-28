"""Swap a light headshot background for the studio grey used on the team page.

usage: python3 scripts/grey_bg.py <src> <out.png>
Then run make_headshots.py on <out.png>.
"""
import sys
import numpy as np
from PIL import Image
from rembg import remove, new_session

src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB')
cut = remove(im, session=new_session('u2net_human_seg'), alpha_matting=True,
             alpha_matting_foreground_threshold=240,
             alpha_matting_background_threshold=20,
             alpha_matting_erode_size=12)
a = np.asarray(cut.split()[-1], dtype=np.float32) / 255
a = np.clip((a - 0.1) / 0.8, 0, 1) ** 1.6

g = np.asarray(im.convert('L'), dtype=np.float32)
h, w = g.shape
# estimate the original backdrop brightness from pixels that are clearly background
orig_bg = float(np.median(g[a < 0.02])) if (a < 0.02).any() else 245.0
# decontaminate edges: remove the light backdrop bleeding into hair/shoulders
fg = np.where(a > 0.02, (g - (1 - a) * orig_bg) / np.maximum(a, 0.02), g)
fg = np.clip(fg, 0, 255)

yy, xx = np.mgrid[0:h, 0:w]
r = np.hypot((xx - 0.5 * w) / w, (yy - 0.4 * h) / h) / 0.75
bg = np.clip(118 - 110 * r, 52, 118)

res = fg * a + bg * (1 - a)
Image.fromarray(res.astype(np.uint8), 'L').save(out)
print('orig_bg', orig_bg)
