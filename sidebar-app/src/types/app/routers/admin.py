"""
Admin API router — tag taxonomy and routing rules.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import RoutingRule, TagTaxonomy
from app.db.session import get_db
from app.models.schemas import TagCreate, TagResponse

router = APIRouter()


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.get("/tags", response_model=list[TagResponse])
async def list_tags(active_only: bool = True, db: AsyncSession = Depends(get_db)):
    query = select(TagTaxonomy).order_by(TagTaxonomy.tag_name)
    if active_only:
        query = query.where(TagTaxonomy.active == True)  # noqa: E712
    return (await db.scalars(query)).all()


@router.post("/tags", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
async def create_tag(body: TagCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.scalar(select(TagTaxonomy).where(TagTaxonomy.tag_name == body.tag_name))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail=f"Tag '{body.tag_name}' already exists")
    tag = TagTaxonomy(tag_name=body.tag_name, category=body.category, description=body.description)
    db.add(tag)
    await db.flush()
    return tag


@router.delete("/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_tag(tag_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    tag = await db.get(TagTaxonomy, tag_id)
    if not tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
    tag.active = False
    await db.flush()


@router.get("/routing-rules")
async def list_routing_rules(db: AsyncSession = Depends(get_db)):
    rules = (await db.scalars(select(RoutingRule).where(RoutingRule.active == True))).all()  # noqa: E712
    return [{"id": str(r.id), "group_name": r.group_name,
             "keywords": r.keywords, "categories": r.categories, "priority": r.priority}
            for r in rules]


@router.post("/routing-rules", status_code=status.HTTP_201_CREATED)
async def create_routing_rule(body: dict, db: AsyncSession = Depends(get_db)):
    rule = RoutingRule(
        group_name=body.get("group_name", ""),
        keywords=body.get("keywords", []),
        categories=body.get("categories", []),
        priority=body.get("priority"),
    )
    db.add(rule)
    await db.flush()
    return {"id": str(rule.id), "group_name": rule.group_name}
