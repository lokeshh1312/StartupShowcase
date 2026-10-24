import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  validateImageBuffer,
  MAX_IMAGE_SIZE_BYTES,
  validateStartupImageUrl,
  deleteStartupImage,
} from "@/server/storage";
import { db } from "@/db";
import { createStartup, updateStartup } from "@/server/startups";

describe("Image Upload Validation (validateImageBuffer)", () => {
  it("rejects empty buffers", () => {
    const emptyBuffer = Buffer.from([]);
    const res = validateImageBuffer(emptyBuffer);
    expect(res.valid).toBe(false);
    expect(res.error).toContain("empty");
  });

  it("rejects files exceeding 2 MB limit", () => {
    const oversizeBuffer = Buffer.alloc(MAX_IMAGE_SIZE_BYTES + 1);
    const res = validateImageBuffer(oversizeBuffer);
    expect(res.valid).toBe(false);
    expect(res.error).toContain("exceeds the 2 MB limit");
  });

  it("accepts valid PNG files with authentic magic bytes", () => {
    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52,
    ]);
    const res = validateImageBuffer(pngHeader, "image/png");
    expect(res.valid).toBe(true);
    expect(res.format).toBe("png");
    expect(res.mime).toBe("image/png");
    expect(res.ext).toBe("png");
  });

  it("accepts valid JPEG files with authentic magic bytes", () => {
    // JPEG signature: FF D8 FF
    const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
    const res = validateImageBuffer(jpegHeader, "image/jpeg");
    expect(res.valid).toBe(true);
    expect(res.format).toBe("jpeg");
    expect(res.mime).toBe("image/jpeg");
    expect(res.ext).toBe("jpg");
  });

  it("accepts valid WebP files with RIFF and WEBP signatures", () => {
    // RIFF (4 bytes) + file size (4 bytes) + WEBP (4 bytes)
    const webpHeader = Buffer.from([
      0x52, 0x49, 0x46, 0x46, 0x20, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
      0x56, 0x50, 0x38, 0x20,
    ]);
    const res = validateImageBuffer(webpHeader, "image/webp");
    expect(res.valid).toBe(true);
    expect(res.format).toBe("webp");
    expect(res.mime).toBe("image/webp");
    expect(res.ext).toBe("webp");
  });

  it("strictly rejects SVG content masquerading as an image", () => {
    const svgContent = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><script>alert(1)</script></svg>'
    );
    const res = validateImageBuffer(svgContent, "image/svg+xml");
    expect(res.valid).toBe(false);
    expect(res.error).toContain("SVG files are not permitted");
  });

  it("rejects XML files attempting SVG inclusion", () => {
    const xmlContent = Buffer.from(
      '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg></svg>'
    );
    const res = validateImageBuffer(xmlContent);
    expect(res.valid).toBe(false);
    expect(res.error).toContain("SVG files are not permitted");
  });

  it("rejects arbitrary text or executable binaries with invalid magic bytes", () => {
    const badBuffer = Buffer.from("MZ\x90\x00\x03\x00\x00\x00SomeWindowsExe");
    const res = validateImageBuffer(badBuffer, "image/png");
    expect(res.valid).toBe(false);
    expect(res.error).toContain("Invalid image file format");
  });
});

