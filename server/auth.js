// Autenticación mínima del vendedor: sesión en memoria respaldada por cookie.
// La contraseña se valida contra process.env.ADMIN_PASSWORD.
const crypto = require('node:crypto');

const SESSIONS = new Map(); // token -> expiración (ms)
const TTL = 8 * 60 * 60 * 1000; // 8 horas

function createSession() {
  const token = crypto.randomBytes(24).toString('hex');
  SESSIONS.set(token, Date.now() + TTL);
  return token;
}

function isValid(token) {
  if (!token) return false;
  const exp = SESSIONS.get(token);
  if (!exp) return false;
  if (exp < Date.now()) {
    SESSIONS.delete(token);
    return false;
  }
  return true;
}

function destroy(token) {
  if (token) SESSIONS.delete(token);
}

module.exports = { createSession, isValid, destroy };
