"""LLM client — direct multi-provider implementation via httpx.

Single async `chat()` function that:
  * accepts messages in OpenAI-style format
  * normalises provider/model identifiers (e.g. "openai/gpt-5", "google/gemini-2.5-pro")
  * supports a prompt-based structured-output mode (json_schema)
  * routes to OpenAI, Anthropic, or Google Gemini based on the provider prefix
"""

from __future__ import annotations

import json
import logging
import os
import re
import uuid
from typing import Any

import httpx

logger = logging.getLogger(__name__)

SUPPORTED_MODELS: list[dict[str, str]] = [
    {"id": "openai/gpt-4o",                           "label": "GPT-4o (OpenAI)",                     "provider": "openai"},
    {"id": "openai/gpt-4o-mini",                      "label": "GPT-4o mini (OpenAI · fast)",         "provider": "openai"},
    {"id": "openai/gpt-4-turbo",                      "label": "GPT-4 Turbo (OpenAI)",                "provider": "openai"},
    {"id": "anthropic/claude-sonnet-4-6",             "label": "Claude Sonnet 4.6 (Anthropic)",       "provider": "anthropic"},
    {"id": "anthropic/claude-haiku-4-5-20251001",     "label": "Claude Haiku 4.5 (Anthropic · fast)", "provider": "anthropic"},
    {"id": "gemini/gemini-1.5-pro",                   "label": "Gemini 1.5 Pro (Google)",             "provider": "gemini"},
    {"id": "gemini/gemini-1.5-flash",                 "label": "Gemini 1.5 Flash (Google · fast)",    "provider": "gemini"},
]

_SUPPORTED_IDS = {m["id"] for m in SUPPORTED_MODELS}

_PROVIDER_ALIASES = {"google": "gemini"}


def _normalise_model(model_id: str) -> str:
    if not model_id or "/" not in model_id:
        return model_id
    provider, name = model_id.split("/", 1)
    provider = _PROVIDER_ALIASES.get(provider.strip().lower(), provider.strip().lower())
    return f"{provider}/{name.strip()}"


def _initial_default() -> str:
    env_default = os.environ.get("DEFAULT_LLM_MODEL", "openai/gpt-4o-mini")
    normalised = _normalise_model(env_default) if env_default else "openai/gpt-4o-mini"
    return normalised if normalised in _SUPPORTED_IDS else "openai/gpt-4o-mini"


_state: dict[str, Any] = {"default_model": _initial_default()}


def get_default_model() -> str:
    return _state["default_model"]


def set_default_model(model_id: str) -> str:
    normalised = _normalise_model(model_id)
    if normalised not in _SUPPORTED_IDS:
        raise ValueError(f"Unsupported model: {model_id}")
    _state["default_model"] = normalised
    logger.info("Default LLM model updated to %s", normalised)
    return normalised


def _split(model_id: str) -> tuple[str, str]:
    provider, name = _normalise_model(model_id).split("/", 1)
    return provider, name


_JSON_FENCE_RE = re.compile(r"```(?:json)?\s*(.*?)\s*```", re.DOTALL | re.IGNORECASE)


def _extract_json(text: str) -> dict | None:
    if not text:
        return None
    candidates: list[str] = []
    fence = _JSON_FENCE_RE.search(text)
    if fence:
        candidates.append(fence.group(1))
    first, last = text.find("{"), text.rfind("}")
    if first != -1 and last != -1 and last > first:
        candidates.append(text[first : last + 1])
    for cand in candidates:
        try:
            return json.loads(cand)
        except json.JSONDecodeError:
            continue
    return None


def _build_openai_messages(messages: list[dict]) -> list[dict]:
    return [{"role": m.get("role", "user"), "content": m.get("content", "")} for m in messages]


async def _call_openai(model_name: str, messages: list[dict], max_tokens: int | None) -> str:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set")
    payload: dict[str, Any] = {
        "model": model_name,
        "messages": _build_openai_messages(messages),
    }
    if max_tokens:
        payload["max_tokens"] = max_tokens
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json=payload,
        )
        resp.raise_for_status()
        data = resp.json()
    return data["choices"][0]["message"]["content"]


async def _call_anthropic(model_name: str, messages: list[dict], max_tokens: int | None) -> str:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is not set")
    system_parts = [m["content"] for m in messages if m.get("role") == "system"]
    chat_messages = [m for m in messages if m.get("role") != "system"]
    payload: dict[str, Any] = {
        "model": model_name,
        "max_tokens": max_tokens or 4096,
        "messages": [{"role": m.get("role", "user"), "content": m.get("content", "")} for m in chat_messages],
    }
    if system_parts:
        payload["system"] = "\n\n".join(system_parts)
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        resp.raise_for_status()
        data = resp.json()
    return data["content"][0]["text"]


async def _call_gemini(model_name: str, messages: list[dict], max_tokens: int | None) -> str:
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not set")
    contents = []
    for m in messages:
        role = m.get("role", "user")
        if role == "system":
            role = "user"
        elif role == "assistant":
            role = "model"
        contents.append({"role": role, "parts": [{"text": m.get("content", "")}]})
    payload: dict[str, Any] = {"contents": contents}
    if max_tokens:
        payload["generationConfig"] = {"maxOutputTokens": max_tokens}
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(url, headers={"Content-Type": "application/json"}, json=payload)
        resp.raise_for_status()
        data = resp.json()
    return data["candidates"][0]["content"]["parts"][0]["text"]


async def chat(
    messages: list[dict[str, str]],
    model: str | None = None,
    json_schema: dict | None = None,
    session_id: str | None = None,
    max_tokens: int | None = None,
) -> dict:
    """Send a chat request to the configured LLM provider.

    Returns {"content": str, "json": dict | None, "model": str, "session_id": str}
    """
    chosen_model = _normalise_model(model) if model else get_default_model()
    if chosen_model not in _SUPPORTED_IDS:
        logger.warning("Model %s not in whitelist, falling back to default", chosen_model)
        chosen_model = get_default_model()

    provider, model_name = _split(chosen_model)
    sid = session_id or f"engage360-{uuid.uuid4()}"

    if json_schema is not None:
        schema_text = json.dumps(json_schema, indent=2)
        augmented = list(messages)
        last_user = next((i for i in reversed(range(len(augmented))) if augmented[i].get("role") == "user"), None)
        instruction = (
            "\n\nReturn ONLY a JSON object that conforms to the following JSON schema. "
            "Do not include any explanation, commentary, or markdown — only the JSON object.\n\n"
            f"Schema:\n{schema_text}"
        )
        if last_user is not None:
            augmented[last_user] = {**augmented[last_user], "content": augmented[last_user].get("content", "") + instruction}
        else:
            augmented.append({"role": "user", "content": instruction})
        messages = augmented

    try:
        if provider == "openai":
            content = await _call_openai(model_name, messages, max_tokens)
        elif provider == "anthropic":
            content = await _call_anthropic(model_name, messages, max_tokens)
        elif provider == "gemini":
            content = await _call_gemini(model_name, messages, max_tokens)
        else:
            raise RuntimeError(f"Unknown provider: {provider}")
    except Exception as exc:
        logger.exception("LLM call failed (model=%s)", chosen_model)
        raise RuntimeError(f"LLM call failed: {exc}") from exc

    parsed_json = _extract_json(content) if json_schema is not None else None

    return {
        "content": content,
        "json": parsed_json,
        "model": chosen_model,
        "session_id": sid,
    }
