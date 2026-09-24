"""Normalize team headshots: black and white, 4:5, head-and-shoulders, consistent head size.
Usage: python3 scripts/make_headshots.py <source image> <person-id> [face share of width, default 0.5; higher = tighter]
Writes src/assets/images/people/<person-id>.jpg (1200x1500)."""
import sys, cv2, numpy as np
from PIL import Image, ImageOps, ImageEnhance
OUT_W, OUT_H = 1200, 1500
FACE_FRAC = 0.50    # face width as a share of the frame width
FACE_CY = 0.38      # face centre, from the top of the frame
casc = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def face(im):
    g = cv2.cvtColor(np.asarray(im), cv2.COLOR_RGB2GRAY)
    f = casc.detectMultiScale(g, 1.1, 6, minSize=(int(im.width * 0.08),) * 2)
    if len(f) == 0: raise SystemExit('no face found')
    return max(f, key=lambda r: r[2] * r[3])

def run(src, pid, face_frac=None):
    global FACE_FRAC
    if face_frac: FACE_FRAC = face_frac
    im = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
    x, y, w, h = face(im)
    cw = w / FACE_FRAC; ch = cw * OUT_H / OUT_W
    cx = x + w / 2; cy = y + h / 2
    left = cx - cw / 2; top = cy - ch * FACE_CY
    # if the crop runs past the photo, tighten it (never pad with fake background)
    for _ in range(40):
        if left >= 0 and top >= 0 and left + cw <= im.width and top + ch <= im.height: break
        cw *= 0.97; ch = cw * OUT_H / OUT_W
        left = min(max(cx - cw / 2, 0), im.width - cw); top = min(max(cy - ch * FACE_CY, 0), im.height - ch)
    pad = 0
    crop = im.crop((int(left), int(top), int(left + cw), int(top + ch))).resize((OUT_W, OUT_H), Image.LANCZOS)
    bw = ImageOps.grayscale(crop)
    bw = ImageOps.autocontrast(bw, cutoff=0.3)
    bw = ImageEnhance.Contrast(bw).enhance(1.05)
    bw.convert('RGB').save(f'src/assets/images/people/{pid}.jpg', quality=88, optimize=True)
    print(pid, 'face', (x, y, w, h), 'src', im.size, 'crop w', int(cw))

if __name__ == '__main__':
    run(sys.argv[1], sys.argv[2], float(sys.argv[3]) if len(sys.argv) > 3 else None)
