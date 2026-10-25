import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env, assertSecrets } from './config/env.js';

async function start() {
  assertSecrets();
  await connectDB(env.mongoUri);

  const app = createApp();

  const server = app.listen(env.port, () => {
    console.log(`API escuchando en http://localhost:${env.port} (${env.nodeEnv})`);
    console.log(env.payments.demo ? 'Pagos en MODO DEMO (sin cargos reales).' : 'Pagos con Stripe activos.');
  });

  const shutdown = (signal) => {
    console.log(`\n${signal} recibido, cerrando servidor...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  };

  ['SIGINT', 'SIGTERM'].forEach((signal) => process.on(signal, () => shutdown(signal)));
}

start().catch((error) => {
  console.error('No se pudo iniciar el servidor:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Promise rechazada sin manejar:', reason);
});
