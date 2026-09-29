"""Sept 29 2026: web masters from the 'WEBSITE HIGH-RES' Drive folder (staged to /mnt/user-data/uploads).
Same rules as make_web_masters.py: max 2800px, sRGB, q86, never upscale. Crops recreate the curated
gallery detail framings (located by template match) at the higher source resolution."""
import os, io
from PIL import Image, ImageOps, ImageCms
Image.MAX_IMAGE_PIXELS = None
H = '/mnt/user-data/uploads/WEBSITE HIGH-RES/'
P = 'src/assets/images/projects/'
srgb = ImageCms.createProfile('sRGB')
def save(src, dst, crop=None, maxe=2800, q=86):
    im = Image.open(src); icc = im.info.get('icc_profile')
    im = ImageOps.exif_transpose(im)
    if icc:
        try: im = ImageCms.profileToProfile(im, ImageCms.ImageCmsProfile(io.BytesIO(icc)), srgb, outputMode='RGB')
        except Exception: pass
    im = im.convert('RGB')
    if crop: im = im.crop(crop)
    w, h = im.size; s = min(1, maxe / max(w, h))
    if s < 1: im = im.resize((round(w*s), round(h*s)), Image.LANCZOS)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    im.save(dst, 'JPEG', quality=q, optimize=True, progressive=True)
    print(dst, im.size)
J = [
 ('four-seasons-houston_01-evening-at-the-hotel-bar_NEW.jpg', 'four-seasons-houston/gallery/01-evening-at-the-hotel-bar.jpg', None),
 ('four-seasons-houston_02-bar_NEW.jpg', 'four-seasons-houston/gallery/02-bar-cabinetry.jpg', None),
 ('mandarin-oriental-grand-cayman_01-lagoon-pool-and-beach.jpg', 'mandarin-oriental-grand-cayman/gallery/01-lagoon-pool-and-beach.jpg', None),
 ('mandarin-oriental-grand-cayman_02-residences-above-the-resort-at-sunset.jpg', 'mandarin-oriental-grand-cayman/gallery/02-residences-above-the-resort-at-sunset.jpg', None),
 ('mandarin-oriental-grand-cayman_03-oceanfront-restaurant-terrace-at-sunset.jpg', 'mandarin-oriental-grand-cayman/gallery/03-oceanfront-restaurant-terrace-at-sunset.jpg', None),
 ('mandarin-oriental-grand-cayman_04-penthouse-pool-deck.jpg', 'mandarin-oriental-grand-cayman/gallery/04-penthouse-pool-deck.jpg', None),
 ('mandarin-oriental-grand-cayman_05-residence-terrace-at-sunset.jpg', 'mandarin-oriental-grand-cayman/gallery/05-residence-terraces-at-sunset.jpg', None),
 ('mandarin-oriental-grand-cayman_06-stingray.png', 'mandarin-oriental-grand-cayman/gallery/06-stingray-city-grand-cayman.jpg', None),
 ('mandarin-oriental-grand-cayman_07-the-estate-and-shoreline-from-above.jpg', 'mandarin-oriental-grand-cayman/gallery/07-the-estate-and-shoreline-from-above.jpg', None),
 ('mandarin-oriental-grand-cayman_08-arrival-pavillion.jpg', 'mandarin-oriental-grand-cayman/gallery/08-arrival-pavilion.jpg', None),
 ('quay-tower_01-kitchen-with-manhattan-skyline-views_NEW.jpg', 'quay-tower/gallery/01-kitchen.jpg', None),
 ('quay-tower_02-natural-stone-detail.jpg', 'quay-tower/gallery/02-natural-stone-detail.jpg', (3117, 936, 3117+1170, 936+1170)),
 ('quay-tower_04-wood-paneling-detail.jpg', 'quay-tower/gallery/04-lobby-lounge.jpg', None),
 ('quay-tower_07-sculptural-textured-wall-detail.jpg', 'quay-tower/gallery/07-sculptural-textured-wall-detail.jpg', None),
 ('quay-tower_08-lobby-with-wood-slat-walls-and-art.jpg', 'quay-tower/gallery/08-lobby-with-wood-slat-walls-and-art.jpg', None),
 ('the-landing_01-soccer-on-the-pier-5_NEW.jpg', 'the-landing/gallery/01-soccer-on-the-pier-5-fields.jpg', None),
 ('the-landing_02-bedroom-detail_NEW.jpg', 'the-landing/gallery/02-studio-residence.jpg', None),
 ('the-landing_03-brooklyn-promenade.jpg', 'the-landing/gallery/03-brooklyn-bridge-park-promenade.jpg', None),
 ('the-landing_04-fitness-center_NEW.jpg', 'the-landing/gallery/04-fitness-center.jpg', None),
 ('the-landing_05-residents-lounge-and-kitchen_NEW.jpg', 'the-landing/gallery/05-residents-lounge-and-kitchen.jpg', None),
 ('the-landing_06-living-wall-and-stone-in-the-lobby.jpg', 'the-landing/gallery/06-living-wall-and-stone-in-the-lobby.jpg', (2496, 3140, 2496+1221, 3140+932)),
 ('the-landing_07-kids-playroom_NEW.tif', 'the-landing/gallery/07-childrens-playroom.jpg', None),
 ('the-landing_08-city-skyline_NEW.jpg', 'the-landing/gallery/08-manhattan-skyline.jpg', None),
 ('brookchester Court-01.jpg', 'brookchester-court/card.jpg', None),
 ('franklin-tower-01.jpg', 'franklin-tower/card.jpg', None),
 ('vail-winter-exterior.jpg', 'four-seasons-vail/card.jpg', None),
 ('williamsburg-terrace-01.jpg', 'williamsburg-terrace/card.jpg', None),
]
for s, d, c in J: save(H + s, P + d, c)
