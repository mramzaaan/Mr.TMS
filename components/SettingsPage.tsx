
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
  navPosition: NavPosition;
  setNavPosition: (pos: NavPosition) => void;
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
    { label: 'Gulzar (Urdu)', value: 'Gulzar' },
    { label: 'Noto Nastaliq Urdu (Google)', value: 'Noto Nastaliq Urdu' },
    { label: 'Amiri (Naskh)', value: 'Amiri' },
    { label: 'Aref Ruqaa (Calligraphic)', value: 'Aref Ruqaa' },
    { label: 'Times New Roman', value: 'Times New Roman' },
    { label: 'Arial', value: 'Arial' },
    { label: 'Impact', value: 'Impact' },
    { label: 'Calibri', value: 'Calibri' },
    { label: 'Verdana', value: 'Verdana' },
    { label: 'Tahoma', value: 'Tahoma' },
    { label: 'Trebuchet MS', value: 'Trebuchet MS' },
    { label: 'Segoe UI', value: 'Segoe UI' },
    { label: 'Comic Sans MS', value: 'Comic Sans MS' },
    { label: 'Lato', value: 'Lato' },
    { label: 'Roboto', value: 'Roboto' },
    { label: 'Open Sans', value: 'Open Sans' },
    { label: 'Montserrat', value: 'Montserrat' },
    { label: 'Antonio', value: 'Antonio' },
    { label: 'Monoton', value: 'Monoton' },
    { label: 'Rubik Mono One', value: 'Rubik Mono One' },
    { label: 'Bodoni Moda', value: 'Bodoni Moda' },
    { label: 'Bungee Spice', value: 'Bungee Spice' },
    { label: 'Bebas Neue', value: 'Bebas Neue' },
    { label: 'Playfair Display', value: 'Playfair Display' },
    { label: 'Oswald', value: 'Oswald' },
    { label: 'Anton', value: 'Anton' },
    { label: 'Instrument Serif', value: 'Instrument Serif' },
    { label: 'Orbitron', value: 'Orbitron' },
    { label: 'Fjalla One', value: 'Fjalla One' },
    { label: 'Playwrite', value: 'Playwrite CU' },
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

