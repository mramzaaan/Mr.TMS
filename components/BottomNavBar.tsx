
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
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const DataEntryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const ClassTimetableIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const TeacherTimetableIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const AdjustmentsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 4h4v4h-4z" /><path d="M14 4h4v4h-4z" /><path d="M4 14h4v4h-4z" /><path d="M14 14h4v4h-4z" /></svg>;
const AttendanceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0 3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

const NavButton: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  design: NavDesign;
  shape: NavShape;
  showLabels: boolean;
  alphaSelected: number;
  alphaUnselected: number;
  isHidden?: boolean; 
  isCollapsed?: boolean;
  position: NavPosition;
}> = ({ label, icon, isActive, onClick, design, shape, showLabels, alphaSelected, alphaUnselected, isHidden, isCollapsed, position }) => {
  const labelParts = label.split(' ');
  
  // Transition class for the button container itself (width, padding, opacity)
  const hiddenClasses = isHidden 
    ? 'max-w-0 opacity-0 px-0 m-0 border-none overflow-hidden' 
    : 'max-w-[100px] opacity-100 w-full';

  // Base classes
  let containerClasses = `relative flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] group ${hiddenClasses} `;
  let bgClasses = 'absolute inset-0 transition-all duration-300 ease-in-out '; 
  let contentWrapperClasses = 'relative z-10 flex flex-col items-center justify-center w-full h-full whitespace-nowrap overflow-hidden ';
  let textClasses = 'text-[9px] sm:text-[10px] font-medium leading-none text-center transition-opacity duration-200 ';
  
  let iconClass = `transition-transform duration-300 ${showLabels ? 'mb-0.5' : ''}`;
  
  const containerStyle: React.CSSProperties = {};
  const bgStyle: React.CSSProperties = { opacity: isActive ? alphaSelected : alphaUnselected };

  // --- Shape Handling (Standard) ---
  if (!isCollapsed) {
      if (shape === 'circle') {
          containerClasses += 'rounded-full aspect-square w-12 h-12 sm:w-14 sm:h-14 mx-auto ';
          bgClasses += 'rounded-full ';
          textClasses = 'hidden'; 
      } else if (shape === 'pill') {
          containerClasses += 'rounded-full h-10 sm:h-12 ';
          bgClasses += 'rounded-full ';
          textClasses += 'mt-0.5 ';
      } else if (shape === 'leaf') {
          containerClasses += 'rounded-tr-3xl rounded-bl-3xl h-full p-1 ';
          bgClasses += 'rounded-tr-3xl rounded-bl-3xl ';
          textClasses += 'mt-1 ';
      } else if (shape === 'squircle') {
          containerClasses += 'rounded-[18px] h-full p-1 ';
          bgClasses += 'rounded-[18px] ';
          textClasses += 'mt-1 ';
      } else if (shape === 'diamond') {
          containerClasses += 'w-12 h-12 rotate-45 rounded-lg mx-auto mb-2 mt-1 shadow-sm ';
          bgClasses += 'rounded-lg ';
          contentWrapperClasses += ' -rotate-45 scale-110'; 
          textClasses = 'hidden';
      } else if (shape === 'arch') {
          containerClasses += 'rounded-t-full rounded-b-xl h-full p-1 ';
          bgClasses += 'rounded-t-full rounded-b-xl ';
          textClasses += 'mt-1 ';
      } else if (shape === 'shield') {
          containerClasses += 'rounded-t-2xl rounded-b-[45%] h-full p-1 ';
          bgClasses += 'rounded-t-2xl rounded-b-[45%] ';
          textClasses += 'mt-1 ';
      } else if (shape === 'petal') {
          containerClasses += 'rounded-tl-3xl rounded-tr-md rounded-br-3xl rounded-bl-md h-full p-1 ';
          bgClasses += 'rounded-tl-3xl rounded-tr-md rounded-br-3xl rounded-bl-md ';
          textClasses += 'mt-1 ';
      } else {
          // Default to square
          containerClasses += 'rounded-none h-full p-1 ';
          bgClasses += 'rounded-none ';
          textClasses += 'mt-1 ';
      }
  }

  // Active state transform
  if (isActive && !isHidden && !isCollapsed) {
      containerClasses += `z-20 drop-shadow-xl `;
  }

  // --- Design Logic ---
  if (!isCollapsed) {
      if (design === 'classic') {
          if (isActive) {
              bgClasses += 'bg-[var(--accent-secondary)] shadow-lg ';
              containerClasses += 'text-[var(--accent-primary)] ';
          } else {
              containerClasses += 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] ';
              bgClasses += 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] '; 
          }
      } else if (design === 'modern') {
          if (isActive) {
              bgClasses += 'bg-[var(--accent-primary)] shadow-xl shadow-[var(--accent-primary)]/40 ';
              containerClasses += 'text-white ';
          } else {
              containerClasses += 'text-[var(--text-secondary)] hover:text-[var(--accent-primary)] ';
              bgClasses += 'bg-[var(--bg-tertiary)] ';
          }
      } else if (design === 'minimal') {
          containerClasses += (shape === 'circle' || shape === 'diamond') ? '' : 'rounded-none ';
          bgClasses += (shape === 'circle' || shape === 'diamond') ? '' : 'rounded-none ';
          if (isActive) {
              if (shape === 'circle' || shape === 'diamond') {
                 bgClasses += 'bg-[var(--bg-tertiary)] ring-2 ring-[var(--accent-primary)] ';
                 containerClasses += 'text-[var(--accent-primary)] ';
              } else {
                 bgClasses += 'border-b-4 border-[var(--accent-primary)] ';
                 containerClasses += 'text-[var(--accent-primary)] ';
              }
          } else {
              containerClasses += 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] ';
              bgClasses += 'bg-[var(--bg-tertiary)] ';
          }
      } else if (design === '3d') {
          if (isActive) {
              bgClasses += 'bg-gradient-to-b from-[var(--accent-primary)] to-[var(--accent-primary-hover)] shadow-[0_6px_0_var(--accent-primary-hover)] ';
              containerClasses += 'text-white ';
          } else {
              bgClasses += 'bg-[var(--bg-tertiary)] shadow-[0_4px_0_var(--border-secondary)] hover:bg-[var(--border-secondary)] ';
              containerClasses += 'text-[var(--text-secondary)] active:translate-y-[4px] '; 
          }
      } else if (design === 'gradient') {
          if (isActive) {
              bgClasses += 'bg-gradient-to-tr from-[var(--accent-primary)] via-purple-500 to-pink-500 shadow-lg ';
              containerClasses += 'text-white ';
          } else {
              containerClasses += 'text-[var(--text-secondary)] ';
              bgClasses += 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] ';
          }
      } else if (design === 'outline') {
          bgClasses += 'border-2 ';
          if (isActive) {
              bgClasses += 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 shadow-md ';
              containerClasses += 'text-[var(--accent-primary)] ';
          } else {
              bgClasses += 'border-transparent hover:border-[var(--text-placeholder)] bg-[var(--bg-tertiary)] ';
              containerClasses += 'text-[var(--text-secondary)] ';
          }
      } else if (design === 'crystal') {
          if (isActive) {
              bgClasses += 'bg-white/60 dark:bg-white/20 backdrop-blur-xl border border-white/50 shadow-[0_0_20px_rgba(255,255,255,0.5)] ';
              containerClasses += 'text-[var(--accent-primary)] ';
          } else {
              containerClasses += 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] ';
              bgClasses += 'bg-white/20 hover:bg-white/30 ';
          }
      } else if (design === 'soft') {
          if (isActive) {
              bgClasses += 'bg-[var(--bg-secondary)] shadow-[inset_3px_3px_6px_rgba(0,0,0,0.1),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] dark:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.3),inset_-3px_-3px_6px_rgba(255,255,255,0.05)] ';
              containerClasses += 'text-[var(--accent-primary)] ';
          } else {
              bgClasses += 'bg-[var(--bg-tertiary)] ';
              containerClasses += 'text-[var(--text-primary)] hover:text-[var(--text-primary)] ';
          }
      } else if (design === 'transparent') {
          if (isActive) {
              bgClasses += 'bg-transparent '; 
              containerClasses += 'text-[var(--accent-primary)] font-bold drop-shadow-md ';
          } else {
              bgClasses += 'bg-[var(--bg-tertiary)] '; 
              containerClasses += 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] ';
          }
      } else {
          if (isActive) {
              bgClasses += 'bg-[var(--accent-secondary)] shadow-sm ';
              containerClasses += 'text-[var(--accent-primary)] ';
          } else {
              containerClasses += 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] ';
              bgClasses += 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] ';
          }
      }
  }

  // --- COLLAPSED STATE OVERRIDES ---
  if (isCollapsed) {
      containerClasses = `relative flex items-center justify-center w-full h-full transition-all duration-300 text-[var(--accent-primary)] ${hiddenClasses} `;
      bgClasses = 'hidden'; 
      textClasses = 'hidden';
      iconClass = 'scale-150 drop-shadow-sm';
  }

  if (!isCollapsed && (shape === 'circle' || shape === 'diamond')) {
      return (
          <div className={`flex flex-col items-center gap-1 transition-all duration-300 ${hiddenClasses}`}>
              <button onClick={onClick} className={containerClasses} style={containerStyle}>
                  <div className={bgClasses} style={bgStyle}></div>
                  <div className={contentWrapperClasses}>
                    <div>{icon}</div>
                  </div>
              </button>
              {showLabels && !isHidden && (
                <span className={`text-[9px] font-bold text-center leading-none transition-colors ${isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}`}>
                    {labelParts[0]}
                </span>
              )}
          </div>
      );
  }

  return (
    <button onClick={onClick} className={containerClasses} style={containerStyle}>
        {!isCollapsed && <div className={bgClasses} style={bgStyle}></div>}
        <div className={contentWrapperClasses}>
            <div className={iconClass}>{icon}</div>
            {showLabels && !isHidden && !isCollapsed && (
                <span className={textClasses}>
                    {labelParts[0]}
                    {shape !== 'pill' && labelParts.length > 1 && <><br/>{labelParts.slice(1).join(' ')}</>}
                </span>
            )}
        </div>
    </button>
  );
};


