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
        <Card className="overflow-hidden border-none glass-card bg-gradient-to-br from-rose-50/50 to-orange-50/50 dark:from-rose-900/20 dark:to-orange-900/20">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-display font-black text-rose-900 dark:text-rose-100 tracking-tight">Hello, {profile.name}</CardTitle>
              <Badge variant="outline" className="bg-white/50 dark:bg-black/30 border-rose-200/50 dark:border-rose-700/50 text-rose-700 dark:text-rose-300 backdrop-blur-sm">
                Day {currentPhase.dayInCycle} of {profile.averageCycleLength}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center py-8">
                <div 
                  className="w-48 h-48 rounded-full border-8 flex flex-col items-center justify-center text-center p-4 transition-all duration-1000 glass"
                  style={{ borderColor: PHASE_COLORS[currentPhase.phase], boxShadow: `0 0 30px ${PHASE_COLORS[currentPhase.phase]}44` }}
                >
                  <span className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 font-bold">Current Phase</span>
                  <span className="text-3xl font-display font-black text-gray-900 dark:text-white tracking-tighter">{currentPhase.phase}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider">
                  <span>Cycle Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2 bg-rose-100/50 dark:bg-rose-900/30" />
              </div>

              <p className="text-center text-gray-600 dark:text-gray-400 italic font-serif text-lg">
                "{getPhaseDescription(currentPhase.phase)}"
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-card border-none hover:shadow-xl transition-all duration-500 group">
          <CardHeader className="flex flex-row items-center space-x-2 pb-2">
            <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-500 group-hover:scale-110 transition-transform">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <CardTitle className="text-lg font-display font-bold tracking-tight">Next Period</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display font-black text-gray-900 dark:text-white tracking-tighter">
              In {profile.averageCycleLength - currentPhase.dayInCycle + 1} days
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">Estimated: {new Date(Date.now() + (profile.averageCycleLength - currentPhase.dayInCycle + 1) * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none hover:shadow-xl transition-all duration-500 group">
          <CardHeader className="flex flex-row items-center space-x-2 pb-2">
            <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-500 group-hover:scale-110 transition-transform">
              <Droplets className="w-5 h-5" />
            </div>
            <CardTitle className="text-lg font-display font-bold tracking-tight">Health Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.conditions.length > 0 ? (
                profile.conditions.map(c => (
                  <Badge key={c} variant="secondary" className="bg-rose-100/50 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-none px-3 py-1 font-bold">
                    {c}
                  </Badge>
                ))
              ) : (
                <span className="text-gray-500 dark:text-gray-400 font-medium">No conditions tracked</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
