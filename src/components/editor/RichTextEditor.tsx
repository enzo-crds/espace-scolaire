import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import ImageExt from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import TextAlign from "@tiptap/extension-text-align";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Link as LinkIcon, Image as ImageIcon, Table as TableIcon,
  AlignLeft, AlignCenter, AlignRight, Undo2, Redo2, Minus, Highlighter, Search, IndentIncrease,
} from "lucide-react";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const TEXT_COLORS = ["#0f172a", "#dc2626", "#d97706", "#16a34a", "#2563eb", "#7c3aed", "#db2777"];
const HIGHLIGHT_COLORS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fbcfe8", "#fed7aa"];

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
        active
          ? "bg-[var(--accent)]/15 text-[var(--accent)]"
          : "text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      ImageExt.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({ placeholder: placeholder || "Commencez à écrire…" }),
      CharacterCount,
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose prose-slate dark:prose-invert max-w-none focus:outline-none min-h-[300px] prose-sm sm:prose-base",
      },
    },
  });

  // Met à jour le contenu si celui-ci change depuis l'extérieur (ex: chargement d'un autre document)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  if (!editor) return null;

  const addImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        editor.chain().focus().setImage({ src: reader.result as string }).run();
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const addLink = () => {
    const url = window.prompt("URL du lien :", "https://");
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  const runSearch = (dir: "next" | "prev") => {
    if (!searchTerm) return;
    const win = window as unknown as { find?: (s: string, c?: boolean, b?: boolean) => boolean };
    if (win.find) {
      win.find(searchTerm, false, dir === "prev");
    }
  };

  const words = editor.storage.characterCount?.words?.() ?? 0;
  const characters = editor.storage.characterCount?.characters?.() ?? 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-100 p-1.5 dark:border-slate-700">
        <ToolbarButton title="Titre 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton title="Titre 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton title="Titre 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="h-4 w-4" /></ToolbarButton>
        <span className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-600" />
        <ToolbarButton title="Gras (Ctrl+B)" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton title="Italique (Ctrl+I)" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton title="Souligné (Ctrl+U)" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton title="Barré" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="h-4 w-4" /></ToolbarButton>
        <span className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-600" />

        {/* Couleur du texte */}
        <div className="group relative">
          <ToolbarButton title="Couleur du texte" onClick={() => {}}>
            <span className="flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[10px] font-bold" style={{ color: editor.getAttributes("textStyle").color || undefined }}>A</span>
          </ToolbarButton>
          <div className="invisible absolute left-0 top-full z-20 mt-1 flex gap-1 rounded-lg border border-slate-200 bg-white p-1.5 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100 dark:border-slate-600 dark:bg-slate-700">
            {TEXT_COLORS.map((c) => (
              <button key={c} className="h-5 w-5 rounded-full border border-black/5" style={{ background: c }} onClick={() => editor.chain().focus().setColor(c).run()} />
            ))}
          </div>
        </div>

        {/* Surlignage */}
        <div className="group relative">
          <ToolbarButton title="Surligner" active={editor.isActive("highlight")} onClick={() => {}}>
            <Highlighter className="h-4 w-4" />
          </ToolbarButton>
          <div className="invisible absolute left-0 top-full z-20 mt-1 flex gap-1 rounded-lg border border-slate-200 bg-white p-1.5 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100 dark:border-slate-600 dark:bg-slate-700">
            {HIGHLIGHT_COLORS.map((c) => (
              <button key={c} className="h-5 w-5 rounded-full border border-black/5" style={{ background: c }} onClick={() => editor.chain().focus().toggleHighlight({ color: c }).run()} />
            ))}
          </div>
        </div>
        <span className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-600" />

        <ToolbarButton title="Liste à puces" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton title="Liste numérotée" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton title="Indenter (tableau imbriqué)" onClick={() => editor.chain().focus().sinkListItem("listItem").run()}><IndentIncrease className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton title="Citation" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-4 w-4" /></ToolbarButton>
        <span className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-600" />

        <ToolbarButton title="Aligner à gauche" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton title="Centrer" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton title="Aligner à droite" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight className="h-4 w-4" /></ToolbarButton>
        <span className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-600" />

        <ToolbarButton title="Lien" active={editor.isActive("link")} onClick={addLink}><LinkIcon className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton title="Image" onClick={addImage}><ImageIcon className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton title="Tableau" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><TableIcon className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton title="Séparateur" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="h-4 w-4" /></ToolbarButton>
        <span className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-600" />

        <ToolbarButton title="Annuler (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()}><Undo2 className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton title="Rétablir (Ctrl+Y)" onClick={() => editor.chain().focus().redo().run()}><Redo2 className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton title="Rechercher dans le document" active={showSearch} onClick={() => setShowSearch((s) => !s)}><Search className="h-4 w-4" /></ToolbarButton>
      </div>

      {showSearch && (
        <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 dark:border-slate-700">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch("next")}
            placeholder="Rechercher un mot dans le document…"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-[var(--accent)] dark:border-slate-600 dark:bg-slate-700"
          />
          <button onClick={() => runSearch("prev")} className="rounded-lg border border-slate-200 px-2 py-1 text-xs dark:border-slate-600">◀</button>
          <button onClick={() => runSearch("next")} className="rounded-lg border border-slate-200 px-2 py-1 text-xs dark:border-slate-600">▶</button>
        </div>
      )}

      <div ref={contentRef} className="px-4 py-3">
        <EditorContent editor={editor} />
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2 text-xs text-slate-400 dark:border-slate-700">
        <span>{words} mots · {characters} caractères</span>
      </div>
    </div>
  );
}
