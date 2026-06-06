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
                if (isCloudinaryConfigured()) {
                    const buffer = Buffer.from(await audioFile.arrayBuffer())
                    const result = await uploadBuffer(buffer, {
                        resource_type: 'video',
                        folder: 'wonmusic/tracks',
                        public_id: `track_${id}`,
                        overwrite: true,
                    })
                    updateData.audioUrl = result.secure_url
                } else {
                    updateData.audioUrl = await saveLocalFile(audioFile, 'audio', `track_${id}`)
                }
            }
            const coverFile = formData.get('cover')
            if (coverFile instanceof Blob) {
                if (isCloudinaryConfigured()) {
                    const buffer = Buffer.from(await coverFile.arrayBuffer())
                    const result = await uploadBuffer(buffer, {
                        resource_type: 'image',
                        folder: 'wonmusic/covers',
                        public_id: `cover_${id}`,
                        overwrite: true,
                    })
                    updateData.coverUrl = result.secure_url
                } else {
                    updateData.coverUrl = await saveLocalFile(coverFile, 'covers', `cover_${id}`)
                }
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
