import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run start:standalone",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
    timeout: 60000,
    env: {
      ...(process.env as Record<string, string>),
      PORT: "3000",
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
      TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
      RESEND_API_KEY: "re_dummy_test_key_for_e2e",
      EMAIL_FROM: "Startup Showcase <test@example.com>",
      NEXT_PUBLIC_GOOGLE_AUTH_ENABLED: "false",
      RAZORPAY_KEY_ID: "rzp_test_e2e_dummy_key",
      RAZORPAY_KEY_SECRET: "dummy_secret_e2e_testing",
      RAZORPAY_WEBHOOK_SECRET: "dummy_webhook_secret_e2e",
      NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_test_e2e_dummy_key",
      SUBMISSION_PRICE_USD_CENTS: "1000",
      ALLOW_RAZORPAY_TEST_IN_PRODUCTION: "true",
    },
  },
});
