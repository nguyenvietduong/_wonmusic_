'use client';
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { ChevronLeft, Tag, Save, Loader2, AlertCircle, Hash, Calendar, Palette, Music2 } from "lucide-react";

const PRESET_COLORS = [
    "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#ef4444",
    "#f97316", "#eab308", "#22c55e", "#14b8a6", "#06b6d4",
    "#3b82f6", "#64748b",
];

const inputCls = "w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400 transition-shadow";

export default function AdminGenreEditPage() {
    const params = useParams();
    const id = params?.id as string;

    const [genre, setGenre] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({
        name: "", nameEn: "",
        color: "#6366f1",
        description: "", descriptionEn: "",
    });
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (!id) return;
        axios.get("/api/genres").then(res => {
            const found = (res.data.data ?? []).find((g: any) => g._id === id);
            if (found) {
                setGenre(found);
                setForm({
                    name:          found.name          ?? "",
                    nameEn:        found.nameEn        ?? "",
                    color:         found.color         ?? "#6366f1",
                    description:   found.description   ?? "",
                    descriptionEn: found.descriptionEn ?? "",
                });
            }
        }).catch(() => {
            setError("Không thể tải thông tin thể loại");
        }).finally(() => setLoading(false));
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!form.name.trim()) { setError("Vui lòng nhập tên thể loại (Tiếng Việt)"); return; }
        setSaving(true);
        try {
            await axios.patch(`/api/genres/${id}`, {
                ...form,
                name:          form.name.trim(),
                nameEn:        form.nameEn.trim(),
                description:   form.description.trim(),
                descriptionEn: form.descriptionEn.trim(),
            });
            toast.success("Đã cập nhật thể loại!");
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (err: any) {
            setError(err?.response?.data?.message ?? "Đã có lỗi xảy ra");
        } finally {
            setSaving(false);
        }
    };

    // ── Loading skeleton ──
    if (loading) return (
        <div className="animate-pulse">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-gray-100" />
                    <div className="space-y-2">
                        <div className="h-3 w-28 bg-gray-100 rounded" />
                        <div className="h-5 w-48 bg-gray-100 rounded" />
                    </div>
                </div>
                <div className="flex gap-3">
                    <div className="h-10 w-20 bg-gray-100 rounded-lg" />
                    <div className="h-10 w-32 bg-gray-100 rounded-lg" />
                </div>
            </div>
            <div className="grid grid-cols-3 gap-7">
                <div className="col-span-2 space-y-5">
                    {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-200 h-32" />)}
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 h-64" />
            </div>
        </div>
    );

    // ── Not found ──
    if (!genre && !loading) return (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
            <AlertCircle size={44} className="text-red-200" />
            <p className="text-sm text-gray-400">Không tìm thấy thể loại</p>
            <Link href="/admin/genres" className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors">
                ← Quay lại danh sách
            </Link>
        </div>
    );

    const previewName = form.name || form.nameEn || "Preview";

    return (
        <form onSubmit={handleSubmit} className="min-h-full">

            {/* ── Page header ── */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/genres"
                        className="w-9 h-9 rounded-full border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-all shadow-sm"
                    >
                        <ChevronLeft size={18} />
                    </Link>
                    <div>
                        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                            <Link href="/admin/genres" className="hover:text-indigo-600 transition-colors">Thể loại</Link>
                            <span>/</span>
                            <span className="text-gray-500 max-w-[140px] truncate">{genre?.name}</span>
                            <span>/</span>
                            <span className="text-gray-700 font-medium">Chỉnh sửa</span>
                        </nav>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Chỉnh sửa thể loại</h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/admin/genres" className="px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                        Huỷ
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm cursor-pointer text-white"
                        style={{ background: saving ? "#6366f1" : saved ? "#22c55e" : "#4f46e5" }}
                    >
                        {saving
                            ? <><Loader2 size={15} className="animate-spin" /> Đang lưu...</>
                            : saved
                            ? <><Save size={15} /> Đã lưu!</>
                            : <><Save size={15} /> Lưu thay đổi</>
                        }
                    </button>
                </div>
            </div>

            {/* ── Content grid ── */}
            <div className="grid grid-cols-3 gap-7 items-start">

                {/* ── Left: form (2/3) ── */}
                <div className="col-span-2 space-y-5">

                    {/* Section: tên thể loại */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
                            <div className="w-1 h-4 rounded-full flex-shrink-0 transition-colors duration-200" style={{ background: form.color }} />
                            <h2 className="text-sm font-semibold text-gray-800">Tên thể loại</h2>
                        </div>
                        <div className="px-6 py-5">
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 leading-none">VI</span>
                                        Tiếng Việt <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                        placeholder="VD: V-Pop, Nhạc Vàng..."
                                        className={inputCls}
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-700 leading-none">EN</span>
                                        English
                                    </label>
                                    <input
                                        type="text"
                                        value={form.nameEn}
                                        onChange={e => setForm(f => ({ ...f, nameEn: e.target.value }))}
                                        placeholder="E.g. Vietnamese Pop, Classic..."
                                        className={inputCls}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: màu sắc */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
                            <div className="w-1 h-4 rounded-full flex-shrink-0 transition-colors duration-200" style={{ background: form.color }} />
                            <h2 className="text-sm font-semibold text-gray-800">Màu đại diện</h2>
                        </div>
                        <div className="px-6 py-5">
                            <div className="flex items-center gap-3 flex-wrap">
                                {PRESET_COLORS.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setForm(f => ({ ...f, color: c }))}
                                        className="w-8 h-8 rounded-full transition-all cursor-pointer flex-shrink-0"
                                        style={{
                                            background: c,
                                            outline: form.color === c ? `3px solid ${c}` : "3px solid transparent",
                                            outlineOffset: "2px",
                                            transform: form.color === c ? "scale(1.2)" : "scale(1)",
                                        }}
                                    />
                                ))}
                                <label className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300 cursor-pointer hover:border-indigo-400 transition-colors relative overflow-hidden flex-shrink-0" title="Màu tuỳ chỉnh">
                                    <Palette size={13} className="text-gray-400 pointer-events-none" />
                                    <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </label>
                                <div className="flex items-center gap-2 ml-1 pl-3 border-l border-gray-200">
                                    <div className="w-6 h-6 rounded-lg border border-black/10 shadow-sm transition-colors duration-200" style={{ background: form.color }} />
                                    <span className="text-xs font-mono text-gray-500 tracking-wider">{form.color.toUpperCase()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: mô tả */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
                            <div className="w-1 h-4 rounded-full flex-shrink-0 transition-colors duration-200" style={{ background: form.color }} />
                            <h2 className="text-sm font-semibold text-gray-800">Mô tả <span className="text-gray-400 text-xs font-normal">(tuỳ chọn)</span></h2>
                        </div>
                        <div className="px-6 py-5">
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 leading-none">VI</span>
                                        Tiếng Việt
                                    </label>
                                    <textarea rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Mô tả ngắn về thể loại này..." className={`${inputCls} resize-none`} />
                                    <p className="text-xs text-gray-400 mt-1 text-right">{form.description.length} ký tự</p>
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-700 leading-none">EN</span>
                                        English
                                    </label>
                                    <textarea rows={4} value={form.descriptionEn} onChange={e => setForm(f => ({ ...f, descriptionEn: e.target.value }))} placeholder="Short description of this genre..." className={`${inputCls} resize-none`} />
                                    <p className="text-xs text-gray-400 mt-1 text-right">{form.descriptionEn.length} chars</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                            <span className="text-red-400 leading-none">⚠</span> {error}
                        </div>
                    )}

                    {/* System info */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
                            <div className="w-1 h-4 rounded-full bg-gray-300 flex-shrink-0" />
                            <h2 className="text-sm font-semibold text-gray-800">Thông tin hệ thống</h2>
                        </div>
                        <div className="px-6 py-5">
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { icon: Hash,     label: "Genre ID",  value: id,   mono: true },
                                    { icon: Calendar, label: "Ngày tạo",  value: genre?.createdAt ? new Date(genre.createdAt).toLocaleDateString("vi-VN") : "—", mono: false },
                                    { icon: Calendar, label: "Cập nhật",  value: genre?.updatedAt ? new Date(genre.updatedAt).toLocaleDateString("vi-VN") : "—", mono: false },
                                ].map(({ icon: Icon, label, value, mono }) => (
                                    <div key={label} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                        <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Icon size={12} className="text-gray-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-0.5">{label}</p>
                                            <p className={`text-xs text-gray-700 truncate ${mono ? "font-mono" : "font-medium"}`}>{value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Right: preview (1/3) ── */}
                <div className="sticky top-4 space-y-4">
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/60">
                            <div className="w-1 h-4 rounded-full bg-gray-300 flex-shrink-0" />
                            <h2 className="text-sm font-semibold text-gray-800">Xem trước</h2>
                        </div>
                        <div className="h-2 w-full transition-colors duration-200" style={{ background: `linear-gradient(90deg, ${form.color}, ${form.color}88)` }} />
                        <div className="p-5 space-y-5">
                            {/* VI preview */}
                            <div>
                                <div className="flex items-center gap-1.5 mb-2">
                                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">VI</span>
                                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Preview</span>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-200" style={{ background: `${form.color}22` }}>
                                        <Tag size={15} style={{ color: form.color }} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-gray-900 truncate">
                                            {form.name || <span className="text-gray-300 font-normal italic">Tên thể loại</span>}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
                                            {form.description || <span className="italic text-gray-300">Mô tả...</span>}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* EN preview */}
                            <div>
                                <div className="flex items-center gap-1.5 mb-2">
                                    <span className="text-[10px] font-bold bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded">EN</span>
                                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Preview</span>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-200" style={{ background: `${form.color}22` }}>
                                        <Tag size={15} style={{ color: form.color }} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-gray-900 truncate">
                                            {form.nameEn || form.name || <span className="text-gray-300 font-normal italic">Genre name</span>}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
                                            {form.descriptionEn || <span className="italic text-gray-300">Description...</span>}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Track count */}
                            {(genre?.trackCount ?? 0) > 0 && (
                                <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                                    <Music2 size={13} style={{ color: form.color }} />
                                    <span className="text-xs text-gray-500">
                                        <span className="font-bold" style={{ color: form.color }}>{genre.trackCount}</span> bài hát
                                    </span>
                                </div>
                            )}

                            {/* Badge */}
                            <div className="pt-1 border-t border-gray-100">
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Badge</p>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white transition-colors duration-200" style={{ background: form.color }}>
                                    <Tag size={10} /> {previewName}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </form>
    );
}
