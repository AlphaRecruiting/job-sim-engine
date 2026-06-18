/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#2D5BFF', hover: '#1E45E6', active: '#1736B4', subtle: '#EEF2FF' },
        blue: {
          50: '#EEF2FF', 100: '#DDE6FF', 200: '#B8C9FF', 300: '#8AA5FF', 400: '#5478FF',
          500: '#2D5BFF', 600: '#1E45E6', 700: '#1736B4', 900: '#0B1A57',
        },
        ink: {
          50: '#F6F8FB', 100: '#EEF2F7', 200: '#E2E8F0', 300: '#CBD5E1', 400: '#94A3B8',
          500: '#64748B', 600: '#44546F', 700: '#2C3A57', 800: '#1C2740', 900: '#111A2E', 950: '#0B1220',
        },
        success: { DEFAULT: '#0E9F6E', dark: '#0B7E58', subtle: '#E7F7F0' },
        warning: { DEFAULT: '#F59E0B', dark: '#C77C06', subtle: '#FEF6E7' },
        danger: { DEFAULT: '#E5484D', dark: '#C13438', subtle: '#FDECEC' },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SF Mono', 'monospace'],
      },
      fontSize: {
        '4xl': ['38px', { lineHeight: '1.1' }],
        '5xl': ['48px', { lineHeight: '1.05' }],
        '6xl': ['60px', { lineHeight: '1.02', letterSpacing: '-0.03em' }],
        '7xl': ['72px', { lineHeight: '1', letterSpacing: '-0.03em' }],
      },
      borderRadius: { sm: '6px', md: '10px', lg: '14px', xl: '20px', '2xl': '28px' },
      boxShadow: {
        xs: '0 1px 2px rgba(11,18,32,.06)',
        sm: '0 1px 3px rgba(11,18,32,.08),0 1px 2px rgba(11,18,32,.04)',
        md: '0 4px 12px rgba(11,18,32,.08)',
        lg: '0 12px 28px rgba(11,18,32,.12)',
        xl: '0 24px 48px rgba(11,18,32,.16)',
      },
      maxWidth: { container: '1200px' },
    },
  },
  plugins: [],
};
