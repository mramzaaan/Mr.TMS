
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

    // Simple adjustment calculation for now, can be expanded
    let substitutionsTaken = 0;
    let leavesTaken = 0;
    
    // Logic to calculate subs/leaves if dates provided
    if (startDate && endDate) {
        // ... (Logic from previous implementation if needed)
    }

    return {
        dailyCounts,
        weeklyPeriods,
        jointPeriodsCount,
        substitutionsTaken,
        leavesTaken,
        totalWorkload: weeklyPeriods + substitutionsTaken - leavesTaken
    };
};

export const getPrintStyles = (design: DownloadDesignConfig) => {
    const page = design?.page || { size: 'a4', orientation: 'portrait', margins: { top: 10, right: 10, bottom: 10, left: 10 }, watermarkOpacity: 0.1 };
    const table = design?.table || { cardStyle: 'full', triangleCorner: 'bottom-left', fontFamily: 'sans-serif', fontSize: 14, cellPadding: 8, borderColor: '#000000', borderWidth: 1, gridStyle: 'solid', headerBgColor: '#f3f4f6', headerColor: '#000000', bodyBgColor: '#ffffff', bodyColor: '#000000', altRowColor: '#f9fafb', periodColumnWidth: 50, periodColumnBgColor: '#f3f4f6', periodColumnColor: '#000000', outlineWidth: 2 };
    
    const importsLatin = `@import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Aref+Ruqaa:wght@400;700&family=Gulzar&family=Noto+Nastaliq+Urdu:wght@400;700&family=Anton&family=Antonio:wght@400;700&family=Bebas+Neue&family=Bodoni+Moda:opsz,wght@6..96,400..900&family=Bungee+Spice&family=Fjalla+One&family=Instrument+Serif:ital@0;1&family=Lato:wght@400;700&family=Merriweather:wght@400;700;900&family=Monoton&family=Montserrat:wght@400;500;700&family=Open+Sans:wght@400;600;700&family=Orbitron:wght@400;700&family=Oswald:wght@400;700&family=Anton&family=Instrument+Serif:ital@0;1&family=Playwrite+CU:wght@100..400&family=Roboto:wght@400;500;700&family=Rubik+Mono+One&display=swap');`;

    return `
    ${importsLatin}
    .print-container { font-family: '${table.fontFamily}', sans-serif; box-sizing: border-box; }
    .print-container .font-urdu, .print-container .font-urdu * { font-family: ${URDU_FONT_STACK} !important; line-height: 1.8; direction: rtl; }
    .page { width: 100%; height: 100%; padding: ${page.margins.top}mm ${page.margins.right}mm ${page.margins.bottom}mm ${page.margins.left}mm; display: flex; flex-direction: column; position: relative; background: white; overflow: hidden; }
    .content-wrapper { position: relative; z-index: 10; display: flex; flex-direction: column; flex-grow: 1; height: 100%; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 0; border: ${table.borderWidth || 1}px ${table.gridStyle || 'solid'} ${table.borderColor}; }
    th, td { border: ${table.borderWidth || 1}px ${table.gridStyle || 'solid'} ${table.borderColor}; padding: ${table.cellPadding}px; text-align: center; font-size: ${table.fontSize}px; color: ${table.bodyColor || '#000000'}; font-family: '${table.fontFamily}', sans-serif; }
    th { background-color: ${table.headerBgColor}; color: ${table.headerColor}; font-weight: bold; }
    tr:nth-child(even) { background-color: ${table.altRowColor}; }
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
        ? `<img src="${schoolConfig.schoolLogoBase64}" class="header-logo" style="height: ${design.header.logoSize}px; object-fit: contain;" />`
        : '';
    
    const showPageNum = design.footer.includePageNumber && pageNumber !== undefined && totalPages !== undefined;
    const pageNumHtml = showPageNum ? `<span>Page ${pageNumber} of ${totalPages}</span>` : '';

    return `
        <div class="print-container">
            <style>${styles}</style>
            <div class="page">
                ${schoolConfig.schoolLogoBase64 && design.page.watermarkOpacity > 0 ? `<img src="${schoolConfig.schoolLogoBase64}" class="watermark" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 60%; height: 60%; object-fit: contain; opacity: ${design.page.watermarkOpacity}; z-index: 0;" />` : ''}
                <div class="content-wrapper">
                    <header class="header-container" style="display: flex; align-items: center; gap: 15px; margin-bottom: 10px; padding-bottom: 8px; border-bottom: ${design.header.divider ? '3px double #000' : 'none'}; background-color: ${design.header.bgColor}; justify-content: ${design.header.logoPosition === 'center' ? 'center' : design.header.logoPosition === 'right' ? 'flex-end' : 'flex-start'}">
                        ${design.header.logoPosition === 'left' ? logoHtml : ''}
                        <div class="header-text" style="flex-grow: 1; text-align: ${design.header.schoolName.align}">
                            <h1 class="header-school-name" style="margin:0; font-family: '${design.header.schoolName.fontFamily}'; font-size: ${design.header.schoolName.fontSize}px; font-weight: ${design.header.schoolName.fontWeight}; color: ${design.header.schoolName.color}">
                                ${lang === 'ur' ? schoolConfig.schoolNameUr : schoolConfig.schoolNameEn}
                            </h1>
                            ${design.header.showTitle ? `<h2 class="header-title" style="margin:4px 0 0; font-family: '${design.header.title.fontFamily}'; font-size: ${design.header.title.fontSize}px; font-weight: ${design.header.title.fontWeight}; color: ${design.header.title.color}; text-align: ${design.header.title.align}">${title}</h2>` : ''}
                            ${details ? `<div class="header-details" style="margin-top: 4px; font-family: '${design.header.details.fontFamily}'; font-size: ${design.header.details.fontSize}px; font-weight: ${design.header.details.fontWeight}; color: ${design.header.details.color}; text-align: ${design.header.details.align}">${details}</div>` : ''}
                        </div>
                        ${design.header.logoPosition === 'right' ? logoHtml : ''}
                    </header>
                    <main class="main-content" style="flex-grow: 1; display: flex; flex-direction: column;">
                        ${content}
                    </main>
                    ${design.footer.show ? `
                    <footer class="footer" style="margin-top: auto; padding-top: 5px; border-top: 1px solid #000; display: flex; align-items: flex-end; font-family: '${design.footer.fontFamily}'; font-size: ${design.footer.fontSize}px; color: ${design.footer.color}; justify-content: ${design.footer.align === 'center' ? 'center' : design.footer.align === 'right' ? 'flex-end' : 'flex-start'}">
                        <div style="flex: 1; text-align: left;">${design.footer.includeTimestamp ? new Date().toLocaleString() : ''}</div>
                        <div style="flex: 2; text-align: center;">${design.footer.text}</div>
                        <div style="flex: 1; text-align: right;">${pageNumHtml}</div>
                    </footer>` : ''}
                </div>
            </div>
        </div>
    `;
};

// --- Missing Generators ---

export const generateBasicInformationHtml = (t: any, lang: DownloadLanguage, design: DownloadDesignConfig, classes: SchoolClass[], teachers: Teacher[], schoolConfig: SchoolConfig): string => {
    let rows = '';
    classes.forEach((c, i) => {
        const inCharge = teachers.find(teach => teach.id === c.inCharge);
        rows += `<tr><td>${i+1}</td><td>${renderText(lang, c.nameEn, c.nameUr)}</td><td>${inCharge ? renderText(lang, inCharge.nameEn, inCharge.nameUr) : '-'}</td><td>${c.roomNumber}</td><td>${c.studentCount}</td></tr>`;
    });
    const content = `<table><thead><tr><th>#</th><th>${t.class}</th><th>${t.classInCharge}</th><th>${t.roomNumber}</th><th>${t.studentCount}</th></tr></thead><tbody>${rows}</tbody></table>`;
    return generateReportHTML(schoolConfig, design, t.basicInformation, lang, content);
};

