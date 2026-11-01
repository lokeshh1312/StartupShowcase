import type { Metadata } from "next";
import { cookies } from "next/headers";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import {
  parseThemeCookie,
  resolveThemeClass,
  themeInitScript,
} from "@/lib/theme";
import { getCurrentUserProfile } from "@/lib/supabase/server";
import { getBaseUrl } from "@/lib/urls";
import { UnverifiedBanner } from "@/components/common/unverified-banner";
import { Analytics } from "@/components/analytics";
import "./globals.css";

const inter = localFont({
  src: "./fonts/Inter-Variable.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
});

const instrumentSerif = localFont({
  src: "./fonts/InstrumentSerif-Italic.woff2",
  variable: "--font-serif-italic",
  display: "swap",
  style: "italic",
});

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: "Startup Showcase | Discover Emerging Startups",
    template: "%s | Startup Showcase",
  },
  description:
    "Discover emerging startups, explore new products, and support founders building the next generation of ideas.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Read the theme cookie on the server so the initial HTML already
  // carries the correct class.  For "system" we fall back to "light"
  // on the server (the inline script corrects it before first paint).
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("theme")?.value ?? null;
  const preference = parseThemeCookie(`theme=${themeCookie}`);
  const serverResolved = resolveThemeClass(preference, false);

  const authData = await getCurrentUserProfile();

  return (
    <html
      lang="en"
      className={serverResolved}
      data-theme={serverResolved}
      suppressHydrationWarning
    >
      <head>
        {/* Inline script runs before first paint — resolves system
            preference and sets the class so there is no flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${inter.variable} ${instrumentSerif.variable} font-sans antialiased selection:bg-brand-500/20 selection:text-brand-700 min-h-screen`}
      >
        <ThemeProvider>
          <div className="min-h-screen flex flex-col" id="top">
            {authData?.user && !authData.user.email_confirmed_at && (
              <UnverifiedBanner email={authData.user.email || ""} />
            )}
            <Navbar user={authData?.user} profile={authData?.profile} />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
