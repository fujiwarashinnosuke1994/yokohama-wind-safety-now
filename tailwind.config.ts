import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bay: {
          50: "#eefdf9",
          100: "#d4f7ef",
          500: "#0f766e",
          700: "#115e59"
        },
        safety: {
          amber: "#b45309",
          red: "#b91c1c"
        }
      },
      boxShadow: {
        soft: "0 24px 70px rgba(15, 40, 35, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
