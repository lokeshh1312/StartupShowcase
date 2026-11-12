import { ImageResponse } from "next/og";

export const alt = "Startup Showcase Global - Discover Emerging Startups";
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
          backgroundColor: "#ffffff",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 100"
            width="68"
            height="68"
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
              fontSize: "32px",
              fontWeight: 800,
              color: "#171717",
              letterSpacing: "-0.5px",
            }}
          >
            Startup Showcase Global
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              fontSize: "56px",
              fontWeight: 900,
              color: "#171717",
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
              color: "#6b6b6b",
              maxWidth: "920px",
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
              backgroundColor: "#fff4eb",
              color: "#e65c00",
              padding: "8px 20px",
              borderRadius: "999px",
              fontWeight: 600,
              border: "1px solid rgba(255, 102, 0, 0.25)",
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
