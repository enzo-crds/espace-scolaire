import { useEffect, useState } from "react";
import { Modal } from "@/components/common/Modal";
import { Field, inputClass, btnPrimary, btnSecondary } from "@/components/common/FormField";
import { FileDrop } from "@/components/files/FileDrop";
import { useData } from "@/context/DataContext";
import { useUI } from "@/context/UIContext";
import type { DocKind } from "@/types";
import { convertDocxToHtml, isDocxFile } from "@/services/docx";
import { FileText, X, Wand2 } from "lucide-react";

interface NewDocumentModalProps {
  open: boolean;
  onClose: () => void;
  kind: DocKind;
  defaultSubjectId: string | null;
  defaultTab?: string;
  onCreated: (id: string) => void;
}

export function NewDocumentModal({ open, onClose, kind, defaultSubjectId, defaultTab, onCreated }: NewDocumentModalProps) {
  const { data, addDocument, addFile } = useData() as any;
  const { notify } = useUI();
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState(defaultSubjectId || "");
  const [description, setDescription] = useState("");
  const [chapter, setChapter] = useState("");
  const [tags, setTags] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [convertedHtml, setConvertedHtml] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle("");
      setSubjectId(defaultSubjectId || data.subjects[0]?.id || "");
      setDescription("");
      setChapter("");
      setTags("");
      setDate(new Date().toISOString().slice(0, 10));
      setPendingFile(null);
      setConvertedHtml(null);
    }
  }, [open, defaultSubjectId, data.subjects]);

  const handleConvert = async () => {
    if (!pendingFile) return;
    setConverting(true);
    try {
      const html = await convertDocxToHtml(pendingFile);
      setConvertedHtml(html);
      notify("Contenu importé dans l'éditeur");
    } catch {
      notify("Impossible de convertir ce fichier DOCX", "error");
    } finally {
      setConverting(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      notify("Le titre est obligatoire", "error");
      return;
    }
    if (!subjectId) {
      notify("Veuillez choisir une matière", "error");
      return;
    }
    if (kind === "fiche" && !pendingFile) {
      notify("L'ajout d'un fichier est obligatoire pour une fiche de révision", "error");
      return;
    }

    let fileId: string | undefined;
    if (pendingFile) {
      const record = await addFile(pendingFile, { subjectId, category: kind });
      fileId = record.id;
    }

    const doc = addDocument({
      kind,
      subjectId,
      tab: defaultTab || "Cours",
      title: title.trim(),
      description: description.trim(),
      chapter: chapter.trim() || undefined,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      content: convertedHtml || "",
      fileId,
      favorite: false,
    });

    notify(`${kind === "course" ? "Cours" : "Fiche"} créé(e) avec succès`);
    onClose();
    onCreated(doc.id);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={kind === "course" ? "Nouveau cours" : "Nouvelle fiche de révision"}
      size="lg"
      footer={
        <>
          <button className={btnSecondary} onClick={onClose}>Annuler</button>
          <button className={btnPrimary} onClick={handleSubmit}>Créer</button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Titre">
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex : Fonctions affines" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Matière">
            <select className={inputClass} value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="" disabled>Choisir…</option>
              {data.subjects.map((s: any) => (
                <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Date">
            <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Chapitre (optionnel)">
            <input className={inputClass} value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="Ex : Chapitre 2" />
          </Field>
          <Field label="Tags (séparés par des virgules)">
            <input className={inputClass} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="fonctions, chapitre 2" />
          </Field>
        </div>

        <Field label="Description (optionnel)">
          <textarea className={inputClass} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>

        <Field
          label={kind === "fiche" ? "Importer un fichier (obligatoire)" : "Importer un fichier (optionnel)"}
          hint={kind === "fiche" ? "PDF, DOCX, images, TXT requis." : "Formats acceptés : PDF, DOCX, images, TXT."}
        >
          {!pendingFile ? (
            <FileDrop onFile={setPendingFile} hint="PDF, DOCX, JPG, PNG, TXT" />
          ) : (
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-600 dark:bg-slate-800">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <FileText className="h-4 w-4" /> {pendingFile.name}
              </div>
              <div className="flex items-center gap-2">
                {isDocxFile(pendingFile) && (
                  <button
                    onClick={handleConvert}
                    disabled={converting}
                    className="flex items-center gap-1 rounded-lg bg-[var(--accent)]/10 px-2.5 py-1 text-xs font-medium text-[var(--accent)]"
                  >
                    <Wand2 className="h-3.5 w-3.5" /> {converting ? "Conversion…" : "Importer dans l'éditeur"}
                  </button>
                )}
                <button onClick={() => { setPendingFile(null); setConvertedHtml(null); }} className="text-slate-400 hover:text-rose-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </Field>
        {convertedHtml && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            Contenu du DOCX prêt à être importé dans l'éditeur.
          </p>
        )}
      </div>
    </Modal>
  );
}