export const generateBasicInformationExcel = (t: any, lang: DownloadLanguage, design: DownloadDesignConfig, classes: SchoolClass[], teachers: Teacher[]) => {
    const header = [t.serialNumber, t.class, t.classInCharge, t.roomNumber, t.studentCount];
    const rows = classes.map((c, i) => {
        const inCharge = teachers.find(teach => teach.id === c.inCharge);
        return [i+1, lang === 'ur' ? c.nameUr : c.nameEn, inCharge ? (lang === 'ur' ? inCharge.nameUr : inCharge.nameEn) : '-', c.roomNumber, c.studentCount];
    });
    const csv = [toCsvRow(header), ...rows.map(toCsvRow)].join('\n');
    downloadCsv(csv, 'Basic_Information.csv');
};

export const generateByPeriodHtml = (t: any, lang: DownloadLanguage, design: DownloadDesignConfig, schoolConfig: SchoolConfig, classes: SchoolClass[], teachers: Teacher[]): string => {
    const content = `<div style="padding: 20px; text-align: center;">Matrix View Not Implemented in this placeholder.</div>`;
    return generateReportHTML(schoolConfig, design, t.byPeriod, lang, content);
};

export const generateByPeriodExcel = (t: any, lang: DownloadLanguage, design: DownloadDesignConfig, schoolConfig: SchoolConfig, classes: SchoolClass[], teachers: Teacher[]) => {
    alert("Excel export for Matrix View not implemented.");
};

