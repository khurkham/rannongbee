/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f7f4",
          100: "#dcefe6",
          200: "#b8dfcf",
          300: "#8ac7b3",
          400: "#5caa92",
          500: "#3f8e78",
          600: "#2f7161",
          700: "#285b4f",
          800: "#214a41",
          900: "#1b3d36"
        }
      }
    },
  },
  plugins: [],
};
