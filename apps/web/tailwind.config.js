/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Italian-rationalist warm neutrals — never compete with color samples.
        paper: '#F5F3F0',
        panel: '#FBFAF8',
        ink: '#1F1D1A',
        muted: '#6B6660',
        line: '#E4E0DA',
        accent: '#8A5A44', // muted terracotta
      },
      fontFamily: {
        sans: ['"Source Sans 3"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
};
