import mongoose from 'mongoose';

export async function connectDB(uri = process.env.MONGODB_URI) {
  if (!uri) {
    throw new Error(
      'Falta MONGODB_URI. Configúralo en .env (MongoDB Atlas) o ejecuta `npm run dev:memory` para desarrollo.'
    );
  }

  mongoose.set('strictQuery', true);

  const connection = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000,
    autoIndex: process.env.NODE_ENV !== 'production',
  });

  console.log(`MongoDB conectado: ${connection.connection.host}/${connection.connection.name}`);
  return connection;
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
