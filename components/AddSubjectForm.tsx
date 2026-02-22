
import React, { useState, useEffect, useRef } from 'react';
import type { Subject } from '../types';
import { generateUniqueId } from '../types';
import SwipeableListItem from './SwipeableListItem';

interface AddSubjectFormProps {
  t: any;
  subjects: Subject[];
  onAddSubject: (subject: Subject) => void;
  onUpdateSubject: (subject: Subject) => void;
  onDeleteSubject: (subjectId: string) => void;
}

const AddSubjectForm: React.FC<AddSubjectFormProps> = ({ t, subjects, onAddSubject, onUpdateSubject, onDeleteSubject }) => {
  const [nameEn, setNameEn] = useState('');
  const [nameUr, setNameUr] = useState('');
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const formRef = useRef<HTMLFormElement>(null);

  const resetForm = () => {
    setNameEn('');
    setNameUr('');
  }

  useEffect(() => {
    if (editingSubject) {
      setIsFormOpen(true);
      setNameEn(editingSubject.nameEn);
      setNameUr(editingSubject.nameUr);
    } else {
      resetForm();
    }
  }, [editingSubject]);

  const handleEditClick = (subject: Subject) => {
    setEditingSubject(subject);
    // Modal handles focus automatically usually, but if needed we can focus first input
  };

  const handleCancel = () => {
    setEditingSubject(null);
    setIsFormOpen(false);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn || !nameUr) {
      alert('Please fill out the primary subject name fields.');
      return;
    }

    const trimmedNameEn = nameEn.trim();
    const trimmedNameUr = nameUr.trim();

    const duplicateEn = subjects.find(
      s => s.nameEn.toLowerCase() === trimmedNameEn.toLowerCase() && s.id !== editingSubject?.id
    );

    if (duplicateEn) {
      alert(t.subjectNameEnExists);
      return;
    }

    const duplicateUr = subjects.find(
      s => s.nameUr === trimmedNameUr && s.id !== editingSubject?.id
    );

    if (duplicateUr) {
      alert(t.subjectNameUrExists);
      return;
    }
    
    const subjectData: Partial<Subject> = {
        nameEn: trimmedNameEn,
        nameUr: trimmedNameUr,
    };

    if (editingSubject) {
        onUpdateSubject({ ...editingSubject, ...subjectData });
        alert('Subject updated successfully!');
        setEditingSubject(null);
    } else {
        onAddSubject({
            id: generateUniqueId(),
            ...subjectData,
        } as Subject);
        alert('Subject added successfully!');
        resetForm();
    }
    setIsFormOpen(false);
  };

  const handleDelete = (subject: Subject) => {
    onDeleteSubject(subject.id);
  };

  const inputStyleClasses = "mt-1 block w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-md shadow-sm text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] sm:text-sm";
  
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
            {t.addSubject}
        </button>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity" onClick={handleCancel}>
            <div className="bg-[var(--bg-secondary)] p-6 sm:p-8 rounded-xl shadow-2xl max-w-lg w-full mx-4 transform transition-all border border-[var(--border-primary)]" onClick={e => e.stopPropagation()}>
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">{editingSubject ? t.edit : t.addSubject}</h3>
                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label htmlFor="subjectNameEn" className="block text-sm font-medium text-[var(--text-secondary)]">{t.subjectNameEn}</label>
                            <input
                            type="text"
                            id="subjectNameEn"
                            value={nameEn}
                            onChange={(e) => setNameEn(e.target.value)}
                            className={inputStyleClasses}
                            required
                            />
                        </div>
                        <div>
                            <label htmlFor="subjectNameUr" className="block text-sm font-medium text-[var(--text-secondary)]">{t.subjectNameUr}</label>
                            <input
                            type="text"
                            id="subjectNameUr"
                            value={nameUr}
                            onChange={(e) => setNameUr(e.target.value)}
                            className={`${inputStyleClasses} font-urdu`}
                            dir="rtl"
                            placeholder="مثلاً ریاضی"
                            required
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={handleCancel} className="px-6 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-semibold rounded-lg hover:bg-[var(--accent-secondary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors">
                            {t.cancel}
                        </button>
                        <button type="submit" className="px-6 py-2 bg-[var(--accent-primary)] text-[var(--accent-text)] font-semibold rounded-lg shadow-md hover:bg-[var(--accent-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-primary)] transition-colors">
                            {editingSubject ? t.update : t.save}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      <div className="mt-10">
        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">{t.existingSubjects}</h3>
        <div className="bg-[var(--bg-secondary)] rounded-lg shadow-md border border-[var(--border-primary)]">
            <ul className="divide-y divide-[var(--border-primary)]">
                {subjects.map((subject, index) => (
                    <li key={subject.id} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 w-12 text-center text-sm font-medium text-[var(--text-secondary)]">
                                {index + 1}
                            </div>
                            <div className="flex-grow border-l border-[var(--border-primary)]">
                                <SwipeableListItem
                                    t={t}
                                    item={subject}
                                    onEdit={handleEditClick}
                                    onDelete={handleDelete}
                                    renderContent={(s) => {
                                        return (
                                            <div className="flex-1">
                                                <p className="font-semibold text-[var(--text-primary)]">
                                                    {s.nameEn} <span className="font-urdu">/ {s.nameUr}</span>
                                                </p>
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

export default AddSubjectForm;
