/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        statusGreen: "#00c853",
        statusRed: "#dc2626",
        statusYellow: "#facc15",
        statusNeutral: "#78909c",
      },
      fontFamily: {
        body: ["var(--font-body)", "Helvetica", "Arial", "sans-serif"],
        title: ["var(--font-title)", "Helvetica", "Arial", "sans-serif"],
      },
      maxWidth: {
        reading: "72ch",
        details: "80ch",
      },
    },
  },
  plugins: [],
};
