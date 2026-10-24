/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // DESIGN.md Theme Tokens
        terracotta: {
          DEFAULT: '#A64B32',
          dark: '#8C3B24',
          light: '#F6ECE9',
          50: '#FDF7F5',
          100: '#FBEFED',
          600: '#A64B32',
          700: '#8C3B24',
        },
        forest: {
          DEFAULT: '#20432C',
          dark: '#162E1F',
          light: '#EAF0EC',
          50: '#F4F7F5',
        },
        sand: {
          DEFAULT: '#D4B483',
          light: '#F9F4EB',
          dark: '#7C6238',
        },
        cream: '#FFF8F6',
        linen: '#F7F0E5',
        espresso: '#271811',
        husk: {
          DEFAULT: '#E6DDD1',
          dark: '#D8CBBF',
        },
        // Backward compatibility
        gold: '#D4B483',
        charcoal: '#271811',
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        sans: ['Nunito', 'sans-serif'],
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'marquee-reverse': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0%)' },
        },
      },
      animation: {
        marquee: 'marquee 28s linear infinite',
        'marquee-slow': 'marquee 40s linear infinite',
        'marquee-reverse': 'marquee-reverse 32s linear infinite',
      },
      boxShadow: {
        card: '0 2px 8px -2px rgba(56, 40, 32, 0.05), 0 0 0 1px #E6DDD1',
        'card-hover': '0 12px 24px -6px rgba(56, 40, 32, 0.08), 0 0 0 1px #D4B483',
        modal: '0 20px 40px -10px rgba(56, 40, 32, 0.16)',
      },
    },
  },
  plugins: [],
}
