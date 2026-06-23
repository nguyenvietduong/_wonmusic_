'use client';
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
    Mic2, Search, Plus, Users, TrendingUp, Edit2,
    ArrowUpDown, CheckCircle2, Music, Instagram,
    Youtube, Facebook, BadgeCheck, Star,
} from "lucide-react";
import { artistService } from "@/services/artistService";

// ─── helpers ────────────────────────────────────────────────────────────────
const fNum = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
};

const EQ_H = [35, 65, 50, 80, 40, 72, 55, 88, 45, 60];

type SortKey = "name" | "followers" | "createdAt";
type SortDir = "asc" | "desc";

const TABS = [
    { key: "list",  label: "Danh sách", Icon: Mic2       },
    { key: "stats", label: "Thống kê",  Icon: TrendingUp },
];

// ─── Component ──────────────────────────────────────────────────────────────
function AdminArtistsPageInner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const tab = searchParams?.get("tab") ?? "list";

    const [artists,    setArtists]    = useState<any[]>([]);
    const [filtered,   setFiltered]   = useState<any[]>([]);
    const [loading,    setLoading]    = useState(true);
    const [search,     setSearch]     = useState("");
    const [sortKey,    setSortKey]    = useState<SortKey>("followers");
    const [sortDir,    setSortDir]    = useState<SortDir>("desc");
    const [page,       setPage]       = useState(1);
    const PER_PAGE = 10;

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
            const genres = (a: any): string[] =>
                a.genres?.length ? a.genres : (a.genre ? [a.genre] : []);
            list = list.filter(a =>
                a.name?.toLowerCase().includes(q) ||
                genres(a).some((g: string) => g.toLowerCase().includes(q)) ||
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

    return (
        <div>
            <style>{`
                @keyframes apUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
                @keyframes apEq  { 0%,100%{transform:scaleY(.2)} 50%{transform:scaleY(1)} }
                @keyframes apBar { from{width:0} to{width:var(--w)} }
                @keyframes apSc  { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
            `}</style>

            {/* ── Header ── */}
            <div className="mb-5" style={{ animation: "apUp .3s both" }}>
                <div className="flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
                    <span className="text-xs text-gray-700 tracking-widest uppercase font-semibold">Won Music Admin</span>
                </div>
                <div className="flex items-end justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Danh Sách Nghệ Sĩ</h1>
                        <p className="text-sm text-gray-700 mt-1">Quản lý toàn bộ nghệ sĩ trong hệ thống</p>
                    </div>
                    {tab === "list" && (
                        <Link
                            href="/admin/artists/new"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-colors"
                        >
                            <Plus size={15} /> Thêm nghệ sĩ
                        </Link>
                    )}
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

            {/* ── Tabs ── */}
            <div className="flex gap-1.5 mb-6">
                {TABS.map(({ key, label, Icon }) => (
                    <button
                        key={key}
                        onClick={() => router.replace(`?tab=${key}`, { scroll: false })}
                        className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold border transition-all cursor-pointer ${
                            tab === key
                                ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                                : "border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                        }`}
                    >
                        <Icon size={14} />{label}
                    </button>
                ))}
            </div>

            {/* ── Tab: Thống kê ── */}
            {tab === "stats" && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" style={{ animation: "apUp .35s both" }}>
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
                            <p className="text-xs text-gray-700 font-medium">{label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Tab: Danh sách ── */}
            {tab === "list" && (
                <>
                    {/* ── Table card ── */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden" style={{ animation: "apUp .35s both" }}>

                        {/* Toolbar */}
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 flex-wrap">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
                                <input
                                    className="bg-white border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-60"
                                    placeholder="Tìm nghệ sĩ, thể loại..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="flex-1" />
                            <span className="text-xs text-gray-600 font-medium">{filtered.length} kết quả</span>
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
                                        <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase tracking-wide">#</th>
                                        <th />
                                        <th className="px-3 py-2.5 text-left">
                                            <button
                                                onClick={() => toggleSort("name")}
                                                className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition-colors ${sortKey === "name" ? "text-indigo-600" : "text-gray-700 hover:text-gray-900"}`}
                                            >
                                                Nghệ sĩ <ArrowUpDown size={10} />
                                            </button>
                                        </th>
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Thể loại</th>
                                        <th className="px-3 py-2.5 text-left">
                                            <button
                                                onClick={() => toggleSort("followers")}
                                                className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition-colors ${sortKey === "followers" ? "text-indigo-600" : "text-gray-700 hover:text-gray-900"}`}
                                            >
                                                Followers <ArrowUpDown size={10} />
                                            </button>
                                        </th>
                                        <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase tracking-wide">Social</th>
                                        <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase tracking-wide">Trạng thái</th>
                                        <th className="px-3 py-2.5 pr-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wide">Thao tác</th>
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
                                                    <p className="text-sm text-gray-600">Không tìm thấy nghệ sĩ nào</p>
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
                                                        {(() => {
                                                            const gs: string[] = artist.genres?.length ? artist.genres : (artist.genre ? [artist.genre] : []);
                                                            return gs.length > 0
                                                                ? <div className="flex flex-wrap gap-1">
                                                                    {gs.slice(0, 2).map((g: string) => (
                                                                        <span key={g} className="inline-block bg-indigo-50 text-indigo-600 text-xs font-medium px-2 py-0.5 rounded-full border border-indigo-100">{g}</span>
                                                                    ))}
                                                                    {gs.length > 2 && <span className="inline-block bg-gray-100 text-gray-700 text-xs font-medium px-2 py-0.5 rounded-full">+{gs.length - 2}</span>}
                                                                  </div>
                                                                : <span className="text-xs text-gray-300">—</span>;
                                                        })()}
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
                                                                {socials.facebook  && <a href={socials.facebook}  target="_blank" rel="noreferrer" className="w-6 h-6 rounded-md bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition-colors"><Facebook  size={11} /></a>}
                                                                {socials.instagram && <a href={socials.instagram} target="_blank" rel="noreferrer" className="w-6 h-6 rounded-md bg-gray-100 text-gray-600 hover:bg-pink-50 hover:text-pink-600 flex items-center justify-center transition-colors"><Instagram size={11} /></a>}
                                                                {socials.youtube   && <a href={socials.youtube}   target="_blank" rel="noreferrer" className="w-6 h-6 rounded-md bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-colors"><Youtube   size={11} /></a>}
                                                                {socials.tiktok    && <a href={socials.tiktok}    target="_blank" rel="noreferrer" className="w-6 h-6 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center transition-colors"><Music     size={11} /></a>}
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
                                                            : <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs font-medium px-2 py-0.5 rounded-full">
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
                                <span className="text-xs text-gray-600 font-medium">
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
                </>
            )}
        </div>
    );
}

export default function AdminArtistsPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center py-24">
                <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <AdminArtistsPageInner />
        </Suspense>
    );
}
