"""Cryptographic multi-step humanizer: pivot translation + stylistic fracture."""

from __future__ import annotations

import logging
import os
import re
from typing import Any, Callable, Dict, List, Optional

import requests

from metrics import evaluate_output

logger = logging.getLogger("cryptographic_humanizer")

MAX_PASSES = 4
PIVOT_LANGUAGE_DEFAULT = "French"

INTENSITY_BASE: Dict[str, Dict[str, float]] = {
    "low": {"temperature": 0.75, "top_p": 0.88},
    "medium": {"temperature": 0.88, "top_p": 0.92},
    "high": {"temperature": 0.95, "top_p": 0.95},
}


class CryptographicHumanizer:
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        base_url: Optional[str] = None,
        pivot_language: Optional[str] = None,
        log_fn: Optional[Callable[[str], None]] = None,
    ) -> None:
        self.api_key = (
            api_key
            or os.getenv("OPENROUTER_API_KEY")
            or os.getenv("OPENAI_API_KEY")
            or ""
        )
        self.model = model or os.getenv("HUMANIZER_MODEL", "openai/gpt-4o-mini")
        self.base_url = (
            base_url
            or os.getenv("LLM_BASE_URL")
            or (
                "https://openrouter.ai/api/v1"
                if os.getenv("OPENROUTER_API_KEY")
                else "https://api.openai.com/v1"
            )
        ).rstrip("/")
        self.chat_url = (
            self.base_url
            if self.base_url.endswith("/chat/completions")
            else f"{self.base_url}/chat/completions"
        )
        self.pivot_language = pivot_language or os.getenv(
            "PIVOT_LANGUAGE",
            PIVOT_LANGUAGE_DEFAULT,
        )
        self.log_fn = log_fn or (lambda message: logger.info(message))

    def _log(self, message: str) -> None:
        self.log_fn(message)

    def _resolve_intensity(self, intensity: str) -> Dict[str, float]:
        key = (intensity or "medium").strip().lower()
        return INTENSITY_BASE.get(key, INTENSITY_BASE["medium"])

    def _chat(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float,
        top_p: float,
    ) -> str:
        if not self.api_key:
            raise RuntimeError(
                "Missing API key. Set OPENROUTER_API_KEY or OPENAI_API_KEY."
            )

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        if "openrouter.ai" in self.base_url:
            headers["HTTP-Referer"] = os.getenv("APP_URL", "http://localhost:8000")
            headers["X-Title"] = os.getenv("APP_NAME", "Cryptographic Humanizer")

        payload = {
            "model": self.model,
            "temperature": temperature,
            "top_p": top_p,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        }

        response = requests.post(
            self.chat_url,
            headers=headers,
            json=payload,
            timeout=120,
        )
        if response.status_code >= 400:
            raise RuntimeError(
                f"LLM API error ({response.status_code}): {response.text[:500]}"
            )

        data = response.json()
        try:
            content = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            raise RuntimeError("Unexpected LLM response format.") from exc

        text = str(content or "").strip()
        if not text:
            raise RuntimeError("LLM returned empty content.")
        return text

    def pivot_translation(self, text: str, temperature: float, top_p: float) -> str:
        """
        Step 1 + Step 2:
        Translate to an intermediate language, then back to English to fracture
        token-sequence alignment / watermark continuity.
        """
        source = text.strip()
        self._log(
            f"[pivot] Step 1: translating source -> {self.pivot_language} "
            f"(temp={temperature:.2f}, top_p={top_p:.2f})"
        )

        intermediate = self._chat(
            system_prompt=(
                f"You are a precise technical translator. Translate the user's text into "
                f"{self.pivot_language}. Preserve every technical concept, name, number, "
                f"citation, quotation, and data point exactly. Do not summarize. "
                f"Return only the {self.pivot_language} translation."
            ),
            user_prompt=source,
            temperature=max(0.2, temperature - 0.35),
            top_p=min(0.9, top_p),
        )

        self._log(
            f"[pivot] Step 2: translating {self.pivot_language} -> English "
            "(context realignment)"
        )
        realigned = self._chat(
            system_prompt=(
                "You are a precise technical translator. Translate the user's text into "
                "natural English. Preserve every technical concept, name, number, citation, "
                "quotation, and data point exactly. Do not summarize. Do not add commentary. "
                "Return only the English translation."
            ),
            user_prompt=intermediate,
            temperature=max(0.25, temperature - 0.3),
            top_p=min(0.92, top_p),
        )
        return realigned.strip()

    def apply_stylistic_fracture(
        self,
        text: str,
        intensity: str,
        temperature: float,
        top_p: float,
        force_break_rhythm: bool = False,
    ) -> str:
        """Step 3: aggressive syntactic fracture and conversational irregularity."""
        self._log(
            f"[fracture] Step 3: stylistic fracture "
            f"(intensity={intensity}, temp={temperature:.2f}, top_p={top_p:.2f}, "
            f"force_break={force_break_rhythm})"
        )

        system_prompt = (
            "You are an elite prose rewriter specializing in structural fracture.\n"
            "Rewrite the text so it reads like unscripted expert human writing.\n\n"
            "HARD RULES:\n"
            "1. RANDOM CLAUSE STRUCTURING: Do not keep Subject-Verb-Object alignment across "
            "consecutive sentences. Invert clauses, open with conditions, and rearrange "
            "causal order.\n"
            "2. SEMANTIC PADDING: Embed conversational qualifiers and cognitive pauses such as "
            "\"now, looking closely at...\", \"granted, this means...\", \"to be fair...\", "
            "\"oddly enough...\", and idiomatic fragments where they fit naturally.\n"
            "3. ABSOLUTE PUNCTUATION VARIANCE: Use semicolons, colons, parenthetical asides, "
            "and em-dashes irregularly but grammatically to disrupt predictable cadence.\n"
            "4. ZERO PASSIVE VOICE: Prefer active constructions.\n"
            "5. LENGTH VIOLENCE: Alternate short lines (about 5 words) with long complex "
            "sentences (about 25-35 words). Never let three neighboring sentences stay within "
            "a 7-word length band.\n"
            "6. BAN AI LEXICON: Never use delve, tapestry, multifaceted, furthermore, moreover, "
            "testament, ultimately, crucial, leverage, foster, seamless, embark.\n"
            "7. Preserve meaning, facts, names, numbers, citations, and paragraph count.\n"
            "8. Return only the rewritten text."
        )
        if force_break_rhythm:
            system_prompt += (
                "\n\nRECURSIVE OVERRIDE: Break the rhythm entirely. The previous draft was "
                "too even. Shatter sentence cadence harder. Force abrupt short bursts next to "
                "dense multi-clause sentences. Increase punctuation irregularity."
            )

        return self._chat(
            system_prompt=system_prompt,
            user_prompt=(
                "Fracture and rewrite this English text:\n\n"
                f"{text.strip()}\n\n"
                "Return only the rewritten English text."
            ),
            temperature=temperature,
            top_p=top_p,
        ).strip()

    def _post_clean(self, text: str) -> str:
        cleaned = text.replace("\r\n", "\n")
        cleaned = cleaned.replace("\\n\\n", "\n\n").replace("\\n", "\n")
        cleaned = re.sub(r"!{2,}", "!", cleaned)
        cleaned = re.sub(r"\.{3,}", "...", cleaned)
        cleaned = re.sub(r"[^\S\n]{2,}", " ", cleaned)
        cleaned = re.sub(
            r"\n+(?:Output|Note|Explanation|Rewritten text|Here is)[:\s].*$",
            "",
            cleaned,
            flags=re.IGNORECASE | re.DOTALL,
        )
        paragraphs = [
            re.sub(r"\s+", " ", paragraph).strip()
            for paragraph in re.split(r"\n\s*\n", cleaned)
            if paragraph.strip()
        ]
        return "\n\n".join(paragraphs).strip()

    def bypass_loop(self, text: str, intensity: str = "medium") -> Dict[str, Any]:
        source = (text or "").strip()
        if not source:
            raise ValueError("Text cannot be empty.")

        base = self._resolve_intensity(intensity)
        temperature = base["temperature"]
        top_p = base["top_p"]

        trace: List[Dict[str, Any]] = []
        best: Optional[Dict[str, Any]] = None

        self._log(
            f"[start] Cryptographic bypass loop | intensity={intensity} | "
            f"model={self.model} | pivot={self.pivot_language}"
        )

        for attempt in range(1, MAX_PASSES + 1):
            self._log(f"[pass {attempt}/{MAX_PASSES}] begin optimization pass")
            force_break = attempt > 1

            pivoted = self.pivot_translation(source, temperature=temperature, top_p=top_p)
            fractured = self.apply_stylistic_fracture(
                pivoted,
                intensity=intensity,
                temperature=temperature,
                top_p=top_p,
                force_break_rhythm=force_break,
            )
            cleaned = self._post_clean(fractured)
            metrics = evaluate_output(cleaned)

            loss = 0.0
            if float(metrics["burstiness_score"]) < 12.0:
                loss += 12.0 - float(metrics["burstiness_score"])
            loss += float(metrics["lexical_penalty"])
            if not metrics["alternation_ok"]:
                loss += 10.0

            pass_record = {
                "pass": attempt,
                "temperature": round(temperature, 3),
                "top_p": round(top_p, 3),
                "burstiness_score": metrics["burstiness_score"],
                "lexical_penalty": metrics["lexical_penalty"],
                "token_entropy": metrics["token_entropy"],
                "alternation_ok": metrics["alternation_ok"],
                "alternation_message": metrics["alternation_message"],
                "passed": metrics["passed"],
                "mathematical_loss": round(loss, 3),
                "message": (
                    "PASS accepted"
                    if metrics["passed"]
                    else f"FAIL -> {metrics['alternation_message']}"
                ),
            }
            trace.append(pass_record)

            self._log(
                "[pass {pass_no}] loss={loss:.3f} burstiness={burst:.3f} "
                "lexical_penalty={lex:.2f} entropy={ent:.4f} alternation={alt} passed={passed}".format(
                    pass_no=attempt,
                    loss=loss,
                    burst=float(metrics["burstiness_score"]),
                    lex=float(metrics["lexical_penalty"]),
                    ent=float(metrics["token_entropy"]),
                    alt=metrics["alternation_ok"],
                    passed=metrics["passed"],
                )
            )

            candidate = {
                "humanized_text": cleaned,
                "burstiness_score": float(metrics["burstiness_score"]),
                "ai_risk_score": float(metrics["lexical_penalty"]),
                "token_entropy": float(metrics["token_entropy"]),
                "attempts": attempt,
                "passed": bool(metrics["passed"]),
                "trace": trace.copy(),
                "mathematical_loss": round(loss, 3),
            }

            if best is None or candidate["mathematical_loss"] < best["mathematical_loss"]:
                best = candidate

            if metrics["passed"]:
                self._log(f"[pass {attempt}] accepted — structural thresholds met")
                break

            # Adversarial retune: decrease top_p, push temperature toward 0.95,
            # and force rhythm breakage on the next recursive pass.
            top_p = max(0.7, top_p - 0.05)
            temperature = 0.95
            self._log(
                f"[pass {attempt}] retune parameters -> temp={temperature:.2f}, "
                f"top_p={top_p:.2f}; inject 'Break the rhythm entirely'"
            )

        if best is None:
            raise RuntimeError("Humanization failed to produce any candidate output.")

        self._log(
            f"[done] selected pass={best['attempts']} loss={best['mathematical_loss']} "
            f"burstiness={best['burstiness_score']} lexical_penalty={best['ai_risk_score']}"
        )
        return best


# Backward-compatible alias for older imports
AIHumanizer = CryptographicHumanizer
