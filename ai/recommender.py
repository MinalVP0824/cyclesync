import os
import requests
import json
import re
from dotenv import load_dotenv
from ai.prompts import build_prompt

load_dotenv()

API_KEY = os.getenv("OPENROUTER_API_KEY")

# 🔥 Cache to avoid repeated API calls
cache = {}

def extract_json(text):
    try:
        return json.loads(text)
    except:
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            return json.loads(match.group())
        raise ValueError("Invalid JSON")

def get_recommendations(phase, condition, symptoms, pain_score):
    key = f"{phase}-{condition}-{pain_score}"

    # ✅ Return cached result
    if key in cache:
        return cache[key]

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

        # ✅ Save in cache
        cache[key] = data

        return data

    except Exception as e:
        print("AI ERROR:", e)

        return {
            "workout": "Gentle yoga or stretching",
            "diet": "Warm, nourishing foods",
            "health_tip": "Listen to your body and rest",
            "intensity": "low"
        }