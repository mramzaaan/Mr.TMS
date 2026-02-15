
import type { SchoolClass, Adjustment, TimetableGridData, DownloadLanguage, DownloadDesignConfig, Teacher, SchoolConfig, Subject, PeriodTime, Break, Period, LeaveDetails, AttendanceData, TriangleCorner } from '../types';
import { translations } from '../i18n';
import { allDays } from '../types';

export interface WorkloadStats {
  dailyCounts: { [key: string]: number };
  weeklyPeriods: number;
  jointPeriodsCount: number;
  substitutionsTaken: number;
  leavesTaken: number;
  totalWorkload: number;
  daysInRange?: number;
  scheduledInRange?: number;
  rangeLeaves?: number;
  rangeSubs?: number;
  netLoad?: number;
  possiblePeriodsInRange?: number;
}

const URDU_FONT_STACK = "'Gulzar', 'Noto Nastaliq Urdu', serif";
const GOOGLE_FONTS_URL = "https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Anton&family=Antonio:wght@400;700&family=Aref+Ruqaa:wght@400;700&family=Bebas+Neue&family=Bodoni+Moda:opsz,wght@6..96,400..900&family=Bungee+Spice&family=Fjalla+One&family=Gulzar&family=Instrument+Serif:ital@0;1&family=Lato:wght@400;700&family=Merriweather:wght@400;700;900&family=Monoton&family=Montserrat:wght@400;500;700&family=Noto+Nastaliq+Urdu:wght@400;700&family=Open+Sans:wght@400;600;700&family=Orbitron:wght@400;700&family=Oswald:wght@400;700&family=Playfair+Display:wght@400;700&family=Playwrite+CU:wght@100..400&family=Roboto:wght@400;500;700&family=Rubik+Mono+One&display=swap";

const teacherColorNames = [
  'subject-sky', 'subject-green', 'subject-yellow', 'subject-red',
  'subject-purple', 'subject-pink', 'subject-indigo', 'subject-teal',
  'subject-orange', 'subject-lime', 'subject-cyan', 'subject-emerald',
  'subject-fuchsia', 'subject-rose', 'subject-amber', 'subject-blue', 'subject-indigo'
];

const renderText = (lang: DownloadLanguage, en: string, ur: string) => {
    const urduStyle = `font-family: ${URDU_FONT_STACK} !important; direction: rtl; unicode-bidi: embed; line-height: 1.8; display: inline-block; padding-top: 2px; font-weight: normal;`;
    const urduSpan = `<span class="font-urdu" style="${urduStyle}">${ur}</span>`;
    
    if (lang === 'en') return en;
    if (lang === 'ur') return urduSpan;
    return `<div style="display:flex; flex-direction:column; justify-content:center; align-items:center; line-height:1.1;"><span>${en}</span><span style="${urduStyle} font-size: 0.85em;">${ur}</span></div>`;
};

