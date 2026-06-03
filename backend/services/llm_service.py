import json
import os
import re
from pathlib import Path
from typing import Optional

from openai import OpenAI

from services.rag_service import retrieve_context

PROMPTS_DIR = Path(__file__).parent.parent / "prompts"
_system_prompt = None
_openai_client = None


def get_openai_client() -> OpenAI:
    global _openai_client
    if _openai_client is None:
        _openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return _openai_client


def get_system_prompt() -> str:
    global _system_prompt
    if _system_prompt is None:
        prompt_file = PROMPTS_DIR / "system_prompt.txt"
        with open(prompt_file, "r") as f:
            _system_prompt = f.read()
    return _system_prompt


def extract_profile_update(response_text: str) -> tuple[str, dict]:
    """Extract the <profile_update> JSON block from the AI response."""
    profile_data = {}
    clean_text = response_text

    pattern = r"<profile_update>(.*?)</profile_update>"
    match = re.search(pattern, response_text, re.DOTALL)

    if match:
        json_str = match.group(1).strip()
        try:
            profile_data = json.loads(json_str)
        except json.JSONDecodeError:
            profile_data = {}
        clean_text = response_text[:match.start()].strip()
        # Also remove any trailing whitespace/newlines before the profile block
        clean_text = re.sub(r"\s+$", "", clean_text)

    return clean_text, profile_data


async def generate_response(
    user_message: str,
    conversation_history: list[dict],
    current_vehicle: Optional[str] = None,
    language: str = "en",
) -> dict:
    """Generate AI response using GPT-4o with RAG context."""
    client = get_openai_client()

    # Retrieve relevant context
    rag_context = retrieve_context(
        query=user_message,
        vehicle_id=current_vehicle,
        n_results=5
    )

    system_prompt = get_system_prompt()

    # Add RAG context to system prompt
    full_system_prompt = f"""{system_prompt}

## RETRIEVED KNOWLEDGE BASE CONTEXT (use this to answer accurately):

{rag_context}

## CURRENT INTERACTION CONTEXT:
- Current vehicle being viewed: {current_vehicle or 'None (general inquiry)'}
- User language: {'Arabic' if language == 'ar' else 'English'}
- {"IMPORTANT: The customer is speaking Arabic. Respond in Arabic. Keep profile_update JSON in English." if language == 'ar' else ""}
"""

    # Build messages
    messages = [{"role": "system", "content": full_system_prompt}]

    # Add conversation history (last 10 turns to keep context manageable)
    for msg in conversation_history[-10:]:
        messages.append({
            "role": msg["role"],
            "content": msg["content"]
        })

    # Add current user message
    messages.append({"role": "user", "content": user_message})

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        temperature=0.7,
        max_tokens=600,
    )

    full_response = response.choices[0].message.content

    # Extract profile update
    clean_response, profile_update = extract_profile_update(full_response)

    return {
        "response": clean_response,
        "profile_update": profile_update,
        "tokens_used": response.usage.total_tokens if response.usage else 0,
    }
