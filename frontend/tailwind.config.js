/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        red: { DEFAULT: '#C8102E', dk: '#9E0C24', soft: '#FDF1F2' },
        wine: '#6E0B1C',
        gold: '#B08A45',
        paper: '#FFFDF9',
        cream: { DEFAULT: '#F7F1E7', dk: '#EFE7DC' },
        ink: { DEFAULT: '#1F1A18', soft: '#3A3330', muted: '#5C534E' },
        line: '#E6DCCF',
        ok: { DEFAULT: '#2F7A4E', bg: '#E6F2EA', ink: '#1E4D33' },
        warn: { DEFAULT: '#A85A0C', bg: '#FBEEDD', ink: '#7A4208' },
        rain: { DEFAULT: '#2D5C9E', bg: '#E3ECF8' },
        fog: { DEFAULT: '#5E6672', bg: '#ECEEF1' },
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['Figtree', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(40,20,10,.05), 0 8px 24px rgba(40,20,10,.06)',
        lift: '0 2px 4px rgba(40,20,10,.06), 0 18px 40px rgba(40,20,10,.16)',
        red: '0 10px 24px rgba(200,16,46,.28)',
      },
    },
  },
  plugins: [],
}
