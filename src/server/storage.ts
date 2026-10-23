import "server-only";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

export type AllowedImageFormat = "png" | "jpeg" | "webp";

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  format?: AllowedImageFormat;
  mime?: string;
  ext?: string;
}

/**
 * Validates the file buffer against file size, MIME type, and real magic-byte file signatures.
 * Strictly rejects SVGs, scripts, and non-supported formats.
 */
export function validateImageBuffer(
  buffer: Buffer | Uint8Array,
  declaredMime?: string
): ImageValidationResult {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: "The provided file is empty." };
  }

  if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds the 2 MB limit (received ${(buffer.length / (1024 * 1024)).toFixed(2)} MB).`,
    };
  }

  // 1. Explicitly reject SVG signatures (text-based XML/SVG)
  const headerSlice = buffer.slice(0, 512).toString("utf-8").toLowerCase();
  if (
    headerSlice.includes("<svg") ||
    headerSlice.includes("<?xml") ||
    headerSlice.includes("<!doctype svg") ||
    declaredMime?.toLowerCase().includes("svg")
  ) {
    return {
      valid: false,
      error: "SVG files are not permitted for security reasons. Please upload PNG, JPEG, or WebP.",
    };
  }

  // 2. Magic-byte signature checking
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const isPng =
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;

  if (isPng) {
    return {
      valid: true,
      format: "png",
      mime: "image/png",
      ext: "png",
    };
  }

  // JPEG: FF D8 FF
  const isJpeg =
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff;

  if (isJpeg) {
    return {
      valid: true,
      format: "jpeg",
      mime: "image/jpeg",
      ext: "jpg",
    };
  }

  // WebP: RIFF (bytes 0-3: 52 49 46 46) and WEBP (bytes 8-11: 57 45 42 50)
  const isWebp =
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50;

  if (isWebp) {
    return {
      valid: true,
      format: "webp",
      mime: "image/webp",
      ext: "webp",
    };
  }

  return {
    valid: false,
    error: "Invalid image file format. Only valid PNG, JPEG, and WebP images are allowed.",
  };
}

/**
 * Extracts storage object path within the 'startup-images' bucket from a full URL or relative path.
 */
export function extractStoragePath(urlOrPath: string): string | null {
  if (!urlOrPath) return null;
  const trimmed = urlOrPath.trim();
  const marker = "/startup-images/";
  const idx = trimmed.indexOf(marker);
  if (idx !== -1) {
    return trimmed.slice(idx + marker.length);
  }
  // If it's already a clean path like "<uid>/<uuid>.png"
  if (/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.[a-z]{3,4}$/i.test(trimmed)) {
    return trimmed;
  }
  return null;
}

function getStorageAdmin() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

/**
 * Uploads a validated startup image buffer to Supabase Storage 'startup-images' bucket.
 * Generates the object name automatically using a secure UUID and real detected extension.
 */
export async function uploadStartupImage(
  buffer: Buffer | Uint8Array,
  userId: string,
  declaredMime?: string
): Promise<{ url: string; path: string }> {
  const validation = validateImageBuffer(buffer, declaredMime);
  if (!validation.valid || !validation.ext || !validation.mime) {
    throw new Error(validation.error || "Image validation failed.");
  }

  // Generate safe random object name: <userId>/<randomUUID>.<ext>
  const objectPath = `${userId}/${randomUUID()}.${validation.ext}`;
  const admin = getStorageAdmin();

  if (!admin) {
    // If running in an environment without service-role key (e.g. offline dev mock)
    const mockUrl = `/storage-mock/${objectPath}`;
    return { url: mockUrl, path: objectPath };
  }

  const { error } = await admin.storage
    .from("startup-images")
    .upload(objectPath, buffer, {
      contentType: validation.mime,
      upsert: false,
    });

  if (error) {
    console.error("[Storage Upload Error]:", error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  const { data: publicData } = admin.storage
    .from("startup-images")
    .getPublicUrl(objectPath);

  return {
    url: publicData.publicUrl,
    path: objectPath,
  };
}

/**
 * Deletes an old or orphaned storage object from the 'startup-images' bucket.
 * Does not throw if file does not exist or deletion fails.
 */
export async function deleteStartupImage(urlOrPath?: string | null): Promise<boolean> {
  if (!urlOrPath) return false;
  const path = extractStoragePath(urlOrPath);
  if (!path) return false;

  const admin = getStorageAdmin();
  if (!admin) return true;

  try {
    const { error } = await admin.storage
      .from("startup-images")
      .remove([path]);

    if (error) {
      console.warn("[Storage Delete Warning]:", error.message);
      return false;
    }
    return true;
  } catch (err: unknown) {
    console.warn("[Storage Delete Exception]:", err);
    return false;
  }
}
