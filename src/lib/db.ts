
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

declare global {
    var mongooseCache: MongooseCache;
}

let cached = global.mongooseCache;

if (!cached) {
    cached = global.mongooseCache = { conn: null, promise: null };
}

async function dbConnect() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!MONGODB_URI) {
        // Fallback for MVP if no URI provided? Or throw?
        // For this assignment, user asked for MongoDB.
        // I'll log a warning and return null or throw.
        console.warn("Please define the MONGODB_URI environment variable inside .env.local");
        // throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
        // For fail-safe in local dev without env, maybe connect to localhost?
        // return mongoose.connect("mongodb://localhost:27017/marvedge");
    }

    const uri = MONGODB_URI || "mongodb://127.0.0.1:27017/marvedge_mvp";

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        cached.promise = mongoose.connect(uri, opts).then((mongoose) => {
            return mongoose;
        });
    }
    cached.conn = await cached.promise;
    return cached.conn;
}

export default dbConnect;
