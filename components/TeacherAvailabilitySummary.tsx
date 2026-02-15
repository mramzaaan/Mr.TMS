
import React from 'react';
import { allDays } from '../types';
import type { WorkloadStats } from './reportUtils';

interface TeacherAvailabilitySummaryProps {
  t: any;
  workloadStats: WorkloadStats;
}

const TeacherAvailabilitySummary: React.FC<TeacherAvailabilitySummaryProps> = ({ t, workloadStats }) => {
  // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  const currentDayIndex = new Date().getDay(); 
  const daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDayName = daysMap[currentDayIndex];

  return (
    <div className="bg-[var(--bg-secondary)] rounded-2xl shadow-sm border border-[var(--border-primary)] overflow-hidden mb-4">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]/30 flex justify-between items-center">
         <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest">{t.workload || 'WORKLOAD'}</h3>
         <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-md leading-none">
            {workloadStats.weeklyPeriods} {t.periods || 'Periods'}
         </span>
      </div>
      
      <div className="p-4">
        {/* Daily Breakdown Grid */}
        <div className="grid grid-cols-6 gap-2 mb-6">
            {allDays.map((day) => {
               const count = workloadStats.dailyCounts[day.toLowerCase()] || 0;
               const isToday = day === currentDayName;
               // Get short name (first 3 chars)
               let shortName = t[day.toLowerCase()];
               if (shortName && shortName.length > 3) shortName = shortName.substring(0, 3);
               
               return (
                  <div 
                    key={day} 
                    className={`flex flex-col items-center justify-center py-2 rounded-lg border transition-all duration-300 ${isToday ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-md scale-110 ring-2 ring-[var(--accent-primary)]/30 z-10' : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] border-[var(--border-secondary)] opacity-80'}`}
                  >
                    <span className={`text-[8px] uppercase font-bold tracking-wider leading-tight mb-0.5 ${isToday ? 'text-white/90' : 'text-[var(--text-secondary)]'}`}>{shortName}</span>
                    <span className="text-sm font-black leading-tight">{count}</span>
                  </div>
               );
            })}
        </div>

        {/* Detailed Stats List (Joint, Subs, Leaves) */}
        <div className="bg-[var(--bg-tertiary)]/30 rounded-xl border border-[var(--border-secondary)] divide-y divide-[var(--border-secondary)]">
            <div className="flex justify-between items-center p-2.5 text-xs">
                <span className="text-[var(--text-secondary)] font-medium">{t.jointPeriods || 'Joint Periods'}</span>
                <span className="font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded min-w-[24px] text-center">{workloadStats.jointPeriodsCount}</span>
            </div>
            <div className="flex justify-between items-center p-2.5 text-xs">
                <span className="text-[var(--text-secondary)] font-medium">{t.substitutionsTaken || 'Substitutions'}</span>
                <span className="font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded min-w-[24px] text-center">+{workloadStats.substitutionsTaken}</span>
            </div>
            <div className="flex justify-between items-center p-2.5 text-xs">
                <span className="text-[var(--text-secondary)] font-medium">{t.leavesTaken || 'Leaves'}</span>
                <span className="font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded min-w-[24px] text-center">{workloadStats.leavesTaken}</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-[var(--bg-tertiary)] text-sm font-black rounded-b-xl">
                <span className="text-[var(--text-primary)]">{t.totalWorkload || 'Total Load'}</span>
                <span className="text-[var(--text-primary)]">{workloadStats.totalWorkload}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherAvailabilitySummary;