describe("Storage URL Ownership & Path Validation (validateStartupImageUrl)", () => {
  const originalEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const mockBaseUrl = "https://xyzcompany.supabase.co";
  const ownerId = "11111111-1111-1111-1111-111111111111";
  const foreignOwnerId = "22222222-2222-2222-2222-222222222222";

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = mockBaseUrl;
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalEnv;
  });

  it("accepts empty, undefined, or null URLs", () => {
    expect(validateStartupImageUrl("", ownerId).valid).toBe(true);
    expect(validateStartupImageUrl(null, ownerId).valid).toBe(true);
    expect(validateStartupImageUrl(undefined, ownerId).valid).toBe(true);
    expect(validateStartupImageUrl("   ", ownerId).valid).toBe(true);
  });

  it("accepts a valid public URL belonging to the submitting owner", () => {
    const validUrl = `${mockBaseUrl}/storage/v1/object/public/startup-images/${ownerId}/logo_abc.png`;
    const res = validateStartupImageUrl(validUrl, ownerId);
    expect(res.valid).toBe(true);
    expect(res.path).toBe(`${ownerId}/logo_abc.png`);
  });

  it("strictly rejects a URL belonging to a foreign user", () => {
    const foreignUrl = `${mockBaseUrl}/storage/v1/object/public/startup-images/${foreignOwnerId}/logo_abc.png`;
    const res = validateStartupImageUrl(foreignUrl, ownerId);
    expect(res.valid).toBe(false);
    expect(res.error).toContain("must belong to the startup owner's folder");
  });

  it("strictly rejects URLs from an untrusted / foreign host", () => {
    const evilHostUrl = `https://evil-attacker.com/storage/v1/object/public/startup-images/${ownerId}/logo_abc.png`;
    const res = validateStartupImageUrl(evilHostUrl, ownerId);
    expect(res.valid).toBe(false);
    expect(res.error).toContain("must belong to the startup owner's folder");
  });

  it("strictly rejects path traversal attempts (../, encoded dots, slashes)", () => {
    const traversal1 = `${mockBaseUrl}/storage/v1/object/public/startup-images/${ownerId}/../other/pic.png`;
    expect(validateStartupImageUrl(traversal1, ownerId).valid).toBe(false);
    expect(validateStartupImageUrl(traversal1, ownerId).error).toContain("traversal");

    const traversalEncodedDot = `${mockBaseUrl}/storage/v1/object/public/startup-images/${ownerId}/%2e%2e/other/pic.png`;
    expect(validateStartupImageUrl(traversalEncodedDot, ownerId).valid).toBe(false);

    const traversalBackslash = `${mockBaseUrl}/storage/v1/object/public/startup-images/${ownerId}\\..\\other\\pic.png`;
    expect(validateStartupImageUrl(traversalBackslash, ownerId).valid).toBe(false);

    const traversalEncodedSlash = `${mockBaseUrl}/storage/v1/object/public/startup-images/${ownerId}%2f..%2fother%2fpic.png`;
    expect(validateStartupImageUrl(traversalEncodedSlash, ownerId).valid).toBe(false);
  });

  it("rejects invalid file names or extensions", () => {
    const badExtUrl = `${mockBaseUrl}/storage/v1/object/public/startup-images/${ownerId}/malware.exe`;
    expect(validateStartupImageUrl(badExtUrl, ownerId).valid).toBe(false);

    const nestedFolderUrl = `${mockBaseUrl}/storage/v1/object/public/startup-images/${ownerId}/subfolder/logo.png`;
    expect(validateStartupImageUrl(nestedFolderUrl, ownerId).valid).toBe(false);
  });
});

describe("Storage Image Deletion (deleteStartupImage)", () => {
  const originalEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const mockBaseUrl = "https://xyzcompany.supabase.co";
  const ownerId = "11111111-1111-1111-1111-111111111111";
  const foreignOwnerId = "22222222-2222-2222-2222-222222222222";

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = mockBaseUrl;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalEnv;
  });

  it("refuses to delete a path belonging to another user", async () => {
    const foreignPath = `${foreignOwnerId}/target_image.png`;
    const res = await deleteStartupImage(foreignPath, ownerId);
    expect(res).toBe(false);

    const foreignUrl = `${mockBaseUrl}/storage/v1/object/public/startup-images/${foreignOwnerId}/target_image.png`;
    const resUrl = await deleteStartupImage(foreignUrl, ownerId);
    expect(resUrl).toBe(false);
  });

  it("refuses to delete a path containing directory traversal", async () => {
    const traversalPath = `../${foreignOwnerId}/secret.png`;
    const res = await deleteStartupImage(traversalPath, ownerId);
    expect(res).toBe(false);

    const encodedTraversal = `${ownerId}/%2e%2e/pic.png`;
    const res2 = await deleteStartupImage(encodedTraversal, ownerId);
    expect(res2).toBe(false);
  });

  it("skips deletion if another startups row still references the image URL", async () => {
    const targetUrl = `${mockBaseUrl}/storage/v1/object/public/startup-images/${ownerId}/shared_logo.png`;

    // Mock db.select().from().where().limit() returning another startup row referencing this image
    const mockLimit = vi.fn().mockResolvedValue([{ id: "another-startup-uuid" }]);
    const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle mock in unit test
    vi.spyOn(db, "select").mockReturnValue({ from: mockFrom } as any);

    const res = await deleteStartupImage(targetUrl, ownerId, "current-startup-uuid");
    expect(res).toBe(false);
  });
});

