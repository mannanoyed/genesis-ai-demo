"""
Customer profiling service.
Builds and maintains a customer profile based on conversation signals.
"""
from typing import Optional


DEFAULT_PROFILE = {
    "intent": "browsing",
    "vehicle_preferences": [],
    "priorities": [],
    "budget_level": "mid",
    "recommended_action": "engage",
    "lead_score": "cold",
    "should_capture_lead": False,
    "conversation_insights": "",
    "message_count": 0,
    "lead_captured": False,
}


def merge_profile(existing: dict, update: dict) -> dict:
    """
    Merge a profile update into the existing profile.
    Accumulates vehicle_preferences and priorities (no duplicates).
    Updates other fields if new data is more specific.
    """
    merged = {**existing}

    # Update intent if provided and more specific
    intent_priority = ["browsing", "comparing", "high_interest", "ready_to_buy"]
    new_intent = update.get("intent", "")
    if new_intent in intent_priority:
        existing_idx = intent_priority.index(merged.get("intent", "browsing"))
        new_idx = intent_priority.index(new_intent)
        if new_idx >= existing_idx:
            merged["intent"] = new_intent

    # Accumulate vehicle preferences
    existing_prefs = set(merged.get("vehicle_preferences", []))
    new_prefs = set(update.get("vehicle_preferences", []))
    merged["vehicle_preferences"] = list(existing_prefs | new_prefs)

    # Accumulate priorities
    existing_prio = set(merged.get("priorities", []))
    new_prio = set(update.get("priorities", []))
    merged["priorities"] = list(existing_prio | new_prio)

    # Update budget level
    if update.get("budget_level"):
        merged["budget_level"] = update["budget_level"]

    # Update recommended action
    if update.get("recommended_action"):
        merged["recommended_action"] = update["recommended_action"]

    # Lead score - only escalate, never de-escalate
    score_priority = ["cold", "warm", "hot"]
    new_score = update.get("lead_score", "")
    if new_score in score_priority:
        existing_score_idx = score_priority.index(merged.get("lead_score", "cold"))
        new_score_idx = score_priority.index(new_score)
        if new_score_idx >= existing_score_idx:
            merged["lead_score"] = new_score

    # Update should_capture_lead
    if update.get("should_capture_lead"):
        merged["should_capture_lead"] = True

    # Update insights
    if update.get("conversation_insights"):
        merged["conversation_insights"] = update["conversation_insights"]

    # Increment message count
    merged["message_count"] = merged.get("message_count", 0) + 1

    return merged


def get_recommended_vehicles(profile: dict) -> list[str]:
    """Based on profile priorities and preferences, suggest vehicles."""
    priorities = set(profile.get("priorities", []))
    budget = profile.get("budget_level", "mid")
    preferences = profile.get("vehicle_preferences", [])

    recommendations = []

    if "electric" in priorities:
        if budget == "flagship":
            recommendations.append("Electrified G80")
        else:
            recommendations.extend(["GV60", "Electrified GV70"])

    if "family" in priorities:
        recommendations.append("GV80")

    if "performance" in priorities:
        if budget == "flagship":
            recommendations.append("G90")
        else:
            recommendations.extend(["G70", "GV60 Performance"])

    if "luxury" in priorities or budget == "flagship":
        if "sedan" in str(preferences).lower():
            recommendations.append("G90")
        else:
            recommendations.extend(["GV80", "G90"])

    if budget == "entry":
        recommendations.extend(["G70", "GV70"])
    elif budget == "mid":
        recommendations.extend(["G80", "GV70", "GV80"])

    # Remove duplicates while preserving order
    seen = set()
    unique_recs = []
    for r in recommendations:
        if r not in seen:
            seen.add(r)
            unique_recs.append(r)

    return unique_recs[:3]  # Top 3 recommendations


def get_lead_score_color(score: str) -> str:
    """Return color class for lead score badge."""
    colors = {
        "cold": "blue",
        "warm": "amber",
        "hot": "red",
    }
    return colors.get(score, "gray")
