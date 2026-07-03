import Link from "next/link";

export default function TermsPage() {
  return (
    <main style={page}>
      <section style={card}>
        <Link href="/" style={backLink}>
          ← Back to Lexora
        </Link>

        <h1 style={title}>Terms of Service</h1>
        <p style={updated}>Last updated: July 3, 2026</p>

        <h2 style={heading}>1. Acceptance of these terms</h2>
        <p style={text}>
          By creating an account or using Lexora, you agree to these Terms of
          Service.
        </p>

        <h2 style={heading}>2. Lexora service</h2>
        <p style={text}>
          Lexora provides AI-assisted text rewriting tools. Results may contain
          errors, may not be fully accurate, and should be reviewed before you
          use them for academic, professional, legal, medical, financial, or
          other important purposes.
        </p>

        <h2 style={heading}>3. Your responsibilities</h2>
        <p style={text}>
          You are responsible for the text you submit and for how you use the
          results. You must not use Lexora for illegal activity, fraud,
          harassment, harmful content, plagiarism, impersonation, or any
          purpose that violates another person’s rights.
        </p>

        <h2 style={heading}>4. Academic integrity</h2>
        <p style={text}>
          Lexora is designed to support writing and editing. You are responsible
          for following your university, school, workplace, or organization’s
          academic integrity and AI-use rules. Do not submit work as fully your
          own if it violates those rules.
        </p>

        <h2 style={heading}>5. Accounts and access</h2>
        <p style={text}>
          You are responsible for keeping your account password secure. You
          must provide accurate account information and must not share your
          account in a way that bypasses usage limits.
        </p>

        <h2 style={heading}>6. Free plans and paid plans</h2>
        <p style={text}>
          Free-plan limits may change. Any future paid features, prices, and
          billing terms will be clearly shown before payment is requested.
        </p>

        <h2 style={heading}>7. Service availability</h2>
        <p style={text}>
          We aim to keep Lexora available, but we do not guarantee uninterrupted
          access. Features may be changed, paused, or removed as the service
          develops.
        </p>

        <h2 style={heading}>8. Limitation of liability</h2>
        <p style={text}>
          Lexora is provided on an “as is” basis. To the extent permitted by
          law, Lexora is not responsible for losses or damages resulting from
          your use of the service or reliance on generated text.
        </p>

        <h2 style={heading}>9. Changes to these terms</h2>
        <p style={text}>
          We may update these terms as Lexora develops. Continued use after an
          update means you accept the revised terms.
        </p>

        <h2 style={heading}>10. Contact</h2>
        <p style={text}>
          For questions about these terms, contact us through the Lexora Support
          page.
        </p>
      </section>
    </main>
  );
}

const page = {
  minHeight: "100vh",
  background: "linear-gradient(135deg,#f8fafc 0%,#faf5ff 100%)",
  padding: "48px 20px",
  fontFamily: "Arial, sans-serif",
  color: "#1e293b",
};

const card = {
  maxWidth: "820px",
  margin: "0 auto",
  background: "#ffffff",
  borderRadius: "20px",
  padding: "44px",
  boxShadow: "0 18px 45px rgba(15,23,42,0.08)",
  border: "1px solid #e5e7eb",
};

const backLink = {
  color: "#7c3aed",
  textDecoration: "none",
  fontWeight: "bold" as const,
};

const title = {
  fontSize: "36px",
  margin: "28px 0 6px",
  color: "#111827",
};

const updated = {
  color: "#64748b",
  marginBottom: "32px",
};

const heading = {
  fontSize: "20px",
  marginTop: "28px",
  marginBottom: "10px",
  color: "#312e81",
};

const text = {
  lineHeight: "1.75",
  color: "#475569",
  margin: 0,
};