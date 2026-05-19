import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [new URL("https://cdn.simpleicons.org/**")],
  },
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
