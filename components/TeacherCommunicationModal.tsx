
import React, { useState, useMemo } from 'react';
import type { Teacher, TimetableGridData, Subject, SchoolClass, SchoolConfig, TriangleCorner, Period, CardStyle } from '../types';
import { allDays } from '../types';

// Declaring html2canvas
declare const html2canvas: any;

interface TeacherCommunicationModalProps {
  t: any;
  isOpen: boolean;
  onClose: () => void;
  selectedTeacher: Teacher;
  teacherTimetableData: TimetableGridData;
  subjects: Subject[];
  classes: SchoolClass[];
  schoolConfig: SchoolConfig;
  subjectColorMap: Map<string, string>;
}

const subjectColorNames = [
  'subject-red', 'subject-sky', 'subject-green', 'subject-yellow',
  'subject-purple', 'subject-pink', 'subject-indigo', 'subject-teal',
  'subject-orange', 'subject-lime', 'subject-cyan', 'subject-emerald',
  'subject-fuchsia', 'subject-rose', 'subject-amber', 'subject-blue'
];

const COLOR_HEX_MAP: Record<string, string> = {
    'subject-red': '#fee2e2', 'subject-sky': '#e0f2fe', 'subject-green': '#dcfce7', 'subject-yellow': '#fef9c3',
    'subject-purple': '#f3e8ff', 'subject-pink': '#fce7f3', 'subject-indigo': '#e0e7ff', 'subject-teal': '#ccfbf1',
    'subject-orange': '#ffedd5', 'subject-lime': '#ecfccb', 'subject-cyan': '#cffafe', 'subject-emerald': '#d1fae5',
    'subject-fuchsia': '#fae8ff', 'subject-rose': '#ffe4e6', 'subject-amber': '#fef3c7', 'subject-blue': '#dbeafe',
    'subject-default': '#f3f4f6'
};

const TEXT_HEX_MAP: Record<string, string> = {
    'subject-red': '#991b1b', 'subject-sky': '#0369a1', 'subject-green': '#166534', 'subject-yellow': '#854d0e',
    'subject-purple': '#6b21a8', 'subject-pink': '#9d174d', 'subject-indigo': '#3730a3', 'subject-teal': '#134e4a',
    'subject-orange': '#9a3412', 'subject-lime': '#4d7c0f', 'subject-cyan': '#0e7490', 'subject-emerald': '#065f46',
    'subject-fuchsia': '#86198f', 'subject-rose': '#9f1239', 'subject-amber': '#92400e', 'subject-blue': '#1e40af',
    'subject-default': '#374151'
};

