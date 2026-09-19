import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  AppData,
  DocumentItem,
  FileRecord,
  Grade,
  ScheduleSlot,
  Settings,
  Subject,
} from "@/types";
import {
  EMPTY_DATA,
  loadAppData,
  saveAppData,
  deleteFileBlob,
  getFileBlob,
  storeFileBlob,
} from "@/services/storage";
import { generateId } from "@/services/id";
import {
  downloadFromGoogleDrive,
  initGoogleIdentity,
  isGoogleConnected,
  uploadToGoogleDrive,
} from "@/services/gdrive";

interface DataContextValue {
  data: AppData;
  loading: boolean;
  lastSaved: number | null;
  isDriveSyncing: boolean;
  addSubject: (subject: Omit<Subject, "id" | "createdAt">) => Subject;
  updateSubject: (id: string, patch: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  addDocument: (doc: Omit<DocumentItem, "id" | "createdAt" | "updatedAt">) => DocumentItem;
  updateDocument: (id: string, patch: Partial<DocumentItem>) => void;
  deleteDocument: (id: string) => void;
  addGrade: (grade: Omit<Grade, "id" | "createdAt">) => Grade;
  updateGrade: (id: string, patch: Partial<Grade>) => void;
  deleteGrade: (id: string) => void;
  addSlot: (slot: Omit<ScheduleSlot, "id">) => ScheduleSlot;
  updateSlot: (id: string, patch: Partial<ScheduleSlot>) => void;
  deleteSlot: (id: string) => void;
  copyWeekSchedule: (sourceWeek: "A" | "B", targetWeek: "A" | "B") => void;
  addFile: (file: File, meta: { subjectId: string | null; category: FileRecord["category"] }) => Promise<FileRecord>;
  deleteFile: (id: string) => Promise<void>;
  readFile: (id: string) => Promise<Blob | null>;
  updateSettings: (patch: Partial<Settings>) => void;
  replaceAllData: (data: AppData) => Promise<void>;
  resetAllData: () => Promise<void>;
  syncWithDrive: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [isDriveSyncing, setIsDriveSyncing] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    async function init() {
      let localData = await loadAppData();
      initGoogleIdentity(async () => {
        await syncWithDrive();
      });
      if (isGoogleConnected()) {
        const driveData = await downloadFromGoogleDrive();
        if (driveData) {
          localData = driveData;
          await saveAppData(driveData);
        }
      }
      setData(localData);
      setLoading(false);
    }
    init();
  }, []);

  const syncWithDrive = async () => {
    if (!isGoogleConnected()) return;
    setIsDriveSyncing(true);
    const driveData = await downloadFromGoogleDrive();
    if (driveData) {
      setData(driveData);
      await saveAppData(driveData);
    } else {
      await uploadToGoogleDrive(data);
    }
    setIsDriveSyncing(false);
  };

  useEffect(() => {
    if (loading) return;
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      await saveAppData(data);
      setLastSaved(Date.now());
      if (isGoogleConnected()) {
        setIsDriveSyncing(true);
        await uploadToGoogleDrive(data);
        setIsDriveSyncing(false);
      }
    }, 500);

    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [data, loading]);

  const addSubject: DataContextValue["addSubject"] = (subject) => {
    const newSubject: Subject = { ...subject, id: generateId(), createdAt: Date.now() };
    setData((prev) => ({ ...prev, subjects: [...prev.subjects, newSubject] }));
    return newSubject;
  };

  const updateSubject: DataContextValue["updateSubject"] = (id, patch) => {
    setData((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  };

  const deleteSubject: DataContextValue["deleteSubject"] = (id) => {
    setData((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((s) => s.id !== id),
      documents: prev.documents.filter((d) => d.subjectId !== id),
      grades: prev.grades.filter((g) => g.subjectId !== id),
      schedule: prev.schedule.map((sl) => (sl.subjectId === id ? { ...sl, subjectId: null } : sl)),
    }));
  };

  const addDocument: DataContextValue["addDocument"] = (doc) => {
    const now = Date.now();
    const newDoc: DocumentItem = { ...doc, id: generateId(), createdAt: now, updatedAt: now };
    setData((prev) => ({ ...prev, documents: [...prev.documents, newDoc] }));
    return newDoc;
  };

  const updateDocument: DataContextValue["updateDocument"] = (id, patch) => {
    setData((prev) => ({
      ...prev,
      documents: prev.documents.map((d) =>
        d.id === id ? { ...d, ...patch, updatedAt: Date.now() } : d
      ),
    }));
  };

  const deleteDocument: DataContextValue["deleteDocument"] = (id) => {
    setData((prev) => {
      const doc = prev.documents.find((d) => d.id === id);
      if (doc?.fileId) deleteFileBlob(doc.fileId);
      return {
        ...prev,
        documents: prev.documents.filter((d) => d.id !== id),
        files: prev.files.filter((f) => f.id !== doc?.fileId),
      };
    });
  };

  const addGrade: DataContextValue["addGrade"] = (grade) => {
    const newGrade: Grade = { ...grade, id: generateId(), createdAt: Date.now() };
    setData((prev) => ({ ...prev, grades: [...prev.grades, newGrade] }));
    return newGrade;
  };

  const updateGrade: DataContextValue["updateGrade"] = (id, patch) => {
    setData((prev) => ({
      ...prev,
      grades: prev.grades.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    }));
  };

  const deleteGrade: DataContextValue["deleteGrade"] = (id) => {
    setData((prev) => ({ ...prev, grades: prev.grades.filter((g) => g.id !== id) }));
  };

  const addSlot: DataContextValue["addSlot"] = (slot) => {
    const newSlot: ScheduleSlot = { ...slot, id: generateId() };
    setData((prev) => ({ ...prev, schedule: [...prev.schedule, newSlot] }));
    return newSlot;
  };

  const updateSlot: DataContextValue["updateSlot"] = (id, patch) => {
    setData((prev) => ({
      ...prev,
      schedule: prev.schedule.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  };

  const deleteSlot: DataContextValue["deleteSlot"] = (id) => {
    setData((prev) => ({ ...prev, schedule: prev.schedule.filter((s) => s.id !== id) }));
  };

  const copyWeekSchedule: DataContextValue["copyWeekSchedule"] = (sourceWeek, targetWeek) => {
    setData((prev) => {
      const filteredSchedule = prev.schedule.filter((s) => s.week !== targetWeek);
      const sourceSlots = prev.schedule.filter((s) => s.week === sourceWeek);
      const duplicated = sourceSlots.map((s) => ({
        ...s,
        id: generateId(),
        week: targetWeek,
      }));
      return {
        ...prev,
        schedule: [...filteredSchedule, ...duplicated],
      };
    });
  };

  const addFile: DataContextValue["addFile"] = async (file, meta) => {
    const id = generateId();
    await storeFileBlob(id, file);
    const record: FileRecord = {
      id,
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
      date: Date.now(),
      subjectId: meta.subjectId,
      category: meta.category,
    };
    setData((prev) => ({ ...prev, files: [...prev.files, record] }));
    return record;
  };

  const deleteFile: DataContextValue["deleteFile"] = async (id) => {
    await deleteFileBlob(id);
    setData((prev) => ({ ...prev, files: prev.files.filter((f) => f.id !== id) }));
  };

  const readFile: DataContextValue["readFile"] = async (id) => {
    return getFileBlob(id);
  };

  const updateSettings: DataContextValue["updateSettings"] = (patch) => {
    setData((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  };

  const replaceAllData: DataContextValue["replaceAllData"] = async (newData) => {
    setData(newData);
    await saveAppData(newData);
    if (isGoogleConnected()) {
      await uploadToGoogleDrive(newData);
    }
    setLastSaved(Date.now());
  };

  const resetAllData: DataContextValue["resetAllData"] = async () => {
    setData(EMPTY_DATA);
    await saveAppData(EMPTY_DATA);
    if (isGoogleConnected()) {
      await uploadToGoogleDrive(EMPTY_DATA);
    }
    setLastSaved(Date.now());
  };

  return (
    <DataContext.Provider
      value={{
        data,
        loading,
        lastSaved,
        isDriveSyncing,
        addSubject,
        updateSubject,
        deleteSubject,
        addDocument,
        updateDocument,
        deleteDocument,
        addGrade,
        updateGrade,
        deleteGrade,
        addSlot,
        updateSlot,
        deleteSlot,
        copyWeekSchedule,
        addFile,
        deleteFile,
        readFile,
        updateSettings,
        replaceAllData,
        resetAllData,
        syncWithDrive,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData doit être utilisé dans DataProvider");
  return ctx;
}
