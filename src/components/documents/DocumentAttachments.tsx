import { useRef, useState } from "react";
import { Paperclip, Trash2, FileText, Download, Loader2 } from "lucide-react";
import { useData } from "@/context/DataContext";
import { useUI } from "@/context/UIContext";
import { humanFileSize } from "@/services/storage";

interface Props {
  documentId: string;
  fileIds?: string[];
  subjectId?: string;
}

export function DocumentAttachments({ documentId, fileIds = [], subjectId }: Props) {
  // On utilise directement updateDocument au lieu des fonctions compliquées !
  const { data, addFile, deleteFile, readFile, updateDocument } = useData();
  const { notify } = useUI();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // État pour afficher un chargement pendant l'import
  const [isUploading, setIsUploading] = useState(false);

  const attachedFiles = (data.files || []).filter((f) => fileIds.includes(f.id));

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    notify("Importation en cours...");

    try {
      // On copie l'existant
      const newFileIds = [...fileIds];

      for (const file of files) {
        // Sauvegarde le fichier
        const record = await addFile(file, {
          subjectId: subjectId || null,
          category: "ATTACHMENT",
        });
        // Ajoute son ID à la liste
        newFileIds.push(record.id);
      }

      // Met à jour le document avec la liste officielle updateDocument
      updateDocument(documentId, { fileIds: newFileIds });

      notify(`${files.length} fichier(s) joint(s) avec succès !`);
    } catch (err) {
      console.error("Erreur lors de l'upload :", err);
      notify("Impossible d'ajouter les fichiers.", "error");
    } finally {
      setIsUploading(false);
      // Réinitialise l'input pour pouvoir importer à nouveau
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = async (fileId: string) => {
    try {
      // Retire l'ID de la liste du document
      updateDocument(documentId, { 
        fileIds: fileIds.filter((id) => id !== fileId) 
      });
      // Supprime le fichier
      await deleteFile(fileId);
      notify("Fichier retiré");
    } catch (err) {
      console.error(err);
      notify("Erreur lors de la suppression", "error");
    }
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
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-xl bg-[var(--accent)]/10 px-3 py-1.5 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Import...</>
          ) : (
            "+ Ajouter des documents"
          )}
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
