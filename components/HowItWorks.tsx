"use client";

type HowItWorksProps = {
  isMobile: boolean;
};

const STEPS = [
  {
    step: "01",
    title: "Paste text",
    description: "Drop AI-generated content into the editor.",
  },
  {
    step: "02",
    title: "Choose mode",
    description: "Pick a rewrite style and tone that fits.",
  },
  {
    step: "03",
    title: "Humanize",
    description: "Convert stiff AI writing into natural language.",
  },
  {
    step: "04",
    title: "Save",
    description: "Copy or save your result for later.",
  },
] as const;

const BENEFITS = [
  {
    title: "Natural rewriting",
    description: "Makes AI content sound clear and human-written.",
  },
  {
    title: "Multiple modes",
    description: "Free, Fast, Creative, and Enhanced styles.",
  },
  {
    title: "Private by design",
    description: "Your content is never shared publicly.",
  },
  {
    title: "Fast results",
    description: "Get rewritten text in seconds.",
  },
] as const;

export default function HowItWorks({ isMobile }: HowItWorksProps) {
  return (
    <>
      <section>
        <h2 style={sectionTitle}>How Lexora works</h2>
        <p style={sectionSubtitle}>
          Transform AI-generated content in four simple steps.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)",
            gap: isMobile ? "12px" : "16px",
          }}
        >
          {STEPS.map(({ step, title, description }) => (
            <div key={step} style={featureCard}>
              <span style={stepBadge}>{step}</span>
              <h3 style={cardTitle}>{title}</h3>
              <p style={mutedSmall}>{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={sectionBlock}>
        <h2 style={sectionTitle}>Why Lexora</h2>
        <p style={sectionSubtitle}>
          Built to make writing clearer, natural, and professional.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)",
            gap: isMobile ? "12px" : "16px",
          }}
        >
          {BENEFITS.map(({ title, description }) => (
            <div key={title} style={featureCard}>
              <h3 style={cardTitle}>{title}</h3>
              <p style={mutedSmall}>{description}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

const sectionBlock = {
  marginTop: "56px",
};

const sectionTitle = {
  textAlign: "center" as const,
  fontSize: "28px",
  fontWeight: 750 as const,
  margin: "0 0 8px",
  letterSpacing: "-0.03em",
  color: "#0f172a",
};

const sectionSubtitle = {
  textAlign: "center" as const,
  color: "#64748b",
  margin: "0 0 28px",
  fontSize: "15px",
};

const featureCard = {
  background: "#ffffff",
  border: "1px solid #e8eaf0",
  borderRadius: "14px",
  padding: "20px",
  textAlign: "left" as const,
  boxShadow: "0 4px 16px rgba(15,23,42,0.03)",
};

const stepBadge = {
  display: "inline-block",
  fontSize: "12px",
  fontWeight: 700 as const,
  color: "#7c3aed",
  background: "#f3e8ff",
  padding: "4px 8px",
  borderRadius: "6px",
  marginBottom: "12px",
  letterSpacing: "0.04em",
};

const cardTitle = {
  margin: "0 0 6px",
  fontSize: "16px",
  fontWeight: 700 as const,
  color: "#0f172a",
};

const mutedSmall = {
  color: "#64748b",
  lineHeight: 1.5,
  fontSize: "14px",
  margin: 0,
};
