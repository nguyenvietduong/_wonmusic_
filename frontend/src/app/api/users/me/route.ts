import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/require-auth'

export async function GET(req: NextRequest) {
    const user = await requireAuth(req)
    if (!user) return Response.json({ message: 'Unauthorized' }, { status: 401 })
    return Response.json({ success: true, user })
}
