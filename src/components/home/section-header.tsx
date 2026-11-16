"use client";

/**
 * ترويسة قسم موحدة — تُستخدم أعلى كل قسم في الصفحة الرئيسية
 * العنوان في اليمين، وعدّاد/إجراء اختياري في اليسار
 */

interface SectionHeaderProps {
  title: string;
  /** نص اختياري في أقصى اليسار (عدّاد) */
  sideText?: string;
  /** إن وُجد، يصبح النص الجانبي زراً قابلاً للنقر */
  onSideClick?: () => void;
}

export function SectionHeader({ title, sideText, onSideClick }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-heading text-[15px] font-extrabold text-heritage-900">
        {title}
      </h2>
      {sideText &&
        (onSideClick ? (
          <button
            type="button"
            onClick={onSideClick}
            className="text-[11px] font-bold text-heritage-700 transition-colors hover:text-flame-500"
          >
            {sideText}
          </button>
        ) : (
          <span className="text-[11px] font-medium text-muted-foreground">
            {sideText}
          </span>
        ))}
    </div>
  );
}
