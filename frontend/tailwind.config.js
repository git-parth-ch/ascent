/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#0B0F19",
          card: "#151B2C",
          border: "#1F293D",
          text: "#F3F4F6",
          muted: "#9CA3AF"
        },
        brand: {
          primary: "#6366F1",
          secondary: "#4F46E5",
          danger: "#EF4444",
          warning: "#F59E0B",
          success: "#10B981"
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      }
    },
  },
  plugins: [],
}
