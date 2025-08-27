/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'orbitron': ['Orbitron', 'monospace'],
        'jetbrains': ['JetBrains Mono', 'monospace'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Shakabra AI DJ Party Player - Neon Color Palette from PRD
        'electric-blue': '#00D9FF',
        'neon-purple': '#B347FF', 
        'acid-green': '#39FF14',
        'hot-pink': '#FF1493',
        'void-black': '#0A0A0A',
        'dark-gray': '#1A1A1A',
        'mid-gray': '#2D2D2D',
        'light-gray': '#404040',
        'neon-white': '#FFFFFF',
        'muted-gray': '#9CA3AF',
        'dim-gray': '#6B7280',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      boxShadow: {
        // Refined neon shadows - more subtle and stylish
        'neon-blue-sm': '0 2px 8px rgba(0, 217, 255, 0.15), 0 0 0 1px rgba(0, 217, 255, 0.1)',
        'neon-blue': '0 4px 16px rgba(0, 217, 255, 0.25), 0 0 0 1px rgba(0, 217, 255, 0.3)',
        'neon-blue-lg': '0 8px 24px rgba(0, 217, 255, 0.35), 0 0 0 1px rgba(0, 217, 255, 0.4)',
        'neon-purple-sm': '0 2px 8px rgba(179, 71, 255, 0.15), 0 0 0 1px rgba(179, 71, 255, 0.1)',
        'neon-purple': '0 4px 16px rgba(179, 71, 255, 0.25), 0 0 0 1px rgba(179, 71, 255, 0.3)',
        'neon-purple-lg': '0 8px 24px rgba(179, 71, 255, 0.35), 0 0 0 1px rgba(179, 71, 255, 0.4)',
        'neon-green-sm': '0 2px 8px rgba(57, 255, 20, 0.15), 0 0 0 1px rgba(57, 255, 20, 0.1)',
        'neon-green': '0 4px 16px rgba(57, 255, 20, 0.25), 0 0 0 1px rgba(57, 255, 20, 0.3)',
        'neon-pink-sm': '0 2px 8px rgba(255, 20, 147, 0.15), 0 0 0 1px rgba(255, 20, 147, 0.1)',
        'neon-pink': '0 4px 16px rgba(255, 20, 147, 0.25), 0 0 0 1px rgba(255, 20, 147, 0.3)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-inset': 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
        'pulse-neon': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'glow': {
          '0%, 100%': { filter: 'brightness(1)' },
          '50%': { filter: 'brightness(1.2)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
}
