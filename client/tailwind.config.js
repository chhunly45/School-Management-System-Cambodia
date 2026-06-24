export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Kantumruy Pro',
          'Inter',
          'sans-serif'
        ]
      },
      colors: {
        primary: '#0F766E',
        'primary-hover': '#115E59',
        accent: '#F59E0B',
        'accent-hover': '#D97706',
        surface: '#ffffff',
        'surface-muted': '#F1F5F9',
        border: '#CBD5E1',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#0EA5E9',
        background: '#F8FAFC',
        'text-primary': '#0F172A',
        'text-secondary': '#475569',
        muted: '#94A3B8'
      }
    }
  },
  plugins: []
};
