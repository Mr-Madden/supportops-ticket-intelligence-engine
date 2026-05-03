"""
Zendesk API wrapper.

Provides a typed, async client for the Zendesk Support API.
All sub-clients are mounted on ZendeskClient:

    zd = ZendeskClient()
    ticket  = await zd.tickets.get(12345)
    groups  = await zd.groups.list()
    article = await zd.help_center.get_article(9876)
"""

import logging
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

_DEFAULT_TIMEOUT = httpx.Timeout(30.0, connect=10.0)


class ZendeskAPIError(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(f"Zendesk API {status_code}: {detail}")


class _BaseAPI:
    def __init__(self, client: "ZendeskClient"):
        self._c = client

    async def _get(self, path: str, **params) -> dict:
        return await self._c._get(path, **params)

    async def _post(self, path: str, data: dict) -> dict:
        return await self._c._post(path, data)

    async def _put(self, path: str, data: dict) -> dict:
        return await self._c._put(path, data)

    async def _delete(self, path: str) -> dict:
        return await self._c._delete(path)


class TicketsAPI(_BaseAPI):
    async def get(self, ticket_id: int) -> dict:
        return (await self._get(f"/tickets/{ticket_id}"))["ticket"]

    async def list(self, status: list[str] | None = None, **params) -> list[dict]:
        if status:
            params["status"] = ",".join(status)
        response = await self._get("/tickets", **params)
        return response.get("tickets", [])

    async def update(self, ticket_id: int, fields: dict) -> dict:
        response = await self._put(f"/tickets/{ticket_id}", {"ticket": fields})
        return response.get("ticket", {})

    async def get_comments(self, ticket_id: int) -> list[dict]:
        response = await self._get(f"/tickets/{ticket_id}/comments")
        return response.get("comments", [])

    async def search(
        self,
        query: str = "",
        created_after: str | None = None,
        created_before: str | None = None,
        status: str = "solved",
        **extra,
    ) -> list[dict]:
        parts = [f"type:ticket status:{status}"]
        if query:
            parts.append(query)
        if created_after:
            parts.append(f"created>{created_after}")
        if created_before:
            parts.append(f"created<{created_before}")
        q = " ".join(parts)
        response = await self._get("/search", query=q, **extra)
        return response.get("results", [])


class UsersAPI(_BaseAPI):
    async def get(self, user_id: int) -> dict:
        return (await self._get(f"/users/{user_id}"))["user"]

    async def get_ticket_count(self, user_id: int) -> int:
        response = await self._get(f"/users/{user_id}/ticket_count")
        return response.get("user_ticket_count", {}).get("requester_count", 0)


class GroupsAPI(_BaseAPI):
    async def list(self) -> list[dict]:
        response = await self._get("/groups")
        return response.get("groups", [])

    async def get(self, group_id: int) -> dict:
        return (await self._get(f"/groups/{group_id}"))["group"]


class HelpCenterAPI(_BaseAPI):
    async def list_articles(self, locale: str = "en-us", **params) -> list[dict]:
        response = await self._get(f"/help_center/{locale}/articles", **params)
        return response.get("articles", [])

    async def get_article(self, article_id: int, locale: str = "en-us") -> dict:
        return (await self._get(f"/help_center/{locale}/articles/{article_id}"))["article"]

    async def create_article(self, section_id: int, title: str, body: str, locale: str = "en-us") -> dict:
        data = {"article": {"title": title, "body": body, "locale": locale, "draft": True}}
        return (await self._post(f"/help_center/sections/{section_id}/articles", data))["article"]

    async def update_article(self, article_id: int, fields: dict, locale: str = "en-us") -> dict:
        return (await self._put(f"/help_center/{locale}/articles/{article_id}", {"article": fields}))["article"]


class TriggersAPI(_BaseAPI):
    async def list(self) -> list[dict]:
        return (await self._get("/triggers"))["triggers"]

    async def create(self, data: dict) -> dict:
        return (await self._post("/triggers", {"trigger": data}))["trigger"]

    async def update(self, trigger_id: int, data: dict) -> dict:
        return (await self._put(f"/triggers/{trigger_id}", {"trigger": data}))["trigger"]


class MacrosAPI(_BaseAPI):
    async def list(self) -> list[dict]:
        return (await self._get("/macros"))["macros"]


class SLAPoliciesAPI(_BaseAPI):
    async def list(self) -> list[dict]:
        return (await self._get("/slas/policies"))["sla_policies"]


class ZendeskClient:
    def __init__(
        self,
        subdomain: str | None = None,
        email: str | None = None,
        api_token: str | None = None,
    ):
        self._base_url = f"https://{subdomain or settings.ZENDESK_SUBDOMAIN}.zendesk.com/api/v2"
        self._auth = (
            f"{email or settings.ZENDESK_EMAIL}/token",
            api_token or settings.ZENDESK_API_TOKEN,
        )
        self.tickets      = TicketsAPI(self)
        self.users        = UsersAPI(self)
        self.groups       = GroupsAPI(self)
        self.help_center  = HelpCenterAPI(self)
        self.triggers     = TriggersAPI(self)
        self.macros       = MacrosAPI(self)
        self.sla_policies = SLAPoliciesAPI(self)

    async def _request(self, method: str, path: str, **kwargs) -> dict:
        url = f"{self._base_url}{path}"
        try:
            async with httpx.AsyncClient(timeout=_DEFAULT_TIMEOUT) as client:
                response = await client.request(method, url, auth=self._auth, **kwargs)
                if response.status_code == 204:
                    return {}
                if not response.is_success:
                    raise ZendeskAPIError(response.status_code, response.text[:500])
                return response.json()
        except httpx.TimeoutException as exc:
            raise ZendeskAPIError(408, f"Request timed out: {exc}") from exc

    async def _get(self, path: str, **params) -> dict:
        return await self._request("GET", path, params=params if params else None)

    async def _post(self, path: str, data: dict) -> dict:
        return await self._request("POST", path, json=data)

    async def _put(self, path: str, data: dict) -> dict:
        return await self._request("PUT", path, json=data)

    async def _delete(self, path: str) -> dict:
        return await self._request("DELETE", path)
