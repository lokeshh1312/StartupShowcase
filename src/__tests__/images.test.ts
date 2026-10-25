import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { isAllowedImageUrl } from "@/lib/images";

describe("isAllowedImageUrl Helper", () => {
  beforeEach(() => {
    // Reset to default test environment
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://showcase-app.supabase.co");
    vi.stubEnv("NODE_ENV", "test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("Supabase Host Validation", () => {
    it("allows URLs matching configured NEXT_PUBLIC_SUPABASE_URL host", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://showcase-app.supabase.co";
      expect(
        isAllowedImageUrl(
          "https://showcase-app.supabase.co/storage/v1/object/public/startup-images/uuid/logo.png"
        )
      ).toBe(true);
      expect(
        isAllowedImageUrl("https://showcase-app.supabase.co/custom-image.webp")
      ).toBe(true);
    });

    it("rejects other Supabase projects when NEXT_PUBLIC_SUPABASE_URL is configured", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://showcase-app.supabase.co";
      expect(
        isAllowedImageUrl("https://attacker-proj.supabase.co/storage/v1/object/public/bad.png")
      ).toBe(false);
    });

    it("allows configured Supabase host with custom port (e.g. local Supabase CLI)", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
      expect(
        isAllowedImageUrl("http://127.0.0.1:54321/storage/v1/object/public/logo.png")
      ).toBe(true);
      // Mismatched port rejected
      expect(
        isAllowedImageUrl("http://127.0.0.1:8080/storage/v1/object/public/logo.png")
      ).toBe(false);
    });

    it("falls back to allowing *.supabase.co hosts when NEXT_PUBLIC_SUPABASE_URL is unset", () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      expect(
        isAllowedImageUrl("https://random-project.supabase.co/storage/v1/object/public/logo.png")
      ).toBe(true);
      expect(isAllowedImageUrl("https://supabase.co/logo.png")).toBe(true);
      // Ensure evil domain spoofing is rejected
      expect(isAllowedImageUrl("https://evil-supabase.co/logo.png")).toBe(false);
      expect(isAllowedImageUrl("https://random-project.supabase.co.evil.com/logo.png")).toBe(false);
    });
  });

  describe("Unsplash Dev Allowlist Validation", () => {
    it("allows images.unsplash.com when NODE_ENV is development or test", () => {
      vi.stubEnv("NODE_ENV", "development");
      const sampleUrl =
        "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=300&q=80";
      expect(isAllowedImageUrl(sampleUrl)).toBe(true);
      expect(isAllowedImageUrl("http://images.unsplash.com/photo-1234")).toBe(true);

      vi.stubEnv("NODE_ENV", "test");
      expect(isAllowedImageUrl(sampleUrl)).toBe(true);
    });

    it("strictly rejects images.unsplash.com in production (NODE_ENV === 'production')", () => {
      vi.stubEnv("NODE_ENV", "production");
      const sampleUrl =
        "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=300&q=80";
      expect(isAllowedImageUrl(sampleUrl)).toBe(false);
      expect(isAllowedImageUrl("http://images.unsplash.com/photo-1234")).toBe(false);
    });

    it("rejects other unsplash subdomains or main domain", () => {
      vi.stubEnv("NODE_ENV", "development");
      expect(isAllowedImageUrl("https://unsplash.com/photos/1234")).toBe(false);
      expect(isAllowedImageUrl("https://api.unsplash.com/photo.jpg")).toBe(false);
      expect(isAllowedImageUrl("https://images.unsplash.com.evil.com/photo.jpg")).toBe(false);
    });
  });

  describe("Rejection of Invalid, Malicious, or Random Hosts", () => {
    it("rejects random external hosts", () => {
      expect(isAllowedImageUrl("https://example.com/logo.png")).toBe(false);
      expect(isAllowedImageUrl("https://imgur.com/gallery/123")).toBe(false);
      expect(isAllowedImageUrl("https://google.com/favicon.ico")).toBe(false);
      expect(isAllowedImageUrl("https://attacker.net/exploit.jpg")).toBe(false);
    });

    it("rejects javascript: URLs", () => {
      expect(isAllowedImageUrl("javascript:alert(1)")).toBe(false);
      expect(isAllowedImageUrl("JAVASCRIPT:alert('xss')")).toBe(false);
      expect(isAllowedImageUrl("javascript://alert(1)")).toBe(false);
    });

    it("rejects data: URLs", () => {
      expect(
        isAllowedImageUrl("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=")
      ).toBe(false);
      expect(isAllowedImageUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
    });

    it("rejects non-http(s) protocols (file:, blob:, ftp:, mailto:)", () => {
      expect(isAllowedImageUrl("file:///etc/passwd")).toBe(false);
      expect(isAllowedImageUrl("blob:https://showcase-app.supabase.co/uuid")).toBe(false);
      expect(isAllowedImageUrl("ftp://showcase-app.supabase.co/img.png")).toBe(false);
      expect(isAllowedImageUrl("mailto:admin@example.com")).toBe(false);
    });

    it("rejects null, undefined, empty, or whitespace-only inputs", () => {
      expect(isAllowedImageUrl(null)).toBe(false);
      expect(isAllowedImageUrl(undefined)).toBe(false);
      expect(isAllowedImageUrl("")).toBe(false);
      expect(isAllowedImageUrl("   ")).toBe(false);
    });

    it("rejects malformed strings and protocol-relative URLs", () => {
      expect(isAllowedImageUrl("not-a-valid-url")).toBe(false);
      expect(isAllowedImageUrl("//images.unsplash.com/photo-123")).toBe(false);
      expect(isAllowedImageUrl("/storage/v1/object/public/logo.png")).toBe(false);
    });
  });

  describe("StartupLogo Fallback Behavior", () => {
    // Dynamic import to test React component in Node environment
    it("renders Image element when logoUrl is allowed", async () => {
      const { StartupLogo } = await import("@/components/common/startup-logo");
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://showcase-app.supabase.co";
      const element = StartupLogo({
        name: "Acme",
        logoUrl: "https://showcase-app.supabase.co/logo.png",
      });
      // The child is Next.js Image component
      expect(element.props.children.type).toBeDefined();
      expect(element.props.children.type).not.toBe("span");
      expect(element.props.children.props.src).toBe("https://showcase-app.supabase.co/logo.png");
    });

    it("falls back to initials when logoUrl is from an unallowed host", async () => {
      const { StartupLogo } = await import("@/components/common/startup-logo");
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://showcase-app.supabase.co";
      const element = StartupLogo({
        name: "Acme",
        logoUrl: "https://untrusted-host.com/logo.png",
      });
      // The child inside div falls back to <span>A</span> instead of next/image
      expect(element.props.children.type).toBe("span");
      expect(element.props.children.props.children).toBe("A");
    });

    it("falls back to icon when logoUrl is unallowed and logoType is present", async () => {
      const { StartupLogo } = await import("@/components/common/startup-logo");
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://showcase-app.supabase.co";
      const element = StartupLogo({
        name: "Acme",
        logoUrl: "https://untrusted-host.com/logo.png",
        logoType: "leaf",
      });
      // The child inside div is an icon component, not next/image
      expect(element.props.children.type).not.toBe("span");
      expect(element.props.children.props.className).toContain("w-full h-full");
    });
  });
});
