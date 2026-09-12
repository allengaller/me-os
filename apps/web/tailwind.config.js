/** @type {import('tailwindcss').Config} */
const neutral = {
  50: 'var(--color-paper-2)',
  100: 'var(--color-paper-3)',
  200: 'var(--color-border)',
  300: 'var(--color-ink-3)',
  400: 'var(--color-ink-3)',
  500: 'var(--color-ink-2)',
  600: 'var(--color-ink-2)',
  700: 'var(--color-ink)',
  800: 'var(--color-ink)',
  900: 'var(--color-ink)',
};

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        /* 中性色全部映射到主题变量，随深夜模式翻转 */
        slate: neutral,
        gray: neutral,
      },
    },
  },
  plugins: [],
};
