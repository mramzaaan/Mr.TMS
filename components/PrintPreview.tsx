
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { DownloadLanguage, DownloadDesignConfig, FontFamily, CardStyle } from '../types';

declare const html2canvas: any;
declare const jspdf: any;

interface PrintPreviewProps {
  t: any;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  generateHtml: (lang: DownloadLanguage, design: DownloadDesignConfig) => string | string[];
  onGenerateExcel?: (lang: DownloadLanguage, design: DownloadDesignConfig) => void;
  fileNameBase: string;
  children?: React.ReactNode;
  designConfig: DownloadDesignConfig;
  onSaveDesign: (newDesign: DownloadDesignConfig) => void;
}

interface HistoryState {
    options: DownloadDesignConfig;
    pages: string[];
}

// Icons
const PrintIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2v4h10z" /></svg>;
const PdfIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" /></svg>;
const ExcelIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1-1H3a1 1 0 01-1-1V3zm2 2v2h3V5H4zm0 3v2h3V8H4zm0 3v2h3v-2H4zm4 2v-2h3v2H8zm0-3v-2h3v2H8zm0-3V5h3v3H8zm4 5v-2h3v2h-3zm0-3v-2h3v2h-3zm0-3V5h3v3h-3z" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0 3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const ZoomInIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>;
const ZoomOutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>;
const ResetIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l16 16" /></svg>;
const ShareIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>;
const AlignLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18v2H3V4zm0 15h12v2H3v-2zm0-5h18v2H3v-2zm0-5h12v2H3V9z"/></svg>;
const AlignCenterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 4h18v2H3V4zm2 15h14v2H5v-2zm-2-5h18v2H3v-2zm2-5h14v2H5V9z"/></svg>;
const AlignRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 24 24" fill="currentColor"><path d="M3 4h18v2H3V4zm6 15h12v2H9v-2zm-6-5h18v2H3v-2zm6-5h12v2H9V9z"/></svg>;
const BoldIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 24 24" fill="currentColor"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4h-1v1h1a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6V4zm5 6h3a2 2 0 0 0 2-2 2 2 0 0 0-2-2h-3v4zm0 8h3a2 2 0 0 0 2-2 2 2 0 0 0-2-2h-3v4z"/></svg>;
const ItalicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 24 24" fill="currentColor"><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/></svg>;
const UndoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>;
const RedoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>;
const TextColorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 24 24" fill="currentColor"><path d="M2.53 19.65l1.34-1.34L19.33 3.32a3 3 0 014.24 4.24L8.11 23H2.53v-3.35zm3.17-1.24L4.53 21h2.17l.93-.93-1.93-1.66z" /><path fillOpacity=".36" d="M0 20h24v4H0z"/></svg>;
const BgColorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 24 24" stroke="currentColor" strokeWidth={2}><path d="M16.56 8.94L7.62 0 6.21 1.41l2.38 2.38-5.15 5.15a1.49 1.49 0 000 2.12l5.5 5.5c.29.29.68.44 1.06.44s.77-.15 1.06-.44l5.5-5.5c.59-.58.59-1.53 0-2.12zM5.21 10L10 5.21 14.79 10H5.21zM19 11.5s-2 2.17-2 3.5c0 1.1.9 2 2 2s2-.9 2-2c0-1.33-2-3.5-2-3.5z"/><path fillOpacity=".36" d="M0 20h24v4H0z"/></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;

