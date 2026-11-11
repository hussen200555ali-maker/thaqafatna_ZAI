#!/usr/bin/env python3
"""
إعادة بناء APK باستبدال ملفات PWA المُصلَحة داخل APK القديم.

الخطوات:
1. استخراج APK القديم إلى مجلد مؤقت
2. استبدال assets/public/index.html و sw.js بالنسخ المُصلَحة
3. إعادة ضغط الملفات إلى APK جديد
4. التوقيع باستخدام debug keystore
"""
import os
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

OLD_APK = Path("/tmp/old-apk.apk")
NEW_APK = Path("/home/z/my-project/download/Thaqafatna-v1.4.1.apk")
EXTRACT_DIR = Path("/tmp/apk-rebuild")
FIXED_PWA = Path("/home/z/my-project/mobile-app/pwa")

ANDROID_HOME = "/tmp/android-sdk"
APKSIGNER = f"{ANDROID_HOME}/build-tools/34.0.0/apksigner"
ZIPALIGN = f"{ANDROID_HOME}/build-tools/34.0.0/zipalign"
DEBUG_KEYSTORE = Path("/home/z/.android/debug.keystore")

# التحقق من وجود الملفات
print("=== التحقق من الملفات ===")
for f in [OLD_APK, FIXED_PWA / "index.html", FIXED_PWA / "sw.js"]:
    print(f"  {f}: {'✓' if f.exists() else '✗'}")
    if not f.exists():
        sys.exit(1)

# 1. تنظيف مجلد الاستخراج
if EXTRACT_DIR.exists():
    shutil.rmtree(EXTRACT_DIR)
EXTRACT_DIR.mkdir(parents=True)
print("\n=== 1. استخراج APK القديم ===")
with zipfile.ZipFile(OLD_APK, 'r') as z:
    z.extractall(EXTRACT_DIR)
print(f"  ✓ تم الاستخراج إلى {EXTRACT_DIR}")

# 2. استبدال ملفات PWA
print("\n=== 2. استبدال ملفات PWA ===")
assets_public = EXTRACT_DIR / "assets" / "public"
for fname in ["index.html", "sw.js", "manifest.json", "icon.svg"]:
    src = FIXED_PWA / fname
    dst = assets_public / fname
    if src.exists():
        shutil.copy2(src, dst)
        print(f"  ✓ {fname}: {src.stat().st_size} bytes → {dst}")
    else:
        print(f"  ! {fname}: غير موجود في المصدر")

# 3. ضغط الملفات إلى APK جديد
print("\n=== 3. إنشاء APK جديد (غير موقّع) ===")
unsigned_apk = Path("/tmp/unsigned.apk")
if unsigned_apk.exists():
    unsigned_apk.unlink()
# أنشئ ملف zip بالترتيب الأبجدي للمساعدة في ضغط alignment لاحقاً
file_list = []
for root, dirs, files in os.walk(EXTRACT_DIR):
    for f in files:
        full_path = Path(root) / f
        rel_path = full_path.relative_to(EXTRACT_DIR)
        file_list.append((str(rel_path).replace('\\', '/'), str(full_path)))
file_list.sort()
# احذف أي ملفات META-INF السابقة للتوقيع (سيُعاد التوقيع)
file_list = [(rel, fp) for rel, fp in file_list if not rel.startswith('META-INF/') or not (rel.endswith('.SF') or rel.endswith('.RSA') or rel.endswith('.DSA') or rel.endswith('.MF'))]
with zipfile.ZipFile(unsigned_apk, 'w', zipfile.ZIP_DEFLATED) as z:
    for rel, fp in file_list:
        z.write(fp, rel)
print(f"  ✓ APK غير موقّع: {unsigned_apk} ({unsigned_apk.stat().st_size} bytes)")

# 4. محاذاة (zipalign) و توقيع (apksigner)
print("\n=== 4. محاذاة و توقيع APK ===")
aligned_apk = Path("/tmp/aligned.apk")
if aligned_apk.exists():
    aligned_apk.unlink()
align_cmd = [ZIPALIGN, "-f", "-p", "4", str(unsigned_apk), str(aligned_apk)]
print(f"  تشغيل: {' '.join(align_cmd)}")
result = subprocess.run(align_cmd, capture_output=True, text=True)
if result.returncode != 0:
    print(f"  ✗ فشل zipalign: {result.stderr}")
    sys.exit(1)
print(f"  ✓ zipalign: {aligned_apk}")

# تأكد من وجود debug.keystore أو أنشئه
if not DEBUG_KEYSTORE.exists():
    print("  إنشاء debug keystore...")
    DEBUG_KEYSTORE.parent.mkdir(parents=True, exist_ok=True)
    keytool_cmd = [
        "keytool", "-genkeypair",
        "-alias", "androiddebugkey",
        "-keypass", "android",
        "-keystore", str(DEBUG_KEYSTORE),
        "-storepass", "android",
        "-keyalg", "RSA",
        "-keysize", "2048",
        "-validity", "10000",
        "-dname", "CN=Android Debug,O=Android,C=US",
    ]
    result = subprocess.run(keytool_cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"  ✗ فشل إنشاء keystore: {result.stderr}")
        sys.exit(1)

# وقّع الـ APK
if NEW_APK.exists():
    NEW_APK.unlink()
sign_cmd = [
    APKSIGNER, "sign",
    "--ks", str(DEBUG_KEYSTORE),
    "--ks-key-alias", "androiddebugkey",
    "--ks-pass", "pass:android",
    "--key-pass", "pass:android",
    "--out", str(NEW_APK),
    str(aligned_apk),
]
print(f"  تشغيل: apksigner sign ...")
result = subprocess.run(sign_cmd, capture_output=True, text=True)
if result.returncode != 0:
    print(f"  ✗ فشل apksigner: {result.stderr}")
    sys.exit(1)
print(f"  ✓ APK موقّع: {NEW_APK}")

# 5. التحقق من التوقيع
print("\n=== 5. التحقق من التوقيع ===")
verify_cmd = [APKSIGNER, "verify", "--verbose", str(NEW_APK)]
result = subprocess.run(verify_cmd, capture_output=True, text=True)
print(result.stdout[:500] if result.stdout else result.stderr[:500])

# 6. التحقق من أن الـ APK الجديد يحتوي على الملفات المُصلَحة
print("\n=== 6. التحقق من محتوى APK الجديد ===")
with zipfile.ZipFile(NEW_APK, 'r') as z:
    for fname in ["index.html", "sw.js"]:
        with z.open(f"assets/public/{fname}") as f:
            content = f.read().decode('utf-8', errors='replace')
            if fname == "index.html":
                has_fix = "normalizeLevelCells" in content
                print(f"  assets/public/{fname}: {len(content)} bytes — يحتوي على الإصلاح: {'✓' if has_fix else '✗'}")
            elif fname == "sw.js":
                has_version = "v1.4.1-crossword-fix" in content
                print(f"  assets/public/{fname}: {len(content)} bytes — SW version محدّث: {'✓' if has_version else '✗'}")

# 7. تنظيف الملفات المؤقتة
shutil.rmtree(EXTRACT_DIR)
unsigned_apk.unlink(missing_ok=True)
aligned_apk.unlink(missing_ok=True)
print(f"\n[✓] تم بناء APK جديد: {NEW_APK} ({NEW_APK.stat().st_size} bytes)")
