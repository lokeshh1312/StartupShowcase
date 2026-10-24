import { ImageResponse } from "next/og";
import { getStartupBySlug } from "@/server/startups";

export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const result = await getStartupBySlug(slug);

  const name = result?.startup?.name || "Startup";
  const tagline =
    result?.startup?.tagline ||
    result?.startup?.ideaTitle ||
    "Early-stage tech startup";
  const category = result?.startup?.category || "Technology";
  const stage = result?.startup?.stage || "MVP";
  const monthLabel = result?.startup?.monthLabel || "";
  const logoColor = result?.startup?.logoColor || "#2563EB";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          backgroundColor: "#090d16",
          padding: "70px 80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top bar with site branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: 800,
                fontSize: "22px",
              }}
            >
              S
            </div>
            <div
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#94a3b8",
                letterSpacing: "-0.5px",
              }}
            >
              Startup Showcase
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                backgroundColor: "rgba(37, 99, 235, 0.2)",
                color: "#60a5fa",
                padding: "6px 14px",
                borderRadius: "999px",
                fontSize: "16px",
                fontWeight: 600,
              }}
            >
              {category}
            </div>
            <div
              style={{
                backgroundColor: "rgba(148, 163, 184, 0.15)",
                color: "#cbd5e1",
                padding: "6px 14px",
                borderRadius: "999px",
                fontSize: "16px",
                fontWeight: 600,
              }}
            >
              {stage}
            </div>
          </div>
        </div>

        {/* Center: Startup Logo, Name, and Tagline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            maxWidth: "1040px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <div
              style={{
                width: "84px",
                height: "84px",
                borderRadius: "24px",
                backgroundColor: logoColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "42px",
                fontWeight: 800,
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
              }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
            <div
              style={{
                fontSize: "64px",
                fontWeight: 900,
                color: "#ffffff",
                letterSpacing: "-1.5px",
                lineHeight: 1.1,
              }}
            >
              {name}
            </div>
          </div>

          <div
            style={{
              fontSize: "28px",
              color: "#cbd5e1",
              lineHeight: 1.35,
              fontWeight: 400,
              maxWidth: "1000px",
            }}
          >
            {tagline}
          </div>
        </div>

        {/* Footer info */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            fontSize: "18px",
            color: "#64748b",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            paddingTop: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>Cohort:</span>
            <span style={{ color: "#e2e8f0", fontWeight: 600 }}>
              {monthLabel || "Global Showcase"}
            </span>
          </div>
          <div style={{ color: "#3b82f6", fontWeight: 600 }}>
            Vote & support on Startup Showcase
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
