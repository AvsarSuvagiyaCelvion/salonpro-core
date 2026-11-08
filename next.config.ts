import type { NextConfig } from "next";

/**
 * CRITICAL BUILD & TAILWIND V4 INSTRUCTION (DO NOT REMOVE OR ALTER):
 * This project uses Tailwind CSS v4 configured via Turbopack (@tailwindcss/turbopack).
 * NEVER change package.json build script to `next build --webpack`.
 * Running Next.js with --webpack bypasses @tailwindcss/turbopack and emits raw unstyled CSS
 * in production, which breaks all styling across the live application (like on Vercel).
 * Always build using `next build` (Turbopack).
 */
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
