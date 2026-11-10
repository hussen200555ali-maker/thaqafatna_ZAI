#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
توليد وثيقة دراسة أولية محدّثة بصيغتي Word و PDF
دراسة أولية: موقع وتطبيق لعبة كلمات متقاطعة عربية
"""

import os
import arabic_reshaper
from bidi.algorithm import get_display
from docx import Document
from docx.shared import Pt, Cm, RGBColor, Inches, Emu
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.enum.table import WD_ALIGN_VERTICAL, WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn, nsmap
from docx.oxml import OxmlElement
from docx.enum.text import WD_BREAK

# ============================================================
# إعدادات الخطوط والألوان
# ============================================================
FONT_DIR = "/home/z/my-project/fonts"
CAIRO_REGULAR = os.path.join(FONT_DIR, "Cairo-Regular.ttf")
NOTO_NASKH_REGULAR = os.path.join(FONT_DIR, "NotoNaskhArabic-Regular.ttf")
NOTO_NASKH_BOLD = os.path.join(FONT_DIR, "NotoNaskhArabic-Bold.ttf")
NOTO_SANS_ARABIC_REGULAR = os.path.join(FONT_DIR, "NotoSansArabic-Regular.ttf")
NOTO_SANS_ARABIC_BOLD = os.path.join(FONT_DIR, "NotoSansArabic-Bold.ttf")

# ألوان الوثيقة (رمادي وذهبي)
COLOR_PRIMARY = RGBColor(0x1F, 0x29, 0x37)      # رمادي داكن
COLOR_ACCENT = RGBColor(0xC9, 0xA9, 0x61)      # ذهبي
COLOR_SECONDARY = RGBColor(0x6B, 0x72, 0x80)   # رمادي متوسط
COLOR_LIGHT_BG = RGBColor(0xF9, 0xFA, 0xFB)    # رمادي فاتح للخلفيات
COLOR_WHITE = RGBColor(0xFF, 0xFF, 0xFF)
COLOR_TABLE_HEADER = RGBColor(0x1F, 0x29, 0x37)
COLOR_TABLE_ROW_ALT = RGBColor(0xF3, 0xF4, 0xF6)
COLOR_RECOMMENDATION_BORDER = RGBColor(0xC9, 0xA9, 0x61)
COLOR_RECOMMENDATION_BG = RGBColor(0xFD, 0xF7, 0xE3)

# ============================================================
# أدوات مساعدة لمعالجة النص العربي
# ============================================================

def reshape_arabic(text):
    """إعادة تشكيل النص العربي للعرض الصحيح"""
    if not text:
        return text
    try:
        reshaped = arabic_reshaper.reshape(text)
        return get_display(reshaped)
    except Exception:
        return text


def set_paragraph_rtl(paragraph):
    """تعيين اتجاه الفقرة من اليمين إلى اليسار"""
    pPr = paragraph._p.get_or_add_pPr()
    bidi = OxmlElement('w:bidi')
    bidi.set(qn('w:val'), '1')
    pPr.append(bidi)
    paragraph.alignment = WD_ALIGN_PARAGRAPH.RIGHT


def set_run_rtl(run):
    """تعيين خصائص RTL للنص"""
    rPr = run._element.get_or_add_rPr()
    rtl = OxmlElement('w:rtl')
    rtl.set(qn('w:val'), '1')
    rPr.append(rtl)


def set_cell_background(cell, color_hex):
    """تعيين لون خلفية الخلية"""
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), color_hex)
    tcPr.append(shd)


def set_cell_border(cell, **kwargs):
    """تعيين حدود الخلية"""
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    for border_name in ['top', 'left', 'bottom', 'right']:
        if border_name in kwargs:
            border = OxmlElement(f'w:{border_name}')
            border.set(qn('w:val'), 'single')
            border.set(qn('w:sz'), str(kwargs[border_name].get('sz', 4)))
            border.set(qn('w:color'), kwargs[border_name].get('color', '000000'))
            tcBorders.append(border)
    tcPr.append(tcBorders)


def add_page_break(doc):
    """إضافة فاصل صفحة"""
    p = doc.add_paragraph()
    run = p.add_run()
    run.add_break(WD_BREAK.PAGE)


# ============================================================
# إنشاء الوثيقة
# ============================================================

def create_document():
    doc = Document()

    # إعداد الهوامش
    for section in doc.sections:
        section.top_margin = Cm(2.5)
        section.bottom_margin = Cm(2.5)
        section.left_margin = Cm(2.5)
        section.right_margin = Cm(2.5)

    # تعيين الخط الافتراضي
    style = doc.styles['Normal']
    style.font.name = 'Cairo'
    style.font.size = Pt(11)
    style.font.color.rgb = COLOR_PRIMARY

    # تعيين اتجاه RTL للوثيقة
    for section in doc.sections:
        sectPr = section._sectPr
        bidi = OxmlElement('w:bidi')
        sectPr.append(bidi)

    return doc


def add_heading_styled(doc, text, level=1, color=None):
    """إضافة عنوان بأسلوب مخصص"""
    if color is None:
        color = COLOR_PRIMARY if level == 1 else COLOR_ACCENT

    p = doc.add_paragraph()
    set_paragraph_rtl(p)

    run = p.add_run(text)
    set_run_rtl(run)
    run.font.name = 'Cairo'
    run.font.color.rgb = color
    run.bold = True

    if level == 1:
        run.font.size = Pt(20)
        p.paragraph_format.space_before = Pt(24)
        p.paragraph_format.space_after = Pt(12)
        # إضافة حد سفلي ذهبي
        pPr = p._p.get_or_add_pPr()
        pBdr = OxmlElement('w:pBdr')
        bottom = OxmlElement('w:bottom')
        bottom.set(qn('w:val'), 'single')
        bottom.set(qn('w:sz'), '12')
        bottom.set(qn('w:space'), '4')
        bottom.set(qn('w:color'), 'C9A961')
        pBdr.append(bottom)
        pPr.append(pBdr)
    elif level == 2:
        run.font.size = Pt(15)
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(8)
    elif level == 3:
        run.font.size = Pt(12)
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(6)

    p.paragraph_format.keep_with_next = True
    return p


def add_body_paragraph(doc, text, bold=False, color=None):
    """إضافة فقرة نصية أساسية"""
    p = doc.add_paragraph()
    set_paragraph_rtl(p)
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.space_after = Pt(8)
    p.paragraph_format.first_line_indent = Cm(0.5)

    run = p.add_run(text)
    set_run_rtl(run)
    run.font.name = 'Cairo'
    run.font.size = Pt(11)
    if bold:
        run.bold = True
    if color:
        run.font.color.rgb = color
    else:
        run.font.color.rgb = COLOR_PRIMARY
    return p


def add_bullet_point(doc, text, level=0):
    """إضافة نقطة قائمة"""
    p = doc.add_paragraph()
    set_paragraph_rtl(p)
    p.paragraph_format.line_spacing = 1.4
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.right_indent = Cm(0.5 + level * 0.5)

    # إضافة علامة النقطة
    bullet_char = "◀ " if level == 0 else "◆ "
    bullet_run = p.add_run(bullet_char)
    set_run_rtl(bullet_run)
    bullet_run.font.name = 'Cairo'
    bullet_run.font.size = Pt(10)
    bullet_run.font.color.rgb = COLOR_ACCENT

    run = p.add_run(text)
    set_run_rtl(run)
    run.font.name = 'Cairo'
    run.font.size = Pt(11)
    run.font.color.rgb = COLOR_PRIMARY
    return p


def add_recommendation_box(doc, title, content):
    """إضافة صندوق توصية مميز"""
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = table.cell(0, 0)

    # خلفية صفراء فاتحة
    set_cell_background(cell, 'FDF7E3')

    # حدود ذهبية
    set_cell_border(
        cell,
        top={'sz': 24, 'color': 'C9A961'},
        bottom={'sz': 24, 'color': 'C9A961'},
        left={'sz': 24, 'color': 'C9A961'},
        right={'sz': 24, 'color': 'C9A961'}
    )

    # عنوان التوصية
    p_title = cell.paragraphs[0]
    set_paragraph_rtl(p_title)
    p_title.paragraph_format.space_after = Pt(6)

    title_run = p_title.add_run("✦ " + title)
    set_run_rtl(title_run)
    title_run.font.name = 'Cairo'
    title_run.font.size = Pt(12)
    title_run.bold = True
    title_run.font.color.rgb = COLOR_ACCENT

    # محتوى التوصية
    p_content = cell.add_paragraph()
    set_paragraph_rtl(p_content)
    p_content.paragraph_format.line_spacing = 1.4

    content_run = p_content.add_run(content)
    set_run_rtl(content_run)
    content_run.font.name = 'Cairo'
    content_run.font.size = Pt(11)
    content_run.font.color.rgb = COLOR_PRIMARY

    # مسافة بعد الجدول
    doc.add_paragraph().paragraph_format.space_after = Pt(6)


def add_comparison_table(doc, headers, rows):
    """إضافة جدول مقارنات بأسلوب احترافي"""
    table = doc.add_table(rows=len(rows) + 1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    # تعيين عرض الأعمدة
    total_width = Cm(16)
    col_width = total_width / len(headers)

    # صف العناوين
    for i, header in enumerate(headers):
        cell = table.cell(0, i)
        cell.width = col_width
        set_cell_background(cell, '1F2937')
        set_cell_border(
            cell,
            top={'sz': 8, 'color': '1F2937'},
            bottom={'sz': 8, 'color': 'C9A961'},
            left={'sz': 4, 'color': '1F2937'},
            right={'sz': 4, 'color': '1F2937'}
        )
        p = cell.paragraphs[0]
        set_paragraph_rtl(p)
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(header)
        set_run_rtl(run)
        run.font.name = 'Cairo'
        run.font.size = Pt(11)
        run.bold = True
        run.font.color.rgb = COLOR_WHITE
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER

    # صفوف البيانات
    for row_idx, row_data in enumerate(rows):
        for col_idx, cell_text in enumerate(row_data):
            cell = table.cell(row_idx + 1, col_idx)
            cell.width = col_width
            # تلوين الصفوف بالتناوب
            if row_idx % 2 == 0:
                set_cell_background(cell, 'F9FAFB')
            set_cell_border(
                cell,
                top={'sz': 4, 'color': 'E5E7EB'},
                bottom={'sz': 4, 'color': 'E5E7EB'},
                left={'sz': 4, 'color': 'E5E7EB'},
                right={'sz': 4, 'color': 'E5E7EB'}
            )
            p = cell.paragraphs[0]
            set_paragraph_rtl(p)
            p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            p.paragraph_format.line_spacing = 1.3
            run = p.add_run(cell_text)
            set_run_rtl(run)
            run.font.name = 'Cairo'
            run.font.size = Pt(10)
            run.font.color.rgb = COLOR_PRIMARY
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER

    # منع تكرار الصفوف عبر الصفحات
    for row in table.rows:
        row.height = Cm(0.8)
        tr = row._tr
        trPr = tr.get_or_add_trPr()
        cantSplit = OxmlElement('w:cantSplit')
        trPr.append(cantSplit)

    # عنوان الجدول يبقى معه
    table.rows[0]._tr.get_or_add_trPr().append(OxmlElement('w:tblHeader'))

    doc.add_paragraph().paragraph_format.space_after = Pt(8)


def add_cover_page(doc):
    """صفحة الغلاف"""
    # مساحة فارغة علوية
    for _ in range(4):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(0)

    # شريط ذهبي علوي
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = table.cell(0, 0)
    set_cell_background(cell, 'C9A961')
    cell.height = Cm(0.3)
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)

    # العنوان الرئيسي
    p = doc.add_paragraph()
    set_paragraph_rtl(p)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(60)
    p.paragraph_format.space_after = Pt(12)

    run = p.add_run("دراسة أولية محدّثة")
    set_run_rtl(run)
    run.font.name = 'Cairo'
    run.font.size = Pt(16)
    run.font.color.rgb = COLOR_ACCENT
    run.bold = True

    # عنوان فرعي
    p = doc.add_paragraph()
    set_paragraph_rtl(p)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(8)

    run = p.add_run("موقع وتطبيق لعبة كلمات متقاطعة عربية")
    set_run_rtl(run)
    run.font.name = 'Cairo'
    run.font.size = Pt(28)
    run.font.color.rgb = COLOR_PRIMARY
    run.bold = True

    # وصف
    p = doc.add_paragraph()
    set_paragraph_rtl(p)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(40)

    run = p.add_run("دراسة شاملة لتطبيق ")
    set_run_rtl(run)
    run.font.name = 'Cairo'
    run.font.size = Pt(13)
    run.font.color.rgb = COLOR_SECONDARY

    run2 = p.add_run("ثقافتنا")
    set_run_rtl(run2)
    run2.font.name = 'Cairo'
    run2.font.size = Pt(15)
    run2.font.color.rgb = COLOR_ACCENT
    run2.bold = True

    run3 = p.add_run(" — لعبة كلمات متقاطعة عربية")
    set_run_rtl(run3)
    run3.font.name = 'Cairo'
    run3.font.size = Pt(13)
    run3.font.color.rgb = COLOR_SECONDARY

    # وصف إضافي
    p = doc.add_paragraph()
    set_paragraph_rtl(p)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(20)
    run = p.add_run("مع واجهة إدارية متكاملة لإدارة الأسئلة والتحديات اليومية للاعبين")
    set_run_rtl(run)
    run.font.name = 'Cairo'
    run.font.size = Pt(12)
    run.font.color.rgb = COLOR_SECONDARY

    # مساحة
    for _ in range(8):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(0)

    # معلومات أسفل الصفحة
    p = doc.add_paragraph()
    set_paragraph_rtl(p)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(4)
    run = p.add_run("النسخة: 3.0  |  أكتوبر 2026")
    set_run_rtl(run)
    run.font.name = 'Cairo'
    run.font.size = Pt(11)
    run.font.color.rgb = COLOR_SECONDARY

    p = doc.add_paragraph()
    set_paragraph_rtl(p)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run("وثيقة موجهة لفريق تقني — السيناريو الطموح")
    set_run_rtl(run)
    run.font.name = 'Cairo'
    run.font.size = Pt(10)
    run.font.color.rgb = COLOR_ACCENT
    run.bold = True

    # شريط ذهبي سفلي
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = table.cell(0, 0)
    set_cell_background(cell, 'C9A961')
    cell.height = Cm(0.2)
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(1)

    add_page_break(doc)


def add_toc_page(doc):
    """صفحة جدول المحتويات"""
    add_heading_styled(doc, "جدول المحتويات", level=1)

    toc_items = [
        ("1. الملخص التنفيذي", "3"),
        ("2. فكرة المنتج والنطاق", "4"),
        ("3. التحليل التنافسي", "5"),
        ("4. تجربة اللاعب وواجهة الإدارة", "7"),
        ("5. لوحة الإدارة: الوظائف والتوسعات", "8"),
        ("6. دعم العربية وجودة الألغاز", "10"),
        ("7. نموذج الربح (المعتمد)", "11"),
        ("8. خطة المحتوى وإنتاج الألغاز", "13"),
        ("9. آليات الاحتفاظ باللاعب", "14"),
        ("10. خطة تحسين ظهور التطبيق ASO", "15"),
        ("11. إمكانية الوصول", "16"),
        ("12. التقنية المقترحة والبنية", "17"),
        ("13. الخصوصية والامتثال للنشر", "18"),
        ("14. مراحل التنفيذ والجدول الزمني", "19"),
        ("15. مؤشرات نجاح النسخة التجريبية", "21"),
        ("16. السيناريو المعتمد: الطموح", "22"),
        ("17. القرارات النهائية المعتمدة", "24"),
        ("18. المراجع المحدّثة", "25"),
    ]

    table = doc.add_table(rows=len(toc_items), cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER

    for i, (title, page) in enumerate(toc_items):
        # عمود العنوان
        cell_title = table.cell(i, 0)
        cell_title.width = Cm(13)
        p = cell_title.paragraphs[0]
        set_paragraph_rtl(p)
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run(title)
        set_run_rtl(run)
        run.font.name = 'Cairo'
        run.font.size = Pt(11)
        run.font.color.rgb = COLOR_PRIMARY

        # عمود الصفحة
        cell_page = table.cell(i, 1)
        cell_page.width = Cm(3)
        p = cell_page.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(page)
        run.font.name = 'Cairo'
        run.font.size = Pt(11)
        run.font.color.rgb = COLOR_ACCENT
        run.bold = True

    add_page_break(doc)


# ============================================================
# محتوى الأقسام
# ============================================================

def add_executive_summary(doc):
    """الملخص التنفيذي"""
    add_heading_styled(doc, "1. الملخص التنفيذي", level=1)

    add_body_paragraph(doc,
        "تستعرض هذه الوثيقة دراسة أولية شاملة لمشروع تطبيق لعبة كلمات متقاطعة عربية باسم «ثقافتنا»، "
        "يستلهم فكرته من الألعاب العربية الناجحة مثل «وصلة» و«فزرة» و«كلمات متقاطعة»، مع التركيز على بناء واجهة إدارية "
        "متكاملة تتيح لفريق التطبيق إضافة الأسئلة والتحديات اليومية للاعبين بشكل ديناميكي. تتكون الوثيقة من الأقسام "
        "الأصلية للدراسة الأولية، مضافاً إليها سبعة أقسام جديدة تعالج الثغرات التي رصدناها في المراجعة التقنية، وهي: "
        "التحليل التنافسي، نموذج الربح، خطة المحتوى، آليات الاحتفاظ باللاعب، خطة ASO، إمكانية الوصول، والتوطين المستقبلي."
    )

    add_body_paragraph(doc,
        "يهدف المنتج إلى تقديم تجربة لعب عربية أصيلة تجمع بين سحب الحروف لتكوين الكلمات وملء شبكة كلمات متقاطعة، "
        "مع نظام تقدم محفوظ ومكافآت عملات افتراضية وتلميحات. تتميز هذه النسخة عن المنافسين بوجود لوحة إدارة قوية تتيح "
        "لفريق التطبيق إنشاء الفصول والمراحل والأسئلة اليومية والتحديات الموسمية بسرعة، مع فحص آلي لجودة الألغاز قبل النشر. "
        "كما يدعم النظام الكلمات الإضافية التي يكتشفها اللاعب خارج الشبكة المطلوبة، مما يضيف بُعداً تعليمياً وترفيهياً."
    )

    add_body_paragraph(doc,
        "يغطي المشروع واجهات ثلاث: تطبيق هاتف على Android وiOS (Flutter)، موقع ويب للعب كامل من اليوم الأول (Next.js)، "
        "ولوحة إدارة ويب متكاملة. يُمنح الخادم المسؤولية الكاملة عن منح العملات وخصم تكلفة التلميحات والتحقق من إكمال "
        "المراحل، لمنع التلاعب من جانب العميل. المحتوى يشمل العربية الفصحى والعامية، ويتوجه لجميع الفئات العمرية، مع "
        "تركيز على السوق العربي في المرحلة الأولى دون التوطين للغات أخرى."
    )

    add_body_paragraph(doc,
        "نموذج الربح المعتمد هو «مجاني مع إعلانات غير مزعجة + مساعدات مدفوعة»: يستخدم اللاعب التطبيق مجاناً مع "
        "إعلانات محدودة التكرار، ويدفع اختيارياً مقابل مساعدات إضافية (تلميحات، حل كلمة، عملات إضافية). هذا النموذج "
        "يتوازن مع رغبة المستخدم في المساعدة دون إلزامه بالاشتراكات. يسمح اسم التطبيق «ثقافتنا» ببناء هوية عربية "
        "ثقافية تميزه عن المنافسين، وتفتح المجال لمحتوى موضوعي متنوع."
    )

    add_recommendation_box(doc,
        "التوصية العامة — السيناريو الطموح",
        "بناءً على القرارات المعتمدة (ميزانية مفتوحة حتى إتمام الجودة العالية، لعب ويب كامل من اليوم الأول، "
        "ميزات احتفاظ كاملة في النسخة الأولى)، نوصي بتنفيذ السيناريو الطموح خلال 18-22 أسبوعاً بفريق من 6-8 أشخاص. "
        "يجب إطلاق التطبيق بمكتبة لا تقل عن 300 مرحلة متدرجة، مع خطة إضافة 30-50 مرحلة أسبوعياً للحفاظ على تفاعل "
        "اللاعبين. لوحة الإدارة هي القيمة التنافسية الأساسية ويجب أن تُبنى بجودة عالية منذ البداية."
    )


def add_product_scope(doc):
    """فكرة المنتج والنطاق"""
    add_heading_styled(doc, "2. فكرة المنتج والنطاق", level=1)

    add_heading_styled(doc, "2.1 فكرة المنتج", level=2)

    add_body_paragraph(doc,
        "يقدم تطبيق «ثقافتنا» لعبة كلمات عربية تجمع بين توصيل الحروف وملء شبكة كلمات متقاطعة، على غرار الألعاب العربية "
        "الشهيرة مثل «وصلة» و«فزرة» و«كلمات متقاطعة». يختار اللاعب مرحلة من خريطة الفصول، ثم يسحب عبر حروف مرتبة "
        "داخل دائرة لتكوين كلمة. إذا كانت الكلمة ضمن الشبكة تظهر في خاناتها، وقد تتقاطع مع كلمات أخرى. الكلمات "
        "الصحيحة غير الموجودة في الشبكة تُحتسب كلمات إضافية وتمنح اللاعب مكافآت."
    )

    add_body_paragraph(doc,
        "تتضمن الواجهة خلط الحروف، وتلميحات تكشف حرفاً أو جزءاً من الحل مقابل عملات، ثم شاشة إكمال ومكافأة "
        "وانتقالاً إلى المرحلة التالية. تتدرج صعوبة المراحل، وتُجمع في فصول أو مجموعات ذات خلفيات وموضوعات "
        "مختلفة. المهم في نقل الفكرة إلى المنتج هو أن المحتوى ليس بالضرورة «سؤالاً وجواباً» تقليدياً؛ في النمط "
        "الظاهر، تحدي اللاعب هو اكتشاف الكلمات من مجموعة الحروف. يفتح اسم «ثقافتنا» مجالاً لمحتوى موضوعي متنوع "
        "يجمع بين الفصحى والعامية ويستهدف جميع الفئات العمرية."
    )

    add_heading_styled(doc, "2.2 نطاق النسخة الأولى (MVP الطموح)", level=2)

    add_body_paragraph(doc,
        "يشمل النطاق المعتمد للنسخة الأولى ما يلي: لعب فردي على الهاتف (Android وiOS) والموقع ويب معاً، خريطة مراحل "
        "وفصول، تقدم محفوظ محلياً وسحابياً، مكافآت عملات افتراضية، تلميحات وخلط الحروف، كلمات إضافية، لوحة إدارة "
        "متكاملة لإدارة المحتوى والأسئلة اليومية، تحدٍ يومي، مكافأة يومية متزايدة، إشعارات ذكية، إحصاءات أساسية، "
        "سياسة خصوصية، وإعدادات اللغة. تؤجل المنافسات المباشرة، والدردشة، والفرق، والفعاليات الاجتماعية المعقدة إلى مرحلة لاحقة."
    )

    add_body_paragraph(doc,
        "التميز عن المنافسين يأتي من أربعة جوانب رئيسية: أولاً، واجهة إدارية متكاملة تتيح إدارة الأسئلة اليومية "
        "والتحديات الموسمية للاعبين بشكل ديناميكي دون الحاجة لإصدار تحديث من المتجر؛ ثانياً، لعب كامل على الموقع "
        "الإلكتروني من اليوم الأول، مما يوسع قاعدة المستخدمين ويتجنب قيود المتاجر؛ ثالثاً، دعم عميق للغة العربية "
        "يشمل قواعد تطبيع قابلة للضبط لكل حزمة محتوى وتنوع بين الفصحى والعامية؛ رابعاً، اسم «ثقافتنا» يبني هوية "
        "ثقافية عربية مميزة تسمح بمحتوى موضوعي غني (أدب، تاريخ، علوم، ترفيه)."
    )


def add_competitive_analysis(doc):
    """التحليل التنافسي"""
    add_heading_styled(doc, "3. التحليل التنافسي", level=1)

    add_body_paragraph(doc,
        "قبل تحديد ميزات المنتج، لا بد من فهم المشهد التنافسي للألعاب العربية في هذا المجال. تستعرض هذه الفقرة "
        "أبرز الألعاب العربية المشابهة، مع تحديد نقاط القوة والضعف والفجوات التي يمكن لمنتجنا أن يملأها. هذا "
        "التحليل ضروري لتحديد التميز الاستراتيجي، ولتجنب تكرار أخطاء المنافسين، ولإيجاد فرص التميز التي لم تستثمر بعد."
    )

    add_heading_styled(doc, "3.1 الألعاب المنافسة الرئيسية", level=2)

    add_comparison_table(doc,
        ["اللعبة", "نقاط القوة", "نقاط الضعف", "الفجوة المتاحة"],
        [
            ["وصلة (Wassla)",
             "محتوى ضخم، واجهة بسيطة، شهرة واسعة، مكتبة ألغاز كبيرة",
             "إعلانات كثيفة، صعوبة متذبذبة، لا توجد تحديات يومية مرنة",
             "إدارة محتوى ديناميكية، جودة عربية أفضل، تلميحات أذكى"],
            ["فزرة (Fazra)",
             "تحديات اجتماعية، تصاميم جذابة، تحديثات متكررة",
             "تبعية شديدة للإعلانات، صعوبة الوصول للمبتدئين",
             "منحنى صعوبة متدرج، إمكانية وصول أفضل، وضع لعب هادئ"],
            ["كلمات متقاطعة",
             "نمط كلاسيكي مألوف، محتوى تعليمي",
             "واجهة قديمة، لا توجد ميزات حديثة، إدارة محتوى يدوية",
             "واجهة عصرية، محرر بصري، تكامل مع التحديات اليومية"],
            ["كلمات (Kalimat)",
             "تطبيق سلس، تصميم نظيف، تجربة لعب ممتعة",
             "محتوى محدود، اعتماد كبير على الشراء داخل التطبيق",
             "محتوى أكثر تنوعاً، نموذج ربح أقل إجباراً"],
        ]
    )

    add_heading_styled(doc, "3.2 نقاط التميز المقترحة", level=2)

    add_body_paragraph(doc,
        "بناءً على التحليل أعلاه، نحدد خمس نقاط تميز رئيسية يجب أن يركز عليها المنتج للتفوق على المنافسين:"
    )

    add_bullet_point(doc,
        "إدارة محتوى ديناميكية: لوحة إدارة تتيح إضافة أسئلة وتحديات يومية دون إصدار تحديث من المتجر، "
        "ما يمنح مرونة كبيرة في إدارة دورة حياة المحتوى والتفاعل الفوري مع سلوك اللاعبين."
    )
    add_bullet_point(doc,
        "جودة عربية محسّنة: قواعد تطبيع قابلة للضبط لكل حزمة محتوى، تعامل دقيق مع الهمزات والتاء "
        "المربوطة والألف المقصورة، واختبار آلي للألغاز قبل النشر لضمان عدم وجود أخطاء لغوية."
    )
    add_bullet_point(doc,
        "منحنى صعوبة متدرج: 200+ مرحلة عند الإطلاق موزعة على فصول متدرجة، مع نظام تقييم ذاتي لصعوبة "
        "كل مرحلة بناءً على متوسط زمن الحل ونسبة الإكمال."
    )
    add_bullet_point(doc,
        "نموذج ربح متوازن: تجنب الإفراط في الإعلانات أو الشراء الإجباري، مع تقديم خيارات متعددة "
        "للاعبين المجانيين والمدفوعين على حد سواء."
    )
    add_bullet_point(doc,
        "إمكانية الوصول: دعم قارئ الشاشة، خيارات تباين الألوان، أحجام خط قابلة للتعديل، مما يوسع "
        "قاعدة المستخدمين ويلبي متطلبات المتاجر."
    )

    add_recommendation_box(doc,
        "توصية تنافسية",
        "التركيز على نقطة التميز الأولى (إدارة المحتوى الديناميكية) كميزة تنافسية رئيسية، لأنها الأصعب على "
        "المنافسين تقليدها سريعاً، ولأنها تتيح بناء علاقة طويلة الأمد مع اللاعبين عبر محتوى متجدد يومياً. "
        "ينبغي أن تظهر هذه الميزة بوضوح في صفحة المتجر وفي الوصف التسويقي للتطبيق."
    )


def add_player_experience(doc):
    """تجربة اللاعب وواجهة الإدارة"""
    add_heading_styled(doc, "4. تجربة اللاعب وواجهة الإدارة", level=1)

    add_heading_styled(doc, "4.1 رحلة اللاعب", level=2)

    add_body_paragraph(doc,
        "يبدأ اللاعب كضيف من دون إجباره على إنشاء حساب، ثم يمكنه ربط الحساب لاحقاً لحفظ التقدم بين الأجهزة. "
        "تعرض الخريطة الفصول والمراحل المفتوحة والمقفلة، مع مؤشر واضح للمرحلة الحالية. تعرض شاشة اللعب رقم "
        "المرحلة ورصيد العملات والشبكة ومجموعة الحروف وأزرار الخلط والتلميحات. يسحب اللاعب على الحروف لتكوين "
        "كلمة، فتظهر تغذية بصرية للكلمة الصحيحة في الشبكة، ورسالة مناسبة للكلمة الخاطئة، وتُسجل الكلمة الصحيحة "
        "غير المطلوبة كمكافأة إضافية."
    )

    add_body_paragraph(doc,
        "عند اكتمال الشبكة تظهر شاشة نجاح ومكافأة، ثم يفتح المستوى التالي. تُحفظ المرحلة الحالية والنتائج محلياً "
        "فوراً، ثم تُزامن مع الخادم عند الاتصال. ويمكن تنزيل حزمة صغيرة من المراحل للعب دون اتصال، مع تأجيل "
        "مزامنة النتيجة إلى عودة الشبكة. ينبغي أن تبقى جلسة المرحلة قصيرة وسهلة الاستئناف، وأن تُعرض أسعار "
        "التلميحات بالعملات بوضوح قبل استخدامها."
    )

    add_heading_styled(doc, "4.2 البنية الإدارية لإضافة الأسئلة والتحديات", level=2)

    add_body_paragraph(doc,
        "الميزة التنافسية الأساسية لهذا المنتج هي واجهة إدارية متكاملة تتيح للفريق إدارة المحتوى الديناميكي "
        "بالكامل دون الحاجة لإصدار تحديث من المتجر. تشمل هذه الواجهة أربعة أنواع رئيسية من المحتوى القابل للإدارة:"
    )

    add_bullet_point(doc,
        "المراحل الأساسية: الفصول والمراحل المنتظمة في خريطة اللاعب، مع إمكانية الإضافة والتعديل والنسخ."
    )
    add_bullet_point(doc,
        "الأسئلة اليومية: سؤال أو لغز يومي يظهر لجميع اللاعبين في وقت محدد، مع مكافأة مضاعفة للمكملين في الوقت المحدد."
    )
    add_bullet_point(doc,
        "التحديات الأسبوعية: مجموعة ألغاز أسبوعية بصعوبة مرتفعة ومكافآت مميزة، تظهر في تبويب منفصل."
    )
    add_bullet_point(doc,
        "الأحداث الموسمية: فصول مؤقتة لمناسبات معينة (رمضان، الأعياد، المواسم)، مع خلفيات وموضوعات خاصة."
    )

    add_body_paragraph(doc,
        "يجب أن تدعم الواجهة الإدارية جدولة المحتوى مسبقاً، بحيث يمكن للمحرر إعداد محتوى أسبوع كامل في جلسة "
        "واحدة، مع نشر تلقائي في المواعيد المحددة. كما يجب أن تتيح استهداف فئات معينة من اللاعبين (جدد، متقدمين، "
        "غير نشطين) بمحتوى مخصص، لرفع معدلات الاحتفاظ والتفاعل."
    )


def add_admin_panel(doc):
    """لوحة الإدارة: الوظائف والتوسعات"""
    add_heading_styled(doc, "5. لوحة الإدارة: الوظائف والتوسعات", level=1)

    add_heading_styled(doc, "5.1 محرر الفصول والمراحل", level=2)

    add_body_paragraph(doc,
        "يقدم المحرر وظائف شاملة لإنشاء المحتوى وتحريره. يمكن إنشاء الفصول وتسميتها وترتيبها وربطها بصورة خلفية "
        "أو سمة بصرية. يمكن إنشاء مرحلة وتحديد رقمها ومستواها والفصل التابع له، وحجم الشبكة ومجموعة الحروف. "
        "يتم إدخال الكلمات المطلوبة ومواقعها واتجاهاتها، أو وضعها على شبكة مرئية بالسحب والإفلات. كما يمكن تعريف "
        "الكلمات الإضافية المقبولة، والتلميحات المتاحة، وتكلفة كل تلميح، ومكافأة إكمال المرحلة."
    )

    add_body_paragraph(doc,
        "يدعم المحرر إضافة وصف داخلي للمحرر، ووسوم للمحتوى، وحالة المرحلة: مسودة، قيد المراجعة، مجازة، منشورة، "
        "أو مؤرشفة. يمكن نسخ مرحلة موجودة لإنشاء نسخة معدلة بسرعة، مع سجل يبين من عدّل المحتوى ومتى. كل عملية "
        "نشر تحفظ إصداراً ثابتاً من المرحلة، حتى لا يتغير لغز لاعب بدأه بالفعل إذا عدّل المحرر المحتوى لاحقاً."
    )

    add_heading_styled(doc, "5.2 إدارة الأسئلة والتحديات اليومية", level=2)

    add_body_paragraph(doc,
        "قسم خاص في لوحة الإدارة لإدارة الأسئلة اليومية والتحديات. يتيح هذا القسم إنشاء سؤال أو لغز يومي مع "
        "تحديد تاريخ النشر، المدة الزمنية المتاح فيها، المكافأة الممنوحة، والفئة المستهدفة (جميع اللاعبين، "
        "متقدمون فقط، إلخ). يمكن جدولة محتوى أسبوع أو شهر كامل مسبقاً، مع إمكانية التعديل قبل النشر التلقائي."
    )

    add_heading_styled(doc, "5.3 التحقق قبل النشر", level=2)

    add_body_paragraph(doc,
        "المحرر هو أهم جزء إداري؛ فإدخال إجابات صحيحة منفردة لا يكفي لضمان أن المرحلة قابلة للعب. يجب أن يتحقق "
        "النظام آلياً من أن حروف الكلمات في نقاط التقاطع متطابقة ولا توجد خانات متعارضة، وأن كل كلمة مطلوبة يمكن "
        "تكوينها من مجموعة الحروف المتاحة مع احتساب تكرار الحرف عند الحاجة، وأن كل كلمة موضوعة في الشبكة تقع "
        "داخل حدودها ولا تتداخل بطريقة غير مقصودة، وأن عدد الخانات ومسارات الكلمات يطابقان حل المرحلة."
    )

    add_body_paragraph(doc,
        "يجب أيضاً التحقق من أن الكلمات المقبولة والمكافآت والتلميحات مكتملة، ولا يوجد تلميح يكشف جواباً غير مرتبط. "
        "يفضل أن يدعم الإصدار الأول محرر شبكة بصرياً مع فحص تلقائي، ثم تضاف لاحقاً إمكانية استيراد المراحل من ملف "
        "CSV أو قالب منظم. تتيح المعاينة اختبار المرحلة في وضع يحاكي شاشة الهاتف قبل نشرها."
    )

    add_heading_styled(doc, "5.4 المستخدمون والتقارير", level=2)

    add_body_paragraph(doc,
        "تدعم اللوحة أدواراً منفصلة: مدير النظام، محرر محتوى، مراجع/ناشر، ومحلل للقراءة فقط. تعرض لوحة المؤشرات "
        "اللاعبين النشطين، المراحل التي بدأها اللاعبون وأكملوها، نسب الانسحاب، استخدام التلميحات، الكلمات الأكثر "
        "إخفاقاً، ومتوسط زمن حل المرحلة. يحفظ النظام سجل تعديلات المحتوى وإعدادات الاقتصاد داخل اللعبة، ويدعم "
        "إدارة بلاغات أو دعم المستخدمين عند إضافة حسابات أو خصائص تواصل في المستقبل."
    )


def add_arabic_support(doc):
    """دعم العربية وجودة الألغاز"""
    add_heading_styled(doc, "6. دعم العربية وجودة الألغاز", level=1)

    add_body_paragraph(doc,
        "ينبغي اتخاذ قرارات لغوية قبل إنتاج عدد كبير من المراحل. فحروف مثل الألف بهمزة أو بدونها، والياء والألف "
        "المقصورة، والتاء المربوطة والهاء، والتشكيل، والجمع والمفرد قد تنتج إجابات مقبولة أو ملتبسة. أوصي بأن "
        "تكون قواعد التطبيع قابلة للضبط لكل لعبة أو حزمة، لا أن تُدمج في قاعدة ثابتة تغيّر معنى الكلمات. مثال ذلك: "
        "السماح بإهمال التشكيل، مع إبقاء التعامل مع «ة/ه» و«ى/ي» قراراً تحريرياً واضحاً."
    )

    add_body_paragraph(doc,
        "كما يجب اختبار اتجاه القراءة والتقاطعات من اليمين إلى اليسار على أجهزة بأحجام مختلفة. يُستحسن توفير قائمة "
        "كلمات معتمدة وحقول للمراجع وملاحظات تحريرية، واختبار الكلمات إملائياً وسياقياً قبل اعتمادها. وإذا كان المنتج "
        "موجهاً للأطفال، فيجب اختيار الإعلانات والتحليلات وأساليب جمع البيانات وفق متطلبات الفئة العمرية، لا اعتماد "
        "إعدادات تطبيق عام تلقائياً."
    )

    add_recommendation_box(doc,
        "توصية لغوية",
        "إنشاء قاعدة بيانات معجمية مرجعية تضم 5000-10000 كلمة عربية معتمدة، مصنفة حسب المستوى (مبتدئ، متوسط، "
        "متقدم) والمجال (عام، ديني، علمي، تاريخي). هذه القاعدة ستسرّع إنتاج الألغاز وتضمن اتساق الجودة. يجب أن "
        "تكون قابلة للتوسعة من قبل المحررين مع آلية مراجعة بسيطة."
    )


def add_monetization(doc):
    """نموذج الربح - معتمد: مجاني + إعلانات غير مزعجة + مساعدات مدفوعة"""
    add_heading_styled(doc, "7. نموذج الربح (المعتمد)", level=1)

    add_body_paragraph(doc,
        "اعتمد صاحب المشروع نموذج ربح واضح: «مجاني مع إعلانات غير مزعجة + مساعدات مدفوعة». هذا النموذج يجمع "
        "بين三个 عناصر رئيسية: الوصول المجاني الكامل للاعب، إعلانات محدودة التكرار لا تعيق التجربة، وفرص دفع "
        "اختيارية للاعبين الراغبين في مساعدات إضافية. هذا النموذج هو الأنسب للسوق العربي لأنه يوازن بين الوصول "
        "الواسع والربحية، ولا يُلزم اللاعب بدفع مبالغ كبيرة مسبقة، ويتجنب سلبيات الاشتراكات في سوق لم يعتد عليها بعد."
    )

    add_heading_styled(doc, "7.1 مكونات النموذج المعتمد", level=2)

    add_comparison_table(doc,
        ["المكوّن", "الوصف", "الإيراد المتوقع", "تكرار العرض"],
        [
            ["إعلانات Interstitial",
             "إعلان كامل الشاشة بين المراحل",
             "0.01-0.05 دولار لكل مشاهدة",
             "كل 3-5 مراحل مكتملة"],
            ["إعلانات بانر",
             "بانر صغير في أسفل الشاشة",
             "0.5-2 دولار لكل 1000 ظهور",
             "دائم في القوائم"],
            ["إعلانات المكافأة (Rewarded)",
             "اللاعب يختار مشاهدة إعلان مقابل عملات",
             "0.02-0.10 دولار لكل مشاهدة",
             "عند الطلب فقط"],
            ["شراء تلميح",
             "تلميح إضافي يكشف حرفاً أو جزءاً من الحل",
             "0.10-0.30 دولار للوحدة",
             "عند الطلب"],
            ["شراء حل كلمة",
             "حل كلمة كاملة من الشبكة",
             "0.30-0.50 دولار للوحدة",
             "عند الطلب"],
            ["حزم عملات",
             "شراء حزم عملات بكميات مختلفة",
             "1-50 دولار حسب الحزمة",
             "عند الطلب"],
            ["إزالة الإعلانات",
             "شراء لمرة واحدة يلغي جميع الإعلانات",
             "2-4 دولار",
             "لمرة واحدة"],
        ]
    )

    add_heading_styled(doc, "7.2 مبادئ التصميم للنموذج", level=2)

    add_body_paragraph(doc,
        "المبدأ الأساسي الذي اعتمدناه: «اللاعب لا يُجبر على الدفع، بل يُغري بالمساعدة». هذا يعني أن كل المحتوى "
        "متاح مجاناً مع جهد وصبر، لكن من يريد تسريع تقدمه أو تجاوز مرحلة صعبة يجد أمامه خياراً مدفوعاً سهلاً "
        "ومنصفاً. الإعلانات تظهر بشكل غير مزعج: بانر صغير في القوائم فقط (ليس في شاشة اللعب)، وإعلان كامل "
        "الشاشة كل 3-5 مراحل مكتملة (وليس بعد كل مرحلة)، وإعلانات مكافأة اختيارية يبدأها اللاعب بنفسه."
    )

    add_body_paragraph(doc,
        "المساعدات المدفوعة تُعرَض بأسعار واضحة بالعملات الافتراضية (التي يمكن شراؤها بالمال الحقيقي أو كسبها "
        "ببطء عبر اللعب). اللاعب يستطيع كسب العملات عبر إكمال المراحل والتحديات اليومية ومشاهدة إعلانات المكافأة، "
        "ما يتيح لمن لا يريد الدفع الحصول على نفس المساعدات مع صبر إضافي. هذا التوازن يحافظ على رضا اللاعبين "
        "المجانيين والمدفوعين على حد سواء."
    )

    add_heading_styled(doc, "7.3 لماذا تجنبنا الاشتراكات؟", level=2)

    add_body_paragraph(doc,
        "في السوق العربي، الانتشار الفعلي للاشتراكات في تطبيقات الألعاب لا يزال محدوداً. اللاعب العربي يفضل "
        "الشراء لمرة واحدة (إزالة إعلانات، حزمة عملات) على الالتزام الشهري المتكرر. كما أن الاشتراكات تفرض "
        "تعقيدات تقنية (بوابات دفع متعددة، تجديد تلقائي، إلغاء اشتراك) وقانونية (قوانين مختلفة بين الدول العربية) "
        "قد لا تستحق العائد في المرحلة الأولى. يمكن التفكير في إضافة اشتراكات لاحقاً بعد بناء قاعدة مستخدمين قوية "
        "واختبار قبولها."
    )

    add_heading_styled(doc, "7.4 التوقعات المالية التقريبية", level=2)

    add_comparison_table(doc,
        ["المؤشر", "السنة الأولى", "السنة الثانية", "السنة الثالثة"],
        [
            ["المستخدمون النشطون شهرياً (MAU)",
             "10,000 - 50,000",
             "50,000 - 200,000",
             "200,000 - 500,000"],
            ["نسبة الدافعين (Conversion)",
             "2-3%",
             "3-5%",
             "4-6%"],
            ["متوسط الإيراد لكل مستخدم (ARPU)",
             "0.5-1.5 دولار/شهر",
             "1-2.5 دولار/شهر",
             "1.5-3 دولار/شهر"],
            ["الإيراد الشهري المتوقع",
             "5,000-75,000 دولار",
             "50,000-500,000 دولار",
             "300,000-1.5M دولار"],
            ["تكلفة الاستحواذ على مستخدم (CAC)",
             "0.3-1 دولار",
             "0.5-1.5 دولار",
             "0.8-2 دولار"],
        ]
    )

    add_body_paragraph(doc,
        "هذه التقديرات تقريبية وتعتمد على جودة التنفيذ وقوة التسويق والمحتوى. السنة الأولى عادة تكون استثمارية "
        "(الإيرادات لا تغطي التكاليف)، والسنة الثانية تحقق التعادل أو ربحاً طفيفاً، والسنة الثالثة تكون الربحية "
        "الحقيقية مع توسع قاعدة المستخدمين."
    )

    add_recommendation_box(doc,
        "التوصية النهائية: النموذج المعتمد متوازن",
        "النموذج المعتمد «مجاني + إعلانات غير مزعجة + مساعدات مدفوعة» هو الخيار الأمثل لـ«ثقافتنا» في المرحلة "
        "الحالية. يجمع بين الوصول الواسع (مجاني) والربحية (إعلانات + دفع اختياري)، ويتجنب تعقيدات الاشتراكات، "
        "ويلائم ثقافة المستخدم العربي. عند بلوغ 100,000 مستخدم نشط شهرياً، يمكن إعادة تقييم إضافة اشتراكات "
        "شهري sencilla لمحتوى مميز إضافي."
    )


def add_content_plan(doc):
    """خطة المحتوى وإنتاج الألغاز"""
    add_heading_styled(doc, "8. خطة المحتوى وإنتاج الألغاز", level=1)

    add_body_paragraph(doc,
        "إنتاج المحتوى هو العامل الأكثر تأثيراً على نجاح التطبيق أو فشله. تطبيق بدون محتوى كافٍ سيخسر لاعبيه "
        "خلال أسابيع قليلة، مهما كانت جودة الواجهة والتنفيذ التقني. تستعرض هذه الفقرة خطة واقعية لإنتاج الألغاز "
        "بدءاً من الإطلاق ومروراً بالنمو الأسبوعي."
    )

    add_heading_styled(doc, "8.1 الفريق المطلوب لإنتاج المحتوى", level=2)

    add_comparison_table(doc,
        ["الدور", "المهام", "العبء الكامل/الجزئي", "عدد المراحل أسبوعياً"],
        [
            ["محرر محتوى رئيسي",
             "إنشاء المراحل، مراجعة الجودة، جدولة النشر",
             "كامل",
             "40-60 مرحلة"],
            ["محرر مساعد",
             "إنشاء المراحل، تنويد المحتوى، اختبار اللعب",
             "كامل أو نصف",
             "30-40 مرحلة"],
            ["مراجع لغوي",
             "تدقيق الكلمات، ضبط التطبيع، اعتماد النشر",
             "نصف (مشترك)",
             "مراجعة كل المراحل"],
            ["مصمم ألغاز (اختياري)",
             "تصميم ألغاز مبتكرة، تطوير أنماط جديدة",
             "جزئي",
             "10-20 مرحلة مميزة"],
        ]
    )

    add_heading_styled(doc, "8.2 خطة الإطلاق والنمو", level=2)

    add_body_paragraph(doc,
        "إدارة المحتوى تتم بالكامل عبر اللوحة الإدارية، حيث يمكن لفريق التطبيق إنشاء الأسئلة والألغاز ونشرها "
        "مباشرة للاعبين دون الحاجة لإصدار تحديث من المتجر. هذا يمنح مرونة كبيرة في إدارة دورة حياة المحتوى "
        "والتفاعل الفوري مع سلوك اللاعبين. نوصي بإطلاق التطبيق بمكتبة لا تقل عن 300 مرحلة متدرجة الصعوبة، "
        "موزعة على 5-6 فصول. هذا العدد يكفي لإبقاء اللاعب العادي مشغولاً لمدة 3-4 أسابيع على الأقل، ما يمنح "
        "الفريق وقتاً لإنتاج محتوى جديد."
    )

    add_body_paragraph(doc,
        "خلال الأشهر الثلاثة الأولى، يجب الوصول إلى 600-800 مرحلة على الأقل مع تقييم مستمر لصعوبة كل مرحلة بناءً "
        "على بيانات اللاعبين الفعلية (متوسط زمن الحل، نسبة الإكمال، استخدام التلميحات). المراحل ذات نسبة الإكمال "
        "المنخفضة جداً (أقل من 20%) يجب تعديلها أو استبدالها، والمراحل السهلة جداً (نسبة إكمال أعلى من 95% في "
        "أقل من دقيقتين) يجب رفع صعوبتها أو نقلها لبداية الخريطة."
    )

    add_heading_styled(doc, "8.3 معايير قبول اللغز", level=2)

    add_bullet_point(doc, "الكلمات كلها من القاعدة المعجمية المعتمدة (لا اختراعات أو كلمات نادرة جداً).")
    add_bullet_point(doc, "مستوى الصعوبة يطابق تصنيف المرحلة (مبتدئ، متوسط، متقدم).")
    add_bullet_point(doc, "مجموعة الحروف تتيح تكوين كلمات إضافية معقولة (3-10 كلمات إضافية).")
    add_bullet_point(doc, "لا توجد تقاطعات تخلق لبساً (نفس الخانية تحمل حرفين محتملين مختلفين).")
    add_bullet_point(doc, "الشبكة متماثلة بصرياً قدر الإمكان وجمالية المظهر محققة.")
    add_bullet_point(doc, "التلميحات متنوعة ولا تكشف الجواب مباشرة عند أول استخدام.")

    add_recommendation_box(doc,
        "توصية إنتاج المحتوى",
        "تخصيص ميزانية محتوى لا تقل عن 30-40% من ميزانية المشروع الإجمالية للسنة الأولى. المحتوى هو السبب "
        "الأساسي لعودة اللاعبين، والإهمال فيه يلغي أي جودة في التنفيذ التقني. كما نوصي ببناء أداة داخلية لتوليد "
        "الألغاز آلياً من القاعدة المعجمية، تختصر وقت المحرر من 30 دقيقة لكل مرحلة إلى 5-10 دقائق."
    )


def add_retention_mechanisms(doc):
    """آليات الاحتفاظ باللاعب"""
    add_heading_styled(doc, "9. آليات الاحتفاظ باللاعب", level=1)

    add_body_paragraph(doc,
        "الاحتفاظ باللاعب (Retention) هو التحدي الأكبر بعد الإطلاق. كثير من التطبيقات تكتسب مستخدمين جدداً "
        "بسهولة عبر الإعلانات، لكنها تخسرهم خلال أيام لأنها لا تقدم أسباباً كافية للعودة يومياً. نعرض هنا خمس "
        "آليات احتفاظ يجب دمجها في النسخة الأولى أو الثانية."
    )

    add_heading_styled(doc, "9.1 التحدي اليومي", level=2)

    add_body_paragraph(doc,
        "سؤال أو لغز يومي يظهر لجميع اللاعبين في وقت محدد (مثلاً 8 مساءً بتوقيت البلد المستهدف). يقدم مكافأة "
        "مضاعفة للمكملين في الوقت المحدد، ومكافأة أساسية لمن يحله لاحقاً. هذا يعطي اللاعب سبباً للعودة يومياً "
        "في وقت محدد، ما يرفع معدل الاحتفاظ اليومي (D1, D7, D30)."
    )

    add_heading_styled(doc, "9.2 المكافأة اليومية المتزايدة", level=2)

    add_body_paragraph(doc,
        "نظام مكافآت متزايدة تُمنح للاعب عند الدخول اليومي: اليوم الأول عملتان، الثاني 3، الثالث 5، الرابع 7، "
        "الخامس 10، السادس 15، السابع 25 (مع عنصر مفاجئ). إذا فات اللاعب يوم، يعود العداد من البداية. هذا النظام "
        "شائع في الألعاب الناجحة ويحفز اللاعب على عدم الانقطاع."
    )

    add_heading_styled(doc, "9.3 الإشعارات الذكية", level=2)

    add_body_paragraph(doc,
        "إشعارات دفع مدروسة تجذب اللاعب للعودة دون إزعاجه. يجب أن تكون مخصصة بناءً على سلوك اللاعب: تذكير "
        "بعد 24 ساعة من آخر لعب، إشعار بالتحدي اليومي عند وقته، إشعار بمكافأة يومية متاحة، إشعار بمراحل جديدة "
        "أضيفت. تجنب الإفراط في الإشعارات (أكثر من 2-3 يومياً) لأنها تؤدي إلى تعطيلها أو حذف التطبيق."
    )

    add_heading_styled(doc, "9.4 الأحداث الموسمية", level=2)

    add_body_paragraph(doc,
        "فصول مؤقتة لمناسبات معينة (رمضان، الأعياد، المواسم الدراسية)، مع خلفيات وموضوعات خاصة ومكافآت مميزة. "
        "تخلق هذه الأحداث إحساساً بالاستعجال والندرة، وتمنح اللاعب سبباً للعودة في فترات محددة من السنة. يجب أن "
        "يتم جدولتها مسبقاً في خطة محتوى سنوية."
    )

    add_heading_styled(doc, "9.5 نظام التقدم والإنجازات", level=2)

    add_body_paragraph(doc,
        "نظام إنجازات وألقاب يمنح اللاعب إحساساً بالتقدم طويل الأمد: إكمال 50 مرحلة، 100 مرحلة، اكتشاف 500 كلمة "
        "إضافية، حل 7 تحديات يومية متتالية، إلخ. هذه الإنجازات تظهر في ملف اللاعب ويمكن مشاركتها على وسائل التواصل، "
        "ما يخلق حافزاً للعودة وإكمال التحديات."
    )

    add_recommendation_box(doc,
        "توصية الاحتفاظ",
        "تضمين آليات الاحتفاظ الأولى (التحدي اليومي والمكافأة المتزايدة والإشعارات) في النسخة الأولى MVP، لأن "
        "تكلفة إضافتها منخفضة وأثرها كبير. تأجيل الأحداث الموسمية والإنجازات المعقدة للنسخة الثانية بعد التحقق من "
        "تفاعل اللاعبين مع الأساسيات. راقب معدلات الاحتفاظ (D1, D7, D30) أسبوعياً وعدّل المعايير بناءً عليها."
    )


def add_aso_strategy(doc):
    """خطة ASO"""
    add_heading_styled(doc, "10. خطة تحسين ظهور التطبيق ASO", level=1)

    add_body_paragraph(doc,
        "تحسين ظهور التطبيق في المتاجر (App Store Optimization) ضروري لجذب تنزيلات عضوية دون الاعتماد كلياً "
        "على الإعلانات المدفوعة. التطبيقات الجيدة قد تموت لأنها لا تُكتشف، بينما تطبيقات متواضعة تنجح بسبب "
        "استراتيجية ASO محكمة. نعرض هنا عناصر ASO الأساسية التي يجب تنفيذها قبل الإطلاق."
    )

    add_heading_styled(doc, "10.1 الكلمات المفتاحية", level=2)

    add_body_paragraph(doc,
        "البحث عن الكلمات المفتاحية الأكثر بحثاً في السوق العربي ضمن فئة الألعاب الفكرية: «كلمات متقاطعة»، "
        "«ألغاز»، «وصلة»، «كلمات»، «لعبة ذكاء»، «ألغاز عربية». استخدام أدوات مثل App Annie أو Sensor Tower "
        "لتحديد الكلمات الأكثر بحثاً بأقل منافسة. تضمين الكلمات المفتاحية في العنوان (بحد 30 حرفاً) والوصف "
        "القصير (بحد 80 حرفاً) والوصف الكامل (بحد 4000 حرف)."
    )

    add_heading_styled(doc, "10.2 العنوان والوصف", level=2)

    add_body_paragraph(doc,
        "العنوان يجب أن يكون جذاباً ويتضمن الكلمة المفتاحية الرئيسية: «كلمات: ألغاز متقاطعة عربية». الوصف "
        "القصير يلخص الفكرة في جملة واحدة جذابة. الوصف الكامل يشرح الميزات بشكل منظمة مع استخدام الكلمات "
        "المفتاحية بشكل طبيعي (لا حشو متكرر). يجب تحديث الوصف كلما أضيفت ميزات جديدة أو في المواسم."
    )

    add_heading_styled(doc, "10.3 الأيقونات ولقطات الشاشة", level=2)

    add_body_paragraph(doc,
        "الأيقونة يجب أن تكون بسيطة، ملونة، وقابلة للتمييز في أحجام صغيرة. تجنب التفاصيل الدقيقة التي تختفي "
        "في الحجم الصغير. لقطات الشاشة (5-8 لقطات) يجب أن تروي قصة تدفق اللعب: الأولى تظهر الواجهة الرئيسية، "
        "الثانية شاشة اللعب، الثالثة التحدي اليومي، الرابعة المكافآت، الخامسة الفصول المتنوعة. كل لقطة مع نص "
        "عربي قصير يشرح الميزة."
    )

    add_heading_styled(doc, "10.4 التقييمات والمراجعات", level=2)

    add_body_paragraph(doc,
        "التقييمات العالية (4.5+ نجوم) ترفع ترتيب التطبيق في نتائج البحث. يجب طلب التقييم بعد تجربة إيجابية "
        "(بعد إكمال 3-5 مراحل مثلاً) بشكل غير مزعج. الرد على المراجعات السلبية بسرعة واحترافية، وإصلاح المشاكل "
        "التي يذكرها المستخدمون. التقييمات والمراجعات المستمرة تدل على تطبيق حيّ ونشط."
    )


def add_accessibility(doc):
    """إمكانية الوصول"""
    add_heading_styled(doc, "11. إمكانية الوصول", level=1)

    add_body_paragraph(doc,
        "إمكانية الوصول (Accessibility) ليست ترفاً أو إضافة اختيارية، بل متطلب أساسي لتوسيع قاعدة المستخدمين "
        "والامتثال لسياسات المتاجر التي تتطلب دعم المستخدمين ذوي الاحتياجات الخاصة. تجاهل هذا الجانب يخسر "
        "التطبيق شريحة قد تصل إلى 15-20% من المستخدمين المحتملين، وقد يعرضه لمشاكل قانونية في بعض الأسواق."
    )

    add_heading_styled(doc, "11.1 دعم قارئ الشاشة", level=2)

    add_body_paragraph(doc,
        "يجب أن تدعم جميع عناصر الواجهة قارئ الشاشة (TalkBack على Android، VoiceOver على iOS). كل عنصر تفاعلي "
        "يجب أن يحمل وصفاً نصياً يشرح وظيفته: «زر الخلط - يخلط ترتيب الحروف»، «زر التلميح - يكشف حرفاً مقابل "
        "50 عملة». الحروف في دائرة السحب يجب أن تنطق عند لمسها، والشبكة يجب أن تعلن عن خاناتها وأي كلمات مكتملة فيها."
    )

    add_heading_styled(doc, "11.2 تباين الألوان وحجم الخط", level=2)

    add_body_paragraph(doc,
        "ضمان تباين الألوان بنسبة لا تقل عن 4.5:1 للنص العادي و3:1 للنص الكبير، وفق إرشادات WCAG 2.1 AA. "
        "توفير خيار في الإعدادات لتكبير حجم الخط بنسبة 120% و150%، مع الحفاظ على تناسق الواجهة. تجنب الاعتماد "
        "على اللون فقط لنقل المعلومات (مثلاً، استخدام أيقونة أو نص مع اللون للإشارة للنجاح أو الفشل)."
    )

    add_heading_styled(doc, "11.3 خيارات إضافية", level=2)

    add_bullet_point(doc, "وضع عالي التباين (High Contrast) للاعبين ضعاف البصر.")
    add_bullet_point(doc, "خيارات تقليل الحركة (Reduce Motion) للاعبين حساسين للأنيميشن السريع.")
    add_bullet_point(doc, "إيقاف الأصوات الاختيارية مع اهتزاز بديل للتغذية الراجعة.")
    add_bullet_point(doc, "دعم التحكم الصوتي المستقبلي (اختياري، للنسخ المتقدمة).")
    add_bullet_point(doc, "اختبار الوصول مع مستخدمين حقيقيين من ذوي الاحتياجات الخاصة قبل الإطلاق.")


def add_localization(doc):
    """التوطين المستقبلي - مؤجل"""
    add_heading_styled(doc, "12. التوطين والاستعداد المستقبلي", level=1)

    add_body_paragraph(doc,
        "قرر صاحب المشروع التركيز على اللغة العربية فقط في المرحلة الأولى دون التوسع للغات أخرى. هذا قرار "
        "مفهوم في هذه المرحلة، لأن السوق العربي وحده يضم أكثر من 400 مليون ناطق بالعربية، وهو سوق كبير بما يكفي "
        "للاختبار والنمو. ومع ذلك، نوصي باتخاذ تدابير بسيطة في البنية البرمجية تسمح بالتوسع المستقبلي دون إعادة "
        "كتابة جوهرية، لأن التكلفة الإضافية ضئيلة والفائدة المستقبلية كبيرة."
    )

    add_heading_styled(doc, "12.1 التدابير البسيطة الموصى بها", level=2)

    add_body_paragraph(doc,
        "التدابير التالية لا ترفع تكلفة الإنتاج بشكل ملحوظ، لكنها تتيح التوسع السريع للغات أخرى عند الحاجة:"
    )

    add_bullet_point(doc,
        "فصل النصوص البرمجية (عناوين الأزرار، القوائم، الرسائل) في ملف موارد (resources.ar.json) قابل للتوسعة لاحقاً."
    )
    add_bullet_point(doc,
        "تخزين نصوص الواجهة في قاعدة البيانات بحقل language key، ما يسمح بإضافة لغات جديدة دون تعديل الكود."
    )
    add_bullet_point(doc,
        "بنية قاعدة بيانات الألغاز تسمح بإضافة حقل language للمراحل لاحقاً، مع إمكانية مشاركة البنية المنطقية."
    )
    add_bullet_point(doc,
        "دعم RTL بشكل كامل منذ البداية (وهو مطلوب أساساً للعربية)، مع إمكانية التبديل لـ LTR عند الحاجة."
    )
    add_bullet_point(doc,
        "اختيار مكتبات UI تدعم تعدد اللغات بشكل افتراضي (Flutter intl، Next.js i18n)."
    )

    add_heading_styled(doc, "12.2 ما لا يجب القيام به الآن", level=2)

    add_body_paragraph(doc,
        "تجنب في هذه المرحلة: استثمار وقت كبير في بنية i18n معقدة، ترجمة المحتوى الأصلي لغات أخرى، بناء فريق "
        "تدقيق لغوي متعدد اللغات، إعداد بوابات دفع لأسواق غير عربية. هذه التفاصيل تُترك لمرحلة لاحقة عند "
        "اتخاذ قرار التوسع، بناءً على أداء التطبيق في السوق العربي."
    )

    add_heading_styled(doc, "12.3 متى نعيد التفكير في التوسع؟", level=2)

    add_comparison_table(doc,
        ["المؤشر", "متى نعيد التفكير", "الإجراء المقترح"],
        [
            ["المستخدمون النشطون شهرياً",
             "تجاوز 100,000 مستخدم",
             "دراسة أسواق جديدة محتملة"],
            ["نسبة الاحتفاظ الشهري D30",
             "تجاوز 15% بشكل ثابت",
             "قاعدة مستخدمين مخلصة تستحق التوسع"],
            ["طلب المستخدمين ترجمات",
             "طلبات متكررة من مستخدمين غير عرب",
             "إشارة قوية للطلب الموجود"],
            ["الأداء المالي",
             "تحقيق التعادل المالي",
             "تتوفر ميزانية للتوسع"],
        ]
    )

    add_recommendation_box(doc,
        "توصية التوطين",
        "اعتمد قرار «عربي فقط حالياً» مع تطبيق التدابير البسيطة المذكورة (فصل النصوص، حقل language key). "
        "هذا يوازن بين تركيز الجهد على السوق الأساسي والحفاظ على مرونة التوسع المستقبلي. لا تستثمر أكثر من "
        "5% من وقت التطوير في البنية i18n الآن، ولو أن التدابير المذكورة لا تكلف أكثر من ذلك."
    )


def add_technology(doc):
    """التقنية المقترحة والبنية"""
    add_heading_styled(doc, "12. التقنية المقترحة والبنية", level=1)

    add_body_paragraph(doc,
        "اختيار التقنيات قرار مؤثر على تكلفة التطوير والأداء وقابلية التوسع. نعرض هنا الخيارات الموصى بها "
        "مع تبرير موجز لكل اختيار، مع البدائل المتاحة. البنية تتمحور حول ثلاث واجهات (تطبيق هاتف، موقع ويب، "
        "لوحة إدارة) متصلة بخدمة خلفية واحدة."
    )

    add_heading_styled(doc, "12.1 المنصة والتقنيات", level=2)

    add_comparison_table(doc,
        ["المكوّن", "الخيار الموصى به", "البدائل", "سبب الاختيار"],
        [
            ["تطبيق الهاتف",
             "Flutter (Dart)",
             "React Native، Native (Kotlin/Swift)",
             "أداء عالٍ، UI مشترك بين Android/iOS، دعم RTL ممتاز"],
            ["الموقع ولوحة الإدارة",
             "Next.js + React + TypeScript",
             "Nuxt.js، SvelteKit",
             "نظام بيئي قوي، SEO ممتاز، مكونات جاهزة"],
            ["قاعدة البيانات",
             "PostgreSQL",
             "MySQL، MongoDB",
             "قوة استعلامات، أداء عالٍ، امتثال ACID"],
            ["الخدمة الخلفية",
             "Node.js (NestJS) أو Python (FastAPI)",
             "Go، Java Spring",
             "سرعة تطوير، مكتبات غنية، توظيف سهل"],
            ["التخزين السحابي",
             "AWS S3 أو Cloudflare R2",
             "Google Cloud Storage، Azure Blob",
             "تكلفة منخفضة، CDN مدمج"],
            ["المصادقة",
             "JWT + OAuth2 (Google/Apple)",
             "Firebase Auth، Auth0",
             "تحكم كامل، تجنب الاعتماد على طرف خارجي"],
            ["الإشعارات",
             "Firebase Cloud Messaging (FCM)",
             "OneSignal، Apple APNs مباشرة",
             "مجاني، شائع، سهل التكامل"],
        ]
    )

    add_heading_styled(doc, "12.2 البنية الأمنية", level=2)

    add_body_paragraph(doc,
        "الخادم هو من يمنح العملات ويخصم تكلفة التلميح ويتحقق من إكمال المراحل؛ لا يُعتمد على رقم مرسل من "
        "تطبيق اللاعب وحده حتى لا يسهل التلاعب بالرصيد أو التقدم. تُفصل صلاحيات اللاعب عن المحرر والمدير، "
        "وإذا أتيح اتصال مباشر بين التطبيق وقاعدة البيانات، يجب فرض سياسات وصول على مستوى الصفوف (RLS) واختبارها. "
        "يجب تشفير كلمات المرور باستخدام bcrypt أو argon2، واستخدام HTTPS إجبارياً لكل الاتصالات."
    )

    add_heading_styled(doc, "12.3 البيئات والنشر", level=2)

    add_body_paragraph(doc,
        "بيئة اختبار (Staging) وبيئة إنتاج (Production) منفصلتان تماماً. نسخ احتياطي دوري لقاعدة البيانات "
        "(يومياً على الأقل، مع نسخ أسبوعية محفوظة لمدة 30 يوماً). مراقبة للأخطاء عبر Sentry أو similar. سجل "
        "لتغييرات المحتوى مع إمكانية التراجع. لا تحتاج اللعبة في بدايتها إلى بنية ألعاب لحظية أو خوادم متعددة "
        "لاعبين؛ فالمراحل الفردية ونتائجها يمكن إدارتها بخدمة ويب اعتيادية، ما يقلل التعقيد وتكلفة التشغيل."
    )


def add_privacy_compliance(doc):
    """الخصوصية والامتثال"""
    add_heading_styled(doc, "13. الخصوصية والامتثال للنشر", level=1)

    add_body_paragraph(doc,
        "من الأفضل أن تعمل اللعبة الأساسية من دون تسجيل دخول، وألا تجمع إلا البيانات اللازمة لحفظ التقدم "
        "وتحسين المنتج. إذا أُنشئت حسابات، فيجب التخطيط منذ البداية لسياسة خصوصية مفهومة وخيار لحذف الحساب "
        "والبيانات. تتطلب سياسات Google Play الإفصاح عن ممارسات جمع البيانات واستخدامها ومشاركتها، وتوفير "
        "سياسة خصوصية وخيار لحذف الحساب والبيانات. كما تنص إرشادات Apple على سياسة خصوصية يسهل الوصول إليها، "
        "وتقليل البيانات المجمعة، وإتاحة حذف الحساب داخل التطبيق عندما يسمح التطبيق بإنشاء حسابات."
    )

    add_body_paragraph(doc,
        "قبل النشر، ينبغي تحديد البلدان المستهدفة، والفئة العمرية، ونوع الإعلانات أو المشتريات إن وجدت؛ إذ تختلف "
        "الالتزامات القانونية وسياسات المتاجر بحسب هذه الاختيارات. إذا كان التطبيق موجهاً للأطفال (تحت 13 سنة)، "
        "تنطبق متطلبات إضافية صارمة: قيود على الإعلانات المخصصة، حظر جمع بيانات شخصية دون موافقة ولي الأمر، "
        "والتزام بـ COPPA (أمريكا) أو GDPR-K (أوروبا). لا تُعتبر هذه الدراسة بديلاً عن مراجعة قانونية محلية عند "
        "تحديد سوق الإطلاق."
    )


def add_implementation_phases(doc):
    """مراحل التنفيذ والجدول الزمني - السيناريو الطموح"""
    add_heading_styled(doc, "14. مراحل التنفيذ والجدول الزمني", level=1)

    add_body_paragraph(doc,
        "الجدول الزمني التالي مبني على السيناريو الطموح المعتمد، مع فريق من 6-8 أشخاص يعمل بالتوازي: "
        "مدير منتج/تصميم، مطور واجهات Flutter، مطور ويب Next.js، مطور خلفية، DevOps، محرر محتوى، واختبار. "
        "المدة الإجمالية المقدرة 18-22 أسبوعاً، مع نشر نسخة تجريبية (Beta) بعد الأسبوع 14-16."
    )

    add_comparison_table(doc,
        ["المرحلة", "المدة", "المخرجات الرئيسية"],
        [
            ["1. تثبيت المتطلبات وتصميم تدفق اللعب",
             "1-2 أسبوع",
             "تحديد القواعد اللغوية المزدوجة (فصحى وعامية)، نموذج الربح المعتمد، سلوك العملات والتلميحات، مقاسات الشبكة، معايير الوصول"],
            ["2. تصميم الهوية البصرية والنماذج",
             "2-3 أسابيع",
             "هوية بصرية كاملة لـ«ثقافتنا» (شعار، ألوان، خطوط)، نماذج قابلة للنقر لشاشة اللعب والموقع ولوحة الإدارة"],
            ["3. تطوير محرك اللعب على Flutter",
             "4-6 أسابيع",
             "المراحل، الشبكة، حفظ التقدم، الحساب الاختياري، العملات، التلميحات، التحقق من الحل، التحدي اليومي، المكافأة المتزايدة"],
            ["4. تطوير الموقع ولوحة الإدارة (Next.js)",
             "بالتوازي 4-6 أسابيع",
             "موقع ويب للعب كامل، لوحة إدارة متكاملة (محرر، فحص، معاينة، أدوار، تقارير)"],
            ["5. تطوير الخدمات الخلفية وقاعدة البيانات",
             "بالتوازي 4-6 أسابيع",
             "API متكامل، PostgreSQL، المصادقة، الإعلانات (AdMob)، الشراء داخل التطبيق (IAP)، الإشعارات (FCM)"],
            ["6. إنتاج المحتوى الأولي (300+ مرحلة)",
             "بالتوازي 6-8 أسابيع",
             "إدخال 300+ مرحلة، 5-6 فصول، أسئلة يومية وتحديات أسبوعية للشهر الأول"],
            ["7. آليات الاحتفاظ والتكامل النهائي",
             "2-3 أسابيع",
             "تكامل الإشعارات، الإنجازات، تحسين الأداء، اختبارات الوصول"],
            ["8. ASO والاختبار التجريبي والإطلاق",
             "3-4 أسابيع",
             "تحسين المتاجر، لقطات شاشة، Beta تجريبية، اختبار أجهزة متنوعة، إصلاح أخطاء، النشر النهائي"],
        ]
    )

    add_body_paragraph(doc,
        "كتقدير تخطيطي، يستغرق السيناريو الطموح **نحو 18-22 أسبوعاً** بفريق متكامل يعمل بالتوازي. التقدير يشمل "
        "تطوير التطبيق والموقع ولوحة الإدارة معاً، لكنه لا يشمل التسويق ما بعد الإطلاق أو إنتاج محتوى مستمر بعد "
        "الشهر الأول من الإطلاق. ننصح بإطلاق نسخة Beta بعد 14-16 أسبوعاً لجمع تعليقات مبكرة وتحسين المنتج قبل "
        "النشر النهائي الرسمي."
    )


def add_success_metrics(doc):
    """مؤشرات النجاح"""
    add_heading_styled(doc, "15. مؤشرات نجاح النسخة التجريبية", level=1)

    add_body_paragraph(doc,
        "ابدأ بمكتبة تجريبية من 300+ مرحلة متدرجة، ثم وسّعها بناءً على سلوك اللاعبين. راقب المؤشرات التالية "
        "بشكل منتظم (يومياً وأسبوعياً) وعدّل المنتج بناءً عليها. يجب أن تساعد هذه المؤشرات على تعديل صعوبة "
        "الألغاز وتجربة اللعب، لا أن تتحول إلى جمع غير ضروري لبيانات شخصية."
    )

    add_heading_styled(doc, "15.1 مؤشرات المنتج الأساسية", level=2)

    add_comparison_table(doc,
        ["المؤشر", "الهدف الأولي", "المؤشر الحرج"],
        [
            ["نسبة إكمال المرحلة الأولى", "≥ 80%", "أقل من 60% = مشكلة في التجربة الأولى"],
            ["نسبة الانتقال من مرحلة للتالية", "≥ 70%", "أقل من 50% = صعوبة مرتفعة"],
            ["المراحل التي يتوقف عندها اللاعبون", "أقل من 10% انسحاب", "أكثر من 30% = إعادة تصميم"],
            ["عدد التلميحات لكل مرحلة", "1-3 متوسط", "أكثر من 5 = صعوبة مرتفعة"],
            ["نسبة اكتشاف الكلمات الإضافية", "≥ 30% من اللاعبين", "أقل من 10% = ضعف التفاعل"],
            ["معدل عودة اللاعبين خلال أسبوع", "≥ 40%", "أقل من 25% = مشكلة احتفاظ"],
        ]
    )

    add_heading_styled(doc, "15.2 مؤشرات الربح والاحتفاظ", level=2)

    add_bullet_point(doc, "متوسط الإيراد لكل مستخدم نشط شهرياً (ARPU) - مؤشر الربحية الأساسي.")
    add_bullet_point(doc, "نسبة اللاعبين الذين يشترون داخل التطبيق (Conversion Rate) - هدف 2-5%.")
    add_bullet_point(doc, "معدل الاحتفاظ اليومي D1 (اليوم التالي للتثبيت) - هدف ≥ 40%.")
    add_bullet_point(doc, "معدل الاحتفاظ الأسبوعي D7 - هدف ≥ 25%.")
    add_bullet_point(doc, "معدل الاحتفاظ الشهري D30 - هدف ≥ 15%.")
    add_bullet_point(doc, "نسبة التفاعل مع التحدي اليومي - هدف ≥ 30% من اللاعبين النشطين.")
    add_bullet_point(doc, "نسبة فتح الإشعارات والنقر عليها - مؤشر جودة الإشعارات.")


def add_scenarios_recommendations(doc):
    """السيناريو المعتمد: الطموح"""
    add_heading_styled(doc, "16. السيناريو المعتمد: الطموح", level=1)

    add_body_paragraph(doc,
        "بناءً على القرارات المعتمدة من صاحب المشروع (ميزانية مفتوحة حتى إتمام الجودة العالية، لعب ويب كامل "
        "من اليوم الأول، ميزات احتبط كاملة في النسخة الأولى، اسم «ثقافتنا»)، تم اعتماد السيناريو الطموح. "
        "هذا السيناريو يبني منتجاً شاملاً ذا جودة عالية منذ البداية، ويضع أساساً قوياً للتوسع المستقبلي."
    )

    add_heading_styled(doc, "16.1 تفاصيل السيناريو المعتمد", level=2)

    add_comparison_table(doc,
        ["البعد", "التفاصيل المعتمدة"],
        [
            ["اسم التطبيق", "«ثقافتنا» — هوية عربية ثقافية مميزة"],
            ["نطاق المنتج", "تطبيق هاتف (Android+iOS) + لعب ويب كامل + لوحة إدارة متكاملة"],
            ["عدد المراحل عند الإطلاق", "300+ مرحلة متدرجة على 5-6 فصول"],
            ["اللغة", "العربية (فصحى وعامية) لجميع الفئات العمرية"],
            ["نموذج الربح", "مجاني + إعلانات غير مزعجة + مساعدات مدفوعة"],
            ["آليات الاحتفاظ", "تحدي يومي + مكافأة متزايدة + إشعارات ذكية (الكل في النسخة الأولى)"],
            ["التوطين", "عربي فقط مع بنية i18n بسيطة للتوسع المستقبلي"],
            ["الفريق", "6-8 أشخاص (مطور واجهات، مطور ويب، مطور خلفية، مصمم، محرر محتوى، DevOps، مدير منتج، اختبار)"],
            ["المدة المقدرة", "18-22 أسبوعاً"],
            ["الميزانية", "مفتوحة حتى إتمام الجودة العالية"],
            ["الأسواق", "السوق العربي كاملاً (السعودية، مصر، الإمارات، باقي الدول)"],
            ["المخاطر", "متوسطة، مع توفر ميزانية كافية وتركيز على الجودة"],
        ]
    )

    add_heading_styled(doc, "16.2 لماذا السيناريو الطموح هو الخيار الصحيح؟", level=2)

    add_body_paragraph(doc,
        "القرارات المعتمدة تبرر اختيار السيناريو الطموح لعدة أسباب: أولاً، الميزانية المفتوحة تتيح بناء جودة عالية "
        "دون compromise. ثانياً، لعب الويب الكامل من اليوم الأول يضاعف قاعدة المستخدمين المحتملين ويتجنب قيود "
        "المتاجر. ثالثاً، إدارة المحتوى الكاملة عبر اللوحة الإدارية هي ميزة تنافسية أساسية يجب أن تُبنى بجودة عالية "
        "من البداية. رابعاً، اسم «ثقافتنا» يبني هوية طويلة الأمد تستحق الاستثمار الجاد."
    )

    add_body_paragraph(doc,
        "المخاطرة الرئيسية في السيناريو الطموح هي طول المدة (18-22 أسبوعاً)، ما قد يسبب فقدان الزخم أو تأخر "
        "العودة على الاستثمار. للتخفيف من هذا، نوصي بنشر نسخة تجريبية (Beta) بعد 14-16 أسبوعاً لجمع تعليقات "
        "حقيقية من مستخدمين مبكرين، ثم إكمال التحسينات في الأسابيع المتبقية. هذا يقلل المخاطر ويضمن أن المنتج "
        "النهائي يلبي توقعات السوق الفعلية."
    )

    add_heading_styled(doc, "16.3 مقارنة مع السيناريوهات الأخرى", level=2)

    add_comparison_table(doc,
        ["البعد", "محافظ (مرفوض)", "متوسط (مرفوض)", "طموح (معتمد)"],
        [
            ["نطاق الويب", "تعريفي فقط", "تعريفي + لعب مؤجل", "لعب كامل من اليوم الأول ✓"],
            ["عدد المراحل", "150 مرحلة", "200 مرحلة", "300+ مرحلة ✓"],
            ["آليات الاحتفاظ", "مؤجلة", "مؤجلة", "كاملة في النسخة الأولى ✓"],
            ["لوحة الإدارة", "بسيطة", "متكاملة", "متكاملة عالية الجودة ✓"],
            ["المدة", "10-12 أسبوعاً", "12-16 أسبوعاً", "18-22 أسبوعاً ✓"],
            ["الفريق", "3 أشخاص", "4-5 أشخاص", "6-8 أشخاص ✓"],
            ["المخاطر", "منخفضة لكن إهدار فرصة", "متوسطة", "متوسطة مع عائد أعلى ✓"],
        ]
    )

    add_recommendation_box(doc,
        "القرار النهائي معتمد",
        "السيناريو الطموح معتمد بالكامل. الخطوة التالية هي إعداد عرض سعر تفصيلي مبني على المعطيات النهائية: "
        "فريق من 6-8 أشخاص، مدة 18-22 أسبوعاً، 300+ مرحلة عند الإطلاق، تطبيق الهاتف + الموقع + لوحة الإدارة. "
        "يجب تخصيص 30-40% من ميزانية السنة الأولى لإنتاج المحتوى المستمر بعد الإطلاق."
    )


def add_next_decisions(doc):
    """القرارات النهائية المعتمدة"""
    add_heading_styled(doc, "17. القرارات النهائية المعتمدة", level=1)

    add_body_paragraph(doc,
        "تم اتخاذ جميع القرارات الاستراتيجية من قبل صاحب المشروع. الجدول التالي يلخص القرارات المعتمدة "
        "التي ستُبنى عليها دراسة الجدول التفصيلية وعرض السعر النهائي:"
    )

    add_comparison_table(doc,
        ["#", "القرار", "الخيار المعتمد", "الأثر على المشروع"],
        [
            ["1", "نطاق اللعب على الويب",
             "لعب كامل على الموقع من اليوم الأول",
             "إضافة فريق تطوير ويب، توسع قاعدة المستخدمين"],
            ["2", "الأسواق والفئات المستهدفة",
             "عربية (فصحى وعامية) لجميع الفئات العمرية",
             "محتوى متنوع، إعداد قواعد تطبيع مزدوجة"],
            ["3", "نموذج الربح",
             "مجاني + إعلانات غير مزعجة + مساعدات مدفوعة",
             "تكامل AdMob + متجر IAP، تصميم دقيق للإعلانات"],
            ["4", "إنتاج المحتوى",
             "عبر اللوحة الإدارية بالكامل",
             "بناء محرر متقدم، فريق محتوى داخلي"],
            ["5", "الهوية البصرية",
             "اسم «ثقافتنا»، لا هوية بصرية جاهزة",
             "ميزانية لتصميم هوية بصرية كاملة"],
            ["6", "ميزات الاحتفاظ",
             "تحدي يومي + مكافأة متزايدة في النسخة الأولى",
             "زيادة مدة التطوير 2-3 أسابيع، رفع التكلفة"],
            ["7", "التوطين",
             "عربي فقط حالياً مع بنية i18n بسيطة",
             "توفير وقت التطوير، مرونة مستقبلية"],
            ["8", "الميزانية والمدة",
             "مفتوحة حتى إتمام الجودة العالية",
             "التركيز على الجودة، السماح بالتكرار والتحسين"],
        ]
    )

    add_heading_styled(doc, "17.1 المهام التالية قبل بدء التنفيذ", level=2)

    add_body_paragraph(doc,
        "رغم اتخاذ القرارات الرئيسية، هناك مهام تحضيرية يجب إنجازها قبل بدء التنفيذ الفعلي:"
    )

    add_bullet_point(doc,
        "تصميم الهوية البصرية الكاملة لتطبيق «ثقافتنا»: شعار، ألوان، خطوط، أيقونات، أسلوب بصري موحد (2-3 أسابيع بالتوازي مع بدء التطوير)."
    )
    add_bullet_point(doc,
        "إعداد قاعدة معجمية أولية تضم 5000-10000 كلمة عربية معتمدة، مصنفة حسب المستوى والمجال (الفصحى والعامية)."
    )
    add_bullet_point(doc,
        "اختيار فريق التطوير (داخلي أو متعاقد) وتحديد الأدوار والمسؤوليات بدقة."
    )
    add_bullet_point(doc,
        "تجهيز بيئة الاستضافة (سحابة، قاعدة بيانات، نطاق، شهادات SSL) قبل بدء التطوير الفعلي."
    )
    add_bullet_point(doc,
        "تسجيل حسابات المطورين في Google Play وApple App Store (تستغرق الموافقة أياماً)."
    )
    add_bullet_point(doc,
        "إعداد سياسة الخصوصية وشروط الاستخدام بصياغة قانونية واضحة، خاصة بخصوص جمع البيانات والإعلانات."
    )

    add_recommendation_box(doc,
        "جاهزية للانتقال للتنفيذ",
        "جميع القرارات الاستراتيجية معتمدة. المشروع جاهز للانتقال إلى مرحلة عرض السعر التفصيلي والبدء الفعلي "
        "بالتطوير. التوصية المهمة: لا تبقَ في مرحلة التخطيط طويلاً، ابدأ التنفيذ مع تصميم الهوية البصرية بالتوازي "
        "مع تحضير البيئة التقنية، ما يوفر 2-3 أسابيع من الزمن الكلي."
    )


def add_references(doc):
    """المراجع المحدّثة"""
    add_heading_styled(doc, "18. المراجع المحدّثة", level=1)

    add_body_paragraph(doc,
        "تتضمن القائمة التالية المراجع الأصلية من الدراسة الأولية، مضافاً إليها مصادر جديدة للأقسام المضافة "
        "(نموذج الربح، خطة المحتوى، آليات الاحتفاظ، ASO، إمكانية الوصول، التوطين):"
    )

    references = [
        ("[1] Flutter Documentation",
         "Flutter: Supported deployment platforms",
         "https://docs.flutter.dev/reference/supported-platforms"),
        ("[2] Supabase",
         "Supabase: Row Level Security",
         "https://supabase.com/docs/guides/database/postgres/row-level-security"),
        ("[3] Google Play",
         "Google Play: User Data policy",
         "https://support.google.com/googleplay/android-developer/answer/10144311"),
        ("[4] Apple Developer",
         "Apple: App Review Guidelines",
         "https://developer.apple.com/app-store/review/guidelines/"),
        ("[5] WCAG 2.1",
         "Web Content Accessibility Guidelines 2.1 - W3C",
         "https://www.w3.org/TR/WCAG21/"),
        ("[6] Google AdMob",
         "AdMob: Get Started with Mobile Ads",
         "https://developers.google.com/admob"),
        ("[7] Apple App Store",
         "App Store Connect: In-App Purchase",
         "https://developer.apple.com/app-store/in-app-purchase/"),
        ("[8] Firebase",
         "Firebase Cloud Messaging (FCM)",
         "https://firebase.google.com/docs/cloud-messaging"),
        ("[9] Apple App Store",
         "App Store Search Ads Best Practices",
         "https://developer.apple.com/app-store/search-ads/"),
        ("[10] Android Developers",
         "Android Accessibility: TalkBack",
         "https://developer.android.com/guide/topics/accessibility"),
        ("[11] Apple Developer",
         "iOS Accessibility: VoiceOver",
         "https://developer.apple.com/accessibility/ios/"),
        ("[12] i18next",
         "Internationalization Framework Documentation",
         "https://www.i18next.com/"),
        ("[13] PostgreSQL",
         "PostgreSQL: Row Security Policies",
         "https://www.postgresql.org/docs/current/ddl-rowsecurity.html"),
        ("[14] Sentry",
         "Application Monitoring and Error Tracking",
         "https://docs.sentry.io/"),
    ]

    # عرض المراجع كقائمة منظمة
    for ref in references:
        p = doc.add_paragraph()
        set_paragraph_rtl(p)
        p.paragraph_format.line_spacing = 1.4
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.right_indent = Cm(1)

        # رقم المرجع والعنوان
        run_num = p.add_run(f"{ref[0]}  ")
        set_run_rtl(run_num)
        run_num.font.name = 'Cairo'
        run_num.font.size = Pt(11)
        run_num.font.color.rgb = COLOR_ACCENT
        run_num.bold = True

        run_title = p.add_run(f"{ref[1]} — ")
        set_run_rtl(run_title)
        run_title.font.name = 'Cairo'
        run_title.font.size = Pt(11)
        run_title.font.color.rgb = COLOR_PRIMARY
        run_title.bold = True

        run_url = p.add_run(ref[2])
        run_url.font.name = 'Cairo'
        run_url.font.size = Pt(10)
        run_url.font.color.rgb = COLOR_SECONDARY
        run_url.underline = True


# ============================================================
# الدالة الرئيسية
# ============================================================

def main():
    print("بدء توليد الوثيقة...")

    # إنشاء الوثيقة
    doc = create_document()

    # 1. صفحة الغلاف
    print("- إضافة صفحة الغلاف...")
    add_cover_page(doc)

    # 2. جدول المحتويات
    print("- إضافة جدول المحتويات...")
    add_toc_page(doc)

    # 3. الملخص التنفيذي
    print("- إضافة الملخص التنفيذي...")
    add_executive_summary(doc)

    # 4. فكرة المنتج والنطاق
    print("- إضافة فكرة المنتج...")
    add_product_scope(doc)

    # 5. التحليل التنافسي
    print("- إضافة التحليل التنافسي...")
    add_competitive_analysis(doc)

    # 6. تجربة اللاعب
    print("- إضافة تجربة اللاعب...")
    add_player_experience(doc)

    # 7. لوحة الإدارة
    print("- إضافة لوحة الإدارة...")
    add_admin_panel(doc)

    # 8. دعم العربية
    print("- إضافة دعم العربية...")
    add_arabic_support(doc)

    # 9. نموذج الربح
    print("- إضافة نموذج الربح...")
    add_monetization(doc)

    # 10. خطة المحتوى
    print("- إضافة خطة المحتوى...")
    add_content_plan(doc)

    # 11. آليات الاحتفاظ
    print("- إضافة آليات الاحتفاظ...")
    add_retention_mechanisms(doc)

    # 12. خطة ASO
    print("- إضافة خطة ASO...")
    add_aso_strategy(doc)

    # 13. إمكانية الوصول
    print("- إضافة إمكانية الوصول...")
    add_accessibility(doc)

    # 14. التوطين المستقبلي
    print("- إضافة التوطين المستقبلي...")
    add_localization(doc)

    # 15. التقنية المقترحة
    print("- إضافة التقنية المقترحة...")
    add_technology(doc)

    # 16. الخصوصية والامتثال
    print("- إضافة الخصوصية...")
    add_privacy_compliance(doc)

    # 17. مراحل التنفيذ
    print("- إضافة مراحل التنفيذ...")
    add_implementation_phases(doc)

    # 18. مؤشرات النجاح
    print("- إضافة مؤشرات النجاح...")
    add_success_metrics(doc)

    # 19. السيناريوهات والتوصيات
    print("- إضافة السيناريوهات...")
    add_scenarios_recommendations(doc)

    # 20. القرارات التالية
    print("- إضافة القرارات التالية...")
    add_next_decisions(doc)

    # 21. المراجع
    print("- إضافة المراجع...")
    add_references(doc)

    # حفظ ملف Word
    output_path = "/home/z/my-project/download/دراسة_محدّثة_ثقافتنا_v3.docx"
    doc.save(output_path)
    print(f"\n✓ تم حفظ ملف Word في: {output_path}")

    # طباعة حجم الملف
    file_size = os.path.getsize(output_path) / 1024
    print(f"  حجم الملف: {file_size:.1f} KB")

    return output_path


if __name__ == "__main__":
    main()
