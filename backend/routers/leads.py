from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional

from database.db import save_lead, get_all_leads

router = APIRouter()


class LeadRequest(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    conversation_id: Optional[str] = None
    vehicle_interest: Optional[str] = None
    intent_score: Optional[str] = "warm"
    conversation_summary: Optional[str] = None
    priorities: Optional[list[str]] = []
    budget_level: Optional[str] = None


@router.post("/lead")
async def capture_lead(request: LeadRequest):
    """Capture a customer lead from the chatbot conversation."""
    try:
        if not request.name or not request.email:
            raise HTTPException(status_code=400, detail="Name and email are required.")

        lead_id = save_lead(
            conversation_id=request.conversation_id or "unknown",
            name=request.name,
            email=request.email,
            phone=request.phone or "",
            vehicle_interest=request.vehicle_interest,
            intent_score=request.intent_score or "warm",
            conversation_summary=request.conversation_summary,
            priorities=request.priorities or [],
            budget_level=request.budget_level,
        )

        return {
            "success": True,
            "lead_id": lead_id,
            "message": f"Thank you, {request.name}. We'll be in touch shortly with personalized recommendations.",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lead capture error: {str(e)}")


@router.get("/leads")
async def list_leads():
    """Get all captured leads (admin endpoint)."""
    try:
        leads = get_all_leads()
        return {"leads": leads, "count": len(leads)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching leads: {str(e)}")
