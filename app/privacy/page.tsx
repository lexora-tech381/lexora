/*
  This policy template must be reviewed against Lexora's actual data flows,
  provider configurations, business location, and applicable laws before launch.
  It is not a substitute for professional legal advice.
*/

import Link from "next/link";

// TODO: Replace legal contact placeholders before publishing.
const LEGAL_BUSINESS_NAME = "[LEGAL BUSINESS OR OWNER NAME]";
const PRIVACY_CONTACT_EMAIL = "[PRIVACY CONTACT EMAIL]";
const BUSINESS_LOCATION =
  "[BUSINESS LOCATION OR JURISDICTION, IF REQUIRED]";

const hasUnresolvedPlaceholders =
  LEGAL_BUSINESS_NAME.startsWith("[") ||
  PRIVACY_CONTACT_EMAIL.startsWith("[") ||
  BUSINESS_LOCATION.startsWith("[");

const isDevelopment = process.env.NODE_ENV === "development";

const TOC_ITEMS = [
  { id: "information-collected", label: "Information collected" },
  { id: "how-information-is-used", label: "How information is used" },
  { id: "ai-processing", label: "AI processing" },
  { id: "saved-documents", label: "Saved documents" },
  { id: "third-party-services", label: "Third-party services" },
  { id: "retention", label: "Retention" },
  { id: "security", label: "Security" },
  { id: "choices-and-rights", label: "Your choices and rights" },
  { id: "children", label: "Children" },
  { id: "international-processing", label: "International processing" },
  { id: "cookies", label: "Cookies" },
  { id: "business-transfers", label: "Business transfers" },
  { id: "changes", label: "Changes" },
  { id: "contact", label: "Contact" },
] as const;

const PROVIDERS = [
  {
    name: "Supabase",
    purpose: "Authentication and database storage",
    information:
      "Account details, saved documents, usage records, and application data",
  },
  {
    name: "Vercel",
    purpose: "Website hosting and delivery",
    information: "Technical request and service-operation data",
  },
  {
    name: "Together AI",
    purpose: "AI text processing",
    information: "Text submitted for rewriting and generated output",
  },
  {
    name: "Polar",
    purpose: "Checkout, subscriptions, and billing",
    information:
      "Contact, transaction, subscription, and payment-related information",
  },
] as const;

