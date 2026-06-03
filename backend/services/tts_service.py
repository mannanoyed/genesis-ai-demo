import os
import httpx
from typing import AsyncGenerator

from openai import AsyncOpenAI

TTS_PROVIDER = os.getenv("TTS_PROVIDER", "openai")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")  # Rachel voice

_async_openai_client = None


def get_async_openai_client() -> AsyncOpenAI:
    global _async_openai_client
    if _async_openai_client is None:
        _async_openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return _async_openai_client


async def synthesize_speech_openai(text: str, language: str = "en") -> AsyncGenerator[bytes, None]:
    """Generate speech using OpenAI TTS API with streaming."""
    client = get_async_openai_client()

    # Choose voice based on language - onyx is warm and authoritative
    voice = "onyx"  # Deep, premium, authoritative voice

    async with client.audio.speech.with_streaming_response.create(
        model="tts-1-hd",
        voice=voice,
        input=text,
        response_format="mp3",
    ) as response:
        async for chunk in response.iter_bytes(chunk_size=4096):
            yield chunk


async def synthesize_speech_elevenlabs(text: str, language: str = "en") -> AsyncGenerator[bytes, None]:
    """Generate speech using ElevenLabs API with streaming."""
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}/stream"

    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
    }

    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75,
            "style": 0.3,
            "use_speaker_boost": True,
        }
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        async with client.stream("POST", url, headers=headers, json=payload) as response:
            response.raise_for_status()
            async for chunk in response.aiter_bytes(chunk_size=4096):
                yield chunk


async def synthesize_speech(text: str, language: str = "en") -> AsyncGenerator[bytes, None]:
    """Main TTS function that routes to the configured provider."""
    provider = TTS_PROVIDER

    if provider == "elevenlabs" and ELEVENLABS_API_KEY:
        async for chunk in synthesize_speech_elevenlabs(text, language):
            yield chunk
    else:
        # Default to OpenAI TTS
        async for chunk in synthesize_speech_openai(text, language):
            yield chunk
