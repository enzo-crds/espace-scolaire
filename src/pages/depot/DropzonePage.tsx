import { useState } from "react";
import { FolderDown, Trash2, Eye, Download } from "lucide-react";
import { useData } from "@/context/DataContext";
import { useUI } from "@/context/UIContext";
import { FileDrop } from "@/components/files/FileDrop";
import { FilePreviewModal } from "@/components/files/FilePreviewModal";
import { EmptyState } from "@/components/common/EmptyState";

export function DropzonePage() {
  const { data, addFile, deleteFile } = useData() as any;
  const { notify } = useUI();
  const [previewFile, setPreviewFile] = useState<any | null>(null);

  const depotFiles = data?.files?.filter((f: any) => f.category === "depot" || !f.category) || [];

  const handleFileUpload = async (file: File) => {
    if (!addFile) return;
    await addFile(file, { category: "depot" });
    notify(`Fichier « ${file.name} » ajouté au dépôt !`);
  };

  const handleDelete = (id: string, name: string) => {
    if (deleteFile) {
      deleteFile(id);
      notify(`Fichier « ${name} » supprimé`);
    }
  };

  const getFileSrc = (file: any) => file.dataUrl || file.url || file.content || "";

  const handleDownload = (file: any) => {
    const src = getFileSrc(file);
    if (!src) {
      notify("Lien de téléchargement non disponible, réimporte le fichier", "error");
      return;
    }
    const link = document.createElement("a");
    link.href = src;
    link.download = file.name || "fichier";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify(`Téléchargement de « ${file.name} » lancé`);
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Zone de dépôt / Transfert</h1>
        <p className="mt-1 text-sm text-slate-400">Dépose tes fichiers ici pour les stocker, les prévisualiser ou les récupérer.</p>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <FileDrop onFile={handleFileUpload} hint="Glisse un fichier ici ou clique pour l'importer" />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Fichiers stockés ({depotFiles.length})
        </h2>

        {depotFiles.length === 0 ? (
          <EmptyState
            icon={<FolderDown className="h-6 w-6" />}
            title="Aucun fichier dans le dépôt"
            description="Glisse un fichier ci-dessus pour commencer."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {depotFiles.map((file: any) => {
              const previewObj = { ...file, dataUrl: getFileSrc(file) };
              return (
                <div
                  key={file.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{file.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {file.size ? `${(file.size / 1024).toFixed(1)} Ko` : "Fichier"}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreviewFile(previewObj)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[var(--accent)] dark:hover:bg-slate-700"
                      title="Aperçu"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(file)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-emerald-500 dark:hover:bg-slate-700"
                      title="Télécharger"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(file.id, file.name)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-slate-700"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <FilePreviewModal
        open={!!previewFile}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />
    </div>
  );
}
