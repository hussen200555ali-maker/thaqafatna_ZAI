import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
  compress: true,
  poweredByHeader: false,
  // معالجة حزم تحتاج external (preact من NextAuth)
  serverExternalPackages: ["@auth/core", "preact", "preact-render-to-string"],
  // headers للأمان + caching
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          { key: "Content-Type", value: "application/manifest+json" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
      {
        source: "/icon.svg",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
    ];
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "framer-motion",
    ],
  },
  // Turbopack config (Next.js 16 default)
  turbopack: {
    resolveAlias: {
      // تجاهل pdf.worker.js (تحويل لملف فارغ بدل boolean)
      "./pdf.worker.js": "./node_modules/next/dist/compiled/empty.js",
    },
  },
};

export default nextConfig;
