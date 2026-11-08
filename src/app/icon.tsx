import { ImageResponse } from "next/og";
import fs from "node:fs/promises";
import path from "node:path";

export const size = {
  width: 64,
  height: 64,
};
export const contentType = "image/png";

export default async function Icon() {
  const logoBuffer = await fs.readFile(
    path.join(process.cwd(), "public", "logo-mark.png")
  );
  const logoDataUri = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "transparent",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoDataUri}
          alt=""
          width={49}
          height={64}
          style={{
            objectFit: "contain",
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
