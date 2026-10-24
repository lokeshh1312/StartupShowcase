import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Join the global showcase to launch, vote, and explore early-stage innovations.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
