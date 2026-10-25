import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { seedDatabase } from '../src/utils/seeder.js';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';

const PORT = Number(process.env.PORT || 5000);

async function main() {
  console.log('Levantando MongoDB en memoria (solo desarrollo)...');
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  await connectDB(uri);
  await seedDatabase({ reset: true });

  const app = createApp();

  const server = app.listen(PORT, () => {
    console.log(`API dev con MongoDB en memoria: http://localhost:${PORT}`);
    console.log('Pagos en MODO DEMO.');
    console.log('Pulsa Ctrl+C para detener (los datos se pierden al salir).');
  });

  const shutdown = async () => {
    console.log('\nApagando...');
    server.close(async () => {
      await disconnectDB();
      await mongod.stop();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('No se pudo iniciar el entorno en memoria:', error.message);
  process.exit(1);
});
