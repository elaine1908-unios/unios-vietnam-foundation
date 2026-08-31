import React from "react";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Document, Page, View, Text, StyleSheet, Font } from "@react-pdf/renderer";
import { UniosLogo } from "./UniosLogo.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Mark Pro is the Unios brand face — registered here (rather than using the
// built-in Helvetica) because the source Performance Profile documents are
// bilingual and Helvetica's standard encoding silently drops Vietnamese
// diacritics (e.g. "Hạng mục" renders as "H¡ng måc"). This is the same SVN
// cut the web app uses for the same reason — see web/tailwind.config.js.
// .ttf, not the .woff2 the web app serves: @react-pdf/renderer's font
// embedding silently produced invisible glyphs with the .woff2 (text was
// still selectable/extractable — only the visible outlines were empty),
// confirmed by rendering the output through macOS Quick Look. Converted
// once with fontTools (`TTFont(...).flavor = None; .save(...)`).
Font.register({
  family: "Mark Pro",
  fonts: [
    { src: join(__dirname, "../../assets/fonts/MarkPro-Regular.ttf"), fontWeight: "normal" },
    { src: join(__dirname, "../../assets/fonts/MarkPro-Bold.ttf"), fontWeight: "bold" },
  ],
});

// Brand tokens lifted from web/tailwind.config.js so the PDF matches the app.
const BRAND = {
  accent: "#1139F5",
  accent2: "#081D49",
  ink: "#111111",
  inkMuted: "#4D4D4D",
  border: "#E5E5E5",
  surface2: "#F7F7F7",
};

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, color: BRAND.ink, fontFamily: "Mark Pro" },
  headerBar: {
    backgroundColor: BRAND.accent2,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { color: "#FFFFFF", fontSize: 16, fontFamily: "Mark Pro", fontWeight: "bold" },
  headerSubtitle: { color: "#C9D3EC", fontSize: 10, marginTop: 2 },
  sectionTitle: {
    backgroundColor: BRAND.accent2,
    color: "#FFFFFF",
    fontSize: 9,
    fontFamily: "Mark Pro", fontWeight: "bold",
    padding: 5,
    marginTop: 14,
    marginBottom: 4,
  },
  table: { borderWidth: 1, borderColor: BRAND.border },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: BRAND.border },
  rowLast: { flexDirection: "row" },
  cellLabel: {
    width: "28%",
    padding: 5,
    backgroundColor: BRAND.surface2,
    fontFamily: "Mark Pro", fontWeight: "bold",
    borderRightWidth: 1,
    borderRightColor: BRAND.border,
  },
  cellValue: { width: "72%", padding: 5 },
  th: {
    padding: 5,
    backgroundColor: BRAND.accent2,
    color: "#FFFFFF",
    fontFamily: "Mark Pro", fontWeight: "bold",
    borderRightWidth: 1,
    borderRightColor: "#FFFFFF",
  },
  td: { padding: 5, borderRightWidth: 1, borderRightColor: BRAND.border },
  tdLast: { padding: 5 },
  reqRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: BRAND.border },
  reqNum: {
    width: 20,
    padding: 5,
    backgroundColor: BRAND.surface2,
    fontFamily: "Mark Pro", fontWeight: "bold",
    borderRightWidth: 1,
    borderRightColor: BRAND.border,
  },
  reqText: { flex: 1, padding: 5 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 32,
    right: 32,
    borderTopWidth: 1,
    borderTopColor: BRAND.border,
    paddingTop: 6,
    fontSize: 7,
    color: BRAND.inkMuted,
  },
  watermark: {
    position: "absolute",
    fontSize: 13,
    color: "#C4CBEA",
    opacity: 0.55,
    transform: "rotate(-30deg)",
  },
});

export interface Responsibility {
  main_function: string;
  responsibilities: string;
  success_criteria?: string | null;
}
export interface Requirement {
  requirement: string;
}
export interface Okr {
  objective: string;
  key_results: string;
}
export interface Competency {
  skill: string;
  level?: string | null;
  requirement?: string | null;
}
export type ProfileLang = "vi" | "en";

