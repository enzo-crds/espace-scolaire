import { useState } from "react";
import { Plus, CheckCircle2, Circle, Trash2, Calendar, FileText, AlertCircle } from "lucide-react";
import { useData } from "@/context/DataContext";
import { useUI } from "@/context/UIContext";
import type { TaskKind, SchoolTask } from "@/types";
import { EmptyState } from "@/components/common/EmptyState";
import { Modal } from "@/components/common/Modal";
import { Field, inputClass, btnPrimary, btnSecondary } from "@/components/common/FormField";
import { FileDrop } from "@/components/files/FileDrop";

export function TasksPage() {
  const { data, addFile } = useData() as any;
  const { notify } = useUI();
  const [tasks, setTasks] = useState<SchoolTask[]>([]);
  const [filter, setFilter] = useState<"all" | "devoir" | "eval">("all");
  const [openModal, setOpenModal] = useState(false);

  // Form state
  const [kind, setKind] = useState<TaskKind>("devoir");
  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const handleCreate = async () => {
    if (!title.trim() || !subjectId || !dueDate) {
      notify("Remplis tous les champs obligatoires", "error");
      return;
    }

    let fileId: string | undefined;
    if (pendingFile && addFile) {
      const rec = await addFile(pendingFile, { subjectId, category: kind });
      fileId = rec.id;
    }

    const newTask: SchoolTask = {
      id: crypto.randomUUID(),
      kind,
      subjectId,
      title: title.trim(),
      dueDate,
      fileId,
      completed: false,
    };

    setTasks((prev) => [newTask, ...prev]);
    notify(`${kind === "eval" ? "Évaluation" : "Devoir"} planifié(e) !`);
    setOpenModal(false);
    setTitle("");
    setPendingFile(null);
  };

  const toggleComplete = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const deletetask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    notify("Élément supprimé");
  };

  const filteredTasks = tasks
    .filter((t) => (filter === "all" ? true : t.kind === filter))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Devoirs & Évaluations</h1>
          <p className="mt-1 text-sm text-slate-400">Gère tes échéances, contrôles et fichiers associés.</p>
        </div>
        <button className={btnPrimary} onClick={() => setOpenModal(true)}>
          <Plus className="h-4 w-4" /> Planifier
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-2">
        {(["all", "devoir", "eval"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
              filter === f ? "bg-[var(--accent)] text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {f === "all" ? "Tous" : f === "devoir" ? "Devoirs" : "Évaluations 🎯"}
          </button>
        ))}
      </div>

      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-6 w-6" />}
          title="Aucun planning pour le moment"
          description="Ajoute un devoir ou une éval pour le 7 octobre par exemple."
          action={<button className={btnPrimary} onClick={() => setOpenModal(true)}><Plus className="h-4 w-4" /> Ajouter</button>}
        />
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => {
            const subject = data.subjects?.find((s: any) => s.id === task.subjectId);
            return (
              <div
                key={task.id}
                className={`flex items-center justify-between rounded-2xl border p-4 transition bg-white dark:bg-slate-800 ${
                  task.completed ? "opacity-60 border-slate-100 dark:border-slate-800" : "border-slate-200 dark:border-slate-700 shadow-sm"
                }`}
              >
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleComplete(task.id)} className="text-slate-400 hover:text-[var(--accent)]">
                    {task.completed ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5" />}
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                        task.kind === "eval" ? "bg-rose-500/10 text-rose-500" : "bg-blue-500/10 text-blue-500"
                      }`}>
                        {task.kind === "eval" ? "Éval" : "Devoir"}
                      </span>
                      {subject && (
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {subject.icon} {subject.name}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm font-semibold mt-0.5 ${task.completed ? "line-through text-slate-400" : "text-slate-800 dark:text-slate-100"}`}>
                      {task.title}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
                      <Calendar className="h-3.5 w-3.5" /> {new Date(task.dueDate).toLocaleDateString("fr-FR")}
                    </span>
                    {task.fileId && (
                      <span className="text-[10px] text-[var(--accent)] flex items-center justify-end gap-1 mt-0.5">
                        <FileText className="h-3 w-3" /> Fichier joint
                      </span>
                    )}
                  </div>
                  <button onClick={() => deletetask(task.id)} className="text-slate-300 hover:text-rose-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modale d'ajout */}
      <Modal open={openModal} onClose={() => setOpenModal(false)} title="Planifier un devoir ou une éval" size="md">
        <div className="space-y-4">
          <Field label="Type">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setKind("devoir")}
                className={`rounded-xl py-2 text-xs font-semibold border ${kind === "devoir" ? "border-blue-500 bg-blue-500/10 text-blue-500" : "border-slate-200 dark:border-slate-700"}`}
              >
                Devoir / Exo
              </button>
              <button
                type="button"
                onClick={() => setKind("eval")}
                className={`rounded-xl py-2 text-xs font-semibold border ${kind === "eval" ? "border-rose-500 bg-rose-500/10 text-rose-500" : "border-slate-200 dark:border-slate-700"}`}
              >
                Évaluation (Contrôle)
              </button>
            </div>
          </Field>

          <Field label="Matière">
            <select className={inputClass} value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="" disabled>Choisir une matière…</option>
              {data.subjects?.map((s: any) => (
                <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Intitulé (ex: Réviser proportionnalité / Ex 4 p 112)">
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre..." />
          </Field>

          <Field label="Pour quand ? (Date)">
            <input type="date" className={inputClass} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>

          <Field label="Fichier associé (optionnel)">
            {!pendingFile ? (
              <FileDrop onFile={setpendingFileOrSet} hint="PDF, sujet, cours..." />
            ) : (
              <div className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg dark:bg-slate-800">
                <span>{pendingFile.name}</span>
                <button onClick={() => setPendingFile(null)} className="text-rose-500">Retirer</button>
              </div>
            )}
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <button className={btnSecondary} onClick={() => setOpenModal(false)}>Annuler</button>
            <button className={btnPrimary} onClick={handleCreate}>Enregistrer</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
