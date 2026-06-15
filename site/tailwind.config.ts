import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        dragon: {
          bg: "#07090f",
          panel: "#10141f",
          line: "#263042",
          emerald: "#28f6a1",
          violet: "#8e5cff",
          cyan: "#33d6ff"
        }
      },
      boxShadow: {
        neon: "0 0 0 1px rgba(40,246,161,.24), 0 22px 70px rgba(12,18,32,.55)",
        violet: "0 0 0 1px rgba(142,92,255,.28), 0 18px 60px rgba(46,28,102,.32)"
      }
    }
  },
  plugins: []
};

export default config;
