"""Structural entropy and lexical cliché checks for human-thought rewriting."""

from __future__ import annotations

import re
from typing import Dict, List, Tuple

import numpy as np

SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?])\s+(?=[A-Z\"'(0-9])")

AI_CLICHES = [
    "delve",
    "delves",
    "delving",
    "tapestry",
    "moreover",
    "furthermore",
    "testament",
    "multifaceted",
    "in conclusion",
    "additionally",
    "ultimately",
    "consequently",
    "paramount",
    "pivotal",
    "crucial",
    "leverage",
    "foster",
    "underscore",
    "seamless",
    "embark",
    "in today's fast-paced world",
    "it is important to note",
    "plays a crucial role",
]

# Replacements used for soft lexical cleanup (do not reject whole drafts)
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
    (r"\bin today's fast-paced world\b", "these days"),
    (r"\bit is important to note that\b", "worth noting,"),
    (r"\bplays a crucial role\b", "matters a lot"),
]

MIN_STRUCTURAL_ENTROPY = 8.5
MIN_TRIPLET_DELTA = 8


def split_sentences(text: str) -> List[str]:
    cleaned = re.sub(r"[ \t]+", " ", (text or "").strip())
    if not cleaned:
        return []
    parts = SENTENCE_SPLIT_RE.split(cleaned)
    return [part.strip() for part in parts if part.strip()]


def word_count(sentence: str) -> int:
    return len(re.findall(r"[A-Za-z0-9']+", sentence))


def sentence_lengths(text: str) -> List[int]:
    return [word_count(sentence) for sentence in split_sentences(text)]


def evaluate_structural_entropy(text: str) -> Dict[str, float | bool | str | list]:
    """
    Measure sentence-length standard deviation.
    Soft reject when std-dev < 8.5 words.
    """
    lengths = sentence_lengths(text)
    if len(lengths) <= 1:
        return {
            "entropy": 0.0,
            "passed": False,
            "message": "Not enough sentences to evaluate structural entropy.",
            "lengths": lengths,
        }

    entropy = float(np.std(np.array(lengths, dtype=float), ddof=1))
    passed = entropy >= MIN_STRUCTURAL_ENTROPY
    return {
        "entropy": round(entropy, 3),
        "passed": passed,
        "message": (
            "Structural entropy passed."
            if passed
            else f"Structural entropy soft-fail ({entropy:.2f} < {MIN_STRUCTURAL_ENTROPY})."
        ),
        "lengths": lengths,
    }


def remove_lexical_cliches(text: str) -> Tuple[str, List[str]]:
    """Flag and replace specific AI signature words/phrases in-place."""
    cleaned = text or ""
    matches: List[str] = []
    lower = cleaned.lower()
    for term in AI_CLICHES:
        if term in lower:
            matches.append(term)

    for pattern, replacement in CLICHE_REPLACEMENTS:
        cleaned = re.sub(pattern, replacement, cleaned, flags=re.IGNORECASE)

    return cleaned, sorted(set(matches))


def check_lexical_cliches(text: str) -> Dict[str, float | bool | list | str]:
    """
    Flag AI signatures and report them.
    Does NOT hard-block drafts; callers should remove matches instead.
    """
    lower = (text or "").lower()
    matches = sorted({term for term in AI_CLICHES if term in lower})
    return {
        "blocked": False,
        "matches": matches,
        "penalty": float(len(matches) * 4.0),
        "message": (
            f"Flagged AI signatures for removal: {', '.join(matches)}"
            if matches
            else "No lexical clichés detected."
        ),
    }


def check_violent_burstiness(text: str) -> Tuple[bool, str]:
    """
    Soft check: warn when three consecutive sentences all differ by < 8 words.
    """
    lengths = sentence_lengths(text)
    if len(lengths) < 3:
        return True, "Too few sentences for triplet burstiness check."

    for index in range(len(lengths) - 2):
        a, b, c = lengths[index], lengths[index + 1], lengths[index + 2]
        deltas = [abs(a - b), abs(b - c), abs(a - c)]
        if all(delta < MIN_TRIPLET_DELTA for delta in deltas):
            return (
                False,
                (
                    f"Flat triplet at sentences {index + 1}-{index + 3}: "
                    f"lengths={a},{b},{c}."
                ),
            )
    return True, "Violent burstiness check passed."


def evaluate_draft(text: str) -> Dict[str, object]:
    entropy = evaluate_structural_entropy(text)
    cliches = check_lexical_cliches(text)
    burst_ok, burst_msg = check_violent_burstiness(text)

    # Lexical hits no longer veto acceptance; entropy is the main gate.
    passed = bool(entropy["passed"])

    loss = 0.0
    if not entropy["passed"]:
        loss += max(0.0, MIN_STRUCTURAL_ENTROPY - float(entropy["entropy"]))
    loss += float(cliches["penalty"])
    if not burst_ok:
        loss += 4.0

    return {
        "passed": passed,
        "structural_entropy": float(entropy["entropy"]),
        "entropy_passed": bool(entropy["passed"]),
        "entropy_message": str(entropy["message"]),
        "cliche_blocked": False,
        "cliche_matches": list(cliches["matches"]),
        "cliche_message": str(cliches["message"]),
        "burstiness_ok": burst_ok,
        "burstiness_message": burst_msg,
        "sentence_lengths": list(entropy["lengths"]),
        "mathematical_loss": round(loss, 3),
    }
