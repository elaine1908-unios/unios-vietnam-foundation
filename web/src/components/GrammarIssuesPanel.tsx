import type { GrammarIssue } from "../lib/types";

// Advisory only, by design — see server/src/routes/grammar.ts. Shown above
// the form after a Save click finds issues; the same Save button proceeds
// on the next click regardless (the caller decides that, not this component).
export function GrammarIssuesPanel({ issues }: { issues: GrammarIssue[] }) {
  if (issues.length === 0) return null;
  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 p-4 mb-4">
      <p className="text-sm font-medium text-amber-900 mb-2">
        {issues.length} possible {issues.length === 1 ? "issue" : "issues"} found — review below, then click Save
        again to save anyway.
      </p>
      <ul className="flex flex-col gap-2">
        {issues.map((issue, i) => (
          <li key={i} className="text-sm text-amber-900">
            <span className="font-medium">{issue.label}:</span> {issue.issue}
            {issue.suggestion && (
              <>
                {" "}
                <span className="text-amber-700">— suggestion: "{issue.suggestion}"</span>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
