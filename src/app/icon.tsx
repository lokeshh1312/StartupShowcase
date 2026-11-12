import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};
export const contentType = "image/png";

export default function Icon() {
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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 100 100"
          width="64"
          height="64"
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
      </div>
    ),
    {
      ...size,
    }
  );
}
