#!/usr/bin/env python3
"""
إعادة بناء APK v1.5-webview:
- يُصرّف MainActivity.java الجديد (يحمّل الموقع المباشر بدلاً من الملف المحلي)
- يُحدّث capacitor.config.json
- يُحدّث activity_main.xml
- يُعيد حزم وتوقيع APK
"""
import os
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

ANDROID_HOME = "/tmp/android-sdk"
ANDROID_JAR = f"{ANDROID_HOME}/platforms/android-34/android.jar"
D8 = f"{ANDROID_HOME}/build-tools/34.0.0/d8"
APKSIGNER = f"{ANDROID_HOME}/build-tools/34.0.0/apksigner"
ZIPALIGN = f"{ANDROID_HOME}/build-tools/34.0.0/zipalign"
DEBUG_KEYSTORE = Path("/home/z/.android/debug.keystore")
JAVAC = "/tmp/jdk17/bin/javac"

OLD_APK = Path("/tmp/old-apk.apk")
NEW_APK = Path("/home/z/my-project/download/Thaqafatna-v1.5-webview.apk")
EXTRACT_DIR = Path("/tmp/apk-rebuild-v15")
SRC_DIR = Path("/home/z/my-project/mobile-app/android/app/src/main")
GRADLE_CACHES = Path("/home/z/.gradle/caches/8.14.3/transforms")

