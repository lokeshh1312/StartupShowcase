import { ImageResponse } from "next/og";
import fs from "node:fs/promises";
import path from "node:path";

export const alt = "Startup Showcase Global - Discover Emerging Startups";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  const logoBuffer = await fs.readFile(
    path.join(process.cwd(), "public", "logo-mark.png")
  );
  const logoDataUri = `data:image/png;base64,${logoBuffer.toString("base64")}`;

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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoDataUri}
            alt=""
            width={68}
            height={90}
            style={{
              objectFit: "contain",
            }}
          />
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
              backgroundColor: "#fff1ef",
              color: "#d73e2d",
              padding: "8px 20px",
              borderRadius: "999px",
              fontWeight: 600,
              border: "1px solid rgba(255, 97, 84, 0.25)",
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
