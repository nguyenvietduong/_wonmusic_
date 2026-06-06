import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { uploadToBlob } from "@/lib/blob";
import SiteSettings from "@/models/SiteSettings";

export const dynamic = "force-dynamic";

// GET — lấy settings (tạo mới nếu chưa có)
export async function GET() {
    try {
        await connectDB();
        let settings = await SiteSettings.findOne();
        if (!settings) settings = await SiteSettings.create({});
        return Response.json({ success: true, data: settings });
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Lỗi server";
        return Response.json({ success: false, message: msg }, { status: 500 });
    }
}

// PATCH — cập nhật settings (hỗ trợ cả JSON và FormData cho logo upload)
export async function PATCH(req: NextRequest) {
    try {
        await connectDB();
        const contentType = req.headers.get("content-type") ?? "";

        let fields: Record<string, string> = {};

        if (contentType.includes("multipart/form-data")) {
            const fd = await req.formData();
            for (const [key, val] of fd.entries()) {
                if (typeof val === "string") fields[key] = val;
            }

            const logoFile      = fd.get("logoFile")      as File | null;
            const logoBlackFile = fd.get("logoBlackFile") as File | null;
            const faviconFile   = fd.get("faviconFile")   as File | null;

            if (logoFile instanceof File && logoFile.size > 0)
                fields.logoUrl = await uploadToBlob(logoFile, "wonmusic/logos", "logo");
            if (logoBlackFile instanceof File && logoBlackFile.size > 0)
                fields.logoBlackUrl = await uploadToBlob(logoBlackFile, "wonmusic/logos", "logoBlack");
            if (faviconFile instanceof File && faviconFile.size > 0)
                fields.faviconUrl = await uploadToBlob(faviconFile, "wonmusic/logos", "favicon");
        } else {
            fields = await req.json();
        }

        // Lọc immutable fields của MongoDB
        for (const key of ["_id", "__v", "createdAt", "updatedAt"]) delete fields[key];

        const settings = await SiteSettings.findOneAndUpdate(
            {},
            { $set: fields },
            { new: true, upsert: true }
        );
        return Response.json({ success: true, data: settings });
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Lỗi server";
        return Response.json({ success: false, message: msg }, { status: 500 });
    }
}
