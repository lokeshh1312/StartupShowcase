import { describe, it, expect } from "vitest";
import { validateImageBuffer, MAX_IMAGE_SIZE_BYTES } from "@/server/storage";

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
