/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: {
          deep: "hsl(var(--bg-deep) / <alpha-value>)",
          surface: "hsl(var(--bg-surface) / <alpha-value>)",
          elevated: "hsl(var(--bg-elevated) / <alpha-value>)",
        },
        brand: {
          primary: "hsl(var(--brand-primary) / <alpha-value>)",
          secondary: "hsl(var(--brand-secondary) / <alpha-value>)",
        },
        text: {
          primary: "hsl(var(--text-primary) / <alpha-value>)",
          muted: "hsl(var(--text-muted) / <alpha-value>)",
          darker: "hsl(var(--text-darker) / <alpha-value>)",
        },
        border: {
          subtle: "hsl(var(--border-subtle) / <alpha-value>)",
        }
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      }
    },
  },
  plugins: [],
}
