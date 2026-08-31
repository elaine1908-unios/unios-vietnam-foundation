import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set. See server/.env.example.");
  }
  if (!client) client = new Anthropic({ apiKey });
  return client;
}

function model(): string {
  return process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";
}

export interface TextField {
  label: string;
  text: string;
}

export interface GrammarIssue {
  label: string;
  issue: string;
  suggestion: string;
}

function toolUseInput<T>(response: Anthropic.Message, toolName: string): T | null {
  const block = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === toolName,
  );
  return block ? (block.input as T) : null;
}

// Conservative on purpose: flags only fields it's confident have a genuine
// spelling/grammar/punctuation problem, not style preferences or proper
// nouns/acronyms/job titles — this is an advisory scan (see routes/grammar.ts
// and the edit-page "warn, don't block" behavior), so false positives are
// worse than the occasional miss.
export async function scanGrammar(fields: TextField[]): Promise<GrammarIssue[]> {
  const nonEmpty = fields.filter((f) => f.text?.trim());
  if (nonEmpty.length === 0) return [];

  const response = await getClient().messages.create({
    model: model(),
    max_tokens: 2000,
    system:
      "You are a careful copy editor reviewing short fields from an HR / recruiting document, written in Vietnamese, English, or a mix. Flag only fields with a genuine spelling, grammar, or punctuation problem — never stylistic preferences, and never proper nouns, acronyms, company/brand names, or job titles. Be conservative: when unsure, don't report it.",
    messages: [
      {
        role: "user",
        content: `Review these fields:\n\n${nonEmpty.map((f, i) => `[${i}] (${f.label}): ${f.text}`).join("\n\n")}`,
      },
    ],
    tools: [
      {
        name: "report_issues",
        description: "Report the spelling/grammar/punctuation issues found, if any.",
        input_schema: {
          type: "object",
          properties: {
            issues: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  index: { type: "integer", description: "the [n] index of the field this issue is about" },
                  issue: { type: "string", description: "brief description of the problem" },
                  suggestion: { type: "string", description: "a corrected version of the field's text" },
                },
                required: ["index", "issue", "suggestion"],
              },
            },
          },
          required: ["issues"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "report_issues" },
  });

  const parsed = toolUseInput<{ issues: { index: number; issue: string; suggestion: string }[] }>(
    response,
    "report_issues",
  );
  if (!parsed) return [];
  return parsed.issues
    .filter((i) => nonEmpty[i.index])
    .map((i) => ({ label: nonEmpty[i.index].label, issue: i.issue, suggestion: i.suggestion }));
}

// Returns a label -> English text map. Caller-provided labels must be unique
// within one call. Fields already in English are expected to come back
// unchanged rather than mangled.
export async function translateFields(fields: TextField[]): Promise<Record<string, string>> {
  const nonEmpty = fields.filter((f) => f.text?.trim());
  if (nonEmpty.length === 0) return {};

  const response = await getClient().messages.create({
    model: model(),
    max_tokens: 4000,
    system:
      "You translate short fields from a Vietnamese (or mixed Vietnamese/English) HR / recruiting document into natural, professional English. Preserve meaning precisely — don't summarize or embellish. If a field is already in English, return it unchanged. Never translate proper nouns, company/brand names, or acronyms.",
    messages: [
      {
        role: "user",
        content: `Translate each field to English:\n\n${nonEmpty.map((f, i) => `[${i}] (${f.label}): ${f.text}`).join("\n\n")}`,
      },
    ],
    tools: [
      {
        name: "provide_translations",
        description: "Provide the English translation for every field, in the same order given.",
        input_schema: {
          type: "object",
          properties: {
            translations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  index: { type: "integer" },
                  text: { type: "string" },
                },
                required: ["index", "text"],
              },
            },
          },
          required: ["translations"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "provide_translations" },
  });

  const parsed = toolUseInput<{ translations: { index: number; text: string }[] }>(response, "provide_translations");
  if (!parsed) throw new Error("Translation failed: Claude did not return a result.");
  const result: Record<string, string> = {};
  for (const t of parsed.translations) {
    const field = nonEmpty[t.index];
    if (field) result[field.label] = t.text;
  }
  return result;
}
