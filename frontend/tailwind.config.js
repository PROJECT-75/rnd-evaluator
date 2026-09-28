/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif']
      },
      colors: {
        ink: { 950: '#0b1220', 900: '#111a2e', 800: '#1c2740' },
        ember: { 50: '#fff8eb', 100: '#feecc7', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309' },
        // data-viz roles (validated reference palette): sequential blue + status
        viz: { blue: '#2a78d6', blueTrack: '#cde2fb', good: '#0ca30c', warning: '#fab219', critical: '#d03b3b' }
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)',
        lift: '0 4px 12px rgba(16,24,40,0.08)'
      }
    }
  },
  plugins: []
};
