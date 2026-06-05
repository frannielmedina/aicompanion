import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        comic: ['"Comic Sans MS"', '"Comic Sans"', 'cursive'],
        arial: ['Arial', 'sans-serif'],
        montserrat: ['Montserrat', 'sans-serif'],
        verdana: ['Verdana', 'Geneva', 'sans-serif'],
      },
      colors: {
        dark: { 900: '#0a0a0f', 800: '#111118', 700: '#1a1a24', 600: '#22222f', 500: '#2d2d3d' },
        accent: { primary: '#7c3aed', secondary: '#06b6d4', pink: '#ec4899', green: '#10b981' },
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'emote-drift': 'emoteDrift 6s ease-in-out forwards',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-10px)' } },
        pulseGlow: { '0%,100%': { boxShadow: '0 0 5px #7c3aed' }, '50%': { boxShadow: '0 0 20px #7c3aed, 0 0 40px #7c3aed' } },
        slideIn: { from: { opacity: '0', transform: 'translateY(-10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        emoteDrift: { '0%': { transform: 'translateY(0) translateX(0)', opacity: '1' }, '100%': { transform: 'translateY(-300px) translateX(var(--drift-x, 50px))', opacity: '0' } },
      }
    },
  },
  plugins: [],
};
export default config;
