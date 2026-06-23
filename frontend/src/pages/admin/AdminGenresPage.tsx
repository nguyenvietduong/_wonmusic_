'use client';
import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { Tag, Plus, Search, Edit2, Trash2, Loader2, Music2 } from "lucide-react";

interface Genre {
    _id: string;
    name: string;
    nameEn?: string;
    color: string;
    description: string;
    descriptionEn?: string;
    trackCount?: number;
}

export default function AdminGenresPage() {
    const [genres, setGenres]   = useState<Genre[]>([]);
    const [filtered, setFiltered] = useState<Genre[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch]   = useState("");
    const [lang, setLang]       = useState<"vi" | "en">("vi");

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const loadGenres = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/api/genres");
            setGenres(res.data.data ?? []);
        } catch {
            toast.error("Không thể tải danh sách thể loại");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadGenres(); }, []);

    useEffect(() => {
        if (!search.trim()) { setFiltered(genres); return; }
        const q = search.toLowerCase();
        setFiltered(genres.filter(g =>
            g.name.toLowerCase().includes(q) ||
            g.nameEn?.toLowerCase().includes(q) ||
            g.description?.toLowerCase().includes(q) ||
            g.descriptionEn?.toLowerCase().includes(q)
        ));
    }, [genres, search]);

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await axios.delete(`/api/genres/${deleteId}`);
            toast.success("Đã xoá thể loại!");
            setDeleteId(null);
            loadGenres();
        } catch {
            toast.error("Không thể xoá thể loại");
        } finally {
            setDeleting(false);
        }
    };

    const displayName = (g: Genre) => lang === "en" ? (g.nameEn || g.name) : g.name;
    const displayDesc = (g: Genre) => lang === "en" ? (g.descriptionEn || g.description) : g.description;

    const totalTracks = genres.reduce((s, g) => s + (g.trackCount ?? 0), 0);
    const deletingGenre = genres.find(g => g._id === deleteId);

    return (
        <div>
            {/* ── Header ── */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400" />
                    <span className="text-xs text-gray-700 tracking-widest uppercase font-semibold">Won Music Admin</span>
                </div>
                <div className="flex items-end justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Quản lý Thể loại</h1>
                        <p className="text-sm text-gray-700 mt-1">Thêm, sửa, xoá thể loại nhạc trong hệ thống</p>
                    </div>
                    <Link
                        href="/admin/genres/new"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm font-semibold transition-colors"
                    >
                        <Plus size={15} /> Thêm thể loại
                    </Link>
                </div>
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {[
                    { label: "Tổng thể loại",        value: genres.length,                            color: "text-indigo-600",  bg: "bg-indigo-50",  border: "border-indigo-100"  },
                    { label: "Bài hát đã phân loại",  value: totalTracks,                              color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
                    { label: "Chưa có bài hát",       value: genres.filter(g => !g.trackCount).length, color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-100"   },
                ].map(({ label, value, color, bg, border }) => (
                    <div key={label} className={`${bg} border ${border} rounded-xl p-4`}>
                        <div className={`text-2xl font-bold ${color} mb-0.5`}>{loading ? "—" : value}</div>
                        <div className="text-xs text-gray-700 font-medium">{label}</div>
                    </div>
                ))}
            </div>

            {/* ── Toolbar ── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 mb-4 flex items-center gap-3 flex-wrap">
                {/* Search */}
                <div className="relative flex-1 min-w-48">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
                    <input
                        className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder={lang === "vi" ? "Tìm thể loại..." : "Search genres..."}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <span className="text-xs text-gray-600 font-medium">{filtered.length} {lang === "vi" ? "thể loại" : "genres"}</span>

                {/* Lang toggle */}
                <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden">
                    <button
                        onClick={() => setLang("vi")}
                        className={`px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${lang === "vi" ? "bg-indigo-600 text-white" : "text-gray-700 hover:bg-gray-50"}`}
                    >
                        VI
                    </button>
                    <button
                        onClick={() => setLang("en")}
                        className={`px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${lang === "en" ? "bg-indigo-600 text-white" : "text-gray-700 hover:bg-gray-50"}`}
                    >
                        EN
                    </button>
                </div>
            </div>

            {/* ── Table ── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-[40px_1fr_2fr_80px_88px] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    <span>#</span>
                    <span>{lang === "vi" ? "Thể loại" : "Genre"}</span>
                    <span>{lang === "vi" ? "Mô tả" : "Description"}</span>
                    <span className="text-center">{lang === "vi" ? "Bài hát" : "Tracks"}</span>
                    <span />
                </div>

                {loading ? (
                    <div className="divide-y divide-gray-100">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="grid grid-cols-[40px_1fr_2fr_80px_88px] gap-4 px-5 py-4 animate-pulse items-center">
                                <div className="h-3 w-4 bg-gray-100 rounded" />
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-gray-100 flex-shrink-0" />
                                    <div className="h-3 w-24 bg-gray-100 rounded" />
                                </div>
                                <div className="h-3 w-full bg-gray-100 rounded" />
                                <div className="h-3 w-8 bg-gray-100 rounded mx-auto" />
                                <div className="h-3 w-16 bg-gray-100 rounded" />
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-20 flex flex-col items-center gap-3">
                        <Tag size={40} className="text-gray-200" />
                        <p className="text-sm text-gray-600">
                            {search
                                ? (lang === "vi" ? "Không tìm thấy thể loại nào" : "No genres found")
                                : (lang === "vi" ? "Chưa có thể loại nào" : "No genres yet")}
                        </p>
                        {!search && (
                            <Link href="/admin/genres/new" className="mt-1 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors">
                                + {lang === "vi" ? "Thêm ngay" : "Add genre"}
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filtered.map((g, idx) => (
                            <div
                                key={g._id}
                                className="grid grid-cols-[40px_1fr_2fr_80px_88px] gap-4 px-5 py-3.5 items-center hover:bg-gray-50/60 transition-colors group"
                            >
                                {/* # */}
                                <span className="text-xs text-gray-300 font-mono">{idx + 1}</span>

                                {/* Name */}
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ background: g.color }}
                                    />
                                    <span className="text-sm font-semibold text-gray-800 truncate">{displayName(g)}</span>
                                    {lang === "en" && !g.nameEn && (
                                        <span className="text-[10px] text-amber-500 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded flex-shrink-0">
                                            VI
                                        </span>
                                    )}
                                </div>

                                {/* Description */}
                                <p className="text-xs text-gray-600 truncate leading-relaxed">
                                    {displayDesc(g) || (
                                        <span className="italic text-gray-300">
                                            {lang === "vi" ? "Chưa có mô tả" : "No description"}
                                        </span>
                                    )}
                                    {lang === "en" && !g.descriptionEn && g.description && (
                                        <span className="ml-1 text-[10px] text-amber-400">(VI)</span>
                                    )}
                                </p>

                                {/* Track count */}
                                <div className="flex items-center justify-center gap-1">
                                    {(g.trackCount ?? 0) > 0 ? (
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: g.color }}>
                                            <Music2 size={11} /> {g.trackCount}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-300">—</span>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Link
                                        href={`/admin/genres/${g._id}/edit`}
                                        className="w-7 h-7 rounded-md flex items-center justify-center text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                        title={lang === "vi" ? "Chỉnh sửa" : "Edit"}
                                    >
                                        <Edit2 size={13} />
                                    </Link>
                                    <button
                                        onClick={() => setDeleteId(g._id)}
                                        className="w-7 h-7 rounded-md flex items-center justify-center text-gray-600 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                                        title={lang === "vi" ? "Xoá" : "Delete"}
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Delete confirm ── */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={20} className="text-red-500" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-1">
                            {lang === "vi" ? "Xoá thể loại?" : "Delete genre?"}
                        </h3>
                        {deletingGenre && (
                            <p className="text-sm text-gray-700 mb-1">
                                {lang === "vi" ? "Bạn sắp xoá" : "You're about to delete"}{" "}
                                <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold text-white"
                                    style={{ background: deletingGenre.color }}
                                >
                                    {displayName(deletingGenre)}
                                </span>
                            </p>
                        )}
                        <p className="text-xs text-gray-600 mb-6">
                            {lang === "vi"
                                ? "Bài hát thuộc thể loại này sẽ không bị xoá."
                                : "Tracks in this genre will not be deleted."}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteId(null)}
                                disabled={deleting}
                                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                {lang === "vi" ? "Huỷ" : "Cancel"}
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                {lang === "vi" ? "Xoá" : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
