import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { uploadToBlob } from '@/lib/blob'
import Track from '@/models/Track'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const page = Number(searchParams.get('page') ?? 1)
        const limit = Number(searchParams.get('limit') ?? 20)
        const artistId = searchParams.get('artistId')
        const genre = searchParams.get('genre')

        await connectDB()

        const filter: Record<string, unknown> = { isPublished: true }
        if (artistId) filter.artistId = artistId
        if (genre) filter.genre = { $regex: genre, $options: 'i' }

        const [tracks, total] = await Promise.all([
            Track.find(filter)
                .populate('artistId', 'name avatar verified')
                .sort({ plays: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            Track.countDocuments(filter),
        ])

        return Response.json({ success: true, data: tracks, pagination: { page, limit, total } })
    } catch {
        return Response.json({ success: false, message: 'Lỗi server' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB()

        const contentType = req.headers.get('content-type') ?? ''

        if (contentType.includes('application/json')) {
            const body = await req.json()
            if (!body.audioUrl) {
                return Response.json({ success: false, message: 'audioUrl là bắt buộc' }, { status: 400 })
            }
            const track = await Track.create(body)
            return Response.json({ success: true, data: track }, { status: 201 })
        }

        const formData = await req.formData()
        const body: Record<string, unknown> = {}
        for (const [key, value] of formData.entries()) {
            if (typeof value === 'string') body[key] = value
        }

        const track = new Track(body)

        const audioFile = formData.get('audio')
        if (audioFile instanceof Blob) {
            track.audioUrl = await uploadToBlob(audioFile, 'wonmusic/tracks', `track_${track._id}`)
        } else if (!body.audioUrl) {
            return Response.json({ success: false, message: 'File audio hoặc audioUrl là bắt buộc' }, { status: 400 })
        }

        const coverFile = formData.get('cover')
        if (coverFile instanceof Blob) {
            track.coverUrl = await uploadToBlob(coverFile, 'wonmusic/covers', `cover_${track._id}`)
        }

        await track.save()
        return Response.json({ success: true, data: track }, { status: 201 })
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Lỗi server'
        return Response.json({ success: false, message: msg }, { status: 400 })
    }
}
