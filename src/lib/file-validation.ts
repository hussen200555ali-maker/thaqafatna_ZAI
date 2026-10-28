/**
 * 📄 فحص ملفات PDF — Sprint 5 A.4
 *
 * يفحص:
 * - magic bytes (أول 4 بايتات): PDF يبدأ بـ %PDF
 * - حجم الملف (حد أقصى 50MB)
 * - نوع MIME
 */

const MAX_PDF_SIZE = 50 * 1024 * 1024 // 50 MB

interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * فحص ملف PDF من File object (client-side + server-side)
 */
export async function validatePDF(file: File): Promise<ValidationResult> {
  // فحص الحجم
  if (file.size > MAX_PDF_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
    return {
      valid: false,
      error: `حجم الملف ${sizeMB} MB يتجاوز الحد الأقصى 50 MB`,
    }
  }

  // فحص نوع MIME
  if (file.type !== 'application/pdf') {
    return {
      valid: false,
      error: `نوع الملف "${file.type}" غير مدعوم. يجب أن يكون PDF`,
    }
  }

  // فحص magic bytes
  try {
    const buffer = await file.slice(0, 5).arrayBuffer()
    const bytes = new Uint8Array(buffer)

    // PDF يبدأ بـ %PDF (25 50 44 46)
    const isPDF =
      bytes[0] === 0x25 && // %
      bytes[1] === 0x50 && // P
      bytes[2] === 0x44 && // D
      bytes[3] === 0x46    // F

    if (!isPDF) {
      return {
        valid: false,
        error: 'الملف ليس PDF صالحًا (magic bytes غير مطابق)',
      }
    }
  } catch {
    return {
      valid: false,
      error: 'فشل قراءة الملف',
    }
  }

  return { valid: true }
}

/**
 * فحص ملف صورة (للأغلفة)
 */
export async function validateImage(file: File): Promise<ValidationResult> {
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB

  if (file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: 'حجم الصورة يتجاوز 5 MB' }
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'نوع الصورة غير مدعوم' }
  }

  // فحص magic bytes للصور
  try {
    const buffer = await file.slice(0, 4).arrayBuffer()
    const bytes = new Uint8Array(buffer)

    // JPEG: FF D8 FF
    const isJPEG = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF
    // PNG: 89 50 4E 47
    const isPNG = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47
    // GIF: 47 49 46 38
    const isGIF = bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38
    // WebP: RIFF....WEBP
    const isWebP = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46

    if (!isJPEG && !isPNG && !isGIF && !isWebP) {
      return { valid: false, error: 'الملف ليس صورة صالحة' }
    }
  } catch {
    return { valid: false, error: 'فشل قراءة الصورة' }
  }

  return { valid: true }
}
