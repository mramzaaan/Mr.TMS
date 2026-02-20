import React from 'react';
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

const BannerNavButton: React.FC<{
  label: string;
  icon: React.ReactNode;
  activeBgColor: string;
  activeTextColor: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, activeBgColor, activeTextColor, isActive, onClick }) => (
  <button 
      onClick={onClick}
      className={`group relative flex items-center h-14 transition-all duration-300 ${isActive ? 'scale-110 z-10 drop-shadow-2xl' : 'scale-100 hover:scale-105 drop-shadow-md hover:drop-shadow-xl'}`}
  >
      {/* Left Colored Section - Icon */}
      <div className={`${isActive ? activeBgColor : 'bg-slate-400'} h-full flex items-center justify-center px-5 relative z-20 clip-path-left min-w-[70px] transition-colors duration-300`}>
          <div className="text-white transform group-hover:scale-110 transition-transform duration-300">
             {React.cloneElement(icon as React.ReactElement, { className: "h-7 w-7" })}
          </div>
      </div>
      
      {/* Right White Section - Label */}
      <div className="bg-white h-full flex items-center pl-10 pr-8 relative z-10 -ml-6 clip-path-right min-w-[160px]">
          <span className={`text-sm font-black uppercase tracking-tight transition-colors duration-300 ${isActive ? activeTextColor : 'text-slate-400'}`}>
              {label}
          </span>
      </div>
  </button>
);

const TopNavBar: React.FC<TopNavBarProps> = ({ t, currentPage, setCurrentPage, schoolConfig }) => {
  const navItems: { page: Page; labelKey: string; icon: React.ReactNode; activeBgColor: string; activeTextColor: string }[] = [
    { page: 'home', labelKey: 'home', icon: <HomeIcon />, activeBgColor: 'bg-pink-600', activeTextColor: 'text-pink-600' },
    { page: 'dataEntry', labelKey: 'dataEntry', icon: <DataEntryIcon />, activeBgColor: 'bg-amber-500', activeTextColor: 'text-amber-600' },
    { page: 'classTimetable', labelKey: 'classTimetable', icon: <ClassTimetableIcon />, activeBgColor: 'bg-green-600', activeTextColor: 'text-green-600' },
    { page: 'teacherTimetable', labelKey: 'teacherTimetable', icon: <TeacherTimetableIcon />, activeBgColor: 'bg-blue-600', activeTextColor: 'text-blue-600' },
    { page: 'alternativeTimetable', labelKey: 'adjustments', icon: <AdjustmentsIcon />, activeBgColor: 'bg-purple-600', activeTextColor: 'text-purple-600' },
    { page: 'attendance', labelKey: 'attendance', icon: <AttendanceIcon />, activeBgColor: 'bg-cyan-600', activeTextColor: 'text-cyan-600' },
    { page: 'settings', labelKey: 'settings', icon: <SettingsIcon />, activeBgColor: 'bg-slate-600', activeTextColor: 'text-slate-600' },
  ];

  return (
    <>
      <style>{`
        .clip-path-left {
          clip-path: polygon(0 0, 100% 0, 85% 100%, 0% 100%);
        }
        .clip-path-right {
          clip-path: polygon(10% 0, 100% 0, 100% 100%, 0% 100%);
        }
      `}</style>
      <nav className="hidden xl:flex fixed top-0 left-0 right-0 z-40 w-full pointer-events-none justify-center pt-4">
        <div className="pointer-events-auto flex items-center gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-full border border-white/20 shadow-2xl">
            {/* Logo */}
            {schoolConfig.schoolLogoBase64 && (
                <div className="mr-4 bg-white p-1 rounded-full shadow-md">
                    <img src={schoolConfig.schoolLogoBase64} alt="School Logo" className="h-12 w-12 object-contain rounded-full" />
                </div>
            )}

            {/* Nav Items */}
            <div className="flex items-center gap-2">
                {navItems.map((item) => (
                    <BannerNavButton
                        key={item.page}
                        label={t[item.labelKey]}
                        icon={item.icon}
                        activeBgColor={item.activeBgColor}
                        activeTextColor={item.activeTextColor}
                        isActive={currentPage === item.page}
                        onClick={() => setCurrentPage(item.page)}
                    />
                ))}
            </div>
        </div>
      </nav>
    </>
  );
};

export default TopNavBar;