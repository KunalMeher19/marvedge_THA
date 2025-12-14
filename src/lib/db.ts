
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
        // In production, fail fast if MongoDB is not configured
        if (process.env.NODE_ENV === 'production') {
            throw new Error(
                "MONGODB_URI is not defined. Please add it to your environment variables in Vercel."
            );
        }

        // In development, warn and use localhost fallback
        console.warn("⚠️  MONGODB_URI not defined. Using localhost fallback for development.");
        console.warn("   For production deployment, please set MONGODB_URI in your .env.local file.");
    }

    // Use provided URI or fallback to localhost in development
    const uri = MONGODB_URI || "mongodb://127.0.0.1:27017/marvedge_mvp";

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        console.log(`🔗 Connecting to MongoDB${MONGODB_URI ? ' (Atlas)' : ' (localhost)'}...`);

        cached.promise = mongoose.connect(uri, opts).then((mongoose) => {
            console.log("✅ MongoDB connected successfully");
            return mongoose;
        }).catch((error) => {
            console.error("❌ MongoDB connection failed:", error.message);
            throw error;
        });
    }
    cached.conn = await cached.promise;
    return cached.conn;
}

export default dbConnect;
