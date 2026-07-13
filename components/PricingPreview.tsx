"use client";

type PricingPreviewProps = {
  onNavigate: (path: string) => void;
};

export default function PricingPreview({ onNavigate }: PricingPreviewProps) {
  return (
    <section style={ctaBox}>
      <style>{`
        .lexora-pricing-cta:hover {
          filter: brightness(1.06);
          transform: translateY(-1px);
        }
      `}</style>

      <div style={ctaContent}>
        <p style={eyebrow}>Pricing</p>
        <h2 style={title}>Need more than the free plan?</h2>
        <p style={subtitle}>
          Upgrade for unlimited humanizations, premium modes, and priority support.
        </p>
      </div>

      <button
        type="button"
        className="lexora-pricing-cta"
        onClick={() => onNavigate("/pricing")}
        style={ctaButton}
      >
        View pricing
      </button>
    </section>
  );
}

const ctaBox = {
  marginTop: "56px",
  width: "100%",
  boxSizing: "border-box" as const,
  background: "linear-gradient(135deg, #5b21b6 0%, #7c3aed 55%, #a78bfa 100%)",
  borderRadius: "16px",
  padding: "28px 32px",
  display: "flex",
  flexWrap: "wrap" as const,
  alignItems: "center",
  justifyContent: "space-between",
  gap: "20px",
  boxShadow: "0 12px 32px rgba(91, 33, 182, 0.18)",
};

const ctaContent = {
  flex: "1 1 260px",
  minWidth: 0,
};

const eyebrow = {
  margin: "0 0 8px",
  fontSize: "11px",
  fontWeight: 700 as const,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  color: "rgba(255,255,255,0.75)",
};

const title = {
  margin: "0 0 8px",
  fontSize: "22px",
  fontWeight: 700 as const,
  color: "#ffffff",
  letterSpacing: "-0.02em",
  lineHeight: 1.25,
};

const subtitle = {
  margin: 0,
  fontSize: "15px",
  lineHeight: 1.6,
  color: "rgba(255,255,255,0.85)",
  maxWidth: "480px",
};

const ctaButton = {
  padding: "12px 22px",
  borderRadius: "11px",
  border: "none",
  background: "#ffffff",
  color: "#5b21b6",
  fontWeight: 600 as const,
  cursor: "pointer",
  fontSize: "14px",
  whiteSpace: "nowrap" as const,
  transition: "filter 0.15s ease, transform 0.15s ease",
  flexShrink: 0,
};
