import { useRef } from "react";
import { Paperclip, Trash2, FileText, Download } from "lucide-react";
import { useData } from "@/context/DataContext";
import { useUI } from "@/context/UIContext";
import { humanFileSize } from "@/services/storage";

interface Props {
  documentId: string;
  fileIds?: string[];
  subjectId: string;
}

export function DocumentAttachments({ documentId, fileIds = [], subjectId }: Props) {
  const { data, addFile, deleteFile, readFile, setData, saveAppData } = useData();
  const { notify } = useUI();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const attachedFiles = (data.files || []).filter((f) => fileIds.includes(f.id));

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      const newFileIds: string[] = [];

      for (const file of files) {
        const record = await addFile(file, {
          subjectId,
          category: "ATTACHMENT",
        });
        newFileIds.push(record.id);
      }

      const updatedDocs = data.documents.map((doc) => {
        if (doc.id !== documentId) return doc;
        return {
          ...doc,
          fileIds: Array.from(new Set([...(doc.fileIds || []), ...newFileIds])),
          updatedAt: Date.now(),
        };
      });

      const newAppData = { ...data, documents: updatedDocs };
      setData(newAppData);
      await saveAppData(newAppData);

      notify(`${files.length} fichier(s) ajouté(s)`);
    } catch {
      notify("Erreur lors de l'ajout des fichiers", "error");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = async (fileId: string) => {
    const updatedDocs = data.documents.map((doc) => {
      if (doc.id !== documentId) return doc;
      return {
        ...doc,
        fileIds: (doc.fileIds || []).filter((id) => id !== fileId),
        updatedAt: Date.now(),
      };
    });

    const newAppData = { ...data, documents: updatedDocs };
    setData(newAppData);
    await saveAppData(newAppData);
    await deleteFile(fileId);
    notify("Fichier retiré");
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    const blob = await readFile(fileId);
    if (!blob) return notify("Impossible de lire le fichier", "error");

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
          <Paperclip className="h-4 w-4 text-[var(--accent)]" /> Fichiers joints ({attachedFiles.length})
        </h4>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-xl bg-[var(--accent)]/10 px-3 py-1.5 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 transition"
        >
          + Ajouter des documents
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {attachedFiles.length === 0 ? (
        <p className="text-xs text-slate-400 italic">Aucun document joint à ce cours / fiche.</p>
      ) : (
        <div className="space-y-2">
          {attachedFiles.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-white p-2.5 text-xs shadow-sm dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                <div className="truncate">
                  <p className="font-medium text-slate-700 dark:text-slate-200 truncate">{f.name}</p>
                  <p className="text-[10px] text-slate-400">{humanFileSize(f.size)}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownload(f.id, f.name)}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                  title="Télécharger"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(f.id)}
                  className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  title="Supprimer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