// Section titles are bilingual in the original (e.g. "Thông tin chung
// (General information)"), matching the source PP Site.pdf template. The
// English-only view/PDF (see routes/profiles.ts's /:id/translate) just shows
// the English half — the content itself is swapped by the caller passing
// already-translated `profile` data, not by this component.
const SECTION_TITLES = {
  vi: {
    general: "Thông tin chung (General information)",
    responsibilities: "Hạng mục công việc chính (Key responsibilities)",
    requirements: "Yêu cầu tối thiểu (Essential requirements)",
    okrs: "Mục tiêu & kết quả chính (OKRs)",
    cb: "Chính sách phúc lợi (C&B)",
    competencies: "Kỹ năng chủ đạo (Competencies)",
  },
  en: {
    general: "General information",
    responsibilities: "Key responsibilities",
    requirements: "Essential requirements",
    okrs: "OKRs",
    cb: "Compensation & Benefits",
    competencies: "Competencies",
  },
};

export interface ProfileForPdf {
  job_title: string;
  rank?: string | null;
  division?: string | null;
  function?: string | null;
  location?: string | null;
  last_updated?: string | null;
  compensation?: string | null;
  benefits?: string | null;
  bonuses?: string | null;
  responsibilities: Responsibility[];
  requirements: Requirement[];
  okrs: Okr[];
  competencies: Competency[];
}

// Tiled across the page so no section can be cropped/screenshotted without
// carrying at least one copy of who downloaded this and when.
function Watermark({ line1, line2 }: { line1: string; line2: string }) {
  const positions = [
    { top: 90, left: -20 },
    { top: 260, left: 120 },
    { top: 430, left: -40 },
    { top: 600, left: 140 },
    { top: 770, left: -10 },
  ];
  return (
    <>
      {positions.map((pos, i) => (
        <View key={i} style={[styles.watermark, { top: pos.top, left: pos.left }]} fixed>
          <Text>{line1}</Text>
          <Text>{line2}</Text>
        </View>
      ))}
    </>
  );
}

