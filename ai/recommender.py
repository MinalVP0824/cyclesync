import os
import json
import re
from dotenv import load_dotenv
from google import genai
from ai.prompts import build_prompt

load_dotenv()

# ── Cache: same key structure as original (phase-condition-pain_score) ─────────
cache = {}

# ── Fallback identical to original ────────────────────────────────────────────
FALLBACK = {
    "workout": "Gentle yoga or stretching",
    "diet": "Warm, nourishing foods",
    "health_tip": "Listen to your body and rest",
    "intensity": "low"
}


def extract_json(text: str) -> dict:
    """
    Robust JSON extractor — handles clean JSON and responses with stray text.
    Same approach as original extract_json(), keeps behaviour identical.
    """
    try:
        return json.loads(text)
    except Exception:
        # Strip markdown fences if model ignored instructions
        text = re.sub(r"```(?:json)?", "", text).strip()
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            return json.loads(match.group())
        raise ValueError("Could not extract valid JSON from Gemini response")


def get_recommendations(phase: str, condition: str, symptoms: list, pain_score: int) -> dict:
    """
    Drop-in replacement for the original OpenRouter/GPT-3.5 version.

    Changes from original:
      - Removed: requests.post to openrouter.ai
      - Removed: OPENROUTER_API_KEY env var
      - Added:   google.genai client with GEMINI_API_KEY
      - Model:   gemini-1.5-flash  (fast, free-tier eligible)
      - Everything else — cache key, prompt, fallback, extract_json — unchanged
    """
    key = f"{phase}-{condition}-{pain_score}"

    # Return cached result if available
    if key in cache:
        return cache[key]

    api_key = os.getenv("GEMINI_API_KEY", "")

    # If no valid key is set, return fallback immediately (safe for local dev)
    if not api_key or api_key == "your_gemini_api_key_here":
        print("⚠️  GEMINI_API_KEY not set — returning fallback recommendations")
        return FALLBACK

    prompt = build_prompt(phase, condition, symptoms, pain_score)

    try:
        client = genai.Client(api_key=api_key)

        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt,
        )

        content = response.text

        data = extract_json(content)

        # Enforce pain rules defensively (same intent as original prompt rules)
        if pain_score >= 4:
            data["intensity"] = "low"

        # Cache and return
        cache[key] = data
        return data

    except Exception as e:
        print("AI ERROR:", e)
        return FALLBACK