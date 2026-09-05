/** @type {import('tailwindcss').Config} */
//
// Unios Design System — same tokens as po-so-tracker/web/tailwind.config.js,
// kept in sync deliberately so both internal tools read as one system.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Mark Pro"', '"Helvetica Neue"', "Arial", "sans-serif"],
        sans: ['"Mark Pro"', '"Helvetica Neue"', "Arial", "sans-serif"],
        mono: ['"Mark Pro"', '"Helvetica Neue"', "Arial", "sans-serif"],
      },
      colors: {
        ink: "#111111",
        "ink-muted": "#4D4D4D",
        "ink-faint": "#757575",
        accent: "#1139F5",
        "accent-soft": "#D9E5F8",
        "accent-hover": "#0023D9",
        "accent-2": "#081D49",
        "accent-2-soft": "#E7ECF7",
        // Semantic status colors — for meaning ("this needs attention",
        // "this is good news"), not brand decoration. Soft variants are a
        // ~14% tint over white, same ratio as accent-soft/accent-2-soft
        // above. Not (yet) mirrored in po-so-tracker's config.
        "status-positive": "#2E7D52",
        "status-positive-soft": "#E2EDE7",
        "status-warning": "#B9791F",
        "status-warning-soft": "#F5ECE0",
        "status-critical": "#C0392B",
        "status-critical-soft": "#F6E3E1",
        "status-info": "#2F6F8F",
        "status-info-soft": "#E2EBEF",
        surface: "#FFFFFF",
        "surface-2": "#F7F7F7",
        border: "#E5E5E5",
        bg: "#F2F2F2",
      },
    },
  },
  plugins: [],
};
