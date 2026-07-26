import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}","./components/**/*.{js,ts,jsx,tsx}","./lib/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // SPC Ocean Palette (statt cs-Carestone-Grün — gleiche Rolle im Design-System)
        "spc-dark":    "#0a3d5c",      // Analog cs-dark — Hero, Buttons, Primary
        "spc-mid":     "#0a6db8",      // Analog cs-green — Primary Accent, Highlights
        "spc-light":   "#7db3d9",      // Analog cs-light — Muted Accent
        "spc-lighter": "#e0edf7",      // Analog cs-lighter — Hover, subtle Highlights
        "spc-gold":    "#e8b247",      // Analog cs-gold — Special Prize, Winner accent
        "spc-goldDeep":"#7a5e1c",      // Analog cs-goldDeep — Chips
        "spc-red":     "#e0524e",      // Analog cs-red — Warnings, Errors
        "spc-greyLight": "#f5f7fa",    // Analog cs-greyLight — Muted BG
        "spc-section": "#eef4f8",      // Section-Hintergrund (analog cs-section)
        // System-Farben
        success: "#34c759", warn: "#ff9500", danger: "#e0524e",
        ink: "#1c1c1e", "ink-2": "#48484a", "ink-3": "#8e8e93", "ink-4": "#c7c7cc",
      },
      fontFamily: {
        sans: ["-apple-system","BlinkMacSystemFont",'"SF Pro Text"','"Helvetica Neue"',"Helvetica","Arial","sans-serif"],
      },
      boxShadow: {
        spc: "0 6px 24px -8px rgba(10, 61, 92, 0.20)",
        "spc-sm": "0 2px 8px -2px rgba(10, 61, 92, 0.12)",
      },
      backgroundImage: {
        "spc-gradient": "linear-gradient(90deg, #0a3d5c 0%, #0a6db8 100%)",
        "spc-gradient-mid": "linear-gradient(90deg, #2a6a8e 0%, #7db3d9 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
