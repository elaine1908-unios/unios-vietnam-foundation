import React from "react";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Document, Page, View, Text, StyleSheet, Font } from "@react-pdf/renderer";
import { UniosLogo } from "./UniosLogo.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Same Mark Pro TTF as ProfileDocument.tsx — see that file's comment for why
// TTF (not the browser-served WOFF2) is what actually renders visible
// glyphs, and why the font matters at all: Vietnamese diacritics.
Font.register({
  family: "Mark Pro",
  fonts: [
    { src: join(__dirname, "../../assets/fonts/MarkPro-Regular.ttf"), fontWeight: "normal" },
    { src: join(__dirname, "../../assets/fonts/MarkPro-Bold.ttf"), fontWeight: "bold" },
  ],
});

const BRAND = {
  accent: "#1139F5",
  accent2: "#081D49",
  ink: "#111111",
  inkMuted: "#4D4D4D",
  border: "#E5E5E5",
  surface2: "#F7F7F7",
};

const styles = StyleSheet.create({
  // paddingBottom is well beyond the top/side padding: the footer below is
  // `fixed` (pinned to every page, not part of normal document flow), so
  // react-pdf's own pagination doesn't know to leave room for it — without
  // this, long content's last lines land underneath the footer text instead
  // of flowing onto a new page. Confirmed by rendering actual multi-page
  // output, not just previewing page 1.
  page: { padding: 32, paddingBottom: 70, fontSize: 9.5, color: BRAND.ink, fontFamily: "Mark Pro", lineHeight: 1.4 },
  headerBar: {
    backgroundColor: BRAND.accent2,
    padding: 16,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  heading: { fontSize: 17, fontFamily: "Mark Pro", fontWeight: "bold", color: BRAND.accent2, marginBottom: 10 },
  paragraph: { marginBottom: 10, color: BRAND.inkMuted },
  callout: {
    backgroundColor: BRAND.surface2,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 3,
    padding: 10,
    marginBottom: 16,
    fontFamily: "Mark Pro",
    fontWeight: "bold",
    color: BRAND.ink,
  },
  sectionTitle: {
    backgroundColor: BRAND.accent2,
    color: "#FFFFFF",
    fontSize: 9.5,
    fontFamily: "Mark Pro",
    fontWeight: "bold",
    padding: 5,
    marginTop: 12,
    marginBottom: 4,
  },
  table: { borderWidth: 1, borderColor: BRAND.border },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: BRAND.border },
  rowLast: { flexDirection: "row" },
  th: {
    padding: 5,
    backgroundColor: BRAND.accent2,
    color: "#FFFFFF",
    fontFamily: "Mark Pro",
    fontWeight: "bold",
    borderRightWidth: 1,
    borderRightColor: "#FFFFFF",
  },
  td: { padding: 5, borderRightWidth: 1, borderRightColor: BRAND.border },
  tdLast: { padding: 5 },
  bulletRow: { flexDirection: "row", marginBottom: 4 },
  bulletMark: { width: 12, color: BRAND.accent },
  bulletText: { flex: 1 },
  reqRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: BRAND.border },
  reqNum: {
    width: 20,
    padding: 5,
    backgroundColor: BRAND.surface2,
    fontFamily: "Mark Pro",
    fontWeight: "bold",
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
});

