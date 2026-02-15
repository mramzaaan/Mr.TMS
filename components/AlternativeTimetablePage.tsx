
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import type { Language, SchoolClass, Subject, Teacher, TimetableGridData, Adjustment, SchoolConfig, Period, LeaveDetails, DownloadDesignConfig, TimetableSession } from '../types';
import PrintPreview from './PrintPreview';
import { translations } from '../i18n';
import { generateAdjustmentsExcel, generateAdjustmentsReportHtml } from './reportUtils';
import { generateUniqueId, allDays } from '../types';
import NoSessionPlaceholder from './NoSessionPlaceholder';

// Declaring html2canvas for image generation
declare const html2canvas: any;

// Icons
const ImportExportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);
const ImportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m-4-4v12" /></svg>;
const ChevronDown = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>;
const DoubleBookedWarningIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1-1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);
const WhatsAppIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 4.316 1.905 6.03l-.419 1.533 1.519-.4zM15.53 17.53c-.07-.121-.267-.202-.56-.347-.297-.146-1.758-.868-2.031-.967-.272-.099-.47-.146-.669.146-.199.293-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.15-1.255-.463-2.39-1.475-1.134-1.012-1.31-1.36-1.899-2.258-.151-.231-.04-.355.043-.463.083-.107.185-.293.28-.439.095-.146.12-.245.18-.41.06-.164.03-.311-.015-.438-.046-.127-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.177-.008-.375-.01-1.04-.01h-.11c-.307.003-1.348-.043-1.348 1.438 0 1.482.791 2.906 1.439 3.82.648.913 2.51 3.96 6.12 5.368 3.61 1.408 3.61 1.054 4.258 1.034.648-.02 1.758-.715 2.006-1.413.248-.698.248-1.289.173-1.413z" />
    </svg>
);
const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
);
const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
);
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);
const ShareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
);
const RefreshIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
const ChatBubbleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;

