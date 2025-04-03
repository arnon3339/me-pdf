/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    'node_modules/flowbite/**/*.js'
  ],
  theme: {
    extend: {
      fontFamily: {
        'open-sans': ['Open Sans', 'sans-serif']
      },
      keyframes: {},
      animation: {},
      colors: {}
    },
  },
  plugins: [
    require('flowbite/plugin')
  ],
  purge: {
    content: ['./src/**/*.tsx', './src/**/*.js']
  },
}