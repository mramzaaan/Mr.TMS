
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { Language, SchoolClass, Subject, Teacher, Adjustment, TimetableGridData, SchoolConfig, LeaveDetails, TimetableSession, DownloadDesignConfig, Period } from '../types';
import { generateUniqueId, allDays } from '../types';
import PrintPreview from './PrintPreview';
import { generateAdjustmentsReportHtml, generateAdjustmentsExcel } from './reportUtils';
import NoSessionPlaceholder from './NoSessionPlaceholder';

declare const html2canvas: any;

interface AlternativeTimetablePageProps {
  t: any;
  language: Language;
  classes: SchoolClass[];
  subjects: Subject[];
  teachers: Teacher[];
  adjustments: Record<string, Adjustment[]>;
  leaveDetails?: Record<string, Record<string, LeaveDetails>>;
  onSetAdjustments: (date: string, adjustments: Adjustment[]) => void;
  onSetLeaveDetails: (date: string, leaveDetails: Record<string, LeaveDetails>) => void;
  onUpdateSession: (updater: (session: TimetableSession) => TimetableSession) => void;
  schoolConfig: SchoolConfig;
  onUpdateSchoolConfig: (newConfig: Partial<SchoolConfig>) => void;
  selection: { date: string; teacherIds: string[] };
  onSelectionChange: React.Dispatch<React.SetStateAction<{ date: string; teacherIds: string[] }>>;
  openConfirmation: (title: string, message: React.ReactNode, onConfirm: () => void) => void;
  hasActiveSession: boolean;
}

// Icons
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const PrintIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2v4h10z" /></svg>;
const ShareIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

