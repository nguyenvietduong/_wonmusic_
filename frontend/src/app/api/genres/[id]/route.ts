import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Genre from '@/models/Genre';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id } = await params;
        const body = await req.json();
        if (body.name) body.name = body.name.trim();
        const genre = await Genre.findByIdAndUpdate(id, body, { new: true, runValidators: true });
        if (!genre) return Response.json({ success: false, message: 'Không tìm thấy thể loại' }, { status: 404 });
        return Response.json({ success: true, data: genre });
    } catch (err: any) {
        if (err.code === 11000) {
            return Response.json({ success: false, message: 'Tên thể loại đã tồn tại' }, { status: 409 });
        }
        const msg = err instanceof Error ? err.message : String(err);
        return Response.json({ success: false, message: msg }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id } = await params;
        const genre = await Genre.findByIdAndDelete(id);
        if (!genre) return Response.json({ success: false, message: 'Không tìm thấy thể loại' }, { status: 404 });
        return Response.json({ success: true });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return Response.json({ success: false, message: msg }, { status: 500 });
    }
}
