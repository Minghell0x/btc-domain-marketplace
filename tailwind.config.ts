import type { Config } from 'tailwindcss';

export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                background: '#0a0a0f',
                surface: {
                    DEFAULT: '#0a0a0f',
                    dim: '#080810',
                    bright: '#1a1a25',
                    container: {
                        lowest: '#06060b',
                        low: '#0f0f18',
                        DEFAULT: '#141420',
                        high: '#1a1a28',
                        highest: '#222233',
                    },
                },
                primary: {
                    DEFAULT: '#00cffc',
                    dim: '#009cc0',
                    container: '#003d4d',
                    glow: 'rgba(0, 207, 252, 0.15)',
                },
                accent: {
                    DEFAULT: '#df8eff',
                    dim: '#b06ecc',
                    container: '#3d1a4d',
                    glow: 'rgba(223, 142, 255, 0.15)',
                },
                neon: {
                    green: '#a0ffc3',
                    cyan: '#00cffc',
                    magenta: '#df8eff',
                },
                secondary: {
                    DEFAULT: '#9ccaff',
                    container: '#065f9c',
                },
                tertiary: {
                    DEFAULT: '#89ceff',
                    container: '#17aff7',
                },
                amber: {
                    DEFAULT: '#ffb867',
                    container: '#e8910c',
                },
                error: {
                    DEFAULT: '#ff4466',
                    container: '#93000a',
                    muted: '#ffb4ab',
                },
                success: {
                    DEFAULT: '#a0ffc3',
                    container: '#0a3d1f',
                },
                warning: {
                    DEFAULT: '#fbbf24',
                    container: '#3d2e00',
                },
                outline: {
                    DEFAULT: 'rgba(255, 255, 255, 0.08)',
                    variant: 'rgba(255, 255, 255, 0.04)',
                },
                'on-surface': {
                    DEFAULT: '#e2e2e6',
                    variant: '#8888a0',
                    muted: '#555568',
                },
            },
            fontFamily: {
                display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
                body: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['"JetBrains Mono"', 'monospace'],
            },
            borderRadius: {
                DEFAULT: '0.75rem',
                lg: '1rem',
                xl: '1.5rem',
                '2xl': '2rem',
            },
            boxShadow: {
                glow: '0 0 20px rgba(0, 207, 252, 0.15)',
                'glow-accent': '0 0 20px rgba(223, 142, 255, 0.15)',
                'glow-green': '0 0 20px rgba(160, 255, 195, 0.15)',
            },
            animation: {
                'fade-in': 'fadeIn 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                'slide-up': 'slideUp 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                pulseGlow: {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(0, 207, 252, 0.1)' },
                    '50%': { boxShadow: '0 0 30px rgba(0, 207, 252, 0.25)' },
                },
            },
        },
    },
    plugins: [],
} satisfies Config;
