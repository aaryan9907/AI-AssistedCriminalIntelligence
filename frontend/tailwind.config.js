/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: '#050811',
        panel: '#0c1425',
        ink: '#0e172a',
        signal: '#00f0ff',
        azure: '#3b82f6',
        safe: '#10b981',
        warn: '#f59e0b',
        border: 'rgba(0, 240, 255, 0.14)',
        input: 'rgba(0, 240, 255, 0.1)',
        foreground: '#e6edf5',
        background: '#050811',
        muted: '#131e36',
        'muted-foreground': '#8ca0b8',
        card: '#0c1425',
        'card-foreground': '#e6edf5',
        primary: '#00f0ff',
        'primary-foreground': '#050811',
        secondary: '#131e36',
        'secondary-foreground': '#e6edf5',
        accent: '#131f37',
        'accent-foreground': '#e6edf5',
        destructive: '#ef4444',
      },
      fontFamily: {
        body: ['Inter', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
      letterSpacing: {
        wide: '.025em',
        wider: '.05em',
        widest: '.1em',
      },
      boxShadow: {
        'glow-signal': '0 0 15px rgba(0, 240, 255, 0.3)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 3.2s ease-in-out infinite',
        blink: 'softblink 1.8s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0px rgba(0, 240, 255, 0)' },
          '50%': { boxShadow: '0 0 22px 2px rgba(0, 240, 255, 0.35)' },
        },
        softblink: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
      }
    },
  },
  plugins: [],
}
