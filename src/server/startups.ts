import "server-only";
import { eq, and, sql, desc, SQL, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  startups,
  startupVotes,
  savedStartups,
  startupComments,
  profiles,
  auditLog,
  payments,
  type Startup,
} from "@/db/schema";
import {
  createStartupSchema,
  updateStartupSchema,
  listStartupsFilterSchema,
  moderateStartupSchema,
  addCommentSchema,
  normalizeMonthToDate,
  formatMonthLabel,
  CATEGORIES,
  getCountryName,
  type CreateStartupInput,
  type ListStartupsFilters,
} from "@/lib/validation";
import { buildSafePrefixTsQuery } from "@/lib/search";
import { toUtcDateString } from "@/lib/dates";
import { headers } from "next/headers";
import { checkRateLimit, extractClientIp, RATE_LIMIT_MESSAGE } from "@/server/rate-limit";
import { isBotOrPrefetchFromHeaders, computeViewerHash } from "@/server/views";
import { checkStartupDuplicate, type DuplicateWarning } from "@/server/duplicates";
import { validateCommentSpam, isDuplicateComment } from "@/server/comments";
import { deleteStartupImage, validateStartupImageUrl } from "@/server/storage";
import {
  sendSubmissionApprovedEmail,
  sendSubmissionRejectedEmail,
  fireAndForgetEmail,
} from "@/server/email";

// Re-export for existing consumers
export { buildSafePrefixTsQuery } from "@/lib/search";
export { hideComment } from "@/server/comments";

/**
 * Checks if a user has confirmed their email address in auth.users.
 */
export async function isUserEmailVerified(userId: string): Promise<boolean> {
  const rows = await db.execute<{ email_confirmed_at: string | null }>(sql`
    SELECT email_confirmed_at FROM auth.users WHERE id = ${userId}::uuid
  `);
  return Boolean(rows[0]?.email_confirmed_at);
}