export function ProfileDocument({
  profile,
  downloadedByName,
  downloadedByEmail,
  downloadedAt,
  lang = "vi",
}: {
  profile: ProfileForPdf;
  downloadedByName: string;
  downloadedByEmail: string;
  downloadedAt: string;
  lang?: ProfileLang;
}) {
  const t = SECTION_TITLES[lang];
  const generalInfo: [string, string][] = [
    ["Job title", profile.job_title],
    ["Rank", profile.rank || "—"],
    ["Division", profile.division || "—"],
    ["Function", profile.function || "—"],
    ["Location", profile.location || "—"],
    ["Last updated", profile.last_updated || "—"],
  ];
  const cb: [string, string][] = [
    ["Compensation", profile.compensation || "—"],
    ["Benefits", profile.benefits || "—"],
    ["Bonuses & dependencies", profile.bonuses || "—"],
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Watermark line1="CONFIDENTIAL — DO NOT REDISTRIBUTE" line2={`${downloadedByName} · ${downloadedAt}`} />

        <View style={styles.headerBar}>
          <View>
            <Text style={styles.headerTitle}>Performance Profile</Text>
            <Text style={styles.headerSubtitle}>{profile.job_title}</Text>
          </View>
          <UniosLogo width={64} color="#FFFFFF" />
        </View>

        <Text style={styles.sectionTitle}>{t.general}</Text>
        <View style={styles.table}>
          {generalInfo.map(([label, value], i) => (
            <View style={i === generalInfo.length - 1 ? styles.rowLast : styles.row} key={label}>
              <Text style={styles.cellLabel}>{label}</Text>
              <Text style={styles.cellValue}>{value}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{t.responsibilities}</Text>
        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={[styles.th, { width: "25%" }]}>Main function</Text>
            <Text style={[styles.th, { width: "40%" }]}>Responsibilities</Text>
            <Text style={[styles.th, { width: "35%", borderRightWidth: 0 }]}>Success criteria</Text>
          </View>
          {profile.responsibilities.length === 0 ? (
            <Text style={styles.tdLast}>No responsibilities defined yet.</Text>
          ) : (
            profile.responsibilities.map((r, i) => (
              <View
                style={i === profile.responsibilities.length - 1 ? styles.rowLast : styles.row}
                key={i}
                wrap={false}
              >
                <Text style={[styles.td, { width: "25%" }]}>{r.main_function}</Text>
                <Text style={[styles.td, { width: "40%" }]}>{r.responsibilities}</Text>
                <Text style={[styles.tdLast, { width: "35%" }]}>{r.success_criteria || "—"}</Text>
              </View>
            ))
          )}
        </View>

        <Text style={styles.sectionTitle}>{t.requirements}</Text>
        <View style={styles.table}>
          {profile.requirements.length === 0 ? (
            <Text style={styles.tdLast}>No essential requirements defined yet.</Text>
          ) : (
            profile.requirements.map((r, i) => (
              <View style={i === profile.requirements.length - 1 ? styles.reqRow : styles.reqRow} key={i} wrap={false}>
                <Text style={styles.reqNum}>{i + 1}</Text>
                <Text style={styles.reqText}>{r.requirement}</Text>
              </View>
            ))
          )}
        </View>

        <Text style={styles.sectionTitle}>{t.okrs}</Text>
        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={[styles.th, { width: "35%" }]}>Objective</Text>
            <Text style={[styles.th, { width: "65%", borderRightWidth: 0 }]}>Key results</Text>
          </View>
          {profile.okrs.length === 0 ? (
            <Text style={styles.tdLast}>No OKRs defined yet.</Text>
          ) : (
            profile.okrs.map((o, i) => (
              <View style={i === profile.okrs.length - 1 ? styles.rowLast : styles.row} key={i} wrap={false}>
                <Text style={[styles.td, { width: "35%" }]}>{o.objective}</Text>
                <Text style={[styles.tdLast, { width: "65%" }]}>{o.key_results}</Text>
              </View>
            ))
          )}
        </View>

        <Text style={styles.sectionTitle}>{t.cb}</Text>
        <View style={styles.table}>
          {cb.map(([label, value], i) => (
            <View style={i === cb.length - 1 ? styles.rowLast : styles.row} key={label}>
              <Text style={styles.cellLabel}>{label}</Text>
              <Text style={styles.cellValue}>{value}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{t.competencies}</Text>
        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={[styles.th, { width: "25%" }]}>Skill</Text>
            <Text style={[styles.th, { width: "20%" }]}>Level</Text>
            <Text style={[styles.th, { width: "55%", borderRightWidth: 0 }]}>Requirement</Text>
          </View>
          {profile.competencies.length === 0 ? (
            <Text style={styles.tdLast}>No competencies defined yet.</Text>
          ) : (
            profile.competencies.map((c, i) => (
              <View style={i === profile.competencies.length - 1 ? styles.rowLast : styles.row} key={i} wrap={false}>
                <Text style={[styles.td, { width: "25%" }]}>{c.skill}</Text>
                <Text style={[styles.td, { width: "20%" }]}>{c.level || "—"}</Text>
                <Text style={[styles.tdLast, { width: "55%" }]}>{c.requirement || "—"}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.footer} fixed>
          <Text>
            This Performance Profile may be updated at any time. For enquiries, please contact your Line Manager or
            People &amp; Culture. This document is confidential, remains the property of Unios Vietnam, and must not
            be distributed externally without prior written approval.
          </Text>
          <Text style={{ marginTop: 3 }}>
            Downloaded by {downloadedByName} ({downloadedByEmail}) on {downloadedAt}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
