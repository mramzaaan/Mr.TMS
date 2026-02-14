
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import type { Language, SchoolClass, Subject, Teacher, Period, TimetableGridData, SchoolConfig, Adjustment, JointPeriod, ClassSubject, DownloadDesignConfig, TimetableSession } from '../types';
import { allDays } from '../types';
import PeriodCard from './PeriodCard';
import PeriodStack from './PeriodStack';
import CopyTimetableModal from './CopyTimetableModal';
import PrintPreview from './PrintPreview';
import { generateUniqueId } from '../types';
import { translations } from '../i18n';
import { ClassCommunicationModal } from './ClassCommunicationModal';
import DownloadModal from './DownloadModal';
import { generateClassTimetableHtml } from './reportUtils';
import NoSessionPlaceholder from './NoSessionPlaceholder';
import AddLessonForm from './AddLessonForm'; // Import AddLessonForm

interface ClassTimetablePageProps {
  t: any;
  language: Language;
  classes: SchoolClass[];
  subjects: Subject[];
  teachers: Teacher[];
  jointPeriods: JointPeriod[];
  adjustments: Record<string, Adjustment[]>;
  onSetClasses: (classes: SchoolClass[]) => void;
  schoolConfig: SchoolConfig;
  onUpdateSchoolConfig: (newConfig: Partial<SchoolConfig>) => void;
  selection: { classId: string | null; highlightedTeacherId: string; };
  onSelectionChange: React.Dispatch<React.SetStateAction<{ classId: string | null; highlightedTeacherId: string; }>>;
  openConfirmation: (title: string, message: React.ReactNode, onConfirm: () => void) => void;
  hasActiveSession: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  // New props for AddLessonForm
  onAddJointPeriod: (jp: JointPeriod) => void;
  onUpdateJointPeriod: (jp: JointPeriod) => void;
  onDeleteJointPeriod: (jpId: string) => void;
  onUpdateTimetableSession: (updater: (session: TimetableSession) => TimetableSession) => void;
}

type SlotAvailability = { status: 'available' | 'conflict'; reason?: string };
type AvailabilityGrid = Record<keyof TimetableGridData, SlotAvailability[]>;

const teacherColorNames = [
  'subject-sky', 'subject-green', 'subject-yellow', 'subject-red',
  'subject-purple', 'subject-pink', 'subject-orange', 'subject-teal',
  'subject-lime', 'subject-cyan', 'subject-emerald', 'subject-fuchsia',
  'subject-rose', 'subject-amber', 'subject-blue', 'subject-indigo'
];

const WarningIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600 bg-white/80 rounded-full p-0.5 shadow-md" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1-1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const ClearIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const CopyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const UndoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>;
const RedoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
const SaveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 011-1h3.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V6a1 1 0 01-1 1h-1a1 1 0 01-1-1V4z" /></svg>;
const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>;
const ChevronLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;

const ClassTimetablePage: React.FC<ClassTimetablePageProps> = ({ t, language, classes, subjects, teachers, jointPeriods, adjustments, onSetClasses, schoolConfig, onUpdateSchoolConfig, selection, onSelectionChange, openConfirmation, hasActiveSession, onUndo, onRedo, onSave, canUndo, canRedo, onAddJointPeriod, onUpdateJointPeriod, onDeleteJointPeriod, onUpdateTimetableSession }) => {
  if (!hasActiveSession) {
    return <NoSessionPlaceholder t={t} />;
  }

  const { classId: selectedClassId, highlightedTeacherId } = selection;
  const [draggedData, setDraggedData] = useState<{ periods: Period[], sourceDay?: keyof TimetableGridData, sourcePeriodIndex?: number } | null>(null);
  const [moveSource, setMoveSource] = useState<{ periods: Period[], sourceDay?: keyof TimetableGridData, sourcePeriodIndex?: number } | null>(null);
  
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [isCommModalOpen, setIsCommModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  
  // Custom Dropdown State
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [classSortBy, setClassSortBy] = useState<'serial' | 'room' | 'name'>('serial');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [classSearchQuery, setClassSearchQuery] = useState('');
  const classDropdownRef = useRef<HTMLDivElement>(null);

  // Ref for detecting clicks outside
  const tableRef = useRef<HTMLDivElement>(null);

  // Derived active days and periods based on config
  const activeDays = useMemo(() => allDays.filter(day => schoolConfig.daysConfig?.[day]?.active ?? true), [schoolConfig.daysConfig]);
  const maxPeriods = useMemo(() => Math.max(...activeDays.map(day => schoolConfig.daysConfig?.[day]?.periodCount ?? 8)), [activeDays, schoolConfig.daysConfig]);
  const periodLabels = useMemo(() => Array.from({length: maxPeriods}, (_, i) => (i + 1).toString()), [maxPeriods]);

  // Filter out the pseudo-class 'non-teaching-duties' from the selectable list
  const visibleClasses = useMemo(() => classes.filter(c => c.id !== 'non-teaching-duties'), [classes]);

  useEffect(() => {
      // Ensure we select a valid visible class if none is selected
      if ((!selectedClassId || selectedClassId === 'non-teaching-duties') && visibleClasses.length > 0) {
          onSelectionChange(prev => ({ ...prev, classId: visibleClasses[0].id }));
      }
  }, [visibleClasses, selectedClassId, onSelectionChange]);
  
  // Click outside to cancel selection
  useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
          if (moveSource && !(e.target as Element).closest('.period-stack-clickable') && !(e.target as Element).closest('.timetable-slot')) {
              setMoveSource(null);
              onSelectionChange(prev => ({ ...prev, highlightedTeacherId: '' }));
          }
      };
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
  }, [moveSource, onSelectionChange]);

  // Click outside for dropdown
  useEffect(() => {
      const handleClickOutsideDropdown = (event: MouseEvent) => {
          if (classDropdownRef.current && !classDropdownRef.current.contains(event.target as Node)) {
              setIsClassDropdownOpen(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutsideDropdown);
      return () => document.removeEventListener('mousedown', handleClickOutsideDropdown);
  }, []);

  const selectedClass = useMemo(() => classes.find(c => c.id === selectedClassId), [classes, selectedClassId]);

  const sortedClasses = useMemo(() => {
      let sorted = [...visibleClasses];
      if (classSearchQuery) {
          const q = classSearchQuery.toLowerCase();
          sorted = sorted.filter(c => 
              c.nameEn.toLowerCase().includes(q) || 
              c.nameUr.includes(q) || 
              (c.roomNumber && c.roomNumber.toLowerCase().includes(q))
          );
      }
      
      return sorted.sort((a, b) => {
          let res = 0;
          if (classSortBy === 'serial') {
              res = (a.serialNumber ?? 99999) - (b.serialNumber ?? 99999);
          } else if (classSortBy === 'room') {
              const rA = a.roomNumber || '';
              const rB = b.roomNumber || '';
              // Push empty/missing rooms to the bottom regardless of sort direction if desired, 
              // or let standard sort handle it (empty string usually comes first in asc).
              // Here we push empty strings to the bottom in Ascending order for better UX.
              if (rA === '' && rB !== '') return 1;
              if (rA !== '' && rB === '') return -1;
              
              // Use numeric sort for room numbers (e.g. "2" comes before "10")
              const dir = sortDirection === 'asc' ? 1 : -1;
              return rA.localeCompare(rB, undefined, { numeric: true }) * dir;
          } else { // name
              res = a.nameEn.localeCompare(b.nameEn);
          }
          return sortDirection === 'asc' ? res : -res;
      });
  }, [visibleClasses, classSortBy, classSearchQuery, sortDirection]);

  const currentClassIndex = useMemo(() => {
    if (!selectedClassId) return -1;
    return sortedClasses.findIndex(c => c.id === selectedClassId);
  }, [selectedClassId, sortedClasses]);

  const handlePreviousClass = () => {
    if (currentClassIndex > 0) {
        onSelectionChange(prev => ({ ...prev, classId: sortedClasses[currentClassIndex - 1].id }));
    }
  };

  const handleNextClass = () => {
    if (currentClassIndex < sortedClasses.length - 1) {
        onSelectionChange(prev => ({ ...prev, classId: sortedClasses[currentClassIndex + 1].id }));
    }
  };

  const getTeacherAvailability = useCallback((day: keyof TimetableGridData, periodIndex: number): Set<string> => {
      const busyTeacherIds = new Set<string>();
      classes.forEach(c => {
          // If we are placing a joint period, we MUST ignore the current schedule of ANY class involved in that joint period
          // to avoid "conflict with self". This is complex here, so we do a simpler check:
          // Ignore the selected class (obviously)
          if (c.id === selectedClassId) return; 
          
          if(Array.isArray(c.timetable[day])) {
              c.timetable[day][periodIndex]?.forEach(p => {
                  // Ignore empty teacherId (used for class-only/no-teacher lessons)
                  if(p.teacherId) busyTeacherIds.add(p.teacherId);
              });
          }
      });
      return busyTeacherIds;
  }, [classes, selectedClassId]);

  const availabilityGrid = useMemo(() => {
      if (!selectedClass || (!draggedData && !moveSource)) return null;
      
      const source = draggedData || moveSource;
      if (!source) return null;

      const grid: AvailabilityGrid = {
          Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: []
      };
      
      activeDays.forEach(day => {
          const periodLimit = schoolConfig.daysConfig?.[day]?.periodCount ?? 8;
          
          for (let i = 0; i < maxPeriods; i++) {
              if (i >= periodLimit) {
                   grid[day].push({ status: 'conflict', reason: 'Closed' });
                   continue;
              }
              
              let hasConflict = false;
              let conflictReason = '';
              
              // 1. Build a Map of busy teachers for this specific slot across ALL other classes
              // Map: TeacherID -> { classId: string, isJoint: boolean, jointId?: string }
              const busyTeacherMap = new Map<string, { classId: string, isJoint: boolean, jointId?: string }>();
              
              classes.forEach(c => {
                  if (c.id === selectedClassId) return;
                  
                  // Safe access to timetable
                  const daySlots = c.timetable[day];
                  if (Array.isArray(daySlots)) {
                      daySlots[i]?.forEach(p => {
                          if (p.teacherId) {
                              // If teacher already marked busy, we keep the first occurrence as reason
                              if (!busyTeacherMap.has(p.teacherId)) {
                                  busyTeacherMap.set(p.teacherId, { 
                                      classId: c.id, 
                                      isJoint: !!p.jointPeriodId, 
                                      jointId: p.jointPeriodId 
                                  });
                              }
                          }
                      });
                  }
              });
              
              // 2. Check each period in the source (dragged items) against the busy map
              for (const p of source.periods) {
                  if (p.teacherId && busyTeacherMap.has(p.teacherId)) {
                      const busyInfo = busyTeacherMap.get(p.teacherId)!;
                      
                      // Check if it's the SAME Joint Period.
                      // If I am dragging Joint Period ID 'A' and the teacher is busy in another class with Joint Period ID 'A',
                      // that is NOT a conflict (it's the linked class).
                      let isSafe = false;
                      if (p.jointPeriodId && busyInfo.isJoint && p.jointPeriodId === busyInfo.jointId) {
                          isSafe = true;
                      }
                      
                      if (!isSafe) {
                          hasConflict = true;
                          const t = teachers.find(tea => tea.id === p.teacherId);
                          const c = classes.find(cls => cls.id === busyInfo.classId);
                          conflictReason = `${t?.nameEn || 'Teacher'} busy in ${c?.nameEn || 'another class'}`;
                          break; 
                      }
                  }
              }
              
              if (!hasConflict) {
                  // 3. Check for internal constraints (Target Slot content)
                  // Exclude the source periods if they are already in this slot (drag-and-drop within same slot or move)
                  const currentPeriods = (selectedClass.timetable[day]?.[i] || []).filter(p => !source.periods.some(sp => sp.id === p.id));
                  const potentialPeriods = [...currentPeriods, ...source.periods];
                  
                  const groupUsage = new Set<string>(); // Set of Group IDs
                  let hasStandardSubject = false;
                  let valid = true;

                  for (const p of potentialPeriods) {
                      // Resolve Group Info
                      let groupId: string | undefined;
                      
                      if (p.jointPeriodId) {
                          const jp = jointPeriods.find(j => j.id === p.jointPeriodId);
                          const assign = jp?.assignments.find(a => a.classId === selectedClass.id);
                          groupId = assign?.groupId;
                      } else {
                          const sub = selectedClass.subjects.find(s => s.subjectId === p.subjectId);
                          groupId = sub?.groupId;
                      }

                      if (groupId) {
                          if (groupUsage.has(groupId)) {
                              valid = false;
                              conflictReason = "Duplicate group";
                          }
                          groupUsage.add(groupId);
                      } else {
                          hasStandardSubject = true;
                      }
                  }

                  if (valid) {
                      if (hasStandardSubject && groupUsage.size > 0) {
                          valid = false;
                          conflictReason = "Cannot mix Standard & Grouped";
                      }
                  }
                  
                  if (!valid) {
                      hasConflict = true;
                      if (!conflictReason) conflictReason = "Invalid Combination";
                  }
              }
              
              grid[day].push({ 
                  status: hasConflict ? 'conflict' : 'available', 
                  reason: conflictReason 
              });
          }
      });
      return grid;
  }, [selectedClass, draggedData, moveSource, activeDays, maxPeriods, schoolConfig.daysConfig, getTeacherAvailability, subjects, jointPeriods, classes, selectedClassId, teachers]);


  const teacherColorMap = useMemo(() => {
    const map = new Map<string, string>();
    teachers.forEach((teacher, index) => {
      map.set(teacher.id, teacherColorNames[index % teacherColorNames.length]);
    });
    return map;
  }, [teachers]);

  // --- Interaction Handlers ---

  const handleDragStart = (periods: Period[], sourceDay?: keyof TimetableGridData, sourcePeriodIndex?: number) => {
    setDraggedData({ periods, sourceDay, sourcePeriodIndex });
    setMoveSource(null); // Clear selection if drag starts
    if (periods[0]?.teacherId) {
        onSelectionChange(prev => ({ ...prev, highlightedTeacherId: periods[0].teacherId }));
    }
  };
  
  const handleDragEnd = () => {
      setDraggedData(null);
      onSelectionChange(prev => ({ ...prev, highlightedTeacherId: '' }));
  };

  const handleStackClick = (periods: Period[], sourceDay?: keyof TimetableGridData, sourcePeriodIndex?: number) => {
      if (moveSource && moveSource.periods[0].id === periods[0].id) {
          setMoveSource(null); // Deselect
          onSelectionChange(prev => ({ ...prev, highlightedTeacherId: '' }));
      } else {
          setMoveSource({ periods, sourceDay, sourcePeriodIndex });
          if (periods[0]?.teacherId) {
              onSelectionChange(prev => ({ ...prev, highlightedTeacherId: periods[0].teacherId }));
          }
      }
  };

  const handleExecuteMove = (targetDay: keyof TimetableGridData, targetPeriodIndex: number) => {
    const source = draggedData || moveSource;
    if (!source || !selectedClass) return;

    const periodLimit = schoolConfig.daysConfig?.[targetDay]?.periodCount ?? 8;
    if (targetPeriodIndex >= periodLimit) return;

    const { periods, sourceDay, sourcePeriodIndex } = source;

    if (sourceDay === targetDay && sourcePeriodIndex === targetPeriodIndex) return;

    // --- CHECK FOR OCCUPIED SLOT & REPLACEMENT ---
    const targetPeriods = selectedClass.timetable[targetDay]?.[targetPeriodIndex] || [];
    const isTargetOccupied = targetPeriods.length > 0;

    const getGroupSetId = (p: Period) => {
        if (p.jointPeriodId) {
             const jp = jointPeriods.find(j => j.id === p.jointPeriodId);
             return jp?.assignments.find(a => a.classId === selectedClass.id)?.groupSetId;
        }
        const sub = selectedClass.subjects.find(s => s.subjectId === p.subjectId);
        return sub?.groupSetId;
    };

    const incomingGroupSetId = getGroupSetId(periods[0]);
    let isCompatibleGroup = false;

    // Check if incoming is a group and target is a group from the SAME set
    if (incomingGroupSetId && isTargetOccupied) {
        // Check first period in target (assuming target periods belong to same set or valid config)
        const targetGroupSetId = getGroupSetId(targetPeriods[0]);
        if (targetGroupSetId === incomingGroupSetId) {
            isCompatibleGroup = true;
        }
    }

    let needsReplacement = false;
    let replacementMessage = '';

    if (isTargetOccupied && !isCompatibleGroup) {
        needsReplacement = true;
        const targetSubjectName = subjects.find(s => s.id === targetPeriods[0].subjectId)?.nameEn || 'Period';
        replacementMessage = `This slot is already occupied by ${targetSubjectName}.\nReplacing it will unschedule the existing period.`;
    }

    const performUpdate = (doOverwrite: boolean = false) => {
        let newClasses = [...classes];
        const jointPeriodId = periods[0].jointPeriodId;
        const jointPeriodDef = jointPeriodId ? jointPeriods.find(jp => jp.id === jointPeriodId) : null;

        if (jointPeriodDef) {
            // --- JOINT PERIOD HANDLING ---
            const linkedClassIds = jointPeriodDef.assignments.map(a => a.classId);

            // 1. Remove from Source (for ALL linked classes)
            if (sourceDay && sourcePeriodIndex !== undefined) {
                newClasses = newClasses.map(c => {
                    if (linkedClassIds.includes(c.id)) {
                        const updatedC = { ...c, timetable: { ...c.timetable } };
                        const dayPeriods = [...updatedC.timetable[sourceDay]];
                        dayPeriods[sourcePeriodIndex] = dayPeriods[sourcePeriodIndex].filter(p => p.jointPeriodId !== jointPeriodDef.id);
                        updatedC.timetable[sourceDay] = dayPeriods;
                        return updatedC;
                    }
                    return c;
                });
            }

            // 2. Add to Target (for ALL linked classes)
            newClasses = newClasses.map(c => {
                if (linkedClassIds.includes(c.id)) {
                    const updatedC = { ...c, timetable: { ...c.timetable } };
                    if (!updatedC.timetable[targetDay]) updatedC.timetable[targetDay] = [];
                    
                    const dayPeriods = [...updatedC.timetable[targetDay]];
                    const targetSlot = dayPeriods[targetPeriodIndex] || [];
                    
                    const assignment = jointPeriodDef.assignments.find(a => a.classId === c.id);
                    if (assignment) {
                        const newPeriod: Period = {
                            id: generateUniqueId(),
                            classId: c.id,
                            subjectId: assignment.subjectId,
                            teacherId: jointPeriodDef.teacherId,
                            jointPeriodId: jointPeriodDef.id
                        };
                        
                        // If overwriting, clear slot first (Only for the selected class to prevent side effects in other classes)
                        if (doOverwrite && c.id === selectedClassId) {
                             dayPeriods[targetPeriodIndex] = [newPeriod];
                        } else {
                             dayPeriods[targetPeriodIndex] = [...targetSlot, newPeriod];
                        }
                        
                        updatedC.timetable[targetDay] = dayPeriods;
                        return updatedC;
                    }
                }
                return c;
            });

        } else {
            // --- STANDARD SINGLE PERIOD HANDLING ---
            const updatedClass = { ...selectedClass };
            const newTimetable = { ...updatedClass.timetable };
            
            // 1. Remove dragged periods from source
            if (sourceDay && sourcePeriodIndex !== undefined) {
                 const sourceDayPeriods = [...newTimetable[sourceDay]];
                 const sourceSlot = sourceDayPeriods[sourcePeriodIndex] || [];
                 const idsToRemove = new Set(periods.map(p => p.id));
                 // Just remove. We don't swap back in overwrite mode or incompatible mode.
                 const periodsToKeepInSource = sourceSlot.filter(p => !idsToRemove.has(p.id));
                 sourceDayPeriods[sourcePeriodIndex] = periodsToKeepInSource;
                 newTimetable[sourceDay] = sourceDayPeriods;
            }

            // 2. Update target
            if(!newTimetable[targetDay]) newTimetable[targetDay] = [];
            const targetDayPeriods = (sourceDay === targetDay) ? newTimetable[sourceDay] : [...newTimetable[targetDay]];
            const targetSlot = targetDayPeriods[targetPeriodIndex] || [];

            if (doOverwrite) {
                targetDayPeriods[targetPeriodIndex] = periods;
            } else {
                // Stack/Append
                targetDayPeriods[targetPeriodIndex] = [...targetSlot, ...periods];
            }
            newTimetable[targetDay] = targetDayPeriods;

            updatedClass.timetable = newTimetable;
            const idx = newClasses.findIndex(c => c.id === updatedClass.id);
            if(idx !== -1) newClasses[idx] = updatedClass;
        }

        onSetClasses(newClasses);
        setDraggedData(null);
        setMoveSource(null);
        onSelectionChange(prev => ({ ...prev, highlightedTeacherId: '' }));
    };

    // Conflict Checks (Teacher Availability)
    const busyTeachersAtTarget = getTeacherAvailability(targetDay, targetPeriodIndex);
    const conflictAtTarget = periods.find(p => {
        if (!p.teacherId) return false;
        if (!busyTeachersAtTarget.has(p.teacherId)) return false;
        if (p.jointPeriodId) {
             const isSameJP = classes.some(c => 
                 c.id !== selectedClassId && 
                 Array.isArray(c.timetable[targetDay]) &&
                 c.timetable[targetDay][targetPeriodIndex]?.some(ep => ep.jointPeriodId === p.jointPeriodId)
             );
             if (isSameJP) return false;
        }
        return true;
    });
    
    let linkedConflictMsg = '';
    const jointPeriodId = periods[0].jointPeriodId;
    if (jointPeriodId) {
        const jointPeriodDef = jointPeriods.find(jp => jp.id === jointPeriodId);
        if (jointPeriodDef) {
            jointPeriodDef.assignments.forEach(a => {
                if (a.classId !== selectedClassId) {
                    const linkedClass = classes.find(c => c.id === a.classId);
                    if (linkedClass && Array.isArray(linkedClass.timetable[targetDay]) && linkedClass.timetable[targetDay][targetPeriodIndex]?.length > 0) {
                        linkedConflictMsg += `\n- ${linkedClass.nameEn} is busy.`;
                    }
                }
            });
        }
    }

    const availability = availabilityGrid?.[targetDay]?.[targetPeriodIndex];
    const groupConflict = availability?.status === 'conflict' ? availability.reason : null;

    // Logic Tree for Confirmations
    if (groupConflict) {
        if (groupConflict === "Duplicate group") {
             alert("Cannot place the same group twice in one slot.");
             return;
        }
    }

    if (needsReplacement) {
        openConfirmation('Replace Period?', replacementMessage, () => {
             // If confirmed replacement, verify teacher conflict for the NEW period
             if (conflictAtTarget || linkedConflictMsg) {
                 let conflictMsg = '';
                 if (conflictAtTarget) {
                    const t = teachers.find(t => t.id === conflictAtTarget.teacherId);
                    conflictMsg += `${t?.nameEn || 'Teacher'} is busy.\n`;
                 }
                 if (linkedConflictMsg) conflictMsg += `Linked Class Conflict:${linkedConflictMsg}\n`;
                 conflictMsg += "Proceed anyway?";
                 
                 // Chain second confirmation
                 setTimeout(() => {
                     openConfirmation(t.teacherConflictWarning, conflictMsg, () => performUpdate(true));
                 }, 300);
             } else {
                 performUpdate(true);
             }
        });
        return;
    }

    if (conflictAtTarget || linkedConflictMsg || groupConflict) {
        let message = '';
        if (groupConflict) message += `Slot Constraint: ${groupConflict}.\n`;
        if (conflictAtTarget) {
            const t = teachers.find(t => t.id === conflictAtTarget.teacherId);
            message += `${t?.nameEn || 'Teacher'} is busy at target slot.\n`;
        }
        if (linkedConflictMsg) message += `Linked Class Conflict:${linkedConflictMsg}\n`;
        message += "\nDo you want to proceed with the changes?";

        openConfirmation(t.teacherConflictWarning, message, () => performUpdate(false));
    } else {
        performUpdate(false);
    }
  };

  const handleUnschedule = () => {
      const source = draggedData || moveSource;
      if (!source || !selectedClass) return;
      
      const { periods, sourceDay, sourcePeriodIndex } = source;
      
      if (sourceDay && sourcePeriodIndex !== undefined) {
          let newClasses = [...classes];
          const jointPeriodId = periods[0].jointPeriodId;
          const jointPeriodDef = jointPeriodId ? jointPeriods.find(jp => jp.id === jointPeriodId) : null;

          if (jointPeriodDef) {
              const linkedClassIds = jointPeriodDef.assignments.map(a => a.classId);
              newClasses = newClasses.map(c => {
                  if (linkedClassIds.includes(c.id)) {
                      const updatedC = { ...c, timetable: { ...c.timetable } };
                      const dayPeriods = [...updatedC.timetable[sourceDay]];
                      dayPeriods[sourcePeriodIndex] = dayPeriods[sourcePeriodIndex].filter(p => p.jointPeriodId !== jointPeriodDef.id);
                      updatedC.timetable[sourceDay] = dayPeriods;
                      return updatedC;
                  }
                  return c;
              });
          } else {
              const updatedClass = { ...selectedClass };
              const newTimetable = { ...updatedClass.timetable };
              
              const sourceDayPeriods = [...newTimetable[sourceDay]];
              const sourceSlot = sourceDayPeriods[sourcePeriodIndex];
              const idsToRemove = new Set(periods.map(p => p.id));
              sourceDayPeriods[sourcePeriodIndex] = sourceSlot.filter(p => !idsToRemove.has(p.id));
              newTimetable[sourceDay] = sourceDayPeriods;
              
              updatedClass.timetable = newTimetable;
              const idx = newClasses.findIndex(c => c.id === updatedClass.id);
              if(idx !== -1) newClasses[idx] = updatedClass;
          }
          onSetClasses(newClasses);
      }
      setDraggedData(null);
      setMoveSource(null);
      onSelectionChange(prev => ({ ...prev, highlightedTeacherId: '' }));
  };

  const handleDrop = (e: React.DragEvent, targetDay: keyof TimetableGridData, targetPeriodIndex: number) => {
    e.preventDefault();
    handleExecuteMove(targetDay, targetPeriodIndex);
  };

  const handleSidebarDrop = (e: React.DragEvent) => {
      e.preventDefault();
      handleUnschedule();
  };

  const handleDragOver = (e: React.DragEvent, day?: keyof TimetableGridData, periodIndex?: number) => {
      e.preventDefault(); 
  };
  
  const handleDeleteStack = (periods: Period[]) => {
     if (!selectedClass) return;
     
     let newClasses = [...classes];
     const jointPeriodId = periods[0].jointPeriodId;
     const jointPeriodDef = jointPeriodId ? jointPeriods.find(jp => jp.id === jointPeriodId) : null;

     if (jointPeriodDef) {
         const linkedClassIds = jointPeriodDef.assignments.map(a => a.classId);
         
         newClasses = newClasses.map(c => {
             if (linkedClassIds.includes(c.id)) {
                 const updatedC = { ...c, timetable: { ...c.timetable } };
                 activeDays.forEach(day => {
                     const dayPeriods = [...updatedC.timetable[day]];
                     let changed = false;
                     dayPeriods.forEach((slot, idx) => {
                         if (slot.some(p => p.jointPeriodId === jointPeriodDef.id)) {
                             dayPeriods[idx] = slot.filter(p => p.jointPeriodId !== jointPeriodDef.id);
                             changed = true;
                         }
                     });
                     if (changed) updatedC.timetable[day] = dayPeriods;
                 });
                 return updatedC;
             }
             return c;
         });
     } else {
         const updatedClass = { ...selectedClass };
         const newTimetable = { ...updatedClass.timetable };
         
         activeDays.forEach(day => {
             const dayPeriods = [...newTimetable[day]];
             let changed = false;
             dayPeriods.forEach((slot, idx) => {
                 const idsToRemove = new Set(periods.map(p => p.id));
                 if (slot.some(p => idsToRemove.has(p.id))) {
                     dayPeriods[idx] = slot.filter(p => !idsToRemove.has(p.id));
                     changed = true;
                 }
             });
             if(changed) newTimetable[day] = dayPeriods;
         });
         updatedClass.timetable = newTimetable;
         const idx = newClasses.findIndex(c => c.id === updatedClass.id);
         if(idx !== -1) newClasses[idx] = updatedClass;
     }
     
     onSetClasses(newClasses);
     if (moveSource && moveSource.periods[0].id === periods[0].id) {
         setMoveSource(null);
         onSelectionChange(prev => ({ ...prev, highlightedTeacherId: '' }));
     }
  };
  
  const unscheduledPeriods = useMemo(() => {
      if (!selectedClass) return [];
      const scheduledCounts = new Map<string, number>();
      
      Object.keys(selectedClass.timetable).forEach(dayKey => {
          const day = dayKey as keyof TimetableGridData;
          selectedClass.timetable[day]?.forEach(slot => {
              slot.forEach(p => {
                  const key = p.jointPeriodId ? `jp-${p.jointPeriodId}` : p.subjectId;
                  scheduledCounts.set(key, (scheduledCounts.get(key) || 0) + 1);
              });
          });
      });
      
      const unscheduled: Period[] = [];
      
      selectedClass.subjects.forEach(sub => {
          const relevantJointPeriod = jointPeriods.find(jp => 
              jp.assignments.some(a => a.classId === selectedClass.id && a.subjectId === sub.subjectId)
          );
          
          if (relevantJointPeriod) return; 
          
          const scheduled = scheduledCounts.get(sub.subjectId) || 0;
          const remaining = sub.periodsPerWeek - scheduled;
          
          for (let i = 0; i < remaining; i++) {
              unscheduled.push({
                  id: generateUniqueId(),
                  classId: selectedClass.id,
                  subjectId: sub.subjectId,
                  teacherId: sub.teacherId
              });
          }
      });
      
      jointPeriods.forEach(jp => {
          const assignment = jp.assignments.find(a => a.classId === selectedClass.id);
          if (assignment) {
               const scheduled = scheduledCounts.get(`jp-${jp.id}`) || 0;
               const remaining = jp.periodsPerWeek - scheduled;
               
               for(let i=0; i<remaining; i++){
                   unscheduled.push({
                       id: generateUniqueId(),
                       classId: selectedClass.id,
                       subjectId: assignment.subjectId,
                       teacherId: jp.teacherId,
                       jointPeriodId: jp.id
                   });
               }
          }
      });
      
      return unscheduled;
  }, [selectedClass, jointPeriods, classes]);

  const groupedUnscheduled = useMemo(() => {
      return unscheduledPeriods.reduce((acc, p) => {
          const key = p.jointPeriodId ? `jp-${p.jointPeriodId}` : p.subjectId;
          if (!acc[key]) acc[key] = [];
          acc[key].push(p);
          return acc;
      }, {} as Record<string, Period[]>);
  }, [unscheduledPeriods]);

  const handleSavePrintDesign = (newDesign: DownloadDesignConfig) => {
    onUpdateSchoolConfig({
      downloadDesigns: { ...schoolConfig.downloadDesigns, class: newDesign }
    });
  };

  const isSelectionActive = !!(draggedData || moveSource);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      {selectedClass && (<PrintPreview t={t} isOpen={isPrintPreviewOpen} onClose={() => setIsPrintPreviewOpen(false)} title={`${t.classTimetable}: ${selectedClass.nameEn}`} fileNameBase={`Timetable_${selectedClass.nameEn.replace(' ', '_')}`} generateHtml={(lang, options) => generateClassTimetableHtml(selectedClass, lang, options, teachers, subjects, schoolConfig)} designConfig={schoolConfig.downloadDesigns.class} onSaveDesign={handleSavePrintDesign} />)}
      {selectedClass && <CopyTimetableModal t={t} isOpen={isCopyModalOpen} onClose={() => setIsCopyModalOpen(false)} classes={visibleClasses} subjects={subjects} teachers={teachers} onUpdateClass={(updatedClass) => { const newClasses = classes.map(c => c.id === updatedClass.id ? updatedClass : c); onSetClasses(newClasses); }} sourceClassId={selectedClass.id} />}
      {selectedClass && (<ClassCommunicationModal t={t} isOpen={isCommModalOpen} onClose={() => setIsCommModalOpen(false)} selectedClass={selectedClass} inChargeTeacher={teachers.find(t => t.id === selectedClass.inCharge)!} subjects={subjects} teachers={teachers} schoolConfig={schoolConfig} subjectColorMap={teacherColorMap} />)}
      
      <DownloadModal
        t={t}
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        title={t.downloadTimetable}
        fileNameBase="Class_Timetables"
        items={visibleClasses}
        itemType="class"
        generateFullPageHtml={(item, lang, design) => generateClassTimetableHtml(item, lang, design, teachers, subjects, schoolConfig)}
        designConfig={schoolConfig.downloadDesigns.class}
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{t.selectAClass}</label>
            <div className="flex items-center gap-2">
                <button 
                    onClick={handlePreviousClass} 
                    disabled={currentClassIndex <= 0}
                    className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] disabled:opacity-50 transition-colors"
                >
                    <ChevronLeftIcon />
                </button>

                <div className="relative" ref={classDropdownRef}>
                    <button
                        onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
                        className="w-full md:w-[32rem] flex items-center justify-between px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-xl shadow-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition-all hover:border-[var(--accent-primary)] group"
                    >
                        {selectedClass ? (
                            <div className="flex items-center gap-3 w-full overflow-hidden">
                                <span className="font-mono text-xs opacity-50 bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded text-[var(--text-secondary)] group-hover:bg-[var(--accent-secondary)] group-hover:text-[var(--accent-primary)] transition-colors min-w-[2rem] text-center">
                                    #{selectedClass.serialNumber ?? '-'}
                                </span>
                                <span className="font-bold truncate flex-grow text-left text-lg">
                                    {language === 'ur' ? selectedClass.nameUr : selectedClass.nameEn}
                                </span>
                                <span className="text-xs font-medium opacity-70 whitespace-nowrap bg-[var(--bg-tertiary)] px-2 py-1 rounded text-[var(--text-secondary)] flex-shrink-0 group-hover:bg-[var(--accent-secondary)] group-hover:text-[var(--accent-primary)] transition-colors">
                                    {selectedClass.roomNumber ? `Rm: ${selectedClass.roomNumber}` : 'No Rm'}
                                </span>
                            </div>
                        ) : (
                            <span className="truncate text-left flex-grow">{t.selectAClass}</span>
                        )}
                        <div className="ml-2 flex-shrink-0 text-[var(--text-secondary)]">
                            <ChevronDownIcon />
                        </div>
                    </button>

                    {isClassDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-full md:w-[32rem] bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl shadow-2xl z-50 p-3 animate-scale-in origin-top-left">
                            {/* Search */}
                            <div className="relative mb-3">
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-placeholder)] pointer-events-none">
                                        <SearchIcon />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search classes..."
                                        value={classSearchQuery}
                                        onChange={(e) => setClassSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-10 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition-all"
                                        autoFocus
                                    />
                                    {classSearchQuery && (
                                        <button 
                                            onClick={() => setClassSearchQuery('')}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] hover:text-red-500 transition-colors p-1 rounded-full hover:bg-[var(--bg-secondary)]"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Sort Controls */}
                            <div className="flex gap-1 mb-2 bg-[var(--bg-tertiary)] p-1 rounded-lg">
                                {(['serial', 'name', 'room'] as const).map(key => (
                                    <button
                                        key={key}
                                        onClick={() => {
                                            if (classSortBy === key) {
                                                setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                                            } else {
                                                setClassSortBy(key);
                                                setSortDirection('asc');
                                            }
                                        }}
                                        className={`flex-1 text-[10px] font-bold uppercase py-1 rounded-md transition-colors flex items-center justify-center gap-1 ${classSortBy === key ? 'bg-[var(--accent-primary)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'}`}
                                    >
                                        {key === 'serial' ? '#' : key}
                                        {classSortBy === key && (
                                            <span className="text-[8px]">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* List */}
                            <div className="max-h-60 overflow-y-auto custom-scrollbar flex flex-col gap-1">
                                {sortedClasses.length === 0 ? (
                                    <div className="p-3 text-center text-xs text-[var(--text-secondary)] italic">No classes found</div>
                                ) : (
                                    sortedClasses.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => {
                                                onSelectionChange(prev => ({ ...prev, classId: c.id }));
                                                setIsClassDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-3 transition-colors ${selectedClassId === c.id ? 'bg-[var(--accent-secondary)] text-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]' : 'hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)]'}`}
                                        >
                                            <span className={`font-mono text-xs opacity-50 w-8 text-center flex-shrink-0 py-0.5 rounded ${selectedClassId === c.id ? 'bg-[var(--accent-primary)]/10' : 'bg-[var(--bg-primary)]'}`}>#{c.serialNumber ?? '-'}</span>
                                            <span className="font-bold flex-grow text-base break-words text-left leading-tight">{language === 'ur' ? c.nameUr : c.nameEn}</span>
                                            <span className={`text-xs opacity-70 whitespace-nowrap min-w-[60px] text-center px-2 py-0.5 rounded ${selectedClassId === c.id ? 'bg-[var(--accent-primary)]/10' : 'bg-[var(--bg-primary)]'}`}>{c.roomNumber ? `Rm: ${c.roomNumber}` : 'No Rm'}</span>
                                            {selectedClassId === c.id && <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] flex-shrink-0"></div>}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <button 
                    onClick={handleNextClass}
                    disabled={currentClassIndex >= sortedClasses.length - 1}
                    className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] disabled:opacity-50 transition-colors"
                >
                    <ChevronRightIcon />
                </button>
            </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
            {onUndo && (
              <button onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)" className="p-2 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg shadow-sm hover:bg-[var(--bg-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><UndoIcon /></button>
            )}
            {onRedo && (
              <button onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)" className="p-2 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg shadow-sm hover:bg-[var(--bg-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><RedoIcon /></button>
            )}
            {onSave && (
              <button onClick={onSave} title="Save (Ctrl+S)" className="p-2 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg shadow-sm hover:bg-[var(--bg-tertiary)] transition-colors"><SaveIcon /></button>
            )}
            <div className="w-px h-6 bg-[var(--border-secondary)] mx-1 hidden sm:block"></div>
            <button onClick={() => setIsDownloadModalOpen(true)} disabled={visibleClasses.length === 0} title={t.download} className="p-2 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg shadow-sm hover:bg-[var(--bg-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></button>
            <button onClick={() => setIsCopyModalOpen(true)} disabled={!selectedClass} title={t.copyTimetable} className="p-2 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg shadow-sm hover:bg-[var(--bg-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><CopyIcon /></button>
            <button onClick={() => setIsCommModalOpen(true)} disabled={!selectedClass} title={t.sendToInCharge} className="p-2 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg shadow-sm hover:bg-[var(--bg-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg></button>
            <button onClick={() => setIsPrintPreviewOpen(true)} disabled={!selectedClass} title={t.printViewAction} className="p-2 text-sm font-medium bg-[var(--accent-primary)] text-[var(--accent-text)] border border-[var(--accent-primary)] rounded-lg shadow-sm hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2v4h10z" /></svg></button>
            {selectedClass && (
              <button onClick={() => openConfirmation(t.clearTimetable, t.clearTimetableConfirm, () => {
                  const updatedClass = { ...selectedClass, timetable: { Monday: Array.from({length:8},()=>[]), Tuesday: Array.from({length:8},()=>[]), Wednesday: Array.from({length:8},()=>[]), Thursday: Array.from({length:8},()=>[]), Friday: Array.from({length:8},()=>[]), Saturday: Array.from({length:8},()=>[]) } };
                  onSetClasses(classes.map(c => c.id === updatedClass.id ? updatedClass : c));
              })} className="p-2 text-sm font-medium text-red-600 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg shadow-sm hover:bg-red-50 transition-colors" title={t.clearTimetable}>
                  <ClearIcon />
              </button>
            )}
        </div>
      </div>

      {!selectedClass ? (
        <p className="text-center text-[var(--text-secondary)] py-10">{t.selectAClass}</p>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/4">
            <div 
                className={`bg-[var(--bg-secondary)] p-4 rounded-lg shadow-md border border-[var(--border-primary)] sticky top-24 transition-colors ${draggedData?.sourceDay || (moveSource?.sourceDay) ? 'unscheduled-drop-target cursor-pointer' : ''}`}
                onDragOver={handleDragOver}
                onDrop={handleSidebarDrop}
                onClick={moveSource?.sourceDay ? handleUnschedule : undefined}
            >
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3 border-b border-[var(--border-primary)] pb-2 flex justify-between items-center">
                  {t.unscheduledPeriods}
                  {moveSource && moveSource.sourceDay && (
                      <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full animate-pulse">Click here to Unschedule</span>
                  )}
              </h3>
              {Object.keys(groupedUnscheduled).length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)] italic">{t.dragAndDropInstruction}</p>
              ) : (
                <div className="flex flex-col gap-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-2 period-stack-clickable">
                  {Object.values(groupedUnscheduled).map((group, index) => {
                      const isSelected = moveSource && moveSource.periods[0].id === group[0].id;
                      return (
                        <PeriodStack 
                            key={`unscheduled-${index}`} 
                            periods={group} 
                            onDragStart={handleDragStart} 
                            onDragEnd={handleDragEnd}
                            onClick={(p) => handleStackClick(p)}
                            colorName={teacherColorMap.get(group[0].teacherId)}
                            language={language}
                            subjects={subjects}
                            teachers={teachers}
                            classes={classes}
                            jointPeriods={jointPeriods}
                            displayContext="teacher"
                            isHighlighted={selection.highlightedTeacherId === group[0].teacherId}
                            isDimmed={selection.highlightedTeacherId ? selection.highlightedTeacherId !== group[0].teacherId : false}
                            showCount={true}
                            isSelected={!!isSelected}
                        />
                      );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="lg:w-3/4 overflow-x-auto" ref={tableRef}>
            <div className="bg-[var(--bg-secondary)] shadow-lg rounded-lg overflow-hidden border border-[var(--border-primary)]">
              <table className="w-full text-center border-collapse table-fixed">
                <thead>
                  <tr className="bg-[var(--accent-primary)] text-[var(--accent-text)]">
                    <th className="border border-[var(--border-secondary)] p-2 w-12"></th>
                    {activeDays.map(day => (
                      <th key={day} className="border border-[var(--border-secondary)] p-2 font-bold uppercase text-sm">{t[day.toLowerCase()]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periodLabels.map((label, periodIndex) => (
                    <tr key={label}>
                      <td className="border border-[var(--border-secondary)] font-black text-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-sans">{label}</td>
                      {activeDays.map(day => {
                        const periodLimit = schoolConfig.daysConfig?.[day]?.periodCount ?? 8;
                        const isDisabled = periodIndex >= periodLimit;
                        
                        const slotPeriods = selectedClass.timetable[day]?.[periodIndex] || [];
                        const availability = availabilityGrid?.[day]?.[periodIndex];
                        const isConflict = availability?.status === 'conflict';

                        const groupedPeriods = Object.values(slotPeriods.reduce((acc, p) => {
                            const key = p.jointPeriodId || p.subjectId + (classes.find(c => c.id === p.classId)?.subjects.find(s => s.subjectId === p.subjectId)?.groupId || p.id);
                            if (!acc[key]) acc[key] = [];
                            acc[key].push(p);
                            return acc;
                        }, {} as Record<string, Period[]>)) as Period[][];

                        groupedPeriods.sort((a, b) => {
                            const getGroupName = (p: Period) => {
                                if (p.jointPeriodId) {
                                     const jp = jointPeriods.find(j => j.id === p.jointPeriodId);
                                     const assign = jp?.assignments.find(x => x.classId === p.classId);
                                     if (assign?.groupId && assign?.groupSetId) {
                                         const set = selectedClass.groupSets?.find(s => s.id === assign.groupSetId);
                                         return set?.groups.find(g => g.id === assign.groupId)?.name || '';
                                     }
                                } else {
                                     const sub = selectedClass.subjects.find(s => s.subjectId === p.subjectId);
                                     if (sub?.groupId && sub?.groupSetId) {
                                         const set = selectedClass.groupSets?.find(s => s.id === sub.groupSetId);
                                         return set?.groups.find(g => g.id === sub.groupId)?.name || '';
                                     }
                                }
                                return '';
                            };
                            
                            const nameA = getGroupName(a[0]);
                            const nameB = getGroupName(b[0]);
                            if (nameA && nameB) return nameA.localeCompare(nameB);
                            if (nameA) return 1; 
                            if (nameB) return -1;
                            return 0;
                        });

                        const isTarget = moveSource && !isDisabled;
                        
                        // Background logic: Strictly colorize if selecting/dragging to show availability
                        let bgClass = 'bg-[var(--bg-secondary)]';
                        if (isDisabled) {
                            bgClass = 'bg-[var(--slot-disabled-bg)] cursor-not-allowed';
                        } else if (isSelectionActive) {
                            // Strictly Green for Available, Red for Conflict/Busy
                            bgClass = isConflict 
                                ? 'bg-red-100 dark:bg-red-900/40' 
                                : 'bg-emerald-100 dark:bg-emerald-900/40';
                        }

                        // Determine visual status class for dashed outline
                        const statusClass = (!isDisabled && isSelectionActive) 
                            ? (isConflict 
                                ? 'outline-2 outline-dashed outline-red-500 outline-offset-[-4px]' 
                                : 'outline-2 outline-dashed outline-emerald-500 outline-offset-[-4px]')
                            : '';

                        // Calculate Busy Class Name if any
                        let busyClassName = '';
                        if (isSelectionActive && isConflict) {
                            const source = draggedData || moveSource;
                            const tId = source?.periods[0]?.teacherId;
                            if (tId) {
                                const conflictClass = classes.find(c => c.id !== selectedClassId && c.timetable[day]?.[periodIndex]?.some(p => p.teacherId === tId));
                                if (conflictClass) {
                                    busyClassName = language === 'ur' ? conflictClass.nameUr : conflictClass.nameEn;
                                }
                            }
                        }

                        return (
                          <td key={day} 
                            className={`timetable-slot border border-[var(--border-secondary)] h-16 p-1 align-top relative group transition-colors duration-300 ${bgClass} ${statusClass} ${isTarget ? 'cursor-pointer ring-inset ring-2 ring-[var(--accent-primary)]/30' : ''}`}
                            onDragOver={(e) => !isDisabled && handleDragOver(e, day, periodIndex)}
                            onDrop={(e) => !isDisabled && handleDrop(e, day, periodIndex)}
                            onClick={() => !isDisabled && moveSource && handleExecuteMove(day, periodIndex)}
                            title={isConflict ? availability?.reason : ''}
                          >
                             {isConflict && !isDisabled && isSelectionActive && (
                                <div className="absolute top-0 right-0 p-0.5 z-20">
                                    <WarningIcon />
                                </div>
                             )}
                             
                             {/* Explicit "TEACHER BUSY" Indicator for Empty Slots when Dragging */}
                             {isSelectionActive && isConflict && !isDisabled && slotPeriods.length === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                                    <div className="bg-white/95 border-2 border-red-500/80 px-2 py-1.5 rounded-lg shadow-md flex flex-col items-center transform -rotate-12 backdrop-blur-sm">
                                        <span className="text-[10px] font-black text-red-600 uppercase tracking-wider leading-none whitespace-nowrap">
                                            TEACHER BUSY
                                        </span>
                                        {busyClassName && (
                                            <span className="text-[9px] font-bold text-red-800 leading-none text-center mt-1 whitespace-nowrap max-w-[80px] truncate">
                                                in {busyClassName}
                                            </span>
                                        )}
                                    </div>
                                </div>
                             )}

                            {!isDisabled && (
                                <div className="h-full flex flex-row flex-wrap content-start gap-1 period-stack-clickable relative z-10">
                                    {groupedPeriods.map((group, groupIndex) => {
                                        const isSelected = moveSource && moveSource.periods[0].id === group[0].id;
                                        
                                        // Determine isGroup
                                        const p = group[0];
                                        let isGroup = false;
                                        if (p.jointPeriodId) {
                                             const jp = jointPeriods.find(j => j.id === p.jointPeriodId);
                                             const assignment = jp?.assignments.find(x => x.classId === p.classId);
                                             if (assignment?.groupId && assignment?.groupSetId) isGroup = true;
                                        } else {
                                             const sub = selectedClass.subjects.find(s => s.subjectId === p.subjectId);
                                             if (sub?.groupId && sub?.groupSetId) isGroup = true;
                                        }

                                        return (
                                            <PeriodStack 
                                                key={`${group[0].id}-${groupIndex}`}
                                                periods={group}
                                                onDragStart={(draggedPeriods) => handleDragStart(draggedPeriods, day, periodIndex)}
                                                onDragEnd={handleDragEnd}
                                                onClick={(p) => handleStackClick(p, day, periodIndex)}
                                                onDeleteStack={() => handleDeleteStack(group)}
                                                colorName={teacherColorMap.get(group[0].teacherId)}
                                                language={language}
                                                subjects={subjects}
                                                teachers={teachers}
                                                classes={classes}
                                                jointPeriods={jointPeriods}
                                                displayContext="teacher"
                                                isHighlighted={selection.highlightedTeacherId === group[0].teacherId}
                                                isDimmed={selection.highlightedTeacherId ? selection.highlightedTeacherId !== group[0].teacherId : false}
                                                className={isGroup ? "w-[calc(50%-2px)] !flex-grow-0" : "w-full"}
                                                isSelected={!!isSelected}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {/* Lesson Manager Section */}
      {selectedClassId && hasActiveSession && (
        <div className="mt-8">
            <AddLessonForm 
                t={t}
                teachers={teachers}
                classes={classes}
                subjects={subjects}
                jointPeriods={jointPeriods}
                onSetClasses={onSetClasses}
                onAddJointPeriod={onAddJointPeriod}
                onUpdateJointPeriod={onUpdateJointPeriod}
                onDeleteJointPeriod={onDeleteJointPeriod}
                onUpdateTimetableSession={onUpdateTimetableSession}
                openConfirmation={openConfirmation}
                limitToClassId={selectedClassId}
            />
        </div>
      )}
    </div>
  );
};

export default ClassTimetablePage;
