"""
VizardFree – Hinglish Language Utilities
Helpers for detecting and processing Hinglish (Hindi-English mixed) text.
"""

import re
from typing import Literal

LangCode = Literal["hi", "en", "hinglish", "other"]

# Unicode ranges
DEVANAGARI_RE = re.compile(r'[\u0900-\u097F]')
LATIN_RE = re.compile(r'[a-zA-Z]')

# Common Hinglish code-switching marker words
HINGLISH_MARKERS = {
    "yaar", "bhai", "yeh", "woh", "kya", "toh", "lekin", "aur", "nahi",
    "haan", "theek", "ek", "do", "teen", "acha", "kyun", "kaise", "matlab",
    "abhi", "phir", "sach", "bilkul", "zarur", "bas", "mera", "tera",
    "apna", "humara", "unka", "kab", "kahan", "kaafi", "bohot", "bahut",
    "thoda", "zyada", "log", "samajh", "sunlo", "dekho", "bolo", "karke",
    "raha", "rahe", "hoga", "tha", "thi", "the", "hai", "hain", "ho",
}


def is_hinglish(text: str, threshold: float = 0.15) -> bool:
    """
    Returns True if the text is likely Hinglish (Hindi+English mix).
    
    Criteria:
    1. Contains both Devanagari and Latin characters, OR
    2. Contains enough Hinglish marker words alongside English words
    """
    if not text:
        return False
    
    # Check for mixed scripts
    has_deva = bool(DEVANAGARI_RE.search(text))
    has_latin = bool(LATIN_RE.search(text))
    
    if has_deva and has_latin:
        return True
    
    # Check for Roman Hinglish (no Devanagari, but heavy Hinglish markers)
    if not has_deva and has_latin:
        words = text.lower().split()
        if not words:
            return False
        marker_count = sum(1 for w in words if w.strip(".,!?") in HINGLISH_MARKERS)
        ratio = marker_count / len(words)
        return ratio >= threshold
    
    return False


def normalize_hinglish(text: str) -> str:
    """
    Normalize common Hinglish spellings for consistent display.
    Example: "kya" → "kya", "kyaa" → "kya"
    """
    replacements = {
        r'\bkyaa\b': 'kya',
        r'\bnahi\b': 'nahi',
        r'\bnahin\b': 'nahi',
        r'\bnaheen\b': 'nahi',
        r'\bthoda\b': 'thoda',
        r'\bthora\b': 'thoda',
        r'\bbahut\b': 'bahut',
        r'\bbohot\b': 'bahut',
        r'\bzyada\b': 'zyada',
        r'\bkaafi\b': 'kaafi',
        r'\bkafi\b': 'kaafi',
        r'\btheek\b': 'theek',
        r'\bthik\b': 'theek',
    }
    result = text
    for pattern, replacement in replacements.items():
        result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)
    return result


def detect_script(text: str) -> str:
    """
    Detect dominant script in text.
    Returns: 'devanagari', 'latin', 'mixed', 'other'
    """
    deva_chars = len(DEVANAGARI_RE.findall(text))
    latin_chars = len(LATIN_RE.findall(text))
    
    if deva_chars == 0 and latin_chars == 0:
        return "other"
    if deva_chars > 0 and latin_chars > 0:
        return "mixed"
    if deva_chars > latin_chars:
        return "devanagari"
    return "latin"