export type FormattedStartup = Startup & {
  likes: number;
  views: number;
  isLiked?: boolean;
  isSaved?: boolean;
  rank?: number;
  paymentStatus?: "created" | "paid" | "failed" | "refunded" | "partially_refunded" | null;
  paymentAmountCents?: number | null;
  paymentAmountRefundedCents?: number | null;
  paymentCurrency?: string | null;
  razorpayPaymentId?: string | null;
  razorpayOrderId?: string | null;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function formatStartupRow(row: Record<string, unknown>): FormattedStartup {
  const views = Number(row.viewsCount ?? row.views_count ?? 0);
  const likes = Number(
    row.likes ?? row.vote_count ?? row.votes_count ?? 0
  );
  return {
    id: String(row.id),
    slug: String(row.slug),
    ownerId: (row.ownerId ?? row.owner_id ?? null) as string | null,
    status: (row.status ?? "approved") as "awaiting_payment" | "pending" | "approved" | "rejected",
    isSample: Boolean(row.isSample ?? row.is_sample),
    name: String(row.name || ""),
    ideaTitle: String(row.ideaTitle ?? row.idea_title ?? ""),
    tagline: String(row.tagline ?? ""),
    description: String(row.description ?? ""),
    fullStory: String(row.fullStory ?? row.full_story ?? ""),
    category: String(row.category ?? ""),
    countryCode: String(row.countryCode ?? row.country_code ?? "US").toUpperCase(),
    region: String(row.region ?? ""),
    city: String(row.city ?? ""),
    remoteFirst: Boolean(row.remoteFirst ?? row.remote_first),
    location: String(row.location ?? ""),
    stage: String(row.stage ?? "MVP"),
    month: String(row.month ?? ""),
    monthLabel: String(row.monthLabel ?? row.month_label ?? ""),
    websiteUrl: String(row.websiteUrl ?? row.website_url ?? ""),
    logoType: String(row.logoType ?? row.logo_type ?? "sprout"),
    logoColor: String(row.logoColor ?? row.logo_color ?? "#2563EB"),
    thumbnail: String(row.thumbnail ?? ""),
    coverImage: String(row.coverImage ?? row.cover_image ?? ""),
    founderJson: (row.founderJson ?? row.founder_json ?? {}) as Startup["founderJson"],
    problem: String(row.problem ?? ""),
    solution: String(row.solution ?? ""),
    keyFeaturesJson: (row.keyFeaturesJson ?? row.key_features_json ?? []) as string[],
    techStackJson: (row.techStackJson ?? row.tech_stack_json ?? []) as string[],
    traction: String(row.traction ?? ""),
    viewsCount: views,
    reviewedBy: (row.reviewedBy ?? row.reviewed_by ?? null) as string | null,
    approvedAt: row.approvedAt ? new Date(row.approvedAt as string) : (row.approved_at ? new Date(row.approved_at as string) : null),
    createdAt: row.createdAt ? new Date(row.createdAt as string) : (row.created_at ? new Date(row.created_at as string) : new Date()),
    updatedAt: row.updatedAt ? new Date(row.updatedAt as string) : (row.updated_at ? new Date(row.updated_at as string) : new Date()),
    views,
    likes,
    isLiked: Boolean(row.isLiked ?? row.is_liked),
    isSaved: Boolean(row.isSaved ?? row.is_saved),
    rank: row.rank !== undefined ? Number(row.rank) : undefined,
    paymentStatus: (row.paymentStatus ?? row.payment_status ?? null) as FormattedStartup["paymentStatus"],
    paymentAmountCents: row.paymentAmountCents !== undefined ? Number(row.paymentAmountCents) : (row.payment_amount_cents !== undefined && row.payment_amount_cents !== null ? Number(row.payment_amount_cents) : null),
    paymentAmountRefundedCents: row.paymentAmountRefundedCents !== undefined ? Number(row.paymentAmountRefundedCents) : (row.payment_amount_refunded_cents !== undefined && row.payment_amount_refunded_cents !== null ? Number(row.payment_amount_refunded_cents) : null),
    paymentCurrency: (row.paymentCurrency ?? row.payment_currency ?? null) as string | null,
    razorpayPaymentId: (row.razorpayPaymentId ?? row.razorpay_payment_id ?? null) as string | null,
    razorpayOrderId: (row.razorpayOrderId ?? row.razorpay_order_id ?? null) as string | null,
  };
}

/**
 * List approved startups with filtering, prefix full-text search, sorting, and pagination
 */
export async function listStartups(
  rawFilters: ListStartupsFilters = {},
  currentUserId?: string
): Promise<PaginatedResult<FormattedStartup>> {
  const filter = listStartupsFilterSchema.parse(rawFilters);
  const page = filter.page;
  const pageSize = filter.pageSize;
  const offset = (page - 1) * pageSize;

  const conditions: SQL[] = [eq(startups.status, "approved")];

  if (filter.month && filter.month !== "All" && filter.month !== "all") {
    try {
      const monthDate = normalizeMonthToDate(filter.month);
      conditions.push(eq(startups.month, monthDate));
    } catch {
      // Ignore invalid month filter
    }
  }

  if (filter.category && filter.category !== "All" && filter.category !== "all") {
    conditions.push(eq(startups.category, filter.category));
  }

  if (filter.stage && filter.stage !== "All" && filter.stage !== "All Stages") {
    conditions.push(eq(startups.stage, filter.stage));
  }

  if (filter.countryCode && filter.countryCode !== "ALL") {
    conditions.push(eq(startups.countryCode, filter.countryCode.toUpperCase()));
  }

  if (typeof filter.remoteFirst === "boolean" && filter.remoteFirst) {
    conditions.push(eq(startups.remoteFirst, true));
  }

  if (filter.q) {
    const tsquery = buildSafePrefixTsQuery(filter.q);
    if (tsquery) {
      conditions.push(
        sql`startups.search_tsv @@ to_tsquery('english', ${tsquery})`
      );
    }
  }

  const whereClause = and(...conditions);

  // 1. Total matching count
  const countResult = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(startups)
    .where(whereClause);
  const total = countResult[0]?.total ?? 0;

  if (total === 0) {
    return { items: [], total: 0, page, pageSize, totalPages: 0 };
  }

  // 2. Determine sort order
  let orderByClause: SQL;
  switch (filter.sort) {
    case "views":
      orderByClause = sql`startups.views_count DESC, startups.name ASC`;
      break;
    case "alphabetical":
      orderByClause = sql`startups.name ASC`;
      break;
    case "recent":
      orderByClause = sql`startups.created_at DESC, startups.name ASC`;
      break;
    case "trending":
      orderByClause = sql`startups.views_count DESC, startups.created_at DESC`;
      break;
    case "votes":
    default:
      orderByClause = sql`COALESCE(vote_agg.count, 0) DESC, COALESCE(startups.approved_at, startups.created_at) ASC, startups.name ASC`;
      break;
  }

  // 3. Query items with vote count and optional user like/save
  const rows = await db.execute<
    Startup & {
      vote_count: string | number;
      is_liked?: boolean;
      is_saved?: boolean;
    }
  >(sql`
    SELECT
      startups.*,
      COALESCE(vote_agg.count, 0)::int AS vote_count
      ${
        currentUserId
          ? sql`,
            EXISTS(SELECT 1 FROM public.startup_votes v WHERE v.startup_id = startups.id AND v.user_id = ${currentUserId}::uuid) AS is_liked,
            EXISTS(SELECT 1 FROM public.saved_startups s WHERE s.startup_id = startups.id AND s.user_id = ${currentUserId}::uuid) AS is_saved`
          : sql``
      }
    FROM public.startups
    LEFT JOIN (
      SELECT v.startup_id, count(*)::int AS count
      FROM public.startup_votes v
      JOIN public.profiles voter ON voter.id = v.user_id AND voter.created_at <= (now() - interval '24 hours')
      GROUP BY v.startup_id
    ) vote_agg ON vote_agg.startup_id = startups.id
    WHERE ${whereClause}
    ORDER BY ${orderByClause}
    LIMIT ${pageSize} OFFSET ${offset}
  `);

  const items: FormattedStartup[] = rows.map((row) =>
    formatStartupRow(row as unknown as Record<string, unknown>)
  );

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Get a single startup by slug or id, with comments and deduplicated view tracking
 */
export async function getStartupBySlug(
  slugOrId: string,
  currentUserId?: string,
  viewerHash?: string
): Promise<{
  startup: FormattedStartup;
  comments: Array<{
    id: string;
    content: string;
    author: string;
    authorId: string;
    role: string;
    date: Date;
  }>;
} | null> {
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      slugOrId
    );

  const startupQuery = await db
    .select()
    .from(startups)
    .where(isUuid ? eq(startups.id, slugOrId) : eq(startups.slug, slugOrId))
    .limit(1);

  const startup = startupQuery[0];
  if (!startup) return null;

  // Deduplicated view tracking for approved, non-sample startups only
  let effectiveViewerHash = viewerHash;
  if (!effectiveViewerHash) {
    try {
      const h = await headers();
      if (!isBotOrPrefetchFromHeaders(h)) {
        const ip = extractClientIp(h);
        const userAgent = h.get("user-agent") || "";
        effectiveViewerHash = computeViewerHash(
          ip ?? "unknown",
          userAgent,
          toUtcDateString(new Date())
        );
      }
    } catch {
      // outside request context or headers not available
    }
  }

  if (effectiveViewerHash && startup.status === "approved" && !startup.isSample) {
    const dayStr = toUtcDateString(new Date());
    const inserted = await db.execute(sql`
      INSERT INTO public.startup_views (startup_id, viewer_hash, day)
      VALUES (${startup.id}::uuid, ${effectiveViewerHash}, ${dayStr}::date)
      ON CONFLICT (startup_id, viewer_hash, day) DO NOTHING
      RETURNING 1
    `);
    if (inserted.length > 0) {
      await db
        .update(startups)
        .set({ viewsCount: sql`${startups.viewsCount} + 1` })
        .where(eq(startups.id, startup.id));
      startup.viewsCount += 1;
    }
  }

  // Fetch vote count adhering strictly to the 24h profile rule
  const voteCountResult = await db.execute<{ count: number }>(sql`
    SELECT count(*)::int AS count
    FROM public.startup_votes v
    JOIN public.profiles voter ON voter.id = v.user_id AND voter.created_at <= (now() - interval '24 hours')
    WHERE v.startup_id = ${startup.id}::uuid
  `);
  const likes = voteCountResult[0]?.count ?? 0;

  // User state
  let isLiked = false;
  let isSaved = false;
  if (currentUserId) {
    const userVote = await db
      .select({ startupId: startupVotes.startupId })
      .from(startupVotes)
      .where(
        and(
          eq(startupVotes.startupId, startup.id),
          eq(startupVotes.userId, currentUserId)
        )
      )
      .limit(1);
    isLiked = userVote.length > 0;

    const userSave = await db
      .select({ startupId: savedStartups.startupId })
      .from(savedStartups)
      .where(
        and(
          eq(savedStartups.startupId, startup.id),
          eq(savedStartups.userId, currentUserId)
        )
      )
      .limit(1);
    isSaved = userSave.length > 0;
  }

  // Comments (visible only)
  const commentsResult = await db
    .select({
      id: startupComments.id,
      content: startupComments.content,
      createdAt: startupComments.createdAt,
      authorId: profiles.id,
      authorName: profiles.displayName,
      authorRole: profiles.role,
    })
    .from(startupComments)
    .leftJoin(profiles, eq(profiles.id, startupComments.userId))
    .where(
      and(
        eq(startupComments.startupId, startup.id),
        eq(startupComments.status, "visible")
      )
    )
    .orderBy(desc(startupComments.createdAt))
    .limit(100);

  const comments = commentsResult.map((c) => ({
    id: c.id,
    content: c.content,
    author: c.authorName || "Community Member",
    authorId: c.authorId || "",
    role: c.authorRole || "community",
    date: c.createdAt,
  }));

  return {
    startup: {
      ...startup,
      views: startup.viewsCount,
      likes,
      isLiked,
      isSaved,
    },
    comments,
  };
}

/**
 * Get monthly leaderboard ranked in SQL with tie-breaks (earlier approval first, then name)
 */
export async function getLeaderboard(
  monthInput: string | Date,
  page = 1,
  pageSize = 20
): Promise<
  PaginatedResult<
    FormattedStartup & { rank: number; votesCount: number }
  > & { month: string; monthLabel: string }
> {
  const monthDate = normalizeMonthToDate(monthInput);
  const monthLabel = formatMonthLabel(monthDate);
  const offset = (page - 1) * pageSize;

  const countResult = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(startups)
    .where(
      and(
        eq(startups.status, "approved"),
        eq(startups.month, monthDate)
      )
    );
  const total = countResult[0]?.total ?? 0;

  if (total === 0) {
    return {
      items: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
      month: monthDate,
      monthLabel,
    };
  }

  const rows = await db.execute<
    Startup & {
      rank: string | number;
      votes_count: string | number;
    }
  >(sql`
    SELECT *
    FROM public.monthly_leaderboard(${monthDate}::date)
    LIMIT ${pageSize} OFFSET ${offset}
  `);

  const items = rows.map((r) => {
    const formatted = formatStartupRow(r as unknown as Record<string, unknown>);
    return {
      ...formatted,
      votesCount: formatted.likes,
      rank: Number(r.rank),
    };
  });

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    month: monthDate,
    monthLabel,
  };
}

