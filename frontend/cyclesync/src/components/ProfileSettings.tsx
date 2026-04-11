import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { HealthProfile } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { auth, db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface ProfileSettingsProps {
  profile: HealthProfile;
}

export function ProfileSettings({ profile }: ProfileSettingsProps) {
  const conditions: HealthProfile['conditions'] = ['PCOS', 'PCOD', 'Endometriosis', 'Irregular Cycles'];

  const updateProfile = async (updates: Partial<HealthProfile>) => {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}`;
    try {
      await updateDoc(doc(db, path), updates);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  };

  const toggleCondition = (condition: typeof conditions[number]) => {
    const newConditions = profile.conditions.includes(condition)
      ? profile.conditions.filter(c => c !== condition)
      : [...profile.conditions, condition];
    updateProfile({ conditions: newConditions });
  };

  return (
    <div className="space-y-6">
      <Card className="border-none glass-card">
        <CardHeader>
          <CardTitle className="font-display font-black text-2xl text-rose-900 dark:text-rose-100 tracking-tight">Your Health Profile</CardTitle>
          <CardDescription className="dark:text-gray-400 font-medium">Customize CycleSync to your unique body</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Name</Label>
            <Input 
              id="name" 
              value={profile.name} 
              onChange={(e) => updateProfile({ name: e.target.value })}
              className="glass border-none focus:ring-rose-500 rounded-xl font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cycleLength" className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Avg Cycle Length (Days)</Label>
              <Input 
                id="cycleLength" 
                type="number" 
                value={profile.averageCycleLength} 
                onChange={(e) => updateProfile({ averageCycleLength: parseInt(e.target.value) || 28 })}
                className="glass border-none focus:ring-rose-500 rounded-xl font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="periodLength" className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Avg Period Length (Days)</Label>
              <Input 
                id="periodLength" 
                type="number" 
                value={profile.averagePeriodLength} 
                onChange={(e) => updateProfile({ averagePeriodLength: parseInt(e.target.value) || 5 })}
                className="glass border-none focus:ring-rose-500 rounded-xl font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastPeriod" className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Last Period Start Date</Label>
            <Input 
              id="lastPeriod" 
              type="date" 
              value={profile.lastPeriodDate.split('T')[0]} 
              onChange={(e) => updateProfile({ lastPeriodDate: new Date(e.target.value).toISOString() })}
              className="glass border-none focus:ring-rose-500 rounded-xl font-medium"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Health Conditions</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {conditions.map((condition) => (
                <div 
                  key={condition} 
                  onClick={() => toggleCondition(condition)}
                  className={`flex items-center space-x-3 p-4 rounded-2xl border-none cursor-pointer transition-all duration-300 ${
                    profile.conditions.includes(condition) 
                      ? 'bg-rose-500 text-white shadow-lg scale-[1.02]' 
                      : 'glass hover:bg-white/50 dark:hover:bg-black/20 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    profile.conditions.includes(condition) ? 'bg-white border-white' : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {profile.conditions.includes(condition) && <div className="w-2 h-2 bg-rose-500 rounded-full" />}
                  </div>
                  <span className="font-bold tracking-tight">{condition}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none bg-orange-500 dark:bg-orange-900 text-white shadow-2xl overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-1000" />
        <CardHeader>
          <CardTitle className="text-xl font-display font-black tracking-tight">Why we ask for this</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm opacity-90 leading-relaxed font-medium">
            Conditions like PCOS or Endometriosis can drastically change how your body responds to different phases. 
            By knowing your profile, CycleSync adjusts its AI recommendations to ensure they are safe and effective for your specific needs.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
