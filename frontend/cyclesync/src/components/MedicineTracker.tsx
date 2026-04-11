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
      <Card className="border-none glass-card">
        <CardHeader>
          <CardTitle className="font-display font-black text-2xl text-rose-900 dark:text-rose-100 flex items-center gap-2 tracking-tight">
            <div className="p-2 rounded-xl bg-rose-500 text-white shadow-lg">
              <Pill className="w-6 h-6" />
            </div>
            Medicine Tracker
          </CardTitle>
          <CardDescription className="dark:text-gray-400 font-medium">Keep track of your supplements and medications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="med-name" className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Name</Label>
              <Input 
                id="med-name" 
                placeholder="e.g. Inositol" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)}
                className="glass border-none focus:ring-rose-500 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="med-dosage" className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Dosage</Label>
              <Input 
                id="med-dosage" 
                placeholder="e.g. 2000mg" 
                value={newDosage} 
                onChange={(e) => setNewDosage(e.target.value)}
                className="glass border-none focus:ring-rose-500 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="med-freq" className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Frequency</Label>
              <Input 
                id="med-freq" 
                placeholder="e.g. Twice daily" 
                value={newFrequency} 
                onChange={(e) => setNewFrequency(e.target.value)}
                className="glass border-none focus:ring-rose-500 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="med-time" className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Reminder Time (Optional)</Label>
              <Input 
                id="med-time" 
                type="time"
                value={newTime} 
                onChange={(e) => setNewTime(e.target.value)}
                className="glass border-none focus:ring-rose-500 rounded-xl"
              />
            </div>
          </div>
          <Button onClick={addMedication} className="w-full bg-rose-600 hover:bg-rose-700 text-white py-6 rounded-2xl font-black tracking-tight glass-button border-none shadow-lg">
            <Plus className="w-5 h-5 mr-2" /> Add Medication
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3">
        <AnimatePresence>
          {medications.map((med) => (
            <motion.div
              key={med.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <Card className={`border-none glass-card transition-all duration-500 group ${med.active ? '' : 'opacity-40 grayscale'}`}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl transition-all duration-500 ${med.active ? 'bg-rose-500 text-white shadow-lg group-hover:scale-110' : 'bg-gray-200 dark:bg-gray-800 text-gray-400'}`}>
                      <Pill className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-black text-gray-900 dark:text-white tracking-tight">{med.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">{med.dosage} • {med.frequency}</p>
                      {med.reminderTime && (
                        <p className="text-[10px] text-rose-500 dark:text-rose-400 font-black flex items-center gap-1 mt-1 uppercase tracking-widest">
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
                      className={`rounded-xl transition-all duration-300 ${med.active ? 'text-rose-500 bg-rose-50/50 dark:bg-rose-900/20' : 'text-gray-400'}`}
                    >
                      {med.active ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => deleteMedication(med.id)}
                      className="rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-900/20 transition-all duration-300"
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
          <div className="text-center py-10 text-gray-400 dark:text-gray-500 italic font-medium">
            No medications added yet.
          </div>
        )}
      </div>
    </div>
  );
}
