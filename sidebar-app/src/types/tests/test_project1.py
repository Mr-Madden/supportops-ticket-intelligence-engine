"""
Test suite — AI Ticket Intelligence Engine
Run: pytest tests/ -v
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

from app.shared.pii import scrubPII, scrubPII_dict


class TestScrubPII:

    def test_removes_email(self):
        assert "[EMAIL]" in scrubPII("Contact me at john.doe@example.com please")

    def test_removes_phone_us(self):
        assert "[PHONE]" in scrubPII("Call 555-867-5309 anytime")

    def test_removes_phone_with_country_code(self):
        assert "[PHONE]" in scrubPII("Reach me at +1 (800) 555-0100")

    def test_removes_ssn(self):
        assert "[SSN]" in scrubPII("My SSN is 123-45-6789")

    def test_removes_credit_card(self):
        assert "[CARD]" in scrubPII("Visa card 4111111111111111 was charged")

    def test_removes_ip_address(self):
        assert "[IP]" in scrubPII("Request from 192.168.1.100")

    def test_removes_url(self):
        assert "[URL]" in scrubPII("Visit https://example.com/reset?token=abc")

    def test_removes_name(self):
        result = scrubPII("John Smith submitted this ticket")
        assert "John Smith" not in result

    def test_empty_string(self):
        assert scrubPII("") == ""

    def test_none_input(self):
        assert scrubPII(None) == ""

    def test_clean_text_unchanged(self):
        text = "I cannot log into my account after the password reset"
        assert "log into my account" in scrubPII(text)

    def test_scrub_dict_specific_fields(self):
        data = {"subject": "Help from john@test.com", "category": "account", "id": 123}
        result = scrubPII_dict(data, fields=["subject"])
        assert "[EMAIL]" in result["subject"]
        assert result["category"] == "account"
        assert result["id"] == 123

    def test_multiple_pii_in_one_string(self):
        text = "Email john@test.com or call 555-123-4567"
        result = scrubPII(text)
        assert "[EMAIL]" in result
        assert "[PHONE]" in result


class TestRunLLM:

    @pytest.mark.asyncio
    async def test_unknown_template_raises(self):
        from app.shared.llm import runLLM
        with pytest.raises(ValueError, match="Unknown LLM template"):
            await runLLM("nonexistent_template", body="test")

    @pytest.mark.asyncio
    async def test_tagger_returns_expected_keys(self):
        from app.shared.llm import runLLM
        with patch("app.shared.llm._call_anthropic", new_callable=AsyncMock,
                   return_value='{"tags": ["billing"], "category": "billing", "sub_category": "invoice"}'):
            result = await runLLM("tagger", subject="Wrong charge", body="I was charged twice")
        assert "tags" in result
        assert "category" in result

    @pytest.mark.asyncio
    async def test_sentiment_returns_score(self):
        from app.shared.llm import runLLM
        with patch("app.shared.llm._call_anthropic", new_callable=AsyncMock,
                   return_value='{"score": 2, "label": "concerned", "key_phrases": [], "escalation_risk": "medium"}'):
            result = await runLLM("sentiment", body="I am very frustrated")
        assert result["score"] == 2
        assert result["label"] == "concerned"

    @pytest.mark.asyncio
    async def test_json_parse_strips_markdown_fences(self):
        from app.shared.llm import _parse_json
        raw = '```json\n{"key": "value"}\n```'
        assert _parse_json(raw) == {"key": "value"}


class TestWebhookSignature:

    def test_verify_passes_without_secret(self):
        from app.routers.webhook import _verify_signature
        with patch("app.routers.webhook.settings") as s:
            s.ZENDESK_WEBHOOK_SECRET = ""
            assert _verify_signature(b"body", None) is True

    def test_verify_fails_without_signature_when_secret_set(self):
        from app.routers.webhook import _verify_signature
        with patch("app.routers.webhook.settings") as s:
            s.ZENDESK_WEBHOOK_SECRET = "secret123"
            assert _verify_signature(b"body", None) is False

    def test_verify_passes_with_correct_signature(self):
        import hmac, hashlib
        body = b'{"ticket": {"id": 1}}'
        secret = "mysecret"
        sig = "sha256=" + hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
        from app.routers.webhook import _verify_signature
        with patch("app.routers.webhook.settings") as s:
            s.ZENDESK_WEBHOOK_SECRET = secret
            assert _verify_signature(body, sig) is True


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()
