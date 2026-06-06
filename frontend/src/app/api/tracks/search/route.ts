import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Track from '@/models/Track'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const q = searchParams.get('q')
        const limit = Number(searchParams.get('limit') ?? 10)

        if (!q) return Response.json({ success: true, data: [] })

        await connectDB()

        const tracks = await Track.find({
            isPublished: true,
            $or: [
                { title: { $regex: q, $options: 'i' } },
                { genre: { $regex: q, $options: 'i' } },
            ],
        })
            .populate('artistId', 'name avatar')
            .limit(limit)

        return Response.json({ success: true, data: tracks })
    } catch {
        return Response.json({ success: false, message: 'Lỗi server' }, { status: 500 })
    }
}
