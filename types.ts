
export type Language = 'en' | 'ur';
export type Page = 'home' | 'classTimetable' | 'teacherTimetable' | 'alternativeTimetable' | 'attendance' | 'dataEntry' | 'settings';
export type DataEntryTab = 'class' | 'teacher' | 'subject' | 'jointPeriods' | 'structure' | 'lesson' | 'importExport' | 'school';

export interface Subject {
  id: string;
  nameEn: string;
  nameUr: string;
  isPractical?: boolean;
  practicalSubjectId?: string;
}

export interface Teacher {
  id: string;
  serialNumber?: number;
  nameEn: string;
  nameUr: string;
  gender: 'Male' | 'Female';
  contactNumber: string;
}

export interface Group {
  id: string;
  name: string;
}

export interface GroupSet {
  id: string;
  name: string;
  groups: Group[];
}

export interface ClassSubject {
  subjectId: string;
  periodsPerWeek: number;
  teacherId: string;
  groupSetId?: string;
  groupId?: string;
  combinedGroupId?: string;
}

export interface Period {
  id: string; 
  classId: string;
  subjectId: string;
  teacherId: string;
  jointPeriodId?: string; 
}

export type TimetableSlot = Period[]; 
export type TimetableDay = TimetableSlot[];

export interface TimetableGridData {
  Monday: TimetableDay;
  Tuesday: TimetableDay;
  Wednesday: TimetableDay;
  Thursday: TimetableDay;
  Friday: TimetableDay;
  Saturday: TimetableDay;
}