// Fixed company boilerplate — the same for every Job Description in a given
// language. Only the job title / division / function / location come from
// the linked profile (and are separately machine-translated — see
// server/src/translation.ts — when lang="en"). The English copy here is a
// direct human translation of the Vietnamese, not machine-generated: it's
// static content, so there's no reason to call the API for it. Keep this in
// sync with web/src/lib/jobDescriptionContent.ts.
const COPY = {
  vi: {
    heading: "Thay đổi cách thế giới nhìn nhận chiếu sáng cùng Unios®",
    intro: [
      "Tại Unios®, chúng tôi mong muốn xây dựng một thương hiệu xứng đáng với sự tin tưởng của khách hàng, và một môi trường làm việc xứng đáng với sự tin tưởng của con người Unios.",
      "Sứ mệnh này của chúng tôi đã và đang được đồng hành bởi hơn 50 nhân viên của Unios tại Việt Nam, và hơn 200 nhân viên của Unios trên toàn khu vực châu Á Thái Bình Dương.",
    ],
    calloutPrefix: "Nếu bạn muốn đồng hành cùng chúng tôi trên hành trình này, chúng tôi đang tìm kiếm vị trí",
    calloutJoiner: "tại khu vực",
    generalInfoTitle: "Thông tin tổng quan",
    generalInfo: [
      { text: "Giờ làm việc: 8:00AM - 5:00PM" },
      { text: "Ngày làm việc: thứ 2 - thứ 6" },
      { text: "Ngày nghỉ: thứ 7, chủ nhật" },
      {
        text: "Văn phòng đại diện tại Việt Nam:",
        children: [
          "Unios HEC: 125 Hai Bà Trưng, phường Sài Gòn, TPHCM",
          "Unios Cityview (office only): 12 Mạc Đĩnh Chi, phường Sài Gòn, TPHCM",
          "Unios Hanoi: E2, Chelsea Residence, phố Trần Kim Xuyến, Yên Hoà, Hà Nội",
          "Unios Warehouse: Lô i, 4 Đường Số 6, Khu công nghiệp, Đức Hòa, Tây Ninh",
        ],
      },
    ],
    roleTitle: "Vai trò của bạn trong vị trí này",
    requirementsTitle: "Yêu cầu tối thiểu",
    competenciesTitle: "Kỹ năng chủ đạo",
    competencyHeaders: ["Kỹ năng", "Mức độ", "Yêu cầu"],
    benefitsTitle: "Phúc lợi dành cho bạn",
    benefits: [
      "Mức lương thưởng, phúc lợi rõ ràng, minh bạch, đi kèm chính sách tăng lương định kỳ.",
      "Đánh giá Performance Review thường niên vào mỗi tháng 7.",
      "Thưởng lễ, Tết & lương tháng 13.",
      "Làm việc tại một môi trường trẻ, năng động.",
      "Thiết bị làm việc được trang bị đầy đủ.",
      "Thưởng hiệu quả sau khi hoàn thành các dự án lớn.",
      "BHXH 100% lương, đi kèm thẻ BH sức khoẻ Premium và chương trình Wellness Program 2 lần/năm.",
      "Team building, End of Year get-together.",
      "Cơ hội đến thăm Headquarter của Unios tại Australia.",
    ],
    pending: "Đang cập nhật.",
    dash: "—",
  },
  en: {
    heading: "Changing how the world views lighting",
    intro: [
      "At Unios®, we want to build a brand worthy of our customers' trust, and a workplace worthy of the trust of Unios's people.",
      "This mission has been carried forward by more than 50 Unios employees in Vietnam, and more than 200 Unios employees across the Asia-Pacific region.",
    ],
    calloutPrefix: "If you'd like to join us on this journey, we're looking for a",
    calloutJoiner: "in",
    generalInfoTitle: "General information",
    generalInfo: [
      { text: "Working hours: 8:00AM - 5:00PM" },
      { text: "Working days: Monday - Friday" },
      { text: "Days off: Saturday, Sunday" },
      {
        text: "Representative offices in Vietnam:",
        children: [
          "Unios HEC: 125 Hai Ba Trung, Saigon Ward, HCMC",
          "Unios Cityview (office only): 12 Mac Dinh Chi, Saigon Ward, HCMC",
          "Unios Hanoi: E2, Chelsea Residence, Tran Kim Xuyen Street, Yen Hoa, Hanoi",
          "Unios Warehouse: Lot I, 4 Street No. 6, Industrial Park, Duc Hoa, Tay Ninh",
        ],
      },
    ],
    roleTitle: "Your role in this position",
    requirementsTitle: "Essential requirements",
    competenciesTitle: "Core competencies",
    competencyHeaders: ["Skill", "Level", "Requirement"],
    benefitsTitle: "Benefits for you",
    benefits: [
      "Clear, transparent compensation and benefits, along with a periodic salary review policy.",
      "Annual Performance Review conducted every July.",
      "Holiday and Tet bonuses, plus a 13th-month salary.",
      "Work in a young, dynamic environment.",
      "Fully equipped work tools and equipment.",
      "Performance bonus upon completion of major projects.",
      "Social insurance on 100% of salary, plus a Premium health insurance card and a Wellness Program twice a year.",
      "Team building, End of Year get-together.",
      "The opportunity to visit Unios's Headquarters in Australia.",
    ],
    pending: "Coming soon.",
    dash: "—",
  },
} as const;

export type JdLang = "vi" | "en";

export interface JdResponsibility {
  main_function: string;
  responsibilities: string;
}
export interface JdRequirement {
  requirement: string;
}
export interface JdCompetency {
  skill: string;
  level?: string | null;
  requirement?: string | null;
}
export interface JobDescriptionForPdf {
  job_title: string;
  location: string;
  responsibilities: JdResponsibility[];
  requirements: JdRequirement[];
  competencies: JdCompetency[];
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletMark}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

// Mirrors web/src/components/JobDescriptionBody.tsx's splitLines — Team
// Leads sometimes type multiple lines (or their own "- " bullets) into one
// free-text field; render each as its own bullet instead of one run-on line.
function splitLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-*•·‣]\s+/, "").trim())
    .filter((line) => line.length > 0);
}