export const generateWorkloadSummaryHtml = (t: any, lang: DownloadLanguage, design: DownloadDesignConfig, teachers: Teacher[], schoolConfig: SchoolConfig, classes: SchoolClass[], adjustments: any, leaveDetails: any, startDate: string, endDate: string, mode: string): string => {
    let rows = '';
    teachers.forEach((tea, i) => {
        const stats = calculateWorkloadStats(tea.id, classes, adjustments, leaveDetails, startDate, endDate, schoolConfig);
        rows += `<tr><td>${i+1}</td><td>${renderText(lang, tea.nameEn, tea.nameUr)}</td><td>${stats.weeklyPeriods}</td><td>${stats.totalWorkload}</td></tr>`;
    });
    const content = `<table><thead><tr><th>#</th><th>${t.teacher}</th><th>${t.weeklyPeriods}</th><th>${t.totalWorkload}</th></tr></thead><tbody>${rows}</tbody></table>`;
    return generateReportHTML(schoolConfig, design, t.workloadSummaryReport, lang, content);
};

export const generateWorkloadSummaryExcel = (t: any, lang: DownloadLanguage, design: DownloadDesignConfig, teachers: Teacher[], schoolConfig: SchoolConfig, classes: SchoolClass[], adjustments: any, leaveDetails: any, startDate: string, endDate: string, mode: string) => {
    const header = [t.serialNumber, t.teacher, t.weeklyPeriods, t.totalWorkload];
    const rows = teachers.map((tea, i) => {
        const stats = calculateWorkloadStats(tea.id, classes, adjustments, leaveDetails, startDate, endDate, schoolConfig);
        return [i+1, lang === 'ur' ? tea.nameUr : tea.nameEn, stats.weeklyPeriods, stats.totalWorkload];
    });
    const csv = [toCsvRow(header), ...rows.map(toCsvRow)].join('\n');
    downloadCsv(csv, 'Workload_Summary.csv');
};

export const generateSchoolTimingsHtml = (t: any, lang: DownloadLanguage, design: DownloadDesignConfig, schoolConfig: SchoolConfig): string => {
    // Basic implementation for timings
    const content = `<div style="text-align:center; padding: 20px;">School Timings Table Placeholder</div>`;
    return generateReportHTML(schoolConfig, design, t.schoolTimings, lang, content);
};

export const generateClassTimetableHtml = (classItem: SchoolClass, lang: DownloadLanguage, design: DownloadDesignConfig, teachers: Teacher[], subjects: Subject[], schoolConfig: SchoolConfig): string => {
    // Placeholder - Normally you'd generate the grid here
    return generateReportHTML(schoolConfig, design, `${t.classTimetable}: ${lang === 'ur' ? classItem.nameUr : classItem.nameEn}`, lang, `<div>Timetable Grid Placeholder</div>`);
};

export const generateTeacherTimetableHtml = (teacher: Teacher, lang: DownloadLanguage, design: DownloadDesignConfig, classes: SchoolClass[], subjects: Subject[], schoolConfig: SchoolConfig, adjustments: any, teachersList: Teacher[]): string => {
    return generateReportHTML(schoolConfig, design, `${t.teacherTimetable}: ${lang === 'ur' ? teacher.nameUr : teacher.nameEn}`, lang, `<div>Timetable Grid Placeholder</div>`);
};

