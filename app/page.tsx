"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  countWords,
  formatPlanName,
  formatPlanUsageLabel,
  formatRemainingAllowanceLabel,
  getCalendarMonthStartIso,
  getDailyRewriteLimit,
  getMonthlyWordLimit,
  isFreePlan,
  normalizePlanId,
  type PlanId,
} from "@/lib/plan";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import HumanizerTool from "@/components/HumanizerTool";
import HowItWorks from "@/components/HowItWorks";
import PricingPreview from "@/components/PricingPreview";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export default function Home() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [mode, setMode] = useState("Free");
  const [tone, setTone] = useState("Natural");
  const [uses, setUses] = useState(0);
  const [monthlyWordsUsed, setMonthlyWordsUsed] = useState(0);
  const [planId, setPlanId] = useState<PlanId>("free");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const checkScreen = () => setIsMobile(window.innerWidth < 768);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  useEffect(() => {
    const loadSessionAndUsage = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      setSession(currentSession);

      if (currentSession) {
        const today = new Date().toISOString().split("T")[0];
        const userId = currentSession.user.id;
        const monthStart = getCalendarMonthStartIso();

        const [usageResult, subscriptionResult, wordsResult] = await Promise.all([
          supabase
            .from("usage")
            .select("count")
            .eq("user_id", userId)
            .eq("date", today)
            .maybeSingle(),
          supabase
            .from("subscriptions")
            .select("plan")
            .eq("user_id", userId)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("documents")
            .select("humanized_text")
            .eq("user_id", userId)
            .gte("created_at", monthStart),
        ]);

        if (usageResult.error) {
          console.log("Usage load error:", usageResult.error);
        }

        if (subscriptionResult.error) {
          console.log("Subscription load error:", subscriptionResult.error);
          setPlanId("free");
        } else {
          setPlanId(normalizePlanId(subscriptionResult.data?.plan));
        }

        if (wordsResult.error) {
          console.log("Monthly words load error:", wordsResult.error);
          setMonthlyWordsUsed(0);
        } else {
          const words = (wordsResult.data || []).reduce(
            (sum, doc: { humanized_text: string | null }) =>
              sum + countWords(doc.humanized_text),
            0,
          );
          setMonthlyWordsUsed(words);
        }

        setUses(usageResult.data?.count || 0);
      } else {
        setPlanId("free");
        setUses(0);
        setMonthlyWordsUsed(0);
      }
    };

    loadSessionAndUsage();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      if (!currentSession) {
        setPlanId("free");
        setUses(0);
        setMonthlyWordsUsed(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  function getUserInitial(user: Session["user"]) {
    const fullName = user.user_metadata?.full_name;
    if (typeof fullName === "string" && fullName.trim()) {
      return fullName.trim().charAt(0).toUpperCase();
    }

    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }

    return "U";
  }

  const planName = formatPlanName(planId);
  const dailyLimit = getDailyRewriteLimit(planId);
  const monthlyWordLimit = getMonthlyWordLimit(planId);
  const usageSnapshot = {
    dailyRewrites: uses,
    monthlyWords: monthlyWordsUsed,
  };
  const usageLabel = formatPlanUsageLabel(planId, usageSnapshot);
  const usageBadge = formatRemainingAllowanceLabel(planId, usageSnapshot);
  const wordCount = countWords(text);
  const charCount = text.length;
  const resultWords = countWords(result);
  const resultChars = result.length;

  const navigate = (path: string) => {
    router.push(path);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const humanizeText = async () => {
    if (loading) return;

    if (!text.trim()) {
      setSuccessMessage(null);
      setErrorMessage("Please paste text first.");
      return;
    }

    let activeSession = session;

    if (!activeSession) {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      activeSession = currentSession;
      setSession(currentSession);
    }

    if (!activeSession) {
      router.push("/login");
      return;
    }

    if (isFreePlan(planId)) {
      if (dailyLimit != null && uses >= dailyLimit) {
        setSuccessMessage(null);
        setErrorMessage(
          "You have reached your free limit of 10 humanizations today.",
        );
        return;
      }
    } else if (monthlyWordLimit != null) {
      if (monthlyWordsUsed + wordCount > monthlyWordLimit) {
        setSuccessMessage(null);
        setErrorMessage(
          `This text would exceed your monthly allowance of ${monthlyWordLimit.toLocaleString()} words.`,
        );
        return;
      }
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/humanize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mode, tone }),
      });

      const humanizeData = await response.json();

      if (!response.ok) {
        setErrorMessage(humanizeData.error || "Unable to humanize text.");
        return;
      }

      const humanizedText =
        humanizeData.result || humanizeData.text || "Unable to humanize text.";
      setResult(humanizedText);

      const outputWords = countWords(humanizedText);
      if (!isFreePlan(planId)) {
        setMonthlyWordsUsed((prev) => prev + outputWords);
      }

      const today = new Date().toISOString().split("T")[0];

      const { data: existingUsage } = await supabase
        .from("usage")
        .select("*")
        .eq("user_id", activeSession.user.id)
        .eq("date", today)
        .maybeSingle();

      if (!existingUsage) {
        await supabase.from("usage").insert({
          user_id: activeSession.user.id,
          date: today,
          count: 1,
        });
      } else {
        const updatedCount = existingUsage.count + 1;

        await supabase
          .from("usage")
          .update({ count: updatedCount })
          .eq("id", existingUsage.id);
      }

      const { data: latestUsage } = await supabase
        .from("usage")
        .select("count")
        .eq("user_id", activeSession.user.id)
        .eq("date", today)
        .maybeSingle();

      setUses(latestUsage?.count || 0);
    } catch {
      setErrorMessage("Something went wrong while humanizing. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const clearText = () => {
    setText("");
    setResult("");
    setCopied(false);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const copyResult = () => {
    if (!result.trim()) {
      setSuccessMessage(null);
      setErrorMessage("Nothing to copy yet.");
      return;
    }

    navigator.clipboard.writeText(result);
    setErrorMessage(null);
    setSuccessMessage(null);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveDocument = async () => {
    if (!result.trim()) {
      setSuccessMessage(null);
      setErrorMessage("Please humanize text first before saving.");
      return;
    }

    let activeSession = session;

    if (!activeSession) {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      activeSession = currentSession;
      setSession(currentSession);
    }

    if (!activeSession) {
      router.push("/login");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    const { error: insertError } = await supabase.from("documents").insert({
      user_id: activeSession.user.id,
      original_text: text,
      humanized_text: result,
    });

    if (insertError) {
      setErrorMessage(insertError.message);
      return;
    }

    setSuccessMessage("Document saved.");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <main
      style={{
        ...page,
        flexDirection: isMobile ? "column" : "row",
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
        backgroundImage:
          "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(139, 92, 246, 0.08), transparent 55%), linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
      }}
    >
      <Sidebar
        isMobile={isMobile}
        onNavigate={navigate}
        activePath="/"
        onLogout={session ? handleLogout : undefined}
      />

      <section
        style={{
          ...content,
          padding: isMobile ? "80px 16px 32px" : "88px 28px 40px",
        }}
      >
        <Header
          isMobile={isMobile}
          menuOpen={menuOpen}
          onToggleMenu={() => setMenuOpen(!menuOpen)}
          onCloseMenu={() => setMenuOpen(false)}
          onNavigate={navigate}
          session={session}
          planName={planName}
          usageLabel={usageLabel}
          getUserInitial={getUserInitial}
          onLogout={session ? handleLogout : undefined}
          activePath="/"
        />

        <div
          style={{
            ...heroSection,
            padding: isMobile ? "20px 0 20px" : "28px 0 28px",
          }}
        >
          <span style={heroBadge}>AI Writing Assistant</span>
          <h1 style={{ ...title, fontSize: isMobile ? "28px" : "34px" }}>
            Humanize AI text
          </h1>
          <p style={{ ...subtitle, fontSize: isMobile ? "15px" : "16px" }}>
            Rewrite AI-generated content into clear, natural writing.
          </p>
          <p style={supportLine}>
            Preserve your meaning while improving clarity, tone, and flow.
          </p>
        </div>

        <HumanizerTool
          isMobile={isMobile}
          text={text}
          result={result}
          mode={mode}
          tone={tone}
          loading={loading}
          copied={copied}
          errorMessage={errorMessage}
          successMessage={successMessage}
          usageBadge={usageBadge}
          planName={planName}
          wordCount={wordCount}
          charCount={charCount}
          resultWords={resultWords}
          resultChars={resultChars}
          onTextChange={setText}
          onModeChange={setMode}
          onToneChange={setTone}
          onHumanize={humanizeText}
          onClear={clearText}
          onCopy={copyResult}
          onSave={saveDocument}
        />

        <div
          style={{
            ...landingArea,
            marginTop: isMobile ? "44px" : "64px",
            padding: isMobile ? "36px 0 0" : "52px 0 0",
          }}
        >
          <HowItWorks isMobile={isMobile} />
          <PricingPreview onNavigate={navigate} />
          <FAQ onNavigate={navigate} />
          <Footer onNavigate={navigate} />
        </div>
      </section>
    </main>
  );
}

const page = {
  minHeight: "100vh",
  display: "flex",
  background: "#f8fafc",
};

const content = {
  flex: 1,
  minWidth: 0,
  width: "100%",
};

const heroSection = {
  textAlign: "center" as const,
  maxWidth: "640px",
  margin: "0 auto",
};

const heroBadge = {
  display: "inline-block",
  background: "#f5f3ff",
  color: "#6d28d9",
  padding: "6px 12px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 600 as const,
  marginBottom: "14px",
  letterSpacing: "0.02em",
};

const title = {
  margin: "0 0 10px",
  color: "#0f172a",
  fontWeight: 700 as const,
  letterSpacing: "-0.03em",
  lineHeight: 1.15,
};

const subtitle = {
  margin: "0 0 8px",
  color: "#475569",
  lineHeight: 1.55,
  fontWeight: 500 as const,
};

const supportLine = {
  margin: 0,
  color: "#94a3b8",
  fontSize: "14px",
  lineHeight: 1.5,
};

const landingArea = {
  maxWidth: "920px",
  margin: "0 auto",
  borderTop: "1px solid #e2e8f0",
};
