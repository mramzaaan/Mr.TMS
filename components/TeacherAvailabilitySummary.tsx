
import React from 'react';
import { allDays } from '../types';
import type { WorkloadStats } from './reportUtils';

interface TeacherAvailabilitySummaryProps {
  t: any;
  workloadStats: WorkloadStats;
}

const TeacherAvailabilitySummary: React.FC<TeacherAvailabilitySummaryProps> = ({ t, workloadStats }) => {
  return (
    <div className="bg-[var(--bg-secondary)] p-4 rounded-xl shadow-sm border border-[var(--border-primary)]">
      <div className="flex justify-between items-center mb-4">
         <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wide">{t.workload}</h3>
         <span className="text-[10px] font-bold bg-[var(--accent-secondary)] text-[var(--accent-primary)] px-2 py-1 rounded-md leading-none">
            {workloadStats.weeklyPeriods} {t.periods}
         </span>
      </div>
      
      <div className="grid grid-cols-3 gap-2 mb-4">
        {allDays.map((day) => {
           const count = workloadStats.dailyCounts[day.toLowerCase()] || 0;
           let shortName = t[day.toLowerCase()];
           if (shortName && shortName.length > 3) shortName = shortName.substring(0, 3);
           
           return (
              <div key={day} className="flex flex-col items-center justify-center py-2 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-secondary)]">
                <span className="text-[9px] text-[var(--text-secondary)] uppercase font-bold tracking-wider leading-tight">{shortName}</span>
                <span className={`text-base font-black leading-tight ${count > 0 ? 'text-[var(--text-primary)]' : 'text-[var(--text-placeholder)]'}`}>{count}</span>
              </div>
           );
        })}
      </div>

      <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-[var(--text-secondary)] font-medium">{t.jointPeriods}</span>
            <span className="font-bold text-blue-700 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded min-w-[20px] text-center">{workloadStats.jointPeriodsCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[var(--text-secondary)] font-medium">{t.substitutionsTaken}</span>
            <span className="font-bold text-green-700 bg-green-50 dark:bg-green-900/30 dark:text-green-300 px-2 py-0.5 rounded min-w-[20px] text-center">+{workloadStats.substitutionsTaken}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[var(--text-secondary)] font-medium">{t.leavesTaken}</span>
            <span className="font-bold text-red-700 bg-red-50 dark:bg-red-900/30 dark:text-red-300 px-2 py-0.5 rounded min-w-[20px] text-center">{workloadStats.leavesTaken > 0 ? `-${workloadStats.leavesTaken}` : 0}</span>
          </div>
          
          <div className="pt-2 mt-2 border-t border-[var(--border-secondary)] flex justify-between items-center">
              <span className="text-sm font-bold text-[var(--text-primary)]">{t.totalWorkload}</span>
              <span className="text-sm font-black text-[var(--text-primary)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded">{workloadStats.totalWorkload}</span>
          </div>
      </div>
    </div>
  );
};

export default TeacherAvailabilitySummary;