/**
 * List distinct launch months present in the database, ordered chronologically descending
 */
export async function listMonths(): Promise<
  Array<{ id: string; label: string; date: string; count: number }>
> {
  const rows = await db.execute<{
    month: string;
    month_label: string;
    count: string | number;
  }>(sql`
    SELECT
      month::text AS month,
      month_label,
      count(*)::int AS count
    FROM public.startups
    WHERE status = 'approved'
    GROUP BY month, month_label
    ORDER BY month DESC
  `);

  return rows.map((r) => ({
    id: r.month,
    label: r.month_label || formatMonthLabel(r.month),
    date: r.month,
    count: Number(r.count),
  }));
}

/**
 * List startup categories with approved startup counts
 */
export async function listCategories(): Promise<
  Array<{ id: string; name: string; count: number }>
> {
  const rows = await db.execute<{
    category: string;
    count: string | number;
  }>(sql`
    SELECT
      category,
      count(*)::int AS count
    FROM public.startups
    WHERE status = 'approved'
    GROUP BY category
    ORDER BY category ASC
  `);

  const countsMap = new Map(rows.map((r) => [r.category, Number(r.count)]));

  return CATEGORIES.map((cat) => ({
    id: cat,
    name: cat,
    count: countsMap.get(cat) || 0,
  }));
}

/**
 * Create a new startup submission (validated with zod, status 'awaiting_payment')
 */
