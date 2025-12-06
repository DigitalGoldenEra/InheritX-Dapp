import type { Config } from 'tailwindcss';

/**
 * Tailwind CSS v4 Configuration
 * 
 * Note: In Tailwind v4, theme customization is primarily done via CSS using @theme in globals.css.
 * This config file is used for:
 * - Content paths (which files to scan for Tailwind classes)
 * - Plugin configuration
 * - Other non-theme settings
 * 
 * The config is imported in globals.css using @config directive.
 */
const config: Config = {
  // Content paths - Tailwind will scan these files for class names
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // Theme is configured in globals.css using @theme directive
  // This section can be used to extend or override if needed
  theme: {
    extend: {
      // These reference the CSS variables defined in globals.css @theme
      colors: {
        primary: 'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        'primary-dark': 'var(--color-primary-dark)',
        dark: 'var(--color-dark)',
        'dark-card': 'var(--color-dark-card)',
        'dark-elevated': 'var(--color-dark-elevated)',
        'dark-section': 'var(--color-dark-section)',
      },
      fontFamily: {
        heading: ['var(--font-family-heading)', 'sans-serif'],
        body: ['var(--font-family-body)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
