from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional

from services.tts_service import synthesize_speech

router = APIRouter()


class TTSRequest(BaseModel):
    text: str
    language: Optional[str] = "en"


@router.post("/tts")
async def text_to_speech(request: TTSRequest):
    """
    Convert text to speech and stream the audio.
    Returns streaming MP3 audio.
    """
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    # Trim very long texts to avoid excessive TTS costs in demo
    text = request.text.strip()
    if len(text) > 1000:
        text = text[:1000] + "..."

    try:
        async def audio_generator():
            async for chunk in synthesize_speech(text, request.language or "en"):
                yield chunk

        return StreamingResponse(
            audio_generator(),
            media_type="audio/mpeg",
            headers={
                "Cache-Control": "no-cache",
                "X-Content-Type-Options": "nosniff",
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS error: {str(e)}")
