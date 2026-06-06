import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Session from '@/models/Session'

export async function POST(req: NextRequest) {
    try {
        const cookieHeader = req.headers.get('cookie') ?? ''
        const match = cookieHeader.match(/refreshToken=([^;]+)/)
        const token = match?.[1]

        if (token) {
            await connectDB()
            await Session.deleteOne({ refreshToken: token })
        }

        const res = new Response(null, { status: 204 })
        res.headers.set(
            'Set-Cookie',
            'refreshToken=; HttpOnly; Secure; SameSite=None; Max-Age=0; Path=/'
        )
        return res
    } catch (error) {
        console.error('Lỗi khi gọi signOut', error)
        return Response.json({ message: 'Lỗi hệ thống' }, { status: 500 })
    }
}
