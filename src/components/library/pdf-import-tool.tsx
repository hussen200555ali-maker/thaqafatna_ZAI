"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

/**
 * أداة استيراد PDF — تحوّل أي ملف PDF إلى كتاب منسّق
 *
 * الخطوات:
 *   1. رفع PDF
 *   2. ملء معلومات الكتاب
 *   3. معالجة تلقائية (استخراج + تقسيم + تنسيق)
 *   4. مراجعة الفصول
 *   5. نشر
 */

export function PdfImportTool({ categories }: { categories: any[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [categoryId, setCategoryId] = useState<number>(categories[0]?.id || 1);
  const [difficulty, setDifficulty] = useState("medium");
  const [autoPublish, setAutoPublish] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (selectedFile: File | null) => {
    if (!selectedFile) return;
    if (selectedFile.type !== "application/pdf") {
      toast({ title: "❌ يجب أن يكون الملف PDF", variant: "destructive" });
      return;
    }
    if (selectedFile.size > 50 * 1024 * 1024) {
      toast({ title: "❌ حجم الملف كبير جداً (حد 50MB)", variant: "destructive" });
      return;
    }
    setFile(selectedFile);
    // محاولة استخراج العنوان من اسم الملف
    if (!title) {
      const nameWithoutExt = selectedFile.name.replace(/\.pdf$/i, "");
      setTitle(nameWithoutExt);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({ title: "⚠️ ارفع ملف PDF أولاً", variant: "destructive" });
      return;
    }

    setProcessing(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("pdf", file);
      formData.append("title", title);
      formData.append("author", author);
      formData.append("categoryId", categoryId.toString());
      formData.append("difficulty", difficulty);
      formData.append("autoPublish", autoPublish.toString());

      const res = await fetch("/api/admin/import-pdf", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast({ title: "❌ فشل الاستيراد", description: data.error, variant: "destructive" });
        return;
      }

      setResult(data.bookData);
      toast({
        title: autoPublish ? "🎉 تم النشر!" : "✅ تم الاستخراج!",
        description: data.message,
      });
    } catch (e) {
      toast({ title: "❌ خطأ في الاتصال", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setTitle("");
    setAuthor("");
    setResult(null);
    setAutoPublish(false);
  };

  return (
    <div className="space-y-4">
      {/* ===== الخطوة 1: رفع الملف ===== */}
      <Card className={cn(
        "p-6 border-2 border-dashed transition-all",
        dragOver ? "border-indigo-400 bg-indigo-50" : "border-stone-300 bg-stone-50"
      )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFileSelect(e.dataTransfer.files[0]);
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
        />

        {file ? (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-2xl flex-shrink-0">
              📄
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-stone-800 truncate">{file.name}</p>
              <p className="text-xs text-stone-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setFile(null); fileInputRef.current?.click(); }}
            >
              تغيير
            </Button>
          </div>
        ) : (
          <div
            className="text-center py-8 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-5xl mb-3">📤</div>
            <p className="font-bold text-stone-700 mb-1">اسحب ملف PDF هنا أو اضغط للاختيار</p>
            <p className="text-xs text-stone-400">الحد الأقصى: 50MB · صيغة PDF فقط</p>
          </div>
        )}
      </Card>

      {/* ===== الخطوة 2: معلومات الكتاب ===== */}
      {file && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
          <Card className="p-5 space-y-3">
            <h3 className="font-bold text-stone-700 mb-2">📝 معلومات الكتاب</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-sm mb-1 block">العنوان</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مقدمة ابن خلدون" />
              </div>
              <div>
                <Label className="text-sm mb-1 block">المؤلف</Label>
                <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="عبد الرحمن بن خلدون" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm mb-1 block">التصنيف</Label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(parseInt(e.target.value))}
                  className="w-full p-2 rounded-lg border border-stone-300 bg-white text-sm"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-sm mb-1 block">الصعوبة</Label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full p-2 rounded-lg border border-stone-300 bg-white text-sm"
                >
                  <option value="easy">سهل</option>
                  <option value="medium">متوسط</option>
                  <option value="hard">صعب</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="autoPublish"
                checked={autoPublish}
                onChange={(e) => setAutoPublish(e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="autoPublish" className="text-sm cursor-pointer">
                🚀 نشر تلقائي بعد الاستيراد
              </Label>
            </div>
          </Card>
        </motion.div>
      )}

      {/* ===== الخطوة 3: زر المعالجة ===== */}
      {file && !result && (
        <Button
          onClick={handleImport}
          disabled={processing || !title}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 py-3"
        >
          {processing ? (
            <span className="flex items-center gap-2">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              جاري المعالجة...
            </span>
          ) : (
            "🔄 استخراج وتنسيق"
          )}
        </Button>
      )}

      {/* ===== الخطوة 4: عرض النتيجة ===== */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* ملخص */}
            <Card className="p-5 bg-green-50 border-green-300">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">✅</span>
                <div>
                  <h3 className="font-bold text-green-800">تم الاستخراج بنجاح!</h3>
                  <p className="text-xs text-green-600">{result.chaptersCount} فصل · {result.totalWords} كلمة · {result.readingTimeMin} دقيقة قراءة</p>
                </div>
              </div>
              <div className="text-xs text-stone-600 bg-white/50 rounded-lg p-3">
                <strong>الوصف التلقائي:</strong> {result.description}
              </div>
            </Card>

            {/* معاينة الفصول */}
            <div>
              <h3 className="font-bold text-stone-700 mb-3">📑 الفصول المستخرجة ({result.chapters.length})</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {result.chapters.map((ch: any, i: number) => (
                  <Card key={i} className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-sm text-stone-800">
                        {ch.number}. {ch.title}
                      </h4>
                      <span className="text-xs text-stone-400">⏱️ {ch.readingTimeMin} دقيقة</span>
                    </div>
                    <div
                      className="text-xs text-stone-600 line-clamp-3 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: ch.content.substring(0, 300) + "..." }}
                    />
                  </Card>
                ))}
              </div>
            </div>

            {/* أزرار */}
            <div className="flex gap-2">
              {!autoPublish && (
                <Button
                  onClick={async () => {
                    setProcessing(true);
                    setAutoPublish(true);
                    await handleImport();
                    setProcessing(false);
                  }}
                  disabled={processing}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600"
                >
                  🚀 نشر الكتاب
                </Button>
              )}
              <Button onClick={handleReset} variant="outline" className="flex-1">
                📤 استيراد كتاب آخر
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
