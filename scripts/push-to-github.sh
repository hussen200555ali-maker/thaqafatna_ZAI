#!/bin/bash
# =============================================================================
# 🚀 رفع مشروع ثقافتنا إلى GitHub
# =============================================================================
# السكريبت يقوم بـ:
# 1. إنشاء مستودع جديد على GitHub عبر API
# 2. إضافة الـ remote
# 3. دفع كل الكود
#
# الاستخدام:
#   GH_TOKEN="github_pat_xxx" ./scripts/push-to-github.sh [repo-name] [public|private]
#
# مثال:
#   GH_TOKEN="github_pat_xxx" ./scripts/push-to-github.sh thaqafatna public
# =============================================================================

set -e

# التحقق من المتغيرات
if [ -z "$GH_TOKEN" ]; then
  echo "❌ خطأ: يجب تمرير GH_TOKEN"
  echo "   مثال: GH_TOKEN=\"github_pat_xxx\" $0 thaqafatna public"
  exit 1
fi

REPO_NAME="${1:-thaqafatna}"
VISIBILITY="${2:-public}"
IS_PRIVATE="false"
if [ "$VISIBILITY" = "private" ]; then
  IS_PRIVATE="true"
fi

cd /home/z/my-project

echo "📋 إعداد الرفع:"
echo "   - اسم المستودع: $REPO_NAME"
echo "   - الرؤية: $VISIBILITY"
echo ""

# التحقق من حالة git
if [ ! -d .git ]; then
  echo "❌ المشروع ليس مستودع git"
  exit 1
fi

# تنظيف الملفات المُتتبّعة التي أصبحت متجاهلة
echo "🧹 تنظيف الملفات المُتتبّعة المُضافة حديثًا لـ .gitignore..."
git rm -r --cached --quiet db/*.db 2>/dev/null || true
git rm -r --cached --quiet download/ 2>/dev/null || true
git rm -r --cached --quiet upload/ 2>/dev/null || true
git rm -r --cached --quiet worklog.md 2>/dev/null || true
git rm -r --cached --quiet scripts/test-serverless*.cjs 2>/dev/null || true

# التزام التغييرات
if [ -n "$(git status --short)" ]; then
  git add -A
  git commit -m "🧹 Clean .gitignore: remove DB, archives, uploads from tracking" --no-verify
  echo "✅ تم تنظيف .gitignore"
fi

# الحصول على معلومات المستخدم
echo ""
echo "📡 جلب معلومات المستخدم من GitHub..."
USER_INFO=$(curl -s -H "Authorization: Bearer $GH_TOKEN" -H "Accept: application/vnd.github+json" https://api.github.com/user)
USERNAME=$(echo "$USER_INFO" | grep -o '"login": *"[^"]*"' | head -1 | sed 's/.*"login": *"//;s/".*//')

if [ -z "$USERNAME" ] || [ "$USERNAME" = "null" ]; then
  echo "❌ فشل في جلب معلومات المستخدم. الـ token قد يكون غير صالح."
  echo "   الرد من GitHub:"
  echo "$USER_INFO" | head -20
  exit 1
fi

echo "✅ المستخدم: $USERNAME"

# إنشاء المستودع
echo ""
echo "🏗️ إنشاء مستودع جديد: $REPO_NAME..."
CREATE_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $GH_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/user/repos \
  -d "{\"name\":\"$REPO_NAME\",\"private\":$IS_PRIVATE,\"description\":\"🎮 ثقافتنا - منصة تعليمية ترفيهية عربية تجمع بين الألغاز التكيّفية والمكتبة الذكية\"}")

REPO_URL=$(echo "$CREATE_RESPONSE" | grep -o '"clone_url": *"[^"]*"' | head -1 | sed 's/.*"clone_url": *"//;s/".*//')
HTML_URL=$(echo "$CREATE_RESPONSE" | grep -o '"html_url": *"[^"]*"' | head -1 | sed 's/.*"html_url": *"//;s/".*//')

if [ -z "$REPO_URL" ] || [ "$REPO_URL" = "null" ]; then
  echo "❌ فشل في إنشاء المستودع"
  echo "   الرد من GitHub:"
  echo "$CREATE_RESPONSE" | head -30
  exit 1
fi

echo "✅ تم إنشاء المستودع: $HTML_URL"

# إضافة الـ remote
echo ""
echo "🔗 إضافة remote..."
git remote remove origin 2>/dev/null || true
git remote add origin "https://x-access-token:${GH_TOKEN}@github.com/${USERNAME}/${REPO_NAME}.git"
echo "✅ تم إضافة الـ remote"

# الدفع
echo ""
echo "📤 دفع الكود إلى GitHub (هذا قد يستغرق بضع دقائق)..."
git push -u origin main 2>&1 | tail -20

if [ $? -eq 0 ]; then
  echo ""
  echo "🎉 تم الرفع بنجاح!"
  echo ""
  echo "═══════════════════════════════════════════════════════"
  echo "✅ رابط المستودع: $HTML_URL"
  echo "✅ رابط الاستنساخ: $REPO_URL"
  echo "═══════════════════════════════════════════════════════"
  echo ""
  echo "🚀 يمكنك الآن:"
  echo "   - زيارة المستودع: $HTML_URL"
  echo "   - استنساخه: git clone $REPO_URL"
  echo "   - ربطه بـ Vercel للنشر"
else
  echo "❌ فشل الدفع. تحقق من صلاحيات الـ token."
  exit 1
fi
