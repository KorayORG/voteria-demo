import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://Admin:nRVz3stpGfdwEIjr85olQoRVgPhjxYOz@cafeteriacluster.dmtexyc.mongodb.net/';
const options = {};

let client;
let clientPromise: Promise<MongoClient>;

// Add a custom type to extend the global object
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (!global._mongoClientPromise) {
  client = new MongoClient(uri, options);
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

export default clientPromise;
