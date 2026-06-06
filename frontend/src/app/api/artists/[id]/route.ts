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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        await connectDB()
        const artist = await Artist.findById(id)
        if (!artist) return Response.json({ success: false, message: 'Không tìm thấy nghệ sĩ' }, { status: 404 })
        return Response.json({ success: true, data: artist })
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
            const avatarFile = formData.get('avatar')
            if (avatarFile instanceof Blob) {
                if (isCloudinaryConfigured()) {
                    const buffer = Buffer.from(await avatarFile.arrayBuffer())
                    const result = await uploadBuffer(buffer, {
                        resource_type: 'image',
                        folder: 'wonmusic/artists',
                        public_id: `artist_${id}`,
                        overwrite: true,
                    })
                    updateData.avatar = result.secure_url
                } else {
                    updateData.avatar = await saveLocalFile(avatarFile, 'avatars', `artist_${id}`)
                }
            }
        } else {
            updateData = await req.json()
        }

        const artist = await Artist.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
        if (!artist) return Response.json({ success: false, message: 'Không tìm thấy nghệ sĩ' }, { status: 404 })
        return Response.json({ success: true, data: artist })
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Lỗi server'
        return Response.json({ success: false, message: msg }, { status: 400 })
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        await connectDB()
        const artist = await Artist.findByIdAndDelete(id)
        if (!artist) return Response.json({ success: false, message: 'Không tìm thấy nghệ sĩ' }, { status: 404 })
        return Response.json({ success: true, message: 'Đã xóa nghệ sĩ' })
    } catch {
        return Response.json({ success: false, message: 'Lỗi server' }, { status: 500 })
    }
}
