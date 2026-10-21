import { test, expect } from "@playwright/test";

test.describe("Startup Showcase E2E Smoke Tests", () => {
  test("Home page loads with leaderboard, categories, and months", async ({
    page,
  }) => {
    const res = await page.goto("/");
    expect(res?.status()).toBe(200);

    // Title & Header checks
    await expect(page).toHaveTitle(/Startup Showcase/i);
    await expect(page.locator("h1")).toContainText(/Startup/i);

    // Leaderboard table or items exist
    const startupCards = page.locator("a[href^='/startup/']");
    await expect(startupCards.first()).toBeVisible();

    // Verify jobs link is completely gone
    const jobsLinks = page.locator("a[href='/jobs'], a[href*='jobs']");
    expect(await jobsLinks.count()).toBe(0);
  });

  test("Directory page loads with filters and startup cards", async ({
    page,
  }) => {
    const res = await page.goto("/browse");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toContainText(/Directory/i);

    // At least one startup is shown
    const startupCards = page.locator("a[href^='/startup/']");
    await expect(startupCards.first()).toBeVisible();
  });

  test("Categories index and category detail pages load", async ({ page }) => {
    const res = await page.goto("/categories");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toContainText(/Categories/i);

    const detailRes = await page.goto("/categories/agritech");
    expect(detailRes?.status()).toBe(200);
    await expect(page.locator("h1")).toContainText(/AgriTech/i);
  });

  test("Countries index and country detail pages load", async ({ page }) => {
    const res = await page.goto("/countries");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toContainText(/Country/i);

    const detailRes = await page.goto("/countries/us");
    expect(detailRes?.status()).toBe(200);
    await expect(page.locator("h1")).toContainText(/United States/i);
  });

  test("Monthly cohort leaderboard page loads", async ({ page }) => {
    const res = await page.goto("/months/2026-10-01");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toContainText(/Leaderboard/i);
  });

  test("Search page works with query param", async ({ page }) => {
    const res = await page.goto("/search?q=tech");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toContainText(/Search/i);
  });

  test("Content pages (About, FAQ, Support, Newsletter) render properly", async ({
    page,
  }) => {
    for (const route of ["/about", "/faq", "/support", "/newsletter"]) {
      const res = await page.goto(route);
      expect(res?.status()).toBe(200);
    }
  });

  test("Auth pages render properly", async ({ page }) => {
    for (const route of [
      "/login",
      "/signup",
      "/forgot-password",
      "/reset-password",
    ]) {
      const res = await page.goto(route);
      expect(res?.status()).toBe(200);
    }
  });

  test("Protected pages redirect unauthenticated users cleanly", async ({
    page,
  }) => {
    // /submit -> /login?redirect=/submit
    await page.goto("/submit");
    await expect(page).toHaveURL(/\/login/);

    // /saved -> /login?redirect=/saved
    await page.goto("/saved");
    await expect(page).toHaveURL(/\/login/);

    // /me/submissions -> /login?redirect=/me/submissions
    await page.goto("/me/submissions");
    await expect(page).toHaveURL(/\/login/);

    // /admin -> /
    await page.goto("/admin");
    await expect(page).toHaveURL(/\//);
  });

  test("Startup detail page navigates cleanly from home", async ({ page }) => {
    await page.goto("/");
    const firstStartupLink = page.locator("a[href^='/startup/']").first();
    const href = await firstStartupLink.getAttribute("href");
    expect(href).toBeTruthy();

    await page.goto(href!);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("button", { hasText: /Vote/i })).toBeVisible();
    await expect(page.locator("text=About the Product")).toBeVisible();
  });

  test("Zero broken internal links on home page", async ({ page }) => {
    await page.goto("/");
    const internalLinks = await page
      .locator("a[href^='/']")
      .evaluateAll((anchors: HTMLAnchorElement[]) =>
        Array.from(new Set(anchors.map((a) => a.pathname))).filter(
          (p) => !p.startsWith("/api") && p !== ""
        )
      );

    expect(internalLinks.length).toBeGreaterThan(5);

    for (const path of internalLinks) {
      const res = await page.goto(path);
      // Status must not be 404 or 500
      expect(res?.status()).not.toBe(404);
      expect(res?.status()).not.toBe(500);
    }
  });
});
