import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        wallpaper: "url('/images/wallpaper.jpg')",
      },
    },
  },
  plugins: [require("tailwind-scrollbar-hide")],
} satisfies Config;