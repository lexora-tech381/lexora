"""Text structure metrics for burstiness and AI-risk approximation."""

from __future__ import annotations

import math
import re
from collections import Counter
from typing import List

import numpy as np

SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?])\s+(?=[A-Z\"'(])")

AI_TRANSITIONS = [
    "in conclusion",
    "furthermore",
    "moreover",
    "additionally",
    "in today's fast-paced world",
    "it is important to note",
    "as a result",
    "on the other hand",
    "in summary",
    "to summarize",
    "overall",
    "ultimately",
    "consequently",
    "therefore",
    "in addition",
    "that being said",
    "with that in mind",
    "moving forward",
    "one of the main",
    "a key aspect",
    "plays a crucial role",
    "it is worth noting",
]


def split_sentences(text: str) -> List[str]:
    cleaned = re.sub(r"\s+", " ", text.strip())
    if not cleaned:
        return []
    parts = SENTENCE_SPLIT_RE.split(cleaned)
    return [part.strip() for part in parts if part.strip()]


def word_count(sentence: str) -> int:
    words = re.findall(r"[A-Za-z0-9']+", sentence)
    return len(words)


def calculate_burstiness(text: str) -> float:
    """
    Standard deviation of sentence lengths (in words).
    Higher values generally indicate more human-like rhythm.
    """
    sentences = split_sentences(text)
    if len(sentences) <= 1:
        return 0.0

    lengths = np.array([word_count(sentence) for sentence in sentences], dtype=float)
    if lengths.std() == 0:
        return 0.0
    return float(np.std(lengths, ddof=1)) if len(lengths) > 1 else float(np.std(lengths))


def _uniformity_penalty(text: str) -> float:
    sentences = split_sentences(text)
    if len(sentences) < 3:
        return 15.0

    lengths = [word_count(sentence) for sentence in sentences]
    mean = sum(lengths) / len(lengths)
    if mean == 0:
        return 40.0

    variance = sum((length - mean) ** 2 for length in lengths) / len(lengths)
    cv = math.sqrt(variance) / mean
    # Low coefficient of variation => more uniform => higher risk
    if cv < 0.2:
        return 35.0
    if cv < 0.35:
        return 20.0
    if cv < 0.5:
        return 10.0
    return 0.0


def _transition_penalty(text: str) -> float:
    lower = text.lower()
    hits = sum(1 for phrase in AI_TRANSITIONS if phrase in lower)
    return min(40.0, hits * 6.5)


def _opening_repetition_penalty(text: str) -> float:
    sentences = split_sentences(text)
    if len(sentences) < 2:
        return 0.0

    openings = []
    for sentence in sentences:
        tokens = re.findall(r"[A-Za-z']+", sentence.lower())
        if not tokens:
            continue
        openings.append(" ".join(tokens[:2]))

    if not openings:
        return 0.0

    counts = Counter(openings)
    repeats = sum(count - 1 for count in counts.values() if count > 1)
    return min(20.0, repeats * 4.0)


def _ngram_predictability_penalty(text: str) -> float:
    tokens = re.findall(r"[a-z']+", text.lower())
    if len(tokens) < 20:
        return 5.0

    bigrams = list(zip(tokens, tokens[1:]))
    trigrams = list(zip(tokens, tokens[1:], tokens[2:]))

    bigram_counts = Counter(bigrams)
    trigram_counts = Counter(trigrams)

    repeated_bigrams = sum(1 for count in bigram_counts.values() if count >= 3)
    repeated_trigrams = sum(1 for count in trigram_counts.values() if count >= 2)

    score = repeated_bigrams * 1.5 + repeated_trigrams * 2.5
    return min(25.0, score)


def calculate_predictability_score(text: str) -> float:
    """
    Approximate AI-risk score from 0 (low risk / more human) to 100 (high risk / more AI-like).
    Uses transitional phrasing, sentence uniformity, opening repetition, and n-gram reuse.
    """
    if not text or not text.strip():
        return 100.0

    score = 0.0
    score += _transition_penalty(text)
    score += _uniformity_penalty(text)
    score += _opening_repetition_penalty(text)
    score += _ngram_predictability_penalty(text)

    burstiness = calculate_burstiness(text)
    if burstiness < 4.0:
        score += 20.0
    elif burstiness < 8.0:
        score += 10.0

    return float(max(0.0, min(100.0, round(score, 2))))
