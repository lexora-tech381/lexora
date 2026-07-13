"use client";

type BrandLogoProps = {
  size?: "sm" | "md";
  showWordmark?: boolean;
};

export default function BrandLogo({
  size = "md",
  showWordmark = true,
}: BrandLogoProps) {
  const markSize = size === "sm" ? 34 : 42;
  const markInner = size === "sm" ? 12 : 16;
  const markStroke = size === "sm" ? 5 : 6;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <div
        style={{
          width: markSize,
          height: markSize,
          background: "linear-gradient(135deg,#5b21b6,#c084fc)",
          clipPath: "polygon(25% 6%,75% 6%,100% 50%,75% 94%,25% 94%,0% 50%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
        aria-hidden
      >
        <div
          style={{
            width: markInner,
            height: Math.round(markInner * 1.35),
            borderLeft: `${markStroke}px solid white`,
            borderBottom: `${markStroke}px solid white`,
            borderBottomLeftRadius: "8px",
          }}
        />
      </div>
      {showWordmark && (
        <span
          style={{
            margin: 0,
            fontSize: size === "sm" ? "20px" : "24px",
            fontWeight: 800,
            color: "#0f172a",
            letterSpacing: "-0.03em",
          }}
        >
          Lexora
        </span>
      )}
    </div>
  );
}
