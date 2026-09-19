import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Search, ArrowLeft, Star, Trash2, FileText } from "lucide-react";
import { useData } from "@/context/DataContext";
import { useUI } from "@/context/UIContext";
import type { DocKind } from "@/types";
import { EmptyState } from "@/components/common/EmptyState";
import { SubjectModal } from "@/components/subjects/SubjectModal";
import { NewDocumentModal } from "./NewDocumentModal";
import { btnPrimary, btnSecondary } from "@/components/common/FormField";

interface DocumentsPageProps {
  kind: DocKind;
}

const LABELS: Record<DocKind, { title: string; singular: string; empty: string }> = {
  course: { title: "Cours", singular: "cours", empty: "Aucun cours pour le moment." },
  fiche: { title: "Fiches de révision", singular: "fiche", empty: "Aucune fiche de révision pour le moment." },
};

export function DocumentsPage({ kind }: DocumentsPageProps) {
  const { data, deleteDocument, updateDocument } = useData();
  const { confirm, notify } = useUI();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const subjectId = params.get("matiere");
  const [search, setSearch] = useState("");
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [newDocOpen, setNewDocOpen] = useState(false);

  useEffect(() => {
    const state = location.state as { openNew?: boolean; openSubject?: boolean } | null;
    if (state?.openNew) {
      if (data.subjects.length === 0) setSubjectModalOpen(true);
      else setNewDocOpen(true);
    }
    if (state?.openSubject) setSubjectModalOpen(true);
    if (state) navigate(location.pathname + location.search, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const label = LABELS[kind];
  const docs = data.documents.filter((d) => d.kind === kind);

  const subjectsWithCount = data.subjects.map((s) => ({
    subject: s,
    count: docs.filter((d) => d.subjectId === s.id).length,
  }));

  const filteredDocs = useMemo(() => {
    let list = docs;
    if (subjectId) list = list.filter((d) => d.subjectId === subjectId);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q)) ||
          d.description.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [docs, subjectId, search]);

  const selectedSubject = data.subjects.find((s) => s.id === subjectId);

  const handleDelete = async (id: string, title: string) => {
    const ok = await confirm({
      title: `Supprimer « ${title} » ?`,
      message: "Cette action est irréversible.",
      danger: true,
      confirmLabel: "Supprimer",
    });
    if (ok) {
      deleteDocument(id);
      notify(`${label.singular === "cours" ? "Cours" : "Fiche"} supprimé(e)`);
    }
  };

  // --- Vue "liste des matières" ---
  if (!subjectId) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{label.title}</h1>
            <p className="mt-1 text-sm text-slate-400">Organisez vos {label.singular}s par matière.</p>
          </div>
          <div className="flex gap-2">
            <button className={btnSecondary} onClick={() => setSubjectModalOpen(true)}>
              <Plus className="h-4 w-4" /> Matière
            </button>
            <button
              className={btnPrimary}
              onClick={() => {
                if (data.subjects.length === 0) {
                  notify("Créez d'abord une matière", "warning");
                  setSubjectModalOpen(true);
                  return;
                }
                setNewDocOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> Nouveau {label.singular}
            </button>
          </div>
        </div>

        {data.subjects.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-6 w-6" />}
            title="Aucune matière créée"
            description="Créez votre première matière pour commencer à organiser vos contenus."
            action={
              <button className={btnPrimary} onClick={() => setSubjectModalOpen(true)}>
                <Plus className="h-4 w-4" /> Créer une matière
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {subjectsWithCount.map(({ subject, count }) => (
              <button
                key={subject.id}
                onClick={() => setParams({ matiere: subject.id })}
                className="card-hover flex flex-col items-start gap-3 rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm dark:border-slate-800 dark:bg-slate-800"
              >
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-xl"
                  style={{ background: `${subject.color}20` }}
                >
                  {subject.icon}
                </span>
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-100">{subject.name}</p>
                  <p className="text-xs text-slate-400">
                    {count} {label.singular}
                    {count > 1 ? "s" : ""}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        <SubjectModal open={subjectModalOpen} onClose={() => setSubjectModalOpen(false)} />
        <NewDocumentModal
          open={newDocOpen}
          onClose={() => setNewDocOpen(false)}
          kind={kind}
          defaultSubjectId={subjectId}
          onCreated={(id) => navigate(`/${kind === "course" ? "cours" : "fiches"}/${id}`)}
        />
      </div>
    );
  }

  // --- Vue "documents d'une matière" ---
  return (
    <div className="space-y-6">
      <button
        onClick={() => setParams({})}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400"
      >
        <ArrowLeft className="h-4 w-4" /> Toutes les matières
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl text-xl" style={{ background: `${selectedSubject?.color}20` }}>
            {selectedSubject?.icon}
          </span>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{selectedSubject?.name}</h1>
            <p className="text-sm text-slate-400">{filteredDocs.length} {label.singular}(s)</p>
          </div>
        </div>
        <button className={btnPrimary} onClick={() => setNewDocOpen(true)}>
          <Plus className="h-4 w-4" /> Nouveau {label.singular}
        </button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Rechercher un(e) ${label.singular}, un tag…`}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[var(--accent)] dark:border-slate-700 dark:bg-slate-800"
        />
      </div>

      {filteredDocs.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title={label.empty}
          description={`Créez votre premier(ère) ${label.singular} pour cette matière.`}
          action={
            <button className={btnPrimary} onClick={() => setNewDocOpen(true)}>
              <Plus className="h-4 w-4" /> Nouveau {label.singular}
            </button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="card-hover group flex cursor-pointer flex-col gap-2 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-800"
              onClick={() => navigate(`/${kind === "course" ? "cours" : "fiches"}/${doc.id}`)}
            >
              <div className="flex items-start justify-between">
                <h3 className="line-clamp-2 pr-2 text-sm font-semibold text-slate-800 dark:text-slate-100">{doc.title}</h3>
                <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateDocument(doc.id, { favorite: !doc.favorite });
                    }}
                    className="rounded-lg p-1 text-slate-300 hover:text-amber-400"
                  >
                    <Star className={`h-4 w-4 ${doc.favorite ? "fill-amber-400 text-amber-400" : ""}`} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(doc.id, doc.title);
                    }}
                    className="rounded-lg p-1 text-slate-300 hover:text-rose-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {doc.description && (
                <p className="line-clamp-2 text-xs text-slate-400">{doc.description}</p>
              )}
              <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
                {doc.tags.slice(0, 3).map((t) => (
                  <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                    #{t}
                  </span>
                ))}
                <span className="ml-auto text-[10px] text-slate-400">
                  {new Date(doc.updatedAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <NewDocumentModal
        open={newDocOpen}
        onClose={() => setNewDocOpen(false)}
        kind={kind}
        defaultSubjectId={subjectId}
        onCreated={(id) => navigate(`/${kind === "course" ? "cours" : "fiches"}/${id}`)}
      />
    </div>
  );
}