const BottomNavBar: React.FC<BottomNavBarProps> = ({ t, currentPage, setCurrentPage, position, design, shape, showLabels = true, alphaSelected = 1.0, alphaUnselected = 0.0, barAlpha = 0.8, barColor = '', navAnimation }) => {
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

  let navContainerClasses = `xl:hidden fixed z-50 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] pointer-events-none w-full `;
  let innerContainerClasses = `relative pointer-events-auto flex items-center transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] shadow-xl `; 
  let bgClasses = 'absolute inset-0 transition-all duration-500 ease-in-out ';

  const innerContainerStyle: React.CSSProperties = {};

  if (position === 'top') {
      navContainerClasses += 'top-0 ';
      if (isCollapsed) navContainerClasses += 'items-end pr-6 pt-6 md:pr-8 '; 
      else navContainerClasses += 'items-end pr-4 pt-4 md:items-end md:pr-6 md:pt-6 ';
  } else {
      navContainerClasses += 'bottom-0 ';
      if (isCollapsed) navContainerClasses += 'items-start pl-6 pb-8 md:pl-8 '; 
      else navContainerClasses += 'items-start pl-4 pb-6 md:items-start md:pl-6 md:pb-6 ';
  }

  const expandedWidth = 'min(90%, 32rem)';

  if (isCollapsed) {
      innerContainerStyle.width = '5rem';
      innerContainerStyle.height = '5rem';
      innerContainerStyle.borderRadius = '9999px';
      innerContainerStyle.justifyContent = 'center';
      
      bgClasses = 'absolute inset-0 rounded-full border-2 border-[var(--accent-primary)] bg-transparent backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.1)] ';
      innerContainerClasses += 'shadow-2xl ';
  } else {
      innerContainerStyle.width = expandedWidth;
      innerContainerStyle.height = '4rem';
      innerContainerStyle.borderRadius = '1rem';
      innerContainerStyle.justifyContent = 'space-around';
      
      bgClasses += 'rounded-2xl border border-[var(--border-primary)] ';
      if (design === 'modern' || design === 'classic' || design === 'outline' || design === 'minimal') {
          bgClasses += 'bg-[var(--bg-secondary)] ';
      }
      else if (design === '3d') bgClasses += 'bg-[var(--bg-secondary)] border-b-4 border-r-4 border-[var(--border-secondary)] ';
      else if (design === 'crystal') bgClasses += 'bg-white/30 dark:bg-black/30 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl ';
      else if (design === 'soft') bgClasses += 'bg-[var(--bg-tertiary)] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] border border-[var(--border-primary)]/50 ';
      else if (design === 'gradient') bgClasses += 'bg-gradient-to-r from-[var(--bg-secondary)] via-[var(--bg-tertiary)] to-[var(--bg-secondary)] ';
      else if (design === 'transparent') bgClasses += 'bg-[var(--bg-secondary)]/80 backdrop-blur-xl border border-[var(--border-primary)]/50 ';
  }

  return (
    <nav className={navContainerClasses}>
      <div className={innerContainerClasses} style={innerContainerStyle} dir="ltr">
        <div 
            className={bgClasses} 
            style={{ 
                opacity: barAlpha,
                backgroundColor: (barColor && !isCollapsed) ? barColor : undefined
            }} 
        />
        
        {navItems.map(item => (
            <NavButton
                key={item.page}
                label={t[item.labelKey]}
                icon={item.icon}
                isActive={currentPage === item.page}
                onClick={() => { setCurrentPage(item.page); setIsCollapsed(false); }} 
                design={design}
                shape={shape}
                showLabels={showLabels}
                alphaSelected={alphaSelected}
                alphaUnselected={alphaUnselected}
                isHidden={isCollapsed && currentPage !== item.page}
                isCollapsed={isCollapsed}
                position={position}
            />
        ))}
      </div>
    </nav>
  );
};

export default BottomNavBar;
