// Punto de entrada para un proceso Node normal (local, Render, Railway, Docker).
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { app } = require('./app');
const { connect } = require('./db');

const PORT = process.env.PORT || 3000;

connect()
  .then(() => {
    app.listen(PORT, () => console.log(`TechNova corriendo en http://localhost:${PORT}`));
  })
  .catch((e) => {
    console.error('No se pudo conectar a MongoDB:', e.message);
    process.exit(1);
  });
