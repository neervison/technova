/* Configuración de Tailwind Play CDN.
   Se carga después de <script src="https://cdn.tailwindcss.com"></script>.
   Define la paleta de marca y las fuentes usadas en toda la página. */
tailwind.config = {
  theme: {
    extend: {
      colors: {
        brand: {
          emerald: '#10b981',
          cyan: '#22d3ee',
          dark: '#0a0f1a',
          card: '#111827',
          border: '#1f2937'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif']
      }
    }
  }
};
