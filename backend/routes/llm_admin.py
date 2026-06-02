"""LLM admin router — model list + default-model switch."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from llm.client import SUPPORTED_MODELS, get_default_model, set_default_model

router = APIRouter(prefix="/llm", tags=["llm"])


class DefaultModelBody(BaseModel):
    model: str


@router.get("/models")
async def list_models():
    return {
        "models": SUPPORTED_MODELS,
        "default_model": get_default_model(),
    }


@router.post("/default-model")
async def update_default_model(body: DefaultModelBody):
    chosen: str | None = None
    try:
        chosen = set_default_model(body.model)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"default_model": chosen}
