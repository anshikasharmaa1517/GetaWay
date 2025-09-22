import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["react-pdf", "pdfjs-dist"],
  experimental: {
    turbopack: {
      // Hint turbopack about correct root if needed in monorepos
      // root: __dirname,
    },
  },
};

export default nextConfig;
