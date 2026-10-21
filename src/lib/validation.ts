import { z } from "zod";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

countries.registerLocale(enLocale);

export const CATEGORIES = [
  "AgriTech",
  "HealthTech",
  "CleanTech",
  "EdTech",
  "FoodTech",
  "LegalTech",
  "WaterTech",
  "SkillTech",
  "FinTech",
  "DeepTech",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const STAGES = ["MVP", "Prototype", "Idea Stage"] as const;
export type Stage = (typeof STAGES)[number];

export const SORT_OPTIONS = [
  "votes",
  "views",
  "alphabetical",
  "trending",
  "recent",
] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

// Normalizes URL safely (rejects javascript:, ftp:, embeds with user:pass)
export function normalizeUrl(value?: string | null): string {
  if (!value || typeof value !== "string") return "";
  const trimmed = value.trim().slice(0, 500);
  if (!trimmed) return "";

  // If already contains a URI scheme, inspect as is. Otherwise prepend https://
  const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed);
  const candidate = hasScheme ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    if (url.username || url.password) return "";
    return url.toString();
  } catch {
    return "";
  }
}

// Month name map for legacy month string support (e.g., 'oct-2026')
const MONTH_MAP: Record<string, string> = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12",
};

// Normalizes any month format to UTC 'YYYY-MM-01'
export function normalizeMonthToDate(value: string | Date): string {
  if (value instanceof Date) {
    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, "0");
    return `${year}-${month}-01`;
  }

  const trimmed = String(value).trim().toLowerCase();

  // Pattern: 'YYYY-MM' or 'YYYY-MM-DD'
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2].padStart(2, "0");
    const mNum = parseInt(month, 10);
    if (mNum >= 1 && mNum <= 12) {
      return `${year}-${month}-01`;
    }
  }

  // Pattern: 'oct-2026' or 'october-2026'
  const slugMatch = trimmed.match(/^([a-z]{3,9})[-_](\d{4})$/);
  if (slugMatch) {
    const prefix = slugMatch[1].slice(0, 3);
    const month = MONTH_MAP[prefix];
    const year = slugMatch[2];
    if (month) {
      return `${year}-${month}-01`;
    }
  }

  throw new Error(`Invalid month format: "${value}". Expected YYYY-MM or YYYY-MM-01`);
}

// Formats UTC date string ('YYYY-MM-01') into a readable month label ('October 2026')
export function formatMonthLabel(monthDate: string | Date): string {
  const dateStr =
    monthDate instanceof Date
      ? normalizeMonthToDate(monthDate)
      : normalizeMonthToDate(monthDate);
  const [year, month] = dateStr.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, 1));
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(utcDate);
}

// ISO 3166-1 alpha-2 country code validator
export const countryCodeSchema = z
  .string()
  .trim()
  .transform((val) => val.toUpperCase())
  .refine(
    (code) => code.length === 2 && countries.isValid(code),
    {
      message:
        "Country code must be a valid 2-letter ISO 3166-1 alpha-2 code (e.g. US, IN, GB)",
    }
  );

// Helper to look up country name
export function getCountryName(code?: string | null, lang = "en"): string {
  if (!code || typeof code !== "string") return "";
  return countries.getName(code.toUpperCase(), lang) || code.toUpperCase();
}