export async function createStartup(
  input: CreateStartupInput,
  userId: string
): Promise<Startup> {
  const validated = createStartupSchema.parse(input);

  // Validate image URLs belong strictly to submitting founder's storage folder
  if (validated.thumbnail) {
    const thumbVal = validateStartupImageUrl(validated.thumbnail, userId);
    if (!thumbVal.valid) {
      throw new Error(`Invalid thumbnail: ${thumbVal.error}`);
    }
  }
  if (validated.coverImage) {
    const coverVal = validateStartupImageUrl(validated.coverImage, userId);
    if (!coverVal.valid) {
      throw new Error(`Invalid cover image: ${coverVal.error}`);
    }
  }

  // 1. Enforce verified founder
  const isVerified = await isUserEmailVerified(userId);
  if (!isVerified) {
    throw new Error("Please verify your email first.");
  }

  // 2. Enforce at most 3 awaiting_payment submissions per user at a time
  const awaitingCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(startups)
    .where(
      and(
        eq(startups.ownerId, userId),
        eq(startups.status, "awaiting_payment")
      )
    );
  if ((awaitingCount[0]?.count ?? 0) >= 3) {
    throw new Error(
      "You have reached the limit of 3 unpaid submissions. Please complete or delete existing unpaid submissions before creating a new one."
    );
  }

  // 3. Enforce at most 5 pending submissions per user
  const pendingCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(startups)
    .where(
      and(
        eq(startups.ownerId, userId),
        eq(startups.status, "pending")
      )
    );
  if ((pendingCount[0]?.count ?? 0) >= 5) {
    throw new Error(
      "You have reached the limit of 5 pending submissions awaiting review."
    );
  }

  // Generate unique slug — retry on unique violation instead of check-then-insert
  const baseSlug =
    validated.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "startup";

  // Placeholder month: server sets final month at approval time.
  // Use current UTC month as a temporary value.
  const now = new Date();
  const tempMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
  const tempMonthLabel = formatMonthLabel(tempMonth);

  const maxRetries = 5;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
    try {
      const [created] = await db
        .insert(startups)
        .values({
          slug,
          ownerId: userId,
          status: "awaiting_payment",
          isSample: false,
          name: validated.name,
          ideaTitle: validated.ideaTitle,
          tagline: validated.tagline,
          description: validated.description,
          fullStory: validated.fullStory,
          category: validated.category,
          countryCode: validated.countryCode,
          region: validated.region,
          city: validated.city,
          remoteFirst: validated.remoteFirst,
          location: validated.location,
          stage: validated.stage,
          month: tempMonth,
          monthLabel: tempMonthLabel,
          websiteUrl: validated.websiteUrl || "",
          logoType: validated.logoType,
          logoColor: validated.logoColor,
          thumbnail: validated.thumbnail || "",
          coverImage: validated.coverImage || "",
          founderJson: validated.founder,
          problem: validated.problem,
          solution: validated.solution,
          keyFeaturesJson: validated.keyFeatures,
          techStackJson: validated.techStack,
          traction: validated.traction,
          viewsCount: 0,
        })
        .returning();

      return created;
    } catch (err: unknown) {
      // Retry on unique violation (PostgreSQL error code 23505)
      const pgErr = err as { code?: string };
      if (pgErr.code === "23505" && attempt < maxRetries - 1) {
        continue;
      }
      throw err;
    }
  }

  throw new Error("Failed to generate a unique slug after multiple attempts.");
}

/**
 * Moderate a startup (approve, reject, pending) - admin only.
 * Verifies the reviewer is an admin, reads previous status BEFORE updating
 * inside a transaction, and logs the true previous status.
 * When approving, sets the launch month to the UTC month of the approval time.
 * Fires transactional emails to the founder upon approval or rejection.
 */
export async function moderateStartup(
  idOrSlug: string,
  rawStatus: "approved" | "rejected" | "pending",
  reviewerId: string,
  rejectionReason?: string
): Promise<Startup | null> {
  const { status } = moderateStartupSchema.parse({ status: rawStatus });

  // Verify the reviewer is an admin
  const reviewerProfile = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, reviewerId))
    .limit(1);

  if (!reviewerProfile[0] || reviewerProfile[0].role !== "admin") {
    throw new Error("Forbidden: only admins can moderate startups.");
  }

  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      idOrSlug
    );

  // Use a transaction: read previous status BEFORE updating
  const result = await db.transaction(async (tx) => {
    // 1. Read the current state
    const existing = await tx
      .select({ id: startups.id, status: startups.status })
      .from(startups)
      .where(isUuid ? eq(startups.id, idOrSlug) : eq(startups.slug, idOrSlug))
      .limit(1);

    if (!existing[0]) return null;

    const previousStatus = existing[0].status;
    const approvalTime = status === "approved" ? new Date() : null;

    // 2. Build the update set
    const updateSet: Record<string, unknown> = {
      status,
      reviewedBy: reviewerId,
      updatedAt: new Date(),
      approvedAt: approvalTime,
    };

    // When approving, set the launch month to the UTC month of approval
    if (status === "approved" && approvalTime) {
      const approvalMonth = `${approvalTime.getUTCFullYear()}-${String(approvalTime.getUTCMonth() + 1).padStart(2, "0")}-01`;
      updateSet.month = approvalMonth;
      updateSet.monthLabel = formatMonthLabel(approvalMonth);
    }

    // 3. Perform the update
    const [updated] = await tx
      .update(startups)
      .set(updateSet)
      .where(eq(startups.id, existing[0].id))
      .returning();

    // 4. Audit log with the TRUE previous status
    if (updated) {
      await tx.insert(auditLog).values({
        actorId: reviewerId,
        action: `startup.status_change:${status}`,
        targetType: "startup",
        targetId: updated.id,
        metadata: {
          previous_status: previousStatus,
          new_status: status,
          rejection_reason: rejectionReason || null,
        },
      });

      // Notify the founder if approved or rejected
      if (updated.ownerId && (status === "approved" || status === "rejected")) {
        const founderRows = await tx.execute<{ email: string; display_name: string }>(sql`
          SELECT u.email, p.display_name
          FROM auth.users u
          JOIN public.profiles p ON p.id = u.id
          WHERE u.id = ${updated.ownerId}::uuid
        `);
        const founderEmail = founderRows[0]?.email;
        const founderName = founderRows[0]?.display_name || updated.name;

        if (founderEmail) {
          if (status === "approved") {
            fireAndForgetEmail(
              sendSubmissionApprovedEmail({
                to: founderEmail,
                founderName,
                startupName: updated.name,
                startupSlug: updated.slug,
              })
            );
          } else if (status === "rejected") {
            fireAndForgetEmail(
              sendSubmissionRejectedEmail({
                to: founderEmail,
                founderName,
                startupName: updated.name,
                reason: rejectionReason,
              })
            );
          }
        }
      }
    }

    return updated || null;
  });

  return result;
}