export function JobDescriptionDocument({ jd, lang = "vi" }: { jd: JobDescriptionForPdf; lang?: JdLang }) {
  const c = COPY[lang];
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBar}>
          <UniosLogo width={64} color="#FFFFFF" />
        </View>

        <Text style={styles.heading}>{c.heading}</Text>
        {c.intro.map((paragraph, i) => (
          <Text key={i} style={styles.paragraph}>
            {paragraph}
          </Text>
        ))}
        <Text style={styles.callout}>
          {c.calloutPrefix} {jd.job_title} {c.calloutJoiner} {jd.location}
        </Text>

        <Text style={styles.sectionTitle}>{c.generalInfoTitle}</Text>
        <View>
          {c.generalInfo.map((item) => (
            <View key={item.text}>
              <Bullet>{item.text}</Bullet>
              {"children" in item &&
                item.children?.map((child) => (
                  <View key={child} style={[styles.bulletRow, { marginLeft: 14 }]}>
                    {/* "•" only — a hollow-circle glyph ("◦") isn't in the Mark
                        Pro font and silently rendered as "æ" (mojibake), caught
                        by rendering actual PDF output, not just previewing it. */}
                    <Text style={[styles.bulletMark, { color: BRAND.inkMuted }]}>•</Text>
                    <Text style={styles.bulletText}>{child}</Text>
                  </View>
                ))}
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{c.roleTitle}</Text>
        {jd.responsibilities.length === 0 ? (
          <Text>{c.pending}</Text>
        ) : (
          <View>
            {jd.responsibilities.map((r, i) => {
              const lines = splitLines(r.responsibilities);
              return (
                <View key={i}>
                  <Bullet>
                    <Text style={{ fontFamily: "Mark Pro", fontWeight: "bold" }}>{r.main_function}:</Text>
                    {lines.length <= 1 ? ` ${r.responsibilities}` : ""}
                  </Bullet>
                  {lines.length > 1 &&
                    lines.map((line, j) => (
                      <View key={j} style={[styles.bulletRow, { marginLeft: 14 }]}>
                        <Text style={[styles.bulletMark, { color: BRAND.inkMuted }]}>•</Text>
                        <Text style={styles.bulletText}>{line}</Text>
                      </View>
                    ))}
                </View>
              );
            })}
          </View>
        )}

        <Text style={styles.sectionTitle}>{c.requirementsTitle}</Text>
        <View style={styles.table}>
          {jd.requirements.length === 0 ? (
            <Text style={styles.tdLast}>{c.pending}</Text>
          ) : (
            jd.requirements.map((r, i) => (
              <View style={i === jd.requirements.length - 1 ? styles.reqRow : styles.reqRow} key={i} wrap={false}>
                <Text style={styles.reqNum}>{i + 1}</Text>
                <Text style={styles.reqText}>{r.requirement}</Text>
              </View>
            ))
          )}
        </View>

        <Text style={styles.sectionTitle}>{c.competenciesTitle}</Text>
        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={[styles.th, { width: "30%" }]}>{c.competencyHeaders[0]}</Text>
            <Text style={[styles.th, { width: "20%" }]}>{c.competencyHeaders[1]}</Text>
            <Text style={[styles.th, { width: "50%", borderRightWidth: 0 }]}>{c.competencyHeaders[2]}</Text>
          </View>
          {jd.competencies.length === 0 ? (
            <Text style={styles.tdLast}>{c.pending}</Text>
          ) : (
            jd.competencies.map((comp, i) => (
              <View style={i === jd.competencies.length - 1 ? styles.rowLast : styles.row} key={i} wrap={false}>
                <Text style={[styles.td, { width: "30%" }]}>{comp.skill}</Text>
                <Text style={[styles.td, { width: "20%" }]}>{comp.level || c.dash}</Text>
                <View style={[styles.tdLast, { width: "50%" }]}>
                  {(() => {
                    const lines = splitLines(comp.requirement || "");
                    if (lines.length <= 1) return <Text>{lines[0] ?? c.dash}</Text>;
                    return (
                      <>
                        {lines.map((line, j) => (
                          <Text key={j} style={j < lines.length - 1 ? { marginBottom: 3 } : undefined}>
                            • {line}
                          </Text>
                        ))}
                      </>
                    );
                  })()}
                </View>
              </View>
            ))
          )}
        </View>

        <Text style={styles.sectionTitle}>{c.benefitsTitle}</Text>
        <View>
          {c.benefits.map((line) => (
            <Bullet key={line}>{line}</Bullet>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Text>Unios Company Limited · (028) 3821 2927 · vietnam@unios.com · unios.com</Text>
          <Text>Floor 2, 125 Hai Ba Trung, Saigon Ward, HCMC</Text>
        </View>
      </Page>
    </Document>
  );
}
