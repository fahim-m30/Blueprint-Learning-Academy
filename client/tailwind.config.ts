import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#060a11",
        darkPanel: "#101c2e",
        darkBorder: "#2e4666",
        brandAmber: "#ffb531",
        brandBlue: "#7fb8ea",
        brandBlueDark: "#3a7bb8",
        brandBkash: "#e2136e",
        brandNagad: "#f7941d",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
