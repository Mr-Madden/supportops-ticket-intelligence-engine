def scrubPII(text: str) -> str:
    return text.replace("@", "[REDACTED_EMAIL]")
