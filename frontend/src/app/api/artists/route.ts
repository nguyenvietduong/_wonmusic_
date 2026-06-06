import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { uploadToBlob } from '@/lib/blob'
import Artist from '@/models/Artist'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const page = Number(searchParams.get('page') ?? 1)
        const limit = Number(searchParams.get('limit') ?? 20)
        const genre = searchParams.get('genre')

        await connectDB()

        const filter: Record<string, unknown> = {}
        if (genre) filter.genre = { $regex: genre, $options: 'i' }

        const [artists, total] = await Promise.all([
            Artist.find(filter)
                .sort({ followers: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            Artist.countDocuments(filter),
        ])

        return Response.json({ success: true, data: artists, pagination: { page, limit, total } })
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
            const artist = await Artist.create(body)
            return Response.json({ success: true, data: artist }, { status: 201 })
        }

        const formData = await req.formData()
        const body: Record<string, unknown> = {}
        for (const [key, value] of formData.entries()) {
            if (typeof value === 'string') body[key] = value
        }

        const artist = new Artist(body)

        const avatarFile = formData.get('avatar')
        if (avatarFile instanceof Blob) {
            artist.avatar = await uploadToBlob(avatarFile, 'wonmusic/artists', `artist_${artist._id}`)
        }

        await artist.save()
        return Response.json({ success: true, data: artist }, { status: 201 })
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Lỗi server'
        return Response.json({ success: false, message: msg }, { status: 400 })
    }
}