export const generateAdjustmentsReportHtml = (
    t: any, 
    lang: DownloadLanguage, 
    design: DownloadDesignConfig, 
    adjustments: Adjustment[], 
    teachers: Teacher[], 
    classes: SchoolClass[], 
    subjects: Subject[], 
    schoolConfig: SchoolConfig, 
    date: string, 
    absentTeacherIds: string[],
    signature?: string
): string[] => {
    let rows = '';
    adjustments.forEach((adj, i) => {
        const tea = teachers.find(t => t.id === adj.originalTeacherId);
        const sub = teachers.find(t => t.id === adj.substituteTeacherId);
        const cls = classes.find(c => c.id === adj.classId);
        const subj = subjects.find(s => s.id === adj.subjectId);
        
        rows += `<tr>
            <td>${i+1}</td>
            <td>${tea ? renderText(lang, tea.nameEn, tea.nameUr) : '-'}</td>
            <td>${cls ? renderText(lang, cls.nameEn, cls.nameUr) : '-'}</td>
            <td>${subj ? renderText(lang, subj.nameEn, subj.nameUr) : '-'}</td>
            <td>${adj.periodIndex + 1}</td>
            <td>${sub ? renderText(lang, sub.nameEn, sub.nameUr) : '-'}</td>
        </tr>`;
    });
    
    const signatureHtml = signature ? `<div style="margin-top: 40px; text-align: right;"><img src="${signature}" style="height: 60px; border-bottom: 1px solid #000;" /><div style="margin-top:5px; font-weight:bold;">${t.signature}</div></div>` : '';
    
    const content = `
        <div style="margin-bottom: 10px;">Date: ${date}</div>
        <table><thead><tr><th>#</th><th>${t.teacherOnLeave}</th><th>${t.class}</th><th>${t.subject}</th><th>${t.period}</th><th>${t.substituteTeacher}</th></tr></thead><tbody>${rows}</tbody></table>
        ${signatureHtml}
    `;
    
    return [generateReportHTML(schoolConfig, design, t.dailyAdjustments, lang, content)];
};

export const generateAdjustmentsExcel = (t: any, adjustments: Adjustment[], teachers: Teacher[], classes: SchoolClass[], subjects: Subject[], date: string) => {
    const header = ['#', t.teacherOnLeave, t.class, t.subject, t.period, t.substituteTeacher];
    const rows = adjustments.map((adj, i) => {
        const tea = teachers.find(t => t.id === adj.originalTeacherId);
        const sub = teachers.find(t => t.id === adj.substituteTeacherId);
        const cls = classes.find(c => c.id === adj.classId);
        const subj = subjects.find(s => s.id === adj.subjectId);
        return [i+1, tea?.nameEn || '', cls?.nameEn || '', subj?.nameEn || '', adj.periodIndex + 1, sub?.nameEn || ''];
    });
    const csv = [toCsvRow(header), ...rows.map(toCsvRow)].join('\n');
    downloadCsv(csv, `Adjustments_${date}.csv`);
};

export const generateAttendanceReportHtml = (
    t: any, 
    lang: DownloadLanguage, 
    design: DownloadDesignConfig, 
    classes: SchoolClass[], 
    teachers: Teacher[], 
    schoolConfig: SchoolConfig, 
    date: string, 
    adjustments: any, 
    leaveDetails: any, 
    attendance: any
): string => {
    let rows = '';
    classes.forEach((c, i) => {
        const att = attendance[date]?.[c.id] || {};
        rows += `<tr><td>${i+1}</td><td>${renderText(lang, c.nameEn, c.nameUr)}</td><td>${c.studentCount}</td><td>${att.present || '-'}</td><td>${att.absent || '-'}</td><td>${att.leave || '-'}</td></tr>`;
    });
    const content = `
        <div style="margin-bottom: 10px;">Date: ${date}</div>
        <table><thead><tr><th>#</th><th>${t.class}</th><th>Total</th><th>${t.present}</th><th>${t.absent}</th><th>${t.leave}</th></tr></thead><tbody>${rows}</tbody></table>
    `;
    return generateReportHTML(schoolConfig, design, t.attendanceReport, lang, content);
};

export const generateAttendanceReportExcel = (t: any, lang: DownloadLanguage, classes: SchoolClass[], teachers: Teacher[], date: string, adjustments: any, leaveDetails: any, attendance: any) => {
    const header = ['#', t.class, 'Total', t.present, t.absent, t.leave];
    const rows = classes.map((c, i) => {
        const att = attendance[date]?.[c.id] || {};
        return [i+1, lang === 'ur' ? c.nameUr : c.nameEn, c.studentCount, att.present || 0, att.absent || 0, att.leave || 0];
    });
    const csv = [toCsvRow(header), ...rows.map(toCsvRow)].join('\n');
    downloadCsv(csv, `Attendance_${date}.csv`);
};
