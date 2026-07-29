"""Human-thought pipeline: erratic rewrite + hard sentence guards."""

from __future__ import annotations

import logging
import os
import random
import re
from typing import Any, Callable, Dict, List, Optional

import requests

from metrics import (
    evaluate_draft,
    split_sentences,
    word_count,
)

logger = logging.getLogger("human_logic_humanizer")

MAX_PASSES = 5
MAX_SENTENCE_WORDS = 16

INTENSITY_BASE: Dict[str, Dict[str, float | int]] = {
    "low": {"temperature": 0.82, "top_p": 0.9, "top_k": 40},
    "medium": {"temperature": 0.9, "top_p": 0.93, "top_k": 55},
    "high": {"temperature": 0.95, "top_p": 0.96, "top_k": 70},
}

CLICHE_REPLACEMENTS = [
    (r"\bdelve(?:s|d|ing)?\b", "look into"),
    (r"\btapestry\b", "mix"),
    (r"\bmoreover\b", "besides that"),
    (r"\bfurthermore\b", "on top of that"),
    (r"\btestament\b", "sign"),
    (r"\bmultifaceted\b", "many-sided"),
    (r"\bin conclusion\b", "to wrap this up"),
    (r"\badditionally\b", "also"),
    (r"\bultimately\b", "in the end"),
    (r"\bconsequently\b", "so"),
    (r"\bparamount\b", "really important"),
    (r"\bpivotal\b", "key"),
    (r"\bcrucial\b", "important"),
    (r"\bleverage\b", "use"),
    (r"\bfoster\b", "encourage"),
    (r"\bunderscore\b", "highlight"),
    (r"\bseamless\b", "smooth"),
    (r"\bembark(?:ing)? on\b", "start"),
]


