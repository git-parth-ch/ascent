/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // CSS-variable-driven tokens — auto-switch in dark mode
        'ascent-bg':      'var(--color-bg)',
        'ascent-bg-alt':  'var(--color-bg-alt)',
        'ascent-card':    'var(--color-card)',
        'ascent-dark':    'var(--color-dark)',
        'ascent-mid':     'var(--color-mid)',
        'ascent-muted':   'var(--color-muted)',
        'ascent-border':  'var(--color-border)',
        // Fixed accent colours — same in both modes
        'ascent-orange':  '#E8521A',
        'ascent-amber':   '#F2A65A',
        'ascent-yellow':  '#FDE68A',
        // Legacy aliases kept so unchanged dashboard code still compiles
        dark: {
          bg:     'var(--color-bg)',
          card:   'var(--color-card)',
          border: 'var(--color-border)',
          text:   'var(--color-dark)',
          muted:  'var(--color-muted)',
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
        'card-dark': '0 1px 3px rgba(0,0,0,0.30), 0 4px 16px rgba(0,0,0,0.20)',
        'nav':  '0 2px 20px rgba(26,18,8,0.08)',
        'nav-dark': '0 2px 20px rgba(0,0,0,0.40)',
        'cta':  '0 4px 24px rgba(232,82,26,0.30)',
      },
      backgroundImage: {
        'ascent-bg-texture': "url('/src/assets/bg.png')",
      },
    },
  },
  plugins: [],
}
