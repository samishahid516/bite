/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f4611e',
          600: '#e04a0e',
          700: '#b8380c',
          800: '#932d10',
          900: '#782810'
        },
        ink: {
          50: '#f6f6f7',
          100: '#e2e3e6',
          200: '#c9cbd1',
          300: '#a3a6b0',
          400: '#787c89',
          500: '#5a5e6b',
          600: '#454956',
          700: '#33363f',
          800: '#212329',
          900: '#15171c'
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Poppins"', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 4px 24px -4px rgba(21, 23, 28, 0.12)',
        pop: '0 12px 32px -8px rgba(224, 74, 14, 0.35)'
      },
      borderRadius: {
        xl2: '1.25rem'
      }
    }
  },
  plugins: []
}