const SignatureModal: React.FC<{
    t: any;
    isOpen: boolean;
    onClose: () => void;
    onFinalSave: (signature: string) => Promise<void>; 
}> = ({ t, isOpen, onClose, onFinalSave }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 4;
                ctx.lineCap = 'round';
            }
        }
    }, [isOpen]);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (isSubmitting) return;
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.beginPath();
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const x = (clientX - rect.left) * (canvas.width / rect.width);
        const y = (clientY - rect.top) * (canvas.height / rect.height);

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const handleClear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    const handleSave = async () => {
        const canvas = canvasRef.current;
        if (canvas && !isSubmitting) {
            setIsSubmitting(true);
            try {
                await onFinalSave(canvas.toDataURL());
                onClose();
            } catch (err: unknown) {
                console.error("Submission failed", err);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-[120] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-[var(--bg-secondary)] rounded-3xl shadow-2xl p-6 sm:p-10 w-full max-w-4xl animate-scale-in border border-[var(--border-primary)]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight">{t.signNow.toUpperCase()}</h3>
                        <p className="text-sm text-[var(--text-secondary)] mt-1 font-medium">Headmaster/Principal's signature for the substitution sheet.</p>
                    </div>
                    <button onClick={onClose} disabled={isSubmitting} className="p-3 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-full transition-colors disabled:opacity-50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <div className="border-4 border-dashed border-gray-200 rounded-3xl bg-white overflow-hidden touch-none shadow-inner mb-8">
                    <canvas 
                        ref={canvasRef}
                        width={1200}
                        height={600}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseOut={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className={`w-full h-auto bg-white block ${isSubmitting ? 'cursor-not-allowed' : 'cursor-crosshair'}`}
                    />
                </div>
                
                <div className="flex flex-col gap-4">
                    <button 
                        onClick={handleSave}
                        disabled={isSubmitting}
                        className="w-full h-16 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl hover:shadow-indigo-500/40 transition-all transform hover:-translate-y-1 active:scale-[0.98] flex items-center justify-center gap-4 text-lg disabled:opacity-70 disabled:transform-none"
                    >
                        {isSubmitting ? (
                            <div className="flex items-center gap-3">
                                <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                <span>SIGN & SHARE IMAGE</span>
                            </div>
                        ) : (
                            <span>SIGN & SHARE IMAGE</span>
                        )}
                    </button>
                    {!isSubmitting && (
                        <button onClick={handleClear} className="text-sm font-bold uppercase tracking-widest text-red-600 hover:text-red-700 transition-colors">
                            {t.clearSignature}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

interface AlternativeTimetablePageProps {
  t: any;
  language: Language;
  classes: SchoolClass[];
  subjects: Subject[];
  teachers: Teacher[];
  adjustments: Record<string, Adjustment[]>;
  leaveDetails: Record<string, Record<string, LeaveDetails>> | undefined;
  onSetAdjustments: (date: string, adjustmentsForDate: Adjustment[]) => void;
  onSetLeaveDetails: (date: string, details: Record<string, LeaveDetails>) => void;
  onUpdateSession: (updater: (session: TimetableSession) => TimetableSession) => void;
  schoolConfig: SchoolConfig;
  onUpdateSchoolConfig: (newConfig: Partial<SchoolConfig>) => void;
  selection: { date: string; teacherIds: string[]; };
  onSelectionChange: React.Dispatch<React.SetStateAction<{ date: string; teacherIds: string[]; }>>;
  openConfirmation: (title: string, message: React.ReactNode, onConfirm: () => void) => void;
  hasActiveSession: boolean;
}

type SubstituteStatus =
  | { type: 'IN_CHARGE' }
  | { type: 'TEACHES_CLASS' }
  | { type: 'AVAILABLE' }
  | { type: 'UNAVAILABLE'; reason: 'SUBSTITUTION' }
  | { type: 'UNAVAILABLE'; reason: 'DOUBLE_BOOK'; conflictClass: { classNameEn: string, classNameUr: string } };

type TeacherWithStatus = {
  teacher: Teacher;
  status: SubstituteStatus;
};

interface SubstitutionGroup {
    absentTeacher: Teacher;
    period: Period; 
    periodIndex: number;
    combinedClassIds: string[];
    combinedClassNames: { en: string; ur: string };
    subjectInfo: { en: string; ur: string };
}

const LEAVE_REASONS = ['Illness', 'Urgent Work', 'On Duty', 'Rest', 'Other'];

// Custom Substitute Picker Component
interface SubstitutePickerProps {
    teachersWithStatus: TeacherWithStatus[];
    selectedId: string;
    onChange: (id: string) => void;
    language: Language;
    historyStats: { stats: Record<string, number[]>; labels: string[] }; // Updated Prop
    onToggle?: (isOpen: boolean) => void; // New prop for managing z-index in parent
}

const SubstitutePicker: React.FC<SubstitutePickerProps> = ({ teachersWithStatus, selectedId, onChange, language, historyStats, onToggle }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const selectedTeacherObj = teachersWithStatus.find(t => t.teacher.id === selectedId);

    // Determine status text for selected teacher
    let selectedStatusText = "";
    if (selectedTeacherObj) {
        if (selectedTeacherObj.status.type === 'AVAILABLE') selectedStatusText = "(Free)";
        else if (selectedTeacherObj.status.type === 'IN_CHARGE') selectedStatusText = "(In Charge)";
        else if (selectedTeacherObj.status.type === 'TEACHES_CLASS') selectedStatusText = "(Teaches)";
        else if (selectedTeacherObj.status.type === 'UNAVAILABLE') selectedStatusText = "(Busy)";
    }

    // Effect to notify parent about open state changes
    useEffect(() => {
        if (onToggle) onToggle(isOpen);
    }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Labels for the last 7 days (current first)
    const { stats: allStats, labels: dayLabels } = historyStats;
    const isToday = (idx: number) => idx === dayLabels.length - 1;

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full text-left rounded-xl px-4 py-3 text-sm font-bold flex justify-between items-center transition-all outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                    selectedId 
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                    : 'bg-white dark:bg-gray-800 border border-[var(--border-secondary)] text-[var(--text-primary)] hover:border-[var(--accent-primary)] shadow-sm'
                }`}
            >
                <span className="truncate flex-grow">
                    {selectedTeacherObj 
                        ? `${language === 'ur' ? selectedTeacherObj.teacher.nameUr : selectedTeacherObj.teacher.nameEn} ${selectedStatusText}`
                        : "Select Substitute..."}
                </span>
                <div className="flex items-center gap-2 ml-2">
                    <ChevronDown />
                </div>
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-[var(--border-secondary)] rounded-lg shadow-xl max-h-80 overflow-y-auto custom-scrollbar animate-scale-in">
                    {teachersWithStatus.map(({ teacher, status }) => {
                        const name = language === 'ur' ? teacher.nameUr : teacher.nameEn;
                        const teacherStats = allStats[teacher.id] || [0,0,0,0,0,0,0];
                        
                        let nameColor = "text-blue-600 dark:text-blue-400"; // Default Available (Blue)
                        let bgColor = "";
                        let statusText = "";
                        
                        if (status.type === 'IN_CHARGE') {
                            nameColor = "text-green-600 dark:text-green-400";
                            bgColor = "bg-green-50 dark:bg-green-900/10";
                            statusText = "In Charge";
                        } else if (status.type === 'TEACHES_CLASS') {
                            nameColor = "text-yellow-600 dark:text-yellow-400";
                            bgColor = "bg-yellow-50 dark:bg-yellow-900/10";
                            statusText = "Teaches Class";
                        } else if (status.type === 'UNAVAILABLE') {
                            nameColor = "text-red-600 dark:text-red-400";
                            bgColor = "bg-red-50 dark:bg-red-900/10";
                            if (status.reason === 'DOUBLE_BOOK') {
                                const conflictName = language === 'ur' ? status.conflictClass.classNameUr : status.conflictClass.classNameEn;
                                statusText = `Busy in ${conflictName}`;
                            } else {
                                statusText = "Substitution";
                            }
                        }

                        return (
                            <div 
                                key={teacher.id} 
                                onClick={() => { onChange(teacher.id); setIsOpen(false); }}
                                className={`p-2 border-b border-[var(--border-secondary)] last:border-0 hover:bg-[var(--bg-tertiary)] cursor-pointer transition-colors ${bgColor}`}
                            >
                                <div className="flex justify-between items-center mb-1.5">
                                    <div className="flex flex-col">
                                        <span className={`font-bold text-lg ${nameColor}`}>{name}</span>
                                        {statusText && <span className={`text-[10px] font-bold ${nameColor}`}>{statusText}</span>}
                                    </div>
                                </div>
                                
                                {/* 7 Days Workload History */}
                                <div className="flex gap-1 justify-end">
                                    {dayLabels.map((dayLabel, idx) => (
                                        <div key={idx} className={`flex flex-col items-center w-7 p-0.5 rounded ${isToday(idx) ? 'bg-[var(--accent-secondary)] ring-1 ring-[var(--accent-primary)]' : ''}`}>
                                            <span className={`text-[10px] font-bold ${isToday(idx) ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}`}>{dayLabel}</span>
                                            <span className={`text-sm font-mono font-black ${teacherStats[idx] > 0 ? (isToday(idx) ? 'text-[var(--accent-primary)]' : 'text-orange-500') : 'text-[var(--text-placeholder)]'}`}>
                                                {teacherStats[idx]}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export const AlternativeTimetablePage: React.FC<AlternativeTimetablePageProps> = ({ t, language, classes, subjects, teachers, adjustments, leaveDetails, onSetAdjustments, onSetLeaveDetails, onUpdateSession, schoolConfig, onUpdateSchoolConfig, selection, onSelectionChange, openConfirmation, hasActiveSession }) => {
  if (!hasActiveSession) {
    return <NoSessionPlaceholder t={t} />;
  }

  const { date: selectedDate, teacherIds: absentTeacherIds } = selection;
  
  const [dailyAdjustments, setDailyAdjustments] = useState<Adjustment[]>([]);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [absenteeDetails, setAbsenteeDetails] = useState<Record<string, LeaveDetails>>({});
  const [expandedTeacherIds, setExpandedTeacherIds] = useState<Set<string>>(new Set());
  const [messageLanguage, setMessageLanguage] = useState<Language>(language);
  const [isLeaveDetailsExpanded, setIsLeaveDetailsExpanded] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  
  const [absentClassIds, setAbsentClassIds] = useState<string[]>([]);
  
  const [exportStartDate, setExportStartDate] = useState(selectedDate);
  const [exportEndDate, setExportEndDate] = useState(selectedDate);
  
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // New state to track which card has an open dropdown
  const [activeDropdownCardId, setActiveDropdownCardId] = useState<string | null>(null);

  // Modal State
  const [modalState, setModalState] = useState<{
      isOpen: boolean;
      mode: 'teacher' | 'class';
      data: {
          id: string; // teacherId or classId
          isMultiDay: boolean;
          startDate: string;
          endDate: string;
          reason: string;
          customReason: string;
          leaveType: 'full' | 'half';
          startPeriod: number;
          periods: number[];
      }
  }>({
      isOpen: false,
      mode: 'teacher',
      data: {
          id: '',
          isMultiDay: false,
          startDate: selectedDate,
          endDate: selectedDate,
          reason: 'Illness',
          customReason: '',
          leaveType: 'full',
          startPeriod: 1,
          periods: []
      }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastSyncedDate = useRef<string | null>(null);

  const activeDays = useMemo(() => allDays.filter(day => schoolConfig.daysConfig?.[day]?.active ?? true), [schoolConfig.daysConfig]);
  const maxPeriods = useMemo(() => {
      const counts = activeDays.map(day => schoolConfig.daysConfig?.[day]?.periodCount ?? 8);
      return counts.length > 0 ? Math.max(...counts) : 8;
  }, [activeDays, schoolConfig.daysConfig]);

  const periodsForDropdown = useMemo(() => {
      if (modalState.data.isMultiDay) return maxPeriods;
      if (!modalState.data.startDate) return maxPeriods;
      
      const date = new Date(modalState.data.startDate);
      const dayIndex = date.getUTCDay();
      const dayMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = dayMap[dayIndex];
      
      if (allDays.includes(dayName as any)) {
          const config = schoolConfig.daysConfig?.[dayName as keyof TimetableGridData];
          return config ? config.periodCount : 8;
      }
      return 0; 
  }, [modalState.data.isMultiDay, modalState.data.startDate, maxPeriods, schoolConfig.daysConfig]);

  const toggleTeacherCollapse = (teacherId: string) => {
    setExpandedTeacherIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teacherId)) {
        newSet.delete(teacherId);
      } else {
        newSet.add(teacherId);
      }
      return newSet;
    });
  };
  
  const getTeacherName = (t: Teacher) => language === 'ur' ? <span className="font-urdu">{t.nameUr}</span> : t.nameEn;
  const getClassName = (c: SchoolClass) => language === 'ur' ? <span className="font-urdu">{c.nameUr}</span> : c.nameEn;
  
  const getRespectfulName = (teacher: Teacher, lang: Language) => {
    if (lang === 'ur') {
        if (teacher.gender === 'Male') return `محترم ${teacher.nameUr} صاحب`;
        if (teacher.gender === 'Female') return `محترمہ ${teacher.nameUr} صاحبہ`;
        return teacher.nameUr;
    }
    const prefix = teacher.gender === 'Male' ? 'Mr.' : (teacher.gender === 'Female' ? 'Ms.' : '');
    return `${prefix} ${teacher.nameEn}`.trim();
  };
  
  const dayOfWeek = useMemo(() => {
    if (!selectedDate) return null;
    const date = new Date(selectedDate);
    const dayIndex = date.getUTCDay(); 
    return dayIndex > 0 && dayIndex <= 6 ? allDays[dayIndex - 1] : null;
  }, [selectedDate]);

  useEffect(() => {
    const savedAdjustments = adjustments[selectedDate] || [];
    setDailyAdjustments(savedAdjustments);
    
    const savedLeaveDetails: Record<string, LeaveDetails> = leaveDetails?.[selectedDate] || {};
    
    const _absentClassIds: string[] = [];
    const _absentTeacherIds: string[] = [];
    const _details: Record<string, LeaveDetails> = {};

    Object.entries(savedLeaveDetails).forEach(([key, detail]) => {
        if (key.startsWith('CLASS_')) {
            const classId = key.replace('CLASS_', '');
            if (classes.some(c => c.id === classId)) {
                _absentClassIds.push(classId);
                _details[key] = detail;
            }
        } else {
            const teach = teachers.find(t => t.id === key);
            if (teach) {
                _absentTeacherIds.push(key);
                _details[key] = detail;
            }
        }
    });

    savedAdjustments.forEach(adj => {
        if (!_absentTeacherIds.includes(adj.originalTeacherId)) {
            const teach = teachers.find(t => t.id === adj.originalTeacherId);
            if (teach) {
                _absentTeacherIds.push(adj.originalTeacherId);
                _details[adj.originalTeacherId] = { leaveType: 'full', startPeriod: 1 };
            }
        }
    });

    const currentSelectedIds = selection.teacherIds;
    const newSelectedIds = _absentTeacherIds;
    const areSetsEqual = (a: string[], b: string[]) => a.length === b.length && new Set(a).size === new Set(b).size && a.every(x => b.includes(x));

    if (!areSetsEqual(currentSelectedIds, newSelectedIds)) {
         onSelectionChange(prev => ({ 
            ...prev, 
            teacherIds: newSelectedIds
        }));
    }
    
    setAbsentClassIds(_absentClassIds);
    setAbsenteeDetails(_details);
    
    if (selectedDate !== lastSyncedDate.current) {
        setExpandedTeacherIds(new Set()); 
        lastSyncedDate.current = selectedDate;
    }
  }, [selectedDate, adjustments, leaveDetails, classes, teachers, selection.teacherIds, onSelectionChange]);

  useEffect(() => {
        setExportStartDate(selectedDate);
        setExportEndDate(selectedDate);
        setModalState(prev => ({ 
            ...prev, 
            data: { ...prev.data, startDate: selectedDate, endDate: selectedDate } 
        }));
  }, [selectedDate]);

  const absentTeachers = useMemo(() => {
    return teachers.filter(teacher => absentTeacherIds.includes(teacher.id));
  }, [teachers, absentTeacherIds]);

  const substitutionGroups = useMemo((): SubstitutionGroup[] => {
    if (!dayOfWeek) return [];
    
    const dayConfig = schoolConfig.daysConfig?.[dayOfWeek];
    const maxPeriodsForDay = dayConfig ? dayConfig.periodCount : 8;
    if (dayConfig && !dayConfig.active) return []; 

    const groups: SubstitutionGroup[] = [];
    
    absentTeachers.forEach(absentTeacher => {
        const details = absenteeDetails[absentTeacher.id];

        for (let periodIndex = 0; periodIndex < maxPeriodsForDay; periodIndex++) {
            let isOnLeave = false;
            if (!details || details.leaveType === 'full') {
                isOnLeave = true;
            } else if (details.leaveType === 'half') {
                if (details.periods && details.periods.length > 0) {
                    isOnLeave = details.periods.includes(periodIndex + 1);
                } else {
                    isOnLeave = (periodIndex + 1) >= details.startPeriod;
                }
            }

            if (!isOnLeave) continue;

            const periodsToCover = classes.map(c => 
                (c.timetable[dayOfWeek]?.[periodIndex] || [])
                    .filter(p => p.teacherId === absentTeacher.id)
            ).flat();

            if (periodsToCover.length > 0) {
                const processedJointPeriods = new Set<string>();
                periodsToCover.forEach(firstPeriod => {
                    const jointPeriodId = firstPeriod.jointPeriodId;
                    if(jointPeriodId && processedJointPeriods.has(jointPeriodId)) return;

                    const classIds = jointPeriodId 
                        ? classes.filter(c => c.timetable[dayOfWeek]?.[periodIndex]?.some(p => p.jointPeriodId === jointPeriodId)).map(c => c.id)
                        : [firstPeriod.classId];

                    const classNames = classIds.map(id => {
                        const c = classes.find(cls => cls.id === id);
                        return { en: c?.nameEn || '', ur: c?.nameUr || ''};
                    }).reduce((acc, curr) => ({ en: acc.en ? `${acc.en}, ${curr.en}` : curr.en, ur: acc.ur ? `${acc.ur}، ${curr.ur}`: curr.ur}), {en: '', ur: ''});

                    const subject = subjects.find(s => s.id === firstPeriod.subjectId);

                    groups.push({
                        absentTeacher: absentTeacher,
                        period: firstPeriod,
                        periodIndex: periodIndex,
                        combinedClassIds: classIds,
                        combinedClassNames: classNames,
                        subjectInfo: { en: subject?.nameEn || '', ur: subject?.nameUr || '' },
                    });
                    if(jointPeriodId) processedJointPeriods.add(jointPeriodId);
                });
            }
        }
    });
    return groups.sort((a,b) => a.absentTeacher.id.localeCompare(b.absentTeacher.id) || a.periodIndex - b.periodIndex);
  }, [dayOfWeek, absentTeachers, classes, subjects, absenteeDetails, schoolConfig.daysConfig]);

  const teacherBookingsMap = useMemo(() => {
    const bookings = new Map<string, { classNameEn: string, classNameUr: string, classId: string }>();
    allDays.forEach(day => {
        for (let periodIndex = 0; periodIndex < 8; periodIndex++) {
            classes.forEach(c => {
                c.timetable[day]?.[periodIndex]?.forEach(p => {
                    const key = `${day}-${periodIndex}-${p.teacherId}`;
                    if (!bookings.has(key)) {
                        bookings.set(key, { classNameEn: c.nameEn, classNameUr: c.nameUr, classId: c.id });
                    }
                });
            });
        }
    });
    return bookings;
  }, [classes]);

  const findAvailableTeachers = useCallback((periodIndex: number, period: Period): TeacherWithStatus[] => {
    if (!dayOfWeek) return [];
    
    const busyThroughSubstitution = new Set(dailyAdjustments.filter(adj => adj.periodIndex === periodIndex).map(adj => adj.substituteTeacherId));
    
    const allTeachersWithStatus = teachers
        .filter(t => !absentTeacherIds.includes(t.id))
        .map(teacher => {
            let status: SubstituteStatus;

            if (busyThroughSubstitution.has(teacher.id)) {
                status = { type: 'UNAVAILABLE', reason: 'SUBSTITUTION' };
            } else {
                const bookingKey = `${dayOfWeek}-${periodIndex}-${teacher.id}`;
                const booking = teacherBookingsMap.get(bookingKey);
                
                if (booking) {
                    const classLeaveKey = `CLASS_${booking.classId}`;
                    const classLeave = absenteeDetails[classLeaveKey];
                    let isClassAbsent = false;

                    if (absentClassIds.includes(booking.classId)) {
                        if (!classLeave || classLeave.leaveType === 'full') {
                            isClassAbsent = true;
                        } else if (classLeave.leaveType === 'half') {
                            if (classLeave.periods && classLeave.periods.length > 0) {
                                isClassAbsent = classLeave.periods.includes(periodIndex + 1);
                            } else if (periodIndex >= (classLeave.startPeriod - 1)) {
                                isClassAbsent = true;
                            }
                        }
                    }

                    if (isClassAbsent) {
                        status = { type: 'AVAILABLE' };
                    } else {
                        status = { type: 'UNAVAILABLE', reason: 'DOUBLE_BOOK', conflictClass: { classNameEn: booking.classNameEn, classNameUr: booking.classNameUr } };
                    }
                } else {
                    const targetClass = classes.find(c => c.id === period.classId);
                    if (targetClass?.inCharge === teacher.id) {
                        status = { type: 'IN_CHARGE' };
                    } else if (targetClass?.subjects.some(s => s.teacherId === teacher.id)) {
                        status = { type: 'TEACHES_CLASS' };
                    } else {
                        status = { type: 'AVAILABLE' };
                    }
                }
            }
            return { teacher, status };
        });

    return allTeachersWithStatus.sort((a, b) => {
        const order: Record<SubstituteStatus['type'], number> = { 'IN_CHARGE': 1, 'TEACHES_CLASS': 2, 'AVAILABLE': 3, 'UNAVAILABLE': 4 };
        return order[a.status.type] - order[b.status.type];
    });
  }, [dayOfWeek, dailyAdjustments, absentTeacherIds, teachers, classes, teacherBookingsMap, absentClassIds, absenteeDetails]);

  // Compute 7-day History Stats for Dropdown (Today + Previous 6 days)
  const historyStats = useMemo(() => {
    if (!selectedDate) return { stats: {}, labels: [] };
    const current = new Date(selectedDate);
    const labels: string[] = [];
    const dateStrings: string[] = [];

    // Generate last 7 days (Today is last/rightmost)
    for (let i = 6; i >= 0; i--) {
        const d = new Date(current);
        d.setDate(current.getDate() - i);
        const iso = d.toISOString().split('T')[0];
        dateStrings.push(iso);
        labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 3));
    }

    const stats: Record<string, number[]> = {};
    
    teachers.forEach(t => {
        stats[t.id] = [0,0,0,0,0,0,0];
    });

    dateStrings.forEach((dateStr, idx) => {
        const adjs = adjustments[dateStr] || [];
        adjs.forEach(adj => {
             if (stats[adj.substituteTeacherId]) {
                 stats[adj.substituteTeacherId][idx]++;
             }
        });
    });
    
    return { stats, labels };
  }, [selectedDate, adjustments, teachers]);

  const handleSubstituteChange = (group: SubstitutionGroup, substituteTeacherId: string) => {
    if (!dayOfWeek) return;

    const availableTeachersList = findAvailableTeachers(group.periodIndex, group.period);
    const selectedTeacherInfo = availableTeachersList.find(t => t.teacher.id === substituteTeacherId);

    let conflictDetails: Adjustment['conflictDetails'];
    if (substituteTeacherId && selectedTeacherInfo?.status.type === 'UNAVAILABLE' && selectedTeacherInfo.status.reason === 'DOUBLE_BOOK') {
        conflictDetails = selectedTeacherInfo.status.conflictClass;
    }

    const { absentTeacher, periodIndex, combinedClassIds } = group;
    let newAdjustments = dailyAdjustments.filter(adj => 
        !(adj.periodIndex === periodIndex && adj.originalTeacherId === absentTeacher.id)
    );
    if (substituteTeacherId) {
        combinedClassIds.forEach(classId => {
            const periodInClass = classes.find(c => c.id === classId)?.timetable[dayOfWeek]?.[periodIndex].find(p => p.teacherId === absentTeacher.id || (p.jointPeriodId && group.period.jointPeriodId === p.jointPeriodId));
            if (periodInClass) {
                newAdjustments.push({
                    id: `${selectedDate}-${dayOfWeek}-${periodIndex}-${classId}-${absentTeacher.id}`,
                    classId,
                    subjectId: periodInClass.subjectId,
                    originalTeacherId: absentTeacher.id,
                    substituteTeacherId: substituteTeacherId,
                    day: dayOfWeek,
                    periodIndex,
                    conflictDetails: conflictDetails
                });
            }
        });
    }
    setDailyAdjustments(newAdjustments);
    onSetAdjustments(selectedDate, newAdjustments);
  };
  
  const handleSaveAdjustments = () => { onSetAdjustments(selectedDate, dailyAdjustments); alert(`${t.saveAdjustments}`); };
  const openModal = (mode: 'teacher' | 'class' = 'teacher', id: string = '') => { let existingDetails = null; if (id) { const key = mode === 'class' ? `CLASS_${id}` : id; existingDetails = absenteeDetails[key]; } let reason = existingDetails?.reason || (mode === 'class' ? 'On Leave' : 'Illness'); let customReason = ''; if (reason && !LEAVE_REASONS.includes(reason) && reason !== 'Other') { customReason = reason; reason = 'Other'; } setModalState({ isOpen: true, mode, data: { id: id, isMultiDay: !!(existingDetails?.startDate && existingDetails?.endDate && existingDetails.startDate !== existingDetails.endDate), startDate: existingDetails?.startDate || selectedDate, endDate: existingDetails?.endDate || selectedDate, reason: reason, customReason: customReason, leaveType: existingDetails?.leaveType || 'full', startPeriod: existingDetails?.startPeriod || 1, periods: existingDetails?.periods || [] } }); };
  const handleSaveModal = () => { const { id, isMultiDay, startDate, endDate, reason, customReason, leaveType, startPeriod, periods } = modalState.data; const { mode } = modalState; if (!id) { alert(`Please select a ${mode}.`); return; } const finalReason = reason === 'Other' ? customReason : reason; const datesToProcess = []; if (isMultiDay) { const start = new Date(startDate); const end = new Date(endDate); if (start > end) { alert('Start date must be before end date.'); return; } const curr = new Date(start); curr.setHours(12, 0, 0, 0); const last = new Date(end); last.setHours(12, 0, 0, 0); while (curr <= last) { datesToProcess.push(curr.toISOString().split('T')[0]); curr.setDate(curr.getDate() + 1); } } else { datesToProcess.push(startDate); } onUpdateSession(session => { const newLeaveDetails = { ...session.leaveDetails }; const key = mode === 'class' ? `CLASS_${id}` : id; datesToProcess.forEach(date => { const currentDayDetails = newLeaveDetails[date] || {}; newLeaveDetails[date] = { ...currentDayDetails, [key]: { leaveType, startPeriod: leaveType === 'full' ? 1 : (periods.length > 0 ? Math.min(...periods) : startPeriod), periods: leaveType === 'half' ? periods : undefined, reason: finalReason, startDate: isMultiDay ? startDate : undefined, endDate: isMultiDay ? endDate : undefined } }; }); return { ...session, leaveDetails: newLeaveDetails }; }); if (datesToProcess.includes(selectedDate)) { const key = mode === 'class' ? `CLASS_${id}` : id; const newDetails = { ...absenteeDetails }; newDetails[key] = { leaveType, startPeriod: leaveType === 'full' ? 1 : (periods.length > 0 ? Math.min(...periods) : startPeriod), periods: leaveType === 'half' ? periods : undefined, reason: finalReason, startDate: isMultiDay ? startDate : undefined, endDate: isMultiDay ? endDate : undefined }; setAbsenteeDetails(newDetails); if (mode === 'teacher') { if (!absentTeacherIds.includes(id)) { onSelectionChange(prev => ({ ...prev, teacherIds: [...prev.teacherIds, id] })); } } else { if (!absentClassIds.includes(id)) { setAbsentClassIds(prev => [...prev, id]); } } } setModalState(prev => ({ ...prev, isOpen: false })); };
  const handleDeleteItem = (id: string, type: 'teacher' | 'class') => { const item = type === 'teacher' ? teachers.find(t => t.id === id) : classes.find(c => c.id === id); const name = item ? (language === 'ur' ? (item as any).nameUr : (item as any).nameEn) : ''; openConfirmation( t.delete, <span>{t.areYouSure} <strong>{name}</strong>?</span>, () => { const key = type === 'class' ? `CLASS_${id}` : id; onUpdateSession(session => { const updatedLeaveDetails = { ...(session.leaveDetails || {}) }; const currentDayLeaves = { ...(updatedLeaveDetails[selectedDate] || {}) }; delete currentDayLeaves[key]; updatedLeaveDetails[selectedDate] = currentDayLeaves; const updatedAdjustments = { ...session.adjustments }; if (type === 'teacher') { const dayAdjustments = (updatedAdjustments[selectedDate] || []).filter(adj => adj.originalTeacherId !== id); updatedAdjustments[selectedDate] = dayAdjustments; } return { ...session, leaveDetails: updatedLeaveDetails, adjustments: updatedAdjustments }; }); if (type === 'teacher') { onSelectionChange(prev => ({ ...prev, teacherIds: prev.teacherIds.filter(tid => tid !== id) })); } else { setAbsentClassIds(prev => prev.filter(cid => cid !== id)); } } ); };
  const handleExport = () => { 
    const dates = []; 
    const current = new Date(exportStartDate); 
    const end = new Date(exportEndDate); 
    
    if (current > end) { 
        alert("Start date cannot be after end date."); 
        return; 
    } 
    
    while (current <= end) { 
        dates.push(current.toISOString().split('T')[0]); 
        current.setDate(current.getDate() + 1); 
    } 
    
    const exportData: any[] = []; 
    dates.forEach(date => { 
        const dayAdjustments = adjustments[date] || []; 
        const dayLeaveDetails = leaveDetails?.[date] || {}; 
        if (dayAdjustments.length > 0 || Object.keys(dayLeaveDetails).length > 0) { 
            exportData.push({ date: date, adjustments: dayAdjustments, leaveDetails: dayLeaveDetails }); 
        } 
    }); 
    
    if (exportData.length === 0) { 
        alert("No data (adjustments or leaves) found for the selected date range."); 
        return; 
    } 
    
    const dataStr = JSON.stringify(exportData, null, 2); 
    const blob = new Blob([dataStr], { type: "application/json" }); 
    const url = URL.createObjectURL(blob); 
    const link = document.createElement("a"); 
    link.href = url; 
    const dateRangeStr = exportStartDate === exportEndDate ? exportStartDate : `${exportStartDate}_to_${exportEndDate}`; 
    link.download = `mr_timetable_adjustments_${dateRangeStr}.json`; 
    document.body.appendChild(link); 
    link.click(); 
    document.body.removeChild(link); 
    URL.revokeObjectURL(url); 
  };
  
  const handleImportJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    file.text().then((result) => {
        try {
            const jsonStr = typeof result === 'string' ? result : String(result);
            const imported: any[] = JSON.parse(jsonStr);
            if (!Array.isArray(imported)) throw new Error("Invalid format: expected array");

            onUpdateSession((session) => {
                const newAdjustments = { ...session.adjustments };
                const newLeaveDetails = { ...(session.leaveDetails || {}) };
                
                imported.forEach(dayData => {
                    const { date, adjustments: dayAdjs, leaveDetails: dayLeaves } = dayData;
                    if (date && typeof date === 'string') {
                        if (Array.isArray(dayAdjs)) {
                            // Ensure IDs are unique or preserve them? Better to regenerate IDs to avoid collisions if merging, but these are adjustments.
                            newAdjustments[date] = dayAdjs.map((adj: any) => ({ ...adj, id: generateUniqueId() }));
                        }
                        if (dayLeaves && typeof dayLeaves === 'object') {
                            newLeaveDetails[date] = dayLeaves;
                        }
                    }
                });
                return { ...session, adjustments: newAdjustments, leaveDetails: newLeaveDetails };
            });
            
            alert("Data imported successfully.");
            setIsImportExportOpen(false);
        } catch (error: unknown) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            alert(`Failed to import: ${errorMessage}`);
        }
    }).catch((err: unknown) => { 
        console.error("File read error:", err);
        const msg = err instanceof Error ? err.message : String(err);
        alert(`Failed to read file: ${msg}`);
    });
    event.target.value = '';
  };

  const handleCancelAlternativeTimetable = () => { openConfirmation( t.cancelAlternativeTimetable, t.cancelAlternativeTimetableConfirm, () => { onSetAdjustments(selectedDate, []); onSetLeaveDetails(selectedDate, {}); onSelectionChange(prev => ({ ...prev, teacherIds: [] })); setAbsentClassIds([]); setAbsenteeDetails({}); } ); };

  const formatTime = (time24: string | undefined) => {
    if (!time24) return '';
    const [h, m] = time24.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${suffix}`;
  };

  const getPeriodStartTime = (periodIndex: number) => {
      const d = new Date(selectedDate);
      const isFriday = d.getDay() === 5;
      const timings = schoolConfig.periodTimings?.[isFriday ? 'friday' : 'default'] || [];
      return timings[periodIndex]?.start || '';
  };

  const generateSubstitutionSlip = async (
    adjustment: Adjustment, 
    substitute: Teacher, 
    originalTeacher: Teacher, 
    schoolClass: SchoolClass, 
    subject: Subject,
    timeStr: string,
    conflictClassName?: string
  ): Promise<Blob | null> => {
      const dateObj = new Date(selectedDate);
      const dateStr = dateObj.toLocaleDateString(messageLanguage === 'ur' ? 'ur-PK' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      const schoolName = messageLanguage === 'ur' ? schoolConfig.schoolNameUr : schoolConfig.schoolNameEn;

      const origName = messageLanguage === 'ur' ? originalTeacher.nameUr : originalTeacher.nameEn;
      const className = messageLanguage === 'ur' ? schoolClass.nameUr : schoolClass.nameEn;
      const subjName = messageLanguage === 'ur' ? subject.nameUr : subject.nameEn;
      const roomNum = schoolClass.roomNumber || '-';
      const respectfulName = getRespectfulName(substitute, messageLanguage);
      const greeting = messageLanguage === 'ur' ? 'السلام علیکم' : 'Assalam o Alaikum';

      const conflictHtml = conflictClassName 
        ? `<div style="margin-top: 25px; background: #fee2e2; border-left: 6px solid #ef4444; padding: 20px; border-radius: 8px;">
              <div style="color: #b91c1c; font-weight: bold; font-size: 20px; text-transform: uppercase;">⚠ Conflict Warning</div>
              <div style="color: #7f1d1d; font-size: 16px; margin-top: 8px;">You have a regular class with <strong>${conflictClassName}</strong>. Please manage accordingly.</div>
           </div>`
        : '';

      const isUrdu = messageLanguage === 'ur';
      const dir = isUrdu ? 'rtl' : 'ltr';
      const fontFamily = isUrdu ? "'Noto Nastaliq Urdu', serif" : "'Roboto', sans-serif";

      const htmlContent = `
        <div style="width: 1200px; background: white; font-family: ${fontFamily}; border-radius: 0; overflow: hidden; direction: ${dir}; border: 4px solid #4f46e5;">
          <!-- Top Accent -->
          <div style="height: 24px; background: linear-gradient(90deg, #6366f1, #a855f7, #ec4899);"></div>
          
          <div style="padding: 60px; text-align: center;">
             <div style="font-size: 40px; color: #4b5563; font-weight: 600; margin-bottom: 12px;">${greeting}</div>
             <div style="font-size: 64px; color: #111827; font-weight: 800; line-height: 1.2; margin-bottom: 8px;">${respectfulName}</div>
             <div style="font-size: 24px; color: #6b7280; font-weight: 500;">${schoolName}</div>
          </div>
          
          <div style="padding: 0 60px 60px 60px;">
             <div style="background: #f3f4f6; padding: 40px; border: 2px solid #d1d5db;">
                <!-- Centered Date Section -->
                <div style="text-align: center; border-bottom: 3px dashed #d1d5db; padding-bottom: 30px; margin-bottom: 30px;">
                    <div style="font-size: 24px; color: #6b7280; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 5px;">${isUrdu ? 'تاریخ' : 'DATE'}</div>
                    <div style="font-size: 48px; color: #1f2937; font-weight: 900;">${dateStr}</div>
                </div>
                
                <!-- 3 Columns: Period | Time | Room -->
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;">
                    <!-- Period Box -->
                    <div style="background: white; border: 2px solid #e5e7eb; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px;">
                        <span style="font-size: 20px; color: #6b7280; font-weight: 800; letter-spacing: 2px;">${isUrdu ? 'پیریڈ' : 'PERIOD'}</span>
                        <span style="font-size: 60px; font-weight: 900; color: #4f46e5; line-height: 1;">${adjustment.periodIndex + 1}</span>
                    </div>

                    <!-- Time Box -->
                    <div style="background: white; border: 2px solid #e5e7eb; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px;">
                        <span style="font-size: 20px; color: #6b7280; font-weight: 800; letter-spacing: 2px;">${isUrdu ? 'وقت' : 'TIME'}</span>
                        <span style="font-size: 40px; font-weight: 900; color: #059669; line-height: 1; white-space: nowrap;">${timeStr}</span>
                    </div>

                    <!-- Room Box -->
                    <div style="background: white; border: 2px solid #e5e7eb; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px;">
                        <span style="font-size: 20px; color: #6b7280; font-weight: 800; letter-spacing: 2px;">${isUrdu ? 'کمرہ' : 'ROOM'}</span>
                        <span style="font-size: 60px; font-weight: 900; color: #ea580c; line-height: 1;">${roomNum}</span>
                    </div>
                </div>

                <div style="margin-top: 30px; display: grid; grid-template-columns: 1fr; gap: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; background: white; padding: 30px; border: 2px solid #e5e7eb;">
                        <div>
                            <div style="font-size: 18px; color: #6b7280; font-weight: bold; text-transform: uppercase;">${isUrdu ? 'کلاس' : 'CLASS'}</div>
                            <div style="font-size: 36px; font-weight: 900; color: #111827;">${className}</div>
                        </div>
                        <div style="text-align: ${isUrdu ? 'left' : 'right'};">
                             <div style="font-size: 18px; color: #6b7280; font-weight: bold; text-transform: uppercase;">${isUrdu ? 'مضمون' : 'SUBJECT'}</div>
                            <div style="font-size: 36px; font-weight: 900; color: #4f46e5;">${subjName}</div>
                        </div>
                    </div>
                </div>

                <div style="margin-top: 30px; text-align: center;">
                    <div style="font-size: 18px; color: #9ca3af; font-weight: bold; text-transform: uppercase; margin-bottom: 8px;">${isUrdu ? 'اصل استاد' : 'ON BEHALF OF'}</div>
                    <div style="font-size: 28px; font-weight: 700; color: #4b5563;">${origName}</div>
                </div>
             </div>

             ${conflictHtml}
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
      
      // Inject Google Font for Urdu if needed
      if (isUrdu) {
        const style = document.createElement('style');
        style.innerHTML = `@import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap');`;
        tempDiv.appendChild(style);
        await document.fonts.ready;
      }

      try {
          const canvas = await html2canvas(tempDiv, {
              scale: 2,
              useCORS: true,
              backgroundColor: '#ffffff' // Force white background
          });
          document.body.removeChild(tempDiv);
          return await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      } catch (e: unknown) {
          console.error("Slip generation failed", e);
          if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv);
          return null;
      }
  };

  const handleWhatsAppNotify = async (adjustment: Adjustment) => {
      const substitute = teachers.find(t => t.id === adjustment.substituteTeacherId);
      const originalTeacher = teachers.find(t => t.id === adjustment.originalTeacherId);
      const schoolClass = classes.find(c => c.id === adjustment.classId);
      const subject = subjects.find(s => s.id === adjustment.subjectId);
      
      if (!substitute || !originalTeacher || !schoolClass || !subject) {
          alert("Missing data for substitution slip.");
          return;
      }

      if (!substitute.contactNumber) {
          alert("Teacher has no contact number.");
          return;
      }

      setIsGeneratingImage(true);

      const startTime = getPeriodStartTime(adjustment.periodIndex);
      const timeStr = formatTime(startTime);
      
      let conflictClassName = '';
      if (adjustment.conflictDetails) {
          conflictClassName = messageLanguage === 'ur' ? adjustment.conflictDetails.classNameUr : adjustment.conflictDetails.classNameEn;
      }

      const blob = await generateSubstitutionSlip(
          adjustment,
          substitute,
          originalTeacher,
          schoolClass,
          subject,
          timeStr,
          conflictClassName
      );

      if (blob) {
          // 1. Copy Image to Clipboard
          try {
              if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
                  const item = new ClipboardItem({ [blob.type]: blob });
                  await navigator.clipboard.write([item]);
                  
                  // Show a toast or notification
                  const toast = document.createElement('div');
                  toast.textContent = "Image Copied! Paste in WhatsApp.";
                  toast.style.cssText = "position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #22c55e; color: white; padding: 10px 20px; border-radius: 50px; z-index: 9999; font-weight: bold; box-shadow: 0 4px 12px rgba(0,0,0,0.2); pointer-events: none; transition: opacity 0.5s ease-in-out;";
                  document.body.appendChild(toast);
                  setTimeout(() => { 
                      toast.style.opacity = '0';
                      setTimeout(() => document.body.removeChild(toast), 500); 
                  }, 3000);
              } else {
                  throw new Error("Clipboard API unavailable");
              }
          } catch (e: unknown) {
              console.warn("Clipboard failed, attempting download as fallback", e);
              // Fallback: Download Image
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `substitution_${substitute.nameEn.replace(/\s/g, '_')}.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              alert("Could not copy image automatically. Image downloaded. Please attach manually in WhatsApp.");
          }

          // 2. Prepare Text Message
          const dateObj = new Date(selectedDate);
          const locale = messageLanguage === 'ur' ? 'ur-PK-u-nu-latn' : 'en-GB';
          const dateStr = dateObj.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
          const dayOfWeekStr = dateObj.toLocaleDateString(locale, { weekday: 'long' });
          
          const msgT = translations[messageLanguage];
          const respectfulName = getRespectfulName(substitute, messageLanguage);
          
          let messageTemplate = msgT.notificationTemplateDefault;
          if (adjustment.conflictDetails) {
             messageTemplate = msgT.substituteNotificationMessageDoubleBook;
          }

          const className = messageLanguage === 'ur' ? schoolClass.nameUr : schoolClass.nameEn;
          const subjectName = messageLanguage === 'ur' ? subject.nameUr : subject.nameEn;
          const originalName = messageLanguage === 'ur' ? originalTeacher.nameUr : originalTeacher.nameEn;

          const message = messageTemplate
              .replace('{teacherName}', respectfulName)
              .replace('{date}', dateStr)
              .replace('{dayOfWeek}', dayOfWeekStr)
              .replace('{period}', (adjustment.periodIndex + 1).toString())
              .replace('{time}', timeStr)
              .replace('{className}', className)
              .replace('{subjectName}', subjectName)
              .replace('{roomNumber}', schoolClass.roomNumber || '-')
              .replace('{originalTeacherName}', originalName)
              .replace('{conflictClassName}', conflictClassName);

          let phoneNumber = substitute.contactNumber.replace(/\D/g, '');
          if (phoneNumber.startsWith('0')) phoneNumber = '92' + phoneNumber.substring(1);
          
          // 3. Open WhatsApp
          setTimeout(() => {
              window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
          }, 500);

      } else {
          alert("Failed to generate image.");
      }
      setIsGeneratingImage(false);
  };

  const handleCopyAll = () => {
    if (dailyAdjustments.length === 0) { alert("No adjustments to copy."); return; }
    const date = new Date(selectedDate);
    const locale = messageLanguage === 'ur' ? 'ur-PK-u-nu-latn' : 'en-GB';
    const dayOfWeekStr = date.toLocaleDateString(locale, { weekday: 'long' });
    const dateStr = date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
    const msgT = translations[messageLanguage];
    let fullMessage = `📅 *${msgT.dailyAdjustments}* \n🗓️ ${dateStr} (${dayOfWeekStr})\n${"-".repeat(20)}\n\n`;

    const bySubstitute: Record<string, Adjustment[]> = {};
    dailyAdjustments.forEach(adj => {
        if (!bySubstitute[adj.substituteTeacherId]) bySubstitute[adj.substituteTeacherId] = [];
        bySubstitute[adj.substituteTeacherId].push(adj);
    });

    Object.entries(bySubstitute).forEach(([subId, adjs]) => {
        const substitute = teachers.find(t => t.id === subId);
        if (!substitute) return;
        fullMessage += `👤 *${getRespectfulName(substitute, messageLanguage)}*\n`;
        adjs.sort((a,b) => a.periodIndex - b.periodIndex).forEach(adj => {
             const schoolClass = classes.find(c => c.id === adj.classId);
             const subject = subjects.find(s => s.id === adj.subjectId);
             const originalTeacher = teachers.find(t => t.id === adj.originalTeacherId);
             const className = messageLanguage === 'ur' ? schoolClass?.nameUr : schoolClass?.nameEn;
             const subjectName = messageLanguage === 'ur' ? subject?.nameUr : subject?.nameEn;
             const originalTeacherName = messageLanguage === 'ur' ? originalTeacher?.nameUr : originalTeacher?.nameEn;
             const roomNum = schoolClass?.roomNumber || '-';
             
             const startTime = getPeriodStartTime(adj.periodIndex);
             const timeStr = formatTime(startTime);

             fullMessage += `   🕒 *P${adj.periodIndex + 1}${timeStr ? ` (${timeStr})` : ''}* | 🏫 ${className} | 📖 ${subjectName} | 📍 Rm: ${roomNum}\n      ↳ 🔄 ${msgT.substitution}: ${originalTeacherName}\n`;
             if(adj.conflictDetails) {
                const conflictClass = messageLanguage === 'ur' ? adj.conflictDetails.classNameUr : adj.conflictDetails.classNameEn;
                fullMessage += `      ⚠️ *${msgT.doubleBook} Warning:* ${conflictClass}\n`;
             }
        });
        fullMessage += `\n`;
    });
    navigator.clipboard.writeText(fullMessage).then(() => alert(`${t.messagesCopied}`));
  };
  
  const handleSavePrintDesign = (newDesign: DownloadDesignConfig) => {
    onUpdateSchoolConfig({ downloadDesigns: { ...schoolConfig.downloadDesigns, adjustments: newDesign } });
  };

  const handleSignAndShare = async (signature: string) => {
      setIsGeneratingImage(true);
      try {
          const design = schoolConfig.downloadDesigns.adjustments;
          const langForImage = messageLanguage; 
          
          // Generate the multi-page HTML
          const pagesHtml = generateAdjustmentsReportHtml(
            t, langForImage, design, dailyAdjustments, teachers, classes, subjects, schoolConfig, selectedDate, absentTeacherIds, signature
          );

          const lastPageHtml = pagesHtml[pagesHtml.length - 1];

          const tempContainer = document.createElement('div');
          const isPortrait = design.page.orientation === 'portrait';
          const widthPx = isPortrait ? 794 : 1123;
          const heightPx = isPortrait ? 1123 : 794;
          
          Object.assign(tempContainer.style, {
              position: 'fixed',
              left: '-9999px',
              top: '0',
              width: `${widthPx}px`,
              height: `${heightPx}px`,
              backgroundColor: '#ffffff',
              overflow: 'hidden',
              visibility: 'visible',
              zIndex: '-999'
          });
          document.body.appendChild(tempContainer);
          tempContainer.innerHTML = lastPageHtml;

          await document.fonts.ready;
          await new Promise(r => setTimeout(r, 600)); 

          const canvas = await html2canvas(tempContainer, {
              scale: 2,
              useCORS: true,
              backgroundColor: '#ffffff',
              width: widthPx,
              height: heightPx,
              logging: false,
              allowTaint: true
          });
          document.body.removeChild(tempContainer);

          const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
          if (blob) {
              const file = new File([blob], `Signed_Adjustments_${selectedDate}.png`, { type: 'image/png' });
              
              // Attempt Share
              if ((navigator as any).canShare && (navigator as any).canShare({ files: [file] })) {
                  try {
                      await (navigator as any).share({ files: [file], title: `Signed_Adjustments_${selectedDate}` });
                  } catch (error: unknown) { 
                      // Silently handle cancellation or abort
                      const isAbort = error instanceof Error && error.name === 'AbortError';
                      if (!isAbort) {
                          console.error("Share failed", error);
                          const msg = (error instanceof Error) ? error.message : String(error);
                          alert(`Share failed: ${msg}`);
                      }
                  }
              } else {
                  // Fallback Download
                  const link = document.createElement('a');
                  link.href = canvas.toDataURL('image/png');
                  link.download = `Signed_Adjustments_${selectedDate}.png`;
                  link.click();
              }
          }
      } catch (err: unknown) { 
          console.error("Image generation failed", err);
          const errMsg = (err instanceof Error) ? err.message : String(err);
          alert(errMsg);
      } finally {
          setIsGeneratingImage(false);
      }
  };

  const formattedDateForTitle = new Date(selectedDate).toLocaleDateString(language === 'ur' ? 'ur-PK-u-nu-latn' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <PrintPreview 
        t={t} 
        isOpen={isPrintPreviewOpen} 
        onClose={() => setIsPrintPreviewOpen(false)} 
        title={`${t.dailyAdjustments}: ${formattedDateForTitle}`} 
        fileNameBase={`Adjustments_${selectedDate}`}
        generateHtml={(lang, design) => generateAdjustmentsReportHtml(t, lang, design, dailyAdjustments, teachers, classes, subjects, schoolConfig, selectedDate, absentTeacherIds)}
        onGenerateExcel={(lang) => generateAdjustmentsExcel(t, dailyAdjustments, teachers, classes, subjects, selectedDate)}
        designConfig={schoolConfig.downloadDesigns.adjustments}
        onSaveDesign={handleSavePrintDesign}
      />

      <SignatureModal 
        t={t} 
        isOpen={isSignModalOpen} 
        onClose={() => setIsSignModalOpen(false)} 
        onFinalSave={handleSignAndShare}
      />

      {/* Add/Edit Leave Modal */}
      {modalState.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity" onClick={() => setModalState(prev => ({...prev, isOpen: false}))}>
            <div className="bg-[var(--bg-secondary)] rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden transform transition-all border border-[var(--border-primary)]" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]/30 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-[var(--text-primary)]">
                        Add/Edit Leave
                    </h3>
                    <div className="flex bg-[var(--bg-secondary)] rounded-lg p-1 border border-[var(--border-secondary)]">
                        <button 
                            onClick={() => setModalState(prev => ({ ...prev, mode: 'teacher', data: { ...prev.data, id: '' } }))}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${modalState.mode === 'teacher' ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                        >
                            Teacher
                        </button>
                        <button 
                            onClick={() => setModalState(prev => ({ ...prev, mode: 'class', data: { ...prev.data, id: '' } }))}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${modalState.mode === 'class' ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                        >
                            Class
                        </button>
                    </div>
                </div>
                
                <div className="p-6 space-y-5">
                    {/* Entity Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">
                            Select {modalState.mode === 'teacher' ? 'Teacher' : 'Class'}
                        </label>
                        <select 
                            value={modalState.data.id} 
                            onChange={(e) => setModalState(prev => ({ ...prev, data: { ...prev.data, id: e.target.value } }))}
                            className="block w-full px-3 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg text-[var(--text-primary)] focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]"
                        >
                            <option value="">Select...</option>
                            {modalState.mode === 'teacher' 
                                ? teachers.map(t => <option key={t.id} value={t.id}>{t.nameEn} {t.nameUr ? `/ ${t.nameUr}` : ''}</option>)
                                : classes.map(c => <option key={c.id} value={c.id}>{c.nameEn} / {c.nameUr}</option>)
                            }
                        </select>
                    </div>

                    {/* Date Selection */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-[var(--text-secondary)]">Date(s)</label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={modalState.data.isMultiDay} 
                                    onChange={(e) => setModalState(prev => ({ ...prev, data: { ...prev.data, isMultiDay: e.target.checked } }))} 
                                    className="form-checkbox h-4 w-4 text-[var(--accent-primary)] rounded focus:ring-[var(--accent-primary)]"
                                />
                                <span className="text-sm text-[var(--text-primary)]">Multiple Days</span>
                            </label>
                        </div>
                        
                        <div className={`grid gap-4 ${modalState.data.isMultiDay ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            <div>
                                <label className="block text-xs text-[var(--text-secondary)] mb-1">{modalState.data.isMultiDay ? 'Start Date' : 'Date'}</label>
                                <input 
                                    type="date" 
                                    value={modalState.data.startDate} 
                                    onChange={(e) => setModalState(prev => ({ ...prev, data: { ...prev.data, startDate: e.target.value } }))}
                                    className="block w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg text-[var(--text-primary)] focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]"
                                />
                            </div>
                            {modalState.data.isMultiDay && (
                                <div>
                                    <label className="block text-xs text-[var(--text-secondary)] mb-1">End Date</label>
                                    <input 
                                        type="date" 
                                        value={modalState.data.endDate} 
                                        onChange={(e) => setModalState(prev => ({ ...prev, data: { ...prev.data, endDate: e.target.value } }))}
                                        className="block w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg text-[var(--text-primary)] focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">Reason</label>
                        <select 
                            value={modalState.data.reason} 
                            onChange={(e) => setModalState(prev => ({ ...prev, data: { ...prev.data, reason: e.target.value } }))}
                            className="block w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg text-[var(--text-primary)] focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]"
                        >
                            {LEAVE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        
                        {modalState.data.reason === 'Other' && (
                            <input 
                                type="text" 
                                placeholder="Enter custom reason..." 
                                value={modalState.data.customReason} 
                                onChange={(e) => setModalState(prev => ({ ...prev, data: { ...prev.data, customReason: e.target.value } }))}
                                className="mt-2 block w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg text-[var(--text-primary)] focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] animate-scale-in"
                            />
                        )}
                    </div>

                    {/* Leave Type & Period (Available for both Teacher and Class) */}
                    <div className="space-y-4">
                        <div className="w-1/2">
                            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">Leave Type</label>
                            <select 
                                value={modalState.data.leaveType} 
                                onChange={(e) => setModalState(prev => ({ ...prev, data: { ...prev.data, leaveType: e.target.value as 'full' | 'half', periods: e.target.value === 'full' ? [] : prev.data.periods } }))}
                                className="block w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg text-[var(--text-primary)] focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]"
                            >
                                <option value="full">Full Day</option>
                                <option value="half">Half Day</option>
                            </select>
                        </div>
                        {modalState.data.leaveType === 'half' && (
                            <div className="animate-scale-in">
                                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">Select Period(s) on Leave</label>
                                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 bg-[var(--bg-tertiary)] p-3 rounded-lg border border-[var(--border-secondary)]">
                                    {Array.from({ length: periodsForDropdown }, (_, i) => i + 1).map(p => (
                                        <label key={p} className={`flex flex-col items-center justify-center p-2 rounded-lg border cursor-pointer transition-all ${modalState.data.periods.includes(p) ? 'bg-red-50 border-red-500 shadow-sm' : 'bg-[var(--bg-secondary)] border-[var(--border-secondary)] hover:border-red-300'}`}>
                                            <span className={`text-xs font-black mb-1 ${modalState.data.periods.includes(p) ? 'text-red-700' : 'text-[var(--text-secondary)]'}`}>{p}</span>
                                            <input 
                                                type="checkbox" 
                                                checked={modalState.data.periods.includes(p)} 
                                                onChange={(e) => {
                                                    const newPeriods = e.target.checked 
                                                        ? [...modalState.data.periods, p].sort((a,b) => a-b)
                                                        : modalState.data.periods.filter(val => val !== p);
                                                    setModalState(prev => ({ ...prev, data: { ...prev.data, periods: newPeriods } }));
                                                }}
                                                className="form-checkbox h-4 w-4 text-red-600 rounded border-red-300 focus:ring-red-500"
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-[var(--border-primary)] bg-[var(--bg-tertiary)]/30 flex justify-end gap-3">
                    <button 
                        onClick={() => setModalState(prev => ({...prev, isOpen: false}))}
                        className="px-5 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSaveModal}
                        className="px-6 py-2 text-sm font-semibold text-white bg-[var(--accent-primary)] rounded-lg hover:bg-[var(--accent-primary-hover)] shadow-sm transition-colors"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Import/Export Modal */}
      {isImportExportOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[101] transition-opacity" onClick={() => setIsImportExportOpen(false)}>
            <div className="bg-[var(--bg-secondary)] rounded-2xl shadow-2xl max-md w-full mx-4 overflow-hidden transform transition-all border border-[var(--border-primary)]" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold p-5 border-b border-[var(--border-primary)] text-[var(--text-primary)]">Import / Export</h3>
                <div className="p-6 space-y-6">
                    <div>
                        <h4 className="text-xs font-bold text-[var(--text-secondary)] mb-3 uppercase tracking-wider">EXPORT</h4>
                        <div className="bg-[var(--bg-tertiary)] p-4 rounded-xl border border-[var(--border-secondary)] space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input type="date" value={exportStartDate} onChange={(e) => setExportStartDate(e.target.value)} className="block w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg text-[var(--text-primary)] focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] shadow-sm" />
                                <input type="date" value={exportEndDate} onChange={(e) => setExportEndDate(e.target.value)} className="block w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg text-[var(--text-primary)] focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] shadow-sm" />
                            </div>
                            <button onClick={handleExport} className="w-full py-2.5 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-primary-hover)] transition-colors text-sm font-bold shadow-md">Export Adjustments</button>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-[var(--text-secondary)] mb-3 uppercase tracking-wider">IMPORT</h4>
                        <div className="bg-[var(--bg-tertiary)] p-4 rounded-xl border border-[var(--border-secondary)]">
                            <button onClick={() => fileInputRef.current?.click()} className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-[var(--bg-secondary)] border-2 border-dashed border-[var(--border-secondary)] text-[var(--text-primary)] rounded-xl hover:bg-[var(--accent-secondary-hover)] hover:border-[var(--accent-primary)] transition-all text-sm font-bold group">
                                <ImportIcon /> 
                                <span className="group-hover:text-[var(--accent-primary)]">Select File</span>
                            </button>
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-[var(--border-primary)] flex justify-end bg-[var(--bg-tertiary)]/30">
                    <button onClick={() => setIsImportExportOpen(false)} className="px-5 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors">Close</button>
                </div>
            </div>
        </div>
      )}
      
      {/* Main Page Content */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <label htmlFor="adjustment-date" className="block text-sm font-medium text-[var(--text-secondary)]">{t.selectDate}</label>
          <input type="date" id="adjustment-date" value={selectedDate} onChange={(e) => onSelectionChange(prev => ({ ...prev, date: e.target.value }))} className="block w-full md:w-auto pl-3 pr-10 py-2 text-base bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border-secondary)] focus:outline-none focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] sm:text-sm rounded-md shadow-sm" />
          <button onClick={() => openModal('teacher')} title="Add Leave" className="py-4 px-24 text-sm font-medium bg-[var(--accent-primary)] text-white border border-[var(--border-primary)] rounded-xl shadow-lg hover:bg-[var(--accent-primary-hover)] transition-all hover:scale-105"><PlusIcon /></button>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
            <button onClick={() => setMessageLanguage(prev => prev === 'en' ? 'ur' : 'en')} title="Toggle Message Language" className="px-3 py-2 text-sm font-semibold text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg shadow-sm hover:bg-[var(--bg-tertiary)] transition-colors flex items-center gap-2"><span className="text-xs text-center text-[var(--text-secondary)] uppercase">{t.msgLang}:</span><span className={messageLanguage === 'ur' ? 'font-urdu' : ''}>{messageLanguage === 'en' ? 'EN' : 'اردو'}</span></button>
            <button onClick={() => setIsSignModalOpen(true)} disabled={dailyAdjustments.length === 0} title={t.sendAsImage} className="p-2 text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg shadow-sm hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <ShareIcon />
            </button>
            {dailyAdjustments.length > 0 && <button onClick={handleCopyAll} title={t.copyAllMessages} className="p-2 text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg shadow-sm hover:bg-[var(--bg-tertiary)] transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg></button>}
             <button onClick={handleSaveAdjustments} title={t.saveAdjustments} className="p-2 text-sm font-medium bg-[var(--accent-primary)] text-[var(--accent-text)] border border-[var(--border-primary)] rounded-lg shadow-sm hover:bg-[var(--accent-primary-hover)] transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg></button>
            <button onClick={() => setIsImportExportOpen(true)} title="Import / Export" className="p-2 text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg shadow-sm hover:bg-[var(--bg-tertiary)] transition-colors"><ImportExportIcon /></button>
            <input type="file" ref={fileInputRef} onChange={handleImportJson} accept=".json" className="hidden" />
            <button onClick={() => setIsPrintPreviewOpen(true)} disabled={dailyAdjustments.length === 0} title={t.printViewAction} className="p-2 text-sm font-medium bg-[var(--accent-primary)] text-[var(--accent-text)] border border-[var(--border-primary)] rounded-lg shadow-sm hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 00-2-2H5a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2v4h10z" /></svg></button>
            <button onClick={handleCancelAlternativeTimetable} disabled={dailyAdjustments.length === 0 && absentTeacherIds.length === 0} title={t.cancelAlternativeTimetable} className="p-2 text-sm font-medium text-red-600 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg shadow-sm hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
         {(absentTeacherIds.length > 0 || absentClassIds.length > 0) && (
             <div className="bg-[var(--bg-secondary)] rounded-lg shadow-md border border-[var(--border-primary)] mb-6 overflow-hidden">
                 <button 
                    type="button"
                    onClick={() => setIsLeaveDetailsExpanded(!isLeaveDetailsExpanded)}
                    className="w-full flex items-center justify-between p-4 bg-[var(--bg-tertiary)]/50 hover:bg-[var(--bg-tertiary)] transition-colors focus:outline-none"
                 >
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-[var(--text-primary)] m-0">{t.leaveDetails}</h3>
                        <span className="px-2 py-0.5 text-xs font-bold bg-[var(--accent-primary)] text-[var(--accent-text)] rounded-full shadow-sm">
                            {absentTeacherIds.length + absentClassIds.length}
                        </span>
                    </div>
                    <div className={`text-[var(--text-secondary)] transform transition-transform duration-200 ${isLeaveDetailsExpanded ? 'rotate-180' : ''}`}>
                       <ChevronDown /> 
                    </div>
                 </button>
                 
                 {isLeaveDetailsExpanded && (
                     <div className="p-6 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)] animate-scale-in">
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {absentTeachers.map(teacher => {
                                const details = absenteeDetails[teacher.id];
                                return (
                                <div key={teacher.id} className="flex flex-col p-3 bg-[var(--bg-tertiary)] rounded-md border border-[var(--border-secondary)] gap-2 group hover:border-[var(--accent-primary)]/50 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="font-bold text-[var(--text-primary)] block">{getTeacherName(teacher)}</span>
                                            <span className="text-xs text-[var(--text-secondary)] block mt-0.5">
                                                {details?.leaveType === 'half' ? (details.periods && details.periods.length > 0 ? `Periods: ${details.periods.join(', ')}` : `${t.halfDay} (from P${details.startPeriod})`) : t.fullDay}
                                                {details?.reason ? ` • ${details.reason}` : ''}
                                            </span>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => openModal('teacher', teacher.id)} className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] rounded-md transition-colors"><EditIcon /></button>
                                            <button onClick={() => handleDeleteItem(teacher.id, 'teacher')} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-md transition-colors"><TrashIcon /></button>
                                        </div>
                                    </div>
                                </div>
                            )})}
                            {absentClassIds.map(classId => {
                                const cls = classes.find(c => c.id === classId);
                                if (!cls) return null;
                                const details = absenteeDetails[`CLASS_${classId}`];
                                return (
                                    <div key={classId} className="flex flex-col p-3 bg-orange-50 dark:bg-orange-900/10 rounded-md border border-orange-200 dark:border-orange-800 gap-2 group">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="font-bold text-orange-800 dark:text-orange-200 block">{getClassName(cls)}</span>
                                                <span className="text-xs text-orange-600 dark:text-orange-300 block mt-0.5 font-medium">
                                                    {details?.leaveType === 'half' ? (details.periods && details.periods.length > 0 ? `Periods: ${details.periods.join(', ')}` : `Half Leave (from P${details.startPeriod})`) : 'Full Leave'} {details?.reason ? `• ${details.reason}` : ''}
                                                </span>
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => openModal('class', classId)} className="p-1.5 text-orange-400 hover:text-orange-700 hover:bg-orange-200/50 rounded-md transition-colors"><EditIcon /></button>
                                                <button onClick={() => handleDeleteItem(classId, 'class')} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-md transition-colors"><TrashIcon /></button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                         </div>
                     </div>
                 )}
             </div>
         )}

         {dayOfWeek ? (
            substitutionGroups.length > 0 ? (
            <div className="space-y-8">
                {/* Group by absent teacher for consistent UI */}
                {Array.from(new Set(substitutionGroups.map(g => g.absentTeacher.id))).map(tid => {
                    const teacherGroups = substitutionGroups.filter(g => g.absentTeacher.id === tid);
                    const absentTeacher = teacherGroups[0].absentTeacher;
                    const isExpanded = expandedTeacherIds.has(tid);

                    return (
                        <div key={tid} className="animate-fade-in">
                            <button 
                                onClick={() => toggleTeacherCollapse(tid)}
                                className="w-full flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900 rounded-t-2xl transition-colors hover:bg-red-100 dark:hover:bg-red-900/20"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-8 bg-red-600 rounded-full"></div>
                                    <h3 className="text-xl font-black text-red-900 dark:text-red-100 uppercase tracking-tighter">
                                        {getTeacherName(absentTeacher)}
                                    </h3>
                                </div>
                                <div className="text-red-600 transform transition-transform" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                    <ChevronDown />
                                </div>
                            </button>

                            {isExpanded && (
                                <div className="p-4 bg-[var(--bg-secondary)] border-x border-b border-red-100 dark:border-red-900 rounded-b-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-scale-in">
                                    {teacherGroups.map((group, gIdx) => {
                                        const assignedAdj = dailyAdjustments.find(a => a.periodIndex === group.periodIndex && a.originalTeacherId === group.absentTeacher.id);
                                        const currentSubstituteId = assignedAdj?.substituteTeacherId || '';
                                        const availableTeachersList = findAvailableTeachers(group.periodIndex, group.period);
                                        const cardId = `${tid}-${group.periodIndex}-${gIdx}`;
                                        
                                        return (
                                            <div key={cardId} className={`relative p-4 rounded-3xl border-4 transition-all flex flex-col gap-2 group ${currentSubstituteId ? 'border-emerald-100 bg-white dark:bg-[#1e293b] shadow-lg' : 'border-gray-100 bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700'} ${activeDropdownCardId === cardId ? 'z-30' : 'z-0'}`}>
                                                
                                                {/* Period Indicator - Centered Top */}
                                                <div className="absolute top-2 left-0 right-0 flex flex-col items-center pointer-events-none opacity-20 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Period</span>
                                                    <span className={`text-4xl font-black leading-none ${currentSubstituteId ? 'text-emerald-500' : 'text-red-500'}`}>{group.periodIndex + 1}</span>
                                                </div>

                                                {/* Class & Subject Info */}
                                                <div className="relative z-10 mt-1">
                                                    <h4 className="text-xl font-black text-[var(--text-primary)] leading-none">
                                                        {language === 'ur' ? <span className="font-urdu">{group.combinedClassNames.ur}</span> : group.combinedClassNames.en}
                                                    </h4>
                                                    <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mt-1 opacity-70">
                                                        {language === 'ur' ? <span className="font-urdu">{group.subjectInfo.ur}</span> : group.subjectInfo.en}
                                                    </p>
                                                </div>

                                                {/* Controls Area */}
                                                <div className="relative z-10">
                                                    <div className="text-[9px] font-black text-[var(--text-placeholder)] uppercase mb-1.5 ml-1">
                                                        Original: {absentTeacher.nameEn.split(' ')[0]}
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-2 h-12">
                                                        <div className="flex-grow h-full">
                                                            <SubstitutePicker 
                                                                teachersWithStatus={availableTeachersList}
                                                                selectedId={currentSubstituteId}
                                                                onChange={(id) => handleSubstituteChange(group, id)}
                                                                language={language}
                                                                historyStats={historyStats}
                                                                onToggle={(isOpen) => setActiveDropdownCardId(isOpen ? cardId : null)}
                                                            />
                                                        </div>
                                                        
                                                        {currentSubstituteId && (
                                                            <>
                                                                <button 
                                                                    onClick={() => handleWhatsAppNotify(assignedAdj!)} 
                                                                    className="h-full aspect-square flex items-center justify-center bg-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-200 transition-colors shadow-sm"
                                                                    title={t.notifySubstitute}
                                                                >
                                                                    <WhatsAppIcon />
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleSubstituteChange(group, '')} // Clear assignment
                                                                    className="h-full aspect-square flex items-center justify-center bg-gray-100 text-gray-400 rounded-xl hover:bg-red-100 hover:text-red-500 transition-colors shadow-sm"
                                                                    title="Clear"
                                                                >
                                                                    <TrashIcon />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {/* Conflict Warning if any */}
                                                {assignedAdj?.conflictDetails && (
                                                    <div className="mt-3 flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/40 text-[10px] text-red-600 font-bold animate-pulse">
                                                        <DoubleBookedWarningIcon />
                                                        <span>{t.doubleBook}: {language === 'ur' ? assignedAdj.conflictDetails.classNameUr : assignedAdj.conflictDetails.classNameEn}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            ) : <div className="text-center py-12 bg-[var(--bg-secondary)] rounded-lg border border-dashed border-[var(--border-secondary)]"><p className="text-[var(--text-secondary)]">{t.noClassesScheduled}</p></div>
         ) : <div className="text-center py-12 bg-[var(--bg-secondary)] rounded-lg border border-dashed border-[var(--border-secondary)]"><p className="text-[var(--text-secondary)]">Please select a date to begin.</p></div>}
      </div>
    </div>
  );
};

export default AlternativeTimetablePage;
