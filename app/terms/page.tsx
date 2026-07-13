/*
  This Terms of Service template must be reviewed against Lexora's actual
  business structure, payment setup, refund policy, service providers,
  operating location, and applicable laws before launch.
  It is not a substitute for professional legal advice.
*/

import Link from "next/link";

// TODO: Replace legal contact placeholders before publishing.
const LEGAL_BUSINESS_NAME = "[LEGAL BUSINESS OR OWNER NAME]";
const TERMS_CONTACT_EMAIL = "[TERMS CONTACT EMAIL]";
const BUSINESS_LOCATION =
  "[BUSINESS LOCATION OR JURISDICTION, IF REQUIRED]";

// TODO: Replace governing-law and dispute placeholders after legal review.
const GOVERNING_LAW = "[GOVERNING LAW AND JURISDICTION]";
const DISPUTE_RESOLUTION = "[DISPUTE RESOLUTION PROCESS, IF ANY]";

// TODO: Replace the refund-policy placeholder after confirming the Polar and Lexora refund process.
const REFUND_POLICY = "[INSERT CONFIRMED REFUND POLICY BEFORE PUBLISHING]";

// TODO: Replace liability-cap placeholder after legal review, if a cap is required.
const LIABILITY_CAP = "[INSERT REVIEWED LIABILITY CAP, IF APPLICABLE]";

const hasUnresolvedPlaceholders =
  LEGAL_BUSINESS_NAME.startsWith("[") ||
  TERMS_CONTACT_EMAIL.startsWith("[") ||
  BUSINESS_LOCATION.startsWith("[") ||
  GOVERNING_LAW.startsWith("[") ||
  DISPUTE_RESOLUTION.startsWith("[") ||
  REFUND_POLICY.startsWith("[") ||
  LIABILITY_CAP.startsWith("[");

const isDevelopment = process.env.NODE_ENV === "development";

const TOC_ITEMS = [
  { id: "acceptance", label: "Acceptance" },
  { id: "eligibility", label: "Eligibility" },
  { id: "the-lexora-service", label: "The Lexora service" },
  { id: "accounts", label: "Accounts" },
  { id: "acceptable-use", label: "Acceptable use" },
  { id: "user-content", label: "User content" },
  { id: "ai-generated-output", label: "AI-generated output" },
  { id: "academic-integrity", label: "Academic integrity" },
  { id: "intellectual-property", label: "Intellectual property" },
  { id: "free-and-paid-plans", label: "Free and paid plans" },
  { id: "billing-and-renewal", label: "Billing and renewal" },
  { id: "cancellation-and-refunds", label: "Cancellation and refunds" },
  { id: "service-availability", label: "Service availability" },
  { id: "suspension-and-termination", label: "Suspension and termination" },
  { id: "third-party-services", label: "Third-party services" },
  { id: "disclaimers", label: "Disclaimers" },
  { id: "limitation-of-liability", label: "Limitation of liability" },
  { id: "indemnity", label: "Responsibility for claims" },
  { id: "changes", label: "Changes" },
  { id: "governing-law", label: "Governing law" },
  { id: "general", label: "General terms" },
  { id: "contact", label: "Contact" },
] as const;