export const AlternativeTimetablePage: React.FC<AlternativeTimetablePageProps> = ({
  t, language, classes, subjects, teachers, adjustments, leaveDetails,
  onSetAdjustments, onSetLeaveDetails, onUpdateSession,
  schoolConfig, onUpdateSchoolConfig, selection, onSelectionChange,
  openConfirmation, hasActiveSession
}) => {
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [isGeneratingSlip, setIsGeneratingSlip] = useState(false);

  if (!hasActiveSession) {
    return <NoSessionPlaceholder t={t} />;
  }

  const selectedDate = selection.date;
  const currentDateAdjustments = adjustments[selectedDate] || [];
  const currentLeaveDetails: Record<string, LeaveDetails> = leaveDetails?.[selectedDate] || {};

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSelectionChange(prev => ({ ...prev, date: e.target.value }));
  };

  const handleLeaveToggle = (teacherId: string, type: 'full' | 'half' | null) => {
    const newLeaveDetails = { ...currentLeaveDetails };
    
    if (type === null) {
        delete newLeaveDetails[teacherId];
        // Also remove any adjustments where this teacher is the ORIGINAL teacher
        const newAdjustments = currentDateAdjustments.filter(adj => adj.originalTeacherId !== teacherId);
        onSetAdjustments(selectedDate, newAdjustments);
    } else {
        newLeaveDetails[teacherId] = {
            leaveType: type,
            startPeriod: type === 'half' ? 5 : 1, // Default half day starts at period 5
            periods: type === 'half' ? [] : undefined,
            reason: 'Leave'
        };
    }
    onSetLeaveDetails(selectedDate, newLeaveDetails);
  };

  const handleSubstitutionChange = (adjustmentId: string | null, periodIndex: number, classId: string, subjectId: string, originalTeacherId: string, substituteTeacherId: string) => {
      let newAdjustments = [...currentDateAdjustments];
      
      if (substituteTeacherId === '') {
          // Remove adjustment
          if (adjustmentId) {
              newAdjustments = newAdjustments.filter(a => a.id !== adjustmentId);
          }
      } else {
          // Add or Update
          const newAdj: Adjustment = {
              id: adjustmentId || generateUniqueId(),
              classId,
              subjectId,
              originalTeacherId,
              substituteTeacherId,
              day: new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' }) as keyof TimetableGridData,
              periodIndex
          };

          // Check conflict
          const dayName = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' }) as keyof TimetableGridData;
          let conflictDetails = undefined;
          
          // Check if substitute is teaching another class at this time
          const substituteClass = classes.find(c => 
              c.timetable[dayName]?.[periodIndex]?.some(p => p.teacherId === substituteTeacherId)
          );

          if (substituteClass) {
              conflictDetails = {
                  classNameEn: substituteClass.nameEn,
                  classNameUr: substituteClass.nameUr
              };
              newAdj.conflictDetails = conflictDetails;
          }

          if (adjustmentId) {
              newAdjustments = newAdjustments.map(a => a.id === adjustmentId ? newAdj : a);
          } else {
              newAdjustments.push(newAdj);
          }
      }
      onSetAdjustments(selectedDate, newAdjustments);
  };

  const generateSlip = async (adjustment: Adjustment) => {
      setIsGeneratingSlip(true);
      const dayName = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' }) as keyof TimetableGridData;
      
      // Data preparation
      const subTeacher = teachers.find(t => t.id === adjustment.substituteTeacherId);
      const origTeacher = teachers.find(t => t.id === adjustment.originalTeacherId);
      const schoolClass = classes.find(c => c.id === adjustment.classId);
      const subject = subjects.find(s => s.id === adjustment.subjectId);
      
      // Time calc
      const timings = schoolConfig.periodTimings?.[dayName === 'Friday' ? 'friday' : 'default'] || [];
      const periodTime = timings[adjustment.periodIndex];
      const timeStr = periodTime ? `${periodTime.start} - ${periodTime.end}` : 'N/A';

      // Props for HTML generation
      const messageLanguage = language;
      const isUrdu = messageLanguage === 'ur';
      const dir = isUrdu ? 'rtl' : 'ltr';
      const fontFamily = isUrdu ? "'Noto Nastaliq Urdu', serif" : "'Roboto', sans-serif";
      
      const greeting = isUrdu ? 'اسلام علیکم' : 'Assalam-o-Alaikum';
      const respectfulName = subTeacher ? (isUrdu ? subTeacher.nameUr : subTeacher.nameEn) : 'Teacher';
      const schoolName = isUrdu ? schoolConfig.schoolNameUr : schoolConfig.schoolNameEn;
      const dateStr = new Date(selectedDate).toLocaleDateString(isUrdu ? 'ur-PK' : 'en-GB');
      const roomNum = schoolClass?.roomNumber || '-';
      const className = schoolClass ? (isUrdu ? schoolClass.nameUr : schoolClass.nameEn) : '-';
      const subjName = subject ? (isUrdu ? subject.nameUr : subject.nameEn) : '-';
      const origName = origTeacher ? (isUrdu ? origTeacher.nameUr : origTeacher.nameEn) : '-';

      let conflictHtml = '';
      if (adjustment.conflictDetails) {
          const conflictClass = isUrdu ? adjustment.conflictDetails.classNameUr : adjustment.conflictDetails.classNameEn;
          conflictHtml = `
            <div style="background: #fee2e2; border: 2px solid #ef4444; padding: 20px; text-align: center; margin-top: 30px;">
                <div style="font-weight: 900; color: #b91c1c; font-size: 24px; text-transform: uppercase;">${isUrdu ? 'تصادم کی وارننگ' : 'CONFLICT WARNING'}</div>
                <div style="color: #991b1b; font-size: 18px; margin-top: 5px;">${isUrdu ? 'آپ کی پہلے سے کلاس ہے:' : 'You have a scheduled class with:'} <strong>${conflictClass}</strong></div>
            </div>
          `;
      }

      const htmlContent = `
        <div class="slip-container" style="width: 1200px; background: white; font-family: ${fontFamily}; border-radius: 0; overflow: hidden; direction: ${dir}; border: 4px solid #4f46e5;">
          <style>
             @import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=block');
             * { text-rendering: geometricPrecision; -webkit-font-smoothing: antialiased; }
          </style>
          <div style="height: 24px; background: linear-gradient(90deg, #6366f1, #a855f7, #ec4899);"></div>
          
          <div style="padding: 60px; text-align: center;">
             <div style="font-size: 40px; color: #4b5563; font-weight: 600; margin-bottom: 12px;">${greeting}</div>
             <div style="font-size: 64px; color: #111827; font-weight: 800; line-height: 1.2; margin-bottom: 8px;">${respectfulName}</div>
             <div style="font-size: 24px; color: #6b7280; font-weight: 500;">${schoolName}</div>
          </div>
          
          <div style="padding: 0 60px 60px 60px;">
             <div style="background: #f3f4f6; padding: 40px; border: 2px solid #d1d5db;">
                <div style="text-align: center; border-bottom: 3px dashed #d1d5db; padding-bottom: 30px; margin-bottom: 30px;">
                    <div style="font-size: 24px; color: #6b7280; font-weight: bold; text-transform: uppercase; letter-spacing: 4px; margin-bottom: 5px;">${isUrdu ? 'تاریخ' : 'DATE'}</div>
                    <div style="font-size: 64px; color: #111827; font-weight: 900; letter-spacing: -1px;">${dateStr}</div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;">
                    <div style="background: white; border: 2px solid #e5e7eb; padding: 25px 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px;">
                        <span style="font-size: 18px; color: #6b7280; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">${isUrdu ? 'پیریڈ' : 'PERIOD'}</span>
                        <span style="font-size: 64px; font-weight: 900; color: #4f46e5; line-height: 1;">${adjustment.periodIndex + 1}</span>
                    </div>
                    <div style="background: white; border: 2px solid #e5e7eb; padding: 25px 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px;">
                        <span style="font-size: 18px; color: #6b7280; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">${isUrdu ? 'وقت' : 'TIME'}</span>
                        <span style="font-size: 42px; font-weight: 900; color: #059669; line-height: 1; white-space: nowrap;">${timeStr}</span>
                    </div>
                    <div style="background: white; border: 2px solid #e5e7eb; padding: 25px 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px;">
                        <span style="font-size: 18px; color: #6b7280; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">${isUrdu ? 'کمرہ' : 'ROOM'}</span>
                        <span style="font-size: 64px; font-weight: 900; color: #ea580c; line-height: 1;">${roomNum}</span>
                    </div>
                </div>

                <div style="margin-top: 30px; display: grid; grid-template-columns: 1fr; gap: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; background: white; padding: 30px; border: 2px solid #e5e7eb;">
                        <div>
                            <div style="font-size: 18px; color: #6b7280; font-weight: bold; text-transform: uppercase;">${isUrdu ? 'کلاس' : 'CLASS'}</div>
                            <div style="font-size: 40px; font-weight: 900; color: #111827;">${className}</div>
                        </div>
                        <div style="text-align: ${isUrdu ? 'left' : 'right'};">
                             <div style="font-size: 18px; color: #6b7280; font-weight: bold; text-transform: uppercase;">${isUrdu ? 'مضمون' : 'SUBJECT'}</div>
                            <div style="font-size: 40px; font-weight: 900; color: #4f46e5;">${subjName}</div>
                        </div>
                    </div>
                </div>

                ${conflictHtml}

                <div style="margin-top: 30px; text-align: center; border-top: 3px dashed #d1d5db; padding-top: 30px;">
                    <div style="font-size: 20px; color: #9ca3af; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 2px;">${isUrdu ? 'اصل استاد' : 'ON BEHALF OF'}</div>
                    <div style="font-size: 36px; font-weight: 700; color: #374151;">${origName}</div>
                </div>
             </div>
          </div>
          
          <div style="background: #111827; color: white; padding: 20px; text-align: center; font-size: 18px; font-weight: 600; letter-spacing: 2px;">
              MR. TMS GENERATED SLIP
          </div>
        </div>
      `;

      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.innerHTML = htmlContent;
      document.body.appendChild(tempDiv);
      
      try {
          await document.fonts.ready;
          await new Promise(r => setTimeout(r, 800));

          const canvas = await html2canvas(tempDiv.querySelector('.slip-container'), {
              scale: 2,
              useCORS: true,
              backgroundColor: '#ffffff'
          });
          document.body.removeChild(tempDiv);
          const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
          
          if (blob) {
              const file = new File([blob], `slip_${subTeacher?.nameEn}_${dateStr}.png`, { type: 'image/png' });
              
              if (navigator.canShare && navigator.canShare({ files: [file] })) {
                  try {
                      await navigator.share({ files: [file], title: 'Substitution Slip' });
                  } catch (err: any) {
                      if (err.name !== 'AbortError') {
                           // Fallback if share failed but wasn't cancelled
                           const link = document.createElement('a');
                           link.href = URL.createObjectURL(blob);
                           link.download = `slip_${subTeacher?.nameEn}_${dateStr}.png`;
                           link.click();
                           URL.revokeObjectURL(link.href);
                      }
                      // If cancelled (AbortError), do nothing.
                  }
              } else {
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = `slip_${subTeacher?.nameEn}_${dateStr}.png`;
                  link.click();
                  URL.revokeObjectURL(link.href);
              }
          }
      } catch (e) {
          console.error("Slip generation failed", e);
          if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv);
          alert("Failed to generate slip image.");
      } finally {
          setIsGeneratingSlip(false);
      }
  };

  const handleSavePrintDesign = (newDesign: DownloadDesignConfig) => {
    onUpdateSchoolConfig({
      downloadDesigns: { ...schoolConfig.downloadDesigns, adjustments: newDesign }
    });
  };

  // Helper to get available teachers for a slot
  const getAvailableTeachers = (periodIndex: number, dayName: keyof TimetableGridData) => {
      // Find busy teachers
      const busyTeacherIds = new Set<string>();
      
      // Regular timetable check
      classes.forEach(c => {
          c.timetable[dayName]?.[periodIndex]?.forEach(p => {
              if (p.teacherId) busyTeacherIds.add(p.teacherId);
          });
      });
      
      // Adjustments check (Substitutes are busy, Original teachers on leave are handled by their adjustment record)
      (adjustments[selectedDate] || []).forEach(adj => {
          if (adj.periodIndex === periodIndex) {
              busyTeacherIds.add(adj.substituteTeacherId);
          }
      });

      // Filter teachers
      return teachers.filter(t => !busyTeacherIds.has(t.id) && !currentLeaveDetails[t.id]);
  };

  // Build the list of periods that need coverage
  const periodsNeedingCoverage = useMemo(() => {
      const dayName = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' }) as keyof TimetableGridData;
      const items: {
          periodIndex: number,
          classId: string,
          subjectId: string,
          originalTeacherId: string,
          adjustment?: Adjustment
      }[] = [];

      Object.entries(currentLeaveDetails).forEach(([teacherId, leave]) => {
          if (leave.leaveType === 'full' || (leave.leaveType === 'half')) {
              classes.forEach(c => {
                  c.timetable[dayName]?.forEach((slot, pIdx) => {
                      // Check if teacher has class in this slot
                      const classPeriods = slot.filter(p => p.teacherId === teacherId);
                      
                      // Check if leave covers this period
                      let isAbsent = false;
                      if (leave.leaveType === 'full') isAbsent = true;
                      else if (leave.leaveType === 'half') {
                          if (leave.periods && leave.periods.length > 0) isAbsent = leave.periods.includes(pIdx + 1);
                          else if (leave.startPeriod) isAbsent = (pIdx + 1) >= leave.startPeriod;
                      }

                      if (isAbsent && classPeriods.length > 0) {
                          // Deduplicate joint periods if necessary, for now simple per-class entry
                          classPeriods.forEach(p => {
                              const existingAdj = currentDateAdjustments.find(a => 
                                  a.periodIndex === pIdx && 
                                  a.classId === c.id && 
                                  a.originalTeacherId === teacherId
                              );
                              
                              items.push({
                                  periodIndex: pIdx,
                                  classId: c.id,
                                  subjectId: p.subjectId,
                                  originalTeacherId: teacherId,
                                  adjustment: existingAdj
                              });
                          });
                      }
                  });
              });
          }
      });
      
      return items.sort((a, b) => a.periodIndex - b.periodIndex);
  }, [currentLeaveDetails, currentDateAdjustments, classes, selectedDate]);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <PrintPreview
        t={t}
        isOpen={isPrintPreviewOpen}
        onClose={() => setIsPrintPreviewOpen(false)}
        title={t.dailyAdjustments}
        fileNameBase={`Adjustments_${selectedDate}`}
        generateHtml={(lang, design) => {
            return generateAdjustmentsReportHtml(t, lang, design, currentDateAdjustments, teachers, classes, subjects, schoolConfig, selectedDate, Object.keys(currentLeaveDetails));
        }}
        onGenerateExcel={(lang) => generateAdjustmentsExcel(t, currentDateAdjustments, teachers, classes, subjects, selectedDate)}
        designConfig={schoolConfig.downloadDesigns.adjustments}
        onSaveDesign={handleSavePrintDesign}
      />

      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
              <label className="text-sm font-bold text-[var(--text-secondary)]">{t.selectDate}</label>
              <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={handleDateChange} 
                  className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg text-[var(--text-primary)] shadow-sm focus:ring-2 focus:ring-[var(--accent-primary)]"
              />
          </div>
          <button 
              onClick={() => setIsPrintPreviewOpen(true)} 
              className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-primary-hover)] shadow-sm"
          >
              <PrintIcon />
              <span>{t.printViewAction}</span>
          </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Teacher List & Attendance */}
          <div className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-primary)] overflow-hidden flex flex-col h-[calc(100vh-200px)]">
              <div className="p-4 border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)] font-bold text-[var(--text-primary)]">
                  {t.teacherOnLeave}
              </div>
              <div className="overflow-y-auto flex-grow p-2">
                  {teachers.map(teacher => {
                      const leave = currentLeaveDetails[teacher.id];
                      return (
                          <div key={teacher.id} className="flex items-center justify-between p-3 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors border-b border-[var(--border-secondary)] last:border-0">
                              <span className="font-medium text-[var(--text-primary)]">{teacher.nameEn}</span>
                              <div className="flex gap-2">
                                  <button 
                                      onClick={() => handleLeaveToggle(teacher.id, leave?.leaveType === 'full' ? null : 'full')}
                                      className={`px-3 py-1 text-xs font-bold rounded-md border ${leave?.leaveType === 'full' ? 'bg-red-500 text-white border-red-500' : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-secondary)] hover:border-red-300'}`}
                                  >
                                      Full
                                  </button>
                                  <button 
                                      onClick={() => handleLeaveToggle(teacher.id, leave?.leaveType === 'half' ? null : 'half')}
                                      className={`px-3 py-1 text-xs font-bold rounded-md border ${leave?.leaveType === 'half' ? 'bg-orange-500 text-white border-orange-500' : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-secondary)] hover:border-orange-300'}`}
                                  >
                                      Half
                                  </button>
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>

          {/* Right Column: Substitution Management */}
          <div className="lg:col-span-2 bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-primary)] overflow-hidden flex flex-col h-[calc(100vh-200px)]">
              <div className="p-4 border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)] font-bold text-[var(--text-primary)]">
                  {t.dailyAdjustments} ({new Date(selectedDate).toLocaleDateString()})
              </div>
              
              <div className="overflow-y-auto flex-grow p-4 space-y-4">
                  {periodsNeedingCoverage.length === 0 ? (
                      <div className="text-center text-[var(--text-secondary)] py-10 opacity-60">
                          <div className="text-4xl mb-2">🎉</div>
                          No adjustments needed for this date.
                      </div>
                  ) : (
                      periodsNeedingCoverage.map((item, idx) => {
                          const schoolClass = classes.find(c => c.id === item.classId);
                          const subject = subjects.find(s => s.id === item.subjectId);
                          const origTeacher = teachers.find(t => t.id === item.originalTeacherId);
                          const dayName = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' }) as keyof TimetableGridData;
                          const availableTeachers = getAvailableTeachers(item.periodIndex, dayName);
                          const subId = item.adjustment?.substituteTeacherId || '';
                          const isConflict = !!item.adjustment?.conflictDetails;

                          return (
                              <div key={`${item.classId}-${item.periodIndex}-${idx}`} className="border border-[var(--border-secondary)] rounded-xl p-4 bg-[var(--bg-primary)]/30">
                                  <div className="flex flex-wrap justify-between items-start gap-4 mb-3">
                                      <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded-full bg-[var(--accent-secondary)] text-[var(--accent-primary)] flex items-center justify-center font-black text-lg shadow-sm">
                                              {item.periodIndex + 1}
                                          </div>
                                          <div>
                                              <div className="font-bold text-[var(--text-primary)]">{schoolClass?.nameEn}</div>
                                              <div className="text-xs text-[var(--text-secondary)]">{subject?.nameEn} ({origTeacher?.nameEn})</div>
                                          </div>
                                      </div>
                                      
                                      {item.adjustment && (
                                          <div className="flex items-center gap-2">
                                              <button 
                                                  onClick={() => generateSlip(item.adjustment!)} 
                                                  disabled={isGeneratingSlip}
                                                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors" 
                                                  title="Share Slip"
                                              >
                                                  <ShareIcon />
                                              </button>
                                              <button 
                                                  onClick={() => handleSubstitutionChange(item.adjustment!.id, item.periodIndex, item.classId, item.subjectId, item.originalTeacherId, '')} 
                                                  className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                                  title="Clear Substitution"
                                              >
                                                  <TrashIcon />
                                              </button>
                                          </div>
                                      )}
                                  </div>

                                  <div className="relative">
                                      <select 
                                          value={subId} 
                                          onChange={(e) => handleSubstitutionChange(item.adjustment?.id || null, item.periodIndex, item.classId, item.subjectId, item.originalTeacherId, e.target.value)}
                                          className={`w-full p-2.5 rounded-lg border text-sm appearance-none ${isConflict ? 'border-red-300 bg-red-50 text-red-900' : 'border-[var(--border-secondary)] bg-[var(--bg-secondary)] text-[var(--text-primary)]'} focus:ring-2 focus:ring-[var(--accent-primary)] outline-none`}
                                      >
                                          <option value="">Select Substitute...</option>
                                          <optgroup label="Available Teachers">
                                              {availableTeachers.map(t => (
                                                  <option key={t.id} value={t.id}>{t.nameEn}</option>
                                              ))}
                                          </optgroup>
                                          <optgroup label="Busy Teachers (Conflict)">
                                              {teachers.filter(t => !availableTeachers.find(at => at.id === t.id) && t.id !== item.originalTeacherId).map(t => (
                                                  <option key={t.id} value={t.id}>{t.nameEn}</option>
                                              ))}
                                          </optgroup>
                                      </select>
                                      {isConflict && (
                                          <div className="text-xs text-red-600 mt-1 font-bold">
                                              ⚠️ Conflict: Busy in {language === 'ur' ? item.adjustment?.conflictDetails?.classNameUr : item.adjustment?.conflictDetails?.classNameEn}
                                          </div>
                                      )}
                                  </div>
                              </div>
                          );
                      })
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};
