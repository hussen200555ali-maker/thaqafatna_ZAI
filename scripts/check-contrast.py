#!/usr/bin/env python3
"""
حساب تباين الألوان (Contrast Ratio) حسب WCAG 2.1
للتحقق من توافق المتغيرات في globals.css
"""

def oklch_to_srgb(L, C, H_deg):
    """تحويل OKLCH إلى sRGB (0-255)"""
    H_rad = H_deg * 3.14159265358979 / 180
    a = C * math.cos(H_rad)
    b = C * math.sin(H_rad)
    # OKLab to linear sRGB
    L_ = L + 0.3963377774 * a + 0.2158037573 * b
    M_ = L - 0.1055613458 * a - 0.0638541728 * b
    S_ = L - 0.0894841775 * a - 1.2914855480 * b
    l = L_**3
    m = M_**3
    s = S_**3
    r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
    g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
    b_ = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    # Linear to sRGB
    def to_srgb(c):
        if c <= 0.0031308:
            return 12.92 * c
        return 1.055 * (c ** (1/2.4)) - 0.055
    return to_srgb(r), to_srgb(g), to_srgb(b_)

def relative_luminance(r, g, b):
    """حساب Luminance نسبي حسب WCAG"""
    return 0.2126 * r + 0.7152 * g + 0.0722 * b

def contrast_ratio(l1, l2):
    """حساب تباين بين لونين"""
    lighter = max(l1, l2)
    darker = min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)

import math

# === الألوان من globals.css (الـ :root الفاتح) ===
colors_light = {
    'background (cream)': (0.99, 0.005, 85),
    'foreground (dark)': (0.18, 0.02, 50),
    'card (white)': (1.0, 0, 0),
    'muted (light gray)': (0.96, 0.01, 70),
    'muted-foreground (gray)': (0.50, 0.015, 60),
    'secondary-foreground': (0.42, 0.11, 220),
    'accent-foreground (dark)': (0.22, 0.03, 40),
    'destructive': (0.58, 0.22, 25),
}

# === الألوان من Dark Elegant (المكتبة) ===
colors_dark = {
    'background (dark)': (0.08, 0.005, 50),   # stone-950 approx
    'foreground (light)': (0.96, 0.01, 80),   # stone-100
    'muted-foreground (gray)': (0.72, 0.015, 80),  # stone-400
    'border': (0.27, 0.005, 50),  # stone-800
}

print("=" * 70)
print("📊 تقرير تباين الألوان WCAG AA")
print("=" * 70)
print()
print("الخلفية الفاتحة (Light Theme - Admin):")
print("-" * 70)

# الإعداد الافتراضي: نص على خلفية
bg_light = colors_light['background (cream)']
bg_dark = colors_dark['background (dark)']

def check(name, fg, bg_name, bg, target=4.5):
    fg_rgb = oklch_to_srgb(*fg)
    bg_rgb = oklch_to_srgb(*bg)
    fg_lum = relative_luminance(*fg_rgb)
    bg_lum = relative_luminance(*bg_rgb)
    ratio = contrast_ratio(fg_lum, bg_lum)
    status = "✅ PASS" if ratio >= target else "❌ FAIL"
    print(f"  {name} on {bg_name}: {ratio:.2f}:1 {status} (target: {target}:1)")
    return ratio >= target

# Light theme checks (admin pages)
print("\n🎨 Light Theme (Admin Pages) — خلفية كريمية:")
check("foreground (نص أساسي)", colors_light['foreground (dark)'], "background", colors_light['background (cream)'])
check("muted-foreground (نص ثانوي)", colors_light['muted-foreground (gray)'], "background", colors_light['background (cream)'])
check("secondary-foreground", colors_light['secondary-foreground'], "background", colors_light['background (cream)'])
check("destructive", colors_light['destructive'], "background", colors_light['background (cream)'])

print("\n🎨 Light Theme (Admin) — خلفية بيضاء (card):")
check("foreground", colors_light['foreground (dark)'], "card", colors_light['card (white)'])
check("muted-foreground", colors_light['muted-foreground (gray)'], "card", colors_light['card (white)'])
check("secondary-foreground", colors_light['secondary-foreground'], "card", colors_light['card (white)'])

print("\n🎨 Dark Elegant Theme (Library Pages) — خلفية داكنة:")
check("foreground (نص فاتح)", colors_dark['foreground (light)'], "background", colors_dark['background (dark)'])
check("muted-foreground (نص رمادي)", colors_dark['muted-foreground (gray)'], "background", colors_dark['background (dark)'])

# فحص ألوان shadcn المعتادة في الـ admin UI
print("\n🎨 Tailwind Default Colors on White (admin cards):")
tw_colors = {
    'slate-900 (#0f172a)': (0.13, 0.02, 250),
    'slate-700 (#334155)': (0.39, 0.03, 250),
    'slate-600 (#475569)': (0.50, 0.02, 250),
    'slate-500 (#64748b)': (0.55, 0.02, 250),
    'slate-400 (#94a3b8)': (0.70, 0.01, 250),
    'emerald-600 (#059669)': (0.51, 0.13, 160),
    'amber-600 (#d97706)': (0.66, 0.15, 65),
    'red-600 (#dc2626)': (0.55, 0.22, 25),
}
for name, oklch in tw_colors.items():
    check(name, oklch, "white", (1.0, 0, 0))

print("\n" + "=" * 70)
print("📋 التوصيات:")
print("=" * 70)
print("""
WCAG AA يتطلب:
  - نص عادي: 4.5:1 على الأقل
  - نص كبير (18pt+): 3:1 على الأقل
  - مكونات UI: 3:1 على الأقل

التوصيات:
1. slate-400 (#94a3b8) قد يكون فاتحًا جدًا للنص — استخدم slate-500 للنص الثانوي
2. amber-600 قد يحتاج تعديل للتباين على الخلفية البيضاء
3. كل الألوان الأخرى يجب أن تجتاز 4.5:1 للنص العادي
""")
