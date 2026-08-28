// Entrada para Vercel (serverless). Conecta a Mongo de forma perezosa
// (una sola vez por instancia) y delega la petición a la app Express.
let ready;
module.exports = async (req, res) => {
  if (!ready) ready = require('../server/db').connect();
  await ready;
  return require('../server/app').app(req, res);
};
