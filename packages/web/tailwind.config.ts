import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        veyra: {
          dark: '#0a0e1a',
          navy: '#111827',
          purple: '#7c3aed',
          gold: '#f59e0b',
          cyan: '#06b6d4',
          pink: '#ec4899',
        },
      },
    },
  },
  plugins: [],
};

export default config;
