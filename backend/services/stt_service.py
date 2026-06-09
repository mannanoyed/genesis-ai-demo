import os
import tempfile
from pathlib import Path

from openai import OpenAI

_openai_client = None

# Languages this app supports. Whisper will be pinned to these to prevent
# hallucinations (e.g. Korean output) when audio is garbled or mixed.
SUPPORTED_LANGUAGES = {"en", "ar"}

# Whisper sometimes hallucinates non-speech audio as these languages.
# If detected language is not in SUPPORTED_LANGUAGES, we discard the text.
HALLUCINATION_FALLBACK = ""


def get_openai_client() -> OpenAI:
    global _openai_client
    if _openai_client is None:
        _openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return _openai_client


async def transcribe_audio(
    audio_bytes: bytes,
    content_type: str = "audio/webm",
    hint_language: str | None = None,
) -> dict:
    """
    Transcribe audio using OpenAI Whisper API.
    Supports both English and Arabic.

    Args:
        audio_bytes: Raw audio bytes.
        content_type: MIME type of the audio.
        hint_language: UI language hint ('en' or 'ar'). When provided, Whisper
            is pinned to that language to prevent cross-language hallucinations
            that occur when overlapping voices or echo are captured by the mic.
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

    # Normalise hint to a Whisper-accepted language code
    pinned_language = hint_language if hint_language in SUPPORTED_LANGUAGES else None

    # Write to temp file (Whisper API requires a file)
    with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        with open(tmp_path, "rb") as audio_file:
            create_kwargs = {
                "model": "whisper-1",
                "file": audio_file,
                "response_format": "verbose_json",
            }
            # Pin language when we know what to expect; this prevents Whisper
            # from detecting garbled/echo audio as an unrelated language.
            if pinned_language:
                create_kwargs["language"] = pinned_language

            transcript = client.audio.transcriptions.create(**create_kwargs)

        detected_language = getattr(transcript, "language", "en")
        text = transcript.text.strip()

        # Guard: if Whisper detected a language we don't support (e.g. Korean
        # due to overlapping audio / echo), discard the transcription entirely
        # so the app treats it as silence rather than sending garbage to the LLM.
        if detected_language not in SUPPORTED_LANGUAGES:
            return {
                "text": HALLUCINATION_FALLBACK,
                "language": detected_language,
                "confidence": None,
                "discarded": True,
            }

        return {
            "text": text,
            "language": detected_language,
            "confidence": None,
            "discarded": False,
        }
    finally:
        # Clean up temp file
        try:
            Path(tmp_path).unlink()
        except Exception:
            pass
