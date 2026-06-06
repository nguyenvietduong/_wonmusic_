import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Track from '@/models/Track'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const limit = Number(searchParams.get('limit') ?? 10)

        await connectDB()

        const tracks = await Track.find({ isPublished: true })
            .populate('artistId', 'name avatar verified')
            .sort({ plays: -1 })
            .limit(limit)

        return Response.json({ success: true, data: tracks })
    } catch {
        return Response.json({ success: false, message: 'Lỗi server' }, { status: 500 })
    }
}
