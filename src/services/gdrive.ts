import type { AppData } from "@/types";

const CLIENT_ID = "647963986605-944tkn3ej3sru62pkf2lr6lmbuslq242.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.profile";
const FILENAME = "espace-scolaire-sync.json";

let tokenClient: any = null;
let accessToken: string | null = localStorage.getItem("gdrive_token");

export function initGoogleIdentity(onSuccess: (token: string) => void) {
  if (typeof window === "undefined" || !(window as any).google) return;
  tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (resp: any) => {
      if (resp.access_token) {
        accessToken = resp.access_token;
        localStorage.setItem("gdrive_token", accessToken!);
        onSuccess(accessToken!);
      }
    },
  });
}

export function promptGoogleLogin() {
  if (tokenClient) {
    tokenClient.requestAccessToken();
  }
}

export function logoutGoogle() {
  accessToken = null;
  localStorage.removeItem("gdrive_token");
}

export function isGoogleConnected(): boolean {
  return !!accessToken;
}

// Recherche ou création du fichier de sauvegarde caché/privé dans l'App Data folder ou racine Drive
async function findSyncFileId(token: string): Promise<string | null> {
  const query = encodeURIComponent(`name = '${FILENAME}' and trashed = false`);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&spaces=drive`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.files?.[0]?.id || null;
}

export async function uploadToGoogleDrive(data: AppData): Promise<boolean> {
  if (!accessToken) return false;
  try {
    let fileId = await findSyncFileId(accessToken);
    const content = JSON.stringify(data, null, 2);
    const metadata = {
      name: FILENAME,
      mimeType: "application/json",
    };

    if (fileId) {
      // Update
      const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: content,
      });
      return res.ok;
    } else {
      // Create metadata + media multipart or simple upload
      const form = new FormData();
      form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
      form.append("file", new Blob([content], { type: "application/json" }));

      const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: form,
      });
      return res.ok;
    }
  } catch (err) {
    console.error("Erreur upload Drive", err);
    return false;
  }
}

export async function downloadFromGoogleDrive(): Promise<AppData | null> {
  if (!accessToken) return null;
  try {
    const fileId = await findSyncFileId(accessToken);
    if (!fileId) return null;

    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Erreur download Drive", err);
    return null;
  }
}
