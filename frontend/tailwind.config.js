/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        red: {
          DEFAULT: 'rgb(var(--brand-primary) / <alpha-value>)',
          dk: 'rgb(var(--brand-dark) / <alpha-value>)',
          soft: 'rgb(var(--brand-soft) / <alpha-value>)',
        },
        wine: 'rgb(var(--brand-wine) / <alpha-value>)',
        gold: '#B68B38',
        paper: '#FBFAF7',
        cream: { DEFAULT: '#F2F0EA', dk: '#E8E4DC' },
        ink: { DEFAULT: '#171717', soft: '#333333', muted: '#62605C' },
        line: '#DDD8CF',
        ok: { DEFAULT: '#2F7A4E', bg: '#E6F2EA', ink: '#1E4D33' },
        warn: { DEFAULT: '#A85A0C', bg: '#FBEEDD', ink: '#7A4208' },
        rain: { DEFAULT: '#2D5C9E', bg: '#E3ECF8' },
        fog: { DEFAULT: '#5E6672', bg: '#ECEEF1' },
      },
      fontFamily: {
        display: ['"Bottles Titles"', '"Arial Black"', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        sans: ['Arial', 'Helvetica', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(23,23,23,.04), 0 12px 34px rgba(23,23,23,.06)',
        lift: '0 2px 5px rgba(23,23,23,.08), 0 24px 56px rgba(23,23,23,.14)',
        red: '0 6px 14px rgb(var(--brand-shadow) / .18)',
      },
    },
  },
  plugins: [],
}
