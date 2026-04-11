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
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="font-serif text-2xl text-rose-900">Your Health Profile</CardTitle>
          <CardDescription>Customize CycleSync to your unique body</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input 
              id="name" 
              value={profile.name} 
              onChange={(e) => updateProfile({ name: e.target.value })}
              className="border-rose-100 focus:ring-rose-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cycleLength">Avg Cycle Length (Days)</Label>
              <Input 
                id="cycleLength" 
                type="number" 
                value={profile.averageCycleLength} 
                onChange={(e) => updateProfile({ averageCycleLength: parseInt(e.target.value) || 28 })}
                className="border-rose-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="periodLength">Avg Period Length (Days)</Label>
              <Input 
                id="periodLength" 
                type="number" 
                value={profile.averagePeriodLength} 
                onChange={(e) => updateProfile({ averagePeriodLength: parseInt(e.target.value) || 5 })}
                className="border-rose-100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastPeriod">Last Period Start Date</Label>
            <Input 
              id="lastPeriod" 
              type="date" 
              value={profile.lastPeriodDate.split('T')[0]} 
              onChange={(e) => updateProfile({ lastPeriodDate: new Date(e.target.value).toISOString() })}
              className="border-rose-100"
            />
          </div>

          <div className="space-y-3">
            <Label>Health Conditions</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {conditions.map((condition) => (
                <div 
                  key={condition} 
                  onClick={() => toggleCondition(condition)}
                  className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    profile.conditions.includes(condition) 
                      ? 'bg-rose-50 border-rose-200 text-rose-900' 
                      : 'bg-white border-gray-100 text-gray-600'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    profile.conditions.includes(condition) ? 'bg-rose-500 border-rose-500' : 'border-gray-300'
                  }`}>
                    {profile.conditions.includes(condition) && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                  <span className="font-medium">{condition}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md bg-orange-50/50">
        <CardHeader>
          <CardTitle className="text-lg font-serif text-orange-900">Why we ask for this</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-orange-800 leading-relaxed">
            Conditions like PCOS or Endometriosis can drastically change how your body responds to different phases. 
            By knowing your profile, CycleSync adjusts its AI recommendations to ensure they are safe and effective for your specific needs.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