// Export constant for iteration
export const allDays: (keyof TimetableGridData)[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export interface Timetable {
  classes: { [classId: string]: TimetableGridData };
  teachers: { [teacherId: string]: TimetableGridData };
}

export interface Adjustment {
  id: string; 
  classId: string;
  subjectId: string;
  originalTeacherId: string;
  substituteTeacherId: string;
  day: keyof TimetableGridData;
  periodIndex: number;
  conflictDetails?: {
    classNameEn: string;
    classNameUr: string;
  };
}

export interface JointPeriodAssignment {
  classId: string;
  subjectId: string;
  groupSetId?: string;
  groupId?: string;
}

export interface JointPeriod {
  id: string;
  name: string;
  teacherId: string;
  periodsPerWeek: number;
  assignments: JointPeriodAssignment[];
}

export interface DayConfig {
    active: boolean;
    periodCount: number;
}

export interface PeriodTime {
    start: string;
    end: string;
    name?: string;
}

export interface Break {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    beforePeriod: number; // The break happens BEFORE this period number (1-based)
}

export interface Vacation {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
}

export interface AttendanceData {
    present: number;
    absent: number;
    sick: number;
    leave: number;
    signature?: string; 
    submittedBy?: string; // Added field to track who submitted the attendance
}

export interface TimetableSession {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  subjects: Subject[];
  teachers: Teacher[];
  classes: SchoolClass[];
  jointPeriods: JointPeriod[];
  adjustments: Record<string, Adjustment[]>; 
  leaveDetails?: Record<string, Record<string, LeaveDetails>>;
  attendance?: Record<string, Record<string, AttendanceData>>; // date -> classId -> data
  // Optional structure configuration for portable sessions
  daysConfig?: Record<keyof TimetableGridData, DayConfig>;
  periodTimings?: {
      default: PeriodTime[];
      friday: PeriodTime[];
  };
  breaks?: {
      default: Break[];
      friday: Break[];
  };
  assembly?: {
      default: PeriodTime | null;
      friday: PeriodTime | null;
  };
  vacations?: Vacation[];
}

export interface LeaveDetails {
    leaveType: 'full' | 'half';
    startPeriod: number;
    periods?: number[];
    reason?: string;
    startDate?: string;
    endDate?: string;
}

export interface SchoolClass {
  id:string;
  serialNumber?: number;
  nameEn: string;
  nameUr: string;
  category?: 'High' | 'Middle' | 'Primary';
  inCharge: string; 
  roomNumber: string;
  studentCount: number;
  subjects: ClassSubject[];
  timetable: TimetableGridData;
  groupSets?: GroupSet[];
}

// --- Download Types ---

export type DownloadFormat = 'pdf-full' | 'pdf-summary' | 'excel';
export type DownloadLanguage = 'en' | 'ur' | 'both';
export type FontFamily = 'sans-serif' | 'Lato' | 'Roboto' | 'Open Sans' | 'Montserrat' | 'Times New Roman' | 'Merriweather' | 'Arial' | 'Impact' | 'Calibri' | 'Verdana' | 'Tahoma' | 'Antonio' | 'Monoton' | 'Rubik Mono One' | 'Bodoni Moda' | 'Bungee Spice' | 'Bebas Neue' | 'Playfair Display' | 'Oswald' | 'Anton' | 'Instrument Serif' | 'Orbitron' | 'Fjalla One' | 'Playwrite CU' | 'Trebuchet MS' | 'Segoe UI' | 'Comic Sans MS' | 'Noto Nastaliq Urdu' | 'Gulzar' | 'Amiri' | 'Aref Ruqaa';

export type CardStyle = 'full' | 'outline' | 'text' | 'triangle' | 'glass' | 'gradient' | 'minimal-left' | 'badge';
export type TriangleCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface DownloadDesignConfig {
    version: 3;
    page: {
        size: 'a4' | 'letter' | 'legal';
        orientation: 'portrait' | 'landscape';
        margins: { top: number, right: number, bottom: number, left: number }; // in mm
        watermarkOpacity: number;
    };
    header: {
        showLogo: boolean;
        logoSize: number; // px
        logoPosition: 'left' | 'center' | 'right';
        schoolName: {
            fontFamily: FontFamily;
            fontSize: number; // px
            fontWeight: 'normal' | 'bold';
            align: 'left' | 'center' | 'right';
            color: string;
        };
        showTitle: boolean;
        title: {
            fontFamily: FontFamily;
            fontSize: number;
            fontWeight: 'normal' | 'bold';
            align: 'left' | 'center' | 'right';
            color: string;
        };
        details: {
            fontFamily: FontFamily;
            fontSize: number;
            fontWeight: 'normal' | 'bold';
            align: 'left' | 'center' | 'right';
            color: string;
        };
        divider: boolean;
        bgColor: string;
    };
    table: {
        fontFamily: FontFamily;
        fontSize: number; // px
        cellPadding: number; // px
        headerBgColor: string;
        headerColor: string;
        bodyBgColor: string;
        bodyColor: string; // Added for table body text color
        borderColor: string;
        periodColumnWidth: number; // px
        periodColumnBgColor: string;
        periodColumnColor: string;
        altRowColor: string;
        gridStyle?: 'solid' | 'dashed' | 'dotted';
        borderWidth?: number;
        headerFontSize?: number; // Added property for table header font size
        verticalAlign?: 'top' | 'middle' | 'bottom';
        cardStyle?: CardStyle;
        triangleCorner?: TriangleCorner;
        outlineWidth?: number;
        mergeIdenticalPeriods?: boolean;
    };
    footer: {
        show: boolean;
        text: string;
        fontFamily: FontFamily;
        fontSize: number;
        align: 'left' | 'center' | 'right';
        includePageNumber: boolean;
        color: string;
        includeTimestamp?: boolean;
    };
    colorMode: 'color' | 'bw';
    rowsPerPage?: number;
    rowsPerFirstPage?: number; // Option for different row count on first page
    daysPerPage?: number; // Option for splitting table columns (days) across pages
    watermarkText?: string;
    compactMode?: boolean;
}

export interface DownloadDesigns {
    class: DownloadDesignConfig;
    teacher: DownloadDesignConfig;
    workload: DownloadDesignConfig; 
    alternative: DownloadDesignConfig;
    adjustments: DownloadDesignConfig; // New key for Daily Adjustments
    basicInfo: DownloadDesignConfig;
    attendance: DownloadDesignConfig; // New key for Attendance Report
    schoolTimings: DownloadDesignConfig;
}

export interface SchoolConfig {
  schoolNameEn: string;
  schoolNameUr: string;
  schoolLogoBase64: string | null;
  downloadDesigns: DownloadDesigns;
  daysConfig: Record<keyof TimetableGridData, DayConfig>;
  periodTimings: {
      default: PeriodTime[];
      friday: PeriodTime[];
  };
  breaks: {
      default: Break[];
      friday: Break[];
  };
  assembly: {
      default: PeriodTime | null;
      friday: PeriodTime | null;
  };
}

export interface UserData {
  timetableSessions: TimetableSession[];
  schoolConfig: SchoolConfig;
}

export const generateUniqueId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