export default function TermsPage() {
  return (
    <main style={page}>
      <style>{`
        .lexora-terms-link:hover {
          color: #5b21b6;
        }
        .lexora-terms-link:focus-visible,
        .lexora-terms-toc a:focus-visible {
          outline: 2px solid #8b5cf6;
          outline-offset: 2px;
        }
        .lexora-terms-toc a:hover {
          color: #5b21b6;
        }
        @media (min-width: 768px) {
          .lexora-terms-shell {
            padding: 28px 24px 40px !important;
          }
          .lexora-terms-card {
            padding: 40px !important;
          }
          .lexora-terms-title {
            font-size: 36px !important;
          }
          .lexora-terms-header-inner,
          .lexora-terms-footer-inner {
            padding-left: 28px !important;
            padding-right: 28px !important;
          }
        }
      `}</style>

      <header style={publicHeader}>
        <div className="lexora-terms-header-inner" style={headerInner}>
          <Link href="/" className="lexora-terms-link" style={brandLink}>
            Lexora
          </Link>
          <nav style={headerNav} aria-label="Legal pages">
            <Link href="/" className="lexora-terms-link" style={navLink}>
              Back to Lexora
            </Link>
            <Link href="/privacy" className="lexora-terms-link" style={navLink}>
              Privacy
            </Link>
            <Link href="/terms" className="lexora-terms-link" style={navLinkActive}>
              Terms
            </Link>
          </nav>
        </div>
      </header>

      <article className="lexora-terms-shell" style={shell}>
        <div className="lexora-terms-card" style={card}>
          <h1 className="lexora-terms-title" style={title}>
            Terms of Service
          </h1>
          <p style={updated}>
            Last updated:{" "}
            <time dateTime="2026-07-13">July 13, 2026</time>
          </p>

          <p style={text}>
            These Terms of Service explain the rules that apply when you create
            an account, use Lexora’s rewriting tools, save documents, contact
            support, or purchase a paid plan.
          </p>

          <aside style={summaryBox} aria-label="Terms summary">
            <h2 style={summaryTitle}>Terms at a glance</h2>
            <p style={summaryNote}>
              This short summary does not replace the full Terms below.
            </p>
            <ul style={summaryList}>
              <li>
                You remain responsible for submitted text and generated output.
              </li>
              <li>AI-generated results may contain errors.</li>
              <li>
                Paid plans are subject to plan limits and billing terms.
              </li>
              <li>Misuse may result in suspension or termination.</li>
            </ul>
          </aside>

          <nav
            className="lexora-terms-toc"
            style={toc}
            aria-label="Terms of Service sections"
          >
            <h2 style={tocTitle}>Contents</h2>
            <ul style={tocList}>
              {TOC_ITEMS.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`} style={tocLink}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <section id="acceptance" style={section}>
            <h2 style={heading}>Acceptance of these Terms</h2>
            <p style={text}>
              By accessing Lexora, creating an account, using the rewriting
              service, saving documents, or purchasing a plan, you agree to
              these Terms of Service and the{" "}
              <Link
                href="/privacy"
                className="lexora-terms-link"
                style={inlineLink}
              >
                Privacy Policy
              </Link>
              .
            </p>
            <p style={text}>
              If you do not agree, do not use Lexora.
            </p>
          </section>

          <section id="eligibility" style={section}>
            <h2 style={heading}>Eligibility</h2>
            <p style={text}>To use Lexora, you must:</p>
            <ul style={bulletList}>
              <li>
                be legally able to enter into an agreement for online services
                in your location
              </li>
              <li>
                meet the minimum age required to consent to online services
                where you live
              </li>
              <li>use Lexora only where permitted by applicable law</li>
              <li>provide accurate account information</li>
            </ul>
          </section>

          <section id="the-lexora-service" style={section}>
            <h2 style={heading}>The Lexora service</h2>
            <p style={text}>
              Lexora provides AI-assisted rewriting, tone and mode options,
              saved-document features, usage tracking, and subscription features
              where available.
            </p>
            <p style={text}>
              Output is generated automatically and may contain errors,
              unsuitable wording, or incomplete results. You must review results
              before relying on them.
            </p>
            <p style={text}>
              Lexora does not guarantee originality, accuracy, academic
              acceptance, professional suitability, or outcomes from any
              review, grading, or detection process.
            </p>
          </section>

          <section id="accounts" style={section}>
            <h2 style={heading}>Accounts</h2>
            <p style={text}>You are responsible for:</p>
            <ul style={bulletList}>
              <li>protecting your login credentials</li>
              <li>activity that occurs under your account</li>
              <li>keeping account information accurate</li>
              <li>
                notifying Lexora through{" "}
                <Link
                  href="/support"
                  className="lexora-terms-link"
                  style={inlineLink}
                >
                  Support
                </Link>{" "}
                if you suspect unauthorized access
              </li>
              <li>not sharing accounts to avoid plan limits</li>
              <li>
                not creating multiple accounts to bypass limits or promotions
              </li>
            </ul>
            <p style={text}>
              Lexora may restrict access where misuse or security concerns
              exist. Lexora cannot guarantee recovery of every compromised
              account.
            </p>
          </section>

          <section id="acceptable-use" style={section}>
            <h2 style={heading}>Acceptable use</h2>
            <p style={text}>You must not use Lexora to:</p>
            <ul style={bulletList}>
              <li>violate laws</li>
              <li>commit fraud</li>
              <li>impersonate another person</li>
              <li>harass, threaten, or exploit others</li>
              <li>create or distribute malicious content</li>
              <li>submit content you do not have permission to use</li>
              <li>
                infringe copyright, privacy, confidentiality, or other rights
              </li>
              <li>bypass usage limits</li>
              <li>interfere with the website or its security</li>
              <li>scrape, reverse engineer, or overload the service</li>
              <li>distribute malware</li>
              <li>resell access without authorization</li>
              <li>
                misrepresent AI-assisted work where disclosure is required
              </li>
            </ul>
          </section>

          <section id="user-content" style={section}>
            <h2 style={heading}>Your content</h2>
            <p style={text}>
              You retain whatever rights you already have in the text you
              submit. Lexora does not claim ownership of your documents.
            </p>
            <p style={text}>
              You grant Lexora and its service providers a limited permission
              to process submitted text, generate rewritten output, save
              documents when you request it, and transmit data to providers
              needed to operate the service. This permission exists only to
              provide and operate Lexora.
            </p>
            <p style={text}>
              You must have the right to submit the content you provide. Do not
              assume that information sent through third-party AI systems is
              confidential. Processing details are described in the{" "}
              <Link
                href="/privacy"
                className="lexora-terms-link"
                style={inlineLink}
              >
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section id="ai-generated-output" style={section}>
            <h2 style={heading}>AI-generated output</h2>
            <p style={text}>
              AI-generated output may be inaccurate, incomplete, repetitive,
              biased, or unsuitable. Similar output may be generated for
              different users.
            </p>
            <p style={text}>
              You must review and edit output before use. You are responsible
              for how you use the final text. Lexora does not guarantee
              uniqueness or non-infringement, and output should not be treated
              as professional advice.
            </p>
            <p style={text}>
              For legal, medical, financial, academic, or other high-impact
              decisions, obtain independent review from a qualified person.
            </p>
          </section>

          <section id="academic-integrity" style={section}>
            <h2 style={heading}>Academic integrity</h2>
            <p style={text}>
              Lexora is an editing and rewriting tool. It is not a substitute
              for learning, research, authorship, or independent judgment.
            </p>
            <p style={text}>You are responsible for:</p>
            <ul style={bulletList}>
              <li>
                following university, school, employer, and publisher rules
              </li>
              <li>disclosing AI assistance where required</li>
              <li>not submitting work dishonestly</li>
              <li>checking citations and facts</li>
              <li>
                ensuring your final work reflects your own understanding
              </li>
            </ul>
            <p style={text}>
              Lexora cannot determine every institution’s policy for you.
            </p>
          </section>

          <section id="intellectual-property" style={section}>
            <h2 style={heading}>Intellectual property</h2>

            <h3 style={subheading}>Lexora materials</h3>
            <p style={text}>
              The Lexora name, logo, website design, software, and service
              materials belong to Lexora or its licensors. You may not copy,
              sell, reverse engineer, or misuse them except where law permits.
            </p>

            <h3 style={subheading}>User materials</h3>
            <p style={text}>
              You retain rights in your submitted content, subject to the
              limited service permission described in these Terms. Lexora does
              not claim ownership of your work.
            </p>
          </section>

          <section id="free-and-paid-plans" style={section}>
            <h2 style={heading}>Free and paid plans</h2>
            <p style={text}>
              Free plans may include daily limits. Paid plans may include
              monthly word limits, modes, processing priority, or support.
              Exact prices and features are shown on the{" "}
              <Link
                href="/pricing"
                className="lexora-terms-link"
                style={inlineLink}
              >
                Pricing
              </Link>{" "}
              page.
            </p>
            <p style={text}>
              Plan limits reset according to the stated billing period.
              Features and limits may change prospectively. Where practical,
              Lexora will try to give existing paid users reasonable notice of
              material changes.
            </p>
          </section>

          <section id="billing-and-renewal" style={section}>
            <h2 style={heading}>Billing and subscription renewal</h2>
            <p style={text}>
              Paid subscriptions are processed through Polar and its payment
              partners. When you purchase a subscription, you authorize the
              applicable recurring charge.
            </p>
            <ul style={bulletList}>
              <li>
                Billing frequency may be monthly or yearly depending on the
                selected plan and available checkout options.
              </li>
              <li>
                Taxes or currency conversion charges may apply where relevant.
              </li>
              <li>
                Subscription access may depend on successful payment.
              </li>
              <li>
                Failed or reversed payments may result in restricted access.
              </li>
            </ul>
            <p style={text}>
              Payment information is handled by the checkout and payment
              providers rather than entered directly into Lexora’s application
              database.
            </p>
          </section>

          <section id="cancellation-and-refunds" style={section}>
            <h2 style={heading}>Cancellation and refunds</h2>

            <h3 style={subheading}>Cancellation</h3>
            <p style={text}>
              Contact Lexora{" "}
              <Link
                href="/support"
                className="lexora-terms-link"
                style={inlineLink}
              >
                Support
              </Link>{" "}
              for help managing an active subscription until account-based
              billing management is available.
            </p>
            <p style={text}>
              Cancellation normally prevents future renewal but does not
              automatically refund the current billing period, unless required
              by law or the applicable refund policy.
            </p>

            <h3 style={subheading}>Refunds</h3>
            <p style={text}>
              Refund eligibility depends on the refund policy shown at
              purchase, the payment provider’s processes, and applicable law.
            </p>
            <p style={placeholderLine}>{REFUND_POLICY}</p>

            <h3 style={subheading}>Trials and promotions</h3>
            <p style={text}>
              Lexora may occasionally offer trials, discounts, or promotional
              access. Eligibility may be limited, promotions may expire, and
              promotions may not be combined. Abuse of a promotion may result
              in cancellation of promotional access.
            </p>
          </section>

          <section id="service-availability" style={section}>
            <h2 style={heading}>Service availability</h2>
            <p style={text}>Lexora may:</p>
            <ul style={bulletList}>
              <li>experience interruptions</li>
              <li>perform maintenance</li>
              <li>change features</li>
              <li>modify providers or models</li>
              <li>impose reasonable limits</li>
              <li>discontinue features</li>
            </ul>
            <p style={text}>
              Lexora does not guarantee uninterrupted or error-free service.
              Where practical, Lexora will try to provide notice of material
              changes affecting active paid subscriptions.
            </p>
          </section>

          <section id="suspension-and-termination" style={section}>
            <h2 style={heading}>Suspension and termination</h2>
            <p style={text}>
              Lexora may suspend or terminate access for violation of these
              Terms, fraud or payment disputes, attempts to bypass limits,
              security threats, illegal use, repeated harmful misuse, or legal
              requirements.
            </p>
            <p style={text}>
              You may stop using the service at any time and request account
              deletion as described in the{" "}
              <Link
                href="/privacy"
                className="lexora-terms-link"
                style={inlineLink}
              >
                Privacy Policy
              </Link>
              . Account deletion is not always immediate from every backup,
              log, or legally required record.
            </p>
            <p style={text}>
              Provisions that by their nature should survive termination
              continue to apply, including ownership, payment obligations that
              remain due, disclaimers, liability limits, and dispute terms.
            </p>
          </section>

          <section id="third-party-services" style={section}>
            <h2 style={heading}>Third-party services</h2>
            <p style={text}>
              Lexora depends on service providers such as Supabase, Vercel,
              Together AI, and Polar. Those services have their own terms and
              availability.
            </p>
            <p style={text}>
              To the extent permitted by applicable law, Lexora is not
              responsible for every action or interruption of an independent
              provider. See the{" "}
              <Link
                href="/privacy"
                className="lexora-terms-link"
                style={inlineLink}
              >
                Privacy Policy
              </Link>{" "}
              for more information about how providers may process information.
            </p>
          </section>

          <section id="disclaimers" style={section}>
            <h2 style={heading}>Disclaimers</h2>
            <p style={text}>
              To the extent permitted by applicable law, Lexora is provided on
              an “as available” basis.
            </p>
            <p style={text}>Lexora does not guarantee:</p>
            <ul style={bulletList}>
              <li>uninterrupted availability</li>
              <li>error-free output</li>
              <li>accuracy</li>
              <li>originality</li>
              <li>suitability for a particular purpose</li>
              <li>
                acceptance by schools, employers, publishers, or detection
                tools
              </li>
              <li>preservation of every formatting detail</li>
            </ul>
            <p style={text}>
              Nothing in these Terms is intended to exclude rights that cannot
              legally be limited or excluded.
            </p>
          </section>

          <section id="limitation-of-liability" style={section}>
            <h2 style={heading}>Limitation of liability</h2>
            <p style={text}>
              To the extent permitted by applicable law, Lexora is not liable
              for indirect or consequential losses resulting from use of
              output, lost data, account interruption, business or academic
              decisions, third-party services, or unauthorized account use.
            </p>
            <p style={placeholderLine}>{LIABILITY_CAP}</p>
          </section>

          <section id="indemnity" style={section}>
            <h2 style={heading}>Responsibility for claims</h2>
            <p style={text}>
              To the extent permitted by applicable law, you may be responsible
              for claims or costs caused by unlawful use of Lexora,
              infringement of others’ rights, misuse of submitted content, or
              serious breach of these Terms.
            </p>
          </section>

          <section id="changes" style={section}>
            <h2 style={heading}>Changes to these Terms</h2>
            <p style={text}>
              Lexora may revise these Terms. When a revised version is
              published, the “Last updated” date will change. Material changes
              may be communicated through the website, email, or account notice
              where practical.
            </p>
            <p style={text}>
              Where permitted by law, continued use after updated Terms take
              effect may constitute acceptance.
            </p>
          </section>

          <section id="governing-law" style={section}>
            <h2 style={heading}>Governing law and disputes</h2>
            <p style={text}>
              The laws and dispute process that apply to these Terms will be
              confirmed before publication.
            </p>
            <p style={placeholderLine}>{GOVERNING_LAW}</p>
            <p style={placeholderLine}>{DISPUTE_RESOLUTION}</p>
          </section>

          <section id="general" style={section}>
            <h2 style={heading}>General terms</h2>

            <h3 style={subheading}>Severability</h3>
            <p style={text}>
              If one provision is unenforceable, the remaining Terms continue
              where permitted.
            </p>

            <h3 style={subheading}>No waiver</h3>
            <p style={text}>
              Failure to enforce a provision immediately does not automatically
              waive it.
            </p>

            <h3 style={subheading}>Entire agreement</h3>
            <p style={text}>
              These Terms and the{" "}
              <Link
                href="/privacy"
                className="lexora-terms-link"
                style={inlineLink}
              >
                Privacy Policy
              </Link>{" "}
              form the agreement concerning use of Lexora, subject to any
              additional terms shown during purchase.
            </p>
          </section>

          <section id="contact" style={section}>
            <h2 style={heading}>Contact</h2>
            <p style={text}>
              For questions about these Terms, contact Lexora through the{" "}
              <Link
                href="/support"
                className="lexora-terms-link"
                style={inlineLink}
              >
                Support
              </Link>{" "}
              page.
            </p>
            <div style={contactBox}>
              <p style={contactLine}>{LEGAL_BUSINESS_NAME}</p>
              <p style={contactLine}>{TERMS_CONTACT_EMAIL}</p>
              <p style={contactLine}>{BUSINESS_LOCATION}</p>
              {isDevelopment && hasUnresolvedPlaceholders ? (
                <p style={devPlaceholderNote} role="status">
                  Dev only: replace the bracketed legal placeholders before
                  publishing.
                </p>
              ) : null}
            </div>
          </section>
        </div>
      </article>

      <footer style={publicFooter}>
        <div className="lexora-terms-footer-inner" style={footerInner}>
          <p style={footerCopy}>© 2026 Lexora</p>
          <nav style={footerNav} aria-label="Footer">
            <Link
              href="/privacy"
              className="lexora-terms-link"
              style={footerLink}
            >
              Privacy Policy
            </Link>
            <Link href="/terms" className="lexora-terms-link" style={footerLink}>
              Terms of Service
            </Link>
            <Link
              href="/support"
              className="lexora-terms-link"
              style={footerLink}
            >
              Support
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}

const page = {
  minHeight: "100vh",
  backgroundImage:
    "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(139, 92, 246, 0.08), transparent 55%), linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
  backgroundColor: "#f8fafc",
  fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
  color: "#0f172a",
  display: "flex",
  flexDirection: "column" as const,
};

const publicHeader = {
  borderBottom: "1px solid #e8eaf0",
  background: "rgba(248, 250, 252, 0.92)",
  backdropFilter: "blur(8px)",
  position: "sticky" as const,
  top: 0,
  zIndex: 20,
};

const headerInner = {
  width: "100%",
  maxWidth: "900px",
  margin: "0 auto",
  padding: "14px 16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  boxSizing: "border-box" as const,
};

const brandLink = {
  color: "#0f172a",
  textDecoration: "none",
  fontWeight: 800 as const,
  fontSize: "20px",
  letterSpacing: "-0.03em",
};

const headerNav = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "8px 14px",
  justifyContent: "flex-end",
};

const navLink = {
  color: "#64748b",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: 500 as const,
  minHeight: "40px",
  display: "inline-flex",
  alignItems: "center",
};

const navLinkActive = {
  ...navLink,
  color: "#6d28d9",
  fontWeight: 600 as const,
};

const shell = {
  width: "100%",
  maxWidth: "900px",
  margin: "0 auto",
  padding: "20px 16px 32px",
  boxSizing: "border-box" as const,
  flex: 1,
};

const card = {
  width: "100%",
  background: "#ffffff",
  borderRadius: "16px",
  padding: "24px 18px",
  boxShadow: "0 12px 36px rgba(15, 23, 42, 0.06)",
  border: "1px solid #e2e8f0",
  boxSizing: "border-box" as const,
};

const title = {
  fontSize: "30px",
  margin: "0 0 8px",
  color: "#0f172a",
  fontWeight: 700 as const,
  letterSpacing: "-0.03em",
  lineHeight: 1.2,
};

const updated = {
  color: "#64748b",
  margin: "0 0 22px",
  fontSize: "14px",
};

const summaryBox = {
  background: "#faf5ff",
  border: "1px solid #e9d5ff",
  borderRadius: "14px",
  padding: "18px",
  margin: "22px 0",
};

const summaryTitle = {
  margin: "0 0 6px",
  fontSize: "16px",
  fontWeight: 700 as const,
  color: "#0f172a",
};

const summaryNote = {
  margin: "0 0 12px",
  color: "#64748b",
  fontSize: "13px",
  lineHeight: 1.5,
};

const summaryList = {
  margin: 0,
  paddingLeft: "18px",
  color: "#334155",
  fontSize: "14px",
  lineHeight: 1.7,
};

const toc = {
  border: "1px solid #e8eaf0",
  borderRadius: "14px",
  padding: "16px 18px",
  marginBottom: "8px",
  background: "#fafbfc",
};

const tocTitle = {
  margin: "0 0 10px",
  fontSize: "15px",
  fontWeight: 700 as const,
  color: "#0f172a",
};

const tocList = {
  margin: 0,
  paddingLeft: "18px",
  display: "grid",
  gap: "8px",
};

const tocLink = {
  color: "#6d28d9",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: 500 as const,
  lineHeight: 1.4,
};

const section = {
  borderTop: "1px solid #e8eaf0",
  paddingTop: "24px",
  marginTop: "24px",
};

const heading = {
  fontSize: "22px",
  margin: "0 0 12px",
  color: "#0f172a",
  fontWeight: 700 as const,
  letterSpacing: "-0.02em",
};

const subheading = {
  fontSize: "16px",
  margin: "18px 0 8px",
  color: "#0f172a",
  fontWeight: 600 as const,
};

const text = {
  lineHeight: 1.7,
  color: "#475569",
  margin: "0 0 14px",
  fontSize: "16px",
};

const bulletList = {
  margin: "0 0 14px",
  paddingLeft: "20px",
  color: "#475569",
  fontSize: "16px",
  lineHeight: 1.7,
};

const inlineLink = {
  color: "#6d28d9",
  textDecoration: "none",
  fontWeight: 600 as const,
};

const placeholderLine = {
  ...text,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  color: "#64748b",
  fontSize: "14px",
  background: "#f8fafc",
  border: "1px dashed #cbd5e1",
  borderRadius: "10px",
  padding: "12px 14px",
};

const contactBox = {
  marginTop: "8px",
  padding: "14px 16px",
  borderRadius: "12px",
  border: "1px dashed #cbd5e1",
  background: "#f8fafc",
};

const contactLine = {
  margin: "0 0 6px",
  color: "#64748b",
  fontSize: "14px",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const devPlaceholderNote = {
  margin: "10px 0 0",
  color: "#92400e",
  fontSize: "12px",
  lineHeight: 1.5,
  fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
};

const publicFooter = {
  borderTop: "1px solid #e8eaf0",
  background: "#ffffff",
  marginTop: "auto",
};

const footerInner = {
  width: "100%",
  maxWidth: "900px",
  margin: "0 auto",
  padding: "18px 16px",
  display: "flex",
  flexWrap: "wrap" as const,
  justifyContent: "space-between",
  gap: "12px",
  boxSizing: "border-box" as const,
  alignItems: "center",
};

const footerCopy = {
  margin: 0,
  color: "#94a3b8",
  fontSize: "13px",
};

const footerNav = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "8px 16px",
};

const footerLink = {
  color: "#64748b",
  textDecoration: "none",
  fontSize: "13px",
  fontWeight: 500 as const,
  minHeight: "40px",
  display: "inline-flex",
  alignItems: "center",
};
