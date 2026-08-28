// Base de datos MongoDB (driver oficial `mongodb`).
// Se conecta usando MONGODB_URI del entorno. Si no se define, cae a
// mongodb://127.0.0.1:27017/technova (útil para desarrollo local).
const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/technova';
const DB_NAME = process.env.MONGODB_DB || (uri.split('/').pop().split('?')[0]) || 'technova';

let client = null;
let db = null;

async function connect() {
  if (db) return db;
  client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
  await client.connect();
  db = client.db(DB_NAME);

  // Índices para garantizar unicidad (teléfono de cliente, factura por pedido)
  await db.collection('customers').createIndex({ phone: 1 }, { unique: true }).catch(() => {});
  await db.collection('invoices').createIndex({ order_id: 1 }, { unique: true }).catch(() => {});
  return db;
}

module.exports = {
  connect,
  getDb: () => db,
  client,
  ObjectId,
};