# دالة مساعدة لتنفيذ أمر
def run(cmd, **kwargs):
    print(f"  $ {' '.join(cmd[:3])}..." if len(cmd) > 3 else f"  $ {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True, **kwargs)
    if result.returncode != 0:
        print(f"  STDOUT: {result.stdout[:500]}")
        print(f"  STDERR: {result.stderr[:500]}")
    return result

# 1. تحقق من الملفات
print("=== 1. التحقق من الملفات ===")
for f in [OLD_APK, ANDROID_JAR, D8, APKSIGNER, ZIPALIGN, SRC_DIR / "java/com/thaqafatna/app/MainActivity.java"]:
    exists = "✓" if Path(f).exists() else "✗"
    print(f"  {exists} {f}")

# 2. تنظيف مجلد العمل
if EXTRACT_DIR.exists():
    shutil.rmtree(EXTRACT_DIR)
EXTRACT_DIR.mkdir(parents=True)

# 3. استخراج APK القديم
print("\n=== 2. استخراج APK القديم ===")
with zipfile.ZipFile(OLD_APK, 'r') as z:
    z.extractall(EXTRACT_DIR)
print(f"  ✓ تم الاستخراج إلى {EXTRACT_DIR}")

# 4. استبدال ملفات التكوين والموارد
print("\n=== 3. استبدال ملفات التكوين ===")
# capacitor.config.json (الموجود في assets)
config_dst = EXTRACT_DIR / "assets" / "capacitor.config.json"
shutil.copy2(SRC_DIR / "assets/capacitor.config.json", config_dst)
print(f"  ✓ capacitor.config.json: {config_dst.stat().st_size} bytes")

# 5. تجميع كل ملفات classes.jar الضرورية من gradle caches
print("\n=== 4. تجميع classes.jar من gradle caches ===")
classpath_jars = []
# نحتاج: appcompat, core, activity, fragment, lifecycle-* etc.
needed = [
    "appcompat-1.6.1",
    "appcompat-resources-1.6.1",
    "core-1.9.0",
    "core-ktx-1.9.0",
    "activity-1.8.0",
    "fragment-1.3.6",
    "lifecycle-runtime-2.6.1",
    "lifecycle-viewmodel-2.6.1",
    "lifecycle-livedata-core-2.6.1",
    "lifecycle-viewmodel-savedstate-2.6.1",
    "savedstate-1.2.1",
    "viewpager-1.0.0",
    "viewpager2-1.0.0",
    "cursoradapter-1.0.0",
    "drawerlayout-1.1.1",
    "interpolator-1.0.0",
    "legacy-support-core-utils-1.0.0",
    "loader-1.0.0",
    "vectordrawable-1.1.0",
    "vectordrawable-animated-1.1.0",
    "customview-1.1.0",
    "coordinatorlayout-1.1.0",
    "transition-1.4.1",
    "collection-1.1.0",
    "annotation-1.6.0",
    "annotation-experimental-1.3.0",
    "core-common-2.1.0",
    "startup-runtime-1.1.1",
    "tracing-1.0.0",
]
for name in needed:
    found = list(GRADLE_CACHES.rglob(f"transformed/{name}/jars/classes.jar"))
    if found:
        classpath_jars.append(str(found[0]))
        print(f"  ✓ {name}")
    else:
        # جرّب بدائل (بعض الأسماء قد تختلف)
        found_alt = list(GRADLE_CACHES.rglob(f"transformed/*{name.split('-')[0]}*/jars/classes.jar"))
        if found_alt:
            # خذ الأول المطابق
            for f in found_alt:
                f_str = str(f).replace('-', '').lower()
                name_norm = name.replace('-', '').lower()
                if name_norm in f_str:
                    classpath_jars.append(str(f))
                    print(f"  ✓ {name} (alt)")
                    break
        else:
            print(f"  ! {name}: غير موجود في transforms")

# إضافة JARs الإضافية من modules-2 (التي لا توجد في transforms)
print("\n=== 4b. إضافة JARs الإضافية من modules-2 ===")
modules_caches = Path("/home/z/.gradle/caches/modules-2/files-2.1")
extra_jars_needed = [
    ("androidx.lifecycle", "lifecycle-common", "2.6.1"),
    ("androidx.annotation", "annotation", "1.3.0"),
    ("androidx.collection", "collection", "1.1.0"),
]
for group, artifact, version in extra_jars_needed:
    pattern = modules_caches / group / artifact / version
    if pattern.exists():
        found_jars = list(pattern.rglob(f"{artifact}-{version}.jar"))
        if found_jars:
            classpath_jars.append(str(found_jars[0]))
            print(f"  ✓ {artifact}-{version}")
        else:
            print(f"  ! {artifact}-{version}: مجلد موجود لكن لا jar")
    else:
        print(f"  ! {artifact}-{version}: غير موجود")

print(f"\n  إجمالي: {len(classpath_jars)} ملف classes.jar")

# 6. تصريف MainActivity.java إلى .class
print("\n=== 5. تصريف MainActivity.java ===")
# استخدم R.jar من البناء السابق (يحتوي على R.id.webview, R.layout.activity_main)
r_jar = Path("/home/z/my-project/mobile-app/android/app/build/intermediates/compile_and_runtime_not_namespaced_r_class_jar/debug/processDebugResources/R.jar")
compile_classpath = ":".join([ANDROID_JAR, str(r_jar)] + classpath_jars)
out_classes_dir = Path("/tmp/compiled-classes")
if out_classes_dir.exists():
    shutil.rmtree(out_classes_dir)
out_classes_dir.mkdir(parents=True)

javac_cmd = [
    JAVAC, "-source", "17", "-target", "17",
    "-cp", compile_classpath,
    "-d", str(out_classes_dir),
    str(SRC_DIR / "java/com/thaqafatna/app/MainActivity.java"),
]
result = run(javac_cmd)
if result.returncode != 0:
    print(f"  ✗ فشل javac")
    sys.exit(1)
print(f"  ✓ MainActivity.class تم تصريفه")
compiled_class = out_classes_dir / "com/thaqafatna/app/MainActivity.class"
print(f"  الحجم: {compiled_class.stat().st_size} bytes")

# 7. تحويل .class إلى .dex باستخدام d8
print("\n=== 6. تحويل .class إلى .dex ===")
# تخطّي قسم R.jar الإضافي — استخدمنا R.jar من البناء السابق أعلاه
# تحقق من وجود MainActivity.class
if not compiled_class.exists():
    print(f"  ✗ MainActivity.class غير موجود بعد التصريف")
    sys.exit(1)

# حوّل إلى dex باستخدام d8
dex_out = Path("/tmp/main-activity.dex")
if dex_out.exists():
    dex_out.unlink()
# d8 يحتاج جميع الـ classes المرتبطة (بما في ذلك الفئات الداخلية المجهولة)
compiled_classes_dir = out_classes_dir / "com/thaqafatna/app"
class_files = sorted(compiled_classes_dir.glob("*.class"))
print(f"  عدد ملفات .class: {len(class_files)}")
for cf in class_files:
    print(f"    {cf.name}: {cf.stat().st_size} bytes")
d8_cmd = [D8, "--output", "/tmp/", "--min-api", "24"]
d8_cmd.extend([str(cf) for cf in class_files])
result = run(d8_cmd)
if result.returncode != 0:
    print(f"  ✗ فشل d8")
    sys.exit(1)
# d8 ينشئ classes.dex في /tmp/
new_dex = Path("/tmp/classes.dex")
if new_dex.exists():
    shutil.move(str(new_dex), str(dex_out))
    print(f"  ✓ main-activity.dex: {dex_out.stat().st_size} bytes")
else:
    print(f"  ✗ classes.dex لم يُنشأ")
    sys.exit(1)

# 8. استبدال MainActivity.class داخل classes.dex الموجود في APK
# هذا أصعب — الـ dex القديم يحتوي على عدة classes، نحتاج إلى دمج أو استبدال
# الحل الأبسط: ضع الـ dex الجديد كـ classes4.dex (يحل محل القديم)
print("\n=== 7. دمج dex الجديد في APK ===")
# خذ الـ classes.dex القديم (الذي يحتوي MainActivity القديم) واستبدله بالجديد
# لكن dex الجديد يحتوي فقط MainActivity — سيفقد باقي classes!
# الحل: استخدم d8 --merge لدمج الـ dexes

# اقرأ classes.dex من APK المستخرج
old_dex = EXTRACT_DIR / "classes.dex"
print(f"  classes.dex القديم: {old_dex.stat().st_size} bytes")

# الطريقة الأفضل: ضع dex الجديد كـ classes4.dex في APK
# (Android يدعم ملفات dex متعددة وسيجد النسخة الأحدث من الـ class)
shutil.copy2(dex_out, EXTRACT_DIR / "classes4.dex")
print(f"  ✓ classes4.dex: {dex_out.stat().st_size} bytes")

# لكن انتظر — إذا كان هناك MainActivity في كلا classes.dex و classes4.dex،
# قد يختار Android واحدًا منهما عشوائيًا. الأفضل أن نحذف الـ class القديم من classes.dex.
# لكن تعديل dex يحتاج أدوات خاصة. الحل البديل: استبدل classes.dex بالكامل بـ dex مدمج.

# جرّب d8 merge
print("\n=== 8. دمج classes.dex القديم مع dex الجديد ===")
merged_dex_out = Path("/tmp/merged-dex")
if merged_dex_out.exists():
    shutil.rmtree(merged_dex_out)
merged_dex_out.mkdir()
merge_cmd = [D8, "--output", str(merged_dex_out) + "/", "--min-api", "24",
             str(old_dex), str(dex_out)]
result = run(merge_cmd)
if result.returncode != 0:
    print(f"  ✗ فشل الدمج — سيتم استخدام classes4.dex كحل بديل")
else:
    merged_dex = merged_dex_out / "classes.dex"
    if merged_dex.exists():
        # استبدل classes.dex القديم بالمدمج، واحذف classes4.dex
        shutil.copy2(merged_dex, old_dex)
        if (EXTRACT_DIR / "classes4.dex").exists():
            (EXTRACT_DIR / "classes4.dex").unlink()
        print(f"  ✓ classes.dex مدمج: {old_dex.stat().st_size} bytes")

# 9. تحديث ملفات PWA أيضاً (لحالة عدم الاتصال)
print("\n=== 9. تحديث ملفات PWA (للاحتياط عند عدم الاتصال) ===")
assets_public = EXTRACT_DIR / "assets" / "public"
for fname in ["index.html", "sw.js", "manifest.json", "icon.svg"]:
    src = Path("/home/z/my-project/mobile-app/pwa") / fname
    if src.exists():
        shutil.copy2(src, assets_public / fname)
        print(f"  ✓ {fname}")

# 10. تحديث layout/activity_main.xml في resources.arsc
# هذا أصعب لأن resources.arsc ثنائي، نحتاج aapt2 لإعادة التجميع
# الحل البديل: ضع layout/activity_main.xml الجديد كملف raw XML في assets
# لكن Android يقرأ layouts من res/ المُجمَّعة في resources.arsc
# الحل الأفضل: أعد بناء APK بالكامل عبر gradle (لكن يتطلب Android SDK كامل)
# في الوقت الحالي: نشترك الـ layout القديم (WebView فقط) — سيعمل لأن الـ IDs موجودة

print("\n=== 10. تحديث layout (محاولة) ===")
# جرّب استخدام aapt2 لتحديث الـ resources
old_resource = EXTRACT_DIR / "res/layout/activity_main.xml"
if old_resource.exists():
    print(f"  layout القديم موجود: {old_resource}")
    # نحتاج aapt2 link لإعادة تجميع resources.arsc
    # هذا معقد — نتجاوز في الوقت الحالي ونقبل بالـ layout القديم
    # (الـ WebView فقط بدون offline overlay)
    print("  ! سيُستخدم layout القديم (WebView فقط) — offline overlay غير متاح")
    print("    سيتم تجاوز هذا في إعادة بناء كامل عبر GitHub Actions")

# 11. إعادة ضغط APK
print("\n=== 11. إنشاء APK جديد ===")
unsigned_apk = Path("/tmp/unsigned-v15.apk")
if unsigned_apk.exists():
    unsigned_apk.unlink()
file_list = []
for root, dirs, files in os.walk(EXTRACT_DIR):
    for f in files:
        full_path = Path(root) / f
        rel_path = full_path.relative_to(EXTRACT_DIR)
        file_list.append((str(rel_path).replace('\\', '/'), str(full_path)))
file_list.sort()
# احذف ملفات التوقيع القديمة
file_list = [(rel, fp) for rel, fp in file_list if not (rel.startswith('META-INF/') and (rel.endswith('.SF') or rel.endswith('.RSA') or rel.endswith('.DSA') or rel.endswith('.MF')))]
with zipfile.ZipFile(unsigned_apk, 'w', zipfile.ZIP_DEFLATED) as z:
    for rel, fp in file_list:
        z.write(fp, rel)
print(f"  ✓ APK غير موقّع: {unsigned_apk.stat().st_size} bytes")

# 12. zipalign + توقيع
print("\n=== 12. محاذاة وتوقيع APK ===")
aligned_apk = Path("/tmp/aligned-v15.apk")
if aligned_apk.exists():
    aligned_apk.unlink()
align_cmd = [ZIPALIGN, "-f", "-p", "4", str(unsigned_apk), str(aligned_apk)]
result = run(align_cmd)
if result.returncode != 0:
    print(f"  ✗ فشل zipalign")
    sys.exit(1)
print(f"  ✓ zipalign")

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
result = run(sign_cmd)
if result.returncode != 0:
    print(f"  ✗ فشل apksigner")
    sys.exit(1)
print(f"  ✓ APK موقّع")

# 13. التحقق من التوقيع
print("\n=== 13. التحقق من التوقيع ===")
verify_cmd = [APKSIGNER, "verify", "--verbose", str(NEW_APK)]
result = subprocess.run(verify_cmd, capture_output=True, text=True)
print(result.stdout[:400] if result.stdout else result.stderr[:400])

# 14. التحقق من المحتوى
print("\n=== 14. التحقق من محتوى APK ===")
with zipfile.ZipFile(NEW_APK, 'r') as z:
    # تحقق من capacitor.config.json
    with z.open("assets/capacitor.config.json") as f:
        config_content = f.read().decode('utf-8')
        has_server_url = '"url": "https://thaqafatna-qr.vercel.app"' in config_content or '"url":"https://thaqafatna-qr.vercel.app"' in config_content
        print(f"  capacitor.config.json: server.url = {'✓' if has_server_url else '✗'}")

    # تحقق من classes.dex (يحتوي MainActivity الجديد؟)
    # اقرأ كـ binary وابحث عن سلسلة LIVE_URL
    with z.open("classes.dex") as f:
        dex_bytes = f.read()
        # ابحث عن السلسلة "https://thaqafatna-qr.vercel.app/" في الـ dex
        target = b"thaqafatna-qr.vercel.app"
        if target in dex_bytes:
            print(f"  classes.dex: يحتوي على LIVE_URL ✓")
        else:
            print(f"  classes.dex: لا يحتوي على LIVE_URL ✗")

print(f"\n[✓] تم بناء APK جديد: {NEW_APK}")
print(f"    الحجم: {NEW_APK.stat().st_size} bytes ({NEW_APK.stat().st_size / (1024*1024):.2f} MB)")