/**
 * Delete a startup and clean up any associated storage objects.
 * Owner can only delete awaiting_payment startups. Paid startups cannot be deleted by owner (contact support).
 */
export async function deleteStartup(
  startupId: string,
  userId: string,
  isAdmin: boolean = false
): Promise<boolean> {
  const [existing] = await db
    .select({
      id: startups.id,
      ownerId: startups.ownerId,
      status: startups.status,
      thumbnail: startups.thumbnail,
      coverImage: startups.coverImage,
    })
    .from(startups)
    .where(eq(startups.id, startupId))
    .limit(1);

  if (!existing) return false;

  // Only owner or admin can delete
  if (existing.ownerId !== userId && !isAdmin) {
    throw new Error("Forbidden: You cannot delete this startup.");
  }

  // Block deleting a startup (any caller, incl. admin and server) that has a payments row with status paid or refunded
  const startupPayments = await db
    .select({
      id: payments.id,
      status: payments.status,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .where(eq(payments.startupId, startupId));

  const hasPaidOrRefunded = startupPayments.some(
    (p) => p.status === "paid" || p.status === "refunded"
  );
  if (hasPaidOrRefunded) {
    throw new Error(
      "Startups with paid or refunded payments cannot be deleted. Paid startups can be rejected but not deleted."
    );
  }

  // Non-admins can only delete awaiting_payment startups
  if (!isAdmin && existing.status !== "awaiting_payment") {
    throw new Error(
      "Only unpaid draft submissions awaiting payment can be deleted."
    );
  }

  // If payment records exist for this draft, verify they satisfy the cleanup rule (status created/failed and > 7 days old)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentPayments = startupPayments.filter(
    (p) => p.createdAt > sevenDaysAgo
  );
  if (recentPayments.length > 0) {
    throw new Error(
      "This draft has a checkout in progress. Please try again in 7 days or contact support."
    );
  }

  // Delete eligible draft payments (> 7 days old created/failed) via the cleanup rule
  if (startupPayments.length > 0) {
    await db
      .delete(payments)
      .where(
        and(
          eq(payments.startupId, startupId),
          inArray(payments.status, ["created", "failed"]),
          sql`${payments.createdAt} < (now() - interval '7 days')`
        )
      );
  }

  const targetOwnerId = existing.ownerId || userId;

  await db.delete(startups).where(eq(startups.id, startupId));

  // Delete orphaned images from storage (checking targetOwnerId and references)
  if (existing.thumbnail) {
    deleteStartupImage(existing.thumbnail, targetOwnerId, startupId).catch(() => {});
  }
  if (existing.coverImage && existing.coverImage !== existing.thumbnail) {
    deleteStartupImage(existing.coverImage, targetOwnerId, startupId).catch(() => {});
  }

  // Audit log
  await db.insert(auditLog).values({
    actorId: userId,
    action: "startup.deleted",
    targetType: "startup",
    targetId: startupId,
    metadata: { status: existing.status },
  });

  return true;
}

/**
 * Update an existing startup and clean up replaced storage images.
 * Allowed for owner when pending or awaiting_payment. Edits after payment stay free.
 */
export async function updateStartup(
  startupId: string,
  input: unknown,
  userId: string,
  isAdmin: boolean = false
): Promise<Startup> {
  const [existing] = await db
    .select()
    .from(startups)
    .where(eq(startups.id, startupId))
    .limit(1);

  if (!existing) {
    throw new Error("Startup not found.");
  }

  if (existing.ownerId !== userId && !isAdmin) {
    throw new Error("Forbidden: You cannot edit this startup.");
  }

  if (!isAdmin && existing.status !== "pending" && existing.status !== "awaiting_payment") {
    throw new Error("Only pending or awaiting payment submissions can be edited.");
  }

  // Validate input
  const validated = updateStartupSchema.parse(input);

  // Admin editing a startup uses the startup's ownerId, not the admin's id.
  const targetOwnerId = existing.ownerId || userId;

  if (validated.thumbnail) {
    const thumbVal = validateStartupImageUrl(validated.thumbnail, targetOwnerId);
    if (!thumbVal.valid) {
      throw new Error(`Invalid thumbnail: ${thumbVal.error}`);
    }
  }
  if (validated.coverImage) {
    const coverVal = validateStartupImageUrl(validated.coverImage, targetOwnerId);
    if (!coverVal.valid) {
      throw new Error(`Invalid cover image: ${coverVal.error}`);
    }
  }

  // If thumbnail changed, clean up previous thumbnail
  if (validated.thumbnail && validated.thumbnail !== existing.thumbnail && existing.thumbnail) {
    deleteStartupImage(existing.thumbnail, targetOwnerId, startupId).catch(() => {});
  }
  // If coverImage changed, clean up previous coverImage
  if (
    validated.coverImage &&
    validated.coverImage !== existing.coverImage &&
    existing.coverImage &&
    existing.coverImage !== existing.thumbnail
  ) {
    deleteStartupImage(existing.coverImage, targetOwnerId, startupId).catch(() => {});
  }

  const [updated] = await db
    .update(startups)
    .set({
      ...(validated.name ? { name: validated.name } : {}),
      ...(validated.ideaTitle ? { ideaTitle: validated.ideaTitle } : {}),
      ...(validated.tagline !== undefined ? { tagline: validated.tagline } : {}),
      ...(validated.description ? { description: validated.description } : {}),
      ...(validated.fullStory !== undefined ? { fullStory: validated.fullStory } : {}),
      ...(validated.category ? { category: validated.category } : {}),
      ...(validated.stage ? { stage: validated.stage } : {}),
      ...(validated.countryCode ? { countryCode: validated.countryCode } : {}),
      ...(validated.region !== undefined ? { region: validated.region } : {}),
      ...(validated.city !== undefined ? { city: validated.city } : {}),
      ...(validated.remoteFirst !== undefined ? { remoteFirst: validated.remoteFirst } : {}),
      ...(validated.location ? { location: validated.location } : {}),
      ...(validated.websiteUrl !== undefined ? { websiteUrl: validated.websiteUrl } : {}),
      ...(validated.logoType ? { logoType: validated.logoType } : {}),
      ...(validated.logoColor ? { logoColor: validated.logoColor } : {}),
      ...(validated.thumbnail !== undefined ? { thumbnail: validated.thumbnail } : {}),
      ...(validated.coverImage !== undefined ? { coverImage: validated.coverImage } : {}),
      ...(validated.founder ? { founderJson: validated.founder } : {}),
      ...(validated.problem !== undefined ? { problem: validated.problem } : {}),
      ...(validated.solution !== undefined ? { solution: validated.solution } : {}),
      ...(validated.keyFeatures ? { keyFeaturesJson: validated.keyFeatures } : {}),
      ...(validated.techStack ? { techStackJson: validated.techStack } : {}),
      ...(validated.traction !== undefined ? { traction: validated.traction } : {}),
      updatedAt: new Date(),
    })
    .where(eq(startups.id, startupId))
    .returning();

  return updated;
}

/**
 * Toggle vote on a startup
 */
export async function toggleVote(
  startupIdOrSlug: string,
  userId: string
): Promise<{ liked: boolean; likesCount: number }> {
  // 1. Enforce verified user
  const isVerified = await isUserEmailVerified(userId);
  if (!isVerified) {
    throw new Error("Please verify your email first.");
  }

  // 2. Enforce per-user rate limit: at most 30 vote toggles per hour
  const rateLimitRes = await checkRateLimit(`vote:user:${userId}`, 30, 3600);
  if (!rateLimitRes.allowed) {
    throw new Error(RATE_LIMIT_MESSAGE);
  }

  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      startupIdOrSlug
    );

  const startup = await db
    .select({ id: startups.id, status: startups.status, ownerId: startups.ownerId })
    .from(startups)
    .where(
      isUuid
        ? eq(startups.id, startupIdOrSlug)
        : eq(startups.slug, startupIdOrSlug)
    )
    .limit(1);

  if (!startup[0] || startup[0].status !== "approved") {
    throw new Error("Startup not found or not approved for voting.");
  }

  // 3. Founder self-vote restriction
  if (startup[0].ownerId && startup[0].ownerId === userId) {
    throw new Error("Founders cannot vote for their own startup.");
  }

  const startupId = startup[0].id;

  // Atomic toggle: INSERT ON CONFLICT DO NOTHING RETURNING inside one transaction
  const result = await db.transaction(async (tx) => {
    const inserted = await tx.execute<{ user_id: string }>(sql`
      INSERT INTO public.startup_votes (user_id, startup_id)
      VALUES (${userId}::uuid, ${startupId}::uuid)
      ON CONFLICT (user_id, startup_id) DO NOTHING
      RETURNING user_id
    `);

    let liked: boolean;
    if (inserted.length > 0) {
      // Row was inserted → vote created
      liked = true;
    } else {
      // Row already existed → remove vote
      await tx
        .delete(startupVotes)
        .where(
          and(
            eq(startupVotes.startupId, startupId),
            eq(startupVotes.userId, userId)
          )
        );
      liked = false;
    }

    const countResult = await tx.execute<{ count: number }>(sql`
      SELECT count(*)::int AS count
      FROM public.startup_votes v
      JOIN public.profiles voter ON voter.id = v.user_id AND voter.created_at <= (now() - interval '24 hours')
      WHERE v.startup_id = ${startupId}::uuid
    `);

    return {
      liked,
      likesCount: countResult[0]?.count ?? 0,
    };
  });

  return result;
}

