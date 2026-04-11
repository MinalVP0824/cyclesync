/**
 * api.ts — replaces gemini.ts
 * All AI calls now go through the FastAPI backend instead of calling Gemini directly.
 * Drop-in replacement: same function signatures, same return types.
 */

import { HealthProfile, Recommendation, DailyLog, CyclePhase } from "../types";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ── Field mapping helpers ──────────────────────────────────────────────────────

// Frontend uses string[] conditions, backend uses a single string
function mapCondition(conditions: HealthProfile["conditions"]): string {
  if (!conditions || conditions.length === 0) return "none";
  const map: Record<string, string> = {
    "PCOS": "pcos",
    "PCOD": "pcod",
    "Endometriosis": "endometriosis",
    "Irregular Cycles": "irregular",
  };
  return map[conditions[0]] ?? "none";
}

// Frontend flow: 'None'|'Light'|'Medium'|'Heavy' → backend flow_heaviness: 1-5 | null
function mapFlow(flow: DailyLog["flow"]): number | null {
  const map: Record<string, number | null> = {
    None: null,
    Light: 1,
    Medium: 3,
    Heavy: 5,
  };
  return map[flow] ?? null;
}

// Frontend energy: 1-10 → backend energy: 1-5
function mapEnergy(energy: number): number {
  return Math.max(1, Math.min(5, Math.round(energy / 2)));
}

// Backend returns flat strings, frontend expects structured Recommendation object
function mapBackendToRecommendation(
  data: { workout: string; diet: string; health_tip: string; intensity: string },
  phase: string
): Recommendation {
  const intensityMap: Record<string, "Low" | "Medium" | "High"> = {
    low: "Low",
    medium: "Medium",
    high: "High",
  };

  // Split the flat strings into title + description for the frontend UI
  const workoutParts = data.workout.split(" — ");
  const dietParts = data.diet.split(" — ");

  return {
    phase: phase as CyclePhase,
    workout: {
      title: workoutParts.length > 1 ? workoutParts[0] : "Workout",
      description: workoutParts.length > 1 ? workoutParts[1] : data.workout,
      intensity: intensityMap[data.intensity?.toLowerCase()] ?? "Low",
    },
    diet: {
      title: dietParts.length > 1 ? dietParts[0] : "Nutrition",
      description: dietParts.length > 1 ? dietParts[1] : data.diet,
      foods: data.diet
        .replace(/^[^:]+:\s*/, "")
        .split(/,|and/)
        .map((f) => f.trim())
        .filter((f) => f.length > 0)
        .slice(0, 5),
    },
    health: {
      title: "Health Tip",
      description: data.health_tip,
    },
  };
}

// ── Fallback (same as original gemini.ts) ─────────────────────────────────────

function fallbackRecommendation(phase: string): Recommendation {
  return {
    phase: phase as CyclePhase,
    workout: {
      title: "Gentle Movement",
      description: "Listen to your body today.",
      intensity: "Low",
    },
    diet: {
      title: "Balanced Nutrition",
      description: "Focus on whole foods.",
      foods: ["Leafy greens", "Healthy fats"],
    },
    health: {
      title: "Self Care",
      description: "Prioritize rest and hydration.",
    },
  };
}

// ── User management ───────────────────────────────────────────────────────────

export async function createBackendUser(
  profile: HealthProfile
): Promise<number | null> {
  try {
    const res = await fetch(`${BASE_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: profile.name,
        cycle_length: profile.averageCycleLength || null,
        condition: mapCondition(profile.conditions),
        last_period_date: profile.lastPeriodDate
          ? profile.lastPeriodDate.split("T")[0]
          : null,
        goal: "general_health",
      }),
    });
    const data = await res.json();
    return data.id ?? null;
  } catch (err) {
    console.error("Failed to create backend user:", err);
    return null;
  }
}

// ── Save daily log ─────────────────────────────────────────────────────────────

export async function saveBackendLog(
  userId: number,
  log: DailyLog
): Promise<void> {
  try {
    await fetch(`${BASE_URL}/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        log_date: log.date,
        energy: mapEnergy(log.energy),
        pain_score: 2, // frontend doesn't collect pain yet — default to 2
        sleep_quality: 3, // frontend doesn't collect sleep yet — default to 3
        flow_heaviness: mapFlow(log.flow),
        symptoms: log.symptoms.join(","),
        mood: log.mood,
      }),
    });
  } catch (err) {
    console.error("Failed to save log to backend:", err);
  }
}

// ── Get phase from backend ─────────────────────────────────────────────────────

export async function getBackendPhase(
  userId: number
): Promise<{ phase: string; confidence: string; explanation: string } | null> {
  try {
    const res = await fetch(`${BASE_URL}/phase/${userId}`);
    return await res.json();
  } catch (err) {
    console.error("Failed to get phase from backend:", err);
    return null;
  }
}

// ── Main function: drop-in replacement for getPersonalizedRecommendations ─────
// Same signature as gemini.ts so Insights.tsx needs only one import change.

export async function getPersonalizedRecommendations(
  profile: HealthProfile,
  phase: string,
  dayInCycle: number
): Promise<Recommendation> {
  try {
    const condition = mapCondition(profile.conditions);
    const symptoms = []; // Insights doesn't pass symptoms directly — backend uses latest log

    const res = await fetch(`${BASE_URL}/recommendations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: 1, // Replace with real user_id from Firebase/Firestore once bridged
        phase: phase.toLowerCase(),
        condition,
        symptoms,
        pain_score: 2, // default until pain logging is added to tracker
      }),
    });

    if (!res.ok) throw new Error(`Backend returned ${res.status}`);

    const data = await res.json();
    return mapBackendToRecommendation(data, phase);
  } catch (err) {
    console.error("Error fetching recommendations from backend:", err);
    return fallbackRecommendation(phase);
  }
}