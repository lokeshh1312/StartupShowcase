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
  const logoColor = result?.startup?.logoColor || "#ff6600";

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
          backgroundColor: "#ffffff",
          padding: "70px 80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top bar with site branding & chips */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 100 100"
              width="32"
              height="32"
              fill="none"
            >
              <circle cx="50" cy="50" r="16.7" fill="#ff6600" />
              <g fill="none" stroke="#ff6600">
                <path
                  d="M13.29 59.84A38 38 0 0 1 70.7 18.13"
                  strokeWidth="4.3"
                />
                <path
                  d="M86.71 40.16A38 38 0 0 1 29.3 81.87"
                  strokeWidth="4.3"
                />
                <circle cx="76.87" cy="23.13" r="7.45" strokeWidth="4.1" />
                <circle cx="23.13" cy="76.87" r="7.45" strokeWidth="4.1" />
              </g>
            </svg>
            <div
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#171717",
                letterSpacing: "-0.5px",
              }}
            >
              Startup Showcase Global
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                backgroundColor: "#fff4eb",
                color: "#e65c00",
                padding: "6px 14px",
                borderRadius: "999px",
                fontSize: "16px",
                fontWeight: 600,
                border: "1px solid rgba(255, 102, 0, 0.2)",
              }}
            >
              {category}
            </div>
            <div
              style={{
                backgroundColor: "#f5f5f5",
                color: "#525252",
                border: "1px solid #e5e5e5",
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
                boxShadow: "0 6px 18px rgba(0, 0, 0, 0.08)",
              }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
            <div
              style={{
                fontSize: "64px",
                fontWeight: 900,
                color: "#171717",
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
              color: "#6b6b6b",
              lineHeight: 1.35,
              fontWeight: 400,
              maxWidth: "1000px",
            }}
          >
            {tagline}
          </div>
        </div>

        {/* Footer line */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            fontSize: "18px",
            color: "#6b6b6b",
            borderTop: "1px solid #e5e5e5",
            paddingTop: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>Cohort:</span>
            <span style={{ color: "#171717", fontWeight: 600 }}>
              {monthLabel || "Global Showcase"}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#e65c00",
              fontWeight: 600,
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 100 100"
              width="20"
              height="20"
              fill="none"
            >
              <circle cx="50" cy="50" r="16.7" fill="#ff6600" />
              <g fill="none" stroke="#ff6600">
                <path
                  d="M13.29 59.84A38 38 0 0 1 70.7 18.13"
                  strokeWidth="4.3"
                />
                <path
                  d="M86.71 40.16A38 38 0 0 1 29.3 81.87"
                  strokeWidth="4.3"
                />
                <circle cx="76.87" cy="23.13" r="7.45" strokeWidth="4.1" />
                <circle cx="23.13" cy="76.87" r="7.45" strokeWidth="4.1" />
              </g>
            </svg>
            <span>Startup Showcase Global</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