const fontOptions: { label: string, value: FontFamily }[] = [
    { label: 'System Default', value: 'sans-serif' as FontFamily },
    { label: 'Gulzar (Urdu)', value: 'Gulzar' as FontFamily },
    { label: 'Noto Nastaliq Urdu (Google)', value: 'Noto Nastaliq Urdu' as FontFamily },
    { label: 'Amiri (Naskh)', value: 'Amiri' as FontFamily },
    { label: 'Aref Ruqaa (Calligraphic)', value: 'Aref Ruqaa' as FontFamily },
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

const SettingsPanel: React.FC<{
    options: DownloadDesignConfig,
    onUpdate: (options: DownloadDesignConfig) => void,
    onSaveDesign: (options: DownloadDesignConfig) => void,
    resetToDefaults: () => void,
}> = ({ options, onUpdate, onSaveDesign, resetToDefaults }) => {
    const [activeTab, setActiveTab] = useState<'page' | 'header' | 'table' | 'footer'>('page');
    const [isSaving, setIsSaving] = useState(false);

    const handleValueChange = (path: string, value: any) => {
        const newOptions = JSON.parse(JSON.stringify(options)); 
        const keys = path.split('.');
        let current: any = newOptions;
        for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        onUpdate(newOptions);
    };

    const handleSave = () => {
        setIsSaving(true);
        onSaveDesign(options);
        setTimeout(() => setIsSaving(false), 2000);
    };

    // Controls
    const NumberControl = ({ label, path, value, min = 0, max = 100, step = 1 }: any) => (
        <div className="flex flex-col justify-between bg-white p-1 rounded border border-gray-200 shadow-sm h-full min-h-[34px]">
            <div className="flex justify-between items-start mb-0.5">
                <label className="text-[9px] font-extrabold text-gray-600 uppercase tracking-tight leading-none break-words w-full truncate" title={label}>{label}</label>
            </div>
            <div className="flex items-center bg-gray-50 rounded border border-gray-200 p-0 overflow-hidden h-5 w-full">
                <button onClick={() => handleValueChange(path, Math.max(min, parseFloat((value - step).toFixed(2))))} className="w-4 flex items-center justify-center bg-white hover:bg-gray-100 text-gray-700 text-[9px] font-bold h-full border-r border-gray-200">-</button>
                <input type="number" value={value} onChange={(e) => { let val = parseFloat(e.target.value); if (isNaN(val)) val = min; handleValueChange(path, Math.min(max, Math.max(min, val))); }} className="flex-grow w-0 text-center text-[10px] font-bold text-gray-800 bg-transparent outline-none p-0 appearance-none m-0 leading-none" />
                <button onClick={() => handleValueChange(path, Math.min(max, parseFloat((value + step).toFixed(2))))} className="w-4 flex items-center justify-center bg-white hover:bg-gray-100 text-gray-700 text-[9px] font-bold h-full border-l border-gray-200">+</button>
            </div>
        </div>
    );
    const SelectControl = ({ label, path, value, options: opts }: any) => {
        const isFont = path.toLowerCase().includes('font');
        return (
            <div className="flex flex-col justify-between bg-white p-1 rounded border border-gray-200 shadow-sm h-full min-h-[34px]">
                 <label className="text-[9px] font-extrabold text-gray-600 uppercase tracking-tight leading-none mb-0.5 break-words w-full truncate" title={label}>{label}</label>
                 <div className="relative w-full">
                     <select value={value} onChange={e => handleValueChange(path, e.target.value)} className={`w-full h-5 bg-gray-50 border border-gray-200 rounded text-[10px] font-medium px-0.5 py-0 focus:ring-1 focus:ring-teal-500 outline-none leading-none ${isFont ? 'cursor-pointer' : ''}`} style={isFont ? { fontFamily: value } : {}}>
                        {opts.map((o: any) => (<option key={o.value} value={o.value} style={isFont ? { fontFamily: o.value, fontSize: '12px' } : {}}>{o.label}</option>))}
                     </select>
                 </div>
            </div>
        );
    };
    const TextControl = ({ label, path, value }: any) => ( <div className="flex flex-col justify-between bg-white p-1 rounded border border-gray-200 shadow-sm h-full min-h-[34px]"> <div className="flex justify-between items-start mb-0.5"> <label className="text-[9px] font-extrabold text-gray-600 uppercase tracking-tight leading-none break-words w-full truncate" title={label}>{label}</label> </div> <input type="text" value={value} onChange={(e) => handleValueChange(path, e.target.value)} className="w-full h-5 bg-gray-50 border border-gray-200 rounded text-[10px] font-medium px-1 py-0 focus:ring-1 focus:ring-teal-500 outline-none leading-none" /> </div> );
    
    // Color Control
    const ColorControl = ({ label, path, value }: any) => (
        <div className="flex flex-col justify-between bg-white p-1 rounded border border-gray-200 shadow-sm h-full min-h-[34px]">
            <label className="text-[9px] font-extrabold text-gray-600 uppercase tracking-tight leading-none mb-0.5 break-words w-full truncate" title={label}>{label}</label>
            <div className="flex items-center gap-1 h-5">
                <div className="relative w-5 h-full rounded border border-gray-300 overflow-hidden flex-shrink-0 cursor-pointer hover:border-gray-400">
                    <div className="absolute inset-0" style={{ backgroundColor: value }}></div>
                    <input type="color" value={value} onChange={e => handleValueChange(path, e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                </div>
                <input 
                    type="text" 
                    value={value} 
                    onChange={(e) => handleValueChange(path, e.target.value)} 
                    className="flex-grow w-0 min-w-0 h-full bg-gray-50 border border-gray-200 rounded text-[9px] font-mono font-medium px-1 py-0 focus:ring-1 focus:ring-teal-500 outline-none leading-none uppercase text-gray-700 text-center"
                    maxLength={7}
                />
            </div>
        </div>
    );

    const ToggleControl = ({ label, path, value }: any) => ( <div className="flex flex-col justify-between bg-white p-1 rounded border border-gray-200 shadow-sm h-full min-h-[34px]"> <label htmlFor={path} className="text-[9px] font-extrabold text-gray-600 uppercase tracking-tight leading-none mb-0.5 break-words cursor-pointer w-full truncate" title={label}>{label}</label> <div className="relative w-full h-5 flex items-center justify-between"> <div className="relative inline-block w-6 h-3.5 align-middle select-none transition duration-200 ease-in"> <input type="checkbox" name={path} id={path} checked={value} onChange={e => handleValueChange(path, e.target.checked)} className="toggle-checkbox absolute block w-3.5 h-3.5 rounded-full bg-white border border-gray-300 appearance-none cursor-pointer checked:right-0 right-2.5 checked:border-teal-500"/> <label htmlFor={path} className={`toggle-label block overflow-hidden h-3.5 rounded-full cursor-pointer ${value ? 'bg-teal-500' : 'bg-gray-300'}`}></label> </div> <span className="text-[8px] font-bold text-gray-500">{value ? 'ON' : 'OFF'}</span> </div> </div> );

    const tabs = [ { id: 'page', label: 'Layout' }, { id: 'header', label: 'Header' }, { id: 'table', label: 'Table' }, { id: 'footer', label: 'Footer' }, ];
    const sectionHeaderClass = "col-span-full font-black text-[9px] text-gray-400 uppercase mt-1 mb-0.5 tracking-widest border-b border-gray-200 pb-0.5";

    return (
        <div className="bg-gray-100 text-gray-800 border-b border-gray-300 shadow-sm flex flex-col w-full max-h-[50vh] sm:max-h-[60vh]">
            <div className="flex border-b border-gray-300 bg-white overflow-x-auto no-scrollbar">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 py-2 px-1 text-[10px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${activeTab === tab.id ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50' : 'text-gray-500 hover:bg-gray-50'}`}>{tab.label}</button>
                ))}
            </div>
            <div className="p-2 pb-16 overflow-y-auto custom-scrollbar flex-grow min-h-0 bg-gray-50">
                <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1.5">
                    {activeTab === 'page' && ( <> <div className={sectionHeaderClass}>General</div> <NumberControl label="Rows (All)" path="rowsPerPage" value={options.rowsPerPage} min={5} max={100} /> <NumberControl label="Rows (1st)" path="rowsPerFirstPage" value={options.rowsPerFirstPage || options.rowsPerPage} min={5} max={100} /> <SelectControl label="Mode" path="colorMode" value={options.colorMode} options={[{value: 'color', label: 'Color'}, {value: 'bw', label: 'B&W'}]} /> <div className={sectionHeaderClass}>Paper</div> <SelectControl label="Size" path="page.size" value={options.page.size} options={[{value: 'a4', label: 'A4'}, {value: 'letter', label: 'Letter'}, {value: 'legal', label: 'Legal'}]} /> <SelectControl label="Orient" path="page.orientation" value={options.page.orientation} options={[{value: 'portrait', label: 'Port'}, {value: 'landscape', label: 'Land'}]} /> <NumberControl label="Watermark" path="page.watermarkOpacity" value={options.page.watermarkOpacity} min={0} max={1} step={0.05} /> <div className={sectionHeaderClass}>Margins</div> <NumberControl label="Top" path="page.margins.top" value={options.page.margins.top} min={0} max={50} /> <NumberControl label="Bottom" path="page.margins.bottom" value={options.page.margins.bottom} min={0} max={50} /> <NumberControl label="Left" path="page.margins.left" value={options.page.margins.left} min={0} max={50} /> <NumberControl label="Right" path="page.margins.right" value={options.page.margins.right} min={0} max={50} /> <div className={sectionHeaderClass}>Advanced</div> <NumberControl label="Days/Page" path="daysPerPage" value={options.daysPerPage} min={1} max={7} /> </> )}
                    {activeTab === 'header' && ( <> <div className={sectionHeaderClass}>Name</div> <SelectControl label="Font" path="header.schoolName.fontFamily" value={options.header.schoolName.fontFamily} options={fontOptions} /> <NumberControl label="Size" path="header.schoolName.fontSize" value={options.header.schoolName.fontSize} min={10} max={60} /> <SelectControl label="Align" path="header.schoolName.align" value={options.header.schoolName.align} options={[{value: 'left', label: 'Left'}, {value: 'center', label: 'Center'}, {value: 'right', label: 'Right'}]} /> <ColorControl label="Color" path="header.schoolName.color" value={options.header.schoolName.color} /> <div className={sectionHeaderClass}>Details</div> <SelectControl label="Font" path="header.details.fontFamily" value={options.header.details.fontFamily} options={fontOptions} /> <NumberControl label="Size" path="header.details.fontSize" value={options.header.details.fontSize} min={8} max={24} /> <ColorControl label="Bg" path="header.bgColor" value={options.header.bgColor} /> <div className={sectionHeaderClass}>Logo</div> <ToggleControl label="Show" path="header.showLogo" value={options.header.showLogo} /> <NumberControl label="Size" path="header.logoSize" value={options.header.logoSize} min={20} max={200} /> <SelectControl label="Pos" path="header.logoPosition" value={options.header.logoPosition} options={[{value: 'left', label: 'Left'}, {value: 'center', label: 'Center'}, {value: 'right', label: 'Right'}]} /> <div className={sectionHeaderClass}>Title</div> <ToggleControl label="Show" path="header.showTitle" value={options.header.showTitle} /> <NumberControl label="Size" path="header.title.fontSize" value={options.header.title.fontSize} min={10} max={40} /> <ToggleControl label="Line" path="header.divider" value={options.header.divider} /> </> )}
                    {activeTab === 'table' && ( <> <div className={sectionHeaderClass}>Content</div> <SelectControl label="Card Style" path="table.cardStyle" value={options.table.cardStyle || 'full'} options={cardStyleOptions} /> <SelectControl label="Font" path="table.fontFamily" value={options.table.fontFamily} options={fontOptions} /> <NumberControl label="Size" path="table.fontSize" value={options.table.fontSize} min={8} max={24} /> <NumberControl label="Pad" path="table.cellPadding" value={options.table.cellPadding} min={0} max={40} /> <SelectControl label="Align V" path="table.verticalAlign" value={options.table.verticalAlign || 'middle'} options={[{value: 'top', label: 'Top'}, {value: 'middle', label: 'Middle'}, {value: 'bottom', label: 'Bottom'}]} /> <ColorControl label="Border" path="table.borderColor" value={options.table.borderColor} /> <div className={sectionHeaderClass}>Colors</div> <ColorControl label="Head BG" path="table.headerBgColor" value={options.table.headerBgColor} /> <ColorControl label="Head Txt" path="table.headerColor" value={options.table.headerColor} /> <ColorControl label="Body BG" path="table.bodyBgColor" value={options.table.bodyBgColor} /> <ColorControl label="Body Txt" path="table.bodyColor" value={options.table.bodyColor || '#000000'} /> <ColorControl label="Stripe" path="table.altRowColor" value={options.table.altRowColor} /> <div className={sectionHeaderClass}>Columns</div> <NumberControl label="P.Width" path="table.periodColumnWidth" value={options.table.periodColumnWidth} min={20} max={100} /> <ColorControl label="P.BG" path="table.periodColumnBgColor" value={options.table.periodColumnBgColor} /> <div className={sectionHeaderClass}>Advanced</div> <NumberControl label="Head Size" path="table.headerFontSize" value={options.table.headerFontSize || options.table.fontSize} min={8} max={24} /> <TextControl label="Sys Font" path="table.fontFamily" value={options.table.fontFamily} /> </> )}
                    {activeTab === 'footer' && ( <> <div className={sectionHeaderClass}>Setup</div> <ToggleControl label="Show" path="footer.show" value={options.footer.show} /> <ToggleControl label="Page #" path="footer.includePageNumber" value={options.footer.includePageNumber} /> <SelectControl label="Align" path="footer.align" value={options.footer.align} options={[{value: 'left', label: 'Left'}, {value: 'center', label: 'Center'}, {value: 'right', label: 'Right'}]} /> <div className={sectionHeaderClass}>Style</div> <SelectControl label="Font" path="footer.fontFamily" value={options.footer.fontFamily} options={fontOptions} /> <NumberControl label="Size" path="footer.fontSize" value={options.footer.fontSize} min={8} max={20} /> <ColorControl label="Color" path="footer.color" value={options.footer.color} /> </> )}
                </div>
            </div>
            <div className="p-2 border-t border-gray-300 bg-gray-100 flex justify-end gap-2 flex-shrink-0 z-20 relative">
                 <button onClick={resetToDefaults} className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition shadow-sm"><ResetIcon /> Reset</button>
                 <button 
                    onClick={handleSave} 
                    className={`flex items-center gap-2 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white rounded transition shadow-sm ${isSaving ? 'bg-green-600' : 'bg-teal-600 hover:bg-teal-700'}`}
                 >
                    {isSaving ? <CheckIcon /> : null}
                    {isSaving ? 'Saved' : 'Save'}
                 </button>
            </div>
        </div>
    );
};

const PrintPreview: React.FC<PrintPreviewProps> = ({ t, isOpen, onClose, title, generateHtml, onGenerateExcel, fileNameBase, children, designConfig, onSaveDesign }) => {
  const [lang, setLang] = useState<DownloadLanguage>('en');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [screenshotScale, setScreenshotScale] = useState(2); 

  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentPage, setCurrentPage] = useState(0);

  const previewRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeElement, setActiveElement] = useState<HTMLElement | null>(null);
  
  const [customFont, setCustomFont] = useState<{name: string, data: string} | null>(null);
  const colorDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const themeColors = useMemo(() => {
    if (typeof window === 'undefined') return { accent: '#6366f1' };
    const style = getComputedStyle(document.documentElement);
    return {
      accent: style.getPropertyValue('--accent-primary').trim() || '#6366f1'
    };
  }, [isOpen]);

  useEffect(() => {
      const storedFont = localStorage.getItem('mrtimetable_customFontData');
      if (storedFont) { try { const parsed = JSON.parse(storedFont); setCustomFont(parsed); } catch(e) {} }
  }, []);

  useEffect(() => {
    if (isOpen) {
      const themedDesign = JSON.parse(JSON.stringify(designConfig));
      themedDesign.table.headerBgColor = themeColors.accent;
      themedDesign.table.periodColumnBgColor = themeColors.accent;
      themedDesign.table.headerColor = '#FFFFFF';
      themedDesign.table.periodColumnColor = '#FFFFFF';

      const initialHtml = generateHtml(lang, themedDesign);
      const initialPages = Array.isArray(initialHtml) ? initialHtml : [initialHtml];
      const initialState = { options: themedDesign, pages: initialPages };
      
      setHistory([initialState]);
      setHistoryIndex(0);
      setCurrentPage(0);
      setActiveElement(null);
      setLang('en');
      setScreenshotScale(2);
      
      const isPortrait = themedDesign.page?.orientation === 'portrait';
      const pageWidth = isPortrait ? 794 : 1123; 
      const screenWidth = window.innerWidth;
      const availableWidth = screenWidth - 32; 
      let fitZoom = 100;
      if (availableWidth < pageWidth) { fitZoom = Math.floor((availableWidth / pageWidth) * 100); fitZoom = Math.max(35, fitZoom); }
      setZoomLevel(fitZoom);
    }
  }, [isOpen, designConfig, generateHtml, themeColors]);

  useEffect(() => {
    if (historyIndex >= 0 && history[historyIndex]) {
        const numPages = history[historyIndex].pages.length;
        if (currentPage >= numPages) {
            setCurrentPage(numPages > 0 ? numPages - 1 : 0);
        }
    }
  }, [historyIndex, history, currentPage]);

  const pushToHistory = useCallback((newOptions: DownloadDesignConfig, newPages: string[]) => {
      setHistory(prev => {
          const newHistory = prev.slice(0, historyIndex + 1);
          newHistory.push({ options: newOptions, pages: newPages });
          return newHistory;
      });
      setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const handleDesignUpdate = (newOptions: DownloadDesignConfig, overrideLang?: DownloadLanguage) => {
      const effectiveLang = overrideLang !== undefined ? overrideLang : lang;
      const newContent = generateHtml(effectiveLang, newOptions);
      const newPages = Array.isArray(newContent) ? newContent : [newContent];
      pushToHistory(newOptions, newPages);
  };

  const saveManualEdit = () => {
      if (!contentRef.current) return;
      const clone = contentRef.current.cloneNode(true) as HTMLElement;
      const selected = clone.querySelector('[data-selected-element="true"]');
      if (selected) selected.removeAttribute('data-selected-element');
      const currentHtml = clone.innerHTML;
      const currentPages = [...history[historyIndex].pages];
      currentPages[currentPage] = currentHtml;
      pushToHistory(history[historyIndex].options, currentPages);
  };

  const handleUndo = () => { if (historyIndex > 0) { setHistoryIndex(historyIndex - 1); setActiveElement(null); } };
  const handleRedo = () => { if (historyIndex < history.length - 1) { setHistoryIndex(historyIndex + 1); setActiveElement(null); } };
  const handlePageChange = (newPage: number) => { saveManualEdit(); setCurrentPage(newPage); setActiveElement(null); };
  
  const handleContentClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      const target = e.target as HTMLElement;
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
          setActiveElement(null);
          if (contentRef.current) { const prevActive = contentRef.current.querySelector('[data-selected-element="true"]'); if(prevActive) prevActive.removeAttribute('data-selected-element'); }
          return;
      }
      const editableElement = target.closest('th, td, div, span, p') as HTMLElement;
      if (contentRef.current) { const prevActive = contentRef.current.querySelector('[data-selected-element="true"]'); if(prevActive) prevActive.removeAttribute('data-selected-element'); }
      if (!editableElement || editableElement === contentRef.current || editableElement.classList.contains('page')) { setActiveElement(null); return; }
      editableElement.setAttribute('data-selected-element', 'true');
      setActiveElement(editableElement);
  };

  const applyFormat = (command: string, value?: string) => {
      document.execCommand('styleWithCSS', false, 'true');
      if (command === 'backgroundColor') {
          const selection = window.getSelection();
          if (selection && !selection.isCollapsed && selection.rangeCount > 0) { document.execCommand('hiliteColor', false, value || 'transparent'); } else if (activeElement) { activeElement.style.backgroundColor = value || 'transparent'; }
      } else if (command === 'color') {
          const selection = window.getSelection();
          if (selection && !selection.isCollapsed && selection.rangeCount > 0) { document.execCommand('foreColor', false, value || '#000000'); } else if (activeElement) { activeElement.style.color = value || '#000000'; }
      } else if (['justifyLeft', 'justifyCenter', 'justifyRight'].includes(command)) {
          if (activeElement) { activeElement.style.textAlign = command.replace('justify', '').toLowerCase(); }
      } else { document.execCommand(command, false, value); }
      saveManualEdit();
  };

  const handleColorChange = (command: string, value: string) => {
      if (command === 'backgroundColor') {
          const selection = window.getSelection();
          if (selection && !selection.isCollapsed) { document.execCommand('hiliteColor', false, value); } else if (activeElement) { activeElement.style.backgroundColor = value; }
      } else if (command === 'color') {
          const selection = window.getSelection();
          if (selection && !selection.isCollapsed) { document.execCommand('foreColor', false, value); } else if (activeElement) { activeElement.style.color = value; }
      }
      if (colorDebounceRef.current) clearTimeout(colorDebounceRef.current);
      colorDebounceRef.current = setTimeout(() => { saveManualEdit(); }, 500);
  };

  const setupClonedDocument = (clonedDoc: Document) => {
      const style = clonedDoc.createElement('style');
      const importsLatin = `@import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Aref+Ruqaa:wght@400;700&family=Gulzar&family=Noto+Nastaliq+Urdu:wght@400;700&family=Anton&family=Antonio:wght@400;700&family=Bebas+Neue&family=Bodoni+Moda:opsz,wght@6..96,400..900&family=Bungee+Spice&family=Fjalla+One&family=Instrument+Serif:ital@0;1&family=Lato:wght@400;700&family=Merriweather:wght@400;700;900&family=Monoton&family=Montserrat:wght@400;500;700&family=Open+Sans:wght@400;600;700&family=Orbitron:wght@400;700&family=Oswald:wght@400;700&family=Anton&family=Instrument+Serif:ital@0;1&family=Playwrite+CU:wght@100..400&family=Roboto:wght@400;500;700&family=Rubik+Mono+One&display=swap');`;
      const URDU_FONT_STACK = "'Gulzar', 'Noto Nastaliq Urdu', serif";
      style.innerHTML = `
          * { 
            -webkit-font-smoothing: antialiased !important; 
            -moz-osx-font-smoothing: grayscale !important; 
            text-rendering: auto !important; 
            font-variant-ligatures: none !important; 
          } 
          ${importsLatin} 
          .print-container { 
            font-family: '${options.table.fontFamily}', sans-serif; 
            box-sizing: border-box; 
          } 
          .print-container .font-urdu, .print-container .font-urdu * { 
            font-family: ${URDU_FONT_STACK} !important; 
            line-height: 1.8; 
            padding-top: 2px; 
            direction: rtl; 
            font-synthesis: none; 
            font-weight: normal; 
          } 
          td { 
            padding: ${options.table.cellPadding}px !important; 
            border-color: ${options.table.borderColor} !important; 
          } 
          .page { 
            overflow: visible !important; 
            min-height: 100% !important; 
            height: auto !important; 
            display: flex !important; 
            flex-direction: column !important; 
          } 
          .content-wrapper { 
            flex-grow: 1 !important; 
            display: flex !important; 
            flex-direction: column !important; 
          } 
          .footer { 
            margin-top: auto !important; 
          }`;
      clonedDoc.head.appendChild(style);
      const clonedContainer = clonedDoc.body.querySelector('div[style*="visibility: hidden"]');
      if (clonedContainer) (clonedContainer as HTMLElement).style.visibility = 'visible';
  };

  const handleSendAsPicture = async () => {
      window.focus();
      if (!contentRef.current) return;
      saveManualEdit();
      setIsGenerating(true);
      try {
          const orientation = options.page?.orientation || 'portrait';
          const format = options.page?.size || 'a4';
          let widthPx = 794; let heightPx = 1123;
          if (format === 'a4') { widthPx = orientation === 'portrait' ? 794 : 1123; heightPx = orientation === 'portrait' ? 1123 : 794; }
          else if (format === 'letter') { widthPx = orientation === 'portrait' ? 816 : 1056; heightPx = orientation === 'portrait' ? 1056 : 816; }
          else if (format === 'legal') { widthPx = orientation === 'portrait' ? 816 : 1344; heightPx = orientation === 'portrait' ? 1344 : 816; }

          const tempContainer = document.createElement('div');
          Object.assign(tempContainer.style, { 
            position: 'fixed', 
            left: '0', 
            top: '0', 
            zIndex: '-9999', 
            width: `${widthPx}px`, 
            height: `${heightPx}px`, 
            backgroundColor: '#ffffff', 
            visibility: 'hidden',
            overflow: 'hidden'
          });
          if (options.colorMode === 'bw') tempContainer.style.filter = 'grayscale(100%)';
          document.body.appendChild(tempContainer);
          tempContainer.innerHTML = pages[currentPage];
          
          const printContainer = tempContainer.querySelector('.print-container') as HTMLElement;
          if (printContainer) { printContainer.style.width = '100%'; printContainer.style.height = '100%'; }
          
          await document.fonts.ready;
          await new Promise(r => setTimeout(r, 400));

          const scale = screenshotScale;
          const canvas = await html2canvas(tempContainer, {
              scale: scale,
              useCORS: true,
              backgroundColor: '#ffffff',
              windowWidth: widthPx,
              windowHeight: heightPx,
              scrollX: 0,
              scrollY: 0,
              onclone: setupClonedDocument
          });
          document.body.removeChild(tempContainer);

          const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
          
          if (blob) {
              try {
                  const item = new ClipboardItem({ [blob.type]: blob });
                  await navigator.clipboard.write([item]);
              } catch (err) {
                  console.warn("Clipboard copy failed:", err);
              }

              const file = new File([blob], `${fileNameBase}.png`, { type: blob.type });
              if (navigator.canShare && navigator.canShare({ files: [file] })) {
                  try { 
                      await navigator.share({ files: [file], title: title }); 
                  } catch (error: any) { 
                      console.warn("Share failed, falling back to download:", error);
                      const link = document.createElement('a'); link.download = `${fileNameBase}.png`; link.href = canvas.toDataURL('image/png'); link.click();
                  }
              } else {
                  const link = document.createElement('a'); link.download = `${fileNameBase}.png`; link.href = canvas.toDataURL('image/png'); link.click();
              }
          }
      } catch (err) { console.error(err); alert("Capture failed."); } 
      finally { setIsGenerating(false); }
  };

  const handlePrint = () => { saveManualEdit(); if (pages.length === 0) return; setTimeout(() => { const printWindow = window.open('', '_blank'); if (printWindow) { const content = pages.join(''); const grayscaleStyle = options.colorMode === 'bw' ? '<style>@media print { body { -webkit-print-color-adjust: exact; filter: grayscale(100%); } }</style>' : ''; const printCss = '<style>@media print { body { margin: 0; padding: 0; } .print-container { page-break-after: always; } .print-container:last-child { page-break-after: auto; } }</style>'; printWindow.document.write(grayscaleStyle + printCss + content); printWindow.document.close(); printWindow.onload = function() { printWindow.focus(); printWindow.print(); }; } }, 50); };
  
  const handleDownloadPdf = async () => { 
      saveManualEdit(); 
      if (pages.length === 0) return; 
      setIsGenerating(true); 
      try { 
          const jsPDF = jspdf.jsPDF; 
          const orientation = options.page?.orientation || 'landscape'; 
          const format = options.page?.size || 'a4'; 
          const pdf = new jsPDF({ orientation, unit: 'mm', format }); 
          const pdfWidth = pdf.internal.pageSize.getWidth(); 
          const pdfHeight = pdf.internal.pageSize.getHeight(); 
          
          let containerWidth = '1123px'; 
          let containerHeight = '794px'; 
          if (format === 'a4') { containerWidth = orientation === 'portrait' ? '794px' : '1123px'; containerHeight = orientation === 'portrait' ? '1123px' : '794px'; } 
          else if (format === 'letter') { containerWidth = orientation === 'portrait' ? '816px' : '1056px'; containerHeight = orientation === 'portrait' ? '1056px' : '816px'; } 
          else if (format === 'legal') { containerWidth = orientation === 'portrait' ? '816px' : '1344px'; containerHeight = orientation === 'portrait' ? '1344px' : '816px'; } 
          
          const tempContainer = document.createElement('div'); 
          Object.assign(tempContainer.style, {
            position: 'absolute',
            left: '-9999px',
            top: '0',
            width: containerWidth,
            height: containerHeight,
            overflow: 'hidden',
            backgroundColor: '#ffffff'
          });
          if (options.colorMode === 'bw') { tempContainer.style.filter = 'grayscale(100%)'; } 
          document.body.appendChild(tempContainer); 
          
          for (let i = 0; i < pages.length; i++) { 
              tempContainer.innerHTML = pages[i]; 
              const pageElement = tempContainer.children[0] as HTMLElement; 
              if (!pageElement) continue; 
              
              Object.assign(pageElement.style, {
                width: '100%',
                height: '100%',
                boxSizing: 'border-box',
                margin: '0',
                backgroundColor: '#ffffff'
              });

              window.scrollTo(0, 0); 
              await document.fonts.ready;
              await new Promise(r => setTimeout(r, 400));
              
              const canvas = await html2canvas(tempContainer, { 
                  scale: 2, 
                  useCORS: true, 
                  backgroundColor: '#ffffff', 
                  width: parseFloat(containerWidth), 
                  height: parseFloat(containerHeight), 
                  windowWidth: parseFloat(containerWidth), 
                  windowHeight: parseFloat(containerHeight), 
                  scrollX: 0, 
                  scrollY: 0, 
                  x: 0, 
                  y: 0,
                  onclone: setupClonedDocument
              }); 
              
              const imgData = canvas.toDataURL('image/jpeg', 0.98); 
              if (i > 0) pdf.addPage(format, orientation); 
              const imgProps = pdf.getImageProperties(imgData); 
              const ratio = imgProps.width / imgProps.height; 
              let finalW = pdfWidth; 
              let finalH = pdfWidth / ratio; 
              if (finalH > pdfHeight) { finalH = pdfHeight; finalW = pdfHeight * ratio; } 
              pdf.addImage(imgData, 'JPEG', 0, 0, finalW, finalH, undefined, 'FAST'); 
          } 
          document.body.removeChild(tempContainer); 
          pdf.save(`${fileNameBase}_${lang}.pdf`); 
      } catch (err) { 
          console.error("PDF generation failed:", err); 
          alert("Failed to generate PDF."); 
      } finally { 
          setIsGenerating(false); 
      } 
  };
  
  const handleZoom = (amount: number) => { setZoomLevel(prev => Math.max(10, Math.min(200, prev + amount))); };
  const resetToDefaults = () => { handleDesignUpdate(designConfig); };

  const currentRenderState = history[historyIndex] || { options: designConfig, pages: [] };
  const { options, pages } = currentRenderState;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-[110] p-0 animate-scale-in no-print" onClick={onClose}>
        <div className="bg-gray-800 rounded-lg shadow-2xl w-full h-full flex flex-col relative" onClick={e => e.stopPropagation()}>
            {/* Unified Toolbar */}
            <header className="flex-shrink-0 p-3 bg-gray-900 border-b border-gray-700 shadow-md flex flex-col sm:flex-row items-center justify-between gap-y-3 gap-x-4 text-white z-30">
                <div className="flex-grow flex items-center gap-x-4 overflow-hidden w-full sm:w-auto">
                    <h3 className="text-lg font-bold truncate text-gray-100">{title}</h3>
                    <div className="hidden sm:flex items-center gap-2 flex-wrap">{children}</div>
                </div>
                <div className="flex items-center justify-end gap-x-3 flex-wrap w-full sm:w-auto">
                    <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-800 border border-gray-700 shadow-inner">
                        <button onClick={handleUndo} disabled={historyIndex <= 0} title="Undo" className="p-1.5 rounded hover:bg-gray-700 disabled:opacity-30 text-gray-300 hover:text-white transition"><UndoIcon /></button>
                        <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} title="Redo" className="p-1.5 rounded hover:bg-gray-700 disabled:opacity-30 text-gray-300 hover:text-white transition"><RedoIcon /></button>
                    </div>
                    <div className="w-px h-8 bg-gray-700 mx-1 hidden sm:block"></div>
                    <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-800 border border-gray-700 shadow-inner">
                        <button onClick={() => applyFormat('bold')} title="Bold" className="p-1.5 rounded hover:bg-gray-700 text-gray-300 hover:text-white transition"><BoldIcon /></button>
                        <button onClick={() => applyFormat('italic')} title="Italic" className="p-1.5 rounded hover:bg-gray-700 text-gray-300 hover:text-white transition"><ItalicIcon /></button>
                        <div className="w-px h-5 bg-gray-700 mx-0.5"></div>
                        <div className="relative group p-1.5 rounded hover:bg-gray-700 cursor-pointer flex items-center gap-1" title="Text Color">
                            <TextColorIcon /><div className="w-3 h-3 rounded-full border border-gray-500 bg-white group-hover:border-white"></div><input type="color" onChange={(e) => handleColorChange('color', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                        </div>
                        <div className="relative group p-1.5 rounded hover:bg-gray-700 cursor-pointer flex items-center gap-1" title="Fill Color">
                            <BgColorIcon /><div className="w-3 h-3 rounded-sm border border-gray-500 bg-gray-400 group-hover:border-white"></div><input type="color" onChange={(e) => handleColorChange('backgroundColor', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                        </div>
                        <div className="w-px h-5 bg-gray-700 mx-0.5"></div>
                        <button onClick={() => applyFormat('justifyLeft')} className="p-1.5 rounded hover:bg-gray-700 text-gray-300 hover:text-white"><AlignLeftIcon /></button>
                        <button onClick={() => applyFormat('justifyCenter')} className="p-1.5 rounded hover:bg-gray-700 text-gray-300 hover:text-white"><AlignCenterIcon /></button>
                        <button onClick={() => applyFormat('justifyRight')} className="p-1.5 rounded hover:bg-gray-700 text-gray-300 hover:text-white"><AlignRightIcon /></button>
                    </div>
                    <div className="w-px h-8 bg-gray-700 mx-1 hidden sm:block"></div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5 bg-gray-800 rounded-lg p-0.5 border border-gray-700">
                            <button onClick={() => handleZoom(-10)} className="p-1.5 rounded hover:bg-gray-700 text-gray-300 hover:text-white"><ZoomOutIcon /></button>
                            <span className="text-[10px] w-8 text-center font-mono text-gray-400">{zoomLevel}%</span>
                            <button onClick={() => handleZoom(10)} className="p-1.5 rounded hover:bg-gray-700 text-gray-300 hover:text-white"><ZoomInIcon /></button>
                        </div>
                        <div className="flex bg-gray-800 rounded-lg p-0.5 border border-gray-700">
                            {(['en', 'ur', 'both'] as const).map((l) => (
                                <button key={l} onClick={() => { setLang(l); handleDesignUpdate(options, l); }} className={`px-2 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all leading-none ${lang === l ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'}`}>{l === 'en' ? 'ENG' : l === 'ur' ? 'اردو' : 'ALL'}</button>
                            ))}
                        </div>
                        <button onClick={() => setIsSettingsOpen(prev => !prev)} title="Toggle Settings" className={`p-2 rounded-lg transition-all border ${isSettingsOpen ? 'bg-teal-600 border-teal-500 text-white shadow-inner' : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white'}`}><SettingsIcon /></button>
                    </div>
                    <div className="w-px h-8 bg-gray-700 mx-1 hidden sm:block"></div>
                    <div className="flex items-center gap-1">
                        <button onClick={handlePrint} className="p-2 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition" title={t.print}><PrintIcon /></button>
                        <button onClick={handleDownloadPdf} disabled={isGenerating} className="p-2 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white disabled:opacity-50 transition" title={t.downloadPdf}><PdfIcon /></button>
                        <button onClick={handleSendAsPicture} disabled={isGenerating} className="p-2 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white disabled:opacity-50 transition flex items-center gap-2" title="Send as Picture">
                            <ShareIcon />
                            <span className="text-[10px] font-black uppercase hidden lg:inline tracking-widest">Send To</span>
                        </button>
                        {onGenerateExcel && (<button onClick={() => onGenerateExcel(lang, options)} className="p-2 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition" title={t.downloadExcel}><ExcelIcon /></button>)}
                    </div>
                    <div className="w-px h-8 bg-gray-700 mx-1 hidden sm:block"></div>
                    <button onClick={onClose} title={t.close} className="p-2 rounded-lg bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-900/50 hover:border-red-500 transition-all"><CloseIcon /></button>
                </div>
                <div className="flex sm:hidden items-center gap-2 flex-wrap justify-center w-full pb-1">{children}</div>
            </header>
            <div className={`transition-all duration-300 ease-in-out flex-shrink-0 ${isSettingsOpen ? 'opacity-100' : 'max-h-0 opacity-0'} overflow-hidden bg-gray-50 border-b border-gray-200 shadow-inner`}>
                {isSettingsOpen && <SettingsPanel options={options} onUpdate={handleDesignUpdate} onSaveDesign={onSaveDesign} resetToDefaults={resetToDefaults} />}
            </div>
            <main ref={previewRef} className="flex-grow bg-gray-600 p-4 overflow-auto flex flex-col items-center custom-scrollbar">
                {pages.length > 1 && (<div className="flex-shrink-0 flex items-center gap-4 mb-4 bg-white/80 backdrop-blur-sm p-1.5 rounded-full shadow-md sticky top-2 z-10"><button onClick={() => handlePageChange(Math.max(0, currentPage - 1))} disabled={currentPage === 0} className="px-4 py-1.5 rounded-full disabled:opacity-50 text-sm font-semibold text-gray-700 hover:bg-gray-200/50 transition">&lt;</button><span className="text-sm font-medium text-gray-800">Page {currentPage + 1} of {pages.length}</span><button onClick={() => handlePageChange(Math.min(pages.length - 1, currentPage + 1))} disabled={currentPage === pages.length - 1} className="px-4 py-1.5 rounded-full disabled:opacity-50 text-sm font-semibold text-gray-700 hover:bg-gray-200/50 transition">&gt;</button></div>)}
                <div className="relative w-fit mx-auto transition-transform duration-150" style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center top' }}>
                    <div 
                        ref={contentRef}
                        onClick={handleContentClick}
                        className="shadow-lg bg-white outline-none focus:ring-2 focus:ring-teal-500 cursor-text" 
                        contentEditable={true}
                        suppressContentEditableWarning={true}
                        dangerouslySetInnerHTML={{ __html: pages[currentPage] || '' }} 
                        style={{ filter: options.colorMode === 'bw' ? 'grayscale(100%)' : 'none' }}
                    />

                    {isGenerating && (
                        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-[100] flex items-center justify-center rounded-sm">
                            <div className="bg-white p-4 rounded-xl shadow-2xl flex items-center gap-3">
                                <svg className="animate-spin h-5 w-5 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                <span className="font-bold text-gray-700 uppercase tracking-widest text-xs">Generating Image...</span>
                            </div>
                        </div>
                    )}

                    <style>{`
                        th, td, div, span, p { cursor: pointer; position: relative; box-sizing: border-box !important; }
                        th:hover, td:hover, div.glossy-box:hover { background-color: rgba(0,0,0,0.03); }
                        [data-selected-element="true"] { outline: 2px solid #ff9f43 !important; outline-offset: -2px; box-shadow: 0 0 8px rgba(255, 159, 67, 0.5) !important; z-index: 1000; position: relative; }
                        td[data-selected-element="true"] > div[data-selected-element="true"] { outline: none !important; }
                    `}</style>
                </div>
            </main>
        </div>
    </div>
  );
};

export default PrintPreview;
