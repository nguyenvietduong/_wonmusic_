import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { uploadToBlob } from '@/lib/blob'
import Track from '@/models/Track'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        await connectDB()
        const track = await Track.findById(id).populate('artistId', 'name avatar verified')
        if (!track) return Response.json({ success: false, message: 'Không tìm thấy bài hát' }, { status: 404 })
        return Response.json({ success: true, data: track })
    } catch {
        return Response.json({ success: false, message: 'Lỗi server' }, { status: 500 })
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        await connectDB()

        const contentType = req.headers.get('content-type') ?? ''
        let updateData: Record<string, unknown> = {}

        if (contentType.includes('multipart/form-data')) {
            const formData = await req.formData()
            for (const [key, value] of formData.entries()) {
                if (typeof value === 'string') updateData[key] = value
            }

            const audioFile = formData.get('audio')
            if (audioFile instanceof Blob) {
                updateData.audioUrl = await uploadToBlob(audioFile, 'wonmusic/tracks', `track_${id}`)
            }

            const coverFile = formData.get('cover')
            if (coverFile instanceof Blob) {
                updateData.coverUrl = await uploadToBlob(coverFile, 'wonmusic/covers', `cover_${id}`)
            }
        } else {
            updateData = await req.json()
        }

        const track = await Track.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
        if (!track) return Response.json({ success: false, message: 'Không tìm thấy bài hát' }, { status: 404 })
        return Response.json({ success: true, data: track })
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Lỗi server'
        return Response.json({ success: false, message: msg }, { status: 400 })
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        await connectDB()
        const track = await Track.findByIdAndDelete(id)
        if (!track) return Response.json({ success: false, message: 'Không tìm thấy bài hát' }, { status: 404 })
        return Response.json({ success: true, message: 'Đã xóa bài hát' })
    } catch {
        return Response.json({ success: false, message: 'Lỗi server' }, { status: 500 })
    }
}
