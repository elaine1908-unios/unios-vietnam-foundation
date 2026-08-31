// Fixed company boilerplate shared by every Job Description — kept in sync
// with server/src/pdf/JobDescriptionDocument.tsx (the PDF export), since the
// on-screen detail page and the downloadable PDF should read identically.
// The English copy is a direct human translation, not machine-generated —
// it's static content, so there's no reason to call the API for it.

export interface JdGeneralInfoItem {
  text: string;
  // A nested sub-list, e.g. the office address list under "Văn phòng:".
  children?: string[];
}

export const JD_COPY = {
  vi: {
    heading: "Thay đổi cách thế giới nhìn nhận chiếu sáng cùng Unios®",
    // Two paragraphs, rendered separately.
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
    ] as JdGeneralInfoItem[],
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
    ] as JdGeneralInfoItem[],
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
  },
} as const;

export type JdLang = keyof typeof JD_COPY;
