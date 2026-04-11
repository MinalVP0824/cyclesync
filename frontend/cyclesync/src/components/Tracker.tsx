import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DailyLog, HealthProfile } from '@/types';
import { format, isSameDay, parseISO } from 'date-fns';
import { motion } from 'motion/react';
import { Plus, Smile, Meh, Frown, Zap, Moon } from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface TrackerProps {
  profile: HealthProfile;
  logs: DailyLog[];
}

export function Tracker({ profile, logs }: TrackerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  const currentLog = logs.find(l => selectedDate && isSameDay(parseISO(l.date), selectedDate));

  const saveLog = async (updates: Partial<DailyLog>) => {
    if (!selectedDate || !auth.currentUser) return;
    const dateStr = selectedDate.toISOString().split('T')[0];
    const path = `users/${auth.currentUser.uid}/logs/${dateStr}`;
    
    const existingLog = logs.find(l => l.date === dateStr);
    const newLog: DailyLog = {
      date: dateStr,
      flow: existingLog?.flow || 'None',
      symptoms: existingLog?.symptoms || [],
      mood: existingLog?.mood || 'Neutral',
      energy: existingLog?.energy || 5,
      ...updates
    };

    try {
      await setDoc(doc(db, path), newLog);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  const toggleSymptom = (symptom: string) => {
    const currentSymptoms = currentLog?.symptoms || [];
    const newSymptoms = currentSymptoms.includes(symptom)
      ? currentSymptoms.filter(s => s !== symptom)
      : [...currentSymptoms, symptom];
    saveLog({ symptoms: newSymptoms });
  };

  const updateMood = (mood: string) => {
    saveLog({ mood });
  };

  const updateEnergy = (level: number) => {
    saveLog({ energy: level * 2 });
  };

  const symptoms = ['Cramps', 'Bloating', 'Headache', 'Acne', 'Backache', 'Tiredness', 'Cravings'];
  const moods = [
    { label: 'Happy', icon: <Smile className="w-5 h-5" /> },
    { label: 'Neutral', icon: <Meh className="w-5 h-5" /> },
    { label: 'Sad', icon: <Frown className="w-5 h-5" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none glass-card overflow-hidden">
          <CardHeader className="bg-rose-50/50 dark:bg-rose-900/20 pb-4">
            <CardTitle className="font-display font-black text-rose-900 dark:text-rose-100 tracking-tight">Cycle Calendar</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="p-4"
              modifiers={{
                period: (date) => logs.some(l => isSameDay(parseISO(l.date), date) && l.flow !== 'None')
              }}
              modifiersStyles={{
                period: { backgroundColor: '#f43f5e', color: 'white', fontWeight: 'bold', borderRadius: '50%' }
              }}
            />
          </CardContent>
        </Card>

        <Card className="border-none glass-card">
          <CardHeader>
            <CardTitle className="font-display font-black text-rose-900 dark:text-rose-100 tracking-tight">
              {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Mood</Label>
              <div className="flex gap-4">
                {moods.map(m => (
                  <button
                    key={m.label}
                    onClick={() => updateMood(m.label)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all duration-300 ${
                      currentLog?.mood === m.label 
                        ? 'bg-rose-500 text-white scale-110 shadow-lg' 
                        : 'glass-button text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {m.icon}
                    <span className="text-[10px] font-black uppercase tracking-tighter">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Symptoms</Label>
              <div className="flex flex-wrap gap-2">
                {symptoms.map(s => (
                  <Badge
                    key={s}
                    variant={currentLog?.symptoms.includes(s) ? 'default' : 'outline'}
                    className={`cursor-pointer transition-all px-4 py-1.5 rounded-full font-bold text-xs ${
                      currentLog?.symptoms.includes(s) 
                        ? 'bg-rose-500 hover:bg-rose-600 border-none shadow-md' 
                        : 'glass-button border-none text-rose-700 dark:text-rose-300'
                    }`}
                    onClick={() => toggleSymptom(s)}
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Energy Level</Label>
              <div className="flex items-center justify-between glass p-4 rounded-3xl">
                <Moon className="w-5 h-5 text-gray-400" />
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(level => (
                    <button
                      key={level}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 font-bold ${
                        (currentLog?.energy || 0) >= level * 2 
                          ? 'bg-rose-500 text-white shadow-md' 
                          : 'glass-button border-none text-gray-400'
                      }`}
                      onClick={() => updateEnergy(level)}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <Zap className="w-5 h-5 text-amber-500" />
              </div>
            </div>

            <div className="pt-4">
              <Button className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-2xl py-6 font-black tracking-tight glass-button border-none shadow-lg">
                Save Daily Log
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none glass-card">
        <CardHeader>
          <CardTitle className="font-display font-black text-rose-900 dark:text-rose-100 tracking-tight">History</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {logs.sort((a, b) => b.date.localeCompare(a.date)).map((log) => (
                <div key={log.date} className="flex items-start gap-4 p-4 rounded-3xl glass hover:shadow-lg transition-all duration-500 group">
                  <div className="bg-rose-500 p-3 rounded-2xl text-white font-black text-center min-w-[60px] shadow-sm group-hover:scale-105 transition-transform">
                    <p className="text-[10px] uppercase tracking-widest">{format(parseISO(log.date), 'MMM')}</p>
                    <p className="text-xl tracking-tighter">{format(parseISO(log.date), 'dd')}</p>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary" className="bg-rose-100/50 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-none font-black text-[10px] uppercase tracking-wider">
                        {log.mood}
                      </Badge>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">Energy: {log.energy}/10</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {log.symptoms.map(s => (
                        <span key={s} className="text-[10px] text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-full font-bold">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <p className="text-center text-gray-400 italic py-10">No history logs yet.</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

import { Label } from '@/components/ui/label';
