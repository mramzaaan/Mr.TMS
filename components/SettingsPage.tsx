
import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Language, SchoolConfig, SchoolClass, Teacher, Subject, Adjustment, DownloadDesignConfig, FontFamily, LeaveDetails, AttendanceData, CardStyle, TriangleCorner } from '../types';
import type { Theme, ThemeColors } from '../App';
import type { NavPosition, NavDesign, NavShape } from '../types';
import { allDays } from '../types';
import PrintPreview from './PrintPreview';
import { 
  generateBasicInformationHtml, 
  generateBasicInformationExcel, 
  generateByPeriodHtml, 
  generateByPeriodExcel, 
  generateWorkloadSummaryHtml, 
  generateWorkloadSummaryExcel,
  generateSchoolTimingsHtml,
  generateClassTimetableHtml,
  generateTeacherTimetableHtml,
  generateAdjustmentsReportHtml,
  generateAdjustmentsExcel,
  generateAttendanceReportHtml,
  generateAttendanceReportExcel
} from './reportUtils';

interface SettingsPageProps {
  t: any; 
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themeColors: ThemeColors;
  onColorChange: (key: keyof ThemeColors, value: string) => void;
  onResetTheme: () => void;
  navDesign: NavDesign;
  setNavDesign: (design: NavDesign) => void;
  navShape: NavShape;
  setNavShape: (shape: NavShape) => void;
  navShowLabels: boolean;
  setNavShowLabels: (show: boolean) => void;
  navBtnAlphaSelected: number;
  setNavBtnAlphaSelected: (val: number) => void;
  navBtnAlphaUnselected: number;
  setNavBtnAlphaUnselected: (val: number) => void;
  navBarAlpha: number;
  setNavBarAlpha: (val: number) => void;
  navBarColor: string;
  setNavBarColor: (val: string) => void;
  navAnimation: boolean;
  setNavAnimation: (val: boolean) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  appFont: string;
  setAppFont: (font: string) => void;
  schoolConfig: SchoolConfig;
  onUpdateSchoolConfig: (newSchoolConfig: Partial<SchoolConfig>) => void;
  classes: SchoolClass[];
  teachers: Teacher[];
  subjects: Subject[];
  adjustments: Record<string, Adjustment[]>;
  leaveDetails?: Record<string, Record<string, LeaveDetails>>; 
  attendance: Record<string, Record<string, AttendanceData>>;
}

const themeOptions: { id: Theme; name: string; colors: [string, string, string] }[] = [
    { id: 'light', name: 'Light', colors: ['#f8fafc', '#6366f1', '#0f172a'] },
    { id: 'dark', name: 'Dark', colors: ['#0f172a', '#8b5cf6', '#f8fafc'] },
    { id: 'mint', name: 'Mint', colors: ['#f0fdfa', '#0d9488', '#042f2e'] },
    { id: 'amoled', name: 'Amoled', colors: ['#000000', '#22d3ee', '#ffffff'] },
];

const cardStyleOptions: { label: string, value: CardStyle }[] = [
    { label: 'Full Color', value: 'full' },
    { label: 'Outline', value: 'outline' },
    { label: 'Text Only', value: 'text' },
    { label: 'Triangle Accent', value: 'triangle' },
    { label: 'Glassmorphism', value: 'glass' },
    { label: 'Gradient', value: 'gradient' },
    { label: 'Minimal Left', value: 'minimal-left' },
    { label: 'Tag Badge', value: 'badge' },
];

const triangleCornerOptions: { label: string, value: TriangleCorner }[] = [
    { label: 'Top Left', value: 'top-left' },
    { label: 'Top Right', value: 'top-right' },
    { label: 'Bottom Left', value: 'bottom-left' },
    { label: 'Bottom Right', value: 'bottom-right' },
];

const appFontOptions = [
    { label: 'System Default', value: '' },
    { label: 'Sans-Serif', value: 'sans-serif' },
    { label: 'Serif', value: 'serif' },
    { label: 'Monospace', value: 'monospace' },
];

const AboutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const WhatsAppLogo = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 4.316 1.905 6.03l-.419 1.533 1.519-.4zM15.53 17.53c-.07-.121-.267-.202-.56-.347-.297-.146-1.758-.868-2.031-.967-.272-.099-.47-.146-.669.146-.199.293-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.15-1.255-.463-2.39-1.475-1.134-1.012-1.31-1.36-1.899-2.258-.151-.231-.04-.355.043-.463.083-.107.185-.293.28-.439.095-.146.12-.245.18-.41.06-.164.03-.311-.015-.438-.046-.127-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.177-.008-.375-.01-1.04-.01h-.11c-.307.003-1.348-.043-1.348 1.438 0 1.482.791 2.906 1.439 3.82.648.913 2.51 3.96 6.12 5.368 3.61 1.408 3.61 1.054 4.258 1.034.648-.02 1.758-.715 2.006-1.413.248-.698.248-1.289.173-1.413z" />
    </svg>
);

const BroadcastIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
    </svg>
);

const LanguageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m4 13l4-16M12 19l2-5M3 10h12M3 15h12" />
  </svg>
);

const ThemeCard: React.FC<{
    id: Theme,
    name: string,
    colors: [string, string, string],
    currentTheme: Theme,
    setTheme: (theme: Theme) => void,
}> = ({ id, name, colors, currentTheme, setTheme }) => {
    const isSelected = id === currentTheme;
    return (
        <button
            onClick={() => setTheme(id)}
            className={`group relative p-4 rounded-xl transition-all duration-300 overflow-hidden bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700 ${
                isSelected 
                ? 'shadow-[0_4px_12px_rgba(0,0,0,0.15)] ring-2 ring-[var(--accent-primary)] ring-offset-2 ring-offset-[var(--bg-secondary)]' 
                : 'shadow-sm hover:shadow-md hover:-translate-y-0.5'
            }`}
        >
            <div className="flex flex-col h-full justify-between relative z-10">
                <div className="flex justify-between items-center mb-3">
                    <span className={`font-bold text-sm ${isSelected ? 'text-[var(--accent-primary)]' : 'text-gray-700 dark:text-gray-300'}`}>{name}</span>
                    {isSelected && (
                        <div className="bg-[var(--accent-primary)] text-white rounded-full p-0.5 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </div>
                    )}
                </div>
                
                <div className="flex gap-2">
                    <div className="h-6 w-6 rounded-full shadow-sm border border-gray-300 dark:border-gray-600" style={{ backgroundColor: colors[0] }} title="Background"></div>
                    <div className="h-6 w-6 rounded-full shadow-sm border border-gray-300 dark:border-gray-600" style={{ backgroundColor: colors[1] }} title="Accent"></div>
                    <div className="h-6 w-6 rounded-full shadow-sm border border-gray-300 dark:border-gray-600" style={{ backgroundColor: colors[2] }} title="Text"></div>
                </div>
            </div>
        </button>
    );
};



