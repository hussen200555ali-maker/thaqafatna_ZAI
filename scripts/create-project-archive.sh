#!/bin/bash
# إنشاء أرشيف مضغوط كامل لمشروع ثقافتنا
# يستثني الملفات الثقيلة والملفات المؤقتة

set -e

PROJECT_DIR="/home/z/my-project"
OUTPUT_DIR="/home/z/my-project/download"
OUTPUT_NAME="thaqafatna-full-project"
TIMESTAMP=$(date +%Y%m%d-%H%M)
OUTPUT_FILE="${OUTPUT_DIR}/${OUTPUT_NAME}-${TIMESTAMP}.zip"

echo "📦 جاري إنشاء أرشيف المشروع..."
echo "📁 المصدر: ${PROJECT_DIR}"
echo "📤 الوجهة: ${OUTPUT_FILE}"
echo ""

# التأكد من وجود مجلد الإخراج
mkdir -p "${OUTPUT_DIR}"

# حذف الأرشيف القديم إن وُجد
rm -f ${OUTPUT_DIR}/${OUTPUT_NAME}-*.zip 2>/dev/null || true

# إنشاء ملفات الإقصاء
cat > /tmp/zip-exclude.txt << 'EOF'
node_modules/*
.next/*
.git/*
dev.log
server.log
tool-results/*
upload/*
download/thaqafatna-*
download/*.zip
skills/*
tests/*
mini-services/*
db/*
*.log
.DS_Store
EOF

# إنشاء الأرشيف
cd "${PROJECT_DIR}"

zip -r "${OUTPUT_FILE}" . \
  -x@/tmp/zip-exclude.txt \
  -x "*/node_modules/*" \
  -x "*/.next/*" \
  -x "*/.git/*" \
  -x "dev.log" \
  -x "server.log" \
  -x "tool-results/*" \
  -x "upload/*" \
  -x "download/thaqafatna-*" \
  -x "download/*.zip" \
  -x "skills/*" \
  -x "tests/*" \
  -x "mini-services/*" \
  -x "db/*" \
  -x "*.log" \
  -q

echo ""
echo "✅ تم إنشاء الأرشيف بنجاح!"
echo "📊 الحجم: $(du -h "${OUTPUT_FILE}" | cut -f1)"
echo "📁 المسار: ${OUTPUT_FILE}"
echo ""
echo "📋 المحتويات (أهم المجلدات):"
unzip -l "${OUTPUT_FILE}" 2>/dev/null | grep -E "^\s+[0-9]" | head -5
echo "..."
unzip -l "${OUTPUT_FILE}" 2>/dev/null | tail -1
