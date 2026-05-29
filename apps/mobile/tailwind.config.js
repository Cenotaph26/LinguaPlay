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
        bg:       '#F5F3FF',
        bg2:      '#ffffff',
        bg3:      '#F0EEF9',
        bg4:      '#E4E1F5',
        border:   '#E4E1F5',
        text1:    '#110D24',
        text2:    '#6B638F',
        text3:    '#9B94CC',
        accent:   '#7355F7',
        'accent-lt': '#8B6EFF',
        success:  '#0E9E80',
        warning:  '#F59E0B',
        danger:   '#E84E32',
      },
    },
  },
  plugins: [],
};
