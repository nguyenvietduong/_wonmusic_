import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { connectDB } from "@/lib/mongodb";
import SiteSettings from "@/models/SiteSettings";

export const dynamic = "force-dynamic";

async function saveLogoFile(file: File, name: string): Promise<string> {
    const ext = file.type.includes("png") ? "png" : file.type.includes("webp") ? "webp" : "jpg";
    const filename = `${name}.${ext}`;
    const dir = path.join(process.cwd(), "public");
    await mkdir(dir, { recursive: true });
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, filename), buf);
    return `/${filename}`;
}

// GET — lấy settings (tạo mới nếu chưa có)
export async function GET() {
    try {
        await connectDB();
        let settings = await SiteSettings.findOne();
        if (!settings) settings = await SiteSettings.create({});
        return Response.json({ success: true, data: settings });
    } catch (e: any) {
        return Response.json({ success: false, message: e.message }, { status: 500 });
    }
}

// PATCH — cập nhật settings (hỗ trợ cả JSON và FormData cho logo upload)
export async function PATCH(req: NextRequest) {
    try {
        await connectDB();
        const contentType = req.headers.get("content-type") ?? "";

        let fields: Record<string, string> = {};
        let logoUrl:      string | undefined;
        let logoBlackUrl: string | undefined;
        let faviconUrl:   string | undefined;

        if (contentType.includes("multipart/form-data")) {
            const fd = await req.formData();
            for (const [key, val] of fd.entries()) {
                if (typeof val === "string") fields[key] = val;
            }
            const logoFile      = fd.get("logoFile")      as File | null;
            const logoBlackFile = fd.get("logoBlackFile") as File | null;
            const faviconFile   = fd.get("faviconFile")   as File | null;

            if (logoFile      instanceof File && logoFile.size > 0)
                logoUrl      = await saveLogoFile(logoFile,      "logo");
            if (logoBlackFile instanceof File && logoBlackFile.size > 0)
                logoBlackUrl = await saveLogoFile(logoBlackFile, "logoBlack");
            if (faviconFile   instanceof File && faviconFile.size > 0)
                faviconUrl   = await saveLogoFile(faviconFile,   "favicon");
        } else {
            fields = await req.json();
        }

        for (const key of ["_id", "__v", "createdAt", "updatedAt"]) delete fields[key];
        const update: Record<string, string> = { ...fields };
        if (logoUrl)      update.logoUrl      = logoUrl;
        if (logoBlackUrl) update.logoBlackUrl = logoBlackUrl;
        if (faviconUrl)   update.faviconUrl   = faviconUrl;

        const settings = await SiteSettings.findOneAndUpdate(
            {},
            { $set: update },
            { new: true, upsert: true }
        );
        return Response.json({ success: true, data: settings });
    } catch (e: any) {
        return Response.json({ success: false, message: e.message }, { status: 500 });
    }
}
