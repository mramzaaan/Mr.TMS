import React, { useState, useEffect } from 'react';
import type { Page, SchoolConfig } from '../types';

interface TopNavBarProps {
  t: any;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  schoolConfig: SchoolConfig;
}

// Icon components for clarity
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const DataEntryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const ClassTimetableIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const TeacherTimetableIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const AdjustmentsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 4h4v4h-4z" /><path d="M14 4h4v4h-4z" /><path d="M4 14h4v4h-4z" /><path d="M14 14h4v4h-4z" /></svg>;
const AttendanceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0 3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

const NavButton: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  isCollapsed: boolean;
  isHidden: boolean;
}> = ({ label, icon, isActive, onClick, isCollapsed, isHidden }) => {
  
  // Transition logic for hiding/showing items
  const hiddenClasses = isHidden
    ? 'max-w-0 opacity-0 px-0 m-0 border-0 overflow-hidden'
    : isCollapsed 
        ? 'max-w-[100px] opacity-100 w-full h-full' // Full size in collapsed circle
        : 'max-w-[200px] opacity-100 px-4 py-2'; // Normal size

  // When collapsed, remove gap to ensure perfect centering
  const baseClasses = `relative flex items-center justify-center ${isCollapsed ? 'gap-0' : 'gap-2'} font-semibold transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] whitespace-nowrap overflow-hidden focus:outline-none ${hiddenClasses}`;
  
  // Active state styling
  const activeClasses = isActive 
    ? (isCollapsed 
        ? 'text-[var(--accent-primary)]' // Only text/icon color when collapsed (container has border)
        : 'bg-[var(--accent-primary)] text-[var(--accent-text)]') // Normal filled style when expanded
    : 'text-[var(--text-secondary)] hover:bg-[var(--accent-secondary-hover)] hover:text-[var(--text-primary)]';

  // Shape adjustment
  const shapeClasses = isCollapsed 
    ? 'rounded-full p-0' // Perfectly round when collapsed
    : 'rounded-md text-sm focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-primary)] focus:ring-offset-[var(--bg-secondary)]';

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${activeClasses} ${shapeClasses}`}
      title={isCollapsed ? label : ''}
    >
      <div className={`transition-transform duration-300 ${isCollapsed ? 'scale-150' : ''}`}>{icon}</div>
      <span className={`transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>{label}</span>
    </button>
  );
};

const TopNavBar: React.FC<TopNavBarProps> = ({ t, currentPage, setCurrentPage, schoolConfig }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 50) {
          setIsCollapsed(false);
      } else if (currentScrollY > lastScrollY + 5) {
          setIsCollapsed(true);
      } else if (currentScrollY < lastScrollY - 10) {
          setIsCollapsed(false);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const navItems: { page: Page; labelKey: string; icon: React.ReactNode }[] = [
    { page: 'home', labelKey: 'home', icon: <HomeIcon /> },
    { page: 'dataEntry', labelKey: 'dataEntry', icon: <DataEntryIcon /> },
    { page: 'classTimetable', labelKey: 'classTimetable', icon: <ClassTimetableIcon /> },
    { page: 'teacherTimetable', labelKey: 'teacherTimetable', icon: <TeacherTimetableIcon /> },
    { page: 'alternativeTimetable', labelKey: 'adjustments', icon: <AdjustmentsIcon /> },
    { page: 'attendance', labelKey: 'attendance', icon: <AttendanceIcon /> },
    { page: 'settings', labelKey: 'settings', icon: <SettingsIcon /> },
  ];

  return (
    <>
      <nav className="hidden xl:flex fixed top-0 right-0 z-40 w-full pointer-events-none flex-col items-end">
        <div className={`
            relative pointer-events-auto flex items-center transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1.0)]
            ${isCollapsed 
                // Collapsed: Small circle
                ? 'mr-6 mt-6 w-20 h-20 rounded-full border-2 border-[var(--accent-primary)] justify-center shadow-2xl overflow-hidden bg-[var(--bg-secondary)] backdrop-blur-xl' 
                // Expanded: Floating Dock in Top Right Corner (Right-Aligned) - Transparent
                : 'mr-6 mt-4 w-auto h-[72px] rounded-2xl bg-transparent px-6 justify-between'
            }
        `} dir="ltr">
            {/* Logo Section - Fades out and shrinks width when collapsing */}
            <div className={`flex items-center gap-3 overflow-hidden whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] ${isCollapsed ? 'max-w-0 opacity-0 px-0' : 'max-w-[400px] opacity-100 mr-6'}`}>
                {schoolConfig.schoolLogoBase64 && (
                    <img src={schoolConfig.schoolLogoBase64} alt="School Logo" className="h-9 w-9 object-contain rounded-full" />
                )}
            </div>

            {/* Nav Items - Centers content when collapsed */}
            <div className={`flex items-center gap-2 transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] ${isCollapsed ? 'w-full justify-center' : ''}`}>
                {navItems.map(item => {
                    const isActive = currentPage === item.page;
                    // When collapsed, hide all except active
                    const isHidden = isCollapsed && !isActive;

                    return (
                    <NavButton
                        key={item.page}
                        label={t[item.labelKey]}
                        icon={item.icon}
                        isActive={isActive}
                        onClick={() => { setCurrentPage(item.page); setIsCollapsed(false); }}
                        isCollapsed={isCollapsed}
                        isHidden={isHidden}
                    />
                    );
                })}
            </div>
        </div>
      </nav>
    </>
  );
};

export default TopNavBar;