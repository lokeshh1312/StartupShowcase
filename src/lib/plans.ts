export const PLAN_KEYS = ["basic", "investor_connect", "investor_ready"] as const;

export type PlanKey = (typeof PLAN_KEYS)[number];

export const PLAN_DISPLAY_ORDER: PlanKey[] = [
  "basic",
  "investor_connect",
  "investor_ready",
];

export const DEFAULT_PLAN: PlanKey = "basic";

export const PLAN_RANK: Record<PlanKey, number> = {
  basic: 1,
  investor_connect: 2,
  investor_ready: 3,
};

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
    name: "Startup Listing",
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
    features: [
      "Everything in Startup Listing",
      "Investor networking support",
      "3 investor meetings",
    ],
  },
  investor_ready: {
    key: "investor_ready",
    name: "Investor Ready+Connect",
    priceCents: 99900,
    priceFormatted: "$999",
    billingText: "One-time payment",
    highlighted: true,
    badge: "Most Popular",
    features: [
      "Everything in Investor Connect",
      "Investor readiness support",
      "Pitch deck, Market Research, Financial Model & fundraising preparation",
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

/**
 * Returns the upgrade difference in USD cents between two plans.
 * Returns null if the target plan rank is less than or equal to current rank.
 */
export function getUpgradePriceCents(from: PlanKey, to: PlanKey): number | null {
  if (!isPlanKey(from) || !isPlanKey(to)) {
    return null;
  }
  const fromRank = PLAN_RANK[from];
  const toRank = PLAN_RANK[to];
  if (toRank <= fromRank) {
    return null;
  }
  return PLANS[to].priceCents - PLANS[from].priceCents;
}

/**
 * Returns all plans that have a strictly higher rank than the current plan.
 */
export function getUpgradeTargets(current: PlanKey): PlanKey[] {
  if (!isPlanKey(current)) {
    return [];
  }
  const currentRank = PLAN_RANK[current] ?? 0;
  return (PLAN_KEYS as readonly PlanKey[])
    .filter((key) => (PLAN_RANK[key] ?? 0) > currentRank)
    .sort((a, b) => (PLAN_RANK[a] ?? 0) - (PLAN_RANK[b] ?? 0));
}

