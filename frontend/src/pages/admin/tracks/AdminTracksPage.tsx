'use client';
// src/pages/admin/AdminTracksPage.tsx
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import {
    Music, Search, Plus, Play, Clock, Disc3,
    Edit2, ArrowUpDown, TrendingUp, X, Upload, Link2,
} from "lucide-react";
import { trackService } from "@/services/trackService";
import { artistService, Artist } from "@/services/artistService";

// ─── constants ──────────────────────────────────────────────────────────────
const GENRES = [
    "Pop", "Rock", "R&B", "Hip-Hop", "Electronic", "Jazz",
    "Classical", "Country", "Folk", "Indie", "Metal", "Soul",
    "Reggae", "Blues", "Latin", "K-Pop", "V-Pop", "Other",
];

// ─── helpers ────────────────────────────────────────────────────────────────
const formatNum = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
};
const formatTime = (sec: number) =>
    `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;

const EQ_H = [40, 70, 55, 85, 45, 75, 60, 90, 50, 65];

type SortKey = "title" | "plays" | "duration" | "createdAt";
type SortDir = "asc" | "desc";
type SourceMode = "url" | "upload";

interface ModalForm {
    title: string;
    artistId: string;
    audioUrl: string;
    coverUrl: string;
    genre: string;
    releaseYear: string;
    duration: string;
    isPublished: boolean;
}

const EMPTY_FORM: ModalForm = {
    title: "",
    artistId: "",
    audioUrl: "",
    coverUrl: "",
    genre: "",
    releaseYear: new Date().getFullYear().toString(),
    duration: "",
    isPublished: true,
};

// ─── Component ──────────────────────────────────────────────────────────────
export default function AdminTracksPage() {
    // ── track list state ──
    const [tracks, setTracks] = useState<any[]>([]);
    const [filtered, setFiltered] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("createdAt");
    const [sortDir, setSortDir] = useState<SortDir>("desc");
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const PER_PAGE = 10;

    // ── modal state ──
    const [showModal, setShowModal] = useState(false);
    const [artists, setArtists] = useState<Artist[]>([]);
    const [sourceMode, setSourceMode] = useState<SourceMode>("url");
    const [form, setForm] = useState<ModalForm>(EMPTY_FORM);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [audioDuration, setAudioDuration] = useState<number>(0); // giây, đọc tự động từ file
    const [submitting, setSubmitting] = useState(false);
    const [modalError, setModalError] = useState("");
    const audioInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    // đọc thời lượng từ file audio bằng Audio API (client-side)
    const readFileDuration = (file: File): Promise<number> =>
        new Promise(resolve => {
            const el  = new Audio();
            const url = URL.createObjectURL(file);
            el.addEventListener("loadedmetadata", () => {
                resolve(isFinite(el.duration) ? Math.round(el.duration) : 0);
                URL.revokeObjectURL(url);
            });
            el.addEventListener("error", () => { resolve(0); URL.revokeObjectURL(url); });
            el.src = url;
        });

    // ── load tracks ──
    const loadTracks = async () => {
        setLoading(true);
        try {
            const data = await trackService.getAll({ limit: 200 });
            setTracks(data.data ?? []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadTracks(); }, []);

    // ── load artists when modal opens ──
    useEffect(() => {
        if (!showModal) return;
        artistService.getAll({ limit: 200 }).then(res => setArtists(res.data ?? [])).catch(() => {});
    }, [showModal]);

    // ── filter / sort ──
    useEffect(() => {
        let list = [...tracks];
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                t =>
                    t.title?.toLowerCase().includes(q) ||
                    t.artistId?.name?.toLowerCase().includes(q) ||
                    t.genre?.toLowerCase().includes(q)
            );
        }
        list.sort((a, b) => {
            const av = a[sortKey] ?? 0;
            const bv = b[sortKey] ?? 0;
            if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
            return sortDir === "asc" ? av - bv : bv - av;
        });
        setFiltered(list);
        setPage(1);
    }, [tracks, search, sortKey, sortDir]);

    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) setSortDir(d => (d === "asc" ? "desc" : "asc"));
        else { setSortKey(key); setSortDir("desc"); }
    };

    const totalPlays = tracks.reduce((s, t) => s + (t.plays ?? 0), 0);
    const totalDuration = tracks.reduce((s, t) => s + (t.duration ?? 0), 0);
    const avgPlays = tracks.length ? Math.round(totalPlays / tracks.length) : 0;

    const STATS = [
        { label: "Tổng bài hát", value: tracks.length, icon: Music, iconColor: "text-green-400", iconBg: "bg-green-400/10" },
        { label: "Tổng lượt nghe", value: formatNum(totalPlays), icon: TrendingUp, iconColor: "text-blue-400", iconBg: "bg-blue-400/10" },
        { label: "Trung bình nghe", value: formatNum(avgPlays), icon: Play, iconColor: "text-pink-400", iconBg: "bg-pink-400/10" },
        { label: "Tổng thời lượng", value: formatTime(totalDuration), icon: Clock, iconColor: "text-orange-400", iconBg: "bg-orange-400/10" },
    ];

    // ── modal helpers ──
    const openModal = () => {
        setForm(EMPTY_FORM);
        setAudioFile(null);
        setCoverFile(null);
        setAudioDuration(0);
        setSourceMode("upload");
        setModalError("");
        setShowModal(true);
    };

    const closeModal = () => {
        if (submitting) return;
        setShowModal(false);
    };

    const handleFormChange = (field: keyof ModalForm, value: string | boolean) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        setModalError("");
        if (!form.title.trim()) { setModalError("Vui lòng nhập tiêu đề bài hát."); return; }
        if (!form.artistId) { setModalError("Vui lòng chọn nghệ sĩ."); return; }
        if (sourceMode === "url" && !form.audioUrl.trim()) { setModalError("Vui lòng nhập URL audio."); return; }
        if (sourceMode === "upload" && !audioFile) { setModalError("Vui lòng chọn file audio."); return; }

        setSubmitting(true);
        try {
            if (sourceMode === "url") {
                await axios.post("/api/tracks", {
                    title: form.title.trim(),
                    artistId: form.artistId,
                    audioUrl: form.audioUrl.trim(),
                    coverUrl: form.coverUrl.trim() || undefined,
                    genre: form.genre || undefined,
                    releaseYear: form.releaseYear ? Number(form.releaseYear) : undefined,
                    duration: form.duration ? Number(form.duration) : undefined,
                    isPublished: form.isPublished,
                });
            } else {
                const fd = new FormData();
                fd.append("title", form.title.trim());
                fd.append("artistId", form.artistId);
                if (audioFile) fd.append("audio", audioFile);
                if (coverFile) fd.append("cover", coverFile);
                if (form.genre) fd.append("genre", form.genre);
                if (form.releaseYear) fd.append("releaseYear", form.releaseYear);
                fd.append("isPublished", String(form.isPublished));
                // gửi duration đã đọc tự động từ file
                if (audioDuration > 0) fd.append("duration", String(audioDuration));
                await axios.post("/api/tracks", fd);
            }
            toast.success("Thêm bài hát thành công!");
            setShowModal(false);
            loadTracks();
        } catch (err: any) {
            const msg = err?.response?.data?.message ?? err?.message ?? "Đã có lỗi xảy ra.";
            setModalError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    // ── shared input class ──
    const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-gray-900 placeholder-gray-400";

    return (
        <div>
            <style>{`
                @keyframes ahEq     { 0%,100%{transform:scaleY(.2)} 50%{transform:scaleY(1)} }
                @keyframes ahFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
                @keyframes ahBar    { from{width:0} to{width:var(--w)} }
            `}</style>

            {/* ── Header ── */}
            <div className="mb-7" style={{ animation: "ahFadeUp .3s both" }}>
                <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400" />
                    <span className="text-xs text-gray-500 tracking-widest uppercase font-semibold">Won Music Admin</span>
                </div>
                <div className="flex items-end justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Danh Sách Bài Hát</h1>
                        <p className="text-sm text-gray-500 mt-1">Quản lý toàn bộ bài hát trong hệ thống</p>
                    </div>
                    <button
                        onClick={openModal}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-colors"
                    >
                        <Plus size={15} /> Thêm bài hát
                    </button>
                </div>
                {/* EQ bars */}
                <div className="flex items-end gap-0.5 h-5 mt-3">
                    {EQ_H.map((h, i) => (
                        <div
                            key={i}
                            className="w-1 rounded-sm bg-indigo-400/40"
                            style={{
                                height: `${h}%`,
                                transformOrigin: "bottom",
                                animation: `ahEq ${.38 + (i % 5) * .13}s ease-in-out infinite`,
                                animationDelay: `${i * .07}s`,
                                opacity: 0.2 + i * 0.055,
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
                {STATS.map(({ label, value, icon: Icon, iconColor, iconBg }, i) => (
                    <div
                        key={label}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
                        style={{ animation: `ahFadeUp .4s ${i * .07}s both` }}
                    >
                        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-3`}>
                            <Icon size={18} className={iconColor} />
                        </div>
                        <div className="text-2xl font-bold text-gray-900 leading-none mb-1">
                            {loading ? "—" : value}
                        </div>
                        <p className="text-xs text-gray-500 font-medium">{label}</p>
                    </div>
                ))}
            </div>

            {/* ── Table card ── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

                {/* Toolbar */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 flex-wrap">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                            className="bg-white border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-56"
                            placeholder="Tìm bài hát, nghệ sĩ..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex-1" />
                    <span className="text-xs text-gray-400 font-medium">{filtered.length} kết quả</span>
                </div>

                {/* Scrollable table wrapper */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
                        <colgroup>
                            <col style={{ width: 50 }} />
                            <col style={{ width: 58 }} />
                            <col style={{ minWidth: 160 }} />
                            <col style={{ width: 140 }} />
                            <col style={{ width: 110 }} />
                            <col style={{ width: 110 }} />
                            <col style={{ width: 190 }} />
                        </colgroup>
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                                <th />
                                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    <button
                                        className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition-colors ${sortKey === "title" ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"}`}
                                        onClick={() => toggleSort("title")}
                                    >
                                        Bài hát <ArrowUpDown size={10} />
                                    </button>
                                </th>
                                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Nghệ sĩ</th>
                                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    <button
                                        className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition-colors ${sortKey === "plays" ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"}`}
                                        onClick={() => toggleSort("plays")}
                                    >
                                        Lượt nghe <ArrowUpDown size={10} />
                                    </button>
                                </th>
                                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    <button
                                        className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition-colors ${sortKey === "duration" ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"}`}
                                        onClick={() => toggleSort("duration")}
                                    >
                                        Thời lượng <ArrowUpDown size={10} />
                                    </button>
                                </th>
                                <th className="px-3 py-2.5 pr-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading
                                ? Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i} className="border-b border-gray-100 animate-pulse">
                                        <td className="px-3 py-2.5 text-center">
                                            <div className="w-5 h-2.5 rounded bg-gray-100 mx-auto" />
                                        </td>
                                        <td className="px-2 py-2">
                                            <div className="w-9 h-9 rounded-lg bg-gray-100" />
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <div className="h-3 bg-gray-100 rounded w-3/5 mb-2" />
                                            <div className="h-1.5 bg-gray-100 rounded w-4/5" />
                                        </td>
                                        <td className="px-3 py-2.5"><div className="h-3 bg-gray-100 rounded w-4/5" /></td>
                                        <td className="px-3 py-2.5"><div className="h-3 bg-gray-100 rounded w-3/5" /></td>
                                        <td className="px-3 py-2.5"><div className="h-3 bg-gray-100 rounded w-1/2" /></td>
                                        <td />
                                    </tr>
                                ))
                                : paginated.length === 0
                                    ? (
                                        <tr>
                                            <td colSpan={7} className="py-16 text-center">
                                                <Disc3 size={40} className="text-gray-200 mx-auto mb-3" />
                                                <p className="text-sm text-gray-400">Không tìm thấy bài hát nào</p>
                                            </td>
                                        </tr>
                                    )
                                    : paginated.map((track, idx) => {
                                        const pct = Math.round((track.plays / (tracks[0]?.plays || 1)) * 100);
                                        const isPlaying = playingId === track._id;
                                        const globalIdx = (page - 1) * PER_PAGE + idx + 1;

                                        return (
                                            <tr
                                                key={track._id}
                                                className="hover:bg-gray-50 border-b border-gray-100"
                                                style={{ animation: `ahFadeUp .28s ${idx * .03}s both` }}
                                            >
                                                {/* # / EQ */}
                                                <td className="px-3 py-2.5 text-center">
                                                    {isPlaying
                                                        ? <div className="flex items-end gap-0.5 h-3.5 justify-center">
                                                            {[40, 80, 55, 90, 65].map((h, i) => (
                                                                <div
                                                                    key={i}
                                                                    className="w-0.5 bg-indigo-500 rounded-sm"
                                                                    style={{
                                                                        height: `${h}%`,
                                                                        transformOrigin: "bottom",
                                                                        animation: `ahEq ${.38 + i * .1}s ease-in-out infinite`,
                                                                    }}
                                                                />
                                                            ))}
                                                        </div>
                                                        : <span className="text-xs font-mono text-gray-300">
                                                            {String(globalIdx).padStart(2, "0")}
                                                        </span>
                                                    }
                                                </td>

                                                {/* Cover / play toggle */}
                                                <td className="px-2 py-2">
                                                    <div
                                                        onClick={() => setPlayingId(isPlaying ? null : track._id)}
                                                        className="w-9 h-9 rounded-lg overflow-hidden cursor-pointer bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center flex-shrink-0"
                                                    >
                                                        {track.coverUrl
                                                            ? <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                                                            : <span className="text-base text-indigo-500">♪</span>
                                                        }
                                                    </div>
                                                </td>

                                                {/* Title + popularity bar */}
                                                <td className="px-3 py-2.5 overflow-hidden">
                                                    <Link href={`/admin/tracks/${track._id}`} className="block no-underline">
                                                        <p className="text-sm font-semibold text-gray-900 mb-1 truncate">
                                                            {track.title}
                                                        </p>
                                                        <div className="h-0.5 bg-gray-100 rounded overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded"
                                                                style={{
                                                                    width: `${pct}%`,
                                                                    animation: "ahBar .7s cubic-bezier(.4,0,.2,1) both",
                                                                    ["--w" as any]: `${pct}%`,
                                                                }}
                                                            />
                                                        </div>
                                                    </Link>
                                                </td>

                                                {/* Artist */}
                                                <td className="px-3 py-2.5 text-xs text-gray-400 truncate">
                                                    {track.artistId?.name ?? "—"}
                                                </td>

                                                {/* Plays */}
                                                <td className="px-3 py-2.5">
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <Play size={11} className="text-indigo-400/70" />
                                                        <span className="text-sm font-semibold text-gray-600">
                                                            {formatNum(track.plays ?? 0)}
                                                        </span>
                                                    </span>
                                                </td>

                                                {/* Duration */}
                                                <td className="px-3 py-2.5">
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <Clock size={11} className="text-gray-300" />
                                                        <span className="text-sm text-gray-400">
                                                            {formatTime(track.duration ?? 0)}
                                                        </span>
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-3 py-2.5 pr-4 text-right whitespace-nowrap">
                                                    <Link
                                                        href={`/admin/tracks/${track._id}/edit`}
                                                        className="text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                                                        onClick={e => e.stopPropagation()}
                                                    >
                                                        <Edit2 size={12} /> Sửa
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })
                            }
                        </tbody>
                    </table>
                </div>

                {/* ── Pagination ── */}
                {!loading && filtered.length > PER_PAGE && (
                    <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs text-gray-400 font-medium">
                            Trang {page} / {totalPages} · {filtered.length} bài hát
                        </span>
                        <div className="flex gap-1.5">
                            <button className="border border-gray-200 rounded-lg px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed" disabled={page === 1} onClick={() => setPage(1)}>«</button>
                            <button className="border border-gray-200 rounded-lg px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const p = Math.min(Math.max(page - 2, 1), Math.max(totalPages - 4, 1)) + i;
                                return p <= totalPages ? (
                                    <button
                                        key={p}
                                        className={`border rounded-lg px-3 py-1 text-sm transition-colors ${page === p ? "border-indigo-500 bg-indigo-50 text-indigo-600 font-bold" : "border-gray-200 hover:bg-gray-50"}`}
                                        onClick={() => setPage(p)}
                                    >{p}</button>
                                ) : null;
                            })}
                            <button className="border border-gray-200 rounded-lg px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
                            <button className="border border-gray-200 rounded-lg px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed" disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Modal: Thêm bài hát ── */}
            {showModal && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
                >
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">

                        {/* Modal header */}
                        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                                    <Music size={16} className="text-indigo-600" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900">Thêm bài hát mới</h2>
                            </div>
                            <button
                                onClick={closeModal}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal body */}
                        <div className="px-6 py-4 space-y-4 max-h-[65vh] overflow-y-auto">

                            {/* Title */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    Tiêu đề <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    className={inputCls}
                                    placeholder="Nhập tên bài hát..."
                                    value={form.title}
                                    onChange={e => handleFormChange("title", e.target.value)}
                                />
                            </div>

                            {/* Artist */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    Nghệ sĩ <span className="text-red-500">*</span>
                                </label>
                                <select
                                    className={inputCls}
                                    value={form.artistId}
                                    onChange={e => handleFormChange("artistId", e.target.value)}
                                >
                                    <option value="">-- Chọn nghệ sĩ --</option>
                                    {artists.map(a => (
                                        <option key={a._id} value={a._id}>{a.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Source mode toggle */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nguồn audio</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSourceMode("upload")}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold border transition-all ${sourceMode === "upload" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-300 hover:border-indigo-300"}`}
                                    >
                                        <Upload size={14} /> Upload file
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSourceMode("url")}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold border transition-all ${sourceMode === "url" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-300 hover:border-indigo-300"}`}
                                    >
                                        <Link2 size={14} /> URL trực tiếp
                                    </button>
                                </div>
                            </div>

                            {/* URL mode fields */}
                            {sourceMode === "url" && (
                                <>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                                            URL Audio <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className={inputCls}
                                            placeholder="https://..."
                                            value={form.audioUrl}
                                            onChange={e => handleFormChange("audioUrl", e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">URL Ảnh bìa</label>
                                        <input
                                            type="text"
                                            className={inputCls}
                                            placeholder="https://... (tuỳ chọn)"
                                            value={form.coverUrl}
                                            onChange={e => handleFormChange("coverUrl", e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Thời lượng (giây)</label>
                                        <input
                                            type="number"
                                            className={inputCls}
                                            placeholder="Ví dụ: 214 (= 3:34)"
                                            min={0}
                                            value={form.duration}
                                            onChange={e => handleFormChange("duration", e.target.value)}
                                        />
                                    </div>
                                </>
                            )}

                            {/* Upload mode fields */}
                            {sourceMode === "upload" && (
                                <>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                                            File Audio <span className="text-red-500">*</span>
                                        </label>
                                        <div
                                            className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-300 transition-colors"
                                            onClick={() => audioInputRef.current?.click()}
                                        >
                                            <input
                                                ref={audioInputRef}
                                                type="file"
                                                accept="audio/*"
                                                className="hidden"
                                                onChange={async e => {
                                                    const file = e.target.files?.[0] ?? null;
                                                    setAudioFile(file);
                                                    if (file) {
                                                        const dur = await readFileDuration(file);
                                                        setAudioDuration(dur);
                                                    } else {
                                                        setAudioDuration(0);
                                                    }
                                                }}
                                            />
                                            {audioFile ? (
                                                <div>
                                                    <p className="text-sm text-indigo-600 font-medium">{audioFile.name}</p>
                                                    {audioDuration > 0 && (
                                                        <p className="text-xs text-gray-400 mt-0.5">
                                                            Thời lượng: {Math.floor(audioDuration / 60)}:{String(audioDuration % 60).padStart(2, "0")}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-400">Click để chọn file audio</p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">File Ảnh bìa</label>
                                        <div
                                            className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-300 transition-colors"
                                            onClick={() => coverInputRef.current?.click()}
                                        >
                                            <input
                                                ref={coverInputRef}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={e => setCoverFile(e.target.files?.[0] ?? null)}
                                            />
                                            {coverFile
                                                ? <p className="text-sm text-indigo-600 font-medium">{coverFile.name}</p>
                                                : <p className="text-sm text-gray-400">Click để chọn ảnh bìa (tuỳ chọn)</p>
                                            }
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Genre */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Thể loại</label>
                                    <select
                                        className={inputCls}
                                        value={form.genre}
                                        onChange={e => handleFormChange("genre", e.target.value)}
                                    >
                                        <option value="">-- Chọn thể loại --</option>
                                        {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Năm phát hành</label>
                                    <input
                                        type="number"
                                        className={inputCls}
                                        placeholder="2024"
                                        min={1900}
                                        max={new Date().getFullYear() + 1}
                                        value={form.releaseYear}
                                        onChange={e => handleFormChange("releaseYear", e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Published toggle */}
                            <div className="flex items-center justify-between py-1">
                                <span className="text-xs font-semibold text-gray-600">Công khai ngay</span>
                                <button
                                    type="button"
                                    onClick={() => handleFormChange("isPublished", !form.isPublished)}
                                    className={`relative w-11 h-6 rounded-full transition-colors ${form.isPublished ? "bg-indigo-600" : "bg-gray-200"}`}
                                >
                                    <span
                                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isPublished ? "translate-x-5" : "translate-x-0"}`}
                                    />
                                </button>
                            </div>

                            {/* Error */}
                            {modalError && (
                                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">
                                    {modalError}
                                </div>
                            )}
                        </div>

                        {/* Modal footer */}
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={submitting}
                                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Huỷ
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Đang lưu...
                                    </>
                                ) : (
                                    <><Plus size={15} /> Thêm bài hát</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
