
import React, { useState, useEffect } from 'react';
import type { Page } from '../types';
import type { NavPosition, NavDesign, NavShape } from '../types';

interface BottomNavBarProps {
  t: any;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  position: NavPosition;
  design: NavDesign;
  shape: NavShape;
  showLabels?: boolean;
  alphaSelected?: number;
  alphaUnselected?: number;
  barAlpha?: number;
  barColor?: string;
  navAnimation: boolean;
}

// Icon components
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const DataEntryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const ClassTimetableIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const TeacherTimetableIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const AdjustmentsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 4h4v4h-4z" /><path d="M14 4h4v4h-4z" /><path d="M4 14h4v4h-4z" /><path d="M14 14h4v4h-4z" /></svg>;
const AttendanceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0 3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

const BottomNavBar: React.FC<BottomNavBarProps> = ({ t, currentPage, setCurrentPage, navAnimation, showLabels }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    if (!navAnimation) {
        setIsCollapsed(false);
        return;
    }

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
  }, [lastScrollY, navAnimation]);

  const navItems: { page: Page; labelKey: string; icon: React.ReactNode }[] = [
    { page: 'home', labelKey: 'home', icon: <HomeIcon /> },
    { page: 'dataEntry', labelKey: 'dataEntry', icon: <DataEntryIcon /> },
    { page: 'classTimetable', labelKey: 'classTimetable', icon: <ClassTimetableIcon /> },
    { page: 'teacherTimetable', labelKey: 'teacherTimetable', icon: <TeacherTimetableIcon /> },
    { page: 'alternativeTimetable', labelKey: 'adjustments', icon: <AdjustmentsIcon /> },
    { page: 'attendance', labelKey: 'attendance', icon: <AttendanceIcon /> },
    { page: 'settings', labelKey: 'settings', icon: <SettingsIcon /> },
  ];

  const activeIndex = navItems.findIndex(item => item.page === currentPage);
  const itemCount = navItems.length;

  return (
    <div className={`xl:hidden fixed bottom-0 left-0 w-full z-50 transition-transform duration-300 ${isCollapsed ? 'translate-y-full' : 'translate-y-0'}`}>
      <div className="relative w-full bg-[var(--bg-secondary)] h-20 rounded-t-[2rem] shadow-[0_-5px_20px_rgba(0,0,0,0.08)] border-t border-[var(--border-secondary)] pb-2">
        
        {/* Moving Indicator */}
        <div 
            className="absolute -top-7 h-14 w-14 bg-[var(--accent-primary)] rounded-full transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] flex items-center justify-center shadow-lg z-20 cursor-pointer"
            style={{ 
                left: `calc((100% / ${itemCount}) * ${activeIndex} + (100% / ${itemCount} / 2) - 1.75rem)` 
            }}
            onClick={() => setIsCollapsed(false)}
        >
            {/* Inverted Curves (Fillets) */}
            <span 
                className="absolute top-[50%] -left-[20px] w-[20px] h-[20px] bg-transparent rounded-tr-[20px]"
                style={{ boxShadow: '5px -5px 0 0 var(--bg-secondary)' }}
            ></span>
            <span 
                className="absolute top-[50%] -right-[20px] w-[20px] h-[20px] bg-transparent rounded-tl-[20px]"
                style={{ boxShadow: '-5px -5px 0 0 var(--bg-secondary)' }}
            ></span>
            
            {/* Active Icon */}
            <div className="text-white transform scale-110">
                {navItems[activeIndex]?.icon}
            </div>
        </div>

        {/* Nav Items */}
        <div className="flex w-full h-full items-end pb-1">
            {navItems.map((item, index) => {
                const isActive = index === activeIndex;
                return (
                    <button 
                        key={item.page}
                        onClick={() => { setCurrentPage(item.page); setIsCollapsed(false); }}
                        className="flex-1 relative flex flex-col items-center justify-end pb-3 z-10 focus:outline-none h-full group"
                    >
                        <span 
                            className={`transition-all duration-300 absolute top-5 ${isActive ? 'opacity-0 scale-50' : 'opacity-100 scale-100 text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)]'}`}
                        >
                            {React.cloneElement(item.icon as React.ReactElement, { className: "h-7 w-7" })}
                        </span>
                        
                        <span 
                            className={`text-[10px] font-bold transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0 text-[var(--accent-primary)]' : 'opacity-0 translate-y-4'}`}
                        >
                            {t[item.labelKey].split(' ')[0]}
                        </span>
                    </button>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default BottomNavBar;
