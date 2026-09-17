import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { CodeOfConductVersionHistoryEntry } from "../lib/types";

export function CodeOfConductVersionHistoryPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["code-of-conduct", "version-history"],
    queryFn: () => api.get<CodeOfConductVersionHistoryEntry[]>("/code-of-conduct/version-history"),
  });

  if (isLoading) return <p className="text-sm text-ink-muted">Loading…</p>;
  if (error || !data) return <p className="text-sm text-red-600">Couldn't load version history.</p>;

  return (
    <div className="max-w-3xl">
      <Link to="/code-of-conduct" className="text-sm text-accent hover:underline">
        ← Code of Conduct
      </Link>
      <h1 className="font-display font-bold text-xl mt-1 mb-4">Version History</h1>
      {data.length === 0 ? (
        <p className="text-sm text-ink-muted">No changes recorded yet.</p>
      ) : (
        <div className="card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2 text-left text-ink-muted">
                  <th className="px-3 py-2 font-medium">Version</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Section Changed</th>
                  <th className="px-3 py-2 font-medium">Changed By</th>
                  <th className="px-3 py-2 font-medium">Changed At</th>
                </tr>
              </thead>
              <tbody>
                {data.map((h) => (
                  <tr key={h.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 font-medium">{h.version}</td>
                    <td className="px-3 py-2 text-ink-muted">{h.version_date}</td>
                    <td className="px-3 py-2">{h.section_title}</td>
                    <td className="px-3 py-2 text-ink-muted">{h.changed_by_name ?? "—"}</td>
                    <td className="px-3 py-2 text-ink-muted">{h.changed_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
