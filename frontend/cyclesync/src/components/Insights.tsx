import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Recommendation, HealthProfile, CyclePhase } from '@/types';
import { getPersonalizedRecommendations } from '@/lib/api';
import { motion } from 'motion/react';
import { Zap, Utensils, HeartPulse, Loader2 } from 'lucide-react';

interface InsightsProps {
  profile: HealthProfile;
  currentPhase: { phase: CyclePhase; dayInCycle: number };
}

export function Insights({ profile, currentPhase }: InsightsProps) {
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecs() {
      setLoading(true);
      const recs = await getPersonalizedRecommendations(profile, currentPhase.phase, currentPhase.dayInCycle);
      setRecommendation(recs);
      setLoading(false);
    }
    fetchRecs();
  }, [profile, currentPhase]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
        <p className="text-rose-900 font-serif italic">Curating your personalized wellness plan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
      >
        <div className="flex items-center space-x-2 px-2">
          <HeartPulse className="w-6 h-6 text-rose-600" />
          <h2 className="text-2xl font-serif font-bold text-rose-900">Phase Insights</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Card className="border-none shadow-md bg-white">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <CardTitle>Workout: {recommendation?.workout.title}</CardTitle>
              </div>
              <CardDescription>
                Intensity: <Badge variant="outline" className="ml-1">{recommendation?.workout.intensity}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{recommendation?.workout.description}</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-white">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <Utensils className="w-5 h-5 text-emerald-500" />
                <CardTitle>Nutrition: {recommendation?.diet.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-700 leading-relaxed">{recommendation?.diet.description}</p>
              <div className="flex flex-wrap gap-2">
                {recommendation?.diet.foods.map(food => (
                  <Badge key={food} variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100">
                    {food}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-white">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <HeartPulse className="w-5 h-5 text-rose-500" />
                <CardTitle>Health Focus: {recommendation?.health.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{recommendation?.health.description}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8 bg-rose-900 text-white border-none shadow-xl">
          <CardHeader>
            <CardTitle className="font-serif">Why this matters for you</CardTitle>
            <CardDescription className="text-rose-100">
              Tailored for {profile.conditions.join(' & ') || 'your cycle'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm opacity-90 leading-relaxed">
              Cycle syncing helps manage symptoms of {profile.conditions.join(', ') || 'hormonal fluctuations'} by aligning your lifestyle with your biological clock. 
              Small adjustments in movement and nutrition can significantly impact your energy, mood, and long-term hormonal health.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
