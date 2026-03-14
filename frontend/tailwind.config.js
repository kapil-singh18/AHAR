/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'Segoe UI', 'sans-serif'],
        display: ['Sora', 'Manrope', 'sans-serif']
      },
      colors: {
        brand: {
          red: 'rgb(var(--color-brand-red) / <alpha-value>)',
          orange: 'rgb(var(--color-brand-orange) / <alpha-value>)',
          teal: 'rgb(var(--color-brand-teal) / <alpha-value>)'
        },
        surface: {
          DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
          muted: 'rgb(var(--color-surface-muted) / <alpha-value>)',
          raised: 'rgb(var(--color-surface-raised) / <alpha-value>)'
        },
        ink: {
          DEFAULT: 'rgb(var(--color-text) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
          inverse: 'rgb(var(--color-text-inverse) / <alpha-value>)'
        },
        line: 'rgb(var(--color-border) / <alpha-value>)'
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        glow: 'var(--shadow-glow)'
      },
      borderRadius: {
        shell: '1.75rem'
      }
    }
  },
  plugins: []
};