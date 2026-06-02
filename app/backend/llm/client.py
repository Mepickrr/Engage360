"""LLM client wrapper around emergentintegrations.

Single async `chat()` function that:
  * accepts messages in OpenAI-style format
  * normalises provider/model identifiers (e.g. "openai/gpt-5", "google/gemini-2.5-pro")
  * supports a prompt-based structured-output mode (json_schema)
  * is the only place the rest of the backend touches the LLM SDK
"""

from __future__ import annotations

import json
import logging
import os
import re
import uuid
from typing import Any

from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)


# --- Supported models (text chat) ---
# We surface a tight whitelist in /api/llm/models. The set was chosen from the
# emergentintegrations universal-key catalogue and matches the IDs used by the
# library's .with_model(provider, model_id) call.
SUPPORTED_MODELS: list[dict[str, str]] = [
    {"id": "openai/gpt-5",                            "label": "GPT-5 (OpenAI)",                      "provider": "openai"},
    {"id": "openai/gpt-5.4",                          "label": "GPT-5.4 (OpenAI · recommended)",      "provider": "openai"},
    {"id": "openai/gpt-5-mini",                       "label": "GPT-5 mini (OpenAI · fast)",          "provider": "openai"},
    {"id": "anthropic/claude-sonnet-4-5-20250929",    "label": "Claude Sonnet 4.5 (Anthropic)",       "provider": "anthropic"},
    {"id": "anthropic/claude-sonnet-4-6",             "label": "Claude Sonnet 4.6 (Anthropic)",       "provider": "anthropic"},
    {"id": "gemini/gemini-2.5-pro",                   "label": "Gemini 2.5 Pro (Google)",             "provider": "gemini"},
    {"id": "gemini/gemini-3.1-pro-preview",           "label": "Gemini 3.1 Pro (Google · preview)",   "provider": "gemini"},
]

_SUPPORTED_IDS = {m["id"] for m in SUPPORTED_MODELS}

# Accept "google/..." as an alias for "gemini/..." (user spec mentioned google/...).
_PROVIDER_ALIASES = {"google": "gemini"}


# --- Runtime-mutable default model ---
def _initial_default() -> str:
    env_default = os.environ.get("DEFAULT_LLM_MODEL", "openai/gpt-5-mini")
    return _normalise_model(env_default) if env_default else "openai/gpt-5-mini"


def _normalise_model(model_id: str) -> str:
    """Normalise provider aliases and lowercase. Does NOT validate membership."""
    if not model_id or "/" not in model_id:
        return model_id
    provider, name = model_id.split("/", 1)
    provider = _PROVIDER_ALIASES.get(provider.strip().lower(), provider.strip().lower())
    return f"{provider}/{name.strip()}"


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


# --- Core chat function ---
def _split(model_id: str) -> tuple[str, str]:
    provider, name = _normalise_model(model_id).split("/", 1)
    return provider, name


def _flatten_history(messages: list[dict[str, str]]) -> tuple[str, str]:
    """Produce (system_message, user_text) from an OpenAI-style messages list.

    The emergentintegrations LlmChat takes a single system_message at construction
    time and one UserMessage per turn — it does not expose a multi-turn history
    API publicly. So we collapse the prior turns into a single contextual prompt
    that we feed as the user_message. This keeps the wrapper provider-agnostic.
    """
    system_parts: list[str] = []
    history_parts: list[str] = []
    latest_user: str | None = None

    for msg in messages:
        role = (msg.get("role") or "").lower()
        content = (msg.get("content") or "").strip()
        if not content:
            continue
        if role == "system":
            system_parts.append(content)
        elif role == "user":
            # Buffer earlier user turns into history; keep the last one as latest.
            if latest_user is not None:
                history_parts.append(f"User: {latest_user}")
            latest_user = content
        elif role == "assistant":
            history_parts.append(f"Assistant: {content}")

    if latest_user is None:
        latest_user = "Continue."

    system_message = "\n\n".join(system_parts) if system_parts else "You are a helpful assistant."

    if history_parts:
        user_text = (
            "Prior conversation (most recent last):\n"
            + "\n".join(history_parts)
            + "\n\nLatest user message:\n"
            + latest_user
        )
    else:
        user_text = latest_user

    return system_message, user_text


_JSON_FENCE_RE = re.compile(r"```(?:json)?\s*(.*?)\s*```", re.DOTALL | re.IGNORECASE)


def _extract_json(text: str) -> dict | None:
    """Best-effort JSON extraction from an LLM response.

    Strategy:
      1. Try to find a fenced ```json block.
      2. Otherwise locate the first '{' / last '}' and parse.
      3. On failure return None.
    """
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


async def chat(
    messages: list[dict[str, str]],
    model: str | None = None,
    json_schema: dict | None = None,
    session_id: str | None = None,
    max_tokens: int | None = None,
) -> dict:
    """Send a chat request to the configured LLM provider.

    Parameters
    ----------
    messages   OpenAI-style messages list.
    model      Optional provider/model override, e.g. "anthropic/claude-sonnet-4-6".
    json_schema  Optional schema dict — when present, the user message is annotated
                 to instruct strict JSON output and the response is parsed.
    session_id   Optional stable session id (forwarded to LlmChat).
    max_tokens   Optional cap.

    Returns
    -------
    {"content": str, "json": dict | None, "model": str, "session_id": str}
    """
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise RuntimeError("EMERGENT_LLM_KEY is not configured")

    chosen_model = _normalise_model(model) if model else get_default_model()
    if chosen_model not in _SUPPORTED_IDS:
        # Fall back to default rather than erroring out — keep UX resilient.
        logger.warning("Model %s not in whitelist, falling back to default", chosen_model)
        chosen_model = get_default_model()

    provider, model_name = _split(chosen_model)
    system_message, user_text = _flatten_history(messages)

    if json_schema is not None:
        schema_text = json.dumps(json_schema, indent=2)
        user_text = (
            user_text
            + "\n\nReturn ONLY a JSON object that conforms to the following JSON schema. "
            + "Do not include any explanation, commentary, or markdown — only the JSON object.\n\n"
            + "Schema:\n"
            + schema_text
        )

    sid = session_id or f"engage360-{uuid.uuid4()}"

    client = LlmChat(
        api_key=api_key,
        session_id=sid,
        system_message=system_message,
    ).with_model(provider, model_name)

    if max_tokens is not None:
        try:
            client = client.with_max_tokens(max_tokens)  # type: ignore[attr-defined]
        except Exception:
            # Older versions don't expose this — safe to ignore.
            pass

    try:
        raw = await client.send_message(UserMessage(text=user_text))
    except Exception as exc:  # surface a clean error upstream
        logger.exception("LLM call failed (model=%s)", chosen_model)
        raise RuntimeError(f"LLM call failed: {exc}") from exc

    # emergentintegrations returns a string for most providers; be permissive.
    content: str = ""
    if isinstance(raw, str):
        content = raw
    elif isinstance(raw, dict):
        content = raw.get("content") or raw.get("text") or json.dumps(raw)
    else:
        content = str(raw)

    parsed_json = _extract_json(content) if json_schema is not None else None

    return {
        "content": content,
        "json": parsed_json,
        "model": chosen_model,
        "session_id": sid,
    }
