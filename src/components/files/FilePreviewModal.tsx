import { useState, useEffect } from "react";
import { Modal } from "@/components/common/Modal";
import { Download, AlertCircle } from "lucide-react";

interface FilePreviewProps {
  open: boolean;
  onClose: () => void;
  file?: {
    name: string;
    url?: string;
    dataUrl?: string;
    type?: string;
  } | null;
}

export function FilePreviewModal({ open, onClose, file }: FilePreviewProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [file]);

  if (!file) return null;

  const src = file.dataUrl || file.url || "";
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name) || file.type?.startsWith("image/");
  const isPdf = /\.pdf$/i.test(file.name) || file.type === "application/pdf";

  return (
    <Modal open={open} onClose={onClose} title={file.name} size="xl">
      <div className="space-y-4">
        <div className="flex justify-end">
          <a
            href={src}
            download={file.name}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
          >
            <Download className="h-3.5 w-3.5" /> Télécharger
          </a>
        </div>

        <div className="flex max-h-[72vh] items-center justify-center overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-900">
          {isImage ? (
            imgError ? (
              <div className="flex flex-col items-center gap-2 p-8 text-center text-sm text-slate-500">
                <AlertCircle className="h-8 w-8 text-rose-500" />
                <p>Aperçu indisponible (URL de l'image invalide ou expirée après rechargement).</p>
                <a href={src} download={file.name} className="text-xs text-[var(--accent)] underline">
                  Télécharger le fichier pour le voir
                </a>
              </div>
            ) : (
              <img
                src={src}
                alt={file.name}
                className="max-h-[65vh] object-contain rounded-lg"
                onError={() => setImgError(true)}
              />
            )
          ) : isPdf ? (
            <iframe src={src} title={file.name} className="h-[65vh] w-full rounded-lg border-0" />
          ) : (
            <div className="p-8 text-center text-sm text-slate-500">
              Aperçu direct non disponible pour ce format. Utilise le bouton de téléchargement.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
