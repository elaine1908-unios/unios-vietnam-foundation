import { JD_COPY } from "../lib/jobDescriptionContent";
import type { JdLang } from "../lib/jobDescriptionContent";
import type { EmploymentType, JdCompetency, JdRequirement, JdResponsibility } from "../lib/types";

// Team Leads sometimes type multiple lines (or their own "- " bullets) into
// a single free-text field on the Job Profile form. Rendered as one flat
// run-on line that reads badly to a candidate, so: split on newlines, strip
// any leading bullet marker per line, and render as a real bulleted list
// whenever there's more than one line — a single line still renders plain.
function splitLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-*•·‣]\s+/, "").trim())
    .filter((line) => line.length > 0);
}

function MultilineText({
  text,
  listClassName = "list-disc list-inside pl-5 mt-1 flex flex-col gap-1",
}: {
  text: string;
  listClassName?: string;
}) {
  const lines = splitLines(text);
  if (lines.length === 0) return null;
  if (lines.length === 1) return <>{lines[0]}</>;
  return (
    <ul className={listClassName}>
      {lines.map((line, i) => (
        <li key={i}>{line}</li>
      ))}
    </ul>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="bg-accent-2 text-white text-sm font-display font-semibold px-3 py-2 rounded-t-md">{title}</h2>
      <div className="border border-t-0 border-border rounded-b-md">{children}</div>
    </div>
  );
}

export interface JobDescriptionContent {
  job_title: string;
  location: string;
  employment_type: EmploymentType;
  custom_benefits: string | null;
  responsibilities: JdResponsibility[];
  requirements: JdRequirement[];
  competencies: JdCompetency[];
}

// Shared by the internal detail page and the public careers page — both
// just fetch the (Vietnamese or translated) content differently and render
// it through here, so the two surfaces can never drift apart.
export function JobDescriptionBody({ lang, content }: { lang: JdLang; content: JobDescriptionContent }) {
  const c = JD_COPY[lang];
  return (
    <>
      <div className="card mb-6">
        <h2 className="font-display font-bold text-lg text-accent-2 mb-3">{c.heading}</h2>
        {c.intro.map((paragraph, i) => (
          <p key={i} className="text-sm text-ink-muted mb-3 last:mb-4">
            {paragraph}
          </p>
        ))}
        <p className="text-sm font-medium bg-surface-2 border border-border rounded-md p-3">
          {c.calloutPrefix} {content.job_title} {c.calloutJoiner} {content.location}
        </p>
      </div>

      <Section title={c.generalInfoTitle}>
        <ul className="text-sm px-3 py-2 list-disc list-inside flex flex-col gap-1">
          {c.generalInfo.map((item) => (
            <li key={item.text}>
              {item.text}
              {item.children && (
                <ul className="list-[circle] list-inside pl-5 mt-1 flex flex-col gap-1">
                  {item.children.map((child) => (
                    <li key={child}>{child}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </Section>

      <Section title={c.roleTitle}>
        {content.responsibilities.length === 0 ? (
          <p className="px-3 py-3 text-sm text-ink-muted">{c.pending}</p>
        ) : (
          <ul className="text-sm px-3 py-2 list-disc list-inside flex flex-col gap-2">
            {content.responsibilities.map((r, i) => (
              <li key={i}>
                <span className="font-medium">{r.main_function}:</span>{" "}
                <MultilineText text={r.responsibilities} listClassName="list-[circle] list-inside pl-5 mt-1 flex flex-col gap-1" />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={c.requirementsTitle}>
        {content.requirements.length === 0 ? (
          <p className="px-3 py-3 text-sm text-ink-muted">{c.pending}</p>
        ) : (
          <ol className="text-sm">
            {content.requirements.map((r, i) => (
              <li key={i} className="flex border-b border-border last:border-0">
                <span className="w-10 shrink-0 bg-surface-2 px-3 py-2 font-medium">{i + 1}</span>
                <span className="px-3 py-2">{r.requirement}</span>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section title={c.competenciesTitle}>
        {content.competencies.length === 0 ? (
          <p className="px-3 py-3 text-sm text-ink-muted">{c.pending}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2 text-left text-ink-muted">
                <th className="px-3 py-2 font-medium w-1/4">{c.competencyHeaders[0]}</th>
                <th className="px-3 py-2 font-medium w-1/5">{c.competencyHeaders[1]}</th>
                <th className="px-3 py-2 font-medium">{c.competencyHeaders[2]}</th>
              </tr>
            </thead>
            <tbody>
              {content.competencies.map((comp, i) => (
                <tr key={i} className="border-b border-border last:border-0 align-top">
                  <td className="px-3 py-2">{comp.skill}</td>
                  <td className="px-3 py-2">{comp.level || "—"}</td>
                  <td className="px-3 py-2">{comp.requirement ? <MultilineText text={comp.requirement} /> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title={c.benefitsTitle}>
        {content.employment_type === "part_time" ? (
          content.custom_benefits ? (
            <div className="text-sm px-3 py-2">
              <MultilineText text={content.custom_benefits} />
            </div>
          ) : (
            <p className="px-3 py-3 text-sm text-ink-muted">{c.pending}</p>
          )
        ) : (
          <ul className="text-sm px-3 py-2 list-disc list-inside flex flex-col gap-2">
            {c.benefits.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
