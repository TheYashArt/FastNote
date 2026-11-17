/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        canvas: '#F9F8F6',
        surface: {
          50: '#FAF9F7',
          100: '#F4F2EE',
          200: '#EBE7E0',
          300: '#DDD7CD',
          400: '#B8B0A2',
          500: '#8C8476',
          700: '#4D473E',
          800: '#2F2B26',
          900: '#1A1815',
        },
        accent: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#D97706',
          600: '#B45309',
          700: '#92400E',
          DEFAULT: '#B45309',
        },
        note: {
          linen: '#FFFFFF',
          amber: '#FDFBF4',
          sage: '#F4F7F4',
          sky: '#F2F6FA',
          rose: '#FAF5F5',
        }
      },
      boxShadow: {
        'paper': '0 1px 2px 0 rgba(26, 24, 21, 0.04), 0 3px 10px -2px rgba(26, 24, 21, 0.03)',
        'paper-hover': '0 4px 6px -1px rgba(26, 24, 21, 0.06), 0 10px 24px -4px rgba(26, 24, 21, 0.06)',
        'elevated': '0 12px 32px -4px rgba(26, 24, 21, 0.08), 0 4px 12px -2px rgba(26, 24, 21, 0.04)',
      }
    },
  },
  plugins: [],
}
