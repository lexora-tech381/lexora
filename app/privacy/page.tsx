import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main style={page}>
      <section style={card}>
        <Link href="/" style={backLink}>
          ← Back to Lexora
        </Link>

        <h1 style={title}>Privacy Policy</h1>
        <p style={updated}>Last updated: July 3, 2026</p>

        <h2 style={heading}>1. Information we collect</h2>
        <p style={text}>
          Lexora collects the email address you provide when creating an
          account. We may also store documents you choose to save in your
          Lexora workspace.
        </p>

        <h2 style={heading}>2. How we use your information</h2>
        <p style={text}>
          We use your information to provide login access, save your documents,
          manage usage limits, improve the service, and respond to support
          requests.
        </p>

        <h2 style={heading}>3. Your text and documents</h2>
        <p style={text}>
          Text submitted for rewriting is processed to provide the requested
          result. Do not submit confidential, highly sensitive, illegal, or
          personal information that you do not want processed through the
          service.
        </p>

        <h2 style={heading}>4. Third-party services</h2>
        <p style={text}>
          Lexora uses third-party providers, including Supabase for
          authentication and data storage, Vercel for website hosting, and
          OpenAI for AI-powered text processing. These providers may process
          information as needed to operate their services.
        </p>

        <h2 style={heading}>5. Data security</h2>
        <p style={text}>
          We take reasonable steps to protect account information and saved
          documents. However, no online service can guarantee complete
          security.
        </p>

        <h2 style={heading}>6. Your choices</h2>
        <p style={text}>
          You can delete saved documents from your account. If you want your
          account deleted, contact us through the Support page.
        </p>

        <h2 style={heading}>7. Changes to this policy</h2>
        <p style={text}>
          We may update this Privacy Policy when Lexora changes. The latest
          version will always be available on this page.
        </p>

        <h2 style={heading}>8. Contact</h2>
        <p style={text}>
          For privacy questions, please contact us through the Lexora Support
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