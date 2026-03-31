/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    ["'Plus Jakarta Sans'", "sans-serif"],
        display: ["'Plus Jakarta Sans'", "sans-serif"],
        mono:    ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        primary: {
          DEFAULT: "#2563eb",
          hover:   "#1d4ed8",
          light:   "#eff6ff",
        },
        success: {
          DEFAULT: "#16a34a",
          light:   "#dcfce7",
        },
        danger: {
          DEFAULT: "#dc2626",
          light:   "#fee2e2",
        },
        warn: {
          DEFAULT: "#d97706",
          light:   "#fef3c7",
        },
        info: {
          light: "#dbeafe",
        },
        sidebar: {
          bg:     "#111827",
          border: "#1f2937",
          text:   "#9ca3af",
        },
        surface: {
          DEFAULT: "#f4f6f9",
          2:       "#eef0f5",
        },
      },
      borderRadius: {
        card:  "12px",
        modal: "16px",
      },
      boxShadow: {
        card:  "0 1px 3px rgba(0,0,0,0.06)",
        modal: "0 20px 60px rgba(0,0,0,0.18)",
      },
    },
  },
  plugins: [],
};