const downloadCsv = (content: string, filename: string) => {
    const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const toCsvRow = (cells: any[]) => cells.map(c => {
    const str = String(c === undefined || c === null ? '' : c);
    if (str.search(/("|,|\n)/g) >= 0) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}).join(',');

const isDateInVacation = (dateStr: string, session?: any) => {
    if (!session || !session.vacations) return false;
    const d = new Date(dateStr);
    return session.vacations.some((v: any) => {
        const start = new Date(v.startDate);
        const end = new Date(v.endDate);
        return d >= start && d <= end;
    });
};

const calculateRangeWorkload = (
    teacherId: string, 
    startDate: string, 
    endDate: string, 
    classes: SchoolClass[], 
    adjustments: Record<string, Adjustment[]>,
    leaveDetails: Record<string, Record<string, LeaveDetails>> = {},
    schoolConfig: SchoolConfig,
    sessionData?: any // Pass full session data to check vacations
): WorkloadStats => {
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dayMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    let scheduledInRange = 0;
    let rangeLeaves = 0; 
    let rangeSubs = 0;   
    let daysInRange = 0;
    let possiblePeriodsInRange = 0;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        
        // Skip vacations
        if (isDateInVacation(dateStr, sessionData)) continue;

        const dayIndex = d.getDay();
        const dayName = dayMap[dayIndex] as keyof TimetableGridData;
        
        // @ts-ignore
        const dayConfig = schoolConfig.daysConfig[dayName];
        if (!dayConfig || !dayConfig.active) continue;
        
        daysInRange++;
        possiblePeriodsInRange += dayConfig.periodCount;
        
        const teacherLeave = leaveDetails[dateStr]?.[teacherId];
        const isOnDuty = teacherLeave?.reason === 'On Duty';
        
        const dayAdjustments = adjustments[dateStr] || [];

        for (let pIndex = 0; pIndex < 12; pIndex++) {
            const periodsInSlot: Period[] = [];
            classes.forEach(c => {
                c.timetable[dayName]?.[pIndex]?.forEach(p => {
                    if (p.teacherId === teacherId) periodsInSlot.push(p);
                });
            });

            if (periodsInSlot.length > 0) {
                 const processedJointIds = new Set<string>();
                 periodsInSlot.forEach(p => {
                     let isLoadUnit = false;
                     if (p.jointPeriodId) {
                         if (!processedJointIds.has(p.jointPeriodId)) {
                             isLoadUnit = true;
                             processedJointIds.add(p.jointPeriodId);
                         }
                     } else {
                         isLoadUnit = true;
                     }

                     if (isLoadUnit) {
                         scheduledInRange++;
                         let missed = false;

                         if (!isOnDuty) {
                             if (teacherLeave) {
                                 if (teacherLeave.leaveType === 'full') {
                                     missed = true;
                                 } else if (teacherLeave.leaveType === 'half') {
                                     if (teacherLeave.periods && teacherLeave.periods.length > 0) {
                                         missed = teacherLeave.periods.includes(pIndex + 1);
                                     } else if ((pIndex + 1) >= teacherLeave.startPeriod) {
                                         missed = true;
                                     }
                                 }
                             }

                             if (!missed) {
                                 const subOut = dayAdjustments.some(adj => 
                                     adj.originalTeacherId === teacherId &&
                                     adj.periodIndex === pIndex &&
                                     adj.classId === p.classId
                                 );
                                 if (subOut) missed = true;
                             }
                         }

                         if (missed) {
                             rangeLeaves++;
                         }
                     }
                 });
            }

            const subsIn = dayAdjustments.filter(adj => adj.periodIndex === pIndex && adj.substituteTeacherId === teacherId);
            if (subsIn.length > 0) {
                rangeSubs++; 
            }
        }
    }

    const netLoad = (scheduledInRange - rangeLeaves) + rangeSubs;

    return {
        dailyCounts: {},
        weeklyPeriods: 0,
        jointPeriodsCount: 0,
        substitutionsTaken: 0,
        leavesTaken: 0,
        totalWorkload: 0,
        daysInRange,
        scheduledInRange,
        rangeLeaves,
        rangeSubs,
        netLoad,
        possiblePeriodsInRange
    };
};

export const calculateWorkloadStats = (
    teacherId: string, 
    classes: SchoolClass[], 
    adjustments: Record<string, Adjustment[]> = {},
    leaveDetails: Record<string, Record<string, LeaveDetails>> = {},
    startDate?: string,
    endDate?: string,
    schoolConfig?: SchoolConfig,
    sessionData?: any
): WorkloadStats => {
    const dailyCounts: { [key: string]: number } = {};
    allDays.forEach(day => dailyCounts[day.toLowerCase()] = 0);
    
    let weeklyPeriods = 0;
    let jointPeriodsCount = 0;

    allDays.forEach(day => {
        const dayKey = day as keyof TimetableGridData;
        
        if (schoolConfig && schoolConfig.daysConfig && !schoolConfig.daysConfig[dayKey]?.active) {
            return; 
        }

        for (let i = 0; i < 12; i++) {
            const periodsInSlot: Period[] = [];
            
            classes.forEach(c => {
                const slot = c.timetable[dayKey]?.[i];
                if (slot) {
                    slot.forEach(p => {
                        if (p.teacherId === teacherId) {
                            periodsInSlot.push(p);
                        }
                    });
                }
            });

            if (periodsInSlot.length > 0) {
                const processedJointIds = new Set<string>();
                
                periodsInSlot.forEach(p => {
                    if (p.jointPeriodId) {
                        if (!processedJointIds.has(p.jointPeriodId)) {
                            dailyCounts[day.toLowerCase()]++;
                            weeklyPeriods++;
                            jointPeriodsCount++; 
                            processedJointIds.add(p.jointPeriodId);
                        }
                    } else {
                        dailyCounts[day.toLowerCase()]++;
                        weeklyPeriods++;
                    }
                });
            }
        }
    });

    const datesToCheck: string[] = [];
    if (startDate && endDate) {
        let curr = new Date(startDate);
        const end = new Date(endDate);
        while (curr <= end) {
            const dStr = curr.toISOString().split('T')[0];
            if (!isDateInVacation(dStr, sessionData)) {
                datesToCheck.push(dStr);
            }
            curr.setDate(curr.getDate() + 1);
        }
    } else {
        const keys = new Set([...Object.keys(adjustments), ...Object.keys(leaveDetails)]);
        Array.from(keys).forEach(dStr => {
             if (!isDateInVacation(dStr, sessionData)) {
                datesToCheck.push(dStr);
            }
        });
    }

    let substitutionsTaken = 0;
    let leavesTaken = 0;

    datesToCheck.forEach(date => {
        const d = new Date(date);
        const dayMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayIndex = d.getDay();
        const dayName = dayMap[dayIndex] as keyof TimetableGridData;
        
        if (!allDays.includes(dayName)) return;
        
        if (schoolConfig && schoolConfig.daysConfig && !schoolConfig.daysConfig[dayName]?.active) {
            return;
        }

        const dayAdjustments = adjustments[date] || [];
        const teacherLeave = leaveDetails[date]?.[teacherId];
        const isOnDuty = teacherLeave?.reason === 'On Duty';

        const subSlots = new Set<number>();
        dayAdjustments.forEach(adj => {
            if (adj.substituteTeacherId === teacherId) {
                subSlots.add(adj.periodIndex);
            }
        });
        substitutionsTaken += subSlots.size;

        if (isOnDuty) return;

        for (let i = 0; i < 12; i++) {
             const periodsInSlot: Period[] = [];
             classes.forEach(c => {
                 c.timetable[dayName]?.[i]?.forEach(p => {
                     if (p.teacherId === teacherId) periodsInSlot.push(p);
                 });
             });

             if (periodsInSlot.length === 0) continue;

             const processedJointIds = new Set<string>();
             
             periodsInSlot.forEach(p => {
                 let isLoadUnit = false;
                 if (p.jointPeriodId) {
                     if (!processedJointIds.has(p.jointPeriodId)) {
                         isLoadUnit = true;
                         processedJointIds.add(p.jointPeriodId);
                     }
                 } else {
                     isLoadUnit = true;
                 }

                 if (isLoadUnit) {
                     let isMissed = false;
                     
                     if (teacherLeave) {
                         if (teacherLeave.leaveType === 'full') {
                             isMissed = true;
                         } else if (teacherLeave.leaveType === 'half') {
                             if (teacherLeave.periods && teacherLeave.periods.length > 0) {
                                 isMissed = teacherLeave.periods.includes(i + 1);
                             } else if ((i + 1) >= teacherLeave.startPeriod) {
                                 isMissed = true;
                             }
                         }
                     }

                     if (!isMissed) {
                         const subOut = dayAdjustments.some(adj => 
                             adj.originalTeacherId === teacherId &&
                             adj.periodIndex === i &&
                             adj.classId === p.classId
                         );
                         if (subOut) isMissed = true;
                     }

                     if (isMissed) {
                         leavesTaken++;
                     }
                 }
             });
        }
    });

    const totalWorkload = weeklyPeriods + substitutionsTaken - leavesTaken;

    return {
        dailyCounts,
        weeklyPeriods,
        jointPeriodsCount,
        substitutionsTaken,
        leavesTaken,
        totalWorkload
    };
};

export const getPrintStyles = (design: DownloadDesignConfig) => {
    const page = design?.page || { size: 'a4', orientation: 'portrait', margins: { top: 10, right: 10, bottom: 10, left: 10 }, watermarkOpacity: 0.1 };
    const table = design?.table || { cardStyle: 'full', triangleCorner: 'bottom-left', fontFamily: 'sans-serif', fontSize: 14, cellPadding: 8, borderColor: '#000000', borderWidth: 1, gridStyle: 'solid', headerBgColor: '#f3f4f6', headerColor: '#000000', bodyBgColor: '#ffffff', bodyColor: '#000000', altRowColor: '#f9fafb', periodColumnWidth: 50, periodColumnBgColor: '#f3f4f6', periodColumnColor: '#000000', outlineWidth: 2 };
    
    // Default alignment
    const vAlign = (table.verticalAlign as string) === 'center' ? 'middle' : (table.verticalAlign || 'top'); 
    
    return `
    .print-container {
      background-color: white;
      color: inherit;
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      font-family: '${table.fontFamily}', sans-serif; 
    }

    .print-container .font-urdu, 
    .print-container .font-urdu * {
        font-family: ${URDU_FONT_STACK} !important;
        line-height: 1.8;
        padding-top: 2px;
        direction: rtl;
        font-synthesis: none;
        font-weight: normal;
        text-rendering: optimizeLegibility;
    }
    
    .page { 
        padding: ${page.margins.top}mm ${page.margins.right}mm ${page.margins.bottom}mm ${page.margins.left}mm; 
        display: flex; 
        flex-direction: column; 
        position: relative; 
        box-sizing: border-box; 
        background: white; 
        overflow: hidden; 
    }
    
    .content-wrapper { position: relative; z-index: 10; display: flex; flex-direction: column; flex-grow: 1; height: 100%; }
    .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 60%; height: 60%; object-fit: contain; opacity: ${page.watermarkOpacity}; z-index: 0; pointer-events: none; }
    
    .header-container { 
        display: flex; 
        align-items: center; 
        gap: 15px; 
        margin-bottom: 10px; 
        padding-bottom: 8px;
        background-color: transparent;
        flex-shrink: 0;
    }
    .header-logo { object-fit: contain; }
    .header-text { flex-grow: 1; }
    .header-school-name { margin: 0; line-height: 1.2; text-transform: uppercase; white-space: nowrap; }
    .header-title { margin-top: 4px; letter-spacing: 0.5px; }
    .header-details { margin-top: 4px; display: flex; justify-content: space-between; }

    .main-content { flex-grow: 1; display: flex; flex-direction: column; font-size: ${table.fontSize}px; overflow: hidden; }

    .footer { 
        margin-top: auto; 
        padding-top: 5px; 
        border-top: 1px solid #000; 
        display: flex; 
        align-items: flex-end; 
        flex-shrink: 0;
    }
    
    table { width: 100%; border-collapse: collapse; margin-bottom: 0; border: ${table.borderWidth || 1}px ${table.gridStyle || 'solid'} ${table.borderColor}; }
    th, td { 
        border: ${table.borderWidth || 1}px ${table.gridStyle || 'solid'} ${table.borderColor}; 
        padding: ${table.cellPadding}px; 
        vertical-align: ${vAlign} !important; 
        text-align: center; 
        font-size: ${table.fontSize}px;
        color: ${table.bodyColor || '#000000'};
        font-family: '${table.fontFamily}', sans-serif;
        line-height: 1.1; 
        box-sizing: border-box;
        overflow: visible !important;
        position: relative;
        z-index: 1;
        background-clip: padding-box;
        letter-spacing: normal;
    }
    th { 
        background-color: ${table.headerBgColor}; 
        color: ${table.headerColor};
        font-weight: bold; 
        font-size: ${table.headerFontSize || table.fontSize}px;
    }
    tr:nth-child(even) { background-color: ${table.altRowColor}; }
    .period-col {
        width: ${table.periodColumnWidth}px;
        background-color: ${table.periodColumnBgColor};
        color: ${table.periodColumnColor};
        font-weight: bold;
        font-size: 1.2em;
    }
    `;
};

const generateReportHTML = (
    schoolConfig: SchoolConfig,
    design: DownloadDesignConfig,
    title: string,
    lang: DownloadLanguage,
    content: string,
    details?: string,
    pageNumber?: number,
    totalPages?: number
): string => {
    const styles = getPrintStyles(design);
    const logoHtml = design.header.showLogo && schoolConfig.schoolLogoBase64
        ? `<img src="${schoolConfig.schoolLogoBase64}" class="header-logo" style="height: ${design.header.logoSize}px" />`
        : '';
    
    const showPageNum = design.footer.includePageNumber && pageNumber !== undefined && totalPages !== undefined;
    const pageNumHtml = showPageNum ? `<span>Page ${pageNumber} of ${totalPages}</span>` : '';

    const page = design.page;
    const width = page.orientation === 'portrait' ? (page.size === 'legal' ? '816px' : '794px') : (page.size === 'legal' ? '1344px' : '1123px');
    const height = page.orientation === 'portrait' ? (page.size === 'legal' ? '1344px' : '1123px') : (page.size === 'legal' ? '816px' : '794px');

    const fontLink = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="${GOOGLE_FONTS_URL}" rel="stylesheet">`;

    return `
        <div class="print-container" style="width: ${width}; height: ${height};">
            ${fontLink}
            <style>${styles}</style>
            <div class="page">
                ${schoolConfig.schoolLogoBase64 && design.page.watermarkOpacity > 0 ? `<img src="${schoolConfig.schoolLogoBase64}" class="watermark" />` : ''}
                <div class="content-wrapper">
                    <header class="header-container" style="justify-content: ${design.header.logoPosition === 'center' ? 'center' : design.header.logoPosition === 'right' ? 'flex-end' : 'flex-start'}; border-bottom: ${design.header.divider ? '3px double #000' : 'none'}; background-color: ${design.header.bgColor};">
                        ${design.header.logoPosition === 'left' ? logoHtml : ''}
                        <div class="header-text" style="text-align: ${design.header.schoolName.align}">
                            <h1 class="header-school-name" style="font-family: '${design.header.schoolName.fontFamily}'; font-size: ${design.header.schoolName.fontSize}px; font-weight: ${design.header.schoolName.fontWeight}; color: ${design.header.schoolName.color}">
                                ${lang === 'ur' ? schoolConfig.schoolNameUr : schoolConfig.schoolNameEn}
                            </h1>
                            ${design.header.showTitle ? `<h2 class="header-title" style="font-family: '${design.header.title.fontFamily}'; font-size: ${design.header.title.fontSize}px; font-weight: ${design.header.title.fontWeight}; color: ${design.header.title.color}; text-align: ${design.header.title.align}">${title}</h2>` : ''}
                            ${details ? `<div class="header-details" style="font-family: '${design.header.details.fontFamily}'; font-size: ${design.header.details.fontSize}px; font-weight: ${design.header.details.fontWeight}; color: ${design.header.details.color}; text-align: ${design.header.details.align}">${details}</div>` : ''}
                        </div>
                        ${design.header.logoPosition === 'right' ? logoHtml : ''}
                    </header>
                    <main class="main-content">
                        ${content}
                    </main>
                    ${design.footer.show ? `
                    <footer class="footer" style="justify-content: ${design.footer.align === 'center' ? 'center' : design.footer.align === 'right' ? 'flex-end' : 'flex-start'}; font-family: '${design.footer.fontFamily}', sans-serif; font-size: ${design.footer.fontSize}px; color: ${design.footer.color};">
                        <div style="flex: 1; text-align: left;">${design.footer.includeTimestamp ? new Date().toLocaleString() : ''}</div>
                        <div style="flex: 2; text-align: center;">${design.footer.text}</div>
                        <div style="flex: 1; text-align: right;">${pageNumHtml}</div>
                    </footer>` : ''}
                </div>
            </div>
        </div>
    `;
};

// ... (Rest of existing report functions unchanged, just ensuring GOOGLE_FONTS_URL is correct)
export const generateBasicInformationHtml = (t: any, lang: DownloadLanguage, design: DownloadDesignConfig, classes: SchoolClass[], teachers: Teacher[], schoolConfig: SchoolConfig) => {
    let content = `
        <div style="display: flex; gap: 20px;">
            <div style="flex: 1;">
                <h3 style="border-bottom: 2px solid #000; margin-bottom: 10px;">${renderText(lang, 'Classes', 'کلاسز')}</h3>
                <table>
                    <thead><tr><th>#</th><th>${renderText(lang, 'Class', 'کلاس')}</th><th>${renderText(lang, 'In-Charge', 'انچارج')}</th><th>${renderText(lang, 'Room', 'کمرہ')}</th><th>${renderText(lang, 'Students', 'طلباء')}</th></tr></thead>
                    <tbody>
                        ${classes.map((c, i) => `<tr><td>${i+1}</td><td>${renderText(lang, c.nameEn, c.nameUr)}</td><td>${(() => { const t = teachers.find(tr => tr.id === c.inCharge); return t ? renderText(lang, t.nameEn, t.nameUr) : '-'; })()}</td><td>${c.roomNumber || '-'}</td><td>${c.studentCount}</td></tr>`).join('')}
                    </tbody>
                </table>
            </div>
            <div style="flex: 1;">
                <h3 style="border-bottom: 2px solid #000; margin-bottom: 10px;">${renderText(lang, 'Teachers', 'اساتذہ')}</h3>
                <table>
                    <thead><tr><th>#</th><th>${renderText(lang, 'Name', 'نام')}</th><th>${renderText(lang, 'Contact', 'رابطہ')}</th></tr></thead>
                    <tbody>
                        ${teachers.map((t, i) => `<tr><td>${i+1}</td><td>${renderText(lang, t.nameEn, t.nameUr)}</td><td>${t.contactNumber}</td></tr>`).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    return generateReportHTML(schoolConfig, design, renderText(lang, 'Basic Information', 'بنیادی معلومات'), lang, content);
};

export const generateBasicInformationExcel = (t: any, lang: DownloadLanguage, design: DownloadDesignConfig, classes: SchoolClass[], teachers: Teacher[]) => {
    let csv = `Type,Name,Detail 1,Detail 2\n`;
    classes.forEach(c => csv += toCsvRow(['Class', c.nameEn, c.roomNumber, c.studentCount]) + '\n');
    teachers.forEach(t => csv += toCsvRow(['Teacher', t.nameEn, t.contactNumber, '']) + '\n');
    downloadCsv(csv, 'Basic_Info.csv');
};

export const generateSchoolTimingsHtml = (t: any, lang: DownloadLanguage, design: DownloadDesignConfig, schoolConfig: SchoolConfig) => {
    const timings = schoolConfig.periodTimings;
    const breaks = schoolConfig.breaks;
    const renderTable = (type: 'default' | 'friday', title: string) => {
        const periods = timings?.[type] || [];
        const dayBreaks = breaks?.[type] || [];
        let rows = '';
        const max = Math.max(periods.length, 8);
        for (let i = 0; i < max; i++) {
            const period = periods[i];
            const brk = dayBreaks.find(b => b.beforePeriod === i + 1);
            if (brk) rows += `<tr style="background-color: #f0f0f0; font-weight: bold;"><td colspan="3">${brk.name} (${brk.startTime} - ${brk.endTime})</td></tr>`;
            if (period) rows += `<tr><td>${i + 1}</td><td>${period.start} - ${period.end}</td><td>${period.name || 'Period'}</td></tr>`;
        }
        return `<div style="flex: 1;"><h3 style="text-align: center; border-bottom: 2px solid #000;">${title}</h3><table><thead><tr><th>#</th><th>Time</th><th>Type</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    };
    const content = `<div style="display: flex; gap: 20px;">${renderTable('default', 'Mon-Thu & Sat')}${renderTable('friday', 'Friday')}</div>`;
    return generateReportHTML(schoolConfig, design, renderText(lang, 'School Timings', 'سکول کے اوقات'), lang, content);
};

export const generateClassTimetableHtml = (c: SchoolClass, lang: DownloadLanguage, design: DownloadDesignConfig, teachers: Teacher[], subjects: Subject[], schoolConfig: SchoolConfig) => {
    let content = `<h3>${renderText(lang, c.nameEn, c.nameUr)}</h3><table><thead><tr><th>Day</th>${Array.from({length:8},(_,i)=>`<th>${i+1}</th>`).join('')}</tr></thead><tbody>`;
    allDays.forEach(day => {
        if(schoolConfig.daysConfig[day].active) {
            content += `<tr><td>${day.substring(0,3)}</td>`;
            for(let i=0; i<8; i++) {
                const periods = c.timetable[day]?.[i] || [];
                const cell = periods.map(p => {
                    const s = subjects.find(sub => sub.id === p.subjectId);
                    const t = teachers.find(te => te.id === p.teacherId);
                    return `<div><b>${s ? (lang==='ur'?s.nameUr:s.nameEn) : '-'}</b><br/><small>${t ? (lang==='ur'?t.nameUr:t.nameEn) : ''}</small></div>`;
                }).join('<hr/>');
                content += `<td>${cell}</td>`;
            }
            content += `</tr>`;
        }
    });
    content += `</tbody></table>`;
    return generateReportHTML(schoolConfig, design, renderText(lang, 'Class Timetable', 'کلاس ٹائم ٹیبل'), lang, content, `${c.roomNumber ? `Rm: ${c.roomNumber}` : ''}`);
};

export const generateTeacherTimetableHtml = (teacher: Teacher, lang: DownloadLanguage, design: DownloadDesignConfig, classes: SchoolClass[], subjects: Subject[], schoolConfig: SchoolConfig, adjustments: any, allTeachers: Teacher[]) => {
    let content = `<h3>${renderText(lang, teacher.nameEn, teacher.nameUr)}</h3><table><thead><tr><th>Day</th>${Array.from({length:8},(_,i)=>`<th>${i+1}</th>`).join('')}</tr></thead><tbody>`;
    allDays.forEach(day => {
        if(schoolConfig.daysConfig[day].active) {
            content += `<tr><td>${day.substring(0,3)}</td>`;
            for(let i=0; i<8; i++) {
                let found: any[] = [];
                classes.forEach(c => { const slot = c.timetable[day]?.[i]; if(slot) slot.forEach(p => { if(p.teacherId === teacher.id) found.push({p, c}); }); });
                const cell = found.map(({p, c}) => {
                    const s = subjects.find(sub => sub.id === p.subjectId);
                    return `<div><b>${c ? (lang==='ur'?c.nameUr:c.nameEn) : ''}</b><br/><small>${s ? (lang==='ur'?s.nameUr:s.nameEn) : ''}</small></div>`;
                }).join('<hr/>');
                content += `<td>${cell}</td>`;
            }
            content += `</tr>`;
        }
    });
    content += `</tbody></table>`;
    return generateReportHTML(schoolConfig, design, renderText(lang, 'Teacher Timetable', 'اساتذہ ٹائم ٹیبل'), lang, content);
};

export const generateWorkloadSummaryHtml = (t: any, lang: DownloadLanguage, design: DownloadDesignConfig, teachers: Teacher[], schoolConfig: SchoolConfig, classes: SchoolClass[], adjustments: any, leaveDetails: any, startDate: string, endDate: string, mode: any) => {
    const rows = teachers.map(teacher => {
        const stats = calculateWorkloadStats(teacher.id, classes, adjustments, leaveDetails, startDate, endDate, schoolConfig);
        return `<tr><td>${renderText(lang, teacher.nameEn, teacher.nameUr)}</td><td>${stats.weeklyPeriods}</td><td>${stats.substitutionsTaken}</td><td>${stats.leavesTaken}</td><td><b>${stats.totalWorkload}</b></td></tr>`;
    }).join('');
    const content = `<table><thead><tr><th>Teacher</th><th>Regular</th><th>Subs</th><th>Leaves</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table>`;
    return generateReportHTML(schoolConfig, design, renderText(lang, 'Workload Summary', 'ورک لوڈ کا خلاصہ'), lang, content);
};

export const generateWorkloadSummaryExcel = (t: any, lang: DownloadLanguage, design: DownloadDesignConfig, teachers: Teacher[], schoolConfig: SchoolConfig, classes: SchoolClass[], adjustments: any, leaveDetails: any, startDate: string, endDate: string, mode: any) => {
    let csv = `Teacher,Regular,Subs,Leaves,Total\n`;
    teachers.forEach(teacher => {
        const stats = calculateWorkloadStats(teacher.id, classes, adjustments, leaveDetails, startDate, endDate, schoolConfig);
        csv += toCsvRow([teacher.nameEn, stats.weeklyPeriods, stats.substitutionsTaken, stats.leavesTaken, stats.totalWorkload]) + '\n';
    });
    downloadCsv(csv, 'Workload_Summary.csv');
};

export const generateByPeriodHtml = (t: any, lang: DownloadLanguage, design: DownloadDesignConfig, schoolConfig: SchoolConfig, classes: SchoolClass[], teachers: Teacher[]) => {
    let content = `<table><thead><tr><th>Period</th><th>Free Teachers</th></tr></thead><tbody>`;
    for(let i=0; i<8; i++) {
        const busyTeachers = new Set();
        const day = 'Monday';
        classes.forEach(c => { const slot = c.timetable[day]?.[i]; if(slot) slot.forEach(p => { if(p.teacherId) busyTeachers.add(p.teacherId); }); });
        const free = teachers.filter(tea => !busyTeachers.has(tea.id)).map(tea => tea.nameEn).join(', ');
        content += `<tr><td>${i+1}</td><td>${free}</td></tr>`;
    }
    content += `</tbody></table>`;
    return generateReportHTML(schoolConfig, design, renderText(lang, 'Free Teachers', 'فری اساتذہ'), lang, content);
};

export const generateByPeriodExcel = (t: any, lang: DownloadLanguage, design: DownloadDesignConfig, schoolConfig: SchoolConfig, classes: SchoolClass[], teachers: Teacher[]) => {
    let csv = `Period,Free Teachers\n`;
    for(let i=0; i<8; i++) {
        const busyTeachers = new Set();
        const day = 'Monday';
        classes.forEach(c => { const slot = c.timetable[day]?.[i]; if(slot) slot.forEach(p => { if(p.teacherId) busyTeachers.add(p.teacherId); }); });
        const free = teachers.filter(tea => !busyTeachers.has(tea.id)).map(tea => tea.nameEn).join('; ');
        csv += toCsvRow([i+1, free]) + '\n';
    }
    downloadCsv(csv, 'Free_Teachers.csv');
};

export const generateAdjustmentsReportHtml = (t: any, lang: DownloadLanguage, design: DownloadDesignConfig, adjustments: Adjustment[], teachers: Teacher[], classes: SchoolClass[], subjects: Subject[], schoolConfig: SchoolConfig, date: string, absentTeacherIds: string[], signature?: string) => {
    const map = new Map();
    adjustments.forEach(adj => { if(!map.has(adj.substituteTeacherId)) map.set(adj.substituteTeacherId, []); map.get(adj.substituteTeacherId).push(adj); });
    let content = `<div style="margin-bottom: 20px;"><strong>Absent Teachers:</strong> ${absentTeacherIds.map(id => teachers.find(t=>t.id===id)?.nameEn).join(', ')}</div><table><thead><tr><th>Sub Teacher</th><th>Period</th><th>Class</th><th>Subject</th><th>Original</th></tr></thead><tbody>`;
    map.forEach((adjs, subId) => {
        const sub = teachers.find(t=>t.id===subId);
        adjs.forEach((adj: Adjustment) => {
            const c = classes.find(cl=>cl.id===adj.classId);
            const s = subjects.find(su=>su.id===adj.subjectId);
            const orig = teachers.find(te=>te.id===adj.originalTeacherId);
            content += `<tr><td>${sub?.nameEn}</td><td>${adj.periodIndex+1}</td><td>${c?.nameEn}</td><td>${s?.nameEn}</td><td>${orig?.nameEn}</td></tr>`;
        });
    });
    content += `</tbody></table>`;
    if (signature) content += `<div style="margin-top: 40px; text-align: right;"><img src="${signature}" style="height: 60px;" /><br/>Signature</div>`;
    return generateReportHTML(schoolConfig, design, renderText(lang, 'Daily Adjustments', 'روزانہ ایڈجسٹمنٹ'), lang, content, date);
};

export const generateAdjustmentsExcel = (t: any, adjustments: Adjustment[], teachers: Teacher[], classes: SchoolClass[], subjects: Subject[], date: string) => {
    let csv = `Date,Substitute,Period,Class,Subject,Original Teacher\n`;
    adjustments.forEach(adj => {
        const sub = teachers.find(t=>t.id===adj.substituteTeacherId);
        const c = classes.find(cl=>cl.id===adj.classId);
        const s = subjects.find(su=>su.id===adj.subjectId);
        const orig = teachers.find(te=>te.id===adj.originalTeacherId);
        csv += toCsvRow([date, sub?.nameEn, adj.periodIndex+1, c?.nameEn, s?.nameEn, orig?.nameEn]) + '\n';
    });
    downloadCsv(csv, `Adjustments_${date}.csv`);
};

export const generateAttendanceReportHtml = (t: any, lang: DownloadLanguage, design: DownloadDesignConfig, classes: SchoolClass[], teachers: Teacher[], schoolConfig: SchoolConfig, date: string, adjustments: any, leaveDetails: any, attendance: any) => {
    let content = `<table><thead><tr><th>Class</th><th>Total</th><th>Present</th><th>Absent</th><th>Leave</th><th>%</th><th>In-Charge/Sign</th></tr></thead><tbody>`;
    classes.forEach(c => {
        if(c.id === 'non-teaching-duties') return;
        const att = attendance?.[date]?.[c.id];
        const present = att?.present || 0;
        const total = c.studentCount;
        const percent = total > 0 ? Math.round((present / total) * 100) : 0;
        const inCharge = teachers.find(tea => tea.id === c.inCharge);
        content += `<tr><td>${renderText(lang, c.nameEn, c.nameUr)}</td><td>${total}</td><td>${present}</td><td>${att?.absent||0}</td><td>${att?.leave||0}</td><td>${percent}%</td><td>${att?.signature ? `<img src="${att.signature}" style="height:30px"/>` : (inCharge?.nameEn || '-')}</td></tr>`;
    });
    content += `</tbody></table>`;
    return generateReportHTML(schoolConfig, design, renderText(lang, 'Attendance Report', 'حاضری رپورٹ'), lang, content, date);
};

export const generateAttendanceReportExcel = (t: any, lang: DownloadLanguage, classes: SchoolClass[], teachers: Teacher[], date: string, adjustments: any, leaveDetails: any, attendance: any) => {
    let csv = `Date,Class,Total,Present,Absent,Leave,%\n`;
    classes.forEach(c => {
        if(c.id === 'non-teaching-duties') return;
        const att = attendance?.[date]?.[c.id];
        const present = att?.present || 0;
        const total = c.studentCount;
        const percent = total > 0 ? Math.round((present / total) * 100) : 0;
        csv += toCsvRow([date, c.nameEn, total, present, att?.absent||0, att?.leave||0, percent]) + '\n';
    });
    downloadCsv(csv, `Attendance_${date}.csv`);
};
