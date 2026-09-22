/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // UniNest design system — emerald + dark navy on light gray
        // (ported from the web app's OKLCH tokens in src/styles.css)
        background: "#FAFAFA",
        foreground: "#1B2436",
        card: "#FFFFFF",
        "card-foreground": "#1B2436",
        primary: {
          DEFAULT: "#149A6B",
          glow: "#22B587",
          foreground: "#FCFCFC",
        },
        secondary: {
          DEFAULT: "#1B2A4A",
          foreground: "#FCFCFC",
        },
        muted: {
          DEFAULT: "#F1F2F5",
          foreground: "#697182",
        },
        accent: {
          DEFAULT: "#E3F6EC",
          foreground: "#215240",
        },
        destructive: {
          DEFAULT: "#D6362E",
          foreground: "#FCFCFC",
        },
        success: {
          DEFAULT: "#149A6B",
          foreground: "#FCFCFC",
        },
        warning: {
          DEFAULT: "#E3A730",
          foreground: "#1B2436",
        },
        border: "#E7E8EC",
        input: "#EBECF0",
        ring: "#149A6B",
      },
      dark: {
        background: "#0F172A",
        foreground: "#E5E7EB",
        card: "#1E293B",
        "card-foreground": "#E5E7EB",
        primary: {
          DEFAULT: "#22B587",
          glow: "#4ADE80",
          foreground: "#0F172A",
        },
        secondary: {
          DEFAULT: "#334155",
          foreground: "#F8FAFC",
        },
        muted: {
          DEFAULT: "#1E293B",
          foreground: "#94A3B8",
        },
        accent: {
          DEFAULT: "#14532D",
          foreground: "#86EFAC",
        },
        destructive: {
          DEFAULT: "#F87171",
          foreground: "#0F172A",
        },
        success: {
          DEFAULT: "#4ADE80",
          foreground: "#0F172A",
        },
        warning: {
          DEFAULT: "#FBBF24",
          foreground: "#0F172A",
        },
        border: "#334155",
        input: "#334155",
        ring: "#22B587",
      },
      borderRadius: {
        xl: "16px",
        "2xl": "20px",
      },
    },
  },
  plugins: [],
};
