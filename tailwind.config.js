/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./build/*.js",
    "./node_modules/flowbite/**/*.js"
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('flowbite/plugin')
  ],
};
