import { ImageResponse } from "next/og";

export const alt = "Startup Showcase - Discover Emerging Startups";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
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
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              backgroundColor: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 800,
              fontSize: "26px",
            }}
          >
            S
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.5px",
            }}
          >
            Startup Showcase
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              fontSize: "56px",
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: 1.1,
              maxWidth: "1000px",
              letterSpacing: "-1px",
            }}
          >
            Discover Emerging Global Startups
          </div>
          <div
            style={{
              fontSize: "24px",
              color: "#94a3b8",
              maxWidth: "900px",
              lineHeight: 1.4,
            }}
          >
            Monthly leaderboards, curated directories, and community votes for early-stage tech innovations from around the world.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            fontSize: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "rgba(37, 99, 235, 0.2)",
              color: "#60a5fa",
              padding: "8px 18px",
              borderRadius: "999px",
              fontWeight: 600,
            }}
          >
            Global Early-Stage Discovery
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
