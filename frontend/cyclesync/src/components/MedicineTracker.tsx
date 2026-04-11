import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Medication } from '@/types';
import { Pill, Plus, Trash2, Bell, BellOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';

interface MedicineTrackerProps {
  medications: Medication[];
}

export function MedicineTracker({ medications }: MedicineTrackerProps) {
  const [newName, setNewName] = useState('');
  const [newDosage, setNewDosage] = useState('');
  const [newFrequency, setNewFrequency] = useState('');
  const [newTime, setNewTime] = useState('');

  const addMedication = async () => {
    if (!newName || !auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}/medications`;
    const newMed = {
      name: newName,
      dosage: newDosage,
      frequency: newFrequency,
      reminderTime: newTime,
      active: true,
    };

    try {
      await addDoc(collection(db, path), newMed);
      setNewName('');
      setNewDosage('');
      setNewFrequency('');
      setNewTime('');
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, path);
    }
  };

  const deleteMedication = async (id: string) => {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}/medications/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}/medications/${id}`;
    try {
      await updateDoc(doc(db, path), { active: !currentStatus });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-md bg-white">
        <CardHeader>
          <CardTitle className="font-serif text-2xl text-rose-900 flex items-center gap-2">
            <Pill className="w-6 h-6 text-rose-500" />
            Medicine Tracker
          </CardTitle>
          <CardDescription>Keep track of your supplements and medications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="med-name">Name</Label>
              <Input 
                id="med-name" 
                placeholder="e.g. Inositol" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)}
                className="border-rose-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="med-dosage">Dosage</Label>
              <Input 
                id="med-dosage" 
                placeholder="e.g. 2000mg" 
                value={newDosage} 
                onChange={(e) => setNewDosage(e.target.value)}
                className="border-rose-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="med-freq">Frequency</Label>
              <Input 
                id="med-freq" 
                placeholder="e.g. Twice daily" 
                value={newFrequency} 
                onChange={(e) => setNewFrequency(e.target.value)}
                className="border-rose-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="med-time">Reminder Time (Optional)</Label>
              <Input 
                id="med-time" 
                type="time"
                value={newTime} 
                onChange={(e) => setNewTime(e.target.value)}
                className="border-rose-100"
              />
            </div>
          </div>
          <Button onClick={addMedication} className="w-full bg-rose-500 hover:bg-rose-600 text-white">
            <Plus className="w-4 h-4 mr-2" /> Add Medication
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence>
          {medications.map((med) => (
            <motion.div
              key={med.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Card className={`border-none shadow-sm transition-all ${med.active ? 'bg-white' : 'bg-gray-50 opacity-60'}`}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${med.active ? 'bg-rose-50 text-rose-500' : 'bg-gray-200 text-gray-400'}`}>
                      <Pill className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{med.name}</h3>
                      <p className="text-sm text-gray-500">{med.dosage} • {med.frequency}</p>
                      {med.reminderTime && (
                        <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1 mt-1">
                          <Bell className="w-3 h-3" /> Reminder: {med.reminderTime}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => toggleActive(med.id, med.active)}
                      className={med.active ? 'text-rose-500' : 'text-gray-400'}
                    >
                      {med.active ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => deleteMedication(med.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
        {medications.length === 0 && (
          <div className="text-center py-10 text-gray-400 italic">
            No medications added yet.
          </div>
        )}
      </div>
    </div>
  );
}
