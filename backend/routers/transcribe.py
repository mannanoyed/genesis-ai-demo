from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import Optional

from services.stt_service import transcribe_audio

router = APIRouter()


@router.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    language: Optional[str] = Form(default=None),
):
    """
    Transcribe audio to text using OpenAI Whisper.
    Accepts audio/webm, audio/wav, audio/mp3, audio/mp4.
    """
    try:
        # Validate file type
        content_type = audio.content_type or "audio/webm"
        allowed_types = [
            "audio/webm", "audio/wav", "audio/mpeg", "audio/mp3",
            "audio/mp4", "audio/ogg", "video/webm", "application/octet-stream"
        ]

        if content_type not in allowed_types:
            # Be lenient — browser MediaRecorder types vary
            content_type = "audio/webm"

        audio_bytes = await audio.read()

        if len(audio_bytes) < 100:
            raise HTTPException(status_code=400, detail="Audio file too small or empty.")

        result = await transcribe_audio(audio_bytes, content_type)

        return {
            "text": result["text"],
            "language": result["language"],
            "success": True,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription error: {str(e)}")
