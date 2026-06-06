'use client';
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
    Mic2, Search, Plus, Users, TrendingUp, Edit2,
    ArrowUpDown, CheckCircle2, Music, Instagram,
    Youtube, Facebook, BadgeCheck, Star, X, ChevronDown,
} from "lucide-react";
import { artistService } from "@/services/artistService";
import axios from "axios";
import { toast } from "sonner";

// ─── helpers ────────────────────────────────────────────────────────────────
const fNum = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
};

const EQ_H = [35, 65, 50, 80, 40, 72, 55, 88, 45, 60];

const GENRE_OPTIONS = [
    "Pop", "R&B", "Hip-hop", "Rock", "Electronic",
    "Jazz", "Classical", "Folk", "Indie", "Ballad", "Rap",
];

type SortKey = "name" | "followers" | "createdAt";
type SortDir = "asc" | "desc";

interface FormState {
    name: string; genre: string; bio: string; avatarUrl: string;
    followers: string; verified: boolean;
    facebook: string; instagram: string; youtube: string;
}
const EMPTY: FormState = {
    name: "", genre: "", bio: "", avatarUrl: "",
    followers: "", verified: false,
    facebook: "", instagram: "", youtube: "",
};

const INPUT = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white transition-shadow";

// ─── Component ──────────────────────────────────────────────────────────────
export default function AdminArtistsPage() {
    const [artists,    setArtists]    = useState<any[]>([]);
    const [filtered,   setFiltered]   = useState<any[]>([]);
    const [loading,    setLoading]    = useState(true);
    const [search,     setSearch]     = useState("");
    const [sortKey,    setSortKey]    = useState<SortKey>("followers");
    const [sortDir,    setSortDir]    = useState<SortDir>("desc");
    const [page,       setPage]       = useState(1);
    const PER_PAGE = 10;

    const [showModal,  setShowModal]  = useState(false);
    const [form,       setForm]       = useState<FormState>(EMPTY);
    const [submitting, setSubmitting] = useState(false);
    const [formError,  setFormError]  = useState("");
    const [showSocial, setShowSocial] = useState(false);
    const overlayRef = useRef<HTMLDivElement>(null);

    // ── load ──
    const loadArtists = async () => {
        setLoading(true);
        try {
            const res = await artistService.getAll({ limit: 200 });
            setArtists(res?.data ?? []);
        } finally { setLoading(false); }
    };
    useEffect(() => { loadArtists(); }, []);

    // ── filter + sort ──
    useEffect(() => {
        let list = [...artists];
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(a =>
                a.name?.toLowerCase().includes(q) ||
                a.genre?.toLowerCase().includes(q) ||
                a.bio?.toLowerCase().includes(q)
            );
        }
        list.sort((a, b) => {
            const av = a[sortKey] ?? 0, bv = b[sortKey] ?? 0;
            if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
            return sortDir === "asc" ? av - bv : bv - av;
        });
        setFiltered(list);
        setPage(1);
    }, [artists, search, sortKey, sortDir]);

    const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const toggleSort = (key: SortKey) => {
        if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortKey(key); setSortDir("desc"); }
    };

    const totalFollowers = artists.reduce((s, a) => s + (a.followers ?? 0), 0);
    const verifiedCount  = artists.filter(a => a.verified).length;
    const avgFollowers   = artists.length ? Math.round(totalFollowers / artists.length) : 0;

    const STATS = [
        { label: "Tổng nghệ sĩ",  value: artists.length,            Icon: Mic2,       iconCls: "text-indigo-500", bgCls: "bg-indigo-50"  },
        { label: "Tổng followers", value: fNum(totalFollowers),      Icon: TrendingUp, iconCls: "text-blue-500",   bgCls: "bg-blue-50"    },
        { label: "TB followers",   value: fNum(avgFollowers),        Icon: Users,      iconCls: "text-pink-500",   bgCls: "bg-pink-50"    },
        { label: "Đã xác minh",   value: verifiedCount,             Icon: BadgeCheck, iconCls: "text-orange-500", bgCls: "bg-orange-50"  },
    ];

    // ── modal helpers ──
    const openModal  = () => { setForm(EMPTY); setFormError(""); setShowSocial(false); setShowModal(true); };
    const closeModal = () => { if (!submitting) setShowModal(false); };
    const setField   = (k: keyof FormState, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) { setFormError("Tên nghệ sĩ là bắt buộc."); return; }
        setFormError("");
        setSubmitting(true);
        try {
            const payload: Record<string, any> = {
                name:      form.name.trim(),
                genre:     form.genre.trim()    || undefined,
                bio:       form.bio.trim()      || undefined,
                avatar:    form.avatarUrl.trim()|| undefined,
                followers: form.followers ? Number(form.followers) : 0,
                verified:  form.verified,
            };
            const social: Record<string, string> = {};
            if (form.facebook.trim())  social.facebook  = form.facebook.trim();
            if (form.instagram.trim()) social.instagram = form.instagram.trim();
            if (form.youtube.trim())   social.youtube   = form.youtube.trim();
            if (Object.keys(social).length) payload.socialLinks = social;
            await axios.post("/api/artists", payload);
            toast.success("Đã thêm nghệ sĩ!");
            setShowModal(false);
            loadArtists();
        } catch (err: any) {
            setFormError(err?.response?.data?.message ?? err?.message ?? "Có lỗi xảy ra.");
        } finally { setSubmitting(false); }
    };

    return (
        <div>
            <style>{`
                @keyframes apUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
                @keyframes apEq  { 0%,100%{transform:scaleY(.2)} 50%{transform:scaleY(1)} }
                @keyframes apBar { from{width:0} to{width:var(--w)} }
                @keyframes apSc  { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
            `}</style>

            {/* ── Header ── */}
            <div className="mb-7" style={{ animation: "apUp .3s both" }}>
                <div className="flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
                    <span className="text-xs text-gray-500 tracking-widest uppercase font-semibold">Won Music Admin</span>
                </div>
                <div className="flex items-end justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Danh Sách Nghệ Sĩ</h1>
                        <p className="text-sm text-gray-500 mt-1">Quản lý toàn bộ nghệ sĩ trong hệ thống</p>
                    </div>
                    <button
                        onClick={openModal}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-colors cursor-pointer"
                    >
                        <Plus size={15} /> Thêm nghệ sĩ
                    </button>
                </div>
                {/* EQ decoration */}
                <div className="flex items-end gap-[2.5px] h-5 mt-3">
                    {EQ_H.map((h, i) => (
                        <div
                            key={i}
                            className="w-1 rounded-sm bg-indigo-400/40"
                            style={{
                                height: `${h}%`,
                                transformOrigin: "bottom",
                                animation: `apEq ${.38 + (i % 5) * .13}s ease-in-out infinite`,
                                animationDelay: `${i * .07}s`,
                                opacity: 0.2 + i * 0.055,
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
                {STATS.map(({ label, value, Icon, iconCls, bgCls }, i) => (
                    <div
                        key={label}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:-translate-y-0.5 hover:shadow-md transition-all"
                        style={{ animation: `apUp .4s ${i * .07}s both` }}
                    >
                        <div className={`w-10 h-10 rounded-xl ${bgCls} flex items-center justify-center mb-3`}>
                            <Icon size={18} className={iconCls} />
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
                            className="bg-white border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-60"
                            placeholder="Tìm nghệ sĩ, thể loại..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex-1" />
                    <span className="text-xs text-gray-400 font-medium">{filtered.length} kết quả</span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
                        <colgroup>
                            <col style={{ width: 48 }} />
                            <col style={{ width: 56 }} />
                            <col style={{ minWidth: 160 }} />
                            <col style={{ width: 110 }} />
                            <col style={{ width: 120 }} />
                            <col style={{ width: 100 }} />
                            <col style={{ width: 100 }} />
                            <col style={{ width: 110 }} />
                        </colgroup>
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                                <th />
                                <th className="px-3 py-2.5 text-left">
                                    <button
                                        onClick={() => toggleSort("name")}
                                        className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition-colors ${sortKey === "name" ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"}`}
                                    >
                                        Nghệ sĩ <ArrowUpDown size={10} />
                                    </button>
                                </th>
                                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Thể loại</th>
                                <th className="px-3 py-2.5 text-left">
                                    <button
                                        onClick={() => toggleSort("followers")}
                                        className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition-colors ${sortKey === "followers" ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"}`}
                                    >
                                        Followers <ArrowUpDown size={10} />
                                    </button>
                                </th>
                                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Social</th>
                                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Trạng thái</th>
                                <th className="px-3 py-2.5 pr-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading
                                ? Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i} className="border-b border-gray-100 animate-pulse">
                                        <td className="px-3 py-3 text-center"><div className="w-5 h-2.5 rounded bg-gray-100 mx-auto" /></td>
                                        <td className="px-2 py-2"><div className="w-9 h-9 rounded-full bg-gray-100" /></td>
                                        <td className="px-3 py-3">
                                            <div className="h-3 bg-gray-100 rounded w-3/5 mb-2" />
                                            <div className="h-1.5 bg-gray-50 rounded w-4/5" />
                                        </td>
                                        <td className="px-3 py-3"><div className="h-5 bg-gray-100 rounded-full w-14" /></td>
                                        <td className="px-3 py-3"><div className="h-3 bg-gray-100 rounded w-3/5" /></td>
                                        <td className="px-3 py-3"><div className="h-3 bg-gray-100 rounded w-4/5 mx-auto" /></td>
                                        <td className="px-3 py-3"><div className="h-5 bg-gray-100 rounded-full w-16 mx-auto" /></td>
                                        <td />
                                    </tr>
                                ))
                                : paginated.length === 0
                                ? (
                                    <tr>
                                        <td colSpan={8} className="py-16 text-center">
                                            <Mic2 size={40} className="text-gray-200 mx-auto mb-3" />
                                            <p className="text-sm text-gray-400">Không tìm thấy nghệ sĩ nào</p>
                                        </td>
                                    </tr>
                                )
                                : paginated.map((artist, idx) => {
                                    const globalIdx  = (page - 1) * PER_PAGE + idx + 1;
                                    const topFollower = artists[0]?.followers || 1;
                                    const pct        = Math.round((artist.followers / topFollower) * 100);
                                    const socials    = artist.socialLinks ?? {};
                                    const hasSocial  = socials.facebook || socials.instagram || socials.youtube || socials.tiktok;

                                    return (
                                        <tr
                                            key={artist._id}
                                            className="hover:bg-gray-50 border-b border-gray-100 transition-colors"
                                            style={{ animation: `apUp .28s ${idx * .03}s both` }}
                                        >
                                            {/* # */}
                                            <td className="px-3 py-2.5 text-center">
                                                <span className="text-xs font-mono text-gray-300">
                                                    {String(globalIdx).padStart(2, "0")}
                                                </span>
                                            </td>

                                            {/* Avatar */}
                                            <td className="px-2 py-2">
                                                <div className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-indigo-100 to-indigo-200 flex-shrink-0 ${artist.verified ? "ring-2 ring-indigo-400 ring-offset-1" : ""}`}>
                                                    {artist.avatar
                                                        ? <img src={artist.avatar} alt={artist.name} className="w-full h-full object-cover" />
                                                        : <Mic2 size={15} className="text-indigo-400" />
                                                    }
                                                </div>
                                            </td>

                                            {/* Name + bar */}
                                            <td className="px-3 py-2.5 overflow-hidden">
                                                <Link href={`/admin/artists/${artist._id}`} className="block no-underline">
                                                    <p className="text-sm font-semibold text-gray-900 truncate mb-1">{artist.name}</p>
                                                    <div className="h-0.5 bg-gray-100 rounded overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded"
                                                            style={{
                                                                width: `${pct}%`,
                                                                animation: "apBar .7s cubic-bezier(.4,0,.2,1) both",
                                                                ["--w" as any]: `${pct}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </Link>
                                            </td>

                                            {/* Genre */}
                                            <td className="px-3 py-2.5">
                                                {artist.genre
                                                    ? <span className="inline-block bg-indigo-50 text-indigo-600 text-xs font-medium px-2.5 py-0.5 rounded-full border border-indigo-100">
                                                        {artist.genre}
                                                      </span>
                                                    : <span className="text-xs text-gray-300">—</span>
                                                }
                                            </td>

                                            {/* Followers */}
                                            <td className="px-3 py-2.5">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Users size={11} className="text-indigo-400" />
                                                    <span className="text-sm font-semibold text-gray-700 tabular-nums">
                                                        {fNum(artist.followers ?? 0)}
                                                    </span>
                                                </span>
                                            </td>

                                            {/* Social */}
                                            <td className="px-3 py-2.5 text-center">
                                                {hasSocial
                                                    ? <div className="inline-flex gap-1 justify-center">
                                                        {socials.facebook  && <a href={socials.facebook}  target="_blank" rel="noreferrer" className="w-6 h-6 rounded-md bg-gray-100 text-gray-400 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition-colors"><Facebook  size={11} /></a>}
                                                        {socials.instagram && <a href={socials.instagram} target="_blank" rel="noreferrer" className="w-6 h-6 rounded-md bg-gray-100 text-gray-400 hover:bg-pink-50 hover:text-pink-600 flex items-center justify-center transition-colors"><Instagram size={11} /></a>}
                                                        {socials.youtube   && <a href={socials.youtube}   target="_blank" rel="noreferrer" className="w-6 h-6 rounded-md bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-colors"><Youtube   size={11} /></a>}
                                                        {socials.tiktok    && <a href={socials.tiktok}    target="_blank" rel="noreferrer" className="w-6 h-6 rounded-md bg-gray-100 text-gray-400 hover:bg-gray-200 flex items-center justify-center transition-colors"><Music     size={11} /></a>}
                                                      </div>
                                                    : <span className="text-xs text-gray-300">—</span>
                                                }
                                            </td>

                                            {/* Verified */}
                                            <td className="px-3 py-2.5 text-center">
                                                {artist.verified
                                                    ? <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-600 border border-indigo-100 text-xs font-semibold px-2 py-0.5 rounded-full">
                                                        <CheckCircle2 size={9} /> Xác minh
                                                      </span>
                                                    : <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-xs font-medium px-2 py-0.5 rounded-full">
                                                        <Star size={9} /> Thường
                                                      </span>
                                                }
                                            </td>

                                            {/* Actions */}
                                            <td className="px-3 py-2.5 pr-4 text-right whitespace-nowrap">
                                                <Link
                                                    href={`/admin/artists/${artist._id}/edit`}
                                                    className="text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    <Edit2 size={11} /> Sửa
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
                            }
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && filtered.length > PER_PAGE && (
                    <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs text-gray-400 font-medium">
                            Trang {page} / {totalPages} · {filtered.length} nghệ sĩ
                        </span>
                        <div className="flex gap-1.5">
                            {[
                                { label: "«", disabled: page === 1,         onClick: () => setPage(1)           },
                                { label: "‹", disabled: page === 1,         onClick: () => setPage(p => p - 1)  },
                            ].map(b => (
                                <button key={b.label} disabled={b.disabled} onClick={b.onClick}
                                    className="border border-gray-200 rounded-lg px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                    {b.label}
                                </button>
                            ))}
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const p = Math.min(Math.max(page - 2, 1), Math.max(totalPages - 4, 1)) + i;
                                return p <= totalPages ? (
                                    <button key={p} onClick={() => setPage(p)}
                                        className={`border rounded-lg px-3 py-1 text-sm transition-colors ${page === p ? "border-indigo-500 bg-indigo-50 text-indigo-600 font-bold" : "border-gray-200 hover:bg-gray-50 text-gray-700"}`}>
                                        {p}
                                    </button>
                                ) : null;
                            })}
                            {[
                                { label: "›", disabled: page === totalPages, onClick: () => setPage(p => p + 1)  },
                                { label: "»", disabled: page === totalPages, onClick: () => setPage(totalPages)  },
                            ].map(b => (
                                <button key={b.label} disabled={b.disabled} onClick={b.onClick}
                                    className="border border-gray-200 rounded-lg px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                    {b.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Add Artist Modal ── */}
            {showModal && (
                <div
                    ref={overlayRef}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={e => { if (e.target === overlayRef.current) closeModal(); }}
                    style={{ animation: "apUp .14s ease" }}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                        style={{ animation: "apSc .18s ease" }}
                    >
                        {/* header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <Mic2 size={15} className="text-indigo-600" />
                                </div>
                                <h2 className="text-base font-bold text-gray-900">Thêm nghệ sĩ mới</h2>
                            </div>
                            <button onClick={closeModal}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer">
                                <X size={18} />
                            </button>
                        </div>

                        {/* form */}
                        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

                            {/* avatar preview + name row */}
                            <div className="flex gap-4 items-start">
                                {/* avatar preview */}
                                <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center border-2 border-indigo-100">
                                    {form.avatarUrl.trim()
                                        ? <img src={form.avatarUrl.trim()} alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = "none")} />
                                        : <Mic2 size={24} className="text-indigo-300" />
                                    }
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                                        Tên nghệ sĩ <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text" value={form.name}
                                        onChange={e => setField("name", e.target.value)}
                                        placeholder="Nhập tên nghệ sĩ..."
                                        className={INPUT} required
                                    />
                                </div>
                            </div>

                            {/* genre + followers */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Thể loại</label>
                                    <select value={form.genre} onChange={e => setField("genre", e.target.value)} className={INPUT}>
                                        <option value="">-- Chọn thể loại --</option>
                                        {GENRE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Followers</label>
                                    <input
                                        type="number" min={0} value={form.followers}
                                        onChange={e => setField("followers", e.target.value)}
                                        placeholder="0" className={INPUT}
                                    />
                                </div>
                            </div>

                            {/* bio */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Tiểu sử</label>
                                <textarea
                                    rows={3} value={form.bio}
                                    onChange={e => setField("bio", e.target.value)}
                                    placeholder="Giới thiệu ngắn về nghệ sĩ..."
                                    className={INPUT + " resize-none"}
                                />
                            </div>

                            {/* avatar url */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Avatar URL</label>
                                <input
                                    type="text" value={form.avatarUrl}
                                    onChange={e => setField("avatarUrl", e.target.value)}
                                    placeholder="https://... (URL ảnh đại diện)"
                                    className={INPUT}
                                />
                            </div>

                            {/* verified toggle */}
                            <div className="flex items-center justify-between py-0.5">
                                <div>
                                    <p className="text-xs font-semibold text-gray-700">Đã xác minh</p>
                                    <p className="text-[11px] text-gray-400">Hiển thị badge xác minh</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setField("verified", !form.verified)}
                                    className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${form.verified ? "bg-indigo-600" : "bg-gray-200"}`}
                                >
                                    <span
                                        className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                                        style={{ transform: form.verified ? "translateX(20px)" : "translateX(0)" }}
                                    />
                                </button>
                            </div>

                            {/* social (collapsible) */}
                            <div className="border border-gray-100 rounded-xl overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => setShowSocial(v => !v)}
                                    className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    <span className="flex items-center gap-2">
                                        <Music size={12} /> Liên kết mạng xã hội
                                        <span className="text-[10px] font-normal text-gray-400">(tuỳ chọn)</span>
                                    </span>
                                    <ChevronDown size={14} className={`transition-transform text-gray-400 ${showSocial ? "rotate-180" : ""}`} />
                                </button>
                                {showSocial && (
                                    <div className="px-4 pb-4 pt-1 space-y-3 border-t border-gray-100">
                                        {[
                                            { key: "facebook",  Icon: Facebook,  label: "Facebook",  placeholder: "https://facebook.com/..." },
                                            { key: "instagram", Icon: Instagram, label: "Instagram", placeholder: "https://instagram.com/..." },
                                            { key: "youtube",   Icon: Youtube,   label: "YouTube",   placeholder: "https://youtube.com/..."  },
                                        ].map(({ key, Icon, label, placeholder }) => (
                                            <div key={key}>
                                                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1">
                                                    <Icon size={11} /> {label}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={form[key as keyof FormState] as string}
                                                    onChange={e => setField(key as keyof FormState, e.target.value)}
                                                    placeholder={placeholder}
                                                    className={INPUT}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* error */}
                            {formError && (
                                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">
                                    {formError}
                                </div>
                            )}

                            {/* footer */}
                            <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-100">
                                <button type="button" onClick={closeModal} disabled={submitting}
                                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer">
                                    Huỷ
                                </button>
                                <button type="submit" disabled={submitting}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 flex items-center gap-2 cursor-pointer">
                                    {submitting
                                        ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang lưu...</>
                                        : <><Plus size={14} /> Thêm nghệ sĩ</>
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
