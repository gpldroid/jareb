module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        surface: '#0f172a',
        accent: '#38bdf8'
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(56, 189, 248, 0.25), 0 10px 30px rgba(14, 165, 233, 0.18)'
      }
    }
  },
  plugins: []
};
