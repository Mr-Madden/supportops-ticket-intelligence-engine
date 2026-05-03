"""
PII removal module — scrubs personal identifiable information
before any text is sent to an LLM or stored in the database.

Patterns covered:
  - Email addresses
  - Phone numbers (US and international)
  - Social Security Numbers
  - Credit card numbers (Visa, Mastercard, Amex, Discover)
  - URLs and domain names
  - Simple name patterns (First Last)
  - IP addresses
"""

import re
from typing import Union

PII_PATTERNS: list[tuple[str, str]] = [
    # Email addresses
    (
        r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Z|a-z]{2,}\b",
        "[EMAIL]",
    ),
    # US phone numbers (various formats)
    (
        r"\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b",
        "[PHONE]",
    ),
    # International phone (E.164 style)
    (
        r"\+\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}",
        "[PHONE]",
    ),
    # Social Security Numbers
    (
        r"\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b",
        "[SSN]",
    ),
    # Credit card numbers
    (
        r"\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b",
        "[CARD]",
    ),
    # IP addresses
    (
        r"\b(?:\d{1,3}\.){3}\d{1,3}\b",
        "[IP]",
    ),
    # URLs
    (
        r"https?://[^\s]+",
        "[URL]",
    ),
    # Bare domains (e.g. example.com/path)
    (
        r"\b(?:[a-zA-Z0-9\-]+\.)+(?:com|org|net|io|ai|co|uk|de|fr|jp|ca|au)\b(?:/[^\s]*)?",
        "[URL]",
    ),
    # Simple capitalized name patterns — "John Smith", "Mary O'Brien"
    (
        r"\b[A-Z][a-z]{1,20}(?:\s[A-Z][a-z]{1,20}){1,2}\b",
        "[NAME]",
    ),
]

COMPILED_PATTERNS: list[tuple[re.Pattern, str]] = [
    (re.compile(pattern, re.IGNORECASE), replacement)
    for pattern, replacement in PII_PATTERNS
]


def scrubPII(text: str) -> str:
    if not text or not isinstance(text, str):
        return text or ""
    for pattern, replacement in COMPILED_PATTERNS:
        text = pattern.sub(replacement, text)
    return text.strip()


def scrubPII_dict(data: dict, fields: list[str]) -> dict:
    result = dict(data)
    for field in fields:
        if field in result and isinstance(result[field], str):
            result[field] = scrubPII(result[field])
    return result


def scrubPII_list(items: list[str]) -> list[str]:
    return [scrubPII(item) for item in items]
