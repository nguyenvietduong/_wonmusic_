import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { uploadToBlob } from '@/lib/blob'
import Artist from '@/models/Artist'

export const revalidate = 60
export const maxDuration = 60

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        await connectDB()
        const artist = await Artist.findById(id)
        if (!artist) return Response.json({ success: false, message: 'Không tìm thấy nghệ sĩ' }, { status: 404 })
        return Response.json({ success: true, data: artist }, {
            headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
        })
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
                updateData.avatar = await uploadToBlob(avatarFile, 'wonmusic/artists', `artist_${id}`)
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
