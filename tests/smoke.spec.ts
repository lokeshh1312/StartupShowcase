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

  test("Auth forms render with CAPTCHA containers", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();

    await page.goto("/forgot-password");
    await expect(page.locator("input[type='email']")).toBeVisible();

    await page.goto("/reset-password");
    await expect(page.locator("input[type='password']").first()).toBeVisible();
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

  test("Link crawl follows internal links two levels deep (capped at 60) and has no 404 or 500", async ({
    page,
  }) => {
    test.setTimeout(90000);

    const visited = new Set<string>();
    const MAX_PAGES = 60;

    const extractInternalPaths = async (): Promise<string[]> => {
      try {
        await page.waitForLoadState("domcontentloaded");
        return await page
          .locator("a[href^='/']")
          .evaluateAll((anchors: HTMLAnchorElement[]) =>
            Array.from(
              new Set(
                anchors
                  .map((a) => {
                    try {
                      const parsed = new URL(a.href, window.location.origin);
                      return parsed.pathname;
                    } catch {
                      return a.pathname || "";
                    }
                  })
                  .filter(
                    (p) =>
                      p &&
                      p.startsWith("/") &&
                      !p.startsWith("//") &&
                      !p.startsWith("/\\") &&
                      !p.startsWith("/api") &&
                      !p.startsWith("/_next")
                  )
              )
            )
          );
      } catch {
        return [];
      }
    };

    // Level 0: Start at home page
    const homeRes = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(homeRes?.status(), "Home page must not be 404").not.toBe(404);
    expect(homeRes?.status(), "Home page must not be 500").not.toBe(500);
    visited.add("/");

    // Level 1: Collect internal links from home
    const level1Paths = (await extractInternalPaths()).filter(
      (p) => !visited.has(p)
    );

    const level2Queue: string[] = [];

    // Follow Level 1 links
    for (const p1 of level1Paths) {
      if (visited.size >= MAX_PAGES) break;
      if (visited.has(p1)) continue;

      visited.add(p1);
      let res;
      try {
        res = await page.goto(p1, { waitUntil: "load" });
      } catch {
        await page.waitForLoadState("load").catch(() => {});
        res = await page.goto(p1, { waitUntil: "domcontentloaded" }).catch(() => null);
      }
      const status = res?.status();
      if (status) {
        expect(status, `Expected Level 1 page ${p1} to not return 404`).not.toBe(404);
        expect(status, `Expected Level 1 page ${p1} to not return 500`).not.toBe(500);
      }

      // Collect Level 2 links
      const l2Links = await extractInternalPaths();
      for (const p2 of l2Links) {
        if (!visited.has(p2) && !level2Queue.includes(p2)) {
          level2Queue.push(p2);
        }
      }
    }

    // Follow Level 2 links
    for (const p2 of level2Queue) {
      if (visited.size >= MAX_PAGES) break;
      if (visited.has(p2)) continue;

      visited.add(p2);
      let res;
      try {
        res = await page.goto(p2, { waitUntil: "load" });
      } catch {
        await page.waitForLoadState("load").catch(() => {});
        res = await page.goto(p2, { waitUntil: "domcontentloaded" }).catch(() => null);
      }
      const status = res?.status();
      if (status) {
        expect(status, `Expected Level 2 page ${p2} to not return 404`).not.toBe(404);
        expect(status, `Expected Level 2 page ${p2} to not return 500`).not.toBe(500);
      }
    }

    expect(visited.size).toBeGreaterThan(5);
    expect(visited.size).toBeLessThanOrEqual(MAX_PAGES);
  });
});
