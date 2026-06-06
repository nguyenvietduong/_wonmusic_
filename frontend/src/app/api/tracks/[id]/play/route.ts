import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Track from '@/models/Track'

export const dynamic = 'force-dynamic'

// ── Anti-spam: 1 lượt nghe / IP / track mỗi 2 giờ ──────────────────────────
const playLog = new Map<string, number>()   // key: "ip:trackId"  value: timestamp
const COOLDOWN_MS  = 2 * 60 * 60 * 1000    // 2 giờ
const MAX_ENTRIES  = 20_000                 // ngưỡng dọn dẹp

function getIP(req: NextRequest): string {
    return (
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        req.headers.get('x-real-ip') ??
        'unknown'
    )
}

function pruneIfNeeded() {
    if (playLog.size < MAX_ENTRIES) return
    const cutoff = Date.now() - COOLDOWN_MS
    for (const [key, ts] of playLog) {
        if (ts < cutoff) playLog.delete(key)
    }
}

// ────────────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const ip     = getIP(req)
        const key    = `${ip}:${id}`
        const now    = Date.now()

        // Trong cooldown → trả 200 nhưng KHÔNG tăng
        const last = playLog.get(key)
        if (last && now - last < COOLDOWN_MS) {
            return Response.json({ success: true, counted: false })
        }

        pruneIfNeeded()
        playLog.set(key, now)

        await connectDB()
        await Track.findByIdAndUpdate(id, { $inc: { plays: 1 } })

        return Response.json({ success: true, counted: true })
    } catch {
        return Response.json({ success: false, message: 'Lỗi server' }, { status: 500 })
    }
}
