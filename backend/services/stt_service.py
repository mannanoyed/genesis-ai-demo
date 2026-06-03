import os
import tempfile
from pathlib import Path

from openai import OpenAI

_openai_client = None


def get_openai_client() -> OpenAI:
    global _openai_client
    if _openai_client is None:
        _openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return _openai_client


async def transcribe_audio(audio_bytes: bytes, content_type: str = "audio/webm") -> dict:
    """
    Transcribe audio using OpenAI Whisper API.
    Supports both English and Arabic.
    """
    client = get_openai_client()

    # Determine file extension from content type
    ext_map = {
        "audio/webm": "webm",
        "audio/wav": "wav",
        "audio/mpeg": "mp3",
        "audio/mp4": "mp4",
        "audio/ogg": "ogg",
        "video/webm": "webm",
    }
    ext = ext_map.get(content_type, "webm")

    # Write to temp file (Whisper API requires a file)
    with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        with open(tmp_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="verbose_json",
            )

        # Detect language
        detected_language = getattr(transcript, "language", "en")

        return {
            "text": transcript.text.strip(),
            "language": detected_language,
            "confidence": None,  # Whisper doesn't expose per-word confidence in basic API
        }
    finally:
        # Clean up temp file
        try:
            Path(tmp_path).unlink()
        except Exception:
            pass
