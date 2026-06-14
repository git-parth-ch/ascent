/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ascent-bg':      '#FAF7F2',
        'ascent-bg-alt':  '#F2EDE4',
        'ascent-orange':  '#E8521A',
        'ascent-amber':   '#F2A65A',
        'ascent-yellow':  '#FDE68A',
        'ascent-dark':    '#1A1208',
        'ascent-mid':     '#5C4A32',
        'ascent-muted':   '#A89880',
        'ascent-border':  '#E8DDD0',
        // Legacy dark tokens kept so dashboard components still compile
        dark: {
          bg:     '#FAF7F2',
          card:   '#FFFFFF',
          border: '#E8DDD0',
          text:   '#1A1208',
          muted:  '#A89880',
        },
        brand: {
          primary:   '#E8521A',
          secondary: '#F2A65A',
          danger:    '#DC2626',
          warning:   '#F59E0B',
          success:   '#16A34A',
        },
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
        sans:    ['Inter', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        'xl2': '20px',
        'xl3': '32px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(26,18,8,0.06), 0 4px 16px rgba(26,18,8,0.04)',
        'nav':  '0 2px 20px rgba(26,18,8,0.08)',
        'cta':  '0 4px 24px rgba(232,82,26,0.30)',
      },
    },
  },
  plugins: [],
}
