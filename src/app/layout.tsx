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
  title: "ثقافتنا | لعبة كلمات ومكتبة عربية",
  description: "منصة تعليمية ترفيهية: العب الألغاز، اقرأ الكتب، وطوّر مهاراتك العربية. 13 نوع لغز + مكتبة كتب ذكية + خريطة معرفة تكيّفية.",
  keywords: ["ثقافتنا", "كلمات متقاطعة", "ألغاز عربية", "مكتبة عربية", "كتب", "تعليم", "ألعاب كلمات"],
  authors: [{ name: "ثقافتنا" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
    apple: "/icon-192.png",
  },
  openGraph: {
    title: "ثقافتنا | لعبة كلمات ومكتبة عربية",
    description: "منصة تعليمية ترفيهية: العب الألغاز، اقرأ الكتب، وطوّر مهاراتك العربية.",
    siteName: "ثقافتنا",
    type: "website",
    locale: "ar_SA",
  },
  twitter: {
    card: "summary_large_image",
    title: "ثقافتنا",
    description: "لعبة كلمات ومكتبة عربية — تعلّم بمرح",
  },
  applicationName: "ثقافتنا",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ثقافتنا",
  },
  formatDetection: {
    telephone: false,
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