interface SelectionModalProps { title: string; items: { id: string; label: React.ReactNode }[]; selectedIds: string[]; onSelect: (id: string, isChecked: boolean) => void; onSelectAll: (isChecked: boolean) => void; onConfirm: () => void; onCancel: () => void; confirmLabel: string; isOpen: boolean; t: any; children?: React.ReactNode; }
const SelectionModal: React.FC<SelectionModalProps> = ({ title, items, selectedIds, onSelect, onSelectAll, onConfirm, onCancel, confirmLabel, isOpen, t, children }) => { if (!isOpen) return null; return ( <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity" onClick={onCancel}> <div className="bg-[var(--bg-secondary)] p-6 sm:p-8 rounded-xl shadow-2xl max-w-md w-full mx-4 transform flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}> <h3 className="text-xl sm:text-2xl font-bold mb-6 text-center text-[var(--text-primary)]">{title}</h3> {children} <div className="flex-grow border border-[var(--border-primary)] bg-[var(--bg-tertiary)] rounded-lg overflow-y-auto p-3 space-y-2"> <label className="flex items-center space-x-2 py-1.5 px-2 cursor-pointer border-b border-[var(--border-secondary)] sticky top-0 bg-[var(--bg-tertiary)] z-10"> <input type="checkbox" className="form-checkbox text-[var(--accent-primary)] rounded" checked={items.length > 0 && selectedIds.length === items.length} onChange={(e) => onSelectAll(e.target.checked)} /> <span className="font-semibold text-[var(--text-primary)]">{t.selectAll}</span> </label> {items.map(item => ( <label key={item.id} className="flex items-center space-x-2 py-1.5 px-2 cursor-pointer rounded-md hover:bg-[var(--accent-secondary-hover)]"> <input type="checkbox" className="form-checkbox text-[var(--accent-primary)] rounded" checked={selectedIds.includes(item.id)} onChange={(e) => onSelect(item.id, e.target.checked)} /> <span className="text-[var(--text-primary)]">{item.label}</span> </label> ))} </div> <div className="flex justify-end gap-4 pt-6 border-t border-[var(--border-primary)] mt-6"> <button onClick={onCancel} className="px-5 py-2 text-sm font-semibold text-[var(--text-secondary)] bg-[var(--bg-tertiary)] rounded-lg hover:bg-[var(--accent-secondary-hover)]">{t.cancel}</button> <button onClick={onConfirm} disabled={selectedIds.length === 0} className="px-5 py-2 text-sm font-semibold text-white bg-[var(--accent-primary)] rounded-lg hover:bg-[var(--accent-primary-hover)] disabled:opacity-50">{confirmLabel}</button> </div> </div> </div> ); };

const ColorPickerInput = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => {
    return (
        <div className="space-y-2">
            <label className="block text-xs font-semibold text-[var(--text-secondary)]">{label}</label>
            <div className="flex items-center gap-2">
                <div className="relative w-8 h-8 rounded-lg shadow-sm border border-[var(--border-secondary)] overflow-hidden flex-shrink-0 group cursor-pointer">
                    <div className="absolute inset-0 w-full h-full" style={{ backgroundColor: value }}></div>
                    <input 
                        type="color" 
                        value={value} 
                        onChange={(e) => onChange(e.target.value)} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    />
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
                <input 
                    type="text" 
                    value={value} 
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full px-2 py-1 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-md text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] uppercase"
                    maxLength={7}
                />
            </div>
        </div>
    );
};

const OpacityControl = ({ label, value, onChange }: { label: string, value: number, onChange: (val: number) => void }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">{label}</label>
        <div className="flex items-center bg-[var(--bg-primary)] rounded-xl border border-[var(--border-secondary)] h-10 px-1 w-full shadow-inner">
            <button 
                onClick={() => onChange(Math.max(0, parseFloat((value - 0.05).toFixed(2))))} 
                className="w-10 h-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors text-lg font-bold"
            >
                —
            </button>
            <div className="flex-grow text-center text-sm font-bold text-[var(--text-primary)] tabular-nums">
                {Math.round(value * 100)}%
            </div>
            <button 
                onClick={() => onChange(Math.min(1, parseFloat((value + 0.05).toFixed(2))))} 
                className="w-10 h-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors text-lg font-bold"
            >
                +
            </button>
        </div>
    </div>
);

