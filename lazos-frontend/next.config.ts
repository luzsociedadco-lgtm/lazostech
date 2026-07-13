import path from "path";
import type { NextConfig } from "next";

const scriptSources = ["'self'", "'unsafe-inline'"];

if (process.env.NODE_ENV !== "production") {
  scriptSources.push("'unsafe-eval'");
}

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      `script-src ${scriptSources.join(" ")}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.reown.com",
      [
        "connect-src 'self'",
        "https://*.supabase.co",
        "wss://*.supabase.co",
        "https://*.walletconnect.com",
        "wss://*.walletconnect.com",
        "https://*.walletconnect.org",
        "wss://*.walletconnect.org",
        "https://api.web3modal.org",
        "https://*.g.alchemy.com",
        "https://*.alchemy.com",
        "https://sepolia.base.org",
        "https://mainnet.base.org"
      ].join(" "),
      "frame-src 'self' https://verify.walletconnect.com https://verify.walletconnect.org"
    ].join("; ")
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin"
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff"
  },
  {
    key: "X-Frame-Options",
    value: "DENY"
  },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()"
  }
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  outputFileTracingRoot: path.resolve(__dirname),
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders
      }
    ];
  },
  webpack: config => {
    config.cache = false;
    return config;
  },
};

export default nextConfig;
