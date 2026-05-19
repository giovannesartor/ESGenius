import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.esg360.digital";

/**
 * HTTP security headers applied to every route.
 * Tune the CSP connect-src to match your actual API domain in production.
 */
const securityHeaders = [
  // Prevent clickjacking
  { key: "X-Frame-Options", value: "DENY" },
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Force HTTPS for 1 year, include sub-domains
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  // Disable referrer for cross-origin requests
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Limit browser features
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self)",
  },
  // Content Security Policy
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Scripts: self + Next.js inline (nonce should be used in production for stricter mode)
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Styles: self + inline (Tailwind/shadcn rely on inline styles)
      "style-src 'self' 'unsafe-inline'",
      // Images: self + data URIs + trusted CDNs
      "img-src 'self' data: blob: https:",
      // Fonts: self
      "font-src 'self'",
      // API calls: same origin + backend API
      `connect-src 'self' ${API_URL} https://accounts.google.com`,
      // Frames: none
      "frame-src 'none'",
      // Objects: none
      "object-src 'none'",
      // Base URI: self only (prevent base-tag injection)
      "base-uri 'self'",
      // Form submissions: self only
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_API_URL: `${API_URL}/api/v1`,
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
