import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Main Background Colors
        navy: {
          DEFAULT: "#07111F",
          dark: "#090E1A",
          light: "#0F172A",
          card: "rgba(255, 255, 255, 0.06)",
        },
        // Primary Accent Colors
        cyan: {
          DEFAULT: "#22D3EE",
          glow: "#22D3EE",
          dark: "#0891B2",
          light: "#67E8F9",
        },
        purple: {
          DEFAULT: "#8B5CF6",
          glow: "#8B5CF6",
          dark: "#7C3AED",
          light: "#A78BFA",
        },
        // Premium Gold
        gold: {
          DEFAULT: "#FACC15",
          rank: "#FACC15",
          dark: "#CA8A04",
          light: "#FDE047",
        },
        // Semantic Colors
        success: {
          DEFAULT: "#22C55E",
          green: "#22C55E",
        },
        error: {
          DEFAULT: "#EF4444",
          red: "#EF4444",
        },
        warning: {
          DEFAULT: "#F97316",
        },
        // Text Colors
        text: {
          white: "#F8FAFC",
          gray: "#94A3B8",
          muted: "#64748B",
        },
        // Border Colors
        border: {
          glass: "rgba(255, 255, 255, 0.12)",
        }
      },
      fontFamily: {
        bangla: [
          "var(--font-hind-siliguri)",
          "var(--font-outfit)",
          "sans-serif",
        ],
        outfit: ["var(--font-outfit)", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      boxShadow: {
        "glow-purple": "0 0 20px rgba(139, 92, 246, 0.3)",
        "glow-cyan": "0 0 20px rgba(34, 211, 238, 0.3)",
        "glow-gold": "0 0 25px rgba(250, 204, 21, 0.3)",
        "glow-green": "0 0 20px rgba(34, 197, 94, 0.3)",
        "glow-red": "0 0 20px rgba(239, 68, 68, 0.3)",
        "glow-live": "0 0 30px rgba(239, 68, 68, 0.4)",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.8" },
          "50%": { opacity: "1", transform: "scale(1.02)" },
        }
      },
      animation: {
        fadeIn: "fadeIn 0.3s ease-out forwards",
        pulseGlow: "pulseGlow 2s infinite ease-in-out",
      }
    },
  },
  plugins: [],
};
export default config;
