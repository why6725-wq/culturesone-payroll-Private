/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  headers: async () => [
    {
      source: "/((?!_next/).*)",   // 페이지·API 응답은 캐시 금지, 정적 에셋은 제외
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Cache-Control", value: "no-store" }
      ]
    }
  ]
};
export default nextConfig;
