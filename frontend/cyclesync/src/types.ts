import { Type } from "@google/genai";

export type CyclePhase = 'Menstrual' | 'Follicular' | 'Ovulatory' | 'Luteal';

export interface HealthProfile {
  name: string;
  averageCycleLength: number;
  averagePeriodLength: number;
  conditions: ('PCOS' | 'PCOD' | 'Endometriosis' | 'Irregular Cycles')[];
  lastPeriodDate: string; // ISO string
}

export interface DailyLog {
  date: string; // ISO string (YYYY-MM-DD)
  flow: 'None' | 'Light' | 'Medium' | 'Heavy';
  symptoms: string[];
  mood: string;
  energy: number; // 1-10
}

export interface Recommendation {
  phase: CyclePhase;
  workout: {
    title: string;
    description: string;
    intensity: 'Low' | 'Medium' | 'High';
  };
  diet: {
    title: string;
    description: string;
    foods: string[];
  };
  health: {
    title: string;
    description: string;
  };
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  reminderTime?: string;
  active: boolean;
}

export interface ForumPost {
  id: string;
  authorId: string;
  authorName: string; // Anonymous name like "CycleWarrior123"
  content: string;
  timestamp: string;
  likes: number;
  tags: string[];
}

export const PHASE_COLORS: Record<CyclePhase, string> = {
  Menstrual: '#ef4444', // Red
  Follicular: '#10b981', // Green
  Ovulatory: '#f59e0b', // Amber
  Luteal: '#6366f1', // Indigo
};

export const RECOMMENDATION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    workout: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        intensity: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
      },
      required: ['title', 'description', 'intensity'],
    },
    diet: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        foods: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['title', 'description', 'foods'],
    },
    health: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
      },
      required: ['title', 'description'],
    },
  },
  required: ['workout', 'diet', 'health'],
};
