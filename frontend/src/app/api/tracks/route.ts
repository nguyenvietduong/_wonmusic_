import { NextRequest } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { connectDB } from '@/lib/mongodb'
import cloudinary from '@/lib/cloudinary'
import Track from '@/models/Track'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function isCloudinaryConfigured() {
    const name = process.env.CLOUDINARY_NAME ?? ''
    return name && name !== 'your_cloud_name'
}

async function saveLocalFile(file: Blob, subfolder: string, id: string): Promise<string> {
    const mimeToExt: Record<string, string> = {
        'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/wav': 'wav',
        'audio/flac': 'flac', 'audio/ogg': 'ogg', 'audio/aac': 'aac',
        'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
    }
    const ext = mimeToExt[file.type] ?? (file.type.includes('audio') ? 'mp3' : 'jpg')
    const fileName = `${id}.${ext}`
    const dir = path.join(process.cwd(), 'public', subfolder)
    await mkdir(dir, { recursive: true })
    await writeFile(path.join(dir, fileName), Buffer.from(await file.arrayBuffer()))
    return `/${subfolder}/${fileName}`
}

async function uploadBuffer(buffer: Buffer, options: object): Promise<{ secure_url: string }> {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(options, (err, result) => {
            if (err || !result) return reject(err)
            resolve(result as { secure_url: string })
        }).end(buffer)
    })
}

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

        // ── Chế độ URL trực tiếp (JSON body) ──────────────────────────────────
        if (contentType.includes('application/json')) {
            const body = await req.json()
            if (!body.audioUrl) {
                return Response.json({ success: false, message: 'audioUrl là bắt buộc' }, { status: 400 })
            }
            const track = await Track.create(body)
            return Response.json({ success: true, data: track }, { status: 201 })
        }

        // ── Chế độ upload file → Cloudinary ───────────────────────────────────
        const formData = await req.formData()

        const body: Record<string, unknown> = {}
        for (const [key, value] of formData.entries()) {
            if (typeof value === 'string') body[key] = value
        }

        const track = new Track(body)

        const audioFile = formData.get('audio')
        if (audioFile instanceof Blob) {
            if (isCloudinaryConfigured()) {
                const audioBuffer = Buffer.from(await audioFile.arrayBuffer())
                const result = await uploadBuffer(audioBuffer, {
                    resource_type: 'video',
                    folder: 'wonmusic/tracks',
                    public_id: `track_${track._id}`,
                    overwrite: true,
                })
                track.audioUrl = result.secure_url
            } else {
                track.audioUrl = await saveLocalFile(audioFile, 'audio', `track_${track._id}`)
            }
        } else if (!body.audioUrl) {
            return Response.json({ success: false, message: 'File audio hoặc audioUrl là bắt buộc' }, { status: 400 })
        }

        const coverFile = formData.get('cover')
        if (coverFile instanceof Blob) {
            if (isCloudinaryConfigured()) {
                const coverBuffer = Buffer.from(await coverFile.arrayBuffer())
                const result = await uploadBuffer(coverBuffer, {
                    resource_type: 'image',
                    folder: 'wonmusic/covers',
                    public_id: `cover_${track._id}`,
                    overwrite: true,
                })
                track.coverUrl = result.secure_url
            } else {
                track.coverUrl = await saveLocalFile(coverFile, 'covers', `cover_${track._id}`)
            }
        }

        await track.save()
        return Response.json({ success: true, data: track }, { status: 201 })
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Lỗi server'
        return Response.json({ success: false, message: msg }, { status: 400 })
    }
}
