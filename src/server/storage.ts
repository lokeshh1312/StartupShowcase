import "server-only";
import { randomUUID } from "crypto";
import { eq, or, and, ne } from "drizzle-orm";
import { db } from "@/db";
import { startups } from "@/db/schema";
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
 * Validates that an image URL is either empty or belongs strictly to the expected owner's folder
 * in the startup-images bucket of our Supabase instance.
 * Strictly rejects any traversal (../, %2e, encoded slashes) or foreign hosts.
 */
export function validateStartupImageUrl(
  url?: string | null,
  expectedOwnerId?: string
): { valid: boolean; error?: string; path?: string } {
  if (!url || !url.trim()) {
    return { valid: true };
  }

  const trimmed = url.trim();

  // 1. Path traversal checks
  if (
    trimmed.includes("..") ||
    trimmed.toLowerCase().includes("%2e") ||
    trimmed.toLowerCase().includes("%2f") ||
    trimmed.toLowerCase().includes("%5c") ||
    trimmed.includes("\\")
  ) {
    return { valid: false, error: "Invalid image URL: Path traversal is not permitted." };
  }

  if (!expectedOwnerId) {
    return { valid: false, error: "Owner verification required for image URL validation." };
  }

  // 2. Expected prefix based on NEXT_PUBLIC_SUPABASE_URL + /storage/v1/object/public/startup-images/<expectedOwnerId>/
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const expectedPrefix = `${supabaseUrl}/storage/v1/object/public/startup-images/${expectedOwnerId}/`;
  const devMockPrefix = `/storage-mock/${expectedOwnerId}/`;

  let remainder = "";
  if (trimmed.startsWith(expectedPrefix)) {
    remainder = trimmed.slice(expectedPrefix.length);
  } else if (process.env.NODE_ENV !== "production" && trimmed.startsWith(devMockPrefix)) {
    remainder = trimmed.slice(devMockPrefix.length);
  } else {
    return {
      valid: false,
      error: "Image URL must belong to the startup owner's folder in the startup-images bucket.",
    };
  }

  // 3. Object name must be a single filename (e.g. uuid.ext) with allowed extension
  if (!/^[a-zA-Z0-9_-]+\.(png|jpe?g|webp)$/i.test(remainder)) {
    return {
      valid: false,
      error: "Invalid image object name format.",
    };
  }

  return { valid: true, path: `${expectedOwnerId}/${remainder}` };
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
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Missing required production environment variable: SUPABASE_SERVICE_ROLE_KEY"
      );
    }
    // If running in development without service-role key (offline dev mock)
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
 * Refuses deletion if path does not belong to expectedOwnerId or if another startups row still references the URL.
 */
export async function deleteStartupImage(
  urlOrPath: string | null | undefined,
  expectedOwnerId: string,
  currentStartupId?: string
): Promise<boolean> {
  if (!urlOrPath || !expectedOwnerId) return false;

  const trimmed = urlOrPath.trim();

  // 1. Traversal check
  if (
    trimmed.includes("..") ||
    trimmed.toLowerCase().includes("%2e") ||
    trimmed.toLowerCase().includes("%2f") ||
    trimmed.toLowerCase().includes("%5c") ||
    trimmed.includes("\\")
  ) {
    console.warn("[deleteStartupImage] Refused deletion due to traversal in path/URL:", trimmed);
    return false;
  }

  // 2. Extract object path and verify first segment equals expectedOwnerId
  let objectPath = "";
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/storage-mock/")
  ) {
    const validation = validateStartupImageUrl(trimmed, expectedOwnerId);
    if (!validation.valid || !validation.path) {
      console.warn("[deleteStartupImage] Refused deletion:", validation.error);
      return false;
    }
    objectPath = validation.path;
  } else {
    // Direct path format: e.g. "<ownerId>/<filename>.<ext>"
    const segments = trimmed.split("/");
    if (segments.length !== 2 || segments[0] !== expectedOwnerId) {
      console.warn("[deleteStartupImage] Refused deletion: path first segment does not match expectedOwnerId.");
      return false;
    }
    if (!/^[a-zA-Z0-9_-]+\.(png|jpe?g|webp)$/i.test(segments[1])) {
      console.warn("[deleteStartupImage] Refused deletion: invalid filename format.");
      return false;
    }
    objectPath = `${segments[0]}/${segments[1]}`;
  }

  // 3. Check if another startups row still references this image
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const publicUrl = supabaseUrl
    ? `${supabaseUrl}/storage/v1/object/public/startup-images/${objectPath}`
    : "";
  const mockUrl = `/storage-mock/${objectPath}`;

  const candidates = Array.from(
    new Set([trimmed, objectPath, publicUrl, mockUrl])
  ).filter((c) => Boolean(c && c.length > 0));

  const refConditions = candidates.flatMap((c) => [
    eq(startups.thumbnail, c),
    eq(startups.coverImage, c),
  ]);

  const queryConditions = [or(...refConditions)];
  if (currentStartupId) {
    queryConditions.push(ne(startups.id, currentStartupId));
  }

  try {
    const existingRef = await db
      .select({ id: startups.id })
      .from(startups)
      .where(and(...queryConditions))
      .limit(1);

    if (existingRef.length > 0) {
      // Another startup still references this image, preserve it
      return false;
    }
  } catch (err: unknown) {
    console.warn("[deleteStartupImage Reference Check Warning]:", err);
    // If DB check fails, skip deletion safely to prevent data loss
    return false;
  }

  const admin = getStorageAdmin();
  if (!admin) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Missing required production environment variable: SUPABASE_SERVICE_ROLE_KEY");
    }
    return true;
  }

  try {
    const { error } = await admin.storage
      .from("startup-images")
      .remove([objectPath]);

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