describe("Startup Submission & Edit Image Ownership Enforcement", () => {
  const originalEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const mockBaseUrl = "https://xyzcompany.supabase.co";
  const founderId = "11111111-1111-1111-1111-111111111111";
  const foreignId = "22222222-2222-2222-2222-222222222222";
  const adminId = "99999999-9999-9999-9999-999999999999";

  const validStartupData = {
    name: "Acme Analytics",
    ideaTitle: "AI Powered Intelligence",
    tagline: "High speed business analytics",
    description: "A complete platform for modern high speed business analytics across teams.",
    category: "DeepTech" as const,
    countryCode: "US",
    stage: "MVP" as const,
    month: "2026-10-01",
  };

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = mockBaseUrl;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalEnv;
  });

  it("rejects foreign-user thumbnail URL on createStartup", async () => {
    const foreignThumbnail = `${mockBaseUrl}/storage/v1/object/public/startup-images/${foreignId}/logo.png`;
    await expect(
      createStartup(
        {
          ...validStartupData,
          thumbnail: foreignThumbnail,
        },
        founderId
      )
    ).rejects.toThrow("Invalid thumbnail: Image URL must belong to the startup owner's folder");
  });

  it("rejects foreign-user coverImage URL on createStartup", async () => {
    const foreignCover = `${mockBaseUrl}/storage/v1/object/public/startup-images/${foreignId}/banner.png`;
    await expect(
      createStartup(
        {
          ...validStartupData,
          coverImage: foreignCover,
        },
        founderId
      )
    ).rejects.toThrow("Invalid cover image: Image URL must belong to the startup owner's folder");
  });

  it("rejects foreign-user thumbnail URL on updateStartup", async () => {
    // Mock db.select().from().where().limit() returning the existing startup owned by founderId
    const mockLimit = vi.fn().mockResolvedValue([
      {
        id: "startup-123",
        ownerId: founderId,
        status: "pending",
        thumbnail: "",
        coverImage: "",
      },
    ]);
    const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle mock in unit test
    vi.spyOn(db, "select").mockReturnValue({ from: mockFrom } as any);

    const foreignThumbnail = `${mockBaseUrl}/storage/v1/object/public/startup-images/${foreignId}/logo.png`;
    await expect(
      updateStartup(
        "startup-123",
        {
          name: "Acme Updated",
          thumbnail: foreignThumbnail,
        },
        founderId,
        false
      )
    ).rejects.toThrow("Invalid thumbnail: Image URL must belong to the startup owner's folder");
  });

  it("admin editing startup uses existing startup ownerId for image validation", async () => {
    // Mock db.select returning existing startup owned by founderId
    const mockLimit = vi.fn().mockResolvedValue([
      {
        id: "startup-123",
        ownerId: founderId,
        status: "pending",
        thumbnail: "",
        coverImage: "",
      },
    ]);
    const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle mock in unit test
    vi.spyOn(db, "select").mockReturnValue({ from: mockFrom } as any);

    // If admin tries to supply an image from admin's own folder, it is rejected because image must belong to the startup owner
    const adminOwnedUrl = `${mockBaseUrl}/storage/v1/object/public/startup-images/${adminId}/admin_pic.png`;
    await expect(
      updateStartup(
        "startup-123",
        {
          name: "Admin Edited",
          thumbnail: adminOwnedUrl,
        },
        adminId,
        true
      )
    ).rejects.toThrow("Invalid thumbnail: Image URL must belong to the startup owner's folder");
  });
});
