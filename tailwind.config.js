module.exports = {
  darkMode: ['class'],
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '4rem'
    },
    extend: {
      colors: {
        primary: {
          '100': '#E6F6FE',
          '200': '#C0EAFC',
          '300': '#9ADDFB',
          '400': '#4FC3F7',
          '500': '#03A9F4',
          '600': '#0398DC',
          '700': '#026592',
          '800': '#014C6E',
          '900': '#013349',
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        gray: {
          '100': '#f7fafc',
          '200': '#edf2f7',
          '300': '#e2e8f0',
          '400': '#cbd5e0',
          '500': '#a0aec0',
          '600': '#718096',
          '700': '#4a5568',
          '800': '#2d3748',
          '900': '#1a202c'
        },
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
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        }
      },
      lineHeight: {
        hero: '4.5rem'
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 0 0 rgba(3, 169, 244, 0.7)' },
          '100%': { boxShadow: '0 0 10px 4px rgba(3, 169, 244, 0.4)' }
        }
      },
      animation: {
        glow: 'glow 5s infinite alternate'
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
}

