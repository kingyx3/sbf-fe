module.exports = {
  darkMode: 'class', // Enable dark mode using the 'class' strategy
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Include all files that use Tailwind classes
  ],
  theme: {
    extend: {
      // Add custom animations
      animation: {
        spin: "spin 1s linear infinite", // Define the spin animation
      },
      // Add custom keyframes for the spin animation
      keyframes: {
        spin: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
    },
  },
  variants: {
    extend: {
      animation: ["dark"], // Enable dark mode for animations
    },
  },
  plugins: [],
};