"""Sept 30 2026: Mandarin Oriental Grand Cayman gallery images from the MOGC renderings Drive folder
(1E8vjl3S1nsUeHQwm4lfljf3lsWPG5Gjk), staged locally. Same rules as make_web_masters.py: max 2800px, sRGB,
q86, never upscale. The other renderings, hero and card already matched this folder; 06 Stingray City stays as a lifestyle photo."""
import os, io, sys
from PIL import Image, ImageOps, ImageCms
Image.MAX_IMAGE_PIXELS = None
H = sys.argv[1] if len(sys.argv) > 1 else '/mnt/user-data/uploads/MOGC Renderings/'
P = 'src/assets/images/projects/mandarin-oriental-grand-cayman/gallery/'
srgb = ImageCms.createProfile('sRGB')
def save(src, dst, maxe=2800, q=86):
    im = Image.open(src); icc = im.info.get('icc_profile')
    im = ImageOps.exif_transpose(im)
    if icc:
        try: im = ImageCms.profileToProfile(im, ImageCms.ImageCmsProfile(io.BytesIO(icc)), srgb, outputMode='RGB')
        except Exception: pass
    im = im.convert('RGB')
    w, h = im.size; s = min(1, maxe / max(w, h))
    if s < 1: im = im.resize((round(w*s), round(h*s)), Image.LANCZOS)
    im.save(dst, 'JPEG', quality=q, optimize=True, progressive=True)
    print(dst, im.size)
J = [
 ('Penthouse/Penthouse Pool Deck.jpg', '04-penthouse-pool-deck.jpg'),
 ('Penthouse/Penthouse Terrace.jpg', '05-penthouse-terrace-at-sunset.jpg'),
 ('102_From Ocean Looking Back-1130.jpg', '07-the-resort-and-lagoon-from-the-ocean.jpg'),
]
for s, d in J: save(H + s, P + d)
