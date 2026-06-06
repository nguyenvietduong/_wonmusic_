import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'

export async function POST(req: NextRequest) {
    try {
        const { username, password, email, firstName, lastName } = await req.json()

        if (!username || !password || !email || !firstName || !lastName) {
            return Response.json(
                { message: 'Không thể thiếu username, password, email, firstName, và lastName' },
                { status: 400 }
            )
        }

        await connectDB()

        const duplicate = await User.findOne({ username })
        if (duplicate) {
            return Response.json({ message: 'Username đã tồn tại' }, { status: 409 })
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        await User.create({
            username,
            hashedPassword,
            email,
            displayName: `${lastName} ${firstName}`,
        })

        return new Response(null, { status: 204 })
    } catch (error) {
        console.error('Lỗi khi gọi signUp', error)
        return Response.json({ message: 'Lỗi hệ thống' }, { status: 500 })
    }
}