const ReportCard: React.FC<{
    title: string;
    description: string;
    icon: React.ReactNode;
    colorGradient: string;
    onClick: () => void;
}> = ({ title, description, icon, colorGradient, onClick }) => {
    return (
        <button 
            onClick={onClick} 
            className="group flex items-center gap-4 p-4 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-secondary)] hover:border-[var(--accent-primary)] hover:shadow-md transition-all text-left w-full"
        >
            <div className={`h-12 w-12 flex-shrink-0 rounded-lg bg-gradient-to-br ${colorGradient} text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <div className="flex-grow min-w-0">
                <h4 className="font-bold text-[var(--text-primary)] mb-0.5 group-hover:text-[var(--accent-primary)] transition-colors truncate">{title}</h4>
                <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{description}</p>
            </div>
        </button>
    );
};

const SettingsPage: React.FC<SettingsPageProps> = ({
  t, language, setLanguage, theme, setTheme, themeColors, onColorChange, onResetTheme, navDesign, setNavDesign, navShape, setNavShape, navShowLabels, setNavShowLabels, navBtnAlphaSelected, setNavBtnAlphaSelected, navBtnAlphaUnselected, setNavBtnAlphaUnselected, navBarAlpha, setNavBarAlpha, navBarColor, setNavBarColor, navAnimation, setNavAnimation, fontSize, setFontSize, appFont, setAppFont, schoolConfig, onUpdateSchoolConfig, classes, teachers, subjects, adjustments, leaveDetails, attendance
}) => {
  const [isThemeOptionsOpen, setIsThemeOptionsOpen] = useState(false); 
  const [isInterfaceOptionsOpen, setIsInterfaceOptionsOpen] = useState(false);
  const [isPrintSectionOpen, setIsPrintSectionOpen] = useState(false);
  const [isDesignDefaultsOpen, setIsDesignDefaultsOpen] = useState(false);
  
  const [workloadReportMode, setWorkloadReportMode] = useState<'weekly' | 'range'>('weekly');
  const [workloadStartDate, setWorkloadStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [workloadEndDate, setWorkloadEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [selectedWeekDate, setSelectedWeekDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceReportDate, setAttendanceReportDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
      if (workloadReportMode === 'weekly') {
          const date = new Date(selectedWeekDate);
          const day = date.getDay() || 7; 
          if (day !== 1) date.setHours(-24 * (day - 1)); 
          const start = new Date(date);
          const end = new Date(date);
          end.setDate(date.getDate() + 6); 
          
          setWorkloadStartDate(start.toISOString().split('T')[0]);
          setWorkloadEndDate(end.toISOString().split('T')[0]);
      }
  }, [selectedWeekDate, workloadReportMode]);

  const [isBasicInfoPreviewOpen, setIsBasicInfoPreviewOpen] = useState(false);
  const [isTeacherSelectionForWorkloadOpen, setIsTeacherSelectionForWorkloadOpen] = useState(false);
  const [selectedTeacherIdsForWorkload, setSelectedTeacherIdsForWorkload] = useState<string[]>([]);
  const [isWorkloadPreviewOpen, setIsWorkloadPreviewOpen] = useState(false);
  const [isByPeriodPreviewOpen, setIsByPeriodPreviewOpen] = useState(false);
  const [isSchoolTimingsPreviewOpen, setIsSchoolTimingsPreviewOpen] = useState(false);
  const [isClassSelectionForPrintOpen, setIsClassSelectionForPrintOpen] = useState(false);
  const [selectedClassIdsForPrint, setSelectedClassIdsForPrint] = useState<string[]>([]);
  const [isClassTimetablePreviewOpen, setIsClassTimetablePreviewOpen] = useState(false);
  const [isTeacherSelectionForPrintOpen, setIsTeacherSelectionForPrintOpen] = useState(false);
  const [selectedTeacherIdsForPrint, setSelectedTeacherIdsForPrint] = useState<string[]>([]);
  const [isTeacherTimetablePreviewOpen, setIsTeacherTimetablePreviewOpen] = useState(false);
  const [isAlternativePreviewOpen, setIsAlternativePreviewOpen] = useState(false);
  const [isAttendanceReportPreviewOpen, setIsAttendanceReportPreviewOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const visibleClasses = useMemo(() => classes.filter(c => c.id !== 'non-teaching-duties'), [classes]);
  const handleWorkloadReportClick = () => { const idsToSelect = teachers.filter(t => { const name = t.nameEn.toUpperCase(); return !name.includes('MIAN M. YOUNAS') && !name.includes('MIAN M. YOUNIS'); }).map(t => t.id); setWorkloadReportMode('weekly'); setSelectedWeekDate(new Date().toISOString().split('T')[0]); setSelectedTeacherIdsForWorkload(idsToSelect); setIsTeacherSelectionForWorkloadOpen(true); };
  const handleWorkloadConfirm = () => { setIsTeacherSelectionForWorkloadOpen(false); setIsWorkloadPreviewOpen(true); };
  const handleClassTimetableClick = () => { setSelectedClassIdsForPrint(visibleClasses.map(c => c.id)); setIsClassSelectionForPrintOpen(true); };
  const handleClassPrintConfirm = () => { setIsClassSelectionForPrintOpen(false); setIsClassTimetablePreviewOpen(true); };
  const handleTeacherTimetableClick = () => { setSelectedTeacherIdsForPrint(teachers.map(t => t.id)); setIsTeacherSelectionForPrintOpen(true); };
  const handleTeacherPrintConfirm = () => { setIsTeacherSelectionForPrintOpen(false); setIsTeacherTimetablePreviewOpen(true); };
  const teacherItems = useMemo(() => teachers.map(t => ({ id: t.id, label: <span>{t.nameEn} / <span className="font-urdu">{t.nameUr}</span></span> })), [teachers]);
  const classItems = useMemo(() => visibleClasses.map(c => ({ id: c.id, label: <span>{c.nameEn} / <span className="font-urdu">{c.nameUr}</span></span> })), [visibleClasses]);

  const handleCardStyleChange = (type: 'class' | 'teacher', style: CardStyle) => {
    onUpdateSchoolConfig({
        downloadDesigns: {
            ...schoolConfig.downloadDesigns,
            [type]: {
                ...schoolConfig.downloadDesigns[type],
                table: {
                    ...schoolConfig.downloadDesigns[type].table,
                    cardStyle: style
                }
            }
        }
    });
  };

  const handleTriangleCornerChange = (type: 'class' | 'teacher', corner: TriangleCorner) => {
    onUpdateSchoolConfig({
        downloadDesigns: {
            ...schoolConfig.downloadDesigns,
            [type]: {
                ...schoolConfig.downloadDesigns[type],
                table: {
                    ...schoolConfig.downloadDesigns[type].table,
                    triangleCorner: corner
                }
            }
        }
    });
  };

  const handleOutlineWidthChange = (type: 'class' | 'teacher', width: number) => {
    onUpdateSchoolConfig({
        downloadDesigns: {
            ...schoolConfig.downloadDesigns,
            [type]: {
                ...schoolConfig.downloadDesigns[type],
                table: {
                    ...schoolConfig.downloadDesigns[type].table,
                    outlineWidth: width
                }
            }
        }
    });
  };

  const handleMergeToggle = (type: 'class' | 'teacher', merge: boolean) => {
    onUpdateSchoolConfig({
        downloadDesigns: {
            ...schoolConfig.downloadDesigns,
            [type]: {
                ...schoolConfig.downloadDesigns[type],
                table: {
                    ...schoolConfig.downloadDesigns[type].table,
                    mergeIdenticalPeriods: merge
                }
            }
        }
    });
  };

  const handleBadgeTargetChange = (type: 'class' | 'teacher', target: 'subject' | 'teacher' | 'class') => {
    onUpdateSchoolConfig({
        downloadDesigns: {
            ...schoolConfig.downloadDesigns,
            [type]: {
                ...schoolConfig.downloadDesigns[type],
                table: {
                    ...schoolConfig.downloadDesigns[type].table,
                    badgeTarget: target
                }
            }
        }
    });
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 pb-24">
       {/* ... (Previous modals remain unchanged) ... */}
       {isAboutOpen && (<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-fade-in" onClick={() => setIsAboutOpen(false)}><div className="bg-[var(--bg-secondary)] rounded-2xl shadow-2xl p-8 max-w-sm w-full transform transition-all scale-100" onClick={e => e.stopPropagation()}><div className="text-center mb-8"><div className="flex justify-center mb-4">{schoolConfig.schoolLogoBase64 ? (<img src={schoolConfig.schoolLogoBase64} alt="School Logo" className="w-64 h-64 object-contain rounded-xl shadow-sm bg-white p-1" />) : (<div className="w-48 h-48 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 shadow-inner"><svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>)}</div><h3 className="text-2xl font-bold text-[var(--text-primary)] mb-1">About Mr. TMS</h3><p className="text-[var(--text-secondary)] text-sm">Timetable Management System</p></div><div className="space-y-4"><a href="https://wa.me/923009541797" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-[#e9f5e9] hover:bg-[#dceddd] border border-[#c8e6c9] rounded-xl transition-all group"><div className="p-2 bg-white rounded-full text-[#25D366] shadow-sm"><WhatsAppLogo /></div><div className="text-left"><div className="font-bold text-gray-800 text-sm">Contact Support</div><div className="text-xs text-gray-600">+92 300 9541797</div></div></a><a href="https://whatsapp.com/channel/0029VaU50UPADTOEpHNSJa0r" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-[#e9f5e9] hover:bg-[#dceddd] border border-[#c8e6c9] rounded-xl transition-all group"><div className="p-2 bg-white rounded-full text-[#25D366] shadow-sm"><BroadcastIcon /></div><div className="text-left"><div className="font-bold text-gray-800 text-sm">WhatsApp Channel</div><div className="text-xs text-gray-600">Stay updated with news</div></div></a></div><button onClick={() => setIsAboutOpen(false)} className="mt-8 w-full py-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Close</button></div></div>)}
       
       {/* ... (Other selection modals) ... */}
       <SelectionModal isOpen={isTeacherSelectionForWorkloadOpen} title={t.selectTeachersToDownload} items={teacherItems} selectedIds={selectedTeacherIdsForWorkload} onSelect={(id, checked) => setSelectedTeacherIdsForWorkload(prev => checked ? [...prev, id] : prev.filter(tid => tid !== id))} onSelectAll={(checked) => setSelectedTeacherIdsForWorkload(checked ? teachers.map(t => t.id) : [])} onConfirm={handleWorkloadConfirm} onCancel={() => setIsTeacherSelectionForWorkloadOpen(false)} confirmLabel={t.workloadReport} t={t}>
            <div className="mb-4 space-y-4">
                <div className="flex bg-[var(--bg-tertiary)] p-1 rounded-lg border border-[var(--border-secondary)]">
                    <button onClick={() => setWorkloadReportMode('weekly')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${workloadReportMode === 'weekly' ? 'bg-[var(--accent-primary)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>Weekly Summary</button>
                    <button onClick={() => setWorkloadReportMode('range')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${workloadReportMode === 'range' ? 'bg-[var(--accent-primary)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>Date Range</button>
                </div>
                
                {workloadReportMode === 'weekly' && (
                    <div className="bg-[var(--bg-tertiary)] p-3 rounded-lg border border-[var(--border-secondary)] animate-scale-in">
                        <label className="block text-xs text-[var(--text-secondary)] mb-1">Select Week (Any date)</label>
                        <input type="date" value={selectedWeekDate} onChange={(e) => setSelectedWeekDate(e.target.value)} className="block w-full px-2 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-md text-sm text-[var(--text-primary)]" />
                        <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                            Week: {workloadStartDate} to {workloadEndDate}
                        </p>
                    </div>
                )}

                {workloadReportMode === 'range' && (
                    <div className="grid grid-cols-2 gap-3 bg-[var(--bg-tertiary)] p-3 rounded-lg border border-[var(--border-secondary)] animate-scale-in">
                        <div>
                            <label className="block text-xs text-[var(--text-secondary)] mb-1">{t.startDate}</label>
                            <input type="date" value={workloadStartDate} onChange={(e) => setWorkloadStartDate(e.target.value)} className="block w-full px-2 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg text-[var(--text-primary)] focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] shadow-sm" />
                        </div>
                        <div>
                            <label className="block text-xs text-[var(--text-secondary)] mb-1">{t.endDate}</label>
                            <input type="date" value={workloadEndDate} onChange={(e) => setWorkloadEndDate(e.target.value)} className="block w-full px-2 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg text-[var(--text-primary)] focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] shadow-sm" />
                        </div>
                    </div>
                )}
            </div>
       </SelectionModal>
       
       <SelectionModal isOpen={isClassSelectionForPrintOpen} title={t.selectClassesToDownload} items={classItems} selectedIds={selectedClassIdsForPrint} onSelect={(id, checked) => setSelectedClassIdsForPrint(prev => checked ? [...prev, id] : prev.filter(cid => cid !== id))} onSelectAll={(checked) => setSelectedClassIdsForPrint(checked ? visibleClasses.map(c => c.id) : [])} onConfirm={handleClassPrintConfirm} onCancel={() => setIsClassSelectionForPrintOpen(false)} confirmLabel={t.printViewAction} t={t} />
       <SelectionModal isOpen={isTeacherSelectionForPrintOpen} title={t.selectTeachersToDownload} items={teacherItems} selectedIds={selectedTeacherIdsForPrint} onSelect={(id, checked) => setSelectedTeacherIdsForPrint(prev => checked ? [...prev, id] : prev.filter(tid => tid !== id))} onSelectAll={(checked) => setSelectedTeacherIdsForPrint(checked ? teachers.map(t => t.id) : [])} onConfirm={handleTeacherPrintConfirm} onCancel={() => setIsTeacherSelectionForPrintOpen(false)} confirmLabel={t.printViewAction} t={t} />

       {/* ... (Print previews) ... */}
       <PrintPreview t={t} isOpen={isBasicInfoPreviewOpen} onClose={() => setIsBasicInfoPreviewOpen(false)} title={t.basicInformation} fileNameBase="Basic_Information" generateHtml={(lang, options) => generateBasicInformationHtml(t, lang, options, visibleClasses, teachers, schoolConfig)} onGenerateExcel={(lang, options) => generateBasicInformationExcel(t, lang, options, visibleClasses, teachers)} designConfig={schoolConfig.downloadDesigns.basicInfo} onSaveDesign={(newDesign) => onUpdateSchoolConfig({ downloadDesigns: { ...schoolConfig.downloadDesigns, basicInfo: newDesign }})} />
       <PrintPreview t={t} isOpen={isWorkloadPreviewOpen} onClose={() => setIsWorkloadPreviewOpen(false)} title={t.workloadSummaryReport} fileNameBase="Teacher_Workload_Summary" generateHtml={(lang, options) => { const selectedTeachers = teachers.filter(t => selectedTeacherIdsForWorkload.includes(t.id)); return generateWorkloadSummaryHtml(t, lang, options, selectedTeachers, schoolConfig, classes, adjustments, leaveDetails, workloadStartDate, workloadEndDate, workloadReportMode); }} onGenerateExcel={(lang, options) => { const selectedTeachers = teachers.filter(t => selectedTeacherIdsForWorkload.includes(t.id)); generateWorkloadSummaryExcel(t, lang, options, selectedTeachers, schoolConfig, classes, adjustments, leaveDetails, workloadStartDate, workloadEndDate, workloadReportMode) }} designConfig={schoolConfig.downloadDesigns.workload} onSaveDesign={(newDesign) => onUpdateSchoolConfig({ downloadDesigns: { ...schoolConfig.downloadDesigns, workload: newDesign }})} />
       <PrintPreview t={t} isOpen={isByPeriodPreviewOpen} onClose={() => setIsByPeriodPreviewOpen(false)} title={t.byPeriod} fileNameBase="Free_Teachers_Report" generateHtml={(lang, options) => generateByPeriodHtml(t, lang, options, schoolConfig, classes, teachers)} onGenerateExcel={(lang, options) => generateByPeriodExcel(t, lang, options, schoolConfig, classes, teachers)} designConfig={schoolConfig.downloadDesigns.alternative} onSaveDesign={(newDesign) => onUpdateSchoolConfig({ downloadDesigns: { ...schoolConfig.downloadDesigns, alternative: newDesign }})} />
       <PrintPreview t={t} isOpen={isSchoolTimingsPreviewOpen} onClose={() => setIsSchoolTimingsPreviewOpen(false)} title={t.schoolTimings} fileNameBase="School_Timings" generateHtml={(lang, options) => generateSchoolTimingsHtml(t, lang, options, schoolConfig)} designConfig={schoolConfig.downloadDesigns.schoolTimings} onSaveDesign={(newDesign) => onUpdateSchoolConfig({ downloadDesigns: { ...schoolConfig.downloadDesigns, schoolTimings: newDesign }})} />
       <PrintPreview t={t} isOpen={isClassTimetablePreviewOpen} onClose={() => setIsClassTimetablePreviewOpen(false)} title={t.classTimetable} fileNameBase="Class_Timetables" generateHtml={(lang, options) => { const selectedClasses = visibleClasses.filter(c => selectedClassIdsForPrint.includes(c.id)); 
       return (selectedClasses.map(c => generateClassTimetableHtml(c, lang, options, teachers, subjects, schoolConfig)) as any).flat(); }} designConfig={schoolConfig.downloadDesigns.class} onSaveDesign={(newDesign) => onUpdateSchoolConfig({ downloadDesigns: { ...schoolConfig.downloadDesigns, class: newDesign }})} />
       <PrintPreview t={t} isOpen={isTeacherTimetablePreviewOpen} onClose={() => setIsTeacherTimetablePreviewOpen(false)} title={t.teacherTimetable} fileNameBase="Teacher_Timetables" generateHtml={(lang, options) => { const selectedTeachers = teachers.filter(t => selectedTeacherIdsForPrint.includes(t.id)); 
       return (selectedTeachers.map(t => generateTeacherTimetableHtml(t, lang, options, classes, subjects, schoolConfig, adjustments, teachers)) as any).flat(); }} designConfig={schoolConfig.downloadDesigns.teacher} onSaveDesign={(newDesign) => onUpdateSchoolConfig({ downloadDesigns: { ...schoolConfig.downloadDesigns, teacher: newDesign }})} />
       <PrintPreview t={t} isOpen={isAlternativePreviewOpen} onClose={() => setIsAlternativePreviewOpen(false)} title={t.dailyAdjustments} fileNameBase={`Adjustments_${new Date().toISOString().split('T')[0]}`} generateHtml={(lang, options) => { const today = new Date().toISOString().split('T')[0]; const todayAdjustments = adjustments[today] || []; return generateAdjustmentsReportHtml(t, lang, options, todayAdjustments, teachers, visibleClasses, subjects, schoolConfig, today, []); }} onGenerateExcel={(lang, options) => { const today = new Date().toISOString().split('T')[0]; const todayAdjustments = adjustments[today] || []; generateAdjustmentsExcel(t, todayAdjustments, teachers, visibleClasses, subjects, today); }} designConfig={schoolConfig.downloadDesigns.adjustments} onSaveDesign={(newDesign) => onUpdateSchoolConfig({ downloadDesigns: { ...schoolConfig.downloadDesigns, adjustments: newDesign }})} />
       <PrintPreview 
            t={t} 
            isOpen={isAttendanceReportPreviewOpen} 
            onClose={() => setIsAttendanceReportPreviewOpen(false)} 
            title={t.attendanceReport} 
            fileNameBase={`Attendance_Report_${attendanceReportDate}`} 
            generateHtml={(lang, design) => generateAttendanceReportHtml(t, lang, design, classes, teachers, schoolConfig, attendanceReportDate, adjustments, leaveDetails || {}, attendance)} 
            onGenerateExcel={(lang) => generateAttendanceReportExcel(t, lang, classes, teachers, attendanceReportDate, adjustments, leaveDetails || {}, attendance)}
            designConfig={schoolConfig.downloadDesigns.attendance} 
            onSaveDesign={(newDesign) => onUpdateSchoolConfig({ downloadDesigns: { ...schoolConfig.downloadDesigns, attendance: newDesign }})}
        />

      <div className="max-w-4xl mx-auto relative">
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-[var(--text-primary)]">{t.settings}</h2>
        </div>
        
        <div className="bg-[var(--bg-secondary)] rounded-lg shadow-md border border-[var(--border-primary)] mb-8 overflow-hidden">
            <button className="w-full flex justify-between items-center p-6 text-left" onClick={() => setIsThemeOptionsOpen(!isThemeOptionsOpen)}>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">{t.theme}</h3>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transform transition-transform text-[var(--text-secondary)] ${isThemeOptionsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            <div className={`grid transition-all duration-500 ${isThemeOptionsOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                    <div className="p-6 pt-0">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {themeOptions.map(themeInfo => (
                                <ThemeCard 
                                    key={themeInfo.id} 
                                    id={themeInfo.id}
                                    name={themeInfo.name}
                                    colors={themeInfo.colors}
                                    currentTheme={theme} 
                                    setTheme={setTheme} 
                                />
                            ))}
                        </div>
                        
                        <div className="mt-8 pt-6 border-t border-[var(--border-secondary)]">
                            <div className="flex justify-between items-end mb-4">
                                <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Customize {themeOptions.find(t => t.id === theme)?.name} Theme</h4>
                                <button onClick={onResetTheme} className="text-xs text-red-500 hover:text-red-700 font-semibold hover:underline">Reset to Default</button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-[var(--bg-tertiary)]/50 p-4 rounded-xl border border-[var(--border-secondary)]">
                                <ColorPickerInput label="Background" value={themeColors.bgPrimary} onChange={(val) => onColorChange('bgPrimary', val)} />
                                <ColorPickerInput label="Surface (Cards)" value={themeColors.bgSecondary} onChange={(val) => onColorChange('bgSecondary', val)} />
                                <ColorPickerInput label="Text Color" value={themeColors.textPrimary} onChange={(val) => onColorChange('textPrimary', val)} />
                                <ColorPickerInput label="Accent Color" value={themeColors.accentPrimary} onChange={(val) => onColorChange('accentPrimary', val)} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-[var(--bg-secondary)] rounded-lg shadow-md border border-[var(--border-primary)] mb-8 overflow-hidden">
            <button className="w-full flex justify-between items-center p-6 text-left" onClick={() => setIsDesignDefaultsOpen(!isDesignDefaultsOpen)}>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">Design Defaults</h3>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transform transition-transform text-[var(--text-secondary)] ${isDesignDefaultsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            <div className={`grid transition-all duration-500 ${isDesignDefaultsOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                    <div className="p-6 pt-0 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                            {/* Class Timetable Design Column */}
                            <div className="space-y-6">
                                <h4 className="font-black text-xs uppercase tracking-widest text-[var(--accent-primary)] border-b border-[var(--border-primary)] pb-2 mb-4">Class Timetable Defaults</h4>
                                <div className="flex items-center justify-between bg-[var(--bg-tertiary)] p-3 rounded-lg border border-[var(--border-secondary)]">
                                    <div>
                                        <span className="block text-sm font-semibold text-[var(--text-primary)]">Merge Patterns</span>
                                        <span className="text-[10px] text-[var(--text-secondary)]">Combine identical consecutive periods</span>
                                    </div>
                                    <button 
                                        onClick={() => handleMergeToggle('class', !(schoolConfig.downloadDesigns.class.table.mergeIdenticalPeriods ?? true))}
                                        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${ (schoolConfig.downloadDesigns.class.table.mergeIdenticalPeriods ?? true) ? 'bg-[var(--accent-primary)]' : 'bg-gray-300'}`}
                                    >
                                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${ (schoolConfig.downloadDesigns.class.table.mergeIdenticalPeriods ?? true) ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Card Style</label>
                                    <select 
                                        value={schoolConfig.downloadDesigns.class.table.cardStyle || 'full'}
                                        onChange={(e) => handleCardStyleChange('class', e.target.value as CardStyle)}
                                        className="w-full p-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg text-sm text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] outline-none"
                                    >
                                        {cardStyleOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>
                                {schoolConfig.downloadDesigns.class.table.cardStyle === 'badge' && (
                                    <div className="animate-scale-in">
                                        <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Badge Target</label>
                                        <select 
                                            value={schoolConfig.downloadDesigns.class.table.badgeTarget || 'subject'}
                                            onChange={(e) => handleBadgeTargetChange('class', e.target.value as any)}
                                            className="w-full p-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg text-sm text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] outline-none"
                                        >
                                            <option value="subject">Subject</option>
                                            <option value="teacher">Teacher</option>
                                        </select>
                                    </div>
                                )}
                                {/* ... (Rest of Class Options) */}
                                {schoolConfig.downloadDesigns.class.table.cardStyle === 'outline' && (
                                    <div className="animate-scale-in">
                                        <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Outline Thickness (px)</label>
                                        <div className="flex items-center gap-3">
                                            <input 
                                                type="range" 
                                                min="0.5" 
                                                max="10" 
                                                step="0.5"
                                                value={schoolConfig.downloadDesigns.class.table.outlineWidth || 2}
                                                onChange={(e) => handleOutlineWidthChange('class', parseFloat(e.target.value))}
                                                className="flex-grow h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]"
                                            />
                                            <span className="text-sm font-bold w-10 text-center">{schoolConfig.downloadDesigns.class.table.outlineWidth || 2}</span>
                                        </div>
                                    </div>
                                )}
                                {schoolConfig.downloadDesigns.class.table.cardStyle === 'triangle' && (
                                    <div className="animate-scale-in">
                                        <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Triangle Corner</label>
                                        <select 
                                            value={schoolConfig.downloadDesigns.class.table.triangleCorner || 'bottom-left'}
                                            onChange={(e) => handleTriangleCornerChange('class', e.target.value as TriangleCorner)}
                                            className="w-full p-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg text-sm text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] outline-none"
                                        >
                                            {triangleCornerOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Teacher Timetable Design Column */}
                            <div className="space-y-6">
                                <h4 className="font-black text-xs uppercase tracking-widest text-[var(--accent-primary)] border-b border-[var(--border-primary)] pb-2 mb-4">Teacher Timetable Defaults</h4>
                                {/* ... (Teacher Config same as before) ... */}
                                <div className="flex items-center justify-between bg-[var(--bg-tertiary)] p-3 rounded-lg border border-[var(--border-secondary)]">
                                    <div>
                                        <span className="block text-sm font-semibold text-[var(--text-primary)]">Merge Patterns</span>
                                        <span className="text-[10px] text-[var(--text-secondary)]">Combine identical consecutive periods</span>
                                    </div>
                                    <button 
                                        onClick={() => handleMergeToggle('teacher', !(schoolConfig.downloadDesigns.teacher.table.mergeIdenticalPeriods ?? true))}
                                        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${ (schoolConfig.downloadDesigns.teacher.table.mergeIdenticalPeriods ?? true) ? 'bg-[var(--accent-primary)]' : 'bg-gray-300'}`}
                                    >
                                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${ (schoolConfig.downloadDesigns.teacher.table.mergeIdenticalPeriods ?? true) ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Card Style</label>
                                    <select 
                                        value={schoolConfig.downloadDesigns.teacher.table.cardStyle || 'full'}
                                        onChange={(e) => handleCardStyleChange('teacher', e.target.value as CardStyle)}
                                        className="w-full p-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg text-sm text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] outline-none"
                                    >
                                        {cardStyleOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>
                                {schoolConfig.downloadDesigns.teacher.table.cardStyle === 'badge' && (
                                    <div className="animate-scale-in">
                                        <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Badge Target</label>
                                        <select 
                                            value={schoolConfig.downloadDesigns.teacher.table.badgeTarget || 'subject'}
                                            onChange={(e) => handleBadgeTargetChange('teacher', e.target.value as any)}
                                            className="w-full p-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg text-sm text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] outline-none"
                                        >
                                            <option value="subject">Subject</option>
                                            <option value="class">Class</option>
                                        </select>
                                    </div>
                                )}
                                {schoolConfig.downloadDesigns.teacher.table.cardStyle === 'outline' && (
                                    <div className="animate-scale-in">
                                        <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Outline Thickness (px)</label>
                                        <div className="flex items-center gap-3">
                                            <input 
                                                type="range" 
                                                min="0.5" 
                                                max="10" 
                                                step="0.5"
                                                value={schoolConfig.downloadDesigns.teacher.table.outlineWidth || 2}
                                                onChange={(e) => handleOutlineWidthChange('teacher', parseFloat(e.target.value))}
                                                className="flex-grow h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]"
                                            />
                                            <span className="text-sm font-bold w-10 text-center">{schoolConfig.downloadDesigns.teacher.table.outlineWidth || 2}</span>
                                        </div>
                                    </div>
                                )}
                                {schoolConfig.downloadDesigns.teacher.table.cardStyle === 'triangle' && (
                                    <div className="animate-scale-in">
                                        <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Triangle Corner</label>
                                        <select 
                                            value={schoolConfig.downloadDesigns.teacher.table.triangleCorner || 'bottom-left'}
                                            onChange={(e) => handleTriangleCornerChange('teacher', e.target.value as TriangleCorner)}
                                            className="w-full p-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg text-sm text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] outline-none"
                                        >
                                            {triangleCornerOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] italic bg-[var(--bg-tertiary)]/50 p-3 rounded-lg border border-[var(--border-secondary)]">
                            Tip: These styles apply to both the PDF reports and the images generated for WhatsApp. You can also override them temporarily within the Print Preview settings.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-[var(--bg-secondary)] rounded-lg shadow-md border border-[var(--border-primary)] mb-8 overflow-hidden">
            <button className="w-full flex justify-between items-center p-6 text-left" onClick={() => setIsInterfaceOptionsOpen(!isInterfaceOptionsOpen)}>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">{t.interfaceSettings}</h3>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transform transition-transform text-[var(--text-secondary)] ${isInterfaceOptionsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            <div className={`grid transition-all duration-500 ${isInterfaceOptionsOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                {/* ... (Interface Settings content unchanged) ... */}
                <div className="overflow-hidden">
                    <div className="p-6 pt-0 space-y-8">
                         {/* GENERAL */}
                         <div>
                            <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-4 ml-1">{t.general}</h4>
                            <div className="bg-[var(--bg-tertiary)] rounded-2xl p-5 border border-[var(--border-secondary)] flex items-center justify-between shadow-sm">
                                <div>
                                    <h5 className="text-base font-bold text-[var(--text-primary)] mb-1">{t.appLanguage}</h5>
                                    <p className="text-xs text-[var(--text-secondary)]">{t.switchLanguageDesc}</p>
                                </div>
                                <div className="flex bg-[var(--bg-primary)] rounded-lg p-1 border border-[var(--border-secondary)] shadow-inner">
                                    <button
                                        onClick={() => setLanguage('en')}
                                        className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${language === 'en' ? 'bg-[var(--bg-secondary)] text-[var(--accent-primary)] shadow-sm ring-1 ring-black/5 dark:ring-white/10' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                                    >
                                        English
                                    </button>
                                    <button
                                        onClick={() => setLanguage('ur')}
                                        className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all font-urdu ${language === 'ur' ? 'bg-[var(--bg-secondary)] text-[var(--accent-primary)] shadow-sm ring-1 ring-black/5 dark:ring-white/10' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                                    >
                                        اردو
                                    </button>
                                </div>
                            </div>
                        </div>

                         {/* GLOBAL TYPOGRAPHY */}
                         <div>
                            <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-4 ml-1">{t.globalTypography}</h4>
                            
                            <div className="space-y-6">
                                {/* Font Size */}
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-3 ml-1">Global Font Size: {fontSize}px</label>
                                    <div className="bg-[var(--bg-tertiary)] rounded-2xl p-5 border border-[var(--border-secondary)] flex items-center gap-4 shadow-sm">
                                        <span className="text-xs font-bold text-[var(--text-secondary)]">A</span>
                                        <input 
                                            type="range" 
                                            min="10" 
                                            max="16" 
                                            step="1" 
                                            value={fontSize} 
                                            onChange={(e) => setFontSize(parseInt(e.target.value))} 
                                            className="w-full h-1.5 bg-[var(--bg-primary)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]" 
                                        />
                                        <span className="text-lg font-bold text-[var(--text-primary)]">A</span>
                                    </div>
                                </div>

                                {/* App Font */}
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-3 ml-1">{t.appFont}</label>
                                    <div className="relative group">
                                        <select 
                                            value={appFont} 
                                            onChange={(e) => setAppFont(e.target.value)} 
                                            className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm font-medium rounded-2xl p-4 border border-[var(--border-secondary)] appearance-none outline-none focus:border-[var(--accent-primary)] transition-colors shadow-sm cursor-pointer"
                                            style={{ fontFamily: appFont === 'CustomAppFont' ? 'inherit' : appFont }}
                                        >
                                            {appFontOptions.map((opt) => (
                                                <option key={opt.value} value={opt.value} style={{ fontFamily: opt.value === 'CustomAppFont' ? 'inherit' : opt.value }}>{opt.label}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* NAVIGATION BAR */}
                        <div>
                            <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-4 ml-1">{t.navigationBar}</h4>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                {/* Button Labels */}
                                <div className="bg-[var(--bg-tertiary)] rounded-2xl p-5 border border-[var(--border-secondary)] flex items-center justify-between shadow-sm">
                                    <span className="text-sm font-bold text-[var(--text-primary)] leading-tight">{t.showButtonLabels}</span>
                                    <button 
                                        onClick={() => setNavShowLabels(!navShowLabels)} 
                                        className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${navShowLabels ? 'bg-[var(--accent-primary)]' : 'bg-gray-300 dark:bg-gray-600'}`}
                                    >
                                        <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${navShowLabels ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                {/* Animate */}
                                <div className="bg-[var(--bg-tertiary)] rounded-2xl p-5 border border-[var(--border-secondary)] flex items-center justify-between shadow-sm">
                                    <span className="text-sm font-bold text-[var(--text-primary)] leading-tight">Animate</span>
                                    <button 
                                        onClick={() => setNavAnimation(!navAnimation)} 
                                        className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${navAnimation ? 'bg-[var(--accent-primary)]' : 'bg-gray-300 dark:bg-gray-600'}`}
                                    >
                                        <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${navAnimation ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>

                            {/* Opacity & Surface Card */}
                            <div className="bg-[var(--bg-tertiary)] rounded-2xl p-6 border border-[var(--border-secondary)] space-y-8 shadow-sm">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    <OpacityControl label={t.selectedOpacity} value={navBtnAlphaSelected} onChange={setNavBtnAlphaSelected} />
                                    <OpacityControl label={t.unselectedOpacity} value={navBtnAlphaUnselected} onChange={setNavBtnAlphaUnselected} />
                                </div>
                                
                                <div className="h-px bg-[var(--border-secondary)] w-full"></div>

                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">BAR SURFACE</span>
                                        {navBarColor && (
                                            <button onClick={() => setNavBarColor('')} className="text-[10px] font-bold text-red-500 hover:text-red-400 uppercase tracking-wider transition-colors">RESET</button>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center gap-4">
                                         <div className="relative w-10 h-10 rounded-full shadow-sm border border-[var(--border-secondary)] overflow-hidden cursor-pointer hover:scale-110 transition-transform ring-2 ring-transparent hover:ring-[var(--accent-primary)]">
                                             <div className="absolute inset-0" style={{ backgroundColor: navBarColor || 'transparent', backgroundImage: navBarColor ? 'none' : 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)', backgroundSize: '8px 8px' }}></div>
                                             <input type="color" value={navBarColor || '#ffffff'} onChange={(e) => setNavBarColor(e.target.value)} className="opacity-0 absolute inset-0 cursor-pointer" />
                                        </div>
                                        
                                        <div className="flex items-center bg-[var(--bg-primary)] rounded-xl border border-[var(--border-secondary)] h-10 px-1 shadow-inner">
                                            <button onClick={() => setNavBarAlpha(Math.max(0, parseFloat((navBarAlpha - 0.1).toFixed(1))))} className="w-10 h-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors text-lg font-bold">—</button>
                                            <span className="w-12 text-center text-sm font-bold text-[var(--text-primary)] tabular-nums">{Math.round(navBarAlpha * 100)}%</span>
                                            <button onClick={() => setNavBarAlpha(Math.min(1, parseFloat((navBarAlpha + 0.1).toFixed(1))))} className="w-10 h-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors text-lg font-bold">+</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>



        <button onClick={() => setIsAboutOpen(true)} className="fixed bottom-24 right-6 xl:bottom-8 xl:right-8 z-40 bg-[var(--accent-primary)] text-white w-12 h-12 rounded-full shadow-lg hover:shadow-xl hover:bg-[var(--accent-primary-hover)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center" title="About Mr. TMS"><AboutIcon /></button>
      </div>
    </div>
  );
};

export default SettingsPage;
