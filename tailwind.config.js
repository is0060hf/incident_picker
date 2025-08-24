/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // WCAG 2.2準拠のカラーパレット
        primary: {
          DEFAULT: '#0066cc',
          hover: '#0052a3',
          focus: '#004080',
        },
        secondary: {
          DEFAULT: '#6b7280',
          hover: '#4b5563',
          focus: '#374151',
        },
        success: {
          DEFAULT: '#059669',
          light: '#10b981',
          dark: '#047857',
        },
        warning: {
          DEFAULT: '#d97706',
          light: '#f59e0b',
          dark: '#b45309',
        },
        error: {
          DEFAULT: '#dc2626',
          light: '#ef4444',
          dark: '#b91c1c',
        },
        // CSS変数との連携
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          disabled: 'var(--color-text-disabled)',
        },
        background: {
          DEFAULT: 'var(--color-background)',
          secondary: 'var(--color-background-secondary)',
          tertiary: 'var(--color-background-tertiary)',
        },
        border: 'var(--color-border)',
      },
      // フォーカスリング
      ringWidth: {
        DEFAULT: '2px',
      },
      ringColor: {
        DEFAULT: '#0066cc',
      },
      ringOffsetWidth: {
        DEFAULT: '2px',
      },
      // アニメーション時間の調整
      transitionDuration: {
        DEFAULT: '150ms',
      },
      // フォントサイズ
      fontSize: {
        'xs': ['0.875rem', { lineHeight: '1.25rem' }], // 14px
        'sm': ['1rem', { lineHeight: '1.5rem' }], // 16px
        'base': ['1.125rem', { lineHeight: '1.75rem' }], // 18px
        'lg': ['1.25rem', { lineHeight: '1.875rem' }], // 20px
        'xl': ['1.5rem', { lineHeight: '2.25rem' }], // 24px
      },
    },
  },
  plugins: [],
};
