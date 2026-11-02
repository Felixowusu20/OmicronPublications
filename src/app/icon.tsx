import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Fallback OG icon — browsers prefer /favicon.png from metadata.icons. */
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
          background: "#ffffff",
          borderRadius: 6,
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 999,
            border: "5px solid #C84E27",
            boxSizing: "border-box",
            position: "relative",
            display: "flex",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -3,
              right: -3,
              width: 8,
              height: 8,
              borderRadius: 999,
              background: "#1A3A5A",
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
