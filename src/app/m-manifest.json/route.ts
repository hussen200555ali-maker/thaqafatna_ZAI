/**
 * GET /m-manifest.json — PWA manifest لتطبيق الموبايل المخصّص /m
 *
 * تطبيق قابل للتثبيت على Android/iOS:
 * - start_url: /m (يفتح مباشرة على واجهة الموبايل)
 * - display: standalone (ملء الشاشة، أيقونة منفصلة)
 * - أيقونات maskable 192/512
 */

import { NextResponse } from 'next/server'

export const dynamic = 'force-static'

export function GET() {
  const manifest = {
    name: 'ثقافتنا — المكتبة الذكية',
    short_name: 'ثقافتنا',
    description: 'مكتبة عربية ذكية — تطبيق مخصّص للهواتف',
    lang: 'ar',
    dir: 'rtl',
    start_url: '/m',
    scope: '/m/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'portrait',
    background_color: '#0c0a09',
    theme_color: '#0c0a09',
    categories: ['education', 'books'],
    prefer_related_applications: false,
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
    shortcuts: [
      { name: 'الرئيسية', short_name: 'الرئيسية', url: '/m', icons: [{ src: '/icon-192.png', sizes: '192x192' }] },
      { name: 'التصنيفات', short_name: 'تصنيفات', url: '/m/library/categories', icons: [{ src: '/icon-192.png', sizes: '192x192' }] },
      { name: 'المؤلفون', short_name: 'مؤلفون', url: '/m/library/authors', icons: [{ src: '/icon-192.png', sizes: '192x192' }] },
      { name: 'مكتبتي', short_name: 'مكتبتي', url: '/m/library/my-library', icons: [{ src: '/icon-192.png', sizes: '192x192' }] },
    ],
  }

  return new NextResponse(JSON.stringify(manifest, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
