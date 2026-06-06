import { getTokenFromHeader, verifyAccessToken } from './auth-server'
import { connectDB } from './mongodb'
import User from '@/models/User'

export async function requireAuth(req: Request) {
    const token = getTokenFromHeader(req)
    if (!token) return null
    try {
        const { userId } = verifyAccessToken(token)
        await connectDB()
        return User.findById(userId).lean()
    } catch {
        return null
    }
}