const StyleOption: React.FC<{
    design: NavDesign;
    isActive: boolean;
    onClick: () => void;
    shape: NavShape;
}> = ({ design, isActive, onClick, shape }) => {
    let innerShapeClass = 'rounded-md';
    
    if (shape === 'square') innerShapeClass = 'rounded-none';
    else if (shape === 'pill' || shape === 'circle') innerShapeClass = 'rounded-full';
    else if (shape === 'leaf') innerShapeClass = 'rounded-tr-3xl rounded-bl-3xl';
    else if (shape === 'squircle') innerShapeClass = 'rounded-[18px]';
    else if (shape === 'diamond') innerShapeClass = 'rounded-lg rotate-45';
    else if (shape === 'arch') innerShapeClass = 'rounded-t-full rounded-b-xl';
    else if (shape === 'shield') innerShapeClass = 'rounded-t-2xl rounded-b-[45%]';
    else if (shape === 'petal') innerShapeClass = 'rounded-tl-3xl rounded-tr-md rounded-br-3xl rounded-bl-md';

    let btnContainerClass = `flex items-center justify-center w-12 h-12 transition-all duration-300 ${innerShapeClass}`;
    let btnIconClass = "h-5 w-5 z-10 relative";
    
    if (design === 'classic') {
         btnContainerClass += ' bg-[var(--accent-secondary)] text-[var(--accent-primary)] shadow-lg';
    } else if (design === 'modern') {
         btnContainerClass += ' bg-[var(--accent-primary)] text-white shadow-xl shadow-[var(--accent-primary)]/40';
    } else if (design === 'minimal') {
        if (shape === 'circle' || shape === 'diamond' || shape === 'pill') {
            btnContainerClass += ' bg-[var(--bg-tertiary)] ring-2 ring-[var(--accent-primary)] text-[var(--accent-primary)]';
        } else {
            btnContainerClass += ' bg-[var(--bg-tertiary)] border-b-4 border-[var(--accent-primary)] text-[var(--accent-primary)] !rounded-none';
        }
    } else if (design === '3d') {
         btnContainerClass += ' bg-gradient-to-b from-[var(--accent-primary)] to-[var(--accent-primary-hover)] text-white shadow-[0_4px_0_var(--accent-primary-hover)]';
    } else if (design === 'gradient') {
         btnContainerClass += ' bg-gradient-to-tr from-[var(--accent-primary)] via-purple-500 to-pink-500 text-white shadow-lg';
    } else if (design === 'outline') {
         btnContainerClass += ' border-2 border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] shadow-md';
    } else if (design === 'crystal') {
         btnContainerClass += ' bg-white/60 dark:bg-white/20 border border-white/50 text-[var(--accent-primary)] shadow-[0_0_10px_rgba(255,255,255,0.5)] backdrop-blur-md';
    } else if (design === 'soft') {
         btnContainerClass += ' bg-[var(--bg-secondary)] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.1)] text-[var(--accent-primary)]';
    } else if (design === 'transparent') {
         btnContainerClass += ' bg-transparent text-[var(--accent-primary)] scale-110 font-bold drop-shadow-md';
    }

    if (shape === 'diamond') btnIconClass += " -rotate-45";

    return (
        <button
            onClick={onClick}
            className={`group relative flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 w-full aspect-[4/3] overflow-hidden ${
                isActive 
                ? 'bg-[var(--bg-secondary)] border-2 border-[var(--accent-primary)] shadow-md' 
                : 'bg-[var(--bg-tertiary)]/50 border-2 border-transparent hover:bg-[var(--bg-secondary)] hover:border-[var(--border-secondary)]'
            }`}
        >
            <div className={btnContainerClass}>
                <svg xmlns="http://www.w3.org/2000/svg" className={btnIconClass} viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 000 1.414l7 7a1 1 0 001.414 0l7-7a1 1 0 000-1.414l-7-7z" />
                </svg>
            </div>
            <span className={`mt-2 text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}>
                {design}
            </span>
            {isActive && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-[var(--accent-primary)] rounded-full flex items-center justify-center shadow-sm animate-scale-in">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </div>
            )}
        </button>
    );
};

const ShapeOption: React.FC<{
    shape: NavShape;
    isActive: boolean;
    onClick: () => void;
}> = ({ shape, isActive, onClick }) => {
    
    let shapeClass = "bg-[var(--accent-primary)] shadow-sm transition-all duration-300 flex items-center justify-center ";
    const sizeClass = "w-10 h-10"; 

    switch (shape) {
        case 'square': shapeClass += `rounded-none ${sizeClass}`; break;
        case 'pill': shapeClass += 'rounded-full w-14 h-8'; break; 
        case 'circle': shapeClass += `rounded-full ${sizeClass}`; break;
        case 'leaf': shapeClass += `rounded-tr-3xl rounded-bl-3xl ${sizeClass}`; break;
        case 'squircle': shapeClass += `rounded-[18px] ${sizeClass}`; break;
        case 'diamond': shapeClass += `rounded-lg ${sizeClass} rotate-45 scale-75`; break;
        case 'arch': shapeClass += `rounded-t-full rounded-b-xl ${sizeClass}`; break;
        case 'shield': shapeClass += `rounded-t-2xl rounded-b-[45%] ${sizeClass}`; break;
        case 'petal': shapeClass += `rounded-tl-3xl rounded-tr-md rounded-br-3xl rounded-bl-md ${sizeClass}`; break;
    }

    return (
        <button
            onClick={onClick}
            className={`group relative flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 w-full aspect-square ${
                isActive 
                ? 'bg-[var(--bg-secondary)] border-2 border-[var(--accent-primary)] shadow-md' 
                : 'bg-[var(--bg-tertiary)]/50 border-2 border-transparent hover:bg-[var(--bg-secondary)] hover:border-[var(--border-secondary)]'
            }`}
        >
            <div className="w-14 h-14 flex items-center justify-center">
                <div className={shapeClass}>
                    <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>
                </div>
            </div>
            
            <span className={`mt-2 text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}>
                {shape}
            </span>
            
            {isActive && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-[var(--accent-primary)] rounded-full flex items-center justify-center shadow-sm animate-scale-in">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </div>
            )}
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
    <div className="space-y-1">
        <label className="text-[10px] font-bold text-[var(--text-secondary)] truncate block uppercase" title={label}>{label}</label>
        <div className="flex items-center bg-[var(--bg-tertiary)]/30 rounded-lg border border-[var(--border-secondary)] overflow-hidden h-7">
            <button 
                onClick={() => onChange(Math.max(0, parseFloat((value - 0.05).toFixed(2))))} 
                className="w-7 h-full flex items-center justify-center hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors border-r border-[var(--border-secondary)] active:bg-[var(--accent-secondary)]/50"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
            </button>
            <div className="flex-grow text-center text-xs font-bold text-[var(--text-primary)] tabular-nums">
                {Math.round(value * 100)}%
            </div>
            <button 
                onClick={() => onChange(Math.min(1, parseFloat((value + 0.05).toFixed(2))))} 
                className="w-7 h-full flex items-center justify-center hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors border-l border-[var(--border-secondary)] active:bg-[var(--accent-secondary)]/50"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
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
  t, language, setLanguage, theme, setTheme, themeColors, onColorChange, onResetTheme, navPosition, setNavPosition, navDesign, setNavDesign, navShape, setNavShape, navShowLabels, setNavShowLabels, navBtnAlphaSelected, setNavBtnAlphaSelected, navBtnAlphaUnselected, setNavBtnAlphaUnselected, navBarAlpha, setNavBarAlpha, navBarColor, setNavBarColor, navAnimation, setNavAnimation, fontSize, setFontSize, appFont, setAppFont, schoolConfig, onUpdateSchoolConfig, classes, teachers, subjects, adjustments, leaveDetails, attendance
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
                    <div className="p-4 pt-0 space-y-4">
                         <div>
                            <h4 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 border-b border-[var(--border-secondary)] pb-1">{t.general}</h4>
                            <div className="flex items-center justify-between bg-[var(--bg-tertiary)] p-2 rounded-lg border border-[var(--border-secondary)]">
                                <div>
                                    <span className="block text-sm font-medium text-[var(--text-primary)]">{t.appLanguage}</span>
                                    <span className="text-[10px] text-[var(--text-secondary)]">{t.switchLanguageDesc}</span>
                                </div>
                                <button onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')} className="flex items-center gap-2 px-2 py-1 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-md shadow-sm border border-[var(--border-secondary)] hover:border-[var(--accent-primary)] transition-all">
                                    <div className="p-0.5 bg-[var(--accent-secondary)] rounded-full text-[var(--accent-primary)]"><LanguageIcon /></div>
                                    <span className={`font-bold text-xs ${language === 'ur' ? 'font-urdu' : ''}`}>{language === 'en' ? 'English' : 'اردو'}</span>
                                </button>
                            </div>
                        </div>

                         <div>
                            <h4 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 border-b border-[var(--border-secondary)] pb-1">{t.globalTypography}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">{t.globalFontSize}: {fontSize}px</label>
                                    <div className="flex items-center gap-2 bg-[var(--bg-tertiary)] p-2 rounded-lg border border-[var(--border-secondary)]">
                                        <span className="text-[10px]">A</span>
                                        <input type="range" min="10" max="16" step="1" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]" />
                                        <span className="text-sm">A</span>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">{t.appFont}</label>
                                    <select value={appFont} onChange={(e) => setAppFont(e.target.value)} className="w-full py-1.5 px-2 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg text-[var(--text-primary)] focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] appearance-none text-xs" style={{ fontFamily: appFont === 'CustomAppFont' ? 'inherit' : appFont }}>
                                        {appFontOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value} style={{ fontFamily: opt.value === 'CustomAppFont' ? 'inherit' : opt.value }}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <h4 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 border-b border-[var(--border-secondary)] pb-1">{t.navigationBar}</h4>
                            
                            <div className="grid grid-cols-1 gap-3">
                                <div className="bg-[var(--bg-tertiary)]/30 p-2 rounded-lg border border-[var(--border-secondary)] space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-[var(--text-primary)]">{t.position}</span>
                                        <div className="flex bg-[var(--bg-tertiary)] p-0.5 rounded-md border border-[var(--border-secondary)] h-6">
                                            <button 
                                                onClick={() => setNavPosition('bottom')} 
                                                className={`px-2 text-[10px] font-bold rounded transition-all flex items-center ${navPosition === 'bottom' ? 'bg-[var(--bg-secondary)] text-[var(--accent-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                                            >
                                                {t.bottom}
                                            </button>
                                            <div className="w-px bg-[var(--border-secondary)] my-0.5"></div>
                                            <button 
                                                onClick={() => setNavPosition('top')} 
                                                className={`px-2 text-[10px] font-bold rounded transition-all flex items-center ${navPosition === 'top' ? 'bg-[var(--bg-secondary)] text-[var(--accent-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                                            >
                                                {t.top}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="w-full h-px bg-[var(--border-secondary)]"></div>

                                    <div className="flex justify-between gap-4">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setNavShowLabels(!navShowLabels)} className={`relative inline-flex h-3.5 w-6 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${navShowLabels ? 'bg-[var(--accent-primary)]' : 'bg-gray-300'}`}>
                                                <span className={`pointer-events-none inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${navShowLabels ? 'translate-x-2.5' : 'translate-x-0'}`} />
                                            </button>
                                            <span className="text-[10px] font-medium text-[var(--text-secondary)]">{t.showButtonLabels}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setNavAnimation(!navAnimation)} className={`relative inline-flex h-3.5 w-6 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${navAnimation ? 'bg-[var(--accent-primary)]' : 'bg-gray-300'}`}>
                                                <span className={`pointer-events-none inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${navAnimation ? 'translate-x-2.5' : 'translate-x-0'}`} />
                                            </button>
                                            <span className="text-[10px] font-medium text-[var(--text-secondary)]">Animate</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[var(--bg-tertiary)]/30 p-2 rounded-lg border border-[var(--border-secondary)] space-y-2">
                                     <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                                        <OpacityControl label={t.selectedOpacity} value={navBtnAlphaSelected} onChange={setNavBtnAlphaSelected} />
                                        <OpacityControl label={t.unselectedOpacity} value={navBtnAlphaUnselected} onChange={setNavBtnAlphaUnselected} />
                                        
                                        <div className="col-span-2 w-full h-px bg-[var(--border-secondary)] my-0.5"></div>

                                        <div className="col-span-2 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] font-bold text-[var(--text-primary)] uppercase">Bar Surface</span>
                                                {navBarColor && <button onClick={() => setNavBarColor('')} className="text-[9px] text-red-500 hover:underline">Reset</button>}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="relative w-5 h-5 rounded-full shadow-sm border border-[var(--border-secondary)] overflow-hidden cursor-pointer">
                                                     <div className="absolute inset-0" style={{ backgroundColor: navBarColor || 'transparent', backgroundImage: navBarColor ? 'none' : 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)', backgroundSize: '6px 6px', backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px' }}></div>
                                                     <input type="color" value={navBarColor || '#ffffff'} onChange={(e) => setNavBarColor(e.target.value)} className="opacity-0 absolute inset-0 cursor-pointer" />
                                                </div>
                                                <div className="flex items-center bg-[var(--bg-tertiary)] rounded-md border border-[var(--border-secondary)] h-5">
                                                    <button onClick={() => setNavBarAlpha(Math.max(0, parseFloat((navBarAlpha - 0.1).toFixed(1))))} className="w-5 h-full flex items-center justify-center hover:bg-[var(--accent-secondary)] text-[var(--text-secondary)] text-[10px] font-bold">-</button>
                                                    <span className="w-7 text-center text-[9px] font-mono">{Math.round(navBarAlpha * 100)}%</span>
                                                    <button onClick={() => setNavBarAlpha(Math.min(1, parseFloat((navBarAlpha + 0.1).toFixed(1))))} className="w-5 h-full flex items-center justify-center hover:bg-[var(--accent-secondary)] text-[var(--text-secondary)] text-[10px] font-bold">+</button>
                                                </div>
                                            </div>
                                        </div>
                                     </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">{t.styleDesign}</label>
                                        <div className="grid grid-cols-3 gap-3 bg-[var(--bg-tertiary)]/50 p-3 rounded-lg border border-[var(--border-secondary)]">
                                            {(['modern', '3d', 'outline', 'soft'] as NavDesign[]).map(style => (
                                                <StyleOption 
                                                    key={style} 
                                                    design={style} 
                                                    isActive={navDesign === style} 
                                                    onClick={() => setNavDesign(style)} 
                                                    shape={navShape} 
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">{t.buttonShape}</label>
                                        <div className="grid grid-cols-3 gap-3 bg-[var(--bg-tertiary)]/50 p-3 rounded-lg border border-[var(--border-secondary)]">
                                            {(['square', 'pill', 'circle', 'leaf', 'squircle', 'diamond', 'arch', 'shield', 'petal'] as NavShape[]).map(shape => (
                                                <ShapeOption 
                                                    key={shape} 
                                                    shape={shape} 
                                                    isActive={navShape === shape} 
                                                    onClick={() => setNavShape(shape)} 
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-[var(--bg-secondary)] rounded-lg shadow-md border border-[var(--border-primary)] mb-8 overflow-hidden">
            <button className="w-full flex justify-between items-center p-6 text-left" onClick={() => setIsPrintSectionOpen(!isPrintSectionOpen)}>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">{t.printAndReports}</h3>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transform transition-transform text-[var(--text-secondary)] ${isPrintSectionOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            <div className={`grid transition-all duration-500 ${isPrintSectionOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                {/* ... (Print Reports content unchanged) ... */}
                <div className="overflow-hidden">
                    <div className="p-6 pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <ReportCard title={t.basicInformation} description="Class stats, room numbers, and in-charges." icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>} colorGradient="from-blue-500 to-blue-600" onClick={() => setIsBasicInfoPreviewOpen(true)} />
                            <ReportCard title={t.byPeriod} description="List of free teachers for every period." icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} colorGradient="from-cyan-500 to-teal-600" onClick={() => setIsByPeriodPreviewOpen(true)} />
                            <ReportCard title={t.schoolTimings} description="Bell schedule for regular days and Friday." icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} colorGradient="from-amber-500 to-orange-600" onClick={() => setIsSchoolTimingsPreviewOpen(true)} />
                            <ReportCard title={t.classTimetable} description="Print timetables for selected classes." icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} colorGradient="from-violet-500 to-purple-600" onClick={handleClassTimetableClick} />
                            <ReportCard title={t.teacherTimetable} description="Print timetables for selected teachers." icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>} colorGradient="from-emerald-500 to-green-600" onClick={handleTeacherTimetableClick} />
                            <ReportCard title={t.workloadSummaryReport} description="Weekly period counts for teachers." icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>} colorGradient="from-rose-500 to-pink-600" onClick={handleWorkloadReportClick} />
                            <ReportCard title={t.alternative} description="Daily adjustments and substitution slip." icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>} colorGradient="from-indigo-500 to-violet-600" onClick={() => setIsAlternativePreviewOpen(true)} />
                            <ReportCard title={t.attendanceReport} description="Daily student attendance with class in-charge." icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>} colorGradient="from-emerald-500 to-teal-600" onClick={() => setIsAttendanceReportPreviewOpen(true)} />
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
