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
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
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
      boxShadow: {
        neu: "var(--neu-raised)",
        "neu-inset": "var(--neu-inset)",
        "neu-sm": "var(--neu-raised-sm)",
        glow: "0 0 24px rgba(34,211,238,0.18)",
        "glow-magenta": "0 0 24px rgba(255,61,166,0.18)",
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
      },
      animation: {
        blink: "blink 1.05s step-end infinite",
        scan: "scan 6s linear infinite",
        floaty: "floaty 6s ease-in-out infinite",
        flicker: "flicker 3s linear infinite",
        sweep: "sweep 2.5s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
