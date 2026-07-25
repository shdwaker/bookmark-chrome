"""Generate MarkTrace extension icons (16/32/48/128 px PNG)."""
import os
from PIL import Image, ImageDraw


def lerp(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))


def make_gradient(size, c1, c2):
    """Diagonal gradient from top-left (c1) to bottom-right (c2)."""
    img = Image.new('RGB', (size, size))
    px = img.load()
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * max(size - 1, 1))
            px[x, y] = lerp(c1, c2, t)
    return img


def apply_rounded_mask(img, radius):
    size = img.size[0]
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    result = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    result.paste(img, (0, 0), mask)
    return result


def draw_bookmark(draw, cx, cy, w, h, fill):
    """Bookmark polygon: rectangle with V-notch cut from bottom."""
    x0 = cx - w // 2
    y0 = cy - h // 2
    x1 = x0 + w
    y1 = y0 + h
    notch = h // 4
    points = [
        (x0, y0),
        (x1, y0),
        (x1, y1),
        (cx, y1 - notch),
        (x0, y1),
    ]
    draw.polygon(points, fill=fill)


def draw_trace_dots(draw, start_x, start_y, r, spacing, count, fill):
    """Diagonal ascending dots representing a trace trail."""
    for i in range(count):
        cx = start_x + i * spacing
        cy = start_y - i * spacing
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=fill)


def create_icon(size):
    c1 = (102, 126, 234)   # #667eea
    c2 = (118, 75, 162)    # #764ba2
    white = (255, 255, 255, 255)

    bg = make_gradient(size, c1, c2)
    radius = max(2, size // 5)
    img = apply_rounded_mask(bg, radius)
    draw = ImageDraw.Draw(img)

    # Bookmark (shifted slightly left to leave room for trace dots)
    bm_w = int(size * 0.42)
    bm_h = int(size * 0.55)
    bm_cx = int(size * 0.42)
    bm_cy = int(size * 0.48)
    draw_bookmark(draw, bm_cx, bm_cy, bm_w, bm_h, white)

    # Trace dots (skip on 16px - too small)
    if size >= 32:
        dot_r = max(2, size // 22)
        spacing = max(dot_r * 2 + 1, size // 16)
        start_x = bm_cx + bm_w // 2 + spacing
        start_y = bm_cy + bm_h // 2 - dot_r
        count = 3 if size >= 48 else 2
        draw_trace_dots(draw, start_x, start_y, dot_r, spacing, count, white)

    return img


os.makedirs('public/icons', exist_ok=True)
for size in [16, 32, 48, 128]:
    img = create_icon(size)
    img.save(f'public/icons/icon{size}.png')
    print(f'Created icon{size}.png ({img.size[0]}x{img.size[1]})')
