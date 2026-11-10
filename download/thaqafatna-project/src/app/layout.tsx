import type { Metadata } from "next";
import { Cairo, Tajawal } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ثقافتنا | لعبة كلمات متقاطعة عربية",
  description: "تطبيق ثقافتنا: لعبة كلمات متقاطعة عربية ممتعة وتثقيفية لجميع الفئات العمرية. اكتشف الكلمات، حل الألغاز، وتحدَّ يومياً!",
  keywords: ["ثقافتنا", "كلمات متقاطعة", "ألغاز عربية", "ألعاب كلمات", "وصلة", "فزرة", "ألغاز", "كلمات"],
  authors: [{ name: "ثقافتنا" }],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "ثقافتنا | لعبة كلمات متقاطعة عربية",
    description: "تطبيق ثقافتنا: لعبة كلمات متقاطعة عربية ممتعة وتثقيفية لجميع الفئات العمرية.",
    siteName: "ثقافتنا",
    type: "website",
    locale: "ar_SA",
  },
  twitter: {
    card: "summary_large_image",
    title: "ثقافتنا",
    description: "لعبة كلمات متقاطعة عربية ممتعة وتثقيفية",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${cairo.variable} ${tajawal.variable} antialiased bg-background text-foreground font-sans`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
