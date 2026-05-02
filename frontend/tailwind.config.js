/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50: '#f0f0ff',
          100: '#e4e4ff',
          200: '#cdcbff',
          300: '#aba7ff',
          400: '#8578ff',
          500: '#6550f7',
          600: '#5633ec',
          700: '#4a27d4',
          800: '#3d22ab',
          900: '#341f87',
          950: '#1f1156',
        },
        surface: {
          0: '#ffffff',
          1: '#f8f7ff',
          2: '#f0eff9',
          3: '#e8e6f5',
        },
      },
    },
  },
  plugins: [],
}
