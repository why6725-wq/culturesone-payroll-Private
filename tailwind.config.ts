import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Pretendard", "-apple-system", "BlinkMacSystemFont", "system-ui", "Apple SD Gothic Neo", "sans-serif"]
      },
      colors: {
        ink: "#1F2933",
        muted: "#6B7280",
        line: "#D9DEE3",
        navy: "#14103F",
        paper: "#FFFFFF"
      }
    }
  },
  plugins: []
};
export default config;
