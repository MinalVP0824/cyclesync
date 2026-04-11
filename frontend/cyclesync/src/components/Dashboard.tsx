import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CyclePhase, HealthProfile, PHASE_COLORS } from '@/types';
import { getPhaseDescription } from '@/lib/cycleUtils';
import { motion } from 'motion/react';
import { Calendar as CalendarIcon, Droplets, Zap, Utensils } from 'lucide-react';

interface DashboardProps {
  profile: HealthProfile;
  currentPhase: { phase: CyclePhase; dayInCycle: number };
}

export function Dashboard({ profile, currentPhase }: DashboardProps) {
  const progress = (currentPhase.dayInCycle / profile.averageCycleLength) * 100;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-br from-rose-50 to-orange-50">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-serif text-rose-900">Hello, {profile.name}</CardTitle>
              <Badge variant="outline" className="bg-white/50 border-rose-200 text-rose-700">
                Day {currentPhase.dayInCycle} of {profile.averageCycleLength}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center py-8">
                <div 
                  className="w-48 h-48 rounded-full border-8 flex flex-col items-center justify-center text-center p-4 transition-all duration-1000"
                  style={{ borderColor: PHASE_COLORS[currentPhase.phase], boxShadow: `0 0 20px ${PHASE_COLORS[currentPhase.phase]}22` }}
                >
                  <span className="text-sm uppercase tracking-widest text-gray-500 font-medium">Current Phase</span>
                  <span className="text-3xl font-serif font-bold text-gray-900">{currentPhase.phase}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600 font-medium">
                  <span>Cycle Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2 bg-rose-100" />
              </div>

              <p className="text-center text-gray-600 italic font-serif">
                "{getPhaseDescription(currentPhase.phase)}"
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-rose-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center space-x-2 pb-2">
            <CalendarIcon className="w-5 h-5 text-rose-500" />
            <CardTitle className="text-lg">Next Period</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">
              In {profile.averageCycleLength - currentPhase.dayInCycle + 1} days
            </p>
            <p className="text-sm text-gray-500">Estimated: {new Date(Date.now() + (profile.averageCycleLength - currentPhase.dayInCycle + 1) * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
          </CardContent>
        </Card>

        <Card className="border-rose-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center space-x-2 pb-2">
            <Droplets className="w-5 h-5 text-rose-500" />
            <CardTitle className="text-lg">Health Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.conditions.length > 0 ? (
                profile.conditions.map(c => (
                  <Badge key={c} variant="secondary" className="bg-rose-100 text-rose-700 border-none">
                    {c}
                  </Badge>
                ))
              ) : (
                <span className="text-gray-500">No conditions tracked</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
