import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  turbopack: {}, // Add empty turbopack config to silence webpack warning
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/export\.arxiv\.org\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "arxiv-api-cache",
        expiration: {
          maxEntries: 500,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
        },
      },
    },
    {
      urlPattern: /^https:\/\/ar5iv\.labs\.arxiv\.org\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "figures-cache",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "image-cache",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    {
      urlPattern: /\/api\/feed/,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-feed-cache",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: /\/api\/(summarize|deep-summary|figures)/,
      handler: "CacheFirst",
      options: {
        cacheName: "api-summaries-cache",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days (summaries don't change)
        },
      },
    },
  ],
})(nextConfig);
