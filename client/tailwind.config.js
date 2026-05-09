export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        surface: {
          DEFAULT: '#0f1117',
          50: '#1a1d27',
          100: '#212435',
          200: '#2a2e42',
          300: '#363b52',
        },
        accent: {
          gold: '#d4a843',
          'gold-light': '#f0c76a',
          green: '#22c55e',
          red: '#ef4444',
          blue: '#3b82f6',
          purple: '#8b5cf6',
          'purple-light': '#a78bfa',
        }
      }
    }
  },
  plugins: []
}