const TeacherCommunicationModal: React.FC<TeacherCommunicationModalProps> = ({
  t,
  isOpen,
  onClose,
  selectedTeacher,
  teacherTimetableData,
  subjects,
  classes,
  schoolConfig,
  subjectColorMap
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');
  const [mergePatterns, setMergePatterns] = useState(schoolConfig.downloadDesigns.teacher.table.mergeIdenticalPeriods ?? true);

  const themeColors = useMemo(() => {
    if (typeof window === 'undefined') return { accent: '#0d9488', bg: '#ffffff', text: '#111827' };
    const style = getComputedStyle(document.documentElement);
    return {
      accent: style.getPropertyValue('--accent-primary').trim() || '#0d9488',
      bg: style.getPropertyValue('--bg-secondary').trim() || '#ffffff',
      text: style.getPropertyValue('--text-primary').trim() || '#111827'
    };
  }, [isOpen]);

  const activeDays = useMemo(() => 
    allDays.filter(day => schoolConfig.daysConfig?.[day]?.active ?? true), 
    [schoolConfig.daysConfig]
  );

  const workload = useMemo(() => {
    let count = 0;
    activeDays.forEach(day => {
      teacherTimetableData[day]?.forEach(slot => {
        if (slot && slot.length > 0) {
          count++;
        }
      });
    });
    return count;
  }, [teacherTimetableData, activeDays]);

  const timetableMessage = useMemo(() => {
    let message = `*${t.teacherTimetable}: ${selectedTeacher.nameEn} / ${selectedTeacher.nameUr}*\n\n`;

    activeDays.forEach(day => {
      const periodsForDay: { periodIndex: number, text: string }[] = [];
      for (let i = 0; i < 12; i++) {
        const slot = teacherTimetableData[day]?.[i] || [];
        if (slot.length > 0) {
          const slotText = slot.map(period => {
            const subject = subjects.find(s => s.id === period.subjectId);
            const schoolClass = classes.find(c => c.id === period.classId);
            return subject && schoolClass ? `${subject.nameEn} (${schoolClass.nameEn})` : '';
          }).filter(Boolean).join(' / ');
          
          if (slotText) {
            periodsForDay.push({ periodIndex: i, text: slotText });
          }
        }
      }

      if (periodsForDay.length > 0) {
        message += `*${t[day.toLowerCase()]}*\n`;
        periodsForDay.forEach(p => {
          message += `- P${p.periodIndex + 1}: ${p.text}\n`;
        });
        message += '\n';
      }
    });

    return message.trim();
  }, [selectedTeacher, teacherTimetableData, subjects, classes, t, activeDays]);

  const generateTimetableImageHtml = () => {
      const allColorClasses = [...subjectColorNames, 'subject-default'];
      const cardStyle = schoolConfig.downloadDesigns.teacher.table.cardStyle || 'full';
      const triangleCorner = schoolConfig.downloadDesigns.teacher.table.triangleCorner || 'bottom-left';
      const outlineWidth = schoolConfig.downloadDesigns.teacher.table.outlineWidth || 2;
      
      // Fixed 1:1 Ratio
      const size = 1000;
      const width = size;
      const height = size;

      let triangleStyles = '';
      const triangleSize = 20;
      if (triangleCorner === 'top-left') {
          triangleStyles = `top: 0; left: 0; border-width: ${triangleSize}px ${triangleSize}px 0 0; border-color: currentColor transparent transparent transparent;`;
      } else if (triangleCorner === 'top-right') {
          triangleStyles = `top: 0; right: 0; border-width: 0 ${triangleSize}px ${triangleSize}px 0; border-color: transparent currentColor transparent transparent;`;
      } else if (triangleCorner === 'bottom-right') {
          triangleStyles = `bottom: 0; right: 0; border-width: 0 0 ${triangleSize}px ${triangleSize}px; border-color: transparent transparent currentColor transparent;`;
      } else { // bottom-left default
          triangleStyles = `bottom: 0; left: 0; border-width: ${triangleSize}px 0 0 ${triangleSize}px; border-color: transparent transparent transparent currentColor;`;
      }
      
      let cardStyleCss = '';
      if (cardStyle === 'full') {
          cardStyleCss = 'box-shadow: 0 1px 2px rgba(0,0,0,0.08); border: 1px solid rgba(0,0,0,0.05);';
      } else if (cardStyle === 'outline') {
          cardStyleCss = `background-color: #ffffff !important; border-width: ${outlineWidth}px !important; border-style: solid !important; box-shadow: none !important; color: inherit !important;`;
      } else if (cardStyle === 'text' || cardStyle === 'triangle') {
          cardStyleCss = 'background-color: #ffffff !important; border: 1px solid transparent !important; box-shadow: none !important; color: inherit !important;';
      } else if (cardStyle === 'glass') {
          cardStyleCss = 'background: rgba(255, 255, 255, 0.5) !important; backdrop-filter: blur(4px); border: 1px solid rgba(255, 255, 255, 0.3) !important; box-shadow: 0 4px 6px rgba(0,0,0,0.05) !important;';
      } else if (cardStyle === 'gradient') {
          cardStyleCss = 'background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(0,0,0,0.1) 100%) !important; box-shadow: 0 4px 15px rgba(0,0,0,0.1) !important; border: none !important;';
      } else if (cardStyle === 'minimal-left') {
          cardStyleCss = 'background-color: #f8fafc !important; border-left: 5px solid currentColor !important; border-top: none !important; border-right: none !important; border-bottom: none !important; box-shadow: none !important; border-radius: 2px !important;';
      } else if (cardStyle === 'badge') {
          cardStyleCss = 'background-color: transparent !important; border: none !important; box-shadow: none !important;';
      }

      const styles = `
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;700;900&family=Noto+Nastaliq+Urdu:wght@400;700&display=swap');
          * { 
            box-sizing: border-box !important; 
            -webkit-text-size-adjust: none !important; 
            text-size-adjust: none !important; 
            font-family: 'Inter', sans-serif !important; 
          }
          .timetable-image-container {
            background: #ffffff;
            padding: 30px;
            width: ${width}px;
            height: ${height}px;
            color: #1f2937;
            box-sizing: border-box;
            border: 1px solid #e5e7eb;
            border-radius: 20px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            position: relative;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          }

          .timetable-image-container::before {
            content: '';
            position: absolute;
            top: -10%;
            left: -10%;
            width: 45%;
            height: 45%;
            background: radial-gradient(circle, ${themeColors.accent}15 0%, transparent 70%);
            z-index: 0;
            pointer-events: none;
          }
          .timetable-image-container::after {
            content: '';
            position: absolute;
            bottom: -5%;
            right: -5%;
            width: 35%;
            height: 35%;
            background: radial-gradient(circle, ${themeColors.accent}10 0%, transparent 70%);
            z-index: 0;
            pointer-events: none;
          }

          .font-urdu { font-family: 'Noto Nastaliq Urdu', serif !important; }
          
          .img-header {
            position: relative;
            z-index: 10;
            margin-bottom: 25px;
          }

          .img-school-name { 
            font-family: 'Anton', sans-serif !important;
            font-size: 44px; 
            color: ${themeColors.accent}; 
            text-align: center;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
            line-height: 1;
            padding-bottom: 4px;
          }
          
          .header-info-row {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            background: #f8fafc;
            border-radius: 12px;
            padding: 15px 30px;
            border-left: 8px solid ${themeColors.accent};
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
            gap: 15px;
          }
          
          .info-teacher-name { 
            font-size: 38px; 
            font-weight: 900; 
            color: #111827; 
            text-transform: uppercase; 
            line-height: 1;
            flex-grow: 1;
            text-align: center;
            white-space: nowrap;
          }
          
          .info-label {
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            color: #64748b;
            letter-spacing: 0.05em;
            margin-bottom: 5px;
            display: block;
          }

          .info-value {
            font-size: 16px;
            font-weight: 800;
            color: #334155;
            line-height: 1.1;
          }

          .info-stats-side { 
            flex: 1;
            max-width: 30%;
          }
          
          .img-table { 
            width: 100%; 
            border-collapse: separate; 
            border-spacing: 8px; 
            table-layout: fixed; 
            flex-grow: 1; 
            border: none; 
            position: relative;
            z-index: 10;
          }
          
          .img-table th { 
            background-color: ${themeColors.accent};
            color: white; 
            font-weight: 900; 
            text-transform: uppercase;
            padding: 12px 6px;
            border-radius: 10px;
            font-size: 15px;
            line-height: 1;
            letter-spacing: 0.025em;
          }
          .img-table th:first-child { width: 50px; background: transparent; color: ${themeColors.accent}; }
          
          .period-label { 
            background-color: transparent !important; 
            color: #94a3b8; 
            font-weight: 900; 
            font-size: 28px;
            text-align: center;
            line-height: 1;
          }
          
          .slot-cell { 
            height: auto; 
            padding: 0; 
            background-color: transparent; 
            border: none !important;
          }
          
          .card-wrapper {
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100%;
            justify-content: flex-start;
            gap: 4px;
          }

          .teacher-card-img { 
            flex: 1;
            border-radius: 10px; 
            line-height: 1; 
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            overflow: hidden;
            ${cardStyleCss}
            position: relative;
            height: 100%;
            padding: 8px;
          }
          .teacher-card-img p { margin: 0; padding: 0 1px; width: 100%; z-index: 10; position: relative; color: inherit !important; line-height: 1.1; }
          .period-subject { font-weight: 900; font-size: 18px; text-transform: uppercase; margin-bottom: 2px !important; }
          .period-class { font-weight: 600; opacity: 0.9; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

          .card-triangle {
              position: absolute;
              width: 0;
              height: 0;
              border-style: solid;
              ${triangleStyles}
              z-index: 5;
          }
          
          ${allColorClasses.map(name => `
              .${name} { 
                  ${cardStyle === 'full' ? `background-color: ${COLOR_HEX_MAP[name]}; color: ${TEXT_HEX_MAP[name]};` : `background-color: #ffffff; color: ${TEXT_HEX_MAP[name]};`}
                  border-color: ${TEXT_HEX_MAP[name]} !important; 
              }
              .${name} .period-subject, .${name} .period-class { color: ${TEXT_HEX_MAP[name]} !important; }
              .${name} .card-triangle { 
                  color: ${TEXT_HEX_MAP[name]} !important;
                  opacity: ${cardStyle === 'full' ? 0.3 : 1.0};
              }
              ${cardStyle === 'badge' ? `.${name} .period-subject { background-color: ${TEXT_HEX_MAP[name]}; color: #fff !important; padding: 2px 8px; border-radius: 12px; }` : ''}
          `).join('\n')}

          .footer-watermark {
             display: flex;
             justify-content: space-between;
             align-items: flex-end;
             margin-top: 15px; 
             padding: 0 15px;
             font-size: 11px; 
             color: #94a3b8; 
             font-weight: 800; 
             letter-spacing: 1px;
             line-height: 1.2;
             text-transform: uppercase;
             position: relative;
             z-index: 10;
          }
          .footer-branding { color: ${themeColors.accent}; font-weight: 900; margin-bottom: 2px; }
          .footer-timestamp { font-size: 8.5px; opacity: 0.7; font-weight: 700; letter-spacing: 0.5px; }
        </style>
      `;
      
      const maxPeriods = Math.max(...activeDays.map(day => schoolConfig.daysConfig?.[day]?.periodCount ?? 8));

      const grid: (null | { html: string, key: string })[][] = Array.from({ length: maxPeriods }, () => Array(activeDays.length).fill(null));
      
      for (let r = 0; r < maxPeriods; r++) {
          for (let c = 0; c < activeDays.length; c++) {
              const day = activeDays[c];
              const slot = teacherTimetableData[day]?.[r] || [];
              if (slot.length > 0) {
                  const groupedBySubject = new Map<string, { classNames: string[] }>();
                  slot.forEach(p => {
                      const sub = subjects.find(s => s.id === p.subjectId);
                      const cls = classes.find(cl => cl.id === p.classId);
                      if (sub && cls) {
                          if (!groupedBySubject.has(sub.id)) groupedBySubject.set(sub.id, { classNames: [] });
                          groupedBySubject.get(sub.id)!.classNames.push(cls.nameEn);
                      }
                  });
                  
                  const sortedSubjectIds = Array.from(groupedBySubject.keys()).sort();
                  const key = sortedSubjectIds.map(sid => `${sid}:${groupedBySubject.get(sid)!.classNames.sort().join(',')}`).join('|');
                  
                  const cardsContent = sortedSubjectIds.map(subId => {
                      const data = groupedBySubject.get(subId)!;
                      const sub = subjects.find(s => s.id === subId);
                      const colorName = subjectColorMap.get(subId) || 'subject-default';
                      const triangleHtml = (cardStyle === 'triangle' || cardStyle === 'full') ? `<div class="card-triangle"></div>` : '';
                      
                      let subjectBadgeStyle = '';
                      if (cardStyle === 'badge') {
                          subjectBadgeStyle = `background-color: var(--${colorName}-text); color: #fff !important; padding: 1px 6px; border-radius: 10px; display: inline-block; width: fit-content; margin-bottom: 2px;`;
                      }

                      return `
                          <div class="teacher-card-img ${colorName}">
                              ${triangleHtml}
                              <p class="period-subject" style="${subjectBadgeStyle}">${sub?.nameEn || ''}</p>
                              <p class="period-class">${data.classNames.join(', ')}</p>
                          </div>
                      `;
                  }).join('');
                  
                  grid[r][c] = { html: `<div class="card-wrapper">${cardsContent}</div>`, key };
              }
          }
      }

      let tableRows = '';
      const visited = Array.from({ length: maxPeriods }, () => Array(activeDays.length).fill(false));

      for (let r = 0; r < maxPeriods; r++) {
          let rowHtml = `<td class="period-label">${r + 1}</td>`;
          for (let c = 0; c < activeDays.length; c++) {
              if (visited[r][c]) continue;
              
              const current = grid[r][c];
              const dayName = activeDays[c];
              const dayLimit = schoolConfig.daysConfig?.[dayName]?.periodCount ?? 8;

              if (r >= dayLimit) {
                  rowHtml += '<td class="slot-cell" style="background: #f1f5f9; border-radius: 8px;"></td>';
                  visited[r][c] = true;
                  continue;
              }

              if (!current) {
                  rowHtml += '<td class="slot-cell"></td>';
                  visited[r][c] = true;
                  continue;
              }

              let rowspan = 1;
              let colspan = 1;

              if (mergePatterns) {
                  while (c + colspan < activeDays.length && grid[r][c + colspan] && grid[r][c + colspan]!.key === current.key && !visited[r][c + colspan]) {
                      colspan++;
                  }
                  
                  let canExtendVertical = true;
                  while (r + rowspan < maxPeriods && canExtendVertical) {
                      for (let j = 0; j < colspan; j++) {
                          const next = grid[r + rowspan][c + j];
                          if (!next || next.key !== current.key || visited[r + rowspan][c + j]) {
                              canExtendVertical = false;
                              break;
                          }
                      }
                      if (canExtendVertical) rowspan++;
                  }
              }

              for (let i = 0; i < rowspan; i++) {
                  for (let j = 0; j < colspan; j++) {
                      visited[r + i][c + j] = true;
                  }
              }

              rowHtml += `<td class="slot-cell" ${rowspan > 1 ? `rowspan="${rowspan}"` : ''} ${colspan > 1 ? `colspan="${colspan}"` : ''}>${current.html}</td>`;
          }
          tableRows += `<tr>${rowHtml}</tr>`;
      }

      const teacherShortName = selectedTeacher.nameEn.split(' ').slice(0, 4).join(' ');
      const currentTimestamp = new Date().toLocaleString('en-GB', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });

      return `
        <div class="timetable-image-container">
          ${styles}
          <div class="img-header">
            <div class="img-school-name">${schoolConfig.schoolNameEn}</div>
            <div class="header-info-row">
                <div class="info-stats-side" style="text-align: left;">
                    <span class="info-label">Serial #</span>
                    <span class="info-value">${selectedTeacher.serialNumber || '-'}</span>
                </div>
                <div class="info-teacher-name">${teacherShortName}</div>
                <div class="info-stats-side" style="text-align: right;">
                    <span class="info-label">Workload</span>
                    <span class="info-value">${workload} ${workload === 1 ? 'Period' : 'Periods'}</span>
                </div>
            </div>
          </div>
          <table class="img-table">
            <thead>
              <tr>
                <th style="width: 50px"></th>
                ${activeDays.map(day => `<th>${t[day.toLowerCase()].substring(0,3)}</th>`).join('')}
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
          <div class="footer-watermark">
            <span>OFFICIAL TEACHER SCHEDULE</span>
            <div style="text-align: right;">
                <div class="footer-branding">Generated by Mr. 🇵🇰</div>
                <div class="footer-timestamp">${currentTimestamp}</div>
            </div>
          </div>
        </div>
      `;
  };

  const handleSendImageAsPicture = async () => {
    window.focus();
    if (!selectedTeacher?.contactNumber) {
        alert("Teacher's contact number not found.");
        return;
    }
    
    setIsGenerating(true);
    
    const size = 1000;
    const width = size;
    const height = size;

    const tempContainer = document.createElement('div');
    Object.assign(tempContainer.style, {
        position: 'fixed',
        left: '-9999px',
        top: '0',
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: '#ffffff',
        zIndex: '-9999',
        overflow: 'hidden'
    });
    tempContainer.innerHTML = generateTimetableImageHtml();
    document.body.appendChild(tempContainer);
    
    try {
        await document.fonts.ready;
        await new Promise(resolve => setTimeout(resolve, 800));

        const targetElement = tempContainer.children[0] as HTMLElement;
        const canvas = await html2canvas(targetElement, { 
            scale: 2.5, 
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
            width: width,
            height: height,
            windowWidth: width,
            windowHeight: height,
            onclone: (clonedDoc: Document) => {
                const container = clonedDoc.querySelector('.timetable-image-container') as HTMLElement;
                if (container) {
                    container.style.webkitTextSizeAdjust = 'none';
                    (container.style as any).textSizeAdjust = 'none';
                }
            }
        });
        
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
        if (!blob) throw new Error("Canvas to Blob failed");

        let shareSuccessful = false;
        const file = new File([blob], `timetable_${selectedTeacher.nameEn.replace(/\s/g, '_')}.png`, { type: 'image/png' });

        try {
            if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
                 await navigator.clipboard.write([new ClipboardItem({[blob.type]: blob})]);
                 setCopyFeedback(t.imageCopied);
            }
        } catch (clipboardError) {
            console.warn("Clipboard write failed", clipboardError);
        }

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({ files: [file], title: `${selectedTeacher.nameEn} Timetable` });
                shareSuccessful = true;
            } catch (shareError: any) {
                if (shareError.name !== 'AbortError') {
                    console.warn("Share failed, falling back to download", shareError);
                }
            }
        }

        if (!shareSuccessful) {
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `timetable_${selectedTeacher.nameEn.replace(/\s/g, '_')}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setCopyFeedback(t.imageDownloaded);
        }

        let phoneNumber = selectedTeacher.contactNumber.replace(/\D/g, '');
        if (phoneNumber.startsWith('0')) phoneNumber = '92' + phoneNumber.substring(1);
        
        setTimeout(() => {
             const url = `https://wa.me/${phoneNumber}`;
             window.open(url, '_blank');
        }, 800);
        
    } catch (error) {
        console.error("Error in WhatsApp send flow", error);
        alert("Failed to generate image.");
    } finally {
        if (tempContainer.parentNode) document.body.removeChild(tempContainer);
        setIsGenerating(false);
        setTimeout(() => setCopyFeedback(''), 4000);
    }
  };

  const handleSendWhatsApp = () => {
    if (selectedTeacher?.contactNumber) {
        let phoneNumber = selectedTeacher.contactNumber.replace(/\D/g, '');
        if (phoneNumber.startsWith('0')) phoneNumber = '92' + phoneNumber.substring(1);
        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(timetableMessage)}`;
        window.open(url, '_blank');
    } else {
        alert("Teacher's contact number not found.");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(timetableMessage).then(() => {
        setCopyFeedback(t.messagesCopied);
        setTimeout(() => setCopyFeedback(''), 2000);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[101]" onClick={onClose}>
      <div className="bg-[var(--bg-secondary)] rounded-xl shadow-2xl w-full max-w-sm mx-4 flex flex-col" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold p-5 border-b border-[var(--border-primary)] text-[var(--text-primary)]">
          {t.sendToTeacher}: {selectedTeacher.nameEn}
        </h3>
        <div className="flex-grow p-5 overflow-y-auto bg-[var(--bg-tertiary)] max-h-[60vh] custom-scrollbar">
          <pre className="text-sm text-[var(--text-primary)] whitespace-pre-wrap font-sans">
            {timetableMessage}
          </pre>
        </div>
        <div className="flex-shrink-0 p-4 border-t border-[var(--border-primary)] space-y-3">
            <div className="flex justify-center gap-3">
                <button onClick={onClose} className="px-4 py-3 text-sm font-semibold bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 flex-grow shadow-md transition-all active:scale-95">{t.close}</button>
                <button onClick={handleCopy} className="px-4 py-3 text-sm font-semibold bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex-grow shadow-md transition-all active:scale-95">{t.copyMessage}</button>
            </div>
            
            <div className="flex items-center justify-between bg-[var(--bg-tertiary)] p-3 rounded-xl border border-[var(--border-secondary)]">
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Merge Patterns</span>
                <button 
                    onClick={() => setMergePatterns(!mergePatterns)}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${mergePatterns ? 'bg-[var(--accent-primary)]' : 'bg-gray-300'}`}
                >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${mergePatterns ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
            </div>

            <button onClick={handleSendImageAsPicture} disabled={isGenerating} className="w-full h-16 flex items-center justify-center gap-3 px-4 py-4 text-sm font-black uppercase tracking-[0.2em] bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-2xl transition-all transform active:scale-95">
                {isGenerating ? (
                    <div className="flex items-center gap-3">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span>{t.generating}</span>
                    </div>
                ) : (
                    <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" /></svg>
                    <span>{t.sendAsImage}</span>
                    </>
                )}
            </button>
            <button onClick={handleSendWhatsApp} disabled={isGenerating} className="w-full h-16 flex items-center justify-center gap-3 px-4 py-4 text-sm font-black uppercase tracking-[0.2em] bg-[#128C7E] text-white rounded-xl hover:bg-[#075e54] disabled:opacity-50 shadow-2xl transition-all transform active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 4.316 1.905 6.03l-.419 1.533 1.519-.4zM15.53 17.53c-.07-.121-.267-.202-.56-.347-.297-.146-1.758-.868-2.031-.967-.272-.099-.47-.146-.669.146-.199.293-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.15-1.255-.463-2.39-1.475-1.134-1.012-1.31-1.36-1.899-2.258-.151-.231-.04-.355.043-.463.083-.107.185-.293.28-.439.095-.146.12-.245.18-.41.06-.164.03-.311-.015-.438-.046-.127-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.177-.008-.375-.01-1.04-.01h-.11c-.307.003-1.348-.043-1.348 1.438 0 1.482.791 2.906 1.439 3.82.648.913 2.51 3.96 6.12 5.368 3.61 1.408 3.61 1.054 4.258 1.034.648-.02 1.758-.715 2.006-1.413.248-.698.248-1.289.173-1.413z" /></svg>
                <span>{t.sendViaWhatsApp}</span>
            </button>
            {copyFeedback && <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-1 text-center animate-pulse">{copyFeedback}</p>}
        </div>
      </div>
    </div>
  );
};

export default TeacherCommunicationModal;
