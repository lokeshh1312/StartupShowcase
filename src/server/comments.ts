import { sql, eq } from "drizzle-orm";
import { db } from "@/db";
import { startupComments, auditLog, profiles } from "@/db/schema";
import type { StartupComment } from "@/db/schema";

export interface SpamCheckResult {
  valid: boolean;
  error?: string;
}

/**
 * Pure heuristic checks for comment spam:
 * 1. Maximum length: 1,500 characters
 * 2. More than 2 links rejected
 * 3. More than 30% uppercase on long comments (> 50 chars)
 */
export function validateCommentSpam(content: string): SpamCheckResult {
  const trimmed = content.trim();

  if (!trimmed) {
    return { valid: false, error: "Comment cannot be empty." };
  }

  if (trimmed.length > 1500) {
    return {
      valid: false,
      error: "Comments must not exceed 1,500 characters.",
    };
  }

  // Check link count (http://, https://, or www.)
  const linkMatches = trimmed.match(/(?:https?:\/\/|www\.)[^\s]+/gi) || [];
  if (linkMatches.length > 2) {
    return {
      valid: false,
      error: "Comments may not contain more than 2 links.",
    };
  }

  // Check uppercase ratio on long comments (> 50 chars)
  if (trimmed.length > 50) {
    const letters = trimmed.match(/[a-zA-Z]/g) || [];
    if (letters.length >= 20) {
      const uppercase = trimmed.match(/[A-Z]/g) || [];
      const ratio = uppercase.length / letters.length;
      if (ratio > 0.3) {
        return {
          valid: false,
          error: "Please avoid using excessive capital letters.",
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Checks if the user already posted identical comment text in the past 10 minutes.
 */
export async function isDuplicateComment(
  userId: string,
  content: string
): Promise<boolean> {
  const trimmed = content.trim();
  const rows = await db.execute<{ id: string }>(sql`
    SELECT id
    FROM public.startup_comments
    WHERE user_id = ${userId}::uuid
      AND content = ${trimmed}
      AND created_at >= (now() - interval '10 minutes')
    LIMIT 1
  `);
  return rows.length > 0;
}

/**
 * Hide a comment (admin only).
 * Reads the true previous status BEFORE updating inside a transaction,
 * updates status to 'hidden', and writes to audit_log with the previous status.
 */
export async function hideComment(
  commentId: string,
  adminId: string
): Promise<StartupComment | null> {
  // Verify admin privileges
  const adminProfile = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, adminId))
    .limit(1);

  if (!adminProfile[0] || adminProfile[0].role !== "admin") {
    throw new Error("Forbidden: Admin privileges required to moderate comments.");
  }

  return await db.transaction(async (tx) => {
    // 1. Read existing comment before modification
    const existing = await tx
      .select({ id: startupComments.id, status: startupComments.status })
      .from(startupComments)
      .where(eq(startupComments.id, commentId))
      .limit(1);

    if (!existing[0]) {
      return null;
    }

    const previousStatus = existing[0].status;

    // 2. Update status to hidden
    const [updated] = await tx
      .update(startupComments)
      .set({ status: "hidden" })
      .where(eq(startupComments.id, commentId))
      .returning();

    // 3. Write to audit_log with true previous status
    if (updated) {
      await tx.insert(auditLog).values({
        actorId: adminId,
        action: "hide_comment",
        targetType: "comment",
        targetId: updated.id,
        metadata: { previousStatus, newStatus: "hidden" },
      });
    }

    return updated || null;
  });
}
