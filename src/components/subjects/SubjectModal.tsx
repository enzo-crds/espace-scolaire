import { useEffect, useState } from "react";
import { Modal } from "@/components/common/Modal";
import { Field, inputClass, btnPrimary, btnSecondary } from "@/components/common/FormField";
import type { Subject } from "@/types";
import { SUBJECT_COLORS, SUBJECT_ICONS } from "@/types";
import { useData } from "@/context/DataContext";
import { useUI } from "@/context/UIContext";

interface SubjectModalProps {
  open: boolean;
  onClose: () => void;
  subject?: Subject | null;
}

export function SubjectModal({ open, onClose, subject }: SubjectModalProps) {
  const { addSubject, updateSubject } = useData();
  const { notify } = useUI();
  const [name, setName] = useState("");
  const [color, setColor] = useState(SUBJECT_COLORS[0]);
  const [icon, setIcon] = useState(SUBJECT_ICONS[0]);

  useEffect(() => {
    if (open) {
      setName(subject?.name || "");
      setColor(subject?.color || SUBJECT_COLORS[Math.floor(Math.random() * SUBJECT_COLORS.length)]);
      setIcon(subject?.icon || SUBJECT_ICONS[Math.floor(Math.random() * SUBJECT_ICONS.length)]);
    }
  }, [open, subject]);

  const handleSubmit = () => {
    if (!name.trim()) {
      notify("Le nom de la matière est obligatoire", "error");
      return;
    }
    const payload = { name: name.trim(), color, icon, coefficient: 1 };
    if (subject) {
      updateSubject(subject.id, payload);
      notify("Matière modifiée");
    } else {
      addSubject(payload);
      notify("Matière créée avec succès");
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={subject ? "Modifier la matière" : "Nouvelle matière"}
      footer={
        <>
          <button className={btnSecondary} onClick={onClose}>Annuler</button>
          <button className={btnPrimary} onClick={handleSubmit}>{subject ? "Enregistrer" : "Créer"}</button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Nom de la matière">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Mathématiques" />
        </Field>

        <Field label="Couleur">
          <div className="flex flex-wrap gap-2">
            {SUBJECT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`h-7 w-7 rounded-full border-2 transition ${color === c ? "border-slate-900 dark:border-white" : "border-transparent"}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </Field>

        <Field label="Icône">
          <div className="flex flex-wrap gap-2">
            {SUBJECT_ICONS.map((ic) => (
              <button
                key={ic}
                onClick={() => setIcon(ic)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition ${
                  icon === ic ? "border-[var(--accent)] bg-[var(--accent)]/10" : "border-slate-200 dark:border-slate-600"
                }`}
              >
                {ic}
              </button>
            ))}
          </div>
        </Field>
      </div>
    </Modal>
  );
}
