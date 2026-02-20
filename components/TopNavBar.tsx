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
  theme: string;
}> = ({ label, icon, isActive, onClick, isCollapsed, isHidden, theme }) => {
  
  const colors: Record<string, { bg: string, text: string }> = {
      blue: { bg: 'bg-blue-500', text: 'text-blue-500' },
      emerald: { bg: 'bg-emerald-500', text: 'text-emerald-500' },
      indigo: { bg: 'bg-indigo-500', text: 'text-indigo-500' },
      violet: { bg: 'bg-violet-500', text: 'text-violet-500' },
      orange: { bg: 'bg-orange-500', text: 'text-orange-500' },
      teal: { bg: 'bg-teal-500', text: 'text-teal-500' },
      slate: { bg: 'bg-slate-500', text: 'text-slate-500' },
  };
  const color = colors[theme] || colors.blue;

  if (isCollapsed) {
     const hiddenClasses = isHidden ? 'w-0 opacity-0 overflow-hidden m-0 p-0 border-0' : 'w-10 h-10 opacity-100 mx-1';
     return (
        <button
          onClick={onClick}
          className={`flex items-center justify-center rounded-full transition-all duration-300 ${hiddenClasses} ${isActive ? color.bg + ' text-white shadow-lg' : 'bg-white ' + color.text + ' hover:bg-gray-50 border border-gray-100'}`}
          title={label}
        >
           {React.cloneElement(icon as React.ReactElement, { className: "h-5 w-5" })}
        </button>
     );
  }

  return (
    <button
      onClick={onClick}
      className={`group relative flex items-center h-12 transition-all duration-300 focus:outline-none ${isActive ? 'scale-105 z-10' : 'hover:scale-105 opacity-90 hover:opacity-100'}`}
    >
      {/* Left Icon Box */}
      <div className={`relative z-20 h-10 w-12 bg-white flex items-center justify-center rounded-l-lg shadow-[2px_0_5px_rgba(0,0,0,0.05)] border border-gray-100`}>
         <div className={`${color.text} transition-colors duration-300`}>
            {React.cloneElement(icon as React.ReactElement, { className: "h-6 w-6" })}
         </div>
      </div>

      {/* Right Label Box */}
      <div
          className={`relative z-10 h-10 flex items-center pl-4 pr-8 -ml-2 transition-colors duration-300 shadow-sm`}
          style={{ 
            clipPath: 'polygon(0% 0%, 90% 0%, 100% 50%, 90% 100%, 0% 100%)',
          }}
      >
          <div className={`absolute inset-0 ${isActive ? color.bg : 'bg-gray-100'} -z-10 transition-colors duration-300`}></div>
          <span className={`text-xs font-black uppercase tracking-wider whitespace-nowrap ${isActive ? 'text-white' : color.text}`}>
            {label}
          </span>
      </div>
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

  const navItems: { page: Page; labelKey: string; icon: React.ReactNode; theme: string }[] = [
    { page: 'home', labelKey: 'home', icon: <HomeIcon />, theme: 'blue' },
    { page: 'dataEntry', labelKey: 'dataEntry', icon: <DataEntryIcon />, theme: 'emerald' },
    { page: 'classTimetable', labelKey: 'classTimetable', icon: <ClassTimetableIcon />, theme: 'indigo' },
    { page: 'teacherTimetable', labelKey: 'teacherTimetable', icon: <TeacherTimetableIcon />, theme: 'violet' },
    { page: 'alternativeTimetable', labelKey: 'adjustments', icon: <AdjustmentsIcon />, theme: 'orange' },
    { page: 'attendance', labelKey: 'attendance', icon: <AttendanceIcon />, theme: 'teal' },
    { page: 'settings', labelKey: 'settings', icon: <SettingsIcon />, theme: 'slate' },
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
                        theme={item.theme}
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