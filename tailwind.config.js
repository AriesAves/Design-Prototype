/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px',
			},
		},
		extend: {
			colors: {
				space: {
					bg: '#0a0a0f',
					surface: '#14141f',
					card: '#1a1a2e',
					border: '#2e2e4a',
				},
				electric: {
					primary: '#6366f1',
					secondary: '#a855f7',
					accent: '#22d3ee',
				},
				text: {
					primary: '#f1f5f9',
					secondary: '#94a3b8',
				},
				success: '#10b981',
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: '#6366f1',
					foreground: 'hsl(var(--primary-foreground))',
				},
				secondary: {
					DEFAULT: '#a855f7',
					foreground: 'hsl(var(--secondary-foreground))',
				},
				accent: {
					DEFAULT: '#22d3ee',
					foreground: 'hsl(var(--accent-foreground))',
				},
				muted: {
					DEFAULT: '#14141f',
					foreground: '#94a3b8',
				},
				card: {
					DEFAULT: '#1a1a2e',
					foreground: '#f1f5f9',
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
			},
			fontFamily: {
				space: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
			},
			boxShadow: {
				glow: '0 0 20px rgba(99, 102, 241, 0.4)',
				'glow-purple': '0 0 20px rgba(168, 85, 247, 0.4)',
				'glow-cyan': '0 0 20px rgba(34, 211, 238, 0.4)',
			},
			keyframes: {
				float: {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-10px)' },
				},
				pulse: {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.5' },
				},
				shimmer: {
					'0%': { transform: 'translateX(-100%)' },
					'100%': { transform: 'translateX(100%)' },
				},
			},
			animation: {
				float: 'float 3s ease-in-out infinite',
				pulse: 'pulse 2s ease-in-out infinite',
				shimmer: 'shimmer 1.5s infinite',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
}