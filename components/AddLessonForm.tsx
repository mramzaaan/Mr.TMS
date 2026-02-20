import React, { useState, useMemo, useEffect } from 'react';
import type { Teacher, SchoolClass, Subject, JointPeriod, TimetableSession, GroupSet, TimetableChangeLog, TimetableGridData, Period } from '../types';
import { generateUniqueId, allDays } from '../types';

interface AddLessonFormProps {
  t: any;
  teachers: Teacher[];
  classes: SchoolClass[];
  subjects: Subject[];
  jointPeriods: JointPeriod[];
  onSetClasses: (classes: SchoolClass[]) => void;
  onAddJointPeriod: (jp: JointPeriod) => void;
  onUpdateJointPeriod: (jp: JointPeriod) => void;
  onDeleteJointPeriod: (jpId: string) => void;
  onUpdateTimetableSession: (updater: (session: TimetableSession) => TimetableSession) => void;
  openConfirmation: (title: string, message: React.ReactNode, onConfirm: () => void) => void;
  limitToClassId?: string;
  limitToTeacherId?: string;
}

const NON_TEACHING_CLASS_ID = 'non-teaching-duties';

// Helper to create log
const createLog = (
    type: TimetableChangeLog['type'], 
    details: string, 
    entityType: TimetableChangeLog['entityType'], 
    entityId: string
): TimetableChangeLog => ({
    id: generateUniqueId(),
    timestamp: new Date().toISOString(),
    type,
    details,
    entityType,
    entityId
});