class HumanLogicHumanizer:
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        base_url: Optional[str] = None,
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
        self.log_fn = log_fn or (lambda message: logger.info(message))
        self.rng = random.Random()

    def _log(self, message: str) -> None:
        self.log_fn(message)

    def _resolve_intensity(self, intensity: str) -> Dict[str, float | int]:
        key = (intensity or "medium").strip().lower()
        return INTENSITY_BASE.get(key, INTENSITY_BASE["medium"])

    def _build_system_prompt(self, force_more_erratic: bool) -> str:
        prompt = (
            "You are rewriting text to sound like a real person thinking out loud "
            "while still keeping the facts straight.\n\n"
            "STRUCTURAL DE-BALANCING LAWS (MANDATORY):\n"
            "1. ANTI-STRUCTURED LOGIC: Do NOT introduce a topic with a clean definition "
            "followed by sequenced explanations or tidy lists of three. Mix arguments. "
            "Skip formal transitions. Jump between related points the way a person would.\n"
            "2. DYNAMIC SYNTACTIC COMPRESSION: Delete fluff adjectives and abstract filler. "
            "Frame every idea with direct, plain, concrete explanations.\n"
            "3. PERSPECTIVE INJECTION: Embed conversational signals and qualifiers such as "
            "\"now, looking closer at...\", \"granted, this means...\", "
            "\"it is worth pointing out that...\", and \"honestly,\".\n"
            "4. PASSIVE-VOICE ELIMINATION: Use 100% active voice. No balanced passive academic "
            "phrasing.\n"
            "5. FRAGMENTATION: Prefer short bursts next to longer uneven thoughts. "
            "Allow slight structural imperfection. Avoid polished essay cadence.\n"
            "6. Keep the original meaning, facts, names, numbers, and citations.\n"
            "7. Keep roughly the same length and paragraph count.\n"
            "8. Return only the rewritten text."
        )
        if force_more_erratic:
            prompt += (
                "\n\nRECURSIVE OVERRIDE: The previous draft was too even. "
                "Break the rhythm harder. Shorten some lines violently. Stretch others. "
                "Add more hesitation markers. Do not restore clean essay structure."
            )
        return prompt

    def _chat(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float,
        top_p: float,
        top_k: int,
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
            headers["X-Title"] = os.getenv("APP_NAME", "Human Logic Humanizer")

        payload: Dict[str, Any] = {
            "model": self.model,
            "temperature": temperature,
            "top_p": top_p,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        }

        # top_k is supported by many OpenRouter/open models; ignored by some OpenAI models.
        if top_k and top_k > 0:
            payload["top_k"] = int(top_k)

        response = requests.post(
            self.chat_url,
            headers=headers,
            json=payload,
            timeout=120,
        )
        if response.status_code >= 400:
            # Retry without top_k if provider rejects unknown parameter
            if "top_k" in payload and response.status_code in {400, 422}:
                payload.pop("top_k", None)
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

    def strip_cliches(self, text: str) -> str:
        cleaned = text
        for pattern, replacement in CLICHE_REPLACEMENTS:
            cleaned = re.sub(pattern, replacement, cleaned, flags=re.IGNORECASE)
        return cleaned

    def _split_long_sentence(self, sentence: str) -> List[str]:
        words = sentence.strip().split()
        if len(words) <= MAX_SENTENCE_WORDS:
            return [sentence.strip()]

        conjunctions = {"and", "but", "so", "or", "because", "while", "although"}
        lower_words = [word.lower().strip(",.;:") for word in words]

        # Prefer a split near the middle using a coordinating conjunction
        mid = len(words) // 2
        best_index = -1
        best_distance = 10**9
        for index, token in enumerate(lower_words):
            if token in conjunctions and 3 <= index <= len(words) - 3:
                distance = abs(index - mid)
                if distance < best_distance:
                    best_distance = distance
                    best_index = index

        if best_index > 0:
            left = " ".join(words[:best_index]).rstrip(",;:")
            right = " ".join(words[best_index + 1 :]).lstrip(",;:")
            joiner = self.rng.choice([". ", " — "])
            if joiner == ". ":
                right = right[:1].upper() + right[1:] if right else right
                return [f"{left}.", right]
            return [f"{left} — {right}"]

        # Fallback: hard cut near midpoint
        cut = max(4, min(len(words) - 3, mid + self.rng.choice([-2, -1, 0, 1, 2])))
        left = " ".join(words[:cut]).rstrip(",;:")
        right = " ".join(words[cut:]).lstrip(",;:")
        right = right[:1].upper() + right[1:] if right else right
        return [f"{left}.", right]

    def apply_micro_sentence_slicing(self, text: str) -> Dict[str, Any]:
        """
        Hard post-process: split any sentence over 16 words into unequal parts.
        Returns rewritten text and number of structural adjustments.
        """
        paragraphs = [
            paragraph.strip()
            for paragraph in re.split(r"\n\s*\n", text.strip())
            if paragraph.strip()
        ]
        adjustments = 0
        rebuilt_paragraphs: List[str] = []

        for paragraph in paragraphs:
            sentences = split_sentences(paragraph)
            new_sentences: List[str] = []
            for sentence in sentences:
                if word_count(sentence) > MAX_SENTENCE_WORDS:
                    pieces = self._split_long_sentence(sentence)
                    adjustments += max(0, len(pieces) - 1)
                    new_sentences.extend(pieces)
                else:
                    new_sentences.append(sentence)
            rebuilt_paragraphs.append(" ".join(new_sentences).strip())

        return {
            "text": "\n\n".join(rebuilt_paragraphs).strip(),
            "adjustments": adjustments,
        }

    def _normalize_output(self, text: str) -> str:
        cleaned = text.replace("\r\n", "\n")
        cleaned = cleaned.replace("\\n\\n", "\n\n").replace("\\n", "\n")
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

    def generate_erratic_draft(
        self,
        text: str,
        temperature: float,
        top_p: float,
        top_k: int,
        force_more_erratic: bool = False,
    ) -> str:
        system_prompt = self._build_system_prompt(force_more_erratic)
        user_prompt = (
            "Rewrite the following text under the structural de-balancing laws.\n\n"
            f"{text.strip()}\n\n"
            "Return only the rewritten text."
        )
        return self._chat(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=temperature,
            top_p=top_p,
            top_k=top_k,
        )

    def run_humanization_pipeline(
        self,
        text: str,
        intensity: str = "medium",
    ) -> Dict[str, Any]:
        source = (text or "").strip()
        if not source:
            raise ValueError("Text cannot be empty.")

        base = self._resolve_intensity(intensity)
        temperature = float(base["temperature"])
        top_p = float(base["top_p"])
        top_k = int(base["top_k"])

        trace: List[Dict[str, Any]] = []
        best: Optional[Dict[str, Any]] = None
        total_adjustments = 0

        self._log(
            f"[start] Human-thought pipeline | intensity={intensity} | model={self.model}"
        )

        for attempt in range(1, MAX_PASSES + 1):
            self._log(
                f"[pass {attempt}/{MAX_PASSES}] generate draft "
                f"(temp={temperature:.2f}, top_p={top_p:.2f}, top_k={top_k})"
            )

            draft = self.generate_erratic_draft(
                source,
                temperature=temperature,
                top_p=top_p,
                top_k=top_k,
                force_more_erratic=attempt > 1,
            )
            draft = self.strip_cliches(draft)
            sliced = self.apply_micro_sentence_slicing(draft)
            draft = self._normalize_output(sliced["text"])
            adjustments = int(sliced["adjustments"])
            total_adjustments += adjustments

            metrics = evaluate_draft(draft)
            record = {
                "pass": attempt,
                "temperature": round(temperature, 3),
                "top_p": round(top_p, 3),
                "top_k": top_k,
                "structural_adjustments": adjustments,
                "structural_entropy": metrics["structural_entropy"],
                "cliche_blocked": metrics["cliche_blocked"],
                "cliche_matches": metrics["cliche_matches"],
                "burstiness_ok": metrics["burstiness_ok"],
                "mathematical_loss": metrics["mathematical_loss"],
                "passed": metrics["passed"],
                "message": (
                    "PASS accepted"
                    if metrics["passed"]
                    else (
                        f"FAIL -> {metrics['entropy_message']} | "
                        f"{metrics['cliche_message']} | {metrics['burstiness_message']}"
                    )
                ),
            }
            trace.append(record)

            self._log(
                "[pass {pass_no}] loss={loss} entropy={entropy} adjustments={adj} "
                "cliches={cliches} burst_ok={burst} passed={passed}".format(
                    pass_no=attempt,
                    loss=metrics["mathematical_loss"],
                    entropy=metrics["structural_entropy"],
                    adj=adjustments,
                    cliches=metrics["cliche_matches"],
                    burst=metrics["burstiness_ok"],
                    passed=metrics["passed"],
                )
            )

            candidate = {
                "humanized_text": draft,
                "burstiness_score": float(metrics["structural_entropy"]),
                "ai_risk_score": float(len(metrics["cliche_matches"]) * 15.0),
                "structural_entropy": float(metrics["structural_entropy"]),
                "attempts": attempt,
                "passed": bool(metrics["passed"]),
                "mathematical_loss": float(metrics["mathematical_loss"]),
                "structural_adjustments": total_adjustments,
                "trace": trace.copy(),
            }

            if best is None or candidate["mathematical_loss"] < best["mathematical_loss"]:
                best = candidate

            if metrics["passed"]:
                self._log(f"[pass {attempt}] accepted")
                break

            # Recursive retune: raise temperature, alter top_k, nudge top_p
            temperature = 0.98
            top_k = max(20, min(100, top_k + self.rng.choice([-15, -10, 10, 15, 20])))
            top_p = max(0.75, min(0.98, top_p + self.rng.choice([-0.04, -0.02, 0.02, 0.03])))
            self._log(
                f"[pass {attempt}] retune -> temp={temperature:.2f}, "
                f"top_p={top_p:.2f}, top_k={top_k}"
            )

        if best is None:
            raise RuntimeError("Humanization failed to produce any candidate output.")

        self._log(
            f"[done] selected pass={best['attempts']} loss={best['mathematical_loss']} "
            f"entropy={best['structural_entropy']} adjustments={best['structural_adjustments']}"
        )
        return best


# Compatibility aliases
CryptographicHumanizer = HumanLogicHumanizer
AIHumanizer = HumanLogicHumanizer
