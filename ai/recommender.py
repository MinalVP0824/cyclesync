import os
import requests
import json
import re
from dotenv import load_dotenv
from ai.prompts import build_prompt

load_dotenv()

API_KEY = os.getenv("OPENROUTER_API_KEY")

# Cache to avoid repeated API calls
cache = {}

FALLBACK = {
    "workout": "Gentle yoga or stretching",
    "diet": "Warm, nourishing foods",
    "health_tip": "Listen to your body and rest",
    "intensity": "low"
}


def extract_json(text: str) -> dict:
    try:
        return json.loads(text)
    except Exception:
        text = re.sub(r"```(?:json)?", "", text).strip()
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            return json.loads(match.group())
        raise ValueError("Could not extract valid JSON from response")


def get_recommendations(phase: str, condition: str, symptoms: list, pain_score: int) -> dict:
    key = f"{phase}-{condition}-{pain_score}"

    # Return cached result if available
    if key in cache:
        return cache[key]

    if not API_KEY:
        print("⚠️  OPENROUTER_API_KEY not set — returning fallback")
        return FALLBACK

    prompt = build_prompt(phase, condition, symptoms, pain_score)

    try:
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "openai/gpt-3.5-turbo",
                "messages": [
                    {"role": "user", "content": prompt}
                ]
            }
        )

        result = response.json()
        content = result["choices"][0]["message"]["content"]
        data = extract_json(content)

        # Enforce pain rules defensively
        if pain_score >= 4:
            data["intensity"] = "low"

        # Cache and return
        cache[key] = data
        return data

    except Exception as e:
        print("AI ERROR:", e)
        return FALLBACK