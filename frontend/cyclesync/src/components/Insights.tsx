import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Recommendation, HealthProfile, CyclePhase } from '@/types';
import { getPersonalizedRecommendations } from '@/lib/gemini';
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
        <p className="text-rose-900 dark:text-rose-100 font-display font-bold italic">Curating your personalized wellness plan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="flex items-center space-x-2 px-2">
          <div className="p-2 rounded-xl bg-rose-500 text-white shadow-lg">
            <HeartPulse className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-display font-black text-rose-900 dark:text-rose-100 tracking-tight">Phase Insights</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Card className="border-none glass-card hover:shadow-xl transition-all duration-500 group">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-500 group-hover:scale-110 transition-transform">
                  <Zap className="w-5 h-5" />
                </div>
                <CardTitle className="font-display font-bold tracking-tight">Workout: {recommendation?.workout.title}</CardTitle>
              </div>
              <CardDescription className="dark:text-gray-400 font-medium">
                Intensity: <Badge variant="outline" className="ml-1 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold">{recommendation?.workout.intensity}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-medium">{recommendation?.workout.description}</p>
            </CardContent>
          </Card>

          <Card className="border-none glass-card hover:shadow-xl transition-all duration-500 group">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-500 group-hover:scale-110 transition-transform">
                  <Utensils className="w-5 h-5" />
                </div>
                <CardTitle className="font-display font-bold tracking-tight">Nutrition: {recommendation?.diet.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-medium">{recommendation?.diet.description}</p>
              <div className="flex flex-wrap gap-2">
                {recommendation?.diet.foods.map(food => (
                  <Badge key={food} variant="secondary" className="bg-emerald-100/50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-none px-3 py-1 font-bold">
                    {food}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none glass-card hover:shadow-xl transition-all duration-500 group">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-500 group-hover:scale-110 transition-transform">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <CardTitle className="font-display font-bold tracking-tight">Health Focus: {recommendation?.health.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-medium">{recommendation?.health.description}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8 bg-rose-600 dark:bg-rose-900 text-white border-none shadow-2xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-1000" />
          <CardHeader>
            <CardTitle className="font-display font-black text-xl tracking-tight">Why this matters for you</CardTitle>
            <CardDescription className="text-rose-100 font-medium">
              Tailored for {profile.conditions.join(' & ') || 'your cycle'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm opacity-90 leading-relaxed font-medium">
              Cycle syncing helps manage symptoms of {profile.conditions.join(', ') || 'hormonal fluctuations'} by aligning your lifestyle with your biological clock. 
              Small adjustments in movement and nutrition can significantly impact your energy, mood, and long-term hormonal health.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
