/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The prototype ships without an ESLint config; keep builds non-interactive.
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    // Allow large client datasets to be passed without hitting the page data warning.
    optimizePackageImports: ["lucide-react", "recharts"],
  },
};

export default nextConfig;
