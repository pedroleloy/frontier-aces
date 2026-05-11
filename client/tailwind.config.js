/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Surface tones used by panels/inputs/inner cards.
        bg: {
          DEFAULT: '#1a120c',
          deep: '#0d0805',
        },
        // Original western palette — oxblood / bronze / parchment / felt
        oxblood: {
          50: '#fbf2f1',
          100: '#f3d9d6',
          200: '#e3a9a3',
          300: '#cf7770',
          400: '#b34d45',
          500: '#8e2f29',
          600: '#6e201c',
          700: '#541815',
          800: '#3a110f',
          900: '#240a09',
        },
        bronze: {
          50: '#f9f1e2',
          100: '#efddb1',
          200: '#dfbe73',
          300: '#c79a3e',
          400: '#a87b25',
          500: '#876018',
          600: '#664713',
          700: '#4a330e',
          800: '#2f2008',
          900: '#1a1104',
        },
        parchment: {
          50: '#fdf9ef',
          100: '#f6ecce',
          200: '#ecd99c',
          300: '#dec167',
          400: '#c8a23b',
        },
        felt: {
          400: '#1f6b4a',
          500: '#15533a',
          600: '#0f3e2c',
          700: '#0a2e21',
          800: '#071f17',
        },
        ink: '#1a120c',
      },
      fontFamily: {
        // Display: Limelight (vintage western marquee)
        // Body: EB Garamond (classic serif)
        // Both 100% Google Fonts open license
        display: ['Limelight', 'serif'],
        body: ['"EB Garamond"', 'Georgia', 'serif'],
        accent: ['"Smokum"', 'serif'],
      },
      backgroundImage: {
        'paper-grain':
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.1 0 0 0 0 0.06 0 0 0 0 0.04 0 0 0 0.18 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        'inset-frame':
          'inset 0 0 0 1px rgba(255,225,170,0.2), inset 0 0 0 4px rgba(0,0,0,0.4)',
        deal: '0 6px 14px rgba(0,0,0,0.45), 0 2px 0 rgba(255,255,255,0.06) inset',
      },
      keyframes: {
        flicker: {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.92' },
        },
        dealIn: {
          '0%': { transform: 'translate(-200%, -100%) rotate(-30deg)', opacity: '0' },
          '100%': { transform: 'translate(0,0) rotate(0)', opacity: '1' },
        },
      },
      animation: {
        flicker: 'flicker 4s ease-in-out infinite',
        'deal-in': 'dealIn 380ms cubic-bezier(.18,.89,.32,1.28) both',
      },
    },
  },
  plugins: [],
};
