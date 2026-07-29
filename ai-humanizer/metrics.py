"""Advanced structural and lexical metrics for adversarial humanization."""

from __future__ import annotations

import math
import re
from collections import Counter
from typing import Dict, List, Tuple

import numpy as np

SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?])\s+(?=[A-Z\"'(0-9])")

HIGH_RISK_LEXICON = [
    "delve",
    "delves",
    "delving",
    "tapestry",
    "multifaceted",
    "furthermore",
    "moreover",
    "testament",
    "paramount",
    "pivotal",
    "crucial",
    "leverage",
    "leveraging",
    "foster",
    "fostering",
    "underscore",
    "underscores",
    "seamless",
    "embark",
    "embarking",
    "ultimately",
    "consequently",
    "additionally",
    "in conclusion",
    "in today's fast-paced world",
    "it is important to note",
    "plays a crucial role",
    "a myriad of",
    "plethora of",
    "reap the benefits",
    "cultivate a greater sense",
    "much-needed respite",
]

MIN_BURSTINESS_STD = 12.0
MIN_ADJACENT_LENGTH_DELTA = 7


def split_sentences(text: str) -> List[str]:
    cleaned = re.sub(r"[ \t]+", " ", text.strip())
    if not cleaned:
        return []
    parts = SENTENCE_SPLIT_RE.split(cleaned)
    return [part.strip() for part in parts if part.strip()]


def word_count(sentence: str) -> int:
    return len(re.findall(r"[A-Za-z0-9']+", sentence))


def sentence_lengths(text: str) -> List[int]:
    return [word_count(sentence) for sentence in split_sentences(text)]


def calculate_advanced_burstiness(text: str) -> float:
    """
    Standard deviation of sentence lengths (words).
    Outputs below MIN_BURSTINESS_STD (12.0) should be rejected by the pipeline.
    """
    lengths = sentence_lengths(text)
    if len(lengths) <= 1:
        return 0.0
    arr = np.array(lengths, dtype=float)
    return float(np.std(arr, ddof=1))


def check_sentence_length_alternation(text: str) -> Tuple[bool, str]:
    """
    Hard filter: any three consecutive sentences whose pairwise word-count
    differences are all < 7 fails validation.
    """
    lengths = sentence_lengths(text)
    if len(lengths) < 3:
        return True, "Too few sentences for alternation check."

    for index in range(len(lengths) - 2):
        a, b, c = lengths[index], lengths[index + 1], lengths[index + 2]
        deltas = [abs(a - b), abs(b - c), abs(a - c)]
        if all(delta < MIN_ADJACENT_LENGTH_DELTA for delta in deltas):
            return (
                False,
                (
                    f"Flat rhythm at sentences {index + 1}-{index + 3}: "
                    f"lengths={a},{b},{c} (all deltas < {MIN_ADJACENT_LENGTH_DELTA})."
                ),
            )
    return True, "Sentence-length alternation passed."


def evaluate_semantic_fingerprint(text: str) -> Dict[str, float | list | int]:
    """
    Lexical density risk from high-risk AI signature clusters.
    Returns penalty score and matched terms.
    """
    lower = text.lower()
    matches = [term for term in HIGH_RISK_LEXICON if term in lower]
    # Cluster density: repeated high-risk hits compound the penalty
    unique_hits = len(set(matches))
    raw_hits = len(matches)
    penalty = float(unique_hits * 12.0 + max(0, raw_hits - unique_hits) * 4.0)

    tokens = re.findall(r"[a-z']+", lower)
    if tokens:
        risk_token_hits = sum(
            1
            for token in tokens
            if token
            in {
                "delve",
                "tapestry",
                "multifaceted",
                "furthermore",
                "moreover",
                "testament",
                "paramount",
                "pivotal",
                "crucial",
                "leverage",
                "foster",
                "underscore",
                "seamless",
                "embark",
                "ultimately",
            }
        )
        density = risk_token_hits / max(1, len(tokens))
        penalty += density * 400.0

    return {
        "penalty": round(min(100.0, penalty), 2),
        "matches": sorted(set(matches)),
        "hit_count": raw_hits,
    }


def calculate_local_token_entropy(text: str, window: int = 12) -> float:
    """
    Approximate localized token entropy over sliding windows.
    Higher average entropy usually correlates with less formulaic prose.
    """
    tokens = re.findall(r"[a-z']+", text.lower())
    if len(tokens) < window:
        counts = Counter(tokens)
        total = sum(counts.values()) or 1
        return float(
            -sum((count / total) * math.log2(count / total) for count in counts.values())
        )

    entropies: List[float] = []
    for start in range(0, len(tokens) - window + 1, max(1, window // 2)):
        chunk = tokens[start : start + window]
        counts = Counter(chunk)
        total = len(chunk)
        entropy = -sum(
            (count / total) * math.log2(count / total) for count in counts.values()
        )
        entropies.append(entropy)

    return float(round(sum(entropies) / len(entropies), 4)) if entropies else 0.0


def evaluate_output(text: str) -> Dict[str, float | bool | str | list | int]:
    burstiness = calculate_advanced_burstiness(text)
    fingerprint = evaluate_semantic_fingerprint(text)
    alternation_ok, alternation_msg = check_sentence_length_alternation(text)
    entropy = calculate_local_token_entropy(text)

    passed = (
        burstiness >= MIN_BURSTINESS_STD
        and float(fingerprint["penalty"]) <= 0.0
        and alternation_ok
    )

    return {
        "passed": passed,
        "burstiness_score": round(burstiness, 3),
        "lexical_penalty": float(fingerprint["penalty"]),
        "lexical_matches": fingerprint["matches"],
        "alternation_ok": alternation_ok,
        "alternation_message": alternation_msg,
        "token_entropy": entropy,
        "min_burstiness_required": MIN_BURSTINESS_STD,
    }
