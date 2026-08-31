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
        surface: "#FFFFFF",
        "surface-2": "#F7F7F7",
        border: "#E5E5E5",
        bg: "#F2F2F2",
      },
    },
  },
  plugins: [],
};
