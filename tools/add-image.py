#!/usr/bin/env python3
"""Resize + compress a photo and save it into assets/img/ under the name the site expects.

Usage:
    python3 tools/add-image.py ~/Downloads/some-canva-download.png hero
    python3 tools/add-image.py ~/Downloads/*.png step-2     # first match is used

Names: hero, bottle-60, bottle-100, bottle-250, bottle-500, founders,
       step-1 .. step-4, heritage, use-hair, use-baby, use-skin,
       insta-1 .. insta-5, og-image
Requires Pillow:  pip install pillow
"""
import sys
from pathlib import Path
from PIL import Image, ImageOps

# max width in px for each slot (2x the largest size it is shown at)
WIDTHS = {
    'hero': 1200, 'founders': 1000, 'heritage': 1000, 'og-image': 1200,
    'use-hair': 900, 'use-baby': 900, 'use-skin': 900,
}
DEFAULT_WIDTH = {'bottle': 800, 'step': 600, 'insta': 600}

def target_width(name):
    if name in WIDTHS:
        return WIDTHS[name]
    return DEFAULT_WIDTH.get(name.split('-')[0], 1000)

def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    src, name = Path(sys.argv[1]).expanduser(), sys.argv[-1].removesuffix('.jpg')
    out = Path(__file__).resolve().parent.parent / 'assets' / 'img' / f'{name}.jpg'

    im = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
    w = target_width(name)
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(out, 'JPEG', quality=82, optimize=True, progressive=True)
    print(f'{src.name} -> {out.relative_to(out.parents[2])}  {im.width}x{im.height}  {out.stat().st_size // 1024} KB')

if __name__ == '__main__':
    main()
