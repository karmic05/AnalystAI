import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-formal)", "Source Serif 4", "Georgia", "serif"],
        formal: ["var(--font-formal)", "Source Serif 4", "Georgia", "serif"],
        display: ["var(--font-display)", "Bricolage Grotesque", "system-ui", "sans-serif"],
        script: ["var(--font-script)", "Dancing Script", "cursive"],
        mono: ["var(--font-mono)", "Space Mono", "ui-monospace", "monospace"],
      },
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        "surface-3": "var(--surface-3)",
        elevated: "var(--bg-elev)",
        ink: "var(--text)",
        muted: "var(--text-dim)",
        line: "var(--border)",
        cyan: "var(--cyan)",
        magenta: "var(--magenta)",
        purple: "var(--purple)",
        neon: "var(--green)",
        amber: "var(--amber)",
      },
      backgroundImage: {
        "brand-gradient": "var(--brand-gradient)",
        "brand-gradient-soft": "var(--brand-gradient-soft)",
      },
      boxShadow: {
        neu: "var(--neu-raised)",
        "neu-inset": "var(--neu-inset)",
        "neu-sm": "var(--neu-raised-sm)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        glow: "0 8px 30px color-mix(in srgb, var(--cyan) 16%, transparent)",
        "glow-magenta": "0 8px 30px color-mix(in srgb, var(--magenta) 16%, transparent)",
        "glow-purple": "0 8px 30px color-mix(in srgb, var(--purple) 20%, transparent)",
      },
      keyframes: {
        blink: { "0%,49%": { opacity: "1" }, "50%,100%": { opacity: "0" } },
        scan: { "0%": { transform: "translateY(-100%)" }, "100%": { transform: "translateY(100%)" } },
        floaty: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
        flicker: {
          "0%,19%,21%,23%,25%,54%,56%,100%": { opacity: "1" },
          "20%,24%,55%": { opacity: "0.4" },
        },
        sweep: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        "gradient-pan": {
          "0%,100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        blink: "blink 1.05s step-end infinite",
        scan: "scan 6s linear infinite",
        floaty: "floaty 6s ease-in-out infinite",
        flicker: "flicker 3s linear infinite",
        sweep: "sweep 2.5s linear infinite",
        "gradient-pan": "gradient-pan 6s ease infinite",
        "fade-up": "fade-up 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
