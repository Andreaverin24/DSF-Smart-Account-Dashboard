/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
      colors: {
        surface: {
          950: '#091016',
          900: '#0f1720',
          850: '#131d27',
          800: '#172331',
          100: '#f5f7fb',
          50: '#fbfcff',
        },
        accent: {
          500: '#20b8a9',
          600: '#13998e',
          700: '#0f7c74',
        },
        signal: {
          blue: '#5aa7ff',
          amber: '#f5b84b',
          red: '#f97066',
          green: '#5bd691',
          violet: '#a78bfa',
        },
      },
      boxShadow: {
        panel: '0 18px 50px rgba(0, 0, 0, 0.24)',
      },
    },
  },
  plugins: [],
};
