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
        brand: {
          50: "#f0f7ff",
          100: "#e0effe",
          200: "#bae0fd",
          300: "#7cc8fb",
          400: "#36aaf5",
          500: "#0c8ee6",
          600: "#0070c4",
          700: "#0159a0",
          800: "#064b84",
          900: "#0b3f6e",
          950: "#072849",
        },
        sidebar: {
          DEFAULT: "#0f172a",
          foreground: "#f8fafc",
          muted: "#94a3b8",
          accent: "#1e293b",
          border: "#1e293b",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
