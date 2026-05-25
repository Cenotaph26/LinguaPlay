/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: '#09090b',
        bg2: '#18181b',
        bg3: '#27272a',
        bg4: '#3f3f46',
        border: '#27272a',
        text1: '#fafafa',
        text2: '#a1a1aa',
        text3: '#71717a',
        accent: '#6366f1',
        'accent-lt': '#818cf8',
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
    },
  },
  plugins: [],
};
