import type { AppData } from "@/types";

const CLIENT_ID = "647963986605-944tkn3ej3sru62pkf2lr6lmbuslq242.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile";
const FILENAME = "espace-scolaire-sync.json";

let tokenClient: any = null;
let accessToken: string | null = typeof window !== "undefined" ? localStorage.getItem("gdrive_token") : null;

export function initGoogleIdentity(onTokenReceived?: (token: string) => void) {
  if (typeof window === "undefined" || !(window as any).google) return;

  tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (resp: any) => {
      if (resp.access_token) {
        accessToken = resp.access_token;
        localStorage.setItem("gdrive_token", accessToken!);
        if (onTokenReceived) onTokenReceived(accessToken!);
      } else if (resp.error) {
        // En cas d'erreur silencieuse, on nettoie si besoin ou on log
        console.warn("Auth response error/cancel:", resp.error);
      }
    },
  });
}

export function promptGoogleLogin() {
  if (tokenClient) {
    tokenClient.requestAccessToken({ prompt: "consent" });
  } else if (typeof window !== "undefined" && (window as any).google) {
    initGoogleIdentity();
    setTimeout(() => tokenClient?.requestAccessToken({ prompt: "consent" }), 100);
  }
}

/**
 * Tente un renouvellement silencieux du token (prompt: '')
 */
export async function silentRefreshGoogleToken(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !(window as any).google) {
      return resolve(false);
    }
    const tempClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (resp: any) => {
        if (resp.access_token) {
          accessToken = resp.access_token;
          localStorage.setItem("gdrive_token", accessToken!);
          resolve(true);
        } else {
          resolve(false);
        }
      },
    });
    // prompt: '' tente le refresh sans interaction utilisateur si la session Google est active
    tempClient.requestAccessToken({ prompt: "" });
  });
}

export function logoutGoogle() {
  accessToken = null;
  localStorage.removeItem("gdrive_token");
}

export function isGoogleConnected(): boolean {
  return !!accessToken || (typeof window !== "undefined" && !!localStorage.getItem("gdrive_token"));
}

function getValidToken(): string | null {
  if (accessToken) return accessToken;
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("gdrive_token");
    if (stored) {
      accessToken = stored;
      return stored;
    }
  }
  return null;
}

// Recherche le fichier dans Google Drive avec gestion propre du 401
async function findSyncFileId(token: string, allowRefresh = true): Promise<string | null> {
  try {
    const query = encodeURIComponent(`name = '${FILENAME}' and trashed = false`);
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&spaces=drive`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (res.status === 401) {
      localStorage.removeItem("gdrive_token");
      accessToken = null;
      if (allowresRefreshOrRetry(allowRefresh)) {
        const refreshed = await silentRefreshGoogleToken();
        if (refreshed && accessToken) {
          return findSyncFileId(accessToken, false);
        }
      }
      return null;
    }
    if (!res.ok) return null;
    const data = await res.json();
    return data.files?.[0]?.id || null;
  } catch {
    return null;
  }
}

function allowresRefreshOrRetry(val: boolean): boolean {
  return val;
}

export async function uploadToGoogleDrive(data: AppData): Promise<boolean> {
  const token = getValidToken();
  if (!token) return false;
  try {
    const fileId = await findSyncFileId(token);
    if (!fileId && !getValidToken()) return false;
    const activeToken = getValidToken();
    if (!activeToken) return false;

    const actualFileId = await findSyncFileId(activeToken);
    const content = JSON.stringify(data, null, 2);

    if (actualFileId) {
      const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${actualFileId}?uploadType=media`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${activeToken}`,
          "Content-Type": "application/json",
        },
        body: content,
      });
      return res.ok;
    } else {
      const metadata = {
        name: FILENAME,
        mimeType: "application/json",
      };
      const form = new FormData();
      form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
      form.append("file", new Blob([content], { type: "application/json" }));

      const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
        method: "POST",
        headers: { Authorization: `Bearer ${activeToken}` },
        body: form,
      });
      return res.ok;
    }
  } catch (err) {
    console.error("Erreur d'envoi vers Google Drive", err);
    return false;
  }
}

export async function downloadFromGoogleDrive(): Promise<AppData | null> {
  const token = getValidToken();
  if (!token) return null;
  try {
    const fileId = await findSyncFileId(token);
    if (!fileId) return null;

    const activeToken = getValidToken();
    if (!activeToken) return null;

    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${activeToken}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Erreur de récupération Google Drive", err);
    return null;
  }
}

export async function getGoogleUserFirstName(): Promise<string | null> {
  const token = getValidToken();
  if (!token) return null;
  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.given_name || data.name?.split(" ")[0] || null;
  } catch {
    return null;
  }
}

export async function uploadFileToDrive(file: File | Blob, name: string): Promise<string | null> {
  const token = getValidToken();
  if (!token) return null;
  try {
    const metadata = {
      name: `espace-scolaire-${name}`,
      mimeType: file.type || "application/octet-stream",
    };

    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    form.append("file", file);

    const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.id || null;
  } catch (e) {
    console.error("Erreur upload fichier Drive", e);
    return null;
  }
}

export async function downloadFileFromDrive(driveFileId: string): Promise<Blob | null> {
  const token = getValidToken();
  if (!token) return null;
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${driveFileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return null;
    return await res.blob();
  } catch (e) {
    console.error("Erreur download fichier Drive", e);
    return null;
  }
}

export async function deleteFileFromDrive(driveFileId: string): Promise<void> {
  const token = getValidToken();
  if (!token) return;
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${driveFileId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (e) {
    console.error("Erreur delete fichier Drive", e);
  }
}
