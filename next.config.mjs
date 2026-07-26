/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    serverMinification: true,
    optimizePackageImports: ["@supabase/ssr", "@supabase/supabase-js"],
  },
  images: {
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
};
export default nextConfig;