const AddLessonForm: React.FC<AddLessonFormProps> = ({ 
    t, teachers, classes, subjects, jointPeriods, 
    onSetClasses, onUpdateTimetableSession, openConfirmation,
    limitToClassId, limitToTeacherId
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Unified Form State
  const [teacherId, setTeacherId] = useState<string>('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [periodsCount, setPeriodsCount] = useState<number>(1);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]); 
  
  // Groups
  const [isGroupLesson, setIsGroupLesson] = useState(false);
  const [customGroupName, setCustomGroupName] = useState('');
  const [customGroupSetName, setCustomGroupSetName] = useState('Subject Groups');

  // List View State
  const [sortBy, setSortBy] = useState<'class' | 'teacher'>('class');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Edit Context
  const [editingLesson, setEditingLesson] = useState<{
      originalType: 'single' | 'joint';
      // For Single:
      originalClassId?: string;
      originalSubjectIndex?: number;
      // For Joint:
      originalJointPeriodId?: string;
  } | null>(null);

  useEffect(() => {
      if (limitToClassId) {
          setExpandedId(limitToClassId);
          setSelectedClassIds([limitToClassId]);
      }
      if (limitToTeacherId) {
          setTeacherId(limitToTeacherId);
      }
  }, [limitToClassId, limitToTeacherId]);

  const resetForm = () => {
    setTeacherId(limitToTeacherId || '');
    setSubjectId('');
    setPeriodsCount(1);
    setSelectedClassIds(limitToClassId ? [limitToClassId] : []);
    setIsGroupLesson(false);
    setCustomGroupName('');
    setCustomGroupSetName('Subject Groups');
    setEditingLesson(null);
  };

  const visibleClasses = useMemo(() => classes.filter(c => c.id !== NON_TEACHING_CLASS_ID), [classes]);

  const getOrCreateGroup = (schoolClass: SchoolClass, setName: string, groupName: string): { updatedClass: SchoolClass, groupSetId: string, groupId: string } => {
      const cls = { ...schoolClass };
      cls.groupSets = cls.groupSets ? [...cls.groupSets] : [];

      let groupSetIndex = cls.groupSets.findIndex(gs => gs.name.toLowerCase() === setName.trim().toLowerCase());
      let groupSet: GroupSet;

      if (groupSetIndex === -1) {
          groupSet = { id: generateUniqueId(), name: setName.trim(), groups: [] };
          cls.groupSets.push(groupSet);
          groupSetIndex = cls.groupSets.length - 1;
      } else {
          groupSet = { ...cls.groupSets[groupSetIndex], groups: [...cls.groupSets[groupSetIndex].groups] };
          cls.groupSets[groupSetIndex] = groupSet;
      }

      let group = groupSet.groups.find(g => g.name.toLowerCase() === groupName.trim().toLowerCase());
      if (!group) {
          group = { id: generateUniqueId(), name: groupName.trim() };
          groupSet.groups.push(group);
      }

      return { 
          updatedClass: cls, 
          groupSetId: groupSet.id, 
          groupId: group.id 
      };
  };

  const handleSave = () => {
    if (!subjectId) {
      alert('Please select a subject.');
      return;
    }

    if (selectedClassIds.length === 0) {
        alert('Please select at least one class.');
        return;
    }

    if (isGroupLesson && !customGroupName.trim()) {
        alert('Please enter a Group Name (e.g., "Biology", "Group A").');
        return;
    }

    onUpdateTimetableSession((session) => {
        // Deep copy classes including timetable for safe mutation
        let currentClasses = session.classes.map(c => ({
            ...c, 
            subjects: [...c.subjects],
            timetable: Object.fromEntries(
                Object.entries(c.timetable).map(([key, daySlots]) => [
                    key, 
                    (daySlots as any).map((slot: any) => [...slot]) // Deep copy slots
                ])
            ) as TimetableGridData
        }));
        
        let currentJointPeriods = [...session.jointPeriods];
        let currentLogs = session.changeLogs || [];
        const logDetails: { msg: string, entityType: 'teacher'|'class', entityId: string }[] = [];

        // 1. Handle Removal of Old Lesson Definition (Allocation)
        if (editingLesson) {
            if (editingLesson.originalType === 'single' && editingLesson.originalClassId && typeof editingLesson.originalSubjectIndex === 'number') {
                const clsIndex = currentClasses.findIndex(c => c.id === editingLesson.originalClassId);
                if (clsIndex !== -1) {
                    const cls = currentClasses[clsIndex];
                    const newSubjects = [...cls.subjects];
                    if (editingLesson.originalSubjectIndex >= 0 && editingLesson.originalSubjectIndex < newSubjects.length) {
                        const removed = newSubjects[editingLesson.originalSubjectIndex];
                        const sub = subjects.find(s => s.id === removed.subjectId);
                        logDetails.push({ 
                            msg: `Removed lesson: ${sub?.nameEn || 'Subject'}`, 
                            entityType: 'class', 
                            entityId: cls.id 
                        });
                        newSubjects.splice(editingLesson.originalSubjectIndex, 1);
                        cls.subjects = newSubjects;
                        currentClasses[clsIndex] = cls;
                    }
                }
            } else if (editingLesson.originalType === 'joint' && editingLesson.originalJointPeriodId) {
                const jp = currentJointPeriods.find(j => j.id === editingLesson.originalJointPeriodId);
                if (jp) {
                    if (jp.teacherId) {
                        logDetails.push({ msg: `Removed Joint Lesson: ${jp.name}`, entityType: 'teacher', entityId: jp.teacherId });
                    }
                    currentJointPeriods = currentJointPeriods.filter(j => j.id !== editingLesson.originalJointPeriodId);
                }
            }
        }

        const sub = session.subjects.find(s => s.id === subjectId);
        const tea = session.teachers.find(t => t.id === teacherId);
        const actionType = editingLesson ? 'update' : 'add';

        // 2. Add New Lesson Definition (Allocation)
        if (selectedClassIds.length === 1) {
            const targetClassId = selectedClassIds[0];
            const targetClassIndex = currentClasses.findIndex(c => c.id === targetClassId);
            
            if (targetClassIndex !== -1) {
                let targetClass = currentClasses[targetClassIndex];
                
                let assignedGroupSetId: string | undefined = undefined;
                let assignedGroupId: string | undefined = undefined;

                if (isGroupLesson) {
                    const result = getOrCreateGroup(targetClass, customGroupSetName || 'Subject Groups', customGroupName);
                    targetClass = result.updatedClass;
                    assignedGroupSetId = result.groupSetId;
                    assignedGroupId = result.groupId;
                }

                const newSubjectEntry = {
                    subjectId,
                    teacherId: teacherId || '',
                    periodsPerWeek: periodsCount,
                    groupSetId: assignedGroupSetId,
                    groupId: assignedGroupId
                };

                targetClass = { ...targetClass, subjects: [...targetClass.subjects, newSubjectEntry] };
                currentClasses[targetClassIndex] = targetClass;
                
                const desc = `${actionType === 'add' ? 'Added' : 'Updated'} lesson: ${sub?.nameEn} (${periodsCount} periods/week)${tea ? ` assigned to ${tea.nameEn}` : ''}`;
                currentLogs.push(createLog(actionType, desc, 'class', targetClass.id));
                if (tea) {
                    currentLogs.push(createLog(actionType, `${desc} for class ${targetClass.nameEn}`, 'teacher', tea.id));
                }
            }
        } else {
            const name = `${sub?.nameEn || 'Lesson'} (${tea?.nameEn || 'No Teacher'})`;

            const assignmentsWithGroups = selectedClassIds.map(classId => {
                const clsIndex = currentClasses.findIndex(c => c.id === classId);
                if (clsIndex === -1) return { classId, subjectId };

                let cls = currentClasses[clsIndex];
                let groupSetId: string | undefined = undefined;
                let groupId: string | undefined = undefined;

                if (isGroupLesson) {
                    const result = getOrCreateGroup(cls, customGroupSetName || 'Subject Groups', customGroupName);
                    cls = result.updatedClass;
                    groupSetId = result.groupSetId;
                    groupId = result.groupId;
                    
                    currentClasses[clsIndex] = cls;
                }

                return {
                    classId,
                    subjectId,
                    groupSetId,
                    groupId
                };
            });

            const jpData = {
                id: editingLesson?.originalJointPeriodId || generateUniqueId(), 
                name,
                teacherId: teacherId || '',
                periodsPerWeek: periodsCount,
                assignments: assignmentsWithGroups
            };
            
            currentJointPeriods.push(jpData);
            
            const desc = `${actionType === 'add' ? 'Added' : 'Updated'} Joint Lesson: ${name} (${periodsCount} periods/week)`;
            if (tea) {
                currentLogs.push(createLog(actionType, desc, 'teacher', tea.id));
            }
        }

        // 3. Grid Synchronization: Update existing scheduled cards
        // Iterate through all classes involved in this lesson update
        selectedClassIds.forEach(clsId => {
            const cls = currentClasses.find(c => c.id === clsId);
            if (!cls) return;

            allDays.forEach(day => {
                const daySlots = cls.timetable[day];
                if (!daySlots) return;

                // We need to modify slots in place or replace them
                const newDaySlots = daySlots.map((slot, pIdx) => {
                    const updatedSlot: Period[] = [];
                    let slotModified = false;

                    slot.forEach(p => {
                        // Check if this period corresponds to the lesson being saved.
                        // We match by Subject ID.
                        // (Note: If joint period logic is complex, we might need more checks, 
                        // but usually subject match + class context is sufficient for single-subject updates)
                        
                        let isMatch = false;
                        if (editingLesson?.originalType === 'joint' && editingLesson.originalJointPeriodId) {
                             if (p.jointPeriodId === editingLesson.originalJointPeriodId) isMatch = true;
                        } else if (p.subjectId === subjectId) {
                             isMatch = true;
                        }

                        if (isMatch) {
                            // Check if new Teacher is busy in any OTHER class at this time
                            let isConflict = false;
                            if (teacherId && teacherId !== p.teacherId) {
                                isConflict = currentClasses.some(otherClass => 
                                    otherClass.timetable[day]?.[pIdx]?.some(otherP => 
                                        otherP.teacherId === teacherId && otherP.id !== p.id // Don't conflict with self if somehow duplicated
                                    )
                                );
                            }

                            if (isConflict) {
                                // Conflict: Unschedule (Drop this card)
                                slotModified = true;
                                // Log implicitly handled by UI state update
                            } else {
                                // No Conflict: Update Teacher
                                if (p.teacherId !== (teacherId || '')) {
                                    updatedSlot.push({ ...p, teacherId: teacherId || '' });
                                    slotModified = true;
                                } else {
                                    updatedSlot.push(p);
                                }
                            }
                        } else {
                            updatedSlot.push(p);
                        }
                    });
                    
                    return updatedSlot;
                });
                
                cls.timetable[day] = newDaySlots;
            });
        });
        
        return {
            ...session,
            classes: currentClasses,
            jointPeriods: currentJointPeriods,
            changeLogs: currentLogs
        };
    });

    alert(selectedClassIds.length > 1 ? 'Joint Lesson saved.' : 'Lesson saved.');
    setIsModalOpen(false);
    resetForm();
  };

  const handleClassSelectionChange = (classId: string, checked: boolean) => {
      if (checked) setSelectedClassIds(prev => [...prev, classId]);
      else setSelectedClassIds(prev => prev.filter(id => id !== classId));
  };

  const handleEditClick = (lesson: any) => {
      resetForm();
      const type = lesson.type; 

      if (type === 'single') {
          const { classId, subjectIndex, subject } = lesson;
          setTeacherId(subject.teacherId);
          setSubjectId(subject.subjectId);
          setPeriodsCount(subject.periodsPerWeek);
          setSelectedClassIds([classId]);
          
          if (subject.groupId) {
              setIsGroupLesson(true);
              const cls = classes.find(c => c.id === classId);
              const groupSet = cls?.groupSets?.find(gs => gs.id === subject.groupSetId);
              const group = groupSet?.groups.find(g => g.id === subject.groupId);
              if (group) setCustomGroupName(group.name);
              if (groupSet) setCustomGroupSetName(groupSet.name);
          } else {
              setIsGroupLesson(false);
          }

          setEditingLesson({ originalType: 'single', originalClassId: classId, originalSubjectIndex: subjectIndex });

      } else {
          const { jointPeriod } = lesson;
          setTeacherId(jointPeriod.teacherId);
          setSubjectId(jointPeriod.assignments[0]?.subjectId || '');
          setPeriodsCount(jointPeriod.periodsPerWeek);
          
          const assignedIds = jointPeriod.assignments.map((a: any) => a.classId);
          if (assignedIds.length > 0 && assignedIds[0] !== NON_TEACHING_CLASS_ID) {
              setSelectedClassIds(assignedIds);
              setEditingLesson({ originalType: 'joint', originalJointPeriodId: jointPeriod.id });
          } else {
              setSelectedClassIds([]);
          }

          const firstAssign = jointPeriod.assignments[0];
          if (firstAssign && firstAssign.groupId) {
             setIsGroupLesson(true);
             const cls = classes.find(c => c.id === firstAssign.classId);
             const gs = cls?.groupSets?.find(gs => gs.id === firstAssign.groupSetId);
             const g = gs?.groups.find(g => g.id === firstAssign.groupId);
             if (g) setCustomGroupName(g.name);
             if (gs) setCustomGroupSetName(gs.name);
          } else {
             setIsGroupLesson(false);
          }
      }
      setIsModalOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, lesson: any) => {
      e.stopPropagation();
      e.preventDefault(); 
      
      openConfirmation(t.delete, t.areYouSure || 'Are you sure?', () => {
          onUpdateTimetableSession((session) => {
              let currentClasses = session.classes.map(c => ({...c, subjects: [...c.subjects]}));
              let currentJointPeriods = [...session.jointPeriods];
              let currentLogs = session.changeLogs || [];

              if (lesson.type === 'single') {
                  const { classId } = lesson;
                  const targetClassIndex = currentClasses.findIndex(c => c.id === classId);
                  
                  if (targetClassIndex !== -1) {
                      const cls = { ...currentClasses[targetClassIndex] };
                      const newSubjects = [...cls.subjects];
                      
                      const subjectToRemove = lesson.subject;
                      const realIndex = newSubjects.findIndex(s => 
                          s.subjectId === subjectToRemove.subjectId && 
                          s.teacherId === subjectToRemove.teacherId && 
                          s.periodsPerWeek === subjectToRemove.periodsPerWeek &&
                          s.groupId === subjectToRemove.groupId
                      );

                      if (realIndex !== -1) {
                          const sub = session.subjects.find(s => s.id === subjectToRemove.subjectId);
                          const tea = session.teachers.find(t => t.id === subjectToRemove.teacherId);
                          const desc = `Deleted lesson: ${sub?.nameEn || 'Subject'} (${tea?.nameEn || 'No Teacher'})`;
                          
                          currentLogs.push(createLog('delete', desc, 'class', cls.id));
                          if(tea) currentLogs.push(createLog('delete', `${desc} from class ${cls.nameEn}`, 'teacher', tea.id));

                          newSubjects.splice(realIndex, 1);
                          cls.subjects = newSubjects;
                          currentClasses[targetClassIndex] = cls;
                      } else if (lesson.subjectIndex >= 0 && lesson.subjectIndex < newSubjects.length) {
                          const removed = newSubjects[lesson.subjectIndex];
                          const sub = session.subjects.find(s => s.id === removed.subjectId);
                          currentLogs.push(createLog('delete', `Deleted lesson: ${sub?.nameEn}`, 'class', cls.id));

                          newSubjects.splice(lesson.subjectIndex, 1);
                          cls.subjects = newSubjects;
                          currentClasses[targetClassIndex] = cls;
                      }
                  }
              } else {
                  if (lesson.jointPeriod.teacherId) {
                      currentLogs.push(createLog('delete', `Deleted Joint Lesson: ${lesson.jointPeriod.name}`, 'teacher', lesson.jointPeriod.teacherId));
                  }
                  currentJointPeriods = currentJointPeriods.filter(jp => jp.id !== lesson.jointPeriod.id);
              }

              return {
                  ...session,
                  classes: currentClasses,
                  jointPeriods: currentJointPeriods,
                  changeLogs: currentLogs
              };
          });
      });
  };

  const sortedList = useMemo(() => {
      if (limitToClassId) {
          const c = classes.find(cls => cls.id === limitToClassId);
          if (!c) return [];
          const standard = c.subjects.map((s, idx) => ({
              type: 'single', key: `single-${c.id}-${idx}`, classId: c.id, subjectIndex: idx, subject: s,
              displaySubject: subjects.find(sub => sub.id === s.subjectId), displayTeacher: teachers.find(t => t.id === s.teacherId),
              groupName: s.groupId ? c.groupSets?.find(gs => gs.id === s.groupSetId)?.groups.find(g => g.id === s.groupId)?.name : undefined
          }));
          const joints = jointPeriods.filter(jp => jp.assignments?.some(a => a.classId === c.id)).map(jp => {
              const firstAssign = jp.assignments.find(a => a.classId === c.id);
              return {
                type: 'joint', key: `joint-${jp.id}`, jointPeriod: jp,
                displaySubject: subjects.find(sub => sub.id === firstAssign?.subjectId), displayTeacher: teachers.find(t => t.id === jp.teacherId),
                jointClassNames: jp.assignments?.map(a => classes.find(c => c.id === a.classId)?.nameEn).filter(Boolean).join(', '),
                groupName: firstAssign?.groupId ? c.groupSets?.find(gs => gs.id === firstAssign.groupSetId)?.groups.find(g => g.id === firstAssign.groupId)?.name : undefined
              };
          });
          const combinedItems = [...standard, ...joints].sort((a, b) => (a.displaySubject?.nameEn || '').localeCompare(b.displaySubject?.nameEn || ''));
          return [{ id: c.id, label: c.nameEn, subLabel: c.nameUr, items: combinedItems }];
      }
      
      if (limitToTeacherId) {
          return classes.filter(c => c.id !== NON_TEACHING_CLASS_ID).map(c => {
               const standard = c.subjects.map((s, idx) => ({ s, idx })).filter(({ s }) => s.teacherId === limitToTeacherId).map(({ s, idx }) => ({
                  type: 'single', key: `single-${c.id}-${idx}`, classId: c.id, subjectIndex: idx, subject: s,
                  displaySubject: subjects.find(sub => sub.id === s.subjectId), displayTeacher: teachers.find(t => t.id === s.teacherId),
                  groupName: s.groupId ? c.groupSets?.find(gs => gs.id === s.groupSetId)?.groups.find(g => g.id === s.groupId)?.name : undefined
               }));
               const joints = jointPeriods.filter(jp => jp.teacherId === limitToTeacherId && jp.assignments.some(a => a.classId === c.id)).map(jp => {
                    const firstAssign = jp.assignments.find(a => a.classId === c.id);
                    return {
                        type: 'joint', key: `joint-${jp.id}`, jointPeriod: jp,
                        displaySubject: subjects.find(sub => sub.id === firstAssign?.subjectId), displayTeacher: teachers.find(t => t.id === jp.teacherId),
                        jointClassNames: jp.assignments?.map(a => classes.find(cls => cls.id === a.classId)?.nameEn).filter(Boolean).join(', '),
                        groupName: firstAssign?.groupId ? c.groupSets?.find(gs => gs.id === firstAssign.groupSetId)?.groups.find(g => g.id === firstAssign.groupId)?.name : undefined
                    };
                });
               const combinedItems = [...standard, ...joints].sort((a, b) => (a.displaySubject?.nameEn || '').localeCompare(b.displaySubject?.nameEn || ''));
               return { id: c.id, label: c.nameEn, subLabel: c.nameUr, items: combinedItems };
          }).filter(group => group.items.length > 0);
      }

      return classes.filter(c => c.id !== NON_TEACHING_CLASS_ID).map(c => ({ id: c.id, label: c.nameEn, subLabel: c.nameUr, items: [] }));
  }, [classes, teachers, subjects, jointPeriods, sortBy, limitToClassId, limitToTeacherId]);

  const inputStyleClasses = "mt-1 block w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-md shadow-sm text-[var(--text-primary)] focus:outline-none focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] sm:text-sm";

  return (
    <div>
      <div className="bg-[var(--bg-secondary)] rounded-xl shadow-md border border-[var(--border-primary)] overflow-hidden">
          <div className="p-4 border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)] flex justify-between items-center flex-wrap gap-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">{t.lessonList}</h3>
              <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)] text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[var(--accent-primary-hover)] transition-colors shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                <span>{t.addLesson}</span>
              </button>
          </div>
          <div className="divide-y divide-[var(--border-primary)]">
              {sortedList.map(entity => (
                  <div key={entity.id} className="bg-[var(--bg-secondary)]">
                      <button onClick={() => setExpandedId(expandedId === entity.id ? null : entity.id)} className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--bg-tertiary)] transition-colors focus:outline-none">
                          <div><span className="font-bold text-[var(--text-primary)]">{entity.label}</span> {entity.subLabel && <span className="ml-2 text-sm text-[var(--text-secondary)] font-urdu">{entity.subLabel}</span>} <span className="ml-3 text-xs px-2 py-0.5 bg-[var(--accent-secondary)] text-[var(--accent-primary)] rounded-full">{entity.items.length}</span></div>
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-[var(--text-secondary)] transform transition-transform ${expandedId === entity.id ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                      </button>
                      {expandedId === entity.id && (
                          <div className="bg-[var(--bg-tertiary)]/30 border-t border-[var(--border-primary)] animate-fade-in">
                              {entity.items.length === 0 ? <p className="p-4 text-sm text-[var(--text-secondary)] italic text-center">No lessons found.</p> : (
                                  <div className="grid grid-cols-1">
                                      {entity.items.map((item: any) => (
                                          <div key={item.key} className="flex items-center justify-between p-3 border-b border-[var(--border-secondary)] last:border-0 hover:bg-[var(--bg-secondary)] transition-colors">
                                              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 items-center">
                                                  <div className="flex flex-col"><span className="text-xs font-bold text-[var(--text-secondary)] uppercase">{t.subject}</span><span className="text-sm font-semibold text-[var(--text-primary)]">{item.displaySubject?.nameEn || 'Unknown'}</span></div>
                                                  <div className="flex flex-col"><span className="text-xs font-bold text-[var(--text-secondary)] uppercase">{sortBy === 'class' ? t.teacher : t.class}</span><span className="text-sm text-[var(--text-primary)]">{sortBy === 'class' ? (item.displayTeacher?.nameEn || t.withoutTeacher) : (item.type === 'single' ? item.displayClass?.nameEn : item.displayClasses)}</span></div>
                                                  <div className="flex flex-col"><span className="text-xs font-bold text-[var(--text-secondary)] uppercase">{t.periods}</span><div className="flex items-center gap-2 flex-wrap"><span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-bold">{item.type === 'single' ? item.subject.periodsPerWeek : item.jointPeriod.periodsPerWeek}</span>{item.type === 'joint' && !item.isDuty && sortBy === 'class' && <span className="text-[10px] text-orange-600 bg-orange-100 px-1.5 rounded border border-orange-200">Joint</span>}{item.groupName && <span className="text-[10px] text-purple-600 bg-purple-100 px-1.5 rounded border border-purple-200">{item.groupName}</span>}</div></div>
                                              </div>
                                              <div className="flex items-center gap-2 pl-2">
                                                  <button type="button" onClick={() => handleEditClick(item)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors" title="Edit"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg></button>
                                                  <button type="button" onClick={(e) => handleDeleteClick(e, item)} className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors" title="Delete"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg></button>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              )}
                          </div>
                      )}
                  </div>
              ))}
          </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity" onClick={() => setIsModalOpen(false)}>
            <div className="bg-[var(--bg-secondary)] rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden transform transition-all border border-[var(--border-primary)]" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-[var(--border-primary)]">
                    <h3 className="text-xl font-bold text-[var(--text-primary)]">{editingLesson ? t.updateLesson : t.addLesson}</h3>
                </div>
                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">{t.teacher}</label>
                        <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className={inputStyleClasses} disabled={!!limitToTeacherId}>
                            <option value="">{t.withoutTeacher}</option>
                            {teachers.map(t => <option key={t.id} value={t.id}>{t.nameEn}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">{t.subject} <span className="text-red-500">*</span></label>
                        <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={inputStyleClasses}>
                            <option value="">{t.select}</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.nameEn}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">{t.periodsPerWeek}</label>
                        <select value={periodsCount} onChange={(e) => setPeriodsCount(Number(e.target.value))} className={inputStyleClasses}>
                            {Array.from({ length: 15 }, (_, i) => i + 1).map(num => <option key={num} value={num}>{num}</option>)}
                        </select>
                    </div>
                    <div className="animate-fade-in">
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-[var(--text-secondary)]">{t.class} <span className="text-red-500">*</span></label>
                            <span className="text-xs text-[var(--text-secondary)]">{selectedClassIds.length} selected</span>
                        </div>
                        <div className="max-h-40 overflow-y-auto border border-[var(--border-secondary)] rounded-lg p-2 bg-[var(--bg-tertiary)] grid grid-cols-2 gap-2">
                            {visibleClasses.map(c => (
                                <label key={c.id} className="flex items-center space-x-2 cursor-pointer p-1 hover:bg-[var(--accent-secondary)] rounded">
                                    <input type="checkbox" checked={selectedClassIds.includes(c.id)} onChange={(e) => handleClassSelectionChange(c.id, e.target.checked)} disabled={!!limitToClassId && c.id === limitToClassId} className="form-checkbox text-[var(--accent-primary)] rounded" />
                                    <span className="text-xs text-[var(--text-primary)] truncate">{c.nameEn}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="pt-2 border-t border-[var(--border-secondary)]">
                        <label className="flex items-center gap-2 cursor-pointer mb-3">
                            <input type="checkbox" checked={isGroupLesson} onChange={(e) => setIsGroupLesson(e.target.checked)} className="form-checkbox text-[var(--accent-primary)] rounded" />
                            <span className="text-sm font-bold text-[var(--text-primary)]">{t.groupConfiguration || 'Group Configuration'}</span>
                        </label>
                        {isGroupLesson && (
                            <div className="space-y-3 pl-6 animate-scale-in">
                                <div><label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">{t.groupName || 'Group Name'} (e.g. Bio, Comp)</label><input type="text" value={customGroupName} onChange={(e) => setCustomGroupName(e.target.value)} className={inputStyleClasses} placeholder="Enter group name" /></div>
                                <div><label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">{t.groupSetName || 'Group Set Name'} (Optional)</label><input type="text" value={customGroupSetName} onChange={(e) => setCustomGroupSetName(e.target.value)} className={inputStyleClasses} placeholder="e.g. Science Group" /></div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-6 border-t border-[var(--border-primary)] flex justify-end gap-3 bg-[var(--bg-tertiary)]/30">
                    <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-xl transition-colors">{t.cancel}</button>
                    <button onClick={handleSave} className="px-6 py-2.5 text-sm font-bold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] rounded-xl shadow-lg transition-transform active:scale-95">{t.save}</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AddLessonForm;