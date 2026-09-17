import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import DOMPurify from "dompurify";
import { api, ApiError } from "../lib/api";
import type { CodeOfConductSectionDetail } from "../lib/types";
import { useAuth } from "../auth/AuthProvider";

type Lang = "vi" | "en";

function ToolbarButton({
  onClick,
  active,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`rounded px-2 py-1 text-sm font-medium ${active ? "bg-accent-soft text-accent" : "text-ink-muted hover:bg-surface-2"}`}
    >
      {children}
    </button>
  );
}

// Keyed by lang from the caller so switching language while editing remounts
// this with the other language's content — TipTap's `content` prop only
// seeds the initial document, it isn't reactive on its own.
function Editor({ content, onChange }: { content: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: "prose-cc min-h-[300px] px-3 py-2 focus:outline-none" },
    },
  });

  if (!editor) return null;

  return (
    <div className="border border-border rounded-md">
      <div className="flex flex-wrap items-center gap-1 border-b border-border px-2 py-1">
        <ToolbarButton title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          B
        </ToolbarButton>
        <ToolbarButton title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          I
        </ToolbarButton>
        <ToolbarButton
          title="Heading"
          active={editor.isActive("heading", { level: 4 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        >
          H
        </ToolbarButton>
        <ToolbarButton title="Paragraph" active={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()}>
          P
        </ToolbarButton>
        <ToolbarButton
          title="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          •—
        </ToolbarButton>
        <ToolbarButton
          title="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1.
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

function LangToggle({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="flex rounded-md border border-border overflow-hidden text-sm shrink-0">
      <button
        className={`px-3 py-1.5 ${lang === "vi" ? "bg-accent text-white" : "bg-surface text-ink-muted"}`}
        onClick={() => setLang("vi")}
        type="button"
      >
        Tiếng Việt
      </button>
      <button
        className={`px-3 py-1.5 ${lang === "en" ? "bg-accent text-white" : "bg-surface text-ink-muted"}`}
        onClick={() => setLang("en")}
        type="button"
      >
        English
      </button>
    </div>
  );
}

export function CodeOfConductSectionPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canEdit = user?.capabilities.includes("codeofconduct.edit") ?? false;
  const [lang, setLang] = useState<Lang>("vi");
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [contentEn, setContentEn] = useState("");
  const [contentVi, setContentVi] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: section, isLoading, error: loadError } = useQuery({
    queryKey: ["code-of-conduct", "section", id],
    queryFn: () => api.get<CodeOfConductSectionDetail>(`/code-of-conduct/sections/${id}`),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (section) {
      setTitle(section.title);
      setContentEn(section.content_en);
      setContentVi(section.content_vi);
    }
  }, [section]);

  if (isLoading) return <p className="text-sm text-ink-muted">Loading…</p>;
  if (loadError || !section) return <p className="text-sm text-red-600">Couldn't load this section.</p>;

  function startEdit() {
    setTitle(section!.title);
    setContentEn(section!.content_en);
    setContentVi(section!.content_vi);
    setError(null);
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await api.patch(`/code-of-conduct/sections/${id}`, { title, content_en: contentEn, content_vi: contentVi });
      await queryClient.invalidateQueries({ queryKey: ["code-of-conduct"] });
      setEditing(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  const viewContent = lang === "vi" ? section.content_vi : section.content_en;

  return (
    <div className="max-w-3xl">
      <Link to="/code-of-conduct" className="text-sm text-accent hover:underline">
        ← Code of Conduct
      </Link>
      <div className="flex items-start justify-between gap-3 mt-1 mb-1">
        {editing ? (
          <input className="input font-display font-bold text-xl !p-1" value={title} onChange={(e) => setTitle(e.target.value)} />
        ) : (
          <h1 className="font-display font-bold text-xl">{section.title}</h1>
        )}
        <div className="flex items-center gap-2 shrink-0">
          <LangToggle lang={lang} setLang={setLang} />
          {canEdit && !editing && (
            <button className="btn-secondary" onClick={startEdit} type="button">
              Edit
            </button>
          )}
        </div>
      </div>
      <p className="text-sm text-ink-muted mb-4">
        Version {section.document.version} · {section.document.version_date}
        {section.updated_by_name && (
          <>
            {" "}
            · last edited by {section.updated_by_name} on {section.updated_at.slice(0, 10)}
          </>
        )}
      </p>

      {editing ? (
        <>
          {lang === "vi" ? (
            <Editor key="vi" content={contentVi} onChange={setContentVi} />
          ) : (
            <Editor key="en" content={contentEn} onChange={setContentEn} />
          )}
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          <div className="flex gap-2 mt-3">
            <button className="btn-primary" onClick={save} disabled={saving} type="button">
              {saving ? "Saving…" : "Save"}
            </button>
            <button className="btn-secondary" onClick={() => setEditing(false)} disabled={saving} type="button">
              Cancel
            </button>
          </div>
        </>
      ) : (
        <div className="prose-cc card" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(viewContent) }} />
      )}
    </div>
  );
}
