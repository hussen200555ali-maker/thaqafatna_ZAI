#!/usr/bin/env python3
"""
توليد أيقونات PWA: icon-192.png و icon-512.png من icon.svg

الطريقة: نرسم تصميمًا مطابقًا لـ icon.svg لكن بحجم PNG مناسب
مع التأكد من وضوح النص العربي.
"""

from PIL import Image, ImageDraw, ImageFont
import os

OUTPUT_DIR = '/home/z/my-project/public'

def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def lerp_color(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))

def draw_gradient(draw, width, height, c1, c2, c3):
    """رسم تدرج لوني ثلاثي قطريًا"""
    for y in range(height):
        for x in range(width):
            # مزيج من x و y لجعل التدرج قطريًا
            t = (x + y) / (width + height)
            if t < 0.5:
                color = lerp_color(c1, c2, t * 2)
            else:
                color = lerp_color(c2, c3, (t - 0.5) * 2)
            draw.point((x, y), fill=color)

def create_icon(size, output_path):
    """توليد أيقونة بحجم معين"""
    print(f'🎨 توليد {output_path} ({size}x{size})...')

    # ألوان التدرج (من icon.svg)
    c1 = hex_to_rgb('#1e3a8a')  # أزرق غامق
    c2 = hex_to_rgb('#6366f1')  # بنفسجي
    c3 = hex_to_rgb('#8b5cf6')  # بنفسجي فاتح

    # إنشاء صورة مع خلفية شفافة
    img = Image.new('RGB', (size, size), c1)
    draw = ImageDraw.Draw(img)

    # رسم التدرج
    draw_gradient(draw, size, size, c1, c2, c3)

    # رسم زوايا مدوّرة (mask)
    radius = int(size * (112 / 512))  # نسبة 112/512 من icon.svg
    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle(
        [(0, 0), (size - 1, size - 1)],
        radius=radius,
        fill=255
    )
    # تطبيق الـ mask على خلفية بيضاء (لتجنب الحواف السوداء)
    final = Image.new('RGB', (size, size), (255, 255, 255))
    final.paste(img, mask=mask)

    draw = ImageDraw.Draw(final)

    # اختيار خط يدعم العربية
    font_paths = [
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
        '/usr/share/fonts/truetype/freefont/FreeSerifBold.ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    ]
    font_path = None
    for fp in font_paths:
        if os.path.exists(fp):
            font_path = fp
            break

    if not font_path:
        print('⚠️ لا يوجد خط متاح — سأستخدم الافتراضي')
        font_path = None

    # أحجام الخطوط (نسبة من حجم الأيقونة)
    emoji_size = int(size * 0.24)  # 0.24 مثل 120/512 في SVG
    title_size = int(size * 0.094)  # مثل 48/512
    subtitle_size = int(size * 0.047)  # مثل 24/512

    # تحميل الخطوط
    emoji_font = ImageFont.truetype(font_path, emoji_size) if font_path else ImageFont.load_default()
    title_font = ImageFont.truetype(font_path, title_size) if font_path else ImageFont.load_default()
    subtitle_font = ImageFont.truetype(font_path, subtitle_size) if font_path else ImageFont.load_default()

    # إيموجي 📚 — قد لا يدعمه DejaVu، لكن سنجرب
    emoji_text = '📚'
    title_text = 'ثقافتنا'
    subtitle_text = 'لعبة + مكتبة'

    # حساب المواضع (مثل icon.svg: y=200, 340, 400 من 512)
    emoji_y = int(size * 0.30)  # 200/512 ≈ 0.39 — لكن نصنع التصميم أجمل
    title_y = int(size * 0.62)
    subtitle_y = int(size * 0.76)

    # رسم النصوص
    # ملاحظة: textbbox يحسب المربع المحيط، نحتاجه للتوسيط
    bbox = draw.textbbox((0, 0), emoji_text, font=emoji_font)
    emoji_w = bbox[2] - bbox[0]
    emoji_h = bbox[3] - bbox[1]
    emoji_x = (size - emoji_w) // 2 - bbox[0]
    draw.text((emoji_x, emoji_y - emoji_h // 2), emoji_text, font=emoji_font, fill='white')

    bbox = draw.textbbox((0, 0), title_text, font=title_font)
    title_w = bbox[2] - bbox[0]
    title_x = (size - title_w) // 2 - bbox[0]
    draw.text((title_x, title_y), title_text, font=title_font, fill='white')

    bbox = draw.textbbox((0, 0), subtitle_text, font=subtitle_font)
    sub_w = bbox[2] - bbox[0]
    sub_x = (size - sub_w) // 2 - bbox[0]
    draw.text((sub_x, subtitle_y), subtitle_text, font=subtitle_font, fill=(220, 220, 235))

    # حفظ بصيغة PNG
    final.save(output_path, 'PNG', optimize=True)
    print(f'  ✅ تم الحفظ: {output_path} ({os.path.getsize(output_path)} bytes)')

if __name__ == '__main__':
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    create_icon(192, os.path.join(OUTPUT_DIR, 'icon-192.png'))
    create_icon(512, os.path.join(OUTPUT_DIR, 'icon-512.png'))

    # أيقونة favicon أيضاً (32x32)
    create_icon(32, os.path.join(OUTPUT_DIR, 'icon-32.png'))
    create_icon(16, os.path.join(OUTPUT_DIR, 'icon-16.png'))

    print('\n🎉 تم توليد جميع الأيقونات بنجاح!')