/**
 * Toggle saving a startup to bookmarks
 */
export async function toggleSave(
  startupIdOrSlug: string,
  userId: string
): Promise<{ saved: boolean }> {
  // Enforce verified user
  const isVerified = await isUserEmailVerified(userId);
  if (!isVerified) {
    throw new Error("Please verify your email first.");
  }

  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      startupIdOrSlug
    );

  const startup = await db
    .select({ id: startups.id, status: startups.status })
    .from(startups)
    .where(
      isUuid
        ? eq(startups.id, startupIdOrSlug)
        : eq(startups.slug, startupIdOrSlug)
    )
    .limit(1);

  if (!startup[0] || startup[0].status !== "approved") {
    throw new Error("Startup not found or not approved.");
  }

  const startupId = startup[0].id;

  // Atomic toggle: INSERT ON CONFLICT DO NOTHING RETURNING inside one transaction
  const result = await db.transaction(async (tx) => {
    const inserted = await tx.execute<{ user_id: string }>(sql`
      INSERT INTO public.saved_startups (user_id, startup_id)
      VALUES (${userId}::uuid, ${startupId}::uuid)
      ON CONFLICT (user_id, startup_id) DO NOTHING
      RETURNING user_id
    `);

    if (inserted.length > 0) {
      return { saved: true };
    } else {
      await tx
        .delete(savedStartups)
        .where(
          and(
            eq(savedStartups.startupId, startupId),
            eq(savedStartups.userId, userId)
          )
        );
      return { saved: false };
    }
  });

  return result;
}

