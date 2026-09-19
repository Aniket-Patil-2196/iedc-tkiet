import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

// Track if connection failed during build static generation to avoid hanging every page
let buildDbUnavailable = false;

export async function connectToDatabase(): Promise<typeof mongoose | null> {
  if (!MONGODB_URI) {
    return null;
  }

  const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

  // If database already failed during static generation, bypass immediately to prevent build timeouts
  if (isBuildPhase && buildDbUnavailable) {
    return null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    // 2.5s fast timeout during build phase; 8s standard timeout for live runtime
    const timeout = isBuildPhase ? 2500 : 8000;
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: timeout,
      connectTimeoutMS: timeout,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => mongooseInstance)
      .catch((err) => {
        cached.promise = null;
        cached.conn = null;
        if (isBuildPhase) {
          buildDbUnavailable = true;
        }
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
    if (isBuildPhase) {
      buildDbUnavailable = true;
      console.warn(
        "[MONGODB BUILD NOTICE] Database unreachable during static prerendering. Using safe static fallback data for build."
      );
    } else {
      console.warn("[MONGODB CONNECTION FAILED]", (e as any)?.message || e);
    }
    return null;
  }

  return cached.conn;
}

