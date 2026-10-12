// نظام المؤثرات الصوتية والاهتزاز
// يستخدم Web Audio API لتوليد أصوات بسيطة بدون ملفات صوتية

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn("Web Audio API not supported");
      return null;
    }
  }
  return audioContext;
}

// تشغيل نغمة بسيطة
function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume: number = 0.2,
  startTime: number = 0
) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + startTime);

  gainNode.gain.setValueAtTime(0, ctx.currentTime + startTime);
  gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + startTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(ctx.currentTime + startTime);
  oscillator.stop(ctx.currentTime + startTime + duration);
}

// اهتزاز الجهاز (للجوال)
function vibrate(pattern: number | number[]) {
  if (typeof window === "undefined") return;
  if ("vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // تجاهل الأخطاء
    }
  }
}

export const soundEffects = {
  // صوت اختيار حرف
  selectLetter: () => {
    playTone(800, 0.08, "sine", 0.1);
    vibrate(10);
  },

  // صوت حذف حرف
  removeLetter: () => {
    playTone(400, 0.08, "sine", 0.1);
    vibrate(10);
  },

  // صوت كلمة صحيحة
  correctWord: () => {
    playTone(523, 0.1, "sine", 0.2, 0); // C5
    playTone(659, 0.1, "sine", 0.2, 0.1); // E5
    playTone(784, 0.2, "sine", 0.2, 0.2); // G5
    vibrate([30, 30, 30]);
  },

  // صوت كلمة إضافية
  bonusWord: () => {
    playTone(659, 0.08, "triangle", 0.15, 0); // E5
    playTone(784, 0.08, "triangle", 0.15, 0.08); // G5
    playTone(988, 0.15, "triangle", 0.15, 0.16); // B5
    vibrate([20, 20, 20, 20]);
  },

  // صوت كلمة خاطئة
  wrongWord: () => {
    playTone(200, 0.15, "sawtooth", 0.1);
    playTone(150, 0.2, "sawtooth", 0.1, 0.1);
    vibrate([50, 30, 50]);
  },

  // صوت إكمال المرحلة
  levelComplete: () => {
    // لحن نجاح قصير
    playTone(523, 0.12, "sine", 0.2, 0); // C5
    playTone(659, 0.12, "sine", 0.2, 0.12); // E5
    playTone(784, 0.12, "sine", 0.2, 0.24); // G5
    playTone(1047, 0.3, "sine", 0.25, 0.36); // C6
    vibrate([40, 40, 40, 80]);
  },

  // صوت استخدام تلميح
  hint: () => {
    playTone(660, 0.1, "triangle", 0.15);
    playTone(880, 0.15, "triangle", 0.15, 0.1);
    vibrate(30);
  },

  // صوت خلط الحروف
  shuffle: () => {
    playTone(440, 0.05, "square", 0.08);
    playTone(550, 0.05, "square", 0.08, 0.05);
    playTone(660, 0.05, "square", 0.08, 0.1);
    vibrate(15);
  },

  // صوت فتح المرحلة
  levelStart: () => {
    playTone(440, 0.1, "sine", 0.15);
    playTone(554, 0.1, "sine", 0.15, 0.1);
    playTone(659, 0.15, "sine", 0.15, 0.2);
  },

  // صوت النقر على الزر
  buttonClick: () => {
    playTone(600, 0.05, "sine", 0.08);
    vibrate(8);
  },

  // صوت الحصول على عملات
  coinEarn: () => {
    playTone(988, 0.08, "triangle", 0.15);
    playTone(1319, 0.15, "triangle", 0.15, 0.08);
    vibrate([10, 10]);
  },

  // صوت إظهار نجمة (متدرّج حسب الترتيب)
  starReveal: (starNumber: number = 1) => {
    // كل نجمة لها نغمة أعلى من سابقتها
    const baseFreq = 523 * Math.pow(1.2599, (starNumber - 1) * 2); // نصف تون مضاعف
    playTone(baseFreq, 0.12, "sine", 0.2, 0);
    playTone(baseFreq * 1.5, 0.12, "sine", 0.2, 0.1); // quinte
    playTone(baseFreq * 2, 0.2, "sine", 0.2, 0.22); // octave
    vibrate([30, 20, 40]);
  },

  // صوت توهج النجمة (للحظة التوهج الكامل)
  starShine: () => {
    playTone(1318, 0.05, "triangle", 0.18, 0);
    playTone(1568, 0.05, "triangle", 0.18, 0.05);
    playTone(1976, 0.08, "triangle", 0.2, 0.1);
    playTone(2637, 0.25, "triangle", 0.18, 0.18);
    vibrate([10, 10, 10, 50]);
  },

  // صوت "نجمة مفقودة" (لا تزعج - مجرد نغمة لطيفة)
  starMiss: () => {
    playTone(330, 0.08, "sine", 0.08);
    playTone(247, 0.12, "sine", 0.08, 0.06);
  },
};

// إعداد صامت (للوضع الصامت)
let isMuted = false;

export function setMuted(muted: boolean) {
  isMuted = muted;
  if (typeof window !== "undefined") {
    localStorage.setItem("thaqafatna-muted", muted ? "true" : "false");
  }
}

export function getMuted(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("thaqafatna-muted") === "true";
}

// wrapper يتحقق من الوضع الصامت
export function playSound(effect: keyof typeof soundEffects) {
  if (getMuted()) return;
  try {
    soundEffects[effect]();
  } catch (e) {
    // تجاهل الأخطاء
  }
}

// wrapper خاص بالنجوم (يدعم رقم النجمة)
export function playStarSound(starNumber: number) {
  if (getMuted()) return;
  try {
    soundEffects.starReveal(starNumber);
  } catch (e) {
    // تجاهل الأخطاء
  }
}
