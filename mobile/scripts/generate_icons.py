"""Generate the mobile app icon set from the Sonora waveform mark.

Renders the same 12-bar cyan->magenta waveform used in the web logos
(web/public/sonora-logo-circle.svg) with Pillow, producing:

  assets/icon.png           1024x1024  iOS app icon (opaque — iOS forbids alpha)
  assets/adaptive-icon.png  1024x1024  Android adaptive foreground (transparent)
  assets/splash.png         1284x2778  splash screen (logo + wordmark on dark)
  assets/favicon.png          64x64    Expo web favicon (transparent)

Run from mobile/:  python3 scripts/generate_icons.py
"""

import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, '..', 'assets')

# Bar geometry from sonora-logo-circle.svg: (x, y, height, color, opacity)
# on a 200x200 canvas, bar width 6, corner radius 3, centered on x=100.
BARS = [
    (31, 79, 17, '#ff40ff', 0.75),
    (42, 67, 42, '#cc44e8', 0.80),
    (53, 72, 32, '#9060d4', 0.85),
    (64, 59, 57, '#5090e8', 0.88),
    (75, 54, 67, '#28b8f4', 0.92),
    (86, 52, 72, '#00d4ff', 0.95),
    (108, 52, 72, '#00d4ff', 0.95),
    (119, 57, 61, '#28b8f4', 0.92),
    (130, 66, 44, '#5090e8', 0.88),
    (141, 73, 30, '#9060d4', 0.85),
    (152, 78, 19, '#cc44e8', 0.80),
    (163, 83, 10, '#ff40ff', 0.75),
]
BAR_W = 6
SVG_CX, SVG_CY = 100.0, 88.0  # waveform center in SVG coords

FONT_CANDIDATES = [
    '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
    '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
    '/Library/Fonts/Arial Bold.ttf',
]


def hex_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def draw_waveform(size, scale, center, glow=True):
    """Render the waveform mark onto a transparent RGBA canvas."""
    layer = Image.new('RGBA', size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    cx, cy = center
    for x, y, h, color, op in BARS:
        r, g, b = hex_rgb(color)
        a = int(op * 255)
        x0 = cx + (x - SVG_CX) * scale
        y0 = cy + (y - SVG_CY) * scale
        x1 = x0 + BAR_W * scale
        y1 = y0 + h * scale
        d.rounded_rectangle([x0, y0, x1, y1], radius=3 * scale, fill=(r, g, b, a))
    if not glow:
        return layer
    halo = layer.filter(ImageFilter.GaussianBlur(radius=2.2 * scale))
    out = Image.new('RGBA', size, (0, 0, 0, 0))
    out.alpha_composite(halo)
    out.alpha_composite(layer)
    return out


def vertical_gradient(size, top, bottom):
    w, h = size
    img = Image.new('RGB', size)
    t, b = hex_rgb(top), hex_rgb(bottom)
    for y in range(h):
        f = y / max(h - 1, 1)
        row = tuple(int(t[i] + (b[i] - t[i]) * f) for i in range(3))
        img.paste(Image.new('RGB', (w, 1), row), (0, y))
    return img


def load_font(px):
    for path in FONT_CANDIDATES:
        if os.path.exists(path):
            return ImageFont.truetype(path, px)
    return ImageFont.load_default()


def draw_wordmark(img, text, center_xy, px, tracking, fill):
    """Draw letter-spaced text centered at center_xy."""
    font = load_font(px)
    d = ImageDraw.Draw(img)
    widths = [d.textlength(ch, font=font) for ch in text]
    total = sum(widths) + tracking * (len(text) - 1)
    x = center_xy[0] - total / 2
    top = center_xy[1] - px / 2
    for ch, w in zip(text, widths):
        d.text((x, top), ch, font=font, fill=fill)
        x += w + tracking


def main():
    os.makedirs(ASSETS, exist_ok=True)

    # iOS icon — opaque dark gradient, waveform at ~70% width.
    size = (1024, 1024)
    icon = vertical_gradient(size, '#1a1a22', '#0a0a0e').convert('RGBA')
    icon.alpha_composite(draw_waveform(size, scale=5.2, center=(512, 512)))
    icon.convert('RGB').save(os.path.join(ASSETS, 'icon.png'))

    # Android adaptive foreground — transparent, mark inside the 66% safe zone.
    adaptive = draw_waveform((1024, 1024), scale=4.2, center=(512, 512))
    adaptive.save(os.path.join(ASSETS, 'adaptive-icon.png'))

    # Splash — solid dark portrait (must match app.json splash backgroundColor
    # exactly, since Expo letterboxes with it on other aspect ratios).
    ssize = (1284, 2778)
    splash = Image.new('RGBA', ssize, hex_rgb('#0a0a0a') + (255,))
    splash.alpha_composite(draw_waveform(ssize, scale=4.6, center=(642, 1300)))
    draw_wordmark(splash, 'SONORA', (642, 1720), px=96, tracking=58,
                  fill=(221, 221, 221, 255))
    splash.convert('RGB').save(os.path.join(ASSETS, 'splash.png'))

    # Favicon — transparent waveform, small.
    fav = draw_waveform((1024, 1024), scale=6.6, center=(512, 512), glow=False)
    fav.resize((64, 64), Image.LANCZOS).save(os.path.join(ASSETS, 'favicon.png'))

    for name in ('icon.png', 'adaptive-icon.png', 'splash.png', 'favicon.png'):
        path = os.path.join(ASSETS, name)
        print(f'{name:20} {os.path.getsize(path) / 1024:7.1f} KB')


if __name__ == '__main__':
    main()
