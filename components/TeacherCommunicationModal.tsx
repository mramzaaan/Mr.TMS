
// ... keep imports ...
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

// ... keep const arrays ...
const subjectColorNames = [
  'subject-cyan', 'subject-fuchsia', 'subject-yellow', 'subject-sky',
  'subject-pink', 'subject-lime', 'subject-red', 'subject-green',
  'subject-blue', 'subject-purple', 'subject-orange', 'subject-teal',
  'subject-emerald', 'subject-rose', 'subject-amber', 'subject-indigo'
];

const cardStyles: { label: string; value: CardStyle }[] = [
    { label: 'Full Color', value: 'full' },
    { label: 'Outline', value: 'outline' },
    { label: 'Text Only', value: 'text' },
    { label: 'Triangle', value: 'triangle' },
    { label: 'Glass', value: 'glass' },
    { label: 'Gradient', value: 'gradient' },
    { label: 'Minimal', value: 'minimal-left' },
    { label: 'Badge', value: 'badge' }
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

const abbreviateSubject = (name: string | undefined) => {
    if (!name) return '';
    const cleanName = name.replace(/[()]/g, '').trim();
    if (cleanName.length <= 13) return cleanName;
    
    const parts = cleanName.split(/[\s-]+/);
    if (parts.length > 1) {
        return parts.map(p => p[0].toUpperCase()).join('');
    }
    return cleanName.substring(0, 4) + '.';
};

export const TeacherCommunicationModal: React.FC<TeacherCommunicationModalProps> = ({
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
  const [mergePatterns, setMergePatterns] = useState(schoolConfig.downloadDesigns.teacher.table.mergeIdenticalPeriods ?? true);
  const [selectedCardStyle, setSelectedCardStyle] = useState<CardStyle>(schoolConfig.downloadDesigns.teacher.table.cardStyle || 'full');

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

  const generateTimetableImageHtml = () => {
      const allColorClasses = [...subjectColorNames, 'subject-default'];
      const cardStyle = selectedCardStyle;
      const triangleCorner = schoolConfig.downloadDesigns.teacher.table.triangleCorner || 'bottom-left';
      const outlineWidth = schoolConfig.downloadDesigns.teacher.table.outlineWidth || 2;
      const badgeTarget = schoolConfig.downloadDesigns.teacher.table.badgeTarget || 'subject';
      
      const size = 1200;
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
          triangleStyles = `bottom: 0; left: 0; border-width: ${triangleSize}px 0 0 ${triangleSize}px; border-color: transparent transparent currentColor transparent;`;
      }
      
      let cardStyleCss = '';
      if (cardStyle === 'full') {
          cardStyleCss = '';
      } else if (cardStyle === 'outline') {
          cardStyleCss = `background-color: #ffffff !important; border: ${outlineWidth}px solid inherit !important; color: inherit !important; margin: 1px;`;
      } else if (cardStyle === 'text' || cardStyle === 'triangle') {
          cardStyleCss = 'background-color: #ffffff !important; border: 1px solid transparent !important; color: inherit !important;';
      } else if (cardStyle === 'glass') {
          cardStyleCss = 'background: rgba(255, 255, 255, 0.5) !important; backdrop-filter: blur(4px); border: 1px solid rgba(255, 255, 255, 0.3) !important; margin: 1px;';
      } else if (cardStyle === 'gradient') {
          cardStyleCss = 'background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(0,0,0,0.1) 100%) !important;';
      } else if (cardStyle === 'minimal-left') {
          cardStyleCss = 'background-color: #f8fafc !important; border-left: 5px solid currentColor !important; border-top: none !important; border-right: none !important; border-bottom: none !important; border-radius: 2px !important;';
      } else if (cardStyle === 'badge') {
          cardStyleCss = 'background-color: transparent !important; border: none !important; box-shadow: none !important;';
      }

      // Header Style Logic
      let headerStyleCss = '';
      if (cardStyle === 'full') {
          headerStyleCss = `background-color: ${themeColors.accent}; color: #ffffff; border-radius: 12px; padding: 10px 30px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);`;
      } else if (cardStyle === 'outline') {
          headerStyleCss = `border: 3px solid ${themeColors.accent}; color: ${themeColors.accent}; border-radius: 12px; padding: 10px 30px; background: #fff;`;
      } else if (cardStyle === 'glass') {
          headerStyleCss = `background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.5); color: ${themeColors.text}; border-radius: 12px; padding: 10px 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);`;
      } else if (cardStyle === 'gradient') {
          headerStyleCss = `background: linear-gradient(135deg, ${themeColors.accent} 0%, ${themeColors.accent}dd 100%); color: #ffffff; border-radius: 12px; padding: 10px 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);`;
      } else if (cardStyle === 'minimal-left') {
          headerStyleCss = `border-left: 10px solid ${themeColors.accent}; background-color: #f1f5f9; color: ${themeColors.text}; padding: 10px 30px; border-radius: 4px;`;
      } else if (cardStyle === 'badge') {
          headerStyleCss = `background-color: ${themeColors.accent}; color: #ffffff; border-radius: 999px; padding: 10px 40px;`;
      } else {
           headerStyleCss = `color: ${themeColors.text}; padding: 10px 0;`;
      }

      const styles = `
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;600;700;900&family=Noto+Nastaliq+Urdu:wght@400;700&display=block');
          * { 
            box-sizing: border-box !important; 
            -webkit-text-size-adjust: none !important; 
            text-size-adjust: none !important; 
            font-family: 'Inter', sans-serif !important; 
            text-rendering: geometricPrecision !important;
            font-variant-ligatures: none !important;
          }
          .timetable-image-container {
            background: #ffffff;
            padding: 30px;
            width: ${width}px;
            height: ${height}px;
            color: #1f2937;
            box-sizing: border-box;
            border: 2px solid ${themeColors.accent};
            display: flex;
            flex-direction: column;
            overflow: hidden;
            position: relative;
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
            flex-shrink: 0;
            margin-bottom: 20px;
            border-bottom: 3px solid ${themeColors.accent};
            padding-bottom: 15px;
          }

          .img-school-name { 
            font-family: 'Anton', sans-serif !important;
            font-size: 60px; 
            color: ${themeColors.accent}; 
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 2px;
            line-height: 1;
            margin-bottom: 15px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
          }
          
          .header-info-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding: 0 10px;
            margin-top: 15px;
          }
          
          .info-teacher-name { 
            font-size: 52px; 
            font-weight: 900; 
            text-transform: uppercase; 
            line-height: 1.1;
            ${headerStyleCss}
          }
          
          .info-stats-side { 
            font-size: 20px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            min-width: 150px;
            padding-bottom: 5px;
          }

          .compact-val { color: #1e293b; font-weight: 900; font-size: 20px; }
          
          .img-table-wrapper {
            flex-grow: 1;
            width: 100%;
            border: 2px solid ${themeColors.accent};
            display: flex;
            flex-direction: column;
          }

          .img-table { 
            width: 100%; 
            height: 100%;
            border-collapse: collapse; 
            table-layout: fixed; 
          }
          
          .img-table th { 
            background-color: transparent;
            color: ${themeColors.accent}; 
            font-weight: 900; 
            text-transform: uppercase;
            padding: 10px 4px;
            font-size: 26px;
            line-height: 1;
            letter-spacing: 0.025em;
            border: 1px solid ${themeColors.accent}; 
            height: 55px;
          }
          .img-table th:first-child { width: 55px; background: #ffffff; }
          
          .period-label { 
            background-color: #f8fafc; 
            color: ${themeColors.accent}; 
            font-weight: 900; 
            font-size: 36px;
            text-align: center;
            line-height: 1;
            border: 1px solid ${themeColors.accent}; 
          }
          
          .slot-cell { 
            padding: 0;
            margin: 0;
            background-color: transparent; 
            border: 1px solid ${themeColors.accent}; 
            vertical-align: top;
            height: 1px;
          }
          
          .card-wrapper {
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100%;
            justify-content: center;
            align-items: center;
          }

          .period-card-img { 
            flex: 1;
            width: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: stretch;
            text-align: center;
            overflow: hidden;
            ${cardStyleCss}
            position: relative;
            padding: 6px;
            border-bottom: 1px solid ${themeColors.accent};
          }
          .period-card-img:last-child { border-bottom: none; }

          .period-content-spread {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            width: 100%;
            height: 100%;
          }

          .period-class { 
            display: block;
            font-weight: 900; 
            font-size: 40px; 
            text-transform: none; 
            line-height: 1.1;
            text-align: left; 
            margin: 0;
            color: inherit;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
            padding-left: 2px;
          }
          .period-subject { 
            display: block;
            font-weight: 700; 
            opacity: 0.9; 
            font-size: 22px; 
            line-height: 1.1;
            white-space: nowrap; 
            overflow: hidden; 
            text-overflow: ellipsis; 
            text-align: right; 
            align-self: flex-end; /* Force right alignment */
            margin-top: auto;
            color: inherit;
            width: 100%;
            padding-right: 2px;
          }

          .card-triangle {
              position: absolute;
              width: 0;
              height: 0;
              border-style: solid;
              ${triangleStyles}
              z-index: 5;
          }

          .logo-overlay {
             display: flex;
             justify-content: center;
             align-items: center;
             width: 100%;
             height: 100%;
             opacity: 0.15;
             pointer-events: none;
          }
          
          .logo-overlay img {
             max-width: 80%;
             max-height: 80%;
             object-fit: contain;
             filter: grayscale(100%);
          }
          
          ${[...subjectColorNames, 'subject-default'].map(name => `
              .${name} { 
                  ${cardStyle === 'full' ? `background-color: ${COLOR_HEX_MAP[name]}; color: ${TEXT_HEX_MAP[name]};` : `background-color: #ffffff; color: ${TEXT_HEX_MAP[name]};`}
              }
              .${name} .period-subject, .${name} .period-class { color: ${TEXT_HEX_MAP[name]} !important; }
              .${name} .card-triangle { 
                  color: ${TEXT_HEX_MAP[name]} !important;
                  opacity: ${cardStyle === 'full' ? 0.3 : 1.0};
              }
              ${cardStyle === 'badge' ? `
                  .${name} .period-subject { ${badgeTarget === 'subject' ? `background-color: ${TEXT_HEX_MAP[name]}; color: #fff !important; padding: 4px 12px; border-radius: 999px; display: block; width: 100%; text-align: right; box-sizing: border-box; margin-bottom: 0; margin-top: auto;` : ''} }
                  .${name} .period-class { ${badgeTarget === 'class' ? `background-color: ${TEXT_HEX_MAP[name]}; color: #fff !important; padding: 4px 12px; border-radius: 999px; display: block; width: 100%; text-align: right; box-sizing: border-box; margin-bottom: 0; margin-top: auto;` : ''} }
              ` : ''}
          `).join('\n')}

          .footer-watermark {
             display: flex;
             justify-content: space-between;
             align-items: center;
             margin-top: 10px; 
             font-size: 12px; 
             color: #000000; 
             font-weight: 700; 
             text-transform: uppercase;
             border-top: 1px solid ${themeColors.accent};
             padding-top: 5px;
          }
        </style>
      `;
      
      const maxPeriods = Math.max(...activeDays.map(day => schoolConfig.daysConfig?.[day]?.periodCount ?? 8));

      const grid: (null | { html: string, key: string })[][] = Array.from({ length: maxPeriods }, () => Array(activeDays.length).fill(null));
      
      for (let r = 0; r < maxPeriods; r++) {
          for (let c = 0; c < activeDays.length; c++) {
              const day = activeDays[c];
              const slot = teacherTimetableData[day]?.[r] || [];
              if (slot.length > 0) {
                  const sortedPeriods = [...slot].sort((a, b) => a.subjectId.localeCompare(b.subjectId));
                  const key = sortedPeriods.map(p => `${p.subjectId}:${p.classId}`).join('|');
                  
                  const cardsContent = sortedPeriods.map(p => {
                      const sub = subjects.find(s => s.id === p.subjectId);
                      const cls = classes.find(c => c.id === p.classId);
                      const colorKey = `${p.classId}-${p.subjectId}`;
                      const colorName = subjectColorMap.get(colorKey) || 'subject-default';
                      const triangleHtml = (cardStyle === 'triangle' || cardStyle === 'full') ? `<div class="card-triangle"></div>` : '';
                      
                      let subjectBadgeStyle = '';
                      let teacherBadgeStyle = '';
                      if (cardStyle === 'badge') {
                          // Badge style matches image: Full width colored bar at bottom, white text
                          const badgeCss = `background-color: ${TEXT_HEX_MAP[colorName] || '#000'}; color: #fff !important; padding: 4px 8px; border-radius: 999px; display: block; width: 100%; text-align: right; box-sizing: border-box; margin-bottom: 0;`;
                          
                          if (badgeTarget === 'teacher') {
                             teacherBadgeStyle = badgeCss;
                             // Class (Teacher in this context) becomes badge
                          } else {
                             subjectBadgeStyle = badgeCss;
                             // Subject becomes badge
                          }
                      }
                      
                      return `
                          <div class="period-card-img ${colorName}">
                              ${triangleHtml}
                              <div class="period-content-spread">
                                <p class="period-class" style="${teacherBadgeStyle}">${cls?.nameEn || ''}</p>
                                <p class="period-subject" style="${subjectBadgeStyle}">${abbreviateSubject(sub?.nameEn)}</p>
                              </div>
                          </div>
                      `;
                  }).join('');
                  
                  grid[r][c] = { html: `<div class="card-wrapper">${cardsContent}</div>`, key };
              }
          }
      }

      // ... rest of generation logic (tableRows, etc.) ...
      let tableRows = '';
      const visited = Array.from({ length: maxPeriods }, () => Array(activeDays.length).fill(false));

      for (let r = 0; r < maxPeriods; r++) {
          let rowHtml = `<td class="period-label">${r + 1}</td>`;
          for (let c = 0; c < activeDays.length; c++) {
              const dayName = activeDays[c];
              const dayLimit = schoolConfig.daysConfig?.[dayName]?.periodCount ?? 8;
              
              if (visited[r][c]) continue;

              if (r === dayLimit && maxPeriods > dayLimit) {
                 const span = maxPeriods - dayLimit;
                 for (let k = 0; k < span; k++) {
                     if (r + k < maxPeriods) visited[r + k][c] = true;
                 }
                 const logoHtml = schoolConfig.schoolLogoBase64 
                    ? `<div class="logo-overlay"><img src="${schoolConfig.schoolLogoBase64}" /></div>` 
                    : '';
                 rowHtml += `<td class="slot-cell" rowspan="${span}" style="background-color: #ffffff;">${logoHtml}</td>`;
                 continue;
              }

              if (r >= dayLimit) {
                  rowHtml += '<td class="slot-cell" style="background: #f8fafc;"></td>';
                  visited[r][c] = true;
                  continue;
              }
              
              const current = grid[r][c];

              if (!current) {
                  rowHtml += '<td class="slot-cell"></td>';
                  visited[r][c] = true;
                  continue;
              }
              
              let rowspan = 1;
              let colspan = 1;

              if (mergePatterns) {
                  while (c + colspan < activeDays.length && grid[r][c + colspan] && grid[r][c + colspan]!.key === current.key && !visited[r][c + colspan]) {
                      const dayLimitNext = schoolConfig.daysConfig?.[activeDays[c + colspan]]?.periodCount ?? 8;
                      if (r >= dayLimitNext) break;
                      colspan++;
                  }
                  
                  let canExtendVertical = true;
                  while (r + rowspan < maxPeriods && canExtendVertical) {
                      for (let j = 0; j < colspan; j++) {
                          const next = grid[r + rowspan][c + j];
                          const dayLimitAt = schoolConfig.daysConfig?.[activeDays[c + j]]?.periodCount ?? 8;
                          if (r + rowspan >= dayLimitAt || !next || next.key !== current.key || visited[r + rowspan][c + j]) {
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
          tableRows += `<tr style="height: ${100/maxPeriods}%;">${rowHtml}</tr>`;
      }

      const currentTimestamp = new Date().toLocaleString('en-GB', { 
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true 
      });

      return `
        <div class="timetable-image-container">
          ${styles}
          <div class="img-header">
            <div class="img-school-name">${schoolConfig.schoolNameEn}</div>
            <div class="header-info-row">
                <div class="info-stats-side" style="text-align: left;">
                    SR: <span class="compact-val">${selectedTeacher.serialNumber || '-'}</span>
                </div>
                <div class="info-teacher-name">${selectedTeacher.nameEn}</div>
                <div class="info-stats-side" style="text-align: right;">
                    Load: <span class="compact-val">${workload}</span>
                </div>
            </div>
          </div>
          <div class="img-table-wrapper">
            <table class="img-table">
                <thead>
                <tr>
                    <th style="width: 50px"></th>
                    ${activeDays.map(day => `<th>${t[day.toLowerCase()].substring(0,3)}</th>`).join('')}
                </tr>
                </thead>
                <tbody>${tableRows}</tbody>
            </table>
          </div>
          <div class="footer-watermark">
            <span>OFFICIAL TEACHER SCHEDULE</span>
            <span style="font-weight: 900; color: ${themeColors.accent}; font-size: 14px;">Generated by Mr. 🇵🇰</span>
            <span>${currentTimestamp}</span>
          </div>
        </div>
      `;
  };
// ... rest of the component
  const generateAndGetBlob = async (): Promise<Blob | null> => {
    // ... same as before
    const size = 1200;
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
            scale: 2,
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
        
        return await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
    } catch (error) {
        console.error("Canvas generation failed", error);
        return null;
    } finally {
        if (tempContainer.parentNode) document.body.removeChild(tempContainer);
    }
  };

  // ... (handleSendImageAsPicture, handleSendWhatsApp, render) ...
  const handleSendImageAsPicture = async () => {
    window.focus(); 
    setIsGenerating(true);

    const blob = await generateAndGetBlob();
    if (!blob) {
        alert("Failed to generate image.");
        setIsGenerating(false);
        return;
    }

    const file = new File([blob], `timetable_${selectedTeacher.nameEn.replace(/\s/g, '_')}.png`, { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                files: [file],
                title: 'Timetable',
                text: `Timetable for ${selectedTeacher.nameEn}`
            });
            setIsGenerating(false);
            return;
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log("Share cancelled.");
                setIsGenerating(false);
                return;
            }
            console.log("Share failed, falling back to download.");
        }
    }

    // Fallback: Download
    const dataUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(dataUrl);
    
    setIsGenerating(false);
  };

  const handleSendWhatsApp = async () => {
    if (!selectedTeacher?.contactNumber) {
        alert("Teacher's contact number not found.");
        return;
    }
    
    setIsGenerating(true);
    const blob = await generateAndGetBlob();

    if (blob) {
        let copied = false;
        try {
            if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
                 await navigator.clipboard.write([new ClipboardItem({[blob.type]: blob})]);
                 copied = true;
            }
        } catch (clipboardError) {
            console.warn("Clipboard write failed", clipboardError);
        }

        if (!copied) {
             const dataUrl = URL.createObjectURL(blob);
             const link = document.createElement('a');
             link.href = dataUrl;
             link.download = `timetable_${selectedTeacher.nameEn.replace(/\s/g, '_')}.png`;
             document.body.appendChild(link);
             link.click();
             document.body.removeChild(link);
             URL.revokeObjectURL(dataUrl);
             alert("Could not copy to clipboard. Image downloaded. Please attach manually in WhatsApp.");
        }

        let phoneNumber = selectedTeacher.contactNumber.replace(/\D/g, '');
        if (phoneNumber.startsWith('0')) phoneNumber = '92' + phoneNumber.substring(1);
        const url = `https://wa.me/${phoneNumber}`;
        
        setTimeout(() => {
             window.open(url, '_blank');
        }, 500);
    } else {
        alert("Failed to generate image.");
    }

    setIsGenerating(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[101]" onClick={onClose}>
      <div className="bg-[#1a2333] rounded-xl shadow-2xl w-full max-w-sm mx-4 flex flex-col border border-white/10" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#252f44]">
            <h3 className="text-xl font-black text-white uppercase tracking-tight">
                Send to Teacher
            </h3>
        </div>
        
        <div className="flex-shrink-0 p-4 space-y-3 bg-[#1a2333]">
            
            <div className="flex flex-col gap-2 bg-[#252f44] p-3 rounded-xl border border-white/10">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Card Design</label>
                <select 
                    value={selectedCardStyle} 
                    onChange={(e) => setSelectedCardStyle(e.target.value as CardStyle)}
                    className="w-full bg-[#1a2333] text-white text-xs font-bold rounded-lg border border-white/10 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                    {cardStyles.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
            </div>

            <div className="flex items-center justify-between bg-[#252f44] p-3 rounded-xl border border-white/10">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Merge Patterns</span>
                <button 
                    onClick={() => setMergePatterns(!mergePatterns)}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${mergePatterns ? 'bg-[var(--accent-primary)]' : 'bg-gray-600'}`}
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
                    <span>SEND AS PICTURE</span>
                    </>
                )}
            </button>
            <button onClick={handleSendWhatsApp} disabled={isGenerating} className="w-full h-16 flex items-center justify-center gap-3 px-4 py-4 text-sm font-black uppercase tracking-[0.2em] bg-[#128C7E] text-white rounded-xl hover:bg-[#075e54] disabled:opacity-50 shadow-2xl transition-all transform active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 4.316 1.905 6.03l-.419 1.533 1.519-.4zM15.53 17.53c-.07-.121-.267-.202-.56-.347-.297-.146-1.758-.868-2.031-.967-.272-.099-.47-.146-.669.146-.199.293-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.15-1.255-.463-2.39-1.475-1.134-1.012-1.31-1.36-1.899-2.258-.151-.231-.04-.355.043-.463.083-.107.185-.293.28-.439.095-.146.12-.245.18-.41.06-.164.03-.311-.015-.438-.046-.127-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.177-.008-.375-.01-1.04-.01h-.11c-.307.003-1.348-.043-1.348 1.438 0 1.482.791 2.906 1.439 3.82.648.913 2.51 3.96 6.12 5.368 3.61 1.408 3.61 1.054 4.258 1.034.648-.02 1.758-.715 2.006-1.413.248-.698.248-1.289.173-1.413z" /></svg>
                <span>SEND VIA WHATSAPP</span>
            </button>
            <button onClick={onClose} className="w-full py-3 text-sm font-black uppercase tracking-widest bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 shadow-lg transition-all active:scale-95">{t.close}</button>
        </div>
      </div>
    </div>
  );
};
