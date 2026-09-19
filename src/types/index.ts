// ============================================================
// Types centraux de l'application "Espace Scolaire"
// ============================================================

export type ThemeMode = "light" | "dark" | "system";

export interface Settings {
  theme: ThemeMode;
  accentColor: string; // couleur d'accent (hex)
  averageMode: "simple" | "weighted"; // mode de calcul de la moyenne générale
  studentName: string;
  currentWeek: "A" | "B"; // semaine active pour l'emploi du temps
}

export interface Subject {
  id: string;
  name: string;
  color: string; // couleur hex utilisée un peu partout
  icon: string; // emoji
  coefficient: number; // coefficient utilisé pour la moyenne générale pondérée
  createdAt: number;
}

export type DocKind = "course" | "fiche";

export interface DocumentItem {
  id: string;
  kind: DocKind;
  subjectId: string;
  title: string;
  description: string;
  tags: string[];
  chapter?: string;
  content: string; // HTML riche (éditeur)
  fileId?: string; // référence vers un FileRecord importé
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface FileRecord {
  id: string;
  name: string;
  type: string; // mime type
  size: number;
  date: number;
  subjectId: string | null;
  category: DocKind | "other";
}

export interface Grade {
  id: string;
  subjectId: string;
  title: string;
  value: number; // note obtenue (déjà ramenée à maxValue)
  maxValue: number; // barème, généralement 20
  coefficient: number;
  date: string; // ISO yyyy-mm-dd
  description?: string;
  createdAt: number;
}

export type Week = "A" | "B" | "BOTH";

export interface ScheduleSlot {
  id: string;
  week: Week;
  day: number; // 0 = Lundi ... 6 = Dimanche
  start: string; // "08:00"
  end: string; // "09:00"
  subjectId: string | null;
  label?: string; // libellé libre si pas de matière
  room?: string;
  teacher?: string;
  color?: string;
}

export interface AppData {
  subjects: Subject[];
  documents: DocumentItem[];
  grades: Grade[];
  schedule: ScheduleSlot[];
  files: FileRecord[];
  settings: Settings;
  version: number;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  accentColor: "#6366f1",
  averageMode: "weighted",
  studentName: "Élève",
  currentWeek: "A",
};

export const SUBJECT_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316",
  "#f59e0b", "#84cc16", "#22c55e", "#10b981", "#14b8a6",
  "#06b6d4", "#3b82f6", "#64748b",
];

export const SUBJECT_ICONS = [
  "📐", "📚", "🇬🇧", "🇪🇸", "🇩🇪", "🧪", "🔬", "💻", "🎨", "🎵",
  "🏃", "🌍", "📖", "🧮", "⚙️", "🔧", "📊", "🗣️", "✏️", "🧬",
];

export interface Reminder {
  id: string;
  title: string;
  date: string; // ex: "2026-09-20"
  time: string; // ex: "08:00"
  subjectId?: string;
  notified?: boolean;
}
