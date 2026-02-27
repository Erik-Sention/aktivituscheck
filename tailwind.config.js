/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'aktivitus-blue': '#004B87',
        'aktivitus-navy': '#003A6E',
        'aktivitus-green': '#88B8B0',
        'aktivitus-beige': '#D9C5B2',
        'aktivitus-border': '#CDDFF2',
        'aktivitus-text': '#4A4642',
        'aktivitus-teal': '#8FB3A3',
        'aktivitus-sage': '#C8D6C7',
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        '3xl': '32px',
      },
      gridTemplateColumns: {
        'decorative': '1fr 2.5rem auto 2.5rem 1fr',
      },
      gridTemplateRows: {
        'decorative': '1fr 1px auto 1px 1fr',
      },
    },
  },
  plugins: [],
};
