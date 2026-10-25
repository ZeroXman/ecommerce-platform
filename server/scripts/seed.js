import { fileURLToPath } from 'node:url';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { seedDatabase } from '../src/utils/seeder.js';
import { env } from '../src/config/env.js';

export async function runSeed() {
  await connectDB(env.mongoUri);
  await seedDatabase({ reset: true });
  await disconnectDB();
}

const executedDirectly = process.argv[1] === fileURLToPath(import.meta.url);

if (executedDirectly) {
  runSeed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error en el seed:', error.message);
      process.exit(1);
    });
}
