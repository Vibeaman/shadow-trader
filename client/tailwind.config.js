/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyan: {
          400: '#00dae9',
          500: '#00b8c4',
        },
      },
    },
  },
  plugins: [],
};
