import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";

interface PublicJobDescriptionSummary {
  id: string;
  location: string;
  job_title: string;
  division: string | null;
  function: string | null;
  updated_at: string;
}

export function PublicCareersListPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["public-job-descriptions"],
    queryFn: () => api.get<PublicJobDescriptionSummary[]>("/public/job-descriptions"),
  });

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-accent-2 mb-2">Now Hiring</h1>
      <p className="text-sm text-ink-muted mb-6">Open positions at Unios Vietnam.</p>

      {isLoading && <p className="text-sm text-ink-muted">Loading…</p>}
      {error && <p className="text-sm text-red-600">Couldn't load open positions.</p>}
      {data && data.length === 0 && <p className="text-sm text-ink-muted">No open positions right now — check back soon.</p>}

      {data && data.length > 0 && (
        <div className="flex flex-col gap-3">
          {data.map((jd) => (
            <Link
              key={jd.id}
              to={`/careers/${jd.id}`}
              className="card block hover:border-accent transition-colors"
            >
              <p className="font-display font-semibold text-ink">{jd.job_title}</p>
              <p className="text-sm text-ink-muted mt-0.5">
                {jd.location}
                {jd.division && ` · ${jd.division}`}
                {jd.function && ` — ${jd.function}`}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
