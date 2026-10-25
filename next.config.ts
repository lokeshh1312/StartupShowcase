import type { NextConfig } from "next";

// Derive Supabase storage host from NEXT_PUBLIC_SUPABASE_URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
let supabaseHost = "";
let supabaseProtocol: "http" | "https" = "https";
let supabasePort = "";

if (supabaseUrl) {
  try {
    const parsed = new URL(supabaseUrl);
    supabaseHost = parsed.hostname;
    supabaseProtocol = parsed.protocol.replace(":", "") as "http" | "https";
    supabasePort = parsed.port || "";
  } catch {
    // Leave empty if malformed URL
  }
}

const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Content-Security-Policy-Report-Only",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
      "frame-src 'self' https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https:",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  trailingSlash: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "3mb",
    },
  },
  images: {
    remotePatterns: [
      ...(supabaseHost
        ? [
            {
              protocol: supabaseProtocol,
              hostname: supabaseHost,
              port: supabasePort,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : [
            {
              protocol: "https" as const,
              hostname: "*.supabase.co",
              pathname: "/storage/v1/object/public/**",
            },
          ]),
      ...(process.env.NODE_ENV !== "production"
        ? [
            {
              protocol: "https" as const,
              hostname: "images.unsplash.com",
            },
            {
              protocol: "http" as const,
              hostname: "images.unsplash.com",
            },
          ]
        : []),
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
