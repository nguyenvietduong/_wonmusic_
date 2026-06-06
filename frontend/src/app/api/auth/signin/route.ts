import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { connectDB } from '@/lib/mongodb'
import { signAccessToken } from '@/lib/auth-server'
import User from '@/models/User'
import Session from '@/models/Session'

const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000 // 14 ngày

export async function POST(req: NextRequest) {
    try {
        const { username, password } = await req.json()

        if (!username || !password) {
            return Response.json({ message: 'Thiếu Username hoặc password.' }, { status: 400 })
        }

        await connectDB()

        const user = await User.findOne({ username })
        if (!user) {
            return Response.json(
                { message: 'Username hoặc password không chính xác' },
                { status: 401 }
            )
        }

        const passwordCorrect = await bcrypt.compare(password, user.hashedPassword)
        if (!passwordCorrect) {
            return Response.json(
                { message: 'Username hoặc password không chính xác' },
                { status: 401 }
            )
        }

        const accessToken = signAccessToken(String(user._id))
        const refreshToken = crypto.randomBytes(64).toString('hex')

        await Session.create({
            userId: user._id,
            refreshToken,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
        })

        const res = Response.json({
            message: `User ${user.displayName} đã logged in!`,
            accessToken,
        })

        res.headers.set(
            'Set-Cookie',
            `refreshToken=${refreshToken}; HttpOnly; Secure; SameSite=None; Max-Age=${REFRESH_TOKEN_TTL / 1000}; Path=/`
        )

        return res
    } catch (error) {
        console.error('Lỗi khi gọi signIn', error)
        return Response.json({ message: 'Lỗi hệ thống' }, { status: 500 })
    }
}
