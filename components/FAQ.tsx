"use client";

import { useId, useState } from "react";

type FAQProps = {
  onNavigate: (path: string) => void;
};

const FAQ_ITEMS = [
  {
    question: "Is my content stored?",
    answer:
      "Only documents you choose to save are stored in your account. We do not publish or share your writing.",
  },
  {
    question: "Can I use Lexora for assignments?",
    answer:
      "Lexora helps refine clarity and tone. Always follow your school or workplace guidelines for AI-assisted writing.",
  },
  {
    question: "Which mode should I choose?",
    answer:
      "Start with Free or Fast for everyday rewriting. Use Creative for more expressive drafts and Enhanced for polished results.",
  },
  {
    question: "Is Lexora free to use?",
    answer:
      "Yes. The free plan includes 10 humanizations per day. Upgrade anytime for unlimited usage and premium modes.",
  },
] as const;

export default function FAQ({ onNavigate }: FAQProps) {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section style={faqSection}>
      <style>{`
        .lexora-faq-trigger:hover {
          background: #faf5ff;
        }
        .lexora-faq-link:hover {
          color: #5b21b6;
        }
      `}</style>

      <div style={headerBlock}>
        <h2 style={sectionTitle}>Frequently asked questions</h2>
        <p style={sectionSubtitle}>
          Quick answers about privacy, usage, and plans.
        </p>
      </div>

      <div style={faqList}>
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = openIndex === index;
          const panelId = `${baseId}-panel-${index}`;
          const buttonId = `${baseId}-button-${index}`;

          return (
            <div key={item.question} style={faqItem}>
              <h3 style={faqHeading}>
                <button
                  type="button"
                  id={buttonId}
                  className="lexora-faq-trigger"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  style={faqTrigger}
                >
                  <span>{item.question}</span>
                  <span style={chevron} aria-hidden>
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
              </h3>

              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                hidden={!isOpen}
                style={{
                  ...faqPanel,
                  display: isOpen ? "block" : "none",
                }}
              >
                <p style={faqAnswer}>{item.answer}</p>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="lexora-faq-link"
        onClick={() => onNavigate("/support")}
        style={faqButton}
      >
        View all FAQs →
      </button>
    </section>
  );
}

const faqSection = {
  marginTop: "56px",
  maxWidth: "720px",
  marginLeft: "auto",
  marginRight: "auto",
};

const headerBlock = {
  textAlign: "center" as const,
  marginBottom: "24px",
};

const sectionTitle = {
  margin: "0 0 8px",
  fontSize: "28px",
  fontWeight: 750 as const,
  letterSpacing: "-0.03em",
  color: "#0f172a",
};

const sectionSubtitle = {
  margin: 0,
  color: "#64748b",
  fontSize: "15px",
};

const faqList = {
  display: "grid",
  gap: "10px",
};

const faqItem = {
  background: "#ffffff",
  border: "1px solid #e8eaf0",
  borderRadius: "12px",
  overflow: "hidden",
};

const faqHeading = {
  margin: 0,
  fontSize: "inherit",
  fontWeight: "inherit" as const,
};

const faqTrigger = {
  width: "100%",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  padding: "16px 18px",
  border: "none",
  background: "#ffffff",
  color: "#0f172a",
  fontWeight: 600 as const,
  fontSize: "15px",
  textAlign: "left" as const,
  cursor: "pointer",
  transition: "background 0.15s ease",
};

const chevron = {
  color: "#7c3aed",
  fontSize: "18px",
  fontWeight: 500 as const,
  lineHeight: 1,
  flexShrink: 0,
};

const faqPanel = {
  padding: "0 18px 16px",
  borderTop: "1px solid #f1f5f9",
};

const faqAnswer = {
  margin: "12px 0 0",
  color: "#64748b",
  fontSize: "14px",
  lineHeight: 1.6,
};

const faqButton = {
  marginTop: "18px",
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "none",
  background: "transparent",
  color: "#7c3aed",
  fontWeight: 600 as const,
  cursor: "pointer",
  fontSize: "14px",
  transition: "color 0.15s ease",
};
