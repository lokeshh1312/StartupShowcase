export const PLAN_KEYS = ["basic", "investor_connect", "investor_ready"] as const;

export type PlanKey = (typeof PLAN_KEYS)[number];

export const DEFAULT_PLAN: PlanKey = "basic";

export interface PlanDefinition {
  key: PlanKey;
  name: string;
  priceCents: number;
  priceFormatted: string;
  billingText: string;
  highlighted?: boolean;
  badge?: string;
  features: string[];
}

export const PLANS: Record<PlanKey, PlanDefinition> = {
  basic: {
    key: "basic",
    name: "Basic Listing",
    priceCents: 900,
    priceFormatted: "$9",
    billingText: "One-time payment",
    features: [
      "Global startup listing",
      "Company profile showcase",
      "Global audience visibility",
    ],
  },
  investor_connect: {
    key: "investor_connect",
    name: "Investor Connect",
    priceCents: 19900,
    priceFormatted: "$199",
    billingText: "One-time payment",
    highlighted: true,
    badge: "Most Popular",
    features: [
      "Everything in Basic",
      "Investor networking support",
      "3 investor meetings",
    ],
  },
  investor_ready: {
    key: "investor_ready",
    name: "Investor Ready",
    priceCents: 99900,
    priceFormatted: "$999",
    billingText: "One-time payment",
    features: [
      "Everything in Investor Connect",
      "Investor readiness support",
      "Pitch deck, Financials & fundraising preparation",
      "5 investor meetings",
    ],
  },
};

/**
 * Validates whether an unknown value is a supported PlanKey.
 */
export function isPlanKey(x: unknown): x is PlanKey {
  return typeof x === "string" && (PLAN_KEYS as readonly string[]).includes(x);
}

/**
 * Returns the PlanDefinition for a given key, defaulting to "basic" if missing or invalid.
 */
export function getPlan(key?: string | null): PlanDefinition {
  if (key && isPlanKey(key)) {
    return PLANS[key];
  }
  return PLANS[DEFAULT_PLAN];
}

/**
 * Formats plan price concisely (e.g. "$9", "$199", "$999").
 */
export function formatPlanPrice(keyOrPlan: PlanKey | PlanDefinition): string {
  if (typeof keyOrPlan === "string") {
    return getPlan(keyOrPlan).priceFormatted;
  }
  return keyOrPlan.priceFormatted;
}

