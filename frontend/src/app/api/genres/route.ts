import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Genre from '@/models/Genre';
import Track from '@/models/Track';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectDB();
        const genres = await Genre.find().sort({ name: 1 }).lean();
        const withCount = await Promise.all(
            genres.map(async (g: any) => ({
                ...g,
                trackCount: await Track.countDocuments({ genre: g.name }),
            }))
        );
        return Response.json({ success: true, data: withCount });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return Response.json({ success: false, message: msg }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { name, color, description } = await req.json();
        if (!name?.trim()) {
            return Response.json({ success: false, message: 'Tên thể loại là bắt buộc' }, { status: 400 });
        }
        const genre = await Genre.create({
            name: name.trim(),
            color: color || '#6366f1',
            description: description || '',
        });
        return Response.json({ success: true, data: genre }, { status: 201 });
    } catch (err: any) {
        if (err.code === 11000) {
            return Response.json({ success: false, message: 'Thể loại này đã tồn tại' }, { status: 409 });
        }
        const msg = err instanceof Error ? err.message : String(err);
        return Response.json({ success: false, message: msg }, { status: 500 });
    }
}
