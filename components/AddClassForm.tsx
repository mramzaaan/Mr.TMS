
import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { SchoolClass, Subject, Teacher, TimetableGridData } from '../types';
import { generateUniqueId } from '../types';
import SwipeableListItem from './SwipeableListItem';

interface AddClassFormProps {
  t: any;
  subjects: Subject[];
  teachers: Teacher[];
  classes: SchoolClass[];
  onSetClasses: (classes: SchoolClass[]) => void;
  onDeleteClass: (classId: string) => void;
}

const createEmptyTimetable = (): TimetableGridData => ({
  Monday: Array.from({ length: 8 }, () => []),
  Tuesday: Array.from({ length: 8 }, () => []),
  Wednesday: Array.from({ length: 8 }, () => []),
  Thursday: Array.from({ length: 8 }, () => []),
  Friday: Array.from({ length: 8 }, () => []),
  Saturday: Array.from({ length: 8 }, () => []),
});

const AddClassForm: React.FC<AddClassFormProps> = ({ t, subjects, teachers, classes, onSetClasses, onDeleteClass }) => {
  const [nameEn, setNameEn] = useState('');
  const [nameUr, setNameUr] = useState('');
  const [category, setCategory] = useState<'High' | 'Middle' | 'Primary' | ''>('');
  const [inCharge, setInCharge] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [studentCount, setStudentCount] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const [sortBy, setSortBy] = useState<'serial' | 'nameEn' | 'nameUr' | 'studentCount'>('serial');
  
  const formRef = useRef<HTMLFormElement>(null);

  // Filter out pseudo-class 'non-teaching-duties'
  const visibleClasses = useMemo(() => classes.filter(c => c.id !== 'non-teaching-duties'), [classes]);

  const resetForm = () => {
    setNameEn('');
    setNameUr('');
    setCategory('');
    setInCharge('');
    setRoomNumber('');
    setStudentCount('');
    setSerialNumber('');
  };

  useEffect(() => {
    if (editingClass) {
        setIsFormOpen(true);
        setNameEn(editingClass.nameEn);
        setNameUr(editingClass.nameUr);
        setCategory(editingClass.category || '');
        setInCharge(editingClass.inCharge);
        setRoomNumber(editingClass.roomNumber);
        setStudentCount(String(editingClass.studentCount));
        setSerialNumber(String(editingClass.serialNumber || ''));
    } else {
        resetForm();
    }
  }, [editingClass]);

  const handleEditClick = (schoolClass: SchoolClass) => {
    setEditingClass(schoolClass);
  };

  const handleCancel = () => {
    setEditingClass(null);
    setIsFormOpen(false);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn || !nameUr || !category || !inCharge || !roomNumber || !studentCount) {
        alert('Please fill out all required class details.');
        return;
    }

    const classData: SchoolClass = {
        id: editingClass ? editingClass.id : generateUniqueId(),
        serialNumber: serialNumber ? parseInt(serialNumber, 10) : undefined,
        nameEn, nameUr, 
        category: category as 'High' | 'Middle' | 'Primary',
        inCharge, roomNumber,
        studentCount: parseInt(studentCount, 10),
        // Preserve existing subjects and groups if editing
        subjects: editingClass ? editingClass.subjects : [],
        timetable: editingClass ? editingClass.timetable : createEmptyTimetable(),
        groupSets: editingClass ? editingClass.groupSets : [],
    };
    
    let updatedClasses = [...classes];
    const existingIndex = classes.findIndex(c => c.id === classData.id);
    if (existingIndex !== -1) {
      updatedClasses[existingIndex] = classData;
    } else {
      updatedClasses.push(classData);
    }
    onSetClasses(updatedClasses);
    alert(editingClass ? 'Class updated successfully!' : 'Class added successfully!');
    setEditingClass(null);
    resetForm();
    setIsFormOpen(false);
  };
  
  const inputStyleClasses = "mt-1 block w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-md shadow-sm text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] sm:text-sm";

  const sortedClasses = useMemo(() => {
    return [...visibleClasses].sort((a, b) => {
        if (sortBy === 'serial') return (a.serialNumber ?? Infinity) - (b.serialNumber ?? Infinity);
        if (sortBy === 'nameEn') return a.nameEn.localeCompare(b.nameEn);
        if (sortBy === 'nameUr') return a.nameUr.localeCompare(b.nameUr);
        if (sortBy === 'studentCount') return b.studentCount - a.studentCount;
        return 0;
    });
  }, [visibleClasses, sortBy]);

  return (
    <div>
      <button 
          onClick={() => setIsFormOpen(true)}
          className="w-full py-4 bg-blue-500 text-white font-bold text-lg rounded-full shadow-lg hover:bg-blue-600 hover:shadow-xl transition-all flex items-center justify-center gap-2 mb-8 transform active:scale-[0.98]"
      >
          <div className="bg-white/20 rounded-full p-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
          </div>
          {t.addClass}
      </button>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity" onClick={handleCancel}>
            <div className="bg-[var(--bg-secondary)] p-6 sm:p-8 rounded-xl shadow-2xl max-w-3xl w-full mx-4 transform transition-all border border-[var(--border-primary)]" onClick={e => e.stopPropagation()}>
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <h3 className="text-xl font-bold text-[var(--text-primary)]">{editingClass ? t.edit : t.addClass}</h3>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">{t.classDetails}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="classNameEn" className="block text-sm font-medium text-[var(--text-secondary)]">{t.classNameEn}</label>
                            <input type="text" id="classNameEn" value={nameEn} onChange={(e) => setNameEn(e.target.value)} className={inputStyleClasses} required />
                        </div>
                        <div>
                            <label htmlFor="classNameUr" className="block text-sm font-medium text-[var(--text-secondary)]">{t.classNameUr}</label>
                            <input type="text" id="classNameUr" value={nameUr} onChange={(e) => setNameUr(e.target.value)} className={`${inputStyleClasses} font-urdu`} dir="rtl" required />
                        </div>
                        <div>
                            <label htmlFor="classCategory" className="block text-sm font-medium text-[var(--text-secondary)]">{t.category}</label>
                            <select id="classCategory" value={category} onChange={(e) => setCategory(e.target.value as 'High' | 'Middle' | 'Primary' | '')} className={inputStyleClasses} required>
                                <option value="">{t.select}</option>
                                <option value="High">{t.high}</option>
                                <option value="Middle">{t.middle}</option>
                                <option value="Primary">{t.primary}</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="classInCharge" className="block text-sm font-medium text-[var(--text-secondary)]">{t.classInCharge}</label>
                            <select id="classInCharge" value={inCharge} onChange={(e) => setInCharge(e.target.value)} className={inputStyleClasses} required>
                                <option value="">{t.selectTeacher}</option>
                                {teachers.map(teacher => <option key={teacher.id} value={teacher.id}>{teacher.nameEn}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="roomNumber" className="block text-sm font-medium text-[var(--text-secondary)]">{t.roomNumber}</label>
                            <input type="text" id="roomNumber" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} className={inputStyleClasses} required />
                        </div>
                        <div>
                            <label htmlFor="studentCount" className="block text-sm font-medium text-[var(--text-secondary)]">{t.studentCount}</label>
                            <input type="number" id="studentCount" value={studentCount} onChange={(e) => setStudentCount(e.target.value)} className={inputStyleClasses} required />
                        </div>
                        <div className="sm:col-span-2">
                            <label htmlFor="serialNumber" className="block text-sm font-medium text-[var(--text-secondary)]">{t.serialNumber}</label>
                            <input type="number" id="serialNumber" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} className={inputStyleClasses} />
                        </div>
                    </div>
                    
                    <div className="flex justify-end space-x-4 pt-4 border-t border-[var(--border-primary)]">
                        <button type="button" onClick={handleCancel} className="px-6 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-semibold rounded-lg hover:bg-[var(--accent-secondary-hover)]">{t.cancel}</button>
                        <button type="submit" className="px-6 py-2 bg-[var(--accent-primary)] text-[var(--accent-text)] font-semibold rounded-lg shadow-md hover:bg-[var(--accent-primary-hover)]">{editingClass ? t.update : t.save}</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      <div className="mt-10">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-[var(--text-primary)]">{t.existingClasses}</h3>
            <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 text-sm bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-md text-[var(--text-primary)] focus:outline-none focus:ring-[var(--accent-primary)] max-w-[140px]"
            >
                <option value="serial">Sort by: Serial</option>
                <option value="nameEn">Sort by: Name (En)</option>
                <option value="nameUr">Sort by: Name (Ur)</option>
                <option value="studentCount">Sort by: Students</option>
            </select>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-lg shadow-md border border-[var(--border-primary)] max-h-[calc(100vh-160px)] overflow-y-auto custom-scrollbar">
          <ul className="divide-y divide-[var(--border-primary)]">
            {sortedClasses.map((schoolClass) => (
              <li key={schoolClass.id} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                <div className="flex items-center">
                    <div className="flex-shrink-0 w-12 text-center text-sm font-medium text-[var(--text-secondary)]">
                        {schoolClass.serialNumber}
                    </div>
                    <div className="flex-grow border-l border-[var(--border-primary)]">
                        <SwipeableListItem
                          t={t}
                          item={schoolClass}
                          onEdit={handleEditClick}
                          onDelete={(item) => onDeleteClass(item.id)}
                          renderContent={(c) => {
                            const inChargeTeacher = teachers.find(t => t.id === c.inCharge);
                            return (
                              <div>
                                <p className="font-semibold text-[var(--text-primary)]">{c.nameEn} <span className="font-urdu">/ {c.nameUr}</span></p>
                                <p className="text-sm text-[var(--text-secondary)]">
                                  {c.category && <span className="font-semibold">{t[c.category.toLowerCase()]} | </span>}
                                  {t.classInCharge}: {inChargeTeacher?.nameEn || c.inCharge}
                                </p>
                                <p className="text-sm text-[var(--text-secondary)]">Subjects: {c.subjects.length}</p>
                              </div>
                            );
                          }}
                        />
                    </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AddClassForm;
