import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { signAccessToken } from '@/lib/auth-server'
import Session from '@/models/Session'

export async function POST(req: NextRequest) {
    try {
        const cookieHeader = req.headers.get('cookie') ?? ''
        const match = cookieHeader.match(/refreshToken=([^;]+)/)
        const token = match?.[1]

        if (!token) {
            return Response.json({ message: 'Token không tồn tại.' }, { status: 401 })
        }

        await connectDB()

        const session = await Session.findOne({ refreshToken: token })
        if (!session) {
            return Response.json({ message: 'Token không hợp lệ hoặc đã hết hạn' }, { status: 403 })
        }

        if (session.expiresAt < new Date()) {
            return Response.json({ message: 'Token đã hết hạn.' }, { status: 403 })
        }

        const accessToken = signAccessToken(String(session.userId))
        return Response.json({ accessToken })
    } catch (error) {
        console.error('Lỗi khi gọi refreshToken', error)
        return Response.json({ message: 'Lỗi hệ thống' }, { status: 500 })
    }
}
