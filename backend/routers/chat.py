from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import uuid

from services.llm_service import generate_response
from services.profile_service import merge_profile, DEFAULT_PROFILE
from database.db import upsert_conversation

router = APIRouter()

# In-memory session store (fine for demo)
_sessions: dict[str, dict] = {}


class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    conversation_history: Optional[list[Message]] = []
    current_vehicle: Optional[str] = None
    language: Optional[str] = "en"


class ChatResponse(BaseModel):
    response: str
    conversation_id: str
    profile_update: dict
    current_profile: dict


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Main chat endpoint — processes user message and returns AI response."""
    try:
        # Generate or use existing conversation ID
        conversation_id = request.conversation_id or str(uuid.uuid4())

        # Get or initialize session profile
        if conversation_id not in _sessions:
            _sessions[conversation_id] = {**DEFAULT_PROFILE}

        current_profile = _sessions[conversation_id]

        # Build conversation history for context
        history = [
            {"role": msg.role, "content": msg.content}
            for msg in (request.conversation_history or [])
        ]

        # Generate AI response
        result = await generate_response(
            user_message=request.message,
            conversation_history=history,
            current_vehicle=request.current_vehicle,
            language=request.language or "en",
        )

        # Merge profile update
        if result.get("profile_update"):
            updated_profile = merge_profile(current_profile, result["profile_update"])
            _sessions[conversation_id] = updated_profile
        else:
            updated_profile = current_profile
            updated_profile["message_count"] = updated_profile.get("message_count", 0) + 1

        # Persist to DB
        upsert_conversation(
            conversation_id=conversation_id,
            vehicle_context=request.current_vehicle,
            profile_data=updated_profile,
        )

        return ChatResponse(
            response=result["response"],
            conversation_id=conversation_id,
            profile_update=result.get("profile_update", {}),
            current_profile=updated_profile,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")


@router.get("/chat/session/{conversation_id}")
async def get_session(conversation_id: str):
    """Get the current session profile for a conversation."""
    profile = _sessions.get(conversation_id, {**DEFAULT_PROFILE})
    return {"conversation_id": conversation_id, "profile": profile}
