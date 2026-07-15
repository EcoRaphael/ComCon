/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        green:       '#2E7D32',
        'green-dark':'#1B5E20',
        'green-light':'#E8F5E9',
        cta:         '#E84C27',
        navy:        '#111111',
        sub:         '#555555',
        surface:     '#F5F5F5',
        border:      '#E0E0E0',
      },
      borderRadius: {
        xl2: '1.25rem',
        card:'1rem',
      },
    },
  },
  plugins: [],
}
