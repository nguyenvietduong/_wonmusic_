import { put } from '@vercel/blob'

const MIME_TO_EXT: Record<string, string> = {
    'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/wav': 'wav',
    'audio/flac': 'flac', 'audio/ogg': 'ogg', 'audio/aac': 'aac',
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
}

export async function uploadToBlob(
    file: Blob,
    folder: string,
    name: string,
): Promise<string> {
    const ext = MIME_TO_EXT[file.type] ?? (file.type.includes('audio') ? 'mp3' : 'jpg')
    const pathname = `${folder}/${name}.${ext}`
    const blob = await put(pathname, file, { access: 'public' })
    return blob.url
}