export default function PrivacyPage() {
  return (
    <main style={page}>
      <style>{`
        .lexora-privacy-link:hover {
          color: #5b21b6;
        }
        .lexora-privacy-link:focus-visible,
        .lexora-privacy-toc a:focus-visible {
          outline: 2px solid #8b5cf6;
          outline-offset: 2px;
        }
        .lexora-privacy-toc a:hover {
          color: #5b21b6;
        }
        .lexora-provider-table {
          display: none;
        }
        .lexora-provider-cards {
          display: grid;
          gap: 12px;
        }
        @media (min-width: 768px) {
          .lexora-provider-table {
            display: table;
            width: 100%;
            border-collapse: collapse;
          }
          .lexora-provider-cards {
            display: none;
          }
          .lexora-privacy-shell {
            padding: 28px 24px 40px !important;
          }
          .lexora-privacy-card {
            padding: 40px !important;
          }
          .lexora-privacy-title {
            font-size: 36px !important;
          }
          .lexora-privacy-header-inner,
          .lexora-privacy-footer-inner {
            padding-left: 28px !important;
            padding-right: 28px !important;
          }
        }
      `}</style>

      <header style={publicHeader}>
        <div className="lexora-privacy-header-inner" style={headerInner}>
          <Link href="/" className="lexora-privacy-link" style={brandLink}>
            Lexora
          </Link>
          <nav style={headerNav} aria-label="Legal pages">
            <Link href="/" className="lexora-privacy-link" style={navLink}>
              Back to Lexora
            </Link>
            <Link href="/privacy" className="lexora-privacy-link" style={navLinkActive}>
              Privacy
            </Link>
            <Link href="/terms" className="lexora-privacy-link" style={navLink}>
              Terms
            </Link>
          </nav>
        </div>
      </header>

      <article className="lexora-privacy-shell" style={shell}>
        <div className="lexora-privacy-card" style={card}>
          <h1 className="lexora-privacy-title" style={title}>
            Privacy Policy
          </h1>
          <p style={updated}>
            Last updated:{" "}
            <time dateTime="2026-07-13">July 13, 2026</time>
          </p>

          <p style={text}>
            Lexora is an AI writing assistant that helps rewrite text for
            clarity, tone, and readability. This Privacy Policy explains how
            Lexora collects, uses, stores, and shares information when you use
            the Lexora website, create an account, submit text for rewriting,
            save documents, contact support, or purchase a subscription.
          </p>
          <p style={text}>
            By using Lexora, you acknowledge that information may be processed
            as described in this policy.
          </p>

          <aside style={summaryBox} aria-label="Privacy summary">
            <h2 style={summaryTitle}>Privacy at a glance</h2>
            <p style={summaryNote}>
              This short summary does not replace the full policy below.
            </p>
            <ul style={summaryList}>
              <li>Account information may be stored.</li>
              <li>Submitted text is processed to provide rewriting.</li>
              <li>
                Saved documents remain in your workspace until you delete them.
              </li>
              <li>Third-party providers help operate the service.</li>
            </ul>
          </aside>

          <nav
            className="lexora-privacy-toc"
            style={toc}
            aria-label="Privacy policy sections"
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

          <section id="information-collected" style={section}>
            <h2 style={heading}>Information collected</h2>

            <h3 style={subheading}>Account information</h3>
            <p style={text}>
              When you create or use an account, Lexora may collect your email
              address, account identifier, and name if you provide one.
              Authentication information is managed through Supabase. Passwords
              and authentication credentials are handled through the
              authentication provider. Lexora does not intentionally store
              passwords in plain text.
            </p>

            <h3 style={subheading}>User content</h3>
            <p style={text}>
              Lexora may process text you submit for rewriting, generated
              rewritten output, original and rewritten text you choose to save
              as documents, and document titles.
            </p>
            <p style={text}>
              There is a difference between text temporarily submitted for
              processing and documents you actively choose to save. Submitted
              text is processed to generate a rewrite. Documents are stored in
              your workspace only when you save them.
            </p>

            <h3 style={subheading}>Usage information</h3>
            <p style={text}>
              Lexora may record the number of rewrites used, usage dates, account
              plan information, and feature activity needed to enforce plan
              limits and operate the service.
            </p>

            <h3 style={subheading}>Support information</h3>
            <p style={text}>
              If you contact Lexora through the Support page, Lexora may collect
              the messages and contact details you provide so your request can
              be reviewed and answered.
            </p>

            <h3 style={subheading}>Billing information</h3>
            <p style={text}>
              Paid checkout may be handled by Polar and its payment partners.
              Lexora may receive limited subscription information such as the
              purchased plan, payment status, subscription status, renewal or
              cancellation status, and customer or transaction identifiers.
              Payment card details are handled by the checkout and payment
              providers rather than entered directly into Lexora’s database.
            </p>

            <h3 style={subheading}>How information is collected</h3>
            <p style={text}>Information may be collected:</p>
            <ul style={bulletList}>
              <li>directly from you when you create an account, submit text, save documents, contact support, or purchase a plan</li>
              <li>automatically through your use of the service, such as usage counts needed to operate limits</li>
              <li>from service providers involved in authentication and billing, where needed to operate those features</li>
            </ul>
          </section>

          <section id="how-information-is-used" style={section}>
            <h2 style={heading}>How information is used</h2>
            <p style={text}>Lexora may use information to:</p>
            <ul style={bulletList}>
              <li>create and authenticate accounts</li>
              <li>provide text rewriting</li>
              <li>save and display documents</li>
              <li>calculate and enforce usage limits</li>
              <li>maintain account and subscription access</li>
              <li>process subscriptions</li>
              <li>provide support</li>
              <li>prevent abuse and protect the service</li>
              <li>diagnose technical problems</li>
              <li>improve service reliability and usability</li>
              <li>comply with legal obligations where applicable</li>
            </ul>
            <p style={text}>
              Lexora does not intentionally use submitted text to train its own
              AI model. Third-party AI processing is subject to the provider’s
              configuration, terms, and privacy practices.
            </p>
          </section>

          <section id="ai-processing" style={section}>
            <h2 style={heading}>AI processing</h2>
            <p style={text}>
              When you use the humanizer, submitted text is sent to Together AI
              to generate the rewritten result. This processing is necessary to
              provide the rewriting feature.
            </p>
            <p style={text}>
              Do not submit highly confidential or sensitive information that
              you do not want processed through the service. AI output may
              contain errors, and you should review generated content before
              relying on it.
            </p>
            <p style={text}>
              Together AI states that inputs and outputs for inference are not
              stored by default, although temporary processing or caching may
              occur depending on service configuration. Lexora cannot make an
              absolute guarantee regarding third-party systems.
            </p>
          </section>

          <section id="saved-documents" style={section}>
            <h2 style={heading}>Saved documents</h2>
            <p style={text}>
              Rewritten content is not automatically stored as a saved document.
              When you choose to save a document, the content is stored in
              Supabase and remains associated with your account.
            </p>
            <p style={text}>
              You can delete individual documents from the Documents page.
              Deleted items may remain temporarily in backups or provider
              systems where technically necessary.
            </p>
          </section>

          <section id="third-party-services" style={section}>
            <h2 style={heading}>When information may be shared</h2>
            <p style={text}>
              Lexora relies on service providers to operate the platform. These
              may include Supabase for account authentication and database
              storage, Vercel for website hosting, Together AI for processing
              text submitted to the rewriting tool, and Polar for subscription
              checkout and billing. These providers process information under
              their own terms and privacy notices. Lexora does not control every
              aspect of third-party processing.
            </p>
            <p style={text}>
              Lexora may share limited information with authentication and
              database providers, hosting providers, AI processing providers,
              billing and payment providers, support or analytics providers if
              later enabled, authorities where legally required, and a successor
              if the business is sold, reorganized, or transferred.
            </p>
            <p style={text}>
              Lexora does not sell users’ submitted documents as a product.
            </p>

            <h3 style={subheading}>Third-party services</h3>
            <p style={text}>
              Each provider maintains its own terms and privacy practices.
            </p>

            <table className="lexora-provider-table" style={table}>
              <thead>
                <tr>
                  <th style={th}>Provider</th>
                  <th style={th}>Purpose</th>
                  <th style={th}>Information involved</th>
                </tr>
              </thead>
              <tbody>
                {PROVIDERS.map((provider) => (
                  <tr key={provider.name}>
                    <td style={td}>{provider.name}</td>
                    <td style={td}>{provider.purpose}</td>
                    <td style={td}>{provider.information}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="lexora-provider-cards">
              {PROVIDERS.map((provider) => (
                <div key={provider.name} style={providerCard}>
                  <h4 style={providerName}>{provider.name}</h4>
                  <p style={providerMeta}>
                    <strong>Purpose:</strong> {provider.purpose}
                  </p>
                  <p style={providerMeta}>
                    <strong>Information involved:</strong> {provider.information}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section id="retention" style={section}>
            <h2 style={heading}>Data retention</h2>
            {/* TODO: Add a specific retention schedule once the business formally decides one. */}
            <p style={text}>
              Lexora retains information only for as long as reasonably
              necessary for the purposes described in this policy, subject to
              technical, contractual, and legal requirements.
            </p>
            <ul style={bulletList}>
              <li>
                Account information is generally retained while the account is
                active.
              </li>
              <li>
                Saved documents are retained until you delete them or the
                account is deleted.
              </li>
              <li>
                Usage records may be retained to operate limits, subscriptions,
                security, and reporting.
              </li>
              <li>
                Support messages may be retained for follow-up and recordkeeping.
              </li>
              <li>
                Provider logs, backups, and billing records may be retained
                according to legal and operational requirements.
              </li>
            </ul>
          </section>

          <section id="security" style={section}>
            <h2 style={heading}>Security</h2>
            <p style={text}>
              Lexora uses reasonable technical and organizational measures
              intended to protect account information and saved documents.
              However, no method of internet transmission, processing, or
              electronic storage is completely secure.
            </p>
          </section>

          <section id="choices-and-rights" style={section}>
            <h2 style={heading}>Your choices and rights</h2>
            <p style={text}>You can:</p>
            <ul style={bulletList}>
              <li>delete individual saved documents from your Documents page</li>
              <li>
                request account deletion through{" "}
                <Link href="/support" className="lexora-privacy-link" style={inlineLink}>
                  Support
                </Link>
              </li>
              <li>
                request correction of inaccurate account information where
                practical
              </li>
            </ul>
            <p style={text}>
              Account deletion may remove account access and associated
              workspace content that Lexora controls. Some limited information
              may remain where retention is required for billing, fraud
              prevention, legal compliance, backups, or dispute resolution.
            </p>
            <p style={text}>
              Depending on your location and applicable law, you may have rights
              to request access, request correction, request deletion, object to
              or restrict certain processing, receive a copy of certain
              information, withdraw consent where processing depends on consent,
              and complain to a relevant authority. Depending on your location
              and applicable law, you may have some or all of these rights.
              Requests may require identity verification.
            </p>
          </section>

          <section id="children" style={section}>
            <h2 style={heading}>Children</h2>
            <p style={text}>
              Lexora is not directed to children who are not legally able to
              consent to use of the service in their location. If we learn that
              information has been collected from a child without appropriate
              authorization, we will take reasonable steps to delete it.
            </p>
          </section>

          <section id="international-processing" style={section}>
            <h2 style={heading}>International processing</h2>
            <p style={text}>
              Because Lexora relies on international service providers,
              information may be processed in countries with privacy laws
              different from those in your location.
            </p>
          </section>

          <section id="cookies" style={section}>
            <h2 style={heading}>Cookies and similar technologies</h2>
            <p style={text}>
              Authentication may use browser storage or cookies to maintain
              sessions. Hosting and essential service providers may process
              technical information needed to deliver the website.
            </p>
            <p style={text}>
              If Lexora enables optional analytics or non-essential cookies,
              this policy and any required consent controls should be updated
              before those tools are activated.
            </p>
          </section>

          <section id="business-transfers" style={section}>
            <h2 style={heading}>Service changes and business transfers</h2>
            <p style={text}>
              If Lexora is involved in a sale, merger, restructuring,
              acquisition, or transfer of assets, information may be transferred
              as part of that transaction, subject to applicable law and
              continuing privacy expectations where required.
            </p>
          </section>

          <section id="changes" style={section}>
            <h2 style={heading}>Changes to this policy</h2>
            <p style={text}>
              Lexora may update this Privacy Policy when the service or
              practices change. The latest version will be available on this
              page, and the “Last updated” date will change when a revised
              version is published.
            </p>
          </section>

          <section id="contact" style={section}>
            <h2 style={heading}>Contact</h2>
            <p style={text}>
              For privacy questions, contact Lexora through the{" "}
              <Link href="/support" className="lexora-privacy-link" style={inlineLink}>
                Support
              </Link>{" "}
              page.
            </p>
            <div style={contactBox}>
              <p style={contactLine}>{LEGAL_BUSINESS_NAME}</p>
              <p style={contactLine}>{PRIVACY_CONTACT_EMAIL}</p>
              <p style={contactLine}>{BUSINESS_LOCATION}</p>
              {isDevelopment && hasUnresolvedPlaceholders ? (
                <p style={devPlaceholderNote} role="status">
                  Dev only: replace the bracketed contact placeholders before
                  publishing.
                </p>
              ) : null}
            </div>
          </section>
        </div>
      </article>

      <footer style={publicFooter}>
        <div className="lexora-privacy-footer-inner" style={footerInner}>
          <p style={footerCopy}>© 2026 Lexora</p>
          <nav style={footerNav} aria-label="Footer">
            <Link href="/privacy" className="lexora-privacy-link" style={footerLink}>
              Privacy Policy
            </Link>
            <Link href="/terms" className="lexora-privacy-link" style={footerLink}>
              Terms of Service
            </Link>
            <Link href="/support" className="lexora-privacy-link" style={footerLink}>
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

const table = {
  width: "100%",
  borderCollapse: "collapse" as const,
  marginTop: "12px",
  marginBottom: "8px",
};

const th = {
  textAlign: "left" as const,
  padding: "12px",
  borderBottom: "1px solid #e2e8f0",
  color: "#64748b",
  fontSize: "12px",
  fontWeight: 700 as const,
  letterSpacing: "0.04em",
  textTransform: "uppercase" as const,
  background: "#f8fafc",
};

const td = {
  textAlign: "left" as const,
  padding: "12px",
  borderBottom: "1px solid #f1f5f9",
  color: "#334155",
  fontSize: "14px",
  verticalAlign: "top" as const,
  lineHeight: 1.5,
};

const providerCard = {
  border: "1px solid #e8eaf0",
  borderRadius: "12px",
  padding: "14px",
  background: "#fafbfc",
};

const providerName = {
  margin: "0 0 8px",
  fontSize: "15px",
  fontWeight: 700 as const,
  color: "#0f172a",
};

const providerMeta = {
  margin: "0 0 6px",
  color: "#475569",
  fontSize: "14px",
  lineHeight: 1.5,
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
