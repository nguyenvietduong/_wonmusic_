import mongoose from 'mongoose'

declare global {
    // eslint-disable-next-line no-var
    var _mongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
}

const MONGODB_URI = process.env.MONGODB_CONNECTION_STRING!

let cached = global._mongoose ?? { conn: null, promise: null }
global._mongoose = cached

export async function connectDB(): Promise<typeof mongoose> {
    if (cached.conn) return cached.conn
    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI)
    }
    cached.conn = await cached.promise
    return cached.conn
}
