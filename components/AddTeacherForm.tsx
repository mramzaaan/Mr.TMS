
import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Teacher } from '../types';
import SwipeableListItem from './SwipeableListItem';

interface AddTeacherFormProps {
  t: any;
  teachers: Teacher[];
  onAddTeacher: (teacher: Teacher) => void;
  onUpdateTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (teacherId: string) => void;
}

const AddTeacherForm: React.FC<AddTeacherFormProps> = ({ t, teachers, onAddTeacher, onUpdateTeacher, onDeleteTeacher }) => {
  const [nameEn, setNameEn] = useState('');
  const [nameUr, setNameUr] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | ''>('');
  const [serialNumber, setSerialNumber] = useState('');
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const [sortBy, setSortBy] = useState<'serial' | 'nameEn' | 'nameUr'>('serial');
  
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (editingTeacher) {
        setIsFormOpen(true);
        setNameEn(editingTeacher.nameEn);
        setNameUr(editingTeacher.nameUr);
        setContactNumber(editingTeacher.contactNumber || '');
        setGender(editingTeacher.gender);
        setSerialNumber(String(editingTeacher.serialNumber || ''));
    } else {
        setNameEn('');
        setNameUr('');
        setContactNumber('');
        setGender('');
        setSerialNumber('');
    }
  }, [editingTeacher]);

  const handleEditClick = (teacher: Teacher) => {
    setEditingTeacher(teacher);
  };

  const handleCancel = () => {
    setEditingTeacher(null);
    setIsFormOpen(false);
    setNameEn('');
    setNameUr('');
    setContactNumber('');
    setGender('');
    setSerialNumber('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn || !nameUr || !contactNumber || !gender) {
      alert('Please fill out all fields.');
      return;
    }

    const teacherData = { nameEn, nameUr, contactNumber, gender, serialNumber: serialNumber ? parseInt(serialNumber, 10) : undefined };

    if (editingTeacher) {
        onUpdateTeacher({ ...editingTeacher, ...teacherData });
        alert('Teacher updated successfully!');
        setEditingTeacher(null);
    } else {
        onAddTeacher({
            id: Date.now().toString(),
            ...teacherData,
        });
        alert('Teacher added successfully!');
        setNameEn('');
        setNameUr('');
        setContactNumber('');
        setGender('');
        setSerialNumber('');
    }
    setIsFormOpen(false);
  };

  const handleDelete = (teacher: Teacher) => {
    onDeleteTeacher(teacher.id);
  };

  const sortedTeachers = useMemo(() => {
    return [...teachers].sort((a, b) => {
        if (sortBy === 'serial') return (a.serialNumber ?? Infinity) - (b.serialNumber ?? Infinity);
        if (sortBy === 'nameEn') return a.nameEn.localeCompare(b.nameEn);
        if (sortBy === 'nameUr') return a.nameUr.localeCompare(b.nameUr);
        return 0;
    });
  }, [teachers, sortBy]);

  return (
    <div>
        <button 
            onClick={() => setIsFormOpen(true)}
            className="w-full py-6 border-2 border-dashed border-[var(--border-secondary)] rounded-xl text-[var(--text-secondary)] font-bold text-lg hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-secondary)]/10 transition-all flex items-center justify-center gap-2 shadow-sm mb-8"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {t.addTeacher}
        </button>

        {isFormOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity" onClick={handleCancel}>
                <div className="bg-[var(--bg-secondary)] p-6 sm:p-8 rounded-xl shadow-2xl max-w-2xl w-full mx-4 transform transition-all border border-[var(--border-primary)]" onClick={e => e.stopPropagation()}>
                    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">{editingTeacher ? t.edit : t.addTeacher}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label htmlFor="teacherNameEn" className="block text-sm font-medium text-[var(--text-secondary)]">{t.teacherNameEn}</label>
                                <input
                                    type="text"
                                    id="teacherNameEn"
                                    value={nameEn}
                                    onChange={(e) => setNameEn(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-md shadow-sm text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] sm:text-sm"
                                    required
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="teacherNameUr" className="block text-sm font-medium text-[var(--text-secondary)]">{t.teacherNameUr}</label>
                                <input
                                    type="text"
                                    id="teacherNameUr"
                                    value={nameUr}
                                    onChange={(e) => setNameUr(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-md shadow-sm text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] sm:text-sm font-urdu"
                                    dir="rtl"
                                    placeholder="مثلاً سمیع اللہ"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="serialNumber" className="block text-sm font-medium text-[var(--text-secondary)]">{t.serialNumber}</label>
                                <input
                                    type="number"
                                    id="serialNumber"
                                    value={serialNumber}
                                    onChange={(e) => setSerialNumber(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-md shadow-sm text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] sm:text-sm"
                                    placeholder="e.g., 1"
                                />
                            </div>
                            <div>
                                <label htmlFor="contactNumber" className="block text-sm font-medium text-[var(--text-secondary)]">{t.contactNumber}</label>
                                <input
                                    type="tel"
                                    id="contactNumber"
                                    value={contactNumber}
                                    onChange={(e) => setContactNumber(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-md shadow-sm text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] sm:text-sm"
                                    placeholder="e.g., 0300-1234567"
                                    required
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="gender" className="block text-sm font-medium text-[var(--text-secondary)]">{t.gender}</label>
                                <select
                                    id="gender"
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value as 'Male' | 'Female' | '')}
                                    className="mt-1 block w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-md shadow-sm text-[var(--text-primary)] focus:outline-none focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] sm:text-sm"
                                    required
                                >
                                    <option value="">{t.select}</option>
                                    <option value="Male">{t.male}</option>
                                    <option value="Female">{t.female}</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-4 pt-4">
                            <button type="button" onClick={handleCancel} className="px-6 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-semibold rounded-lg hover:bg-[var(--accent-secondary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors">
                                {t.cancel}
                            </button>
                            <button type="submit" className="px-6 py-2 bg-[var(--accent-primary)] text-[var(--accent-text)] font-semibold rounded-lg shadow-md hover:bg-[var(--accent-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-primary)] transition-colors">
                                {editingTeacher ? t.update : t.save}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

      <div className="mt-10">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-[var(--text-primary)]">{t.existingTeachers}</h3>
            <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 text-sm bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-md text-[var(--text-primary)] focus:outline-none focus:ring-[var(--accent-primary)]"
            >
                <option value="serial">Sort by: Serial</option>
                <option value="nameEn">Sort by: Name (En)</option>
                <option value="nameUr">Sort by: Name (Ur)</option>
            </select>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-lg shadow-md border border-[var(--border-primary)]">
          <ul className="divide-y divide-[var(--border-primary)]">
            {sortedTeachers.map((teacher) => (
              <li key={teacher.id} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                <div className="flex items-center">
                    <div className="flex-shrink-0 w-12 text-center text-sm font-medium text-[var(--text-secondary)]">
                        {teacher.serialNumber}
                    </div>
                    <div className="flex-grow border-l border-[var(--border-primary)]">
                        <SwipeableListItem
                          t={t}
                          item={teacher}
                          onEdit={handleEditClick}
                          onDelete={handleDelete}
                          renderContent={(item) => (
                            <div>
                                <p className="font-semibold text-[var(--text-primary)]">{item.nameEn} <span className="font-urdu">/ {item.nameUr}</span></p>
                                <p className="text-sm text-[var(--text-secondary)]">{item.contactNumber} ({item.gender})</p>
                            </div>
                          )}
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

export default AddTeacherForm;
