import { NextRequest } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { connectDB } from '@/lib/mongodb'
import cloudinary from '@/lib/cloudinary'
import Artist from '@/models/Artist'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function isCloudinaryConfigured() {
    const name = process.env.CLOUDINARY_NAME ?? ''
    return name && name !== 'your_cloud_name'
}

async function saveLocalFile(file: Blob, subfolder: string, id: string): Promise<string> {
    const mimeToExt: Record<string, string> = {
        'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
    }
    const ext = mimeToExt[file.type] ?? 'jpg'
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

        // JSON mode (no file upload)
        if (contentType.includes('application/json')) {
            const body = await req.json()
            const artist = await Artist.create(body)
            return Response.json({ success: true, data: artist }, { status: 201 })
        }

        // FormData mode (with avatar file)
        const formData = await req.formData()

        const body: Record<string, unknown> = {}
        for (const [key, value] of formData.entries()) {
            if (typeof value === 'string') body[key] = value
        }

        const artist = new Artist(body)

        const avatarFile = formData.get('avatar')
        if (avatarFile instanceof Blob) {
            if (isCloudinaryConfigured()) {
                const buffer = Buffer.from(await avatarFile.arrayBuffer())
                const result = await uploadBuffer(buffer, {
                    resource_type: 'image',
                    folder: 'wonmusic/artists',
                    public_id: `artist_${artist._id}`,
                    overwrite: true,
                })
                artist.avatar = result.secure_url
            } else {
                artist.avatar = await saveLocalFile(avatarFile, 'avatars', `artist_${artist._id}`)
            }
        }

        await artist.save()
        return Response.json({ success: true, data: artist }, { status: 201 })
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Lỗi server'
        return Response.json({ success: false, message: msg }, { status: 400 })
    }
}
