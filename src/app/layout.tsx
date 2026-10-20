import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import {
  parseThemeCookie,
  resolveThemeClass,
  themeInitScript,
} from "@/lib/theme";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Startup Showcase | Discover Emerging Startups",
  description:
    "Discover emerging startups, explore new products, and support founders building the next generation of ideas.",
  robots: "index, follow",
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
        className={`${inter.variable} font-sans antialiased selection:bg-blue-600/15 selection:text-blue-700 min-h-screen`}
      >
        <ThemeProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
