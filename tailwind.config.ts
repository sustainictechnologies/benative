import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f7f0',
          100: '#d8ecd8',
          200: '#b0d9b0',
          300: '#7dbd7d',
          400: '#4fa04f',
          500: '#2d7d2d',
          600: '#1e6b1e',
          700: '#185518',
          800: '#154315',
          900: '#0f2e0f',
        },
        cream: {
          50:  '#fdfcf8',
          100: '#faf7f0',
          200: '#f5f0e8',
        },
        konkan: {
          blue: '#1a4d6e',
          sand: '#e8d5b0',
          earth: '#8b5e3c',
        },
      },
      fontFamily: {
        sans:       ['Inter', 'system-ui', 'sans-serif'],
        // Typography roles — swap the CSS variable to change the font site-wide
        heading:    ['var(--font-heading,    var(--font-inter))', 'system-ui', 'sans-serif'],
        subheading: ['var(--font-subheading, var(--font-inter))', 'system-ui', 'sans-serif'],
        body:       ['var(--font-body,       var(--font-inter))', 'system-ui', 'sans-serif'],
        ui:         ['var(--font-ui,         var(--font-inter))', 'system-ui', 'sans-serif'],
        display:    ['var(--font-display,    var(--font-inter))', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 20px rgba(0,0,0,0.08)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.14)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
