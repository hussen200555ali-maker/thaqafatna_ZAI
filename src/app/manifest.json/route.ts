/**
 * GET /manifest.json — PWA Web App Manifest
 *
 * يُقدَّم كـ route handler بدلًا من ملف static لتجنّب:
 * - Vercel preview SSO auth redirect على preview deployments
 * - CORS errors في console
 *
 * المحتوى يطابق public/manifest.json لكن مع headers صحيحة
 */

import { NextResponse } from 'next/server'

export const dynamic = 'force-static'

export function GET() {
  const manifest = {
    name: 'ثقافتنا — لعبة كلمات ومكتبة عربية',
    short_name: 'ثقافتنا',
    description: 'منصة تعليمية ترفيهية تجمع بين لعبة الكلمات والمكتبة الذكية',
    lang: 'ar',
    dir: 'rtl',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0c0a09',
    theme_color: '#9333ea',
    categories: ['education', 'games', 'books'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: 'العب',
        short_name: 'لعبة',
        url: '/?view=home',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'المكتبة',
        short_name: 'مكتبة',
        url: '/library',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'خريطة المعرفة',
        short_name: 'خريطتي',
        url: '/?view=knowledge-map',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
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
