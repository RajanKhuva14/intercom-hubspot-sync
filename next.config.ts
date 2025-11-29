import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_INTERCOM_CLIENT_ID: process.env.INTERCOM_CLIENT_ID,
    NEXT_PUBLIC_INTERCOM_AUTH_URL: process.env.INTERCOM_AUTH_URL,
    NEXT_PUBLIC_REDIRECT_URI: process.env.REDIRECT_URI,
    NEXT_PUBLIC_HUBSPOT_API_KEY: process.env.HUBSPOT_API_KEY,
  },
};

export default nextConfig;
