import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { CodeOfConductDocument, CodeOfConductSectionSummary } from "../lib/types";

export function CodeOfConductPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["code-of-conduct"],
    queryFn: () => api.get<{ document: CodeOfConductDocument; sections: CodeOfConductSectionSummary[] }>("/code-of-conduct"),
  });

  if (isLoading) return <p className="text-sm text-ink-muted">Loading…</p>;
  if (error || !data) return <p className="text-sm text-red-600">Couldn't load the Code of Conduct.</p>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between gap-3 mb-1">
        <h1 className="font-display font-bold text-xl">Code of Conduct</h1>
        <Link to="/code-of-conduct/history" className="text-sm text-accent hover:underline whitespace-nowrap mt-1">
          Version History
        </Link>
      </div>
      <p className="text-sm text-ink-muted mb-4">
        Version {data.document?.version ?? "—"} · {data.document?.version_date ?? "—"}
      </p>
      <div className="card !p-0 overflow-hidden">
        {data.sections.map((s, i) => (
          <Link
            key={s.id}
            to={`/code-of-conduct/${s.id}`}
            className={`flex items-center justify-between px-4 py-3 text-sm hover:bg-surface-2 ${
              i !== data.sections.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <span>
              <span className="text-ink-faint font-mono text-xs mr-2">{s.sort_order}.</span>
              {s.title}
            </span>
            <span className="text-accent">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
