import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

const AUDIO_MIMES = new Set([
    'audio/mpeg', 'audio/mp3', 'audio/wav',
    'audio/flac', 'audio/ogg', 'audio/aac', 'audio/x-m4a',
])

function uploadStream(
    buffer: Buffer,
    options: Record<string, unknown>,
): Promise<{ secure_url: string }> {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
            if (err || !result) reject(err ?? new Error('Cloudinary upload failed'))
            else resolve(result as { secure_url: string })
        })
        stream.end(buffer)
    })
}

export async function uploadToBlob(
    file: Blob,
    folder: string,
    name: string,
): Promise<string> {
    const isAudio = AUDIO_MIMES.has(file.type) || file.type.startsWith('audio/')
    const buffer  = Buffer.from(await file.arrayBuffer())

    const result = await uploadStream(buffer, {
        folder,
        public_id:     name,
        resource_type: isAudio ? 'video' : 'image',
        overwrite:     true,
    })

    return result.secure_url
}
