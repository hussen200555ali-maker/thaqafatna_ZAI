import type { Metadata, Viewport } from 'next'
import { ServiceWorkerRegister } from '@/components/mobile/sw-register'

export const metadata: Metadata = {
  title: 'ثقافتنا — المكتبة',
  description: 'مكتبة عربية ذكية متجاوبة مع الهواتف',
  manifest: '/m-manifest.json',
  applicationName: 'ثقافتنا',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ثقافتنا',
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/icon-192.png', sizes: '192x192' }],
    shortcut: ['/icon-192.png'],
  },
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
  return (
    <>
      <ServiceWorkerRegister />
      {children}
    </>
  )
}
