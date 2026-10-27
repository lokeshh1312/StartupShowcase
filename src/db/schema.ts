import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  date,
  jsonb,
  primaryKey,
  customType,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Custom citext type matching the PostgreSQL citext extension
export const citext = customType<{ data: string }>({
  dataType() {
    return "citext";
  },
});

export type FounderInfo = {
  name?: string;
  role?: string;
  avatar?: string;
  quote?: string;
};

// 1. Profiles Table
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  displayName: text("display_name").notNull().default(""),
  role: text("role", {
    enum: ["founder", "investor", "community", "admin"],
  })
    .notNull()
    .default("community"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  roleChosenAt: timestamp("role_chosen_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// 2. Startups Table
export const startups = pgTable(
  "startups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    ownerId: uuid("owner_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    status: text("status", {
      enum: ["awaiting_payment", "pending", "approved", "rejected"],
    })
      .notNull()
      .default("awaiting_payment"),
    isSample: boolean("is_sample").notNull().default(false),
    name: text("name").notNull(),
    ideaTitle: text("idea_title").notNull(),
    tagline: text("tagline").notNull().default(""),
    description: text("description").notNull(),
    fullStory: text("full_story").notNull().default(""),
    category: text("category").notNull(),
    countryCode: text("country_code").notNull(),
    region: text("region").notNull().default(""),
    city: text("city").notNull().default(""),
    remoteFirst: boolean("remote_first").notNull().default(false),
    location: text("location").notNull().default(""),
    stage: text("stage").notNull(),
    month: date("month", { mode: "string" }).notNull(),
    monthLabel: text("month_label").notNull().default(""),
    websiteUrl: text("website_url").notNull().default(""),
    logoType: text("logo_type").notNull().default("sprout"),
    logoColor: text("logo_color").notNull().default("#2563EB"),
    thumbnail: text("thumbnail").notNull().default(""),
    coverImage: text("cover_image").notNull().default(""),
    founderJson: jsonb("founder_json").$type<FounderInfo>().notNull().default({}),
    problem: text("problem").notNull().default(""),
    solution: text("solution").notNull().default(""),
    keyFeaturesJson: jsonb("key_features_json")
      .$type<string[]>()
      .notNull()
      .default([]),
    techStackJson: jsonb("tech_stack_json")
      .$type<string[]>()
      .notNull()
      .default([]),
    traction: text("traction").notNull().default(""),
    viewsCount: integer("views_count").notNull().default(0),
    reviewedBy: uuid("reviewed_by").references(() => profiles.id, {
      onDelete: "set null",
    }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_startups_status_month").on(table.status, table.month),
    uniqueIndex("idx_startups_slug_uniq").on(table.slug),
    index("idx_startups_country_code").on(table.countryCode),
    index("idx_startups_owner_id").on(table.ownerId),
  ]
);

// 3. Startup Votes Table
export const startupVotes = pgTable(
  "startup_votes",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    startupId: uuid("startup_id")
      .notNull()
      .references(() => startups.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.startupId] }),
    index("idx_startup_votes_startup_id").on(table.startupId),
  ]
);

// 4. Saved Startups Table
export const savedStartups = pgTable(
  "saved_startups",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    startupId: uuid("startup_id")
      .notNull()
      .references(() => startups.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.startupId] }),
    index("idx_saved_startups_user_id").on(table.userId),
  ]
);

// 5. Startup Comments Table
export const startupComments = pgTable(
  "startup_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    startupId: uuid("startup_id")
      .notNull()
      .references(() => startups.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    status: text("status", { enum: ["visible", "hidden"] })
      .notNull()
      .default("visible"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_startup_comments_startup_id").on(
      table.startupId,
      table.createdAt
    ),
  ]
);

// 6. Startup Views Table (deduplicated per viewer_hash per day)
export const startupViews = pgTable(
  "startup_views",
  {
    startupId: uuid("startup_id")
      .notNull()
      .references(() => startups.id, { onDelete: "cascade" }),
    viewerHash: text("viewer_hash").notNull(),
    day: date("day", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.startupId, table.viewerHash, table.day] }),
    index("idx_startup_views_day").on(table.startupId, table.day),
  ]
);

