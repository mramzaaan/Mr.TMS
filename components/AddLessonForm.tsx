
import React, { useState, useMemo } from 'react';
import type { Teacher, SchoolClass, Subject, JointPeriod, TimetableSession, GroupSet } from '../types';
import { generateUniqueId } from '../types';

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
}

const NON_TEACHING_CLASS_ID = 'non-teaching-duties';

const AddLessonForm: React.FC<AddLessonFormProps> = ({ 
    t, teachers, classes, subjects, jointPeriods, 
    onSetClasses, onUpdateTimetableSession, openConfirmation
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

  const resetForm = () => {
    setTeacherId('');
    setSubjectId('');
    setPeriodsCount(1);
    setSelectedClassIds([]);
    setIsGroupLesson(false);
    setCustomGroupName('');
    setCustomGroupSetName('Subject Groups');
    setEditingLesson(null);
  };

  // Helper to get visible classes (excluding duty pseudo-class)
  const visibleClasses = useMemo(() => classes.filter(c => c.id !== NON_TEACHING_CLASS_ID), [classes]);

  // Helper to find or create group structure in a class object
  const getOrCreateGroup = (schoolClass: SchoolClass, setName: string, groupName: string): { updatedClass: SchoolClass, groupSetId: string, groupId: string } => {
      const cls = { ...schoolClass };
      cls.groupSets = cls.groupSets ? [...cls.groupSets] : [];

      // 1. Find or Create Group Set
      let groupSetIndex = cls.groupSets.findIndex(gs => gs.name.toLowerCase() === setName.trim().toLowerCase());
      let groupSet: GroupSet;

      if (groupSetIndex === -1) {
          groupSet = { id: generateUniqueId(), name: setName.trim(), groups: [] };
          cls.groupSets.push(groupSet);
          // Re-fetch index
          groupSetIndex = cls.groupSets.length - 1;
      } else {
          // Create shallow copy of the set to mutate
          groupSet = { ...cls.groupSets[groupSetIndex], groups: [...cls.groupSets[groupSetIndex].groups] };
          cls.groupSets[groupSetIndex] = groupSet;
      }

      // 2. Find or Create Group within Set
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

    // Atomic update using session updater
    onUpdateTimetableSession((session) => {
        let currentClasses = session.classes.map(c => ({...c, subjects: [...c.subjects]})); // Deep copy needed for subjects array
        let currentJointPeriods = [...session.jointPeriods];

        // --- 1. Clean up Previous State (If Editing) ---
        if (editingLesson) {
            if (editingLesson.originalType === 'single' && editingLesson.originalClassId && typeof editingLesson.originalSubjectIndex === 'number') {
                const clsIndex = currentClasses.findIndex(c => c.id === editingLesson.originalClassId);
                if (clsIndex !== -1) {
                    // Remove the old lesson at the specific index by splicing
                    const cls = currentClasses[clsIndex];
                    const newSubjects = [...cls.subjects];
                    if (editingLesson.originalSubjectIndex >= 0 && editingLesson.originalSubjectIndex < newSubjects.length) {
                        newSubjects.splice(editingLesson.originalSubjectIndex, 1);
                        cls.subjects = newSubjects;
                        currentClasses[clsIndex] = cls;
                    }
                }
            } else if (editingLesson.originalType === 'joint' && editingLesson.originalJointPeriodId) {
                currentJointPeriods = currentJointPeriods.filter(jp => jp.id !== editingLesson.originalJointPeriodId);
            }
        }

        // --- 2. Create/Update ---
        if (selectedClassIds.length === 1) {
            // --- SINGLE CLASS LESSON ---
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

                // Append new subject entry
                const newSubjectEntry = {
                    subjectId,
                    teacherId: teacherId || '',
                    periodsPerWeek: periodsCount,
                    groupSetId: assignedGroupSetId,
                    groupId: assignedGroupId
                };

                // Create new subjects array
                targetClass = { ...targetClass, subjects: [...targetClass.subjects, newSubjectEntry] };
                currentClasses[targetClassIndex] = targetClass;
            }
        } else {
            // --- JOINT LESSON ---
            const sub = session.subjects.find(s => s.id === subjectId);
            const tea = session.teachers.find(t => t.id === teacherId);
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
        }

        return {
            ...session,
            classes: currentClasses,
            jointPeriods: currentJointPeriods
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

  // --- List & Edit Logic ---

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
          // Joint
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

              if (lesson.type === 'single') {
                  const { classId } = lesson;
                  const targetClassIndex = currentClasses.findIndex(c => c.id === classId);
                  
                  if (targetClassIndex !== -1) {
                      const cls = { ...currentClasses[targetClassIndex] };
                      const newSubjects = [...cls.subjects];
                      
                      // Use robust finding: match properties first to ensure we delete correct item if index drifted
                      // This is safer than relying solely on subjectIndex if lists were filtered or mutated elsewhere
                      const subjectToRemove = lesson.subject;
                      const realIndex = newSubjects.findIndex(s => 
                          s.subjectId === subjectToRemove.subjectId && 
                          s.teacherId === subjectToRemove.teacherId && 
                          s.periodsPerWeek === subjectToRemove.periodsPerWeek &&
                          s.groupId === subjectToRemove.groupId
                      );

                      if (realIndex !== -1) {
                          newSubjects.splice(realIndex, 1);
                          cls.subjects = newSubjects;
                          currentClasses[targetClassIndex] = cls;
                      } else if (lesson.subjectIndex >= 0 && lesson.subjectIndex < newSubjects.length) {
                          // Fallback to index if exact object match fails but index is valid
                          newSubjects.splice(lesson.subjectIndex, 1);
                          cls.subjects = newSubjects;
                          currentClasses[targetClassIndex] = cls;
                      }
                  }
              } else {
                  currentJointPeriods = currentJointPeriods.filter(jp => jp.id !== lesson.jointPeriod.id);
              }

              return {
                  ...session,
                  classes: currentClasses,
                  jointPeriods: currentJointPeriods
              };
          });
      });
  };

  const sortedList = useMemo(() => {
      if (sortBy === 'class') {
          const list: any[] = classes.filter(c => c.id !== NON_TEACHING_CLASS_ID).map(c => {
              const standard = c.subjects.map((s, idx) => ({
                  type: 'single',
                  key: `single-${c.id}-${idx}`,
                  classId: c.id,
                  subjectIndex: idx,
                  subject: s,
                  displaySubject: subjects.find(sub => sub.id === s.subjectId),
                  displayTeacher: teachers.find(t => t.id === s.teacherId),
                  groupName: s.groupId ? c.groupSets?.find(gs => gs.id === s.groupSetId)?.groups.find(g => g.id === s.groupId)?.name : undefined
              }));

              const joints = jointPeriods.filter(jp => jp.assignments?.some(a => a.classId === c.id)).map(jp => {
                  const firstAssign = jp.assignments.find(a => a.classId === c.id);
                  let groupName = undefined;
                  if (firstAssign?.groupId) {
                      groupName = c.groupSets?.find(gs => gs.id === firstAssign.groupSetId)?.groups.find(g => g.id === firstAssign.groupId)?.name;
                  }

                  return {
                    type: 'joint',
                    key: `joint-${jp.id}`,
                    jointPeriod: jp,
                    displaySubject: subjects.find(sub => sub.id === firstAssign?.subjectId),
                    displayTeacher: teachers.find(t => t.id === jp.teacherId),
                    jointClassNames: jp.assignments?.map(a => classes.find(c => c.id === a.classId)?.nameEn).filter(Boolean).join(', '),
                    groupName
                  };
              });

              const combinedItems = [...standard, ...joints].sort((a, b) => {
                  const nameA = a.displaySubject?.nameEn || '';
                  const nameB = b.displaySubject?.nameEn || '';
                  return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
              });

              return { id: c.id, label: c.nameEn, subLabel: c.nameUr, items: combinedItems };
          });
          return list;

      } else {
          const list: any[] = teachers.map(t => {
              const standard: any[] = [];
              classes.filter(c => c.id !== NON_TEACHING_CLASS_ID).forEach(c => {
                  c.subjects.forEach((s, idx) => {
                      if (s.teacherId === t.id) {
                          standard.push({
                              type: 'single',
                              key: `single-${c.id}-${idx}`,
                              classId: c.id,
                              subjectIndex: idx,
                              subject: s,
                              displayClass: c,
                              displaySubject: subjects.find(sub => sub.id === s.subjectId),
                              groupName: s.groupId ? c.groupSets?.find(gs => gs.id === s.groupSetId)?.groups.find(g => g.id === s.groupId)?.name : undefined
                          });
                      }
                  });
              });

              const joints = jointPeriods.filter(jp => jp.teacherId === t.id).map(jp => {
                  const isDuty = jp.assignments.length === 1 && jp.assignments[0].classId === NON_TEACHING_CLASS_ID;
                  const classNames = isDuty ? 'Personal/Duty' : jp.assignments?.map(a => classes.find(c => c.id === a.classId)?.nameEn).filter(Boolean).join(', ');
                  const firstAssign = jp.assignments[0];
                  let groupName = undefined;
                  if (firstAssign?.groupId) {
                      const c = classes.find(c => c.id === firstAssign.classId);
                      groupName = c?.groupSets?.find(gs => gs.id === firstAssign.groupSetId)?.groups.find(g => g.id === firstAssign.groupId)?.name;
                  }
                  return {
                    type: 'joint',
                    key: `joint-${jp.id}`,
                    jointPeriod: jp,
                    displaySubject: subjects.find(sub => sub.id === jp.assignments[0]?.subjectId),
                    displayClasses: classNames,
                    isDuty,
                    groupName
                  };
              });

              const combinedItems = [...standard, ...joints].sort((a, b) => {
                  const classA = a.type === 'single' ? a.displayClass?.nameEn : a.displayClasses;
                  const classB = b.type === 'single' ? b.displayClass?.nameEn : b.displayClasses;
                  return (classA || '').localeCompare(classB || '');
              });

              return { id: t.id, label: t.nameEn, subLabel: t.nameUr, items: combinedItems };
          });

          // Unassigned
          const unassigned: any[] = [];
          classes.filter(c => c.id !== NON_TEACHING_CLASS_ID).forEach(c => {
              c.subjects.forEach((s, idx) => {
                  if (!s.teacherId) {
                      unassigned.push({
                          type: 'single',
                          key: `single-${c.id}-${idx}`,
                          classId: c.id,
                          subjectIndex: idx,
                          subject: s,
                          displayClass: c,
                          displaySubject: subjects.find(sub => sub.id === s.subjectId),
                          displayTeacher: { nameEn: 'No Teacher' }
                      });
                  }
              });
          });
          
          if (unassigned.length > 0) {
              list.unshift({ id: 'unassigned', label: 'Without Teacher', items: unassigned });
          }
          return list;
      }
  }, [classes, teachers, subjects, jointPeriods, sortBy]);

  const inputStyleClasses = "mt-1 block w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-md shadow-sm text-[var(--text-primary)] focus:outline-none focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] sm:text-sm";

  return (
    <div>
      <button 
        onClick={() => { resetForm(); setIsModalOpen(true); }}
        className="w-full py-6 border-2 border-dashed border-[var(--border-secondary)] rounded-xl text-[var(--text-secondary)] font-bold text-lg hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-secondary)]/10 transition-all flex items-center justify-center gap-2 shadow-sm mb-8"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
        {t.addLesson}
      </button>

      {/* List Section */}
      <div className="bg-[var(--bg-secondary)] rounded-xl shadow-md border border-[var(--border-primary)] overflow-hidden">
          <div className="p-4 border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)] flex justify-between items-center flex-wrap gap-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">{t.lessonList}</h3>
              <div className="flex bg-[var(--bg-secondary)] rounded-lg p-1 border border-[var(--border-secondary)]">
                  <button onClick={() => setSortBy('class')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${sortBy === 'class' ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>{t.sortByClass}</button>
                  <button onClick={() => setSortBy('teacher')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${sortBy === 'teacher' ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>{t.sortByTeacher}</button>
              </div>
          </div>
          
          <div className="divide-y divide-[var(--border-primary)]">
              {sortedList.map(entity => (
                  <div key={entity.id} className="bg-[var(--bg-secondary)]">
                      <button 
                        onClick={() => setExpandedId(expandedId === entity.id ? null : entity.id)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--bg-tertiary)] transition-colors focus:outline-none"
                      >
                          <div>
                              <span className="font-bold text-[var(--text-primary)]">{entity.label}</span>
                              {entity.subLabel && <span className="ml-2 text-sm text-[var(--text-secondary)] font-urdu">{entity.subLabel}</span>}
                              <span className="ml-3 text-xs px-2 py-0.5 bg-[var(--accent-secondary)] text-[var(--accent-primary)] rounded-full">{entity.items.length}</span>
                          </div>
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-[var(--text-secondary)] transform transition-transform ${expandedId === entity.id ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                      </button>
                      
                      {expandedId === entity.id && (
                          <div className="bg-[var(--bg-tertiary)]/30 border-t border-[var(--border-primary)] animate-fade-in">
                              {entity.items.length === 0 ? (
                                  <p className="p-4 text-sm text-[var(--text-secondary)] italic text-center">No lessons found.</p>
                              ) : (
                                  <div className="grid grid-cols-1">
                                      {entity.items.map((item: any) => (
                                          <div key={item.key} className="flex items-center justify-between p-3 border-b border-[var(--border-secondary)] last:border-0 hover:bg-[var(--bg-secondary)] transition-colors">
                                              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 items-center">
                                                  <div className="flex flex-col">
                                                      <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">{t.subject}</span>
                                                      <span className="text-sm font-semibold text-[var(--text-primary)]">{item.displaySubject?.nameEn || 'Unknown'}</span>
                                                  </div>
                                                  <div className="flex flex-col">
                                                      <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">{sortBy === 'class' ? t.teacher : t.class}</span>
                                                      <span className="text-sm text-[var(--text-primary)]">
                                                          {sortBy === 'class' 
                                                            ? (item.displayTeacher?.nameEn || t.withoutTeacher) 
                                                            : (item.type === 'single' ? item.displayClass?.nameEn : item.displayClasses)}
                                                      </span>
                                                  </div>
                                                  <div className="flex flex-col">
                                                      <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">{t.periods}</span>
                                                      <div className="flex items-center gap-2 flex-wrap">
                                                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-bold">
                                                              {item.type === 'single' ? item.subject.periodsPerWeek : item.jointPeriod.periodsPerWeek}
                                                          </span>
                                                          {item.type === 'joint' && !item.isDuty && sortBy === 'class' && (
                                                              <span className="text-[10px] text-orange-600 bg-orange-100 px-1.5 rounded border border-orange-200">
                                                                  Joint
                                                              </span>
                                                          )}
                                                          {item.groupName && (
                                                              <span className="text-[10px] text-purple-600 bg-purple-100 px-1.5 rounded border border-purple-200">
                                                                  {item.groupName}
                                                              </span>
                                                          )}
                                                      </div>
                                                  </div>
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
                    
                    {/* Teacher */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">{t.teacher}</label>
                        <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className={inputStyleClasses}>
                            <option value="">{t.withoutTeacher}</option>
                            {teachers.map(t => <option key={t.id} value={t.id}>{t.nameEn}</option>)}
                        </select>
                    </div>

                    {/* Subject */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">{t.subject} <span className="text-red-500">*</span></label>
                        <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={inputStyleClasses}>
                            <option value="">{t.select}</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.nameEn}</option>)}
                        </select>
                    </div>

                    {/* Periods */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">{t.periodsPerWeek}</label>
                        <select value={periodsCount} onChange={(e) => setPeriodsCount(Number(e.target.value))} className={inputStyleClasses}>
                            {Array.from({ length: 15 }, (_, i) => i + 1).map(num => <option key={num} value={num}>{num}</option>)}
                        </select>
                    </div>

                    {/* Class Selection */}
                    <div className="animate-fade-in">
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-[var(--text-secondary)]">
                                {t.selectAClass} <span className="text-red-500">*</span>
                            </label>
                            {selectedClassIds.length > 1 && <span className="text-xs text-[var(--accent-primary)] font-bold bg-[var(--accent-secondary)] px-2 py-0.5 rounded-full">Joint Lesson Mode</span>}
                        </div>
                        
                        <div className="bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-md p-2 max-h-48 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {visibleClasses.map(c => (
                                <label key={c.id} className={`flex items-center space-x-2 py-1.5 px-2 rounded cursor-pointer transition-colors ${selectedClassIds.includes(c.id) ? 'bg-[var(--accent-secondary)] border border-[var(--accent-primary)]' : 'hover:bg-[var(--bg-secondary)]'}`}>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedClassIds.includes(c.id)} 
                                        onChange={(e) => handleClassSelectionChange(c.id, e.target.checked)}
                                        className="form-checkbox h-4 w-4 text-[var(--accent-primary)] rounded"
                                    />
                                    <span className="text-sm text-[var(--text-primary)]">{c.nameEn}</span>
                                </label>
                            ))}
                        </div>
                        <p className="text-[10px] text-[var(--text-secondary)] mt-1 ml-1">Select one class for standard lesson, or multiple for joint.</p>
                    </div>
                    
                    {/* Group Selection - NEW CHECKBOX LOGIC */}
                    <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-secondary)] animate-scale-in">
                        <div className="flex items-center mb-3">
                            <input 
                                id="isGroupLesson"
                                type="checkbox"
                                checked={isGroupLesson}
                                onChange={(e) => setIsGroupLesson(e.target.checked)}
                                className="form-checkbox h-4 w-4 text-[var(--accent-primary)] rounded cursor-pointer"
                            />
                            <label htmlFor="isGroupLesson" className="ml-2 block text-sm font-bold text-[var(--text-primary)] cursor-pointer">
                                Assign to Specific Group
                            </label>
                        </div>

                        {isGroupLesson && (
                            <div className="grid grid-cols-2 gap-3 animate-fade-in">
                                <div>
                                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">{t.groupName} *</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Biology"
                                        value={customGroupName} 
                                        onChange={(e) => setCustomGroupName(e.target.value)} 
                                        className={inputStyleClasses}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">{t.groupSetName}</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Subject Groups"
                                        value={customGroupSetName} 
                                        onChange={(e) => setCustomGroupSetName(e.target.value)} 
                                        className={inputStyleClasses}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-[var(--border-primary)] flex justify-end gap-3 bg-[var(--bg-tertiary)]/30">
                    <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors">{t.cancel}</button>
                    <button onClick={handleSave} className="px-6 py-2 text-sm font-semibold text-white bg-[var(--accent-primary)] rounded-lg hover:bg-[var(--accent-primary-hover)] shadow-sm transition-colors">{editingLesson ? t.updateLesson : t.save}</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AddLessonForm;
