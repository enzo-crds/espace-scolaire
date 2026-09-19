import localforage from "localforage";
import type { AppData, FileRecord } from "@/types";
import { DEFAULT_SETTINGS } from "@/types";

// ------------------------------------------------------------
// Deux stores IndexedDB (via localforage) :
//  - "app-data"  : les données structurées (matières, notes, etc.)
//  - "app-files" : les fichiers binaires importés (blobs)
// localStorage n'est utilisé que pour un petit cache de préférences
// afin d'afficher le thème instantanément avant le chargement JS.
// ------------------------------------------------------------

localforage.config({
  name: "espace-scolaire",
  storeName: "app_store",
});

const dataStore = localforage.createInstance({
  name: "espace-scolaire",
  storeName: "app_data",
});

const fileStore = localforage.createInstance({
  name: "espace-scolaire",
  storeName: "app_files",
});

const DATA_KEY = "school-data-v1";

export const EMPTY_DATA: AppData = {
  subjects: [],
  documents: [],
  grades: [],
  schedule: [],
  files: [],
  settings: DEFAULT_SETTINGS,
  version: 1,
};

export async function loadAppData(): Promise<AppData> {
  try {
    const raw = await dataStore.getItem<AppData>(DATA_KEY);
    if (!raw) return { ...EMPTY_DATA };
    return {
      ...EMPTY_DATA,
      ...raw,
      settings: { ...DEFAULT_SETTINGS, ...raw.settings },
    };
  } catch (err) {
    console.error("Erreur de chargement des données", err);
    return { ...EMPTY_DATA };
  }
}

export async function saveAppData(data: AppData): Promise<void> {
  await dataStore.setItem(DATA_KEY, data);
}

// ---- Gestion des fichiers binaires (blobs) ----

export async function storeFileBlob(id: string, blob: Blob): Promise<void> {
  await fileStore.setItem(id, blob);
}

export async function getFileBlob(id: string): Promise<Blob | null> {
  return (await fileStore.getItem<Blob>(id)) ?? null;
}

export async function deleteFileBlob(id: string): Promise<void> {
  await fileStore.removeItem(id);
}

export async function estimateStorageUsage(): Promise<{ usage: number; quota: number } | null> {
  if (navigator.storage && navigator.storage.estimate) {
    const est = await navigator.storage.estimate();
    return { usage: est.usage ?? 0, quota: est.quota ?? 0 };
  }
  return null;
}

export function humanFileSize(bytes: number): string {
  if (bytes === 0) return "0 o";
  const units = ["o", "Ko", "Mo", "Go"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export type { FileRecord };
