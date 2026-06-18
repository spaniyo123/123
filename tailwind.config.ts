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
          violet: '#7C3AED',
          indigo: '#4F46E5',
        },
        status: {
          todo: '#6B7280',
          'todo-bg': '#F3F4F6',
          'in-progress': '#3B82F6',
          'in-progress-bg': '#EFF6FF',
          done: '#10B981',
          'done-bg': '#ECFDF5',
        },
        priority: {
          high: '#EF4444',
          'high-bg': '#FEF2F2',
          medium: '#F59E0B',
          'medium-bg': '#FFFBEB',
          low: '#64748B',
          'low-bg': '#F1F5F9',
        },
        urgency: {
          imminent: '#D97706',
          'imminent-bg': '#FEF3C7',
          overdue: '#DC2626',
          'overdue-bg': '#FEE2E2',
        },
      },
      borderRadius: {
        card: '12px',
        'card-lg': '16px',
      },
      boxShadow: {
        card: '0 2px 8px 0 rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 16px 0 rgba(0, 0, 0, 0.12)',
        'card-active': '0 8px 24px 0 rgba(124, 58, 237, 0.15)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
        'brand-gradient-hover': 'linear-gradient(135deg, #6D28D9 0%, #4338CA 100%)',
      },
      transitionTimingFunction: {
        'ease-out-custom': 'cubic-bezier(0, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}

export default config
