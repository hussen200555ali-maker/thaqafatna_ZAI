import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = import.meta.dirname || path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  test: {
    // استخدم 'node' كـ default environment لتجنب مشاكل jsdom/undici في CI
    // اختبارات الـ React components تستخدم environmentMatchPattern لتفعيل jsdom
    environment: 'node',
    environmentMatchGlobs: [
      ['tests/unit/**/*.tsx', 'jsdom'],
      ['tests/unit/component-*.test.ts', 'jsdom'],
    ],
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
    exclude: ['node_modules', '.next', 'tests/e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['src/lib/**/*.ts', 'src/lib/**/*.tsx'],
      exclude: ['**/*.test.*', '**/*.spec.*'],
    },
    pool: 'threads', // threads أكثر استقرارًا من forks
    poolOptions: {
      threads: {
        singleThread: false,
        isolate: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // تحديد إصدارات متوافقة من undici لتفادي مشاكل jsdom
  optimizeDeps: {
    exclude: ['jsdom'],
  },
})
