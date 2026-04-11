import { GoogleGenAI } from "@google/genai";
import { HealthProfile, Recommendation, RECOMMENDATION_SCHEMA } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function getPersonalizedRecommendations(
  profile: HealthProfile,
  phase: string,
  dayInCycle: number
): Promise<Recommendation> {
  const prompt = `
    User Profile:
    - Name: ${profile.name}
    - Conditions: ${profile.conditions.join(', ') || 'None'}
    - Current Phase: ${phase}
    - Day in Cycle: ${dayInCycle}
    - Average Cycle Length: ${profile.averageCycleLength} days

    Provide personalized wellness recommendations for this user. 
    Focus specifically on how their conditions (${profile.conditions.join(', ') || 'general health'}) interact with the ${phase} phase.
    For example, if they have PCOS, suggest insulin-sensitizing foods or specific low-impact workouts if they are in the luteal phase.
    If they have Endometriosis, focus on anti-inflammatory advice.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: RECOMMENDATION_SCHEMA as any,
        systemInstruction: "You are a specialized women's health expert focusing on hormonal health, PCOS, Endometriosis, and cycle syncing. Provide evidence-based, empathetic, and actionable advice.",
      },
    });

    const data = JSON.parse(response.text || '{}');
    return {
      phase: phase as any,
      ...data
    };
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    // Fallback recommendations
    return {
      phase: phase as any,
      workout: { title: "Gentle Movement", description: "Listen to your body today.", intensity: "Low" },
      diet: { title: "Balanced Nutrition", description: "Focus on whole foods.", foods: ["Leafy greens", "Healthy fats"] },
      health: { title: "Self Care", description: "Prioritize rest and hydration." }
    };
  }
}
