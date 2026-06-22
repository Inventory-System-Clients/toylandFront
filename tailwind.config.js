/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#FFD700",
          light: "#FFEB7A",
          dark: "#B29500",
        },
        secondary: {
          DEFAULT: "#800080",
          light: "#A259D9",
          dark: "#4B0053",
        },
        background: {
          dark: "#4B0053",
          light: "#F8F6FF",
        },
        accent: {
          yellow: "#FFD700",
          purple: "#800080",
          cream: "#FFEB7A",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
