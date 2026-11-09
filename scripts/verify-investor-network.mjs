import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const PORT = 3009;
const SCREENSHOT_DIR = "C:/Users/Lokesh/.gemini/antigravity/brain/3252c43d-109e-4096-a49f-0f3395075fbe/screenshots";
mkdirSync(SCREENSHOT_DIR, { recursive: true });

const mockNetworkData = {
  countries: [
    { code: "US", name: "United States", investors: 18500, startups: 142 },
    { code: "IN", name: "India", investors: 15200, startups: 98 },
    { code: "CN", name: "China", investors: 14300, startups: 76 },
    { code: "GB", name: "United Kingdom", investors: 11200, startups: 64 },
    { code: "DE", name: "Germany", investors: 9800, startups: 52 },
    { code: "JP", name: "Japan", investors: 8900, startups: 41 },
    { code: "CA", name: "Canada", investors: 8100, startups: 38 },
    { code: "FR", name: "France", investors: 7500, startups: 35 },
    { code: "AU", name: "Australia", investors: 6900, startups: 29 },
    { code: "SG", name: "Singapore", investors: 6200, startups: 27 },
    { code: "AE", name: "United Arab Emirates", investors: 5800, startups: 24 },
    { code: "KR", name: "South Korea", investors: 5400, startups: 22 },
    { code: "BR", name: "Brazil", investors: 4900, startups: 19 },
    { code: "NL", name: "Netherlands", investors: 4300, startups: 17 },
    { code: "CH", name: "Switzerland", investors: 3900, startups: 15 },
    { code: "SE", name: "Sweden", investors: 3500, startups: 14 },
    { code: "IT", name: "Italy", investors: 3100, startups: 12 },
    { code: "ES", name: "Spain", investors: 2700, startups: 10 },
    { code: "IL", name: "Israel", investors: 2400, startups: 8 },
    { code: "ZA", name: "South Africa", investors: 1900, startups: 6 },
  ],
  investors: [],
  totals: {
    investors: 144500,
    startups: 703,
  },
  asOf: "2026-11-09T10:00:00.000Z",
  degraded: false,
};
mockNetworkData.investors = mockNetworkData.countries;

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 200 || res.status === 404) return true;
    } catch {
      // wait
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Server at ${url} did not respond within ${timeoutMs}ms`);
}

async function run() {
  console.log(`Starting next dev on port ${PORT}...`);
  const server = spawn("npx.cmd", ["next", "dev", "-p", String(PORT)], {
    shell: true,
    stdio: "inherit",
    env: { ...process.env, PORT: String(PORT) },
  });

  try {
    await waitForServer(`http://127.0.0.1:${PORT}`);
    console.log("Next.js server is ready. Launching Playwright...");

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Intercept API calls
    await page.route("**/api/investor-network", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockNetworkData),
      });
    });

    // Capture requested viewports: 375, 1024, 1180, 1280, 1917px wide (light & dark)
    const viewports = [
      { name: "375px", width: 375, height: 812 },
      { name: "1024px", width: 1024, height: 768 },
      { name: "1180px", width: 1180, height: 800 },
      { name: "1280px", width: 1280, height: 800 },
      { name: "1917px", width: 1917, height: 1080 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });

      for (const theme of ["light", "dark"]) {
        if (theme === "dark") {
          await page.evaluate(() => document.documentElement.classList.add("dark"));
        } else {
          await page.evaluate(() => document.documentElement.classList.remove("dark"));
        }
        await page.waitForTimeout(400);

        // Check horizontal scroll
        const scrollCheck = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          hasScroll: document.documentElement.scrollWidth > window.innerWidth,
        }));
        console.log(`[${vp.name} ${theme}] scrollWidth: ${scrollCheck.scrollWidth}, clientWidth: ${scrollCheck.clientWidth}, hasHorizontalScroll: ${scrollCheck.hasScroll}`);

        // Check heading and bubble bounding boxes
        const headingBox = await page.locator('h1').first().boundingBox();
        const bubbleBox = await page.locator('button[aria-label="Open Investor Network"]').boundingBox();
        if (headingBox && bubbleBox) {
          const overlap = !(
            headingBox.x + headingBox.width <= bubbleBox.x ||
            bubbleBox.x + bubbleBox.width <= headingBox.x ||
            headingBox.y + headingBox.height <= bubbleBox.y ||
            bubbleBox.y + bubbleBox.height <= headingBox.y
          );
          console.log(`[${vp.name} ${theme}] Heading: [${Math.round(headingBox.x)}, ${Math.round(headingBox.y)}, ${Math.round(headingBox.width)}, ${Math.round(headingBox.height)}], Bubble: [${Math.round(bubbleBox.x)}, ${Math.round(bubbleBox.y)}, ${Math.round(bubbleBox.width)}, ${Math.round(bubbleBox.height)}], Overlaps: ${overlap}`);
          if (overlap) {
            throw new Error(`Overlap detected between heading and bubble at ${vp.name} ${theme}!`);
          }
        }

        await page.screenshot({ path: `${SCREENSHOT_DIR}/breakpoint-${vp.name}-${theme}.png` });
      }
    }

    // (b) Hover state of the bubble
    console.log("Capturing (b) bubble hover state...");
    await page.evaluate(() => document.documentElement.classList.remove("dark"));
    const bubble = page.locator('button[aria-label="Open Investor Network"]');
    await bubble.hover({ force: true });
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/b-bubble-hover-desktop.png` });

    // (c) Overlay open desktop light + dark, with a country selected and the tooltip visible
    console.log("Capturing (c) overlay open desktop light + selected + tooltip...");
    await bubble.click({ force: true });
    await page.waitForSelector('[role="dialog"]');
    await page.waitForSelector('[role="dialog"] svg[aria-label="World map showing investor network distribution"]');
    await page.waitForTimeout(1000);

    // Select United States from list
    const usRow = page.locator('[role="dialog"] button:has-text("United States")').first();
    await usRow.click({ force: true });
    await page.waitForTimeout(600);

    // Hover a country polygon or bubble on the map to show tooltip
    const mapSvg = page.locator('[role="dialog"] svg[aria-label="World map showing investor network distribution"]');
    const svgBBox = await mapSvg.boundingBox();
    if (svgBBox) {
      await page.mouse.move(svgBBox.x + svgBBox.width * 0.48, svgBBox.y + svgBBox.height * 0.42);
    }
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/c-overlay-desktop-light-selected-tooltip.png` });

    console.log("Capturing (c) overlay open desktop dark...");
    await page.evaluate(() => document.documentElement.classList.add("dark"));
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/c-overlay-desktop-dark-selected-tooltip.png` });

    // (d) Zoomed into one country
    console.log("Capturing (d) zoomed into one country...");
    await page.evaluate(() => document.documentElement.classList.remove("dark"));
    // Click zoom in twice
    const zoomInBtn = page.locator('button[aria-label="Zoom in"]');
    await zoomInBtn.click({ force: true });
    await page.waitForTimeout(300);
    await zoomInBtn.click({ force: true });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/d-zoomed-country-desktop.png` });

    // Close overlay
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);

    // (e) Mobile 375px home with bubble, and overlay open (map + list), light and dark
    console.log("Capturing (e) mobile 375px home light...");
    await page.setViewportSize({ width: 375, height: 812 });
    await page.evaluate(() => document.documentElement.classList.remove("dark"));
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/e-mobile-375px-home-light.png` });

    console.log("Capturing (e) mobile 375px home dark...");
    await page.evaluate(() => document.documentElement.classList.add("dark"));
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/e-mobile-375px-home-dark.png` });

    console.log("Capturing (e) mobile overlay open light...");
    await page.evaluate(() => document.documentElement.classList.remove("dark"));
    const mobileBubble = page.locator('button[aria-label="Open Investor Network"]');
    await mobileBubble.click({ force: true });
    await page.waitForSelector('[role="dialog"]');
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/e-mobile-375px-overlay-light.png` });

    console.log("Capturing (e) mobile overlay open dark...");
    await page.evaluate(() => document.documentElement.classList.add("dark"));
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/e-mobile-375px-overlay-dark.png` });

    // (f) Close via Esc and X button test
    console.log("Testing Esc and X closing...");
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
    await page.click('button[aria-label="Open Investor Network"]', { force: true });
    await page.waitForSelector('[role="dialog"]');
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/f-overlay-closed-by-esc.png` });

    await page.click('button[aria-label="Open Investor Network"]', { force: true });
    await page.waitForSelector('[role="dialog"]');
    await page.click('button[aria-label="Close Investor Network"]');
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/f-overlay-closed-by-x.png` });

    // (g) Empty / error state with retry button
    console.log("Capturing (g) empty / error state with retry...");
    await page.unroute("**/api/investor-network");
    await page.route("**/api/investor-network", async (route) => {
      await route.fulfill({ status: 500, body: "Server Error" });
    });
    await page.reload({ waitUntil: "networkidle" });
    await page.click('button[aria-label="Open Investor Network"]', { force: true });
    await page.waitForSelector('text="Unable to Load Network Data"');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/g-empty-error-state-with-retry.png` });

    // (h) Keyboard Tab test
    console.log("Capturing (h) keyboard tab navigation...");
    await page.unroute("**/api/investor-network");
    await page.route("**/api/investor-network", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockNetworkData),
      });
    });
    await page.reload({ waitUntil: "networkidle" });
    await page.click('button[aria-label="Open Investor Network"]', { force: true });
    await page.waitForSelector('[role="dialog"]');
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/h-keyboard-tab-focused.png` });

    console.log("All screenshots captured successfully!");
    await browser.close();
  } finally {
    console.log("Terminating server...");
    server.kill("SIGTERM");
  }
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
