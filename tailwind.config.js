/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F1ECD9",
        "paper-deep": "#E9E2CC",
        line: "#D3CBB2",
        "line-strong": "#B9AE8D",
        ink: "#23281F",
        "ink-soft": "#5B5744",
        forest: "#2F6F5E",
        "forest-dark": "#204E42",
        "forest-tint": "#E4EEE9",
        brass: "#A9791F",
        "brass-tint": "#F3E6C6",
        rust: "#A13D2C",
        "rust-tint": "#F6E7D8",
        card: "#FCFAF3",
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "3px",
      },
      keyframes: {
        reveal: {
          "0%": { opacity: 0, transform: "translateY(14px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