// Helper to list all valid countries
export function getAvailableCountries(lang = "en"): Array<{ code: string; name: string }> {
  const names = countries.getNames(lang);
  return Object.entries(names)
    .map(([code, name]) => ({ code: code.toUpperCase(), name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Location formatter
export function formatLocation(loc: {
  countryCode?: string | null;
  region?: string | null;
  city?: string | null;
  remoteFirst?: boolean | null;
}): string {
  const parts: string[] = [];
  if (loc.city && loc.city.trim()) parts.push(loc.city.trim());
  if (loc.region && loc.region.trim()) parts.push(loc.region.trim());
  if (loc.countryCode) {
    const country = getCountryName(loc.countryCode);
    if (country) parts.push(country);
  }
  if (loc.remoteFirst) parts.push("(Remote)");
  return parts.join(", ");
}

// Founder Schema
export const founderSchema = z.object({
  name: z.string().trim().max(100).default(""),
  role: z.string().trim().max(100).default(""),
  avatar: z
    .string()
    .optional()
    .transform((val) => normalizeUrl(val)),
  quote: z.string().trim().max(500).default(""),
});

// Create / Submit Startup Schema
export const createStartupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Startup name is required")
      .max(100, "Startup name must be under 100 characters"),
    ideaTitle: z.string().trim().max(140).optional(),
    tagline: z.string().trim().max(240).default(""),
    description: z
      .string()
      .trim()
      .min(10, "Description must be at least 10 characters")
      .max(500, "Description must be under 500 characters"),
    fullStory: z.string().trim().max(12000).default(""),
    category: z.enum(CATEGORIES, {
      message: "Choose a valid startup category",
    }),
    countryCode: countryCodeSchema,
    region: z.string().trim().max(100).default(""),
    city: z.string().trim().max(100).default(""),
    remoteFirst: z.boolean().default(false),
    stage: z.enum(STAGES, {
      message: "Choose a valid startup stage",
    }),
    // month is NOT accepted from the client; the server sets it at approval time.
    websiteUrl: z
      .string()
      .optional()
      .transform((val) => normalizeUrl(val)),
    logoType: z.string().trim().max(40).default("sprout"),
    logoColor: z
      .string()
      .trim()
      .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color (e.g. #2563EB)")
      .default("#2563EB"),
    thumbnail: z
      .string()
      .optional()
      .transform((val) => normalizeUrl(val)),
    coverImage: z
      .string()
      .optional()
      .transform((val) => normalizeUrl(val)),
    founder: founderSchema.default({
      name: "",
      role: "",
      avatar: "",
      quote: "",
    }),
    problem: z.string().trim().max(12000).default(""),
    solution: z.string().trim().max(12000).default(""),
    keyFeatures: z
      .array(z.string().trim().max(300))
      .max(12, "Maximum 12 key features allowed")
      .default([]),
    techStack: z
      .array(z.string().trim().max(60))
      .max(12, "Maximum 12 technologies allowed")
      .default([]),
    traction: z.string().trim().max(1000).default(""),
  })
  .transform((data) => ({
    ...data,
    ideaTitle: data.ideaTitle?.trim() || data.name,
    coverImage: data.coverImage || data.thumbnail || "",
    location: formatLocation({
      countryCode: data.countryCode,
      region: data.region,
      city: data.city,
      remoteFirst: data.remoteFirst,
    }),
  }));

export type CreateStartupInput = z.input<typeof createStartupSchema>;
export type ValidatedStartupData = z.output<typeof createStartupSchema>;

// List / Search Filter Schema
export const listStartupsFilterSchema = z.object({
  month: z.string().optional(),
  category: z.string().optional(),
  stage: z.string().optional(),
  countryCode: z.string().trim().toUpperCase().optional(),
  remoteFirst: z.boolean().optional(),
  q: z.string().trim().max(120).optional(),
  sort: z.enum(SORT_OPTIONS).default("votes"),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type ListStartupsFilters = z.input<typeof listStartupsFilterSchema>;

// Moderate Status Schema
export const moderateStartupSchema = z.object({
  status: z.enum(["approved", "rejected", "pending"], {
    message: "Status must be approved, rejected, or pending",
  }),
});

// Add Comment Schema
export const addCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment cannot be empty")
    .max(1500, "Comment must be under 1500 characters"),
});

// Newsletter Subscription Schema
export const newsletterSubscribeSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .max(254),
});

// Password Schema - minimum 10 characters
export const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters long.");

export { safeRedirectPath } from "./redirect";

