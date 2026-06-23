import mongoose from 'mongoose'
import dns from 'dns'

// Node.js 18+ defaults to IPv6-first DNS which breaks MongoDB Atlas SRV lookups
dns.setDefaultResultOrder('ipv4first')

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
        cached.promise = mongoose.connect(MONGODB_URI, {
            bufferCommands: false,
            maxPoolSize: 5,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        }).catch(err => {
            cached.promise = null  // reset để lần sau có thể retry
            throw err
        })
    }
    cached.conn = await cached.promise
    return cached.conn
}
