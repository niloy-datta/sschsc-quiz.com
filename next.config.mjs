/** @type {import('next').NextConfig} */
// PWA (next-pwa / service worker) intentionally disabled until post-launch.
const isVercel = process.env.VERCEL === "1";
const isProduction = process.env.NODE_ENV === "production";

const apiOrigin =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_BASE_URL ||
  "http://localhost:8000";

// Local dev: proxy /api/* to FastAPI on :8000. Production Vercel: /api/* → Python (vercel.json).
const useProxy =
  process.env.NEXT_PUBLIC_USE_API_PROXY !== "false" && !isVercel && !isProduction;

const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async redirects() {
    return [];
  },
  async rewrites() {
    if (!useProxy) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin.replace(/\/$/, "")}/api/:path*`,
      },
    ];
  },
  async headers() {
    // Quiz JSON changes when imports run — do not use long-lived immutable cache.
    const quizJsonCache = [
      {
        key: "Cache-Control",
        value: "public, max-age=0, must-revalidate",
      },
    ];
    return [
      { source: "/questions/:path*", headers: quizJsonCache },
      { source: "/quiz-data/:path*", headers: quizJsonCache },
    ];
  },
};

export default nextConfig;
