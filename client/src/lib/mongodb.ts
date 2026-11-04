import { MongoClient, Db } from 'mongodb';

const uri =
  process.env.MONGO_URI ||
  'mongodb+srv://blueprint_admin:rezavai123@cluster0.pxlqkiw.mongodb.net/blueprint?retryWrites=true&w=majority';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('blueprint');

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}
