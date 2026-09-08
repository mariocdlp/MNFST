import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Generated media comes back from fal as a hosted URL.
      { protocol: "https", hostname: "fal.media" },
      { protocol: "https", hostname: "*.fal.media" },
      // User photos and any media we copy into our own storage.
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
