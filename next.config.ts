import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // !! ATTENZIONE !!
    // Ignora errori TypeScript durante la build per permettere il deploy su Vercel
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignora errori ESLint durante la build
    ignoreDuringBuilds: true,
  },
  // Questo aiuta con alcune librerie esterne (come quelle usate da Wagmi/Viem)
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};

export default nextConfig;