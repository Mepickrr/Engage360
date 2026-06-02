/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      colors: {
        // shadcn base mapping
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'var(--color-primary)',
          foreground: '#FFFFFF',
          hover: 'var(--color-primary-hover)',
          tint: 'var(--color-primary-tint)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',

        // Engage 360 brand tokens
        sidebar: {
          bg: 'var(--color-sidebar-bg)',
          fg: 'var(--color-sidebar-fg)',
          'fg-active': 'var(--color-sidebar-fg-active)',
        },
        topbar: {
          bg: 'var(--color-topbar-bg)',
        },
        app: {
          bg: 'var(--color-app-bg)',
        },
        surface: 'var(--color-surface)',
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          bg: 'var(--color-success-bg)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          bg: 'var(--color-warning-bg)',
        },
        critical: {
          DEFAULT: 'var(--color-critical)',
          bg: 'var(--color-critical-bg)',
        },
        info: 'var(--color-info)',

        // Agent persona tints (Phase 1)
        agent: {
          aryan: 'var(--agent-aryan)',
          zara: 'var(--agent-zara)',
          meera: 'var(--agent-meera)',
          rishi: 'var(--agent-rishi)',
          dev: 'var(--agent-dev)',
          priya: 'var(--agent-priya)',
        },

        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        }
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        'pulse-soft': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(108, 58, 232, 0.55)' },
          '50%': { boxShadow: '0 0 0 14px rgba(108, 58, 232, 0)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'pulse-soft': 'pulse-soft 2.4s ease-out infinite',
        'fade-in-up': 'fade-in-up 0.35s ease-out both',
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
};
