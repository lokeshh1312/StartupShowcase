import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "The Early Discovery Radar Newsletter | Startup Showcase",
  description:
    "Join founders, angels, and early adopters reading our weekly briefing on breakthrough startups, prototypes, and cohort leaders.",
  path: "/newsletter",
});

export default function NewsletterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
