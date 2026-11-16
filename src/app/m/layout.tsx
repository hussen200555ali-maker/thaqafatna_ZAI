import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'ثقافتنا — المكتبة',
  description: 'مكتبة عربية ذكية متجاوبة مع الهواتف',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0c0a09',
  viewportFit: 'cover',
}

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return children
}