/**
 * Add a comment to an approved startup
 */
export async function addComment(
  startupIdOrSlug: string,
  rawContent: string,
  userId: string
): Promise<{
  id: string;
  content: string;
  author: string;
  authorId: string;
  role: string;
  createdAt: Date;
}> {
  // 1. Verified user check
  const isVerified = await isUserEmailVerified(userId);
  if (!isVerified) {
    throw new Error("Please verify your email first.");
  }

  const { content } = addCommentSchema.parse({ content: rawContent });

  // 2. Validate spam heuristics
  const spamRes = validateCommentSpam(content);
  if (!spamRes.valid) {
    throw new Error(spamRes.error || "Comment failed spam heuristics.");
  }

  // 3. Duplicate comment within 10 minutes check
  const isDup = await isDuplicateComment(userId, content);
  if (isDup) {
    throw new Error(
      "Duplicate comment detected. Please do not submit the same comment multiple times."
    );
  }

  // 4. Rate limit: 10 comments per 10 minutes per user
  const rateLimitRes = await checkRateLimit(`comment:user:${userId}`, 10, 600);
  if (!rateLimitRes.allowed) {
    throw new Error(RATE_LIMIT_MESSAGE);
  }

  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      startupIdOrSlug
    );

  const startup = await db
    .select({ id: startups.id, status: startups.status })
    .from(startups)
    .where(
      isUuid
        ? eq(startups.id, startupIdOrSlug)
        : eq(startups.slug, startupIdOrSlug)
    )
    .limit(1);

  if (!startup[0] || startup[0].status !== "approved") {
    throw new Error("Startup not found or not approved for comments.");
  }

  const [comment] = await db
    .insert(startupComments)
    .values({
      startupId: startup[0].id,
      userId,
      content,
      status: "visible",
    })
    .returning();

  const userProfile = await db
    .select({ displayName: profiles.displayName, role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  return {
    id: comment.id,
    content: comment.content,
    author: userProfile[0]?.displayName || "Community Member",
    authorId: userId,
    role: userProfile[0]?.role || "community",
    createdAt: comment.createdAt,
  };
}

/**
 * Get paginated list of saved startups for a user
 */
export async function getSaved(
  userId: string,
  page = 1,
  pageSize = 20
): Promise<PaginatedResult<FormattedStartup>> {
  const offset = (page - 1) * pageSize;

  const countResult = await db.execute<{ total: number }>(sql`
    SELECT count(*)::int AS total
    FROM public.saved_startups s
    JOIN public.startups st ON st.id = s.startup_id
    WHERE s.user_id = ${userId}::uuid AND st.status = 'approved'
  `);
  const total = countResult[0]?.total ?? 0;

  if (total === 0) {
    return { items: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const rows = await db.execute<
    Startup & { vote_count: string | number; is_liked?: boolean }
  >(sql`
    SELECT
      st.*,
      COALESCE(vote_agg.count, 0)::int AS vote_count,
      true AS is_saved,
      EXISTS(SELECT 1 FROM public.startup_votes v WHERE v.startup_id = st.id AND v.user_id = ${userId}::uuid) AS is_liked
    FROM public.saved_startups s
    JOIN public.startups st ON st.id = s.startup_id
    LEFT JOIN (
      SELECT startup_id, count(*)::int AS count
      FROM public.startup_votes
      GROUP BY startup_id
    ) vote_agg ON vote_agg.startup_id = st.id
    WHERE s.user_id = ${userId}::uuid AND st.status = 'approved'
    ORDER BY s.created_at DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `);

  const items = rows.map((r) => ({
    ...formatStartupRow(r as unknown as Record<string, unknown>),
    isSaved: true,
  }));

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Get paginated list of startups submitted by a founder, with payment status
 */
export async function getMySubmissions(
  userId: string,
  page = 1,
  pageSize = 20
): Promise<PaginatedResult<FormattedStartup>> {
  const offset = (page - 1) * pageSize;

  const countResult = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(startups)
    .where(eq(startups.ownerId, userId));
  const total = countResult[0]?.total ?? 0;

  if (total === 0) {
    return { items: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const rows = await db.execute<
    Startup & {
      vote_count: string | number;
      payment_status: string | null;
      payment_amount_cents: number | null;
      payment_amount_refunded_cents: number | null;
      payment_currency: string | null;
      razorpay_order_id: string | null;
      razorpay_payment_id: string | null;
    }
  >(sql`
    SELECT
      startups.*,
      COALESCE(vote_agg.count, 0)::int AS vote_count,
      p.status AS payment_status,
      p.amount_cents AS payment_amount_cents,
      p.amount_refunded_cents AS payment_amount_refunded_cents,
      p.currency AS payment_currency,
      p.razorpay_order_id,
      p.razorpay_payment_id
    FROM public.startups
    LEFT JOIN (
      SELECT startup_id, count(*)::int AS count
      FROM public.startup_votes
      GROUP BY startup_id
    ) vote_agg ON vote_agg.startup_id = startups.id
    LEFT JOIN LATERAL (
      SELECT status, amount_cents, amount_refunded_cents, currency, razorpay_order_id, razorpay_payment_id
      FROM public.payments
      WHERE public.payments.startup_id = startups.id
      ORDER BY created_at DESC
      LIMIT 1
    ) p ON true
    WHERE startups.owner_id = ${userId}::uuid
    ORDER BY startups.created_at DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `);

  const items = rows.map((r) =>
    formatStartupRow(r as unknown as Record<string, unknown>)
  );

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * List countries that have approved startups, with counts and country names
 */
export async function listCountries(): Promise<
  Array<{ code: string; name: string; count: number }>
> {
  const rows = await db.execute<{
    country_code: string;
    count: string | number;
  }>(sql`
    SELECT
      country_code,
      count(*)::int AS count
    FROM public.startups
    WHERE status = 'approved'
    GROUP BY country_code
    ORDER BY count DESC, country_code ASC
  `);

  return rows.map((r) => ({
    code: r.country_code,
    name: getCountryName(r.country_code),
    count: Number(r.count),
  }));
}

export type AdminStartupItem = Startup & {
  duplicateWarning?: DuplicateWarning | null;
  paymentAmountCents?: number | null;
  paymentCurrency?: string | null;
  razorpayPaymentId?: string | null;
  paidAt?: Date | null;
};

/**
 * List startups for admin review queue by status ('pending' | 'approved' | 'rejected')
 * Shows paid amount and Razorpay payment id for each queued submission.
 * Awaiting payment startups are never included in the review queue.
 */
export async function listAdminStartups(
  status: "pending" | "approved" | "rejected",
  adminUserId: string,
  page = 1,
  pageSize = 20
): Promise<PaginatedResult<AdminStartupItem>> {
  // Check admin role
  const reviewerProfile = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, adminUserId))
    .limit(1);

  if (!reviewerProfile[0] || reviewerProfile[0].role !== "admin") {
    throw new Error("Forbidden: only admins can access review queue.");
  }

  const offset = (page - 1) * pageSize;

  const countResult = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(startups)
    .where(eq(startups.status, status));
  const total = countResult[0]?.total ?? 0;

  if (total === 0) {
    return { items: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const rows = await db
    .select({
      startup: startups,
      payment: {
        amountCents: payments.amountCents,
        currency: payments.currency,
        razorpayPaymentId: payments.razorpayPaymentId,
        paidAt: payments.paidAt,
      },
    })
    .from(startups)
    .leftJoin(
      payments,
      and(eq(payments.startupId, startups.id), eq(payments.status, "paid"))
    )
    .where(eq(startups.status, status))
    .orderBy(desc(startups.createdAt))
    .limit(pageSize)
    .offset(offset);

  const itemsToReturn: AdminStartupItem[] = await Promise.all(
    rows.map(async ({ startup, payment }) => {
      const warning =
        status === "pending"
          ? await checkStartupDuplicate(startup.name, startup.websiteUrl, startup.id)
          : null;
      return {
        ...startup,
        duplicateWarning: warning,
        paymentAmountCents: payment?.amountCents ?? null,
        paymentCurrency: payment?.currency ?? null,
        razorpayPaymentId: payment?.razorpayPaymentId ?? null,
        paidAt: payment?.paidAt ? new Date(payment.paidAt) : null,
      };
    })
  );

  return {
    items: itemsToReturn,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Get admin audit log (defaults to 100 entries)
 */
export async function getAdminAuditLog(
  adminUserId: string,
  page = 1,
  pageSize = 100
): Promise<PaginatedResult<typeof auditLog.$inferSelect>> {
  const reviewerProfile = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, adminUserId))
    .limit(1);

  if (!reviewerProfile[0] || reviewerProfile[0].role !== "admin") {
    throw new Error("Forbidden: only admins can view audit log.");
  }

  const offset = (page - 1) * pageSize;

  const countResult = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(auditLog);
  const total = countResult[0]?.total ?? 0;

  if (total === 0) {
    return { items: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const items = await db
    .select()
    .from(auditLog)
    .orderBy(desc(auditLog.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Get public user profile and their approved startups
 */
export async function getUserPublicProfile(userId: string) {
  const [profile] = await db
    .select({
      id: profiles.id,
      displayName: profiles.displayName,
      role: profiles.role,
      createdAt: profiles.createdAt,
    })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!profile) return null;

  const startupsList = await db
    .select()
    .from(startups)
    .where(and(eq(startups.ownerId, userId), eq(startups.status, "approved")))
    .orderBy(desc(startups.createdAt));

  return {
    profile,
    startups: startupsList,
  };
}

/**
 * Returns the count and latest update timestamp of approved, non-sample startups matching the given filter.
 * Used for dynamic sitemap generation and per-route indexing (robots noindex when count === 0).
 */
export async function getApprovedNonSampleStats(filters: {
  category?: string;
  countryCode?: string;
  month?: string;
}): Promise<{ count: number; lastModified: Date | null }> {
  const conditions: SQL[] = [
    eq(startups.status, "approved"),
    eq(startups.isSample, false),
  ];

  if (filters.category) {
    conditions.push(eq(startups.category, filters.category));
  }
  if (filters.countryCode) {
    conditions.push(eq(startups.countryCode, filters.countryCode.toUpperCase()));
  }
  if (filters.month) {
    try {
      const monthDate = normalizeMonthToDate(filters.month);
      conditions.push(eq(startups.month, monthDate));
    } catch {
      return { count: 0, lastModified: null };
    }
  }

  const result = await db
    .select({
      count: sql<number>`count(*)::int`,
      lastModified: sql<Date | null>`max(coalesce(${startups.updatedAt}, ${startups.createdAt}))`,
    })
    .from(startups)
    .where(and(...conditions));

  return {
    count: result[0]?.count ?? 0,
    lastModified: result[0]?.lastModified ? new Date(result[0].lastModified) : null,
  };
}

