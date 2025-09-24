import type { NextConfig } from "next";
import { getSecurityHeaders } from "./lib/env-config";

const nextConfig: NextConfig = {
  transpilePackages: ["react-pdf", "pdfjs-dist"],
  experimental: {
    turbopack: {
      // Hint turbopack about correct root if needed in monorepos
      // root: __dirname,
    },
  },

  // Security headers
  async headers() {
    const securityHeaders = getSecurityHeaders();
    
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: Object.entries(securityHeaders).map(([key, value]) => ({
          key,
          value,
        })),
      },
    ];
  },

  // Redirect HTTP to HTTPS in production
  async redirects() {
    if (process.env.NODE_ENV === "production") {
      return [
        {
          source: "/:path*",
          has: [
            {
              type: "header",
              key: "x-forwarded-proto",
              value: "http",
            },
          ],
          destination: "https://:host/:path*",
          permanent: true,
        },
      ];
    }
    return [];
  },

  // Disable X-Powered-By header
  poweredByHeader: false,

  // Compress responses
  compress: true,

  // Enable SWC minification
  swcMinify: true,

  // Image optimization security
  images: {
    domains: [], // Explicitly define allowed image domains
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Webpack configuration for security
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        // Remove comments and debug info
        minimize: true,
        // Tree shaking
        usedExports: true,
        sideEffects: false,
      };
    }

    return config;
  },
};

export default nextConfig;
