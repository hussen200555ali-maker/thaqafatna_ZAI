#!/usr/bin/env python3
# توليد أيقونة تطبيق ثقافتنا - Adaptive Icon
# الخلفية: داكنة #1A1A2E، الحرف "ث" ذهبي #C9A961 مع زخرفة
import struct, zlib, os

DARK_BG = (26, 26, 46)       # #1A1A2E
GOLD = (201, 169, 97)        # #C9A961
GOLD_LIGHT = (230, 200, 130) # تظليل
WHITE = (245, 240, 225)

OUT = "/home/z/my-project/scripts/webview-apk/app/src/main/res"

def make_png(pixels, width, height):
    """pixels: flat list of (r,g,b,a) tuples, row-major."""
    raw = b""
    for y in range(height):
        raw += b"\x00"
        for x in range(width):
            r, g, b, a = pixels[y * width + x]
            raw += bytes([r, g, b, a])
    def chunk(ctype, data):
        c = ctype + data
        crc = zlib.crc32(c) & 0xffffffff
        return struct.pack(">I", len(data)) + c + struct.pack(">I", crc)
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)  # 8-bit RGBA
    return sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")

def draw_thaqafa_icon(size):
    """رسم أيقونة: خلفية داكنة، حرف ث ذهبي كبير في الوسط، إطار ذهبي رفيع."""
    pixels = []
    cx = size / 2.0
    cy = size / 2.0
    # معاملات رسم الحرف (محاكاة يدوية لشكل "ث")
    # الحرف يتكوّن من: قاعدة منحنية + ثلاث نقاط فوق
    body_h = size * 0.45   # ارتفاع جسم الحرف
    body_w = size * 0.40   # عرض جسم الحرف
    body_top = cy - body_h * 0.35
    body_bot = cy + body_h * 0.65
    stroke = max(2, size // 24)  # سمك الخط
    dot_r = max(2, size // 40)   # نصف قطر النقاط

    # إحداثيات النقاط الثلاث فوق الحرف (تشكيل "ث")
    dots_y = body_top - size * 0.18
    dot1_x = cx - size * 0.12
    dot2_x = cx
    dot3_x = cx + size * 0.12

    for y in range(size):
        for x in range(size):
            r, g, b = DARK_BG
            a = 255
            # إطار ذهبي رفيع
            border = max(2, size // 32)
            if x < border or x >= size - border or y < border or y >= size - border:
                r, g, b = GOLD

            # جسم الحرف: قاعدة أفقية سميكة (الجزء السفلي)
            in_body_x = (cx - body_w / 2) <= x <= (cx + body_w / 2)
            base_band = (body_bot - stroke) <= y <= body_bot
            if in_body_x and base_band:
                r, g, b = GOLD

            # الساق الرأسية اليسرى
            left_leg_x = (cx - body_w / 2) <= x <= (cx - body_w / 2 + stroke)
            left_leg_y = body_top <= y <= body_bot
            if left_leg_x and left_leg_y:
                r, g, b = GOLD

            # الساق الرأسية اليمنى
            right_leg_x = (cx + body_w / 2 - stroke) <= x <= (cx + body_w / 2)
            right_leg_y = body_top <= y <= body_bot
            if right_leg_x and right_leg_y:
                r, g, b = GOLD

            # الساق الوسطى (للحرف "ث" ثلاث ساقا? لا — "ث" لها قاعدة وساقين ونقاط)
            # لكن لتبسيط الرسم نكتفي بساقين + قاعدة + 3 نقاط (يقرأ كـ "ث")
            # النقاط الثلاث فوق
            def near(px, py, cx_, cy_, rad):
                return (px - cx_) ** 2 + (py - cy_) ** 2 <= rad * rad
            if near(x, y, dot1_x, dots_y, dot_r) or \
               near(x, y, dot2_x, dots_y, dot_r) or \
               near(x, y, dot3_x, dots_y, dot_r):
                r, g, b = GOLD

            # زخرفة: نقطة ذهبية صغيرة في الزاوية (شعار)
            corner_r = max(2, size // 30)
            if (x - border - corner_r) ** 2 + (y - border - corner_r) ** 2 <= corner_r ** 2:
                if x < border + corner_r * 2 and y < border + corner_r * 2:
                    r, g, b = GOLD_LIGHT

            pixels.append((r, g, b, a))
    return pixels

# Adaptive icon foreground (108dp أيقونة مع padding آمن)
# الأيقونة العادية (بدون adaptive) للأحجام القديمة
sizes = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

for folder, sz in sizes.items():
    px = draw_thaqafa_icon(sz)
    png = make_png(px, sz, sz)
    path = os.path.join(OUT, folder, "ic_launcher.png")
    with open(path, "wb") as f:
        f.write(png)
    # نسخة round (للأجهزة بأيقونات دائرية)
    path_round = os.path.join(OUT, folder, "ic_launcher_round.png")
    with open(path_round, "wb") as f:
        f.write(png)
    print(f"  {folder}/ic_launcher.png ({sz}x{sz}): {len(png)} bytes")
    print(f"  {folder}/ic_launcher_round.png ({sz}x{sz}): {len(png)} bytes")

# Adaptive icon foreground (أكبر، مع padding للقناع الآمن)
fg_sizes = {
    "mipmap-mdpi": 108,
    "mipmap-hdpi": 162,
    "mipmap-xhdpi": 216,
    "mipmap-xxhdpi": 324,
    "mipmap-xxxhdpi": 432,
}
import os as _os
for folder, sz in fg_sizes.items():
    fg_dir = _os.path.join(OUT, folder)
    # للـ adaptive icon foreground نرسم الحرف على خلفية شفافة
    # (الخلفية منفصلة في ic_launcher_background)
    px_full = draw_thaqafa_icon(sz)
    # نجعل الخلفية شفافة (كل البكسلات الداكنة -> شفافة)
    px_fg = []
    for (r, g, b, a) in px_full:
        if (r, g, b) == DARK_BG:
            px_fg.append((0, 0, 0, 0))  # شفاف
        else:
            px_fg.append((r, g, b, a))
    png = make_png(px_fg, sz, sz)
    path = _os.path.join(fg_dir, "ic_launcher_foreground.png")
    with open(path, "wb") as f:
        f.write(png)
    print(f"  {folder}/ic_launcher_foreground.png ({sz}x{sz}): {len(png)} bytes")

# خلفية Adaptive Icon (مادة ملونة) - نولّدها كصورة
bg_color = DARK_BG
for folder, sz in fg_sizes.items():
    px_bg = [bg_color + (255,)] * (sz * sz)
    png = make_png(px_bg, sz, sz)
    path = _os.path.join(OUT, folder, "ic_launcher_background.png")
    with open(path, "wb") as f:
        f.write(png)
    print(f"  {folder}/ic_launcher_background.png ({sz}x{sz}): {len(png)} bytes")

# colors.xml للخلفية كـ XML drawable
print("\n[✓] All icons generated")
