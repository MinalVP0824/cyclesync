/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dashboard } from './components/Dashboard';
import { Insights } from './components/Insights';
import { Tracker } from './components/Tracker';
import { ProfileSettings } from './components/ProfileSettings';
import { MedicineTracker } from './components/MedicineTracker';
import { Forum } from './components/Forum';
import { HealthProfile, DailyLog, Medication } from '@/types';
import { calculateCurrentPhase } from '@/lib/cycleUtils';
import { LayoutDashboard, Calendar, Sparkles, User, Heart, Pill, MessageSquare, LogIn, LogOut, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, setDoc, collection, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';

const DEFAULT_PROFILE: HealthProfile = {
  name: 'User',
  averageCycleLength: 28,
  averagePeriodLength: 5,
  conditions: ['Irregular Cycles'],
  lastPeriodDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
};

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [profile, setProfile] = useState<HealthProfile>(DEFAULT_PROFILE);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Theme effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Profile Listener
  useEffect(() => {
    if (!user) return;
    const path = `users/${user.uid}`;
    const unsubscribe = onSnapshot(doc(db, path), (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data() as HealthProfile);
      } else {
        // Initialize profile if it doesn't exist
        const initialProfile = { ...DEFAULT_PROFILE, name: user.displayName || 'User' };
        setDoc(doc(db, path), initialProfile).catch(e => handleFirestoreError(e, OperationType.WRITE, path));
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, path));
    return () => unsubscribe();
  }, [user]);

  // Logs Listener
  useEffect(() => {
    if (!user) return;
    const path = `users/${user.uid}/logs`;
    const q = query(collection(db, path), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLogs = snapshot.docs.map(doc => doc.data() as DailyLog);
      setLogs(fetchedLogs);
    }, (error) => handleFirestoreError(error, OperationType.LIST, path));
    return () => unsubscribe();
  }, [user]);

  // Medications Listener
  useEffect(() => {
    if (!user) return;
    const path = `users/${user.uid}/medications`;
    const unsubscribe = onSnapshot(collection(db, path), (snapshot) => {
      const fetchedMeds = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Medication));
      setMedications(fetchedMeds);
    }, (error) => handleFirestoreError(error, OperationType.LIST, path));
    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = () => signOut(auth);

  const currentPhase = calculateCurrentPhase(profile);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9] dark:bg-[#121212]">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }} 
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-12 h-12 bg-rose-500 rounded-xl flex items-center justify-center shadow-lg"
        >
          <Heart className="text-white w-6 h-6 fill-current" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-orange-50 dark:from-rose-950 dark:via-black dark:to-orange-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-rose-500 rounded-3xl flex items-center justify-center shadow-xl mb-8">
          <Heart className="text-white w-10 h-10 fill-current" />
        </div>
        <h1 className="text-4xl font-display font-black text-rose-900 dark:text-rose-100 mb-4 tracking-tighter">CycleSync</h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8 leading-relaxed">
          Your personalized companion for hormonal health, cycle tracking, and wellness insights.
        </p>
        <Button 
          onClick={handleLogin} 
          className="bg-rose-600 hover:bg-rose-700 text-white px-8 py-6 rounded-2xl text-lg font-bold shadow-lg flex items-center gap-3 glass-button border-none"
        >
          <LogIn className="w-5 h-5" /> Sign in with Google
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-orange-50 dark:from-rose-950 dark:via-black dark:to-orange-950 text-gray-900 dark:text-gray-100 font-sans pb-24 transition-colors duration-500">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center shadow-sm">
            <Heart className="text-white w-5 h-5 fill-current" />
          </div>
          <h1 className="text-xl font-display font-black text-rose-900 dark:text-rose-100 tracking-tighter">CycleSync</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-xl glass-button text-gray-500 dark:text-gray-400"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <Badge variant="outline" className="bg-rose-50/50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200/50 dark:border-rose-700/50 backdrop-blur-sm">
            {currentPhase.phase} Phase
          </Badge>
          <button onClick={handleLogout} className="text-gray-400 hover:text-rose-600 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <AnimatePresence mode="wait">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="dashboard">
              <Dashboard profile={profile} currentPhase={currentPhase} />
            </TabsContent>
            
            <TabsContent value="tracker">
              <Tracker profile={profile} logs={logs} />
            </TabsContent>

            <TabsContent value="insights">
              <Insights profile={profile} currentPhase={currentPhase} />
            </TabsContent>

            <TabsContent value="medicine">
              <MedicineTracker medications={medications} />
            </TabsContent>

            <TabsContent value="forum">
              <Forum />
            </TabsContent>

            <TabsContent value="profile">
              <ProfileSettings profile={profile} />
            </TabsContent>
          </Tabs>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-white/20 px-4 py-3 pb-8 md:pb-3 flex justify-around items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] overflow-x-auto">
        <NavButton 
          active={activeTab === 'dashboard'} 
          onClick={() => setActiveTab('dashboard')} 
          icon={<LayoutDashboard />} 
          label="Home" 
        />
        <NavButton 
          active={activeTab === 'tracker'} 
          onClick={() => setActiveTab('tracker')} 
          icon={<Calendar />} 
          label="Track" 
        />
        <NavButton 
          active={activeTab === 'insights'} 
          onClick={() => setActiveTab('insights')} 
          icon={<Sparkles />} 
          label="Insights" 
        />
        <NavButton 
          active={activeTab === 'medicine'} 
          onClick={() => setActiveTab('medicine')} 
          icon={<Pill />} 
          label="Meds" 
        />
        <NavButton 
          active={activeTab === 'forum'} 
          onClick={() => setActiveTab('forum')} 
          icon={<MessageSquare />} 
          label="Forum" 
        />
        <NavButton 
          active={activeTab === 'profile'} 
          onClick={() => setActiveTab('profile')} 
          icon={<User />} 
          label="Profile" 
        />
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center space-y-1 transition-all duration-300 ${
        active ? 'text-rose-600 dark:text-rose-400 scale-110' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
      }`}
    >
      <div className={`p-2 rounded-xl transition-colors ${active ? 'bg-rose-50/50 dark:bg-rose-900/30 backdrop-blur-sm' : ''}`}>
        {React.cloneElement(icon as React.ReactElement, { size: 20 })}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}
