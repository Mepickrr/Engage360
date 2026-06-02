"""Pydantic models for Engage 360 Phase 1."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


# --- Common ---
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# --- Agents ---
class Agent(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    name: str
    title: str
    domain: str
    color: str
    avatar_initials: str
    bio: str
    suggested_prompts: list[str]
    signals_monitored: list[str] = Field(default_factory=list)


# --- Store stats ---
class StatMetric(BaseModel):
    value: float
    currency: Optional[str] = None
    delta_pct: float
    period: str


class StoreStats(BaseModel):
    revenue: StatMetric
    total_orders: StatMetric
    unique_users: StatMetric
    active_flows: StatMetric


# --- Intelligence cards ---
Urgency = Literal["critical", "opportunity", "insight"]


class IntelligenceStat(BaseModel):
    label: str
    value: str


class IntelligenceCard(BaseModel):
    id: str
    agent_id: str
    urgency: Urgency
    headline: str
    stats: list[IntelligenceStat]
    cta_primary: str
    cta_secondary: str
    generated_at: str
    collaboration_badge: Optional[str] = None
    status_bar: Optional[Literal["green", "amber", "red"]] = None


# --- Reports ---
class Report(BaseModel):
    id: str
    title: str
    agent_id: str
    findings: list[str]
    actions: list[str]
    last_generated_at: str
    cadence: str


# --- Tasks ---
TaskStatus = Literal["awaiting", "ongoing", "scheduled", "completed"]
TaskOrigin = Literal["seller", "agent", "instruction"]


class TaskStep(BaseModel):
    id: str
    label: str
    status: Literal["done", "active", "pending"] = "pending"
    timestamp: Optional[str] = None


class TaskImpact(BaseModel):
    estimated_reach: Optional[int] = None
    estimated_revenue: Optional[int] = None
    estimated_revenue_currency: Optional[str] = "INR"


class Task(BaseModel):
    id: str
    title: str
    agent_id: str
    origin: TaskOrigin
    status: TaskStatus
    summary: Optional[str] = None
    impact_meta: Optional[TaskImpact] = None
    schedule: Optional[str] = None
    progress_pct: Optional[int] = None
    progress_label: Optional[str] = None
    outcome_text: Optional[str] = None
    step_progress: list[TaskStep] = Field(default_factory=list)
    conversation_id: Optional[str] = None
    artefact: Optional[dict] = None
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


# --- Conversations & Messages ---
MessageRole = Literal["user", "agent", "system"]


class Artefact(BaseModel):
    type: Literal["flow_brief", "segment_preview", "creative_preview"]
    payload: dict


class Collaboration(BaseModel):
    agents: list[str]


class Message(BaseModel):
    id: str
    conversation_id: str
    role: MessageRole
    agent_id: Optional[str] = None
    content: str
    artefact: Optional[Artefact] = None
    collaboration: Optional[Collaboration] = None
    created_at: str = Field(default_factory=now_iso)


class Conversation(BaseModel):
    id: str
    title: str
    pinned_agent: Optional[str] = None
    source: str = "ask_ai"
    agents_involved: list[str] = Field(default_factory=list)
    last_message_preview: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


class CreateConversationRequest(BaseModel):
    seed_message: Optional[str] = None
    pinned_agent: Optional[str] = None
    source: Optional[str] = "ask_ai"


class SendMessageRequest(BaseModel):
    content: str
    pinned_agent: Optional[str] = None


class SendMessageResponse(BaseModel):
    messages: list[Message]
    routing: dict


# --- LLM admin ---
class LLMModelInfo(BaseModel):
    id: str
    label: str
    provider: str


class LLMModelsResponse(BaseModel):
    models: list[LLMModelInfo]
    default_model: str


class DefaultModelRequest(BaseModel):
    model: str


# --- Suggestions ---
class AskAiSuggestion(BaseModel):
    id: str
    label: str
    agent_id: str
