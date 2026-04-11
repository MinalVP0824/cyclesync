import { addDays, differenceInDays, format, isAfter, isBefore, parseISO, startOfDay } from 'date-fns';
import { CyclePhase, HealthProfile } from '../types';

export function calculateCurrentPhase(profile: HealthProfile, date: Date = new Date()): { phase: CyclePhase; dayInCycle: number } {
  const lastPeriod = startOfDay(parseISO(profile.lastPeriodDate));
  const today = startOfDay(date);
  
  let daysSinceLastPeriod = differenceInDays(today, lastPeriod);
  
  // Handle cycles longer than average (simple modulo for now, but in a real app we'd use historical data)
  const cycleLength = profile.averageCycleLength || 28;
  const dayInCycle = ((daysSinceLastPeriod % cycleLength) + cycleLength) % cycleLength + 1;

  // Standard phase calculation (can be adjusted for PCOS/Irregular)
  // Menstrual: Day 1 to periodLength
  // Follicular: Day 1 to Ovulation (usually day 14)
  // Ovulatory: Around Day 14 (Day 13-15)
  // Luteal: Day 16 to end
  
  const periodLength = profile.averagePeriodLength || 5;
  
  if (dayInCycle <= periodLength) {
    return { phase: 'Menstrual', dayInCycle };
  } else if (dayInCycle < 13) {
    return { phase: 'Follicular', dayInCycle };
  } else if (dayInCycle <= 15) {
    return { phase: 'Ovulatory', dayInCycle };
  } else {
    return { phase: 'Luteal', dayInCycle };
  }
}

export function getPhaseDescription(phase: CyclePhase): string {
  switch (phase) {
    case 'Menstrual': return 'Your body is shedding the uterine lining. Energy might be low.';
    case 'Follicular': return 'Estrogen is rising. You might feel more energetic and creative.';
    case 'Ovulatory': return 'Peak fertility. High energy and confidence.';
    case 'Luteal': return 'Progesterone rises. You might feel more inward-focused or experience PMS.';
  }
}