// 7. Rate Limits Table
export const rateLimits = pgTable(
  "rate_limits",
  {
    key: text("key").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(1),
  },
  (table) => [
    primaryKey({ columns: [table.key, table.windowStart] }),
    index("idx_rate_limits_window").on(table.key, table.windowStart),
  ]
);

// 8. Newsletter Subscribers Table
export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: citext("email").notNull().unique(),
  confirmed: boolean("confirmed").notNull().default(false),
  token: text("token").notNull(),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  unsubscribeToken: text("unsubscribe_token"),
  tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// 9. Audit Log Table
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_audit_log_target").on(table.targetType, table.targetId),
  ]
);

// 10. Payments Table
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    startupId: uuid("startup_id")
      .notNull()
      .references(() => startups.id, { onDelete: "restrict" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    razorpayOrderId: text("razorpay_order_id").notNull().unique(),
    razorpayPaymentId: text("razorpay_payment_id").unique(),
    amountCents: integer("amount_cents").notNull(),
    amountRefundedCents: integer("amount_refunded_cents").notNull().default(0),
    currency: text("currency").notNull(),
    status: text("status", {
      enum: ["created", "paid", "failed", "refunded", "partially_refunded"],
    }).notNull(),
    webhookEventId: text("webhook_event_id").unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    refundedAt: timestamp("refunded_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_payments_startup_id").on(table.startupId),
    index("idx_payments_user_id").on(table.userId),
    index("idx_payments_status").on(table.status),
    index("idx_payments_order_id").on(table.razorpayOrderId),
    index("idx_payments_payment_id").on(table.razorpayPaymentId),
  ]
);

// 11. Payment Events Table (Durable idempotency record for webhook events)
export const paymentEvents = pgTable(
  "payment_events",
  {
    id: text("id").primaryKey(),
    eventType: text("event_type").notNull(),
    paymentId: text("payment_id"),
    orderId: text("order_id"),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_payment_events_created_at").on(table.createdAt),
  ]
);

// Relations
export const profilesRelations = relations(profiles, ({ many }) => ({
  startups: many(startups),
  votes: many(startupVotes),
  saved: many(savedStartups),
  comments: many(startupComments),
  payments: many(payments),
}));

export const startupsRelations = relations(startups, ({ one, many }) => ({
  owner: one(profiles, {
    fields: [startups.ownerId],
    references: [profiles.id],
  }),
  reviewer: one(profiles, {
    fields: [startups.reviewedBy],
    references: [profiles.id],
  }),
  votes: many(startupVotes),
  saved: many(savedStartups),
  comments: many(startupComments),
  views: many(startupViews),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(profiles, {
    fields: [payments.userId],
    references: [profiles.id],
  }),
  startup: one(startups, {
    fields: [payments.startupId],
    references: [startups.id],
  }),
}));

export const startupVotesRelations = relations(startupVotes, ({ one }) => ({
  user: one(profiles, {
    fields: [startupVotes.userId],
    references: [profiles.id],
  }),
  startup: one(startups, {
    fields: [startupVotes.startupId],
    references: [startups.id],
  }),
}));

export const savedStartupsRelations = relations(savedStartups, ({ one }) => ({
  user: one(profiles, {
    fields: [savedStartups.userId],
    references: [profiles.id],
  }),
  startup: one(startups, {
    fields: [savedStartups.startupId],
    references: [startups.id],
  }),
}));

export const startupCommentsRelations = relations(startupComments, ({ one }) => ({
  user: one(profiles, {
    fields: [startupComments.userId],
    references: [profiles.id],
  }),
  startup: one(startups, {
    fields: [startupComments.startupId],
    references: [startups.id],
  }),
}));

// Inferred Types
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export type Startup = typeof startups.$inferSelect;
export type NewStartup = typeof startups.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

export type PaymentEvent = typeof paymentEvents.$inferSelect;
export type NewPaymentEvent = typeof paymentEvents.$inferInsert;

export type StartupVote = typeof startupVotes.$inferSelect;
export type SavedStartup = typeof savedStartups.$inferSelect;
export type StartupComment = typeof startupComments.$inferSelect;
export type StartupView = typeof startupViews.$inferSelect;
export type RateLimit = typeof rateLimits.$inferSelect;
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type AuditLogEntry = typeof auditLog.$inferSelect;
