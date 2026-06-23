'use client';
import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Music, Users, TrendingUp, Play, Clock,
    BadgeCheck, ArrowRight, BarChart2, Mic2,
    Star, Activity, ArrowUpRight, Disc3,
    Headphones, Minus, Zap, Globe,
} from "lucide-react";
import { trackService }  from "@/services/trackService";
import { artistService } from "@/services/artistService";

// ─── helpers ────────────────────────────────────────────────────────────────
const fNum = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
};
const fTime  = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const fHours = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const EQ_H = [40, 70, 55, 85, 45, 75, 60, 90, 50, 65];

const GENRE_COLORS = ["#6366f1","#3b82f6","#ec4899","#f97316","#8b5cf6","#10b981"];

// ─── MiniBar ────────────────────────────────────────────────────────────────
function MiniBar({ values, color = "#6366f1" }: { values: number[]; color?: string }) {
    const max = Math.max(...values, 1);
    return (
        <div className="flex items-end gap-[2px] h-8">
            {values.map((v, i) => (
                <div
                    key={i}
                    style={{
                        flex: 1, minHeight: 3,
                        height: `${(v / max) * 100}%`,
                        borderRadius: "3px 3px 1px 1px",
                        background: color,
                        opacity: 0.25 + (v / max) * 0.65,
                        animation: `stBar .5s ${i * .04}s cubic-bezier(.4,0,.2,1) both`,
                        transformOrigin: "bottom",
                    }}
                />
            ))}
        </div>
    );
}

// ─── Donut ──────────────────────────────────────────────────────────────────
function Donut({ segments }: { segments: { value: number; color: string; label: string }[] }) {
    const total = segments.reduce((s, g) => s + g.value, 0) || 1;
    const r = 52, cx = 64, cy = 64, sw = 14;
    const circ = 2 * Math.PI * r;
    let offset = 0;
    return (
        <svg width={128} height={128} viewBox="0 0 128 128">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={sw} />
            {segments.map((seg, i) => {
                const dash = (seg.value / total) * circ;
                const dOff = circ - offset;
                offset += dash;
                return (
                    <circle
                        key={i} cx={cx} cy={cy} r={r}
                        fill="none" stroke={seg.color}
                        strokeWidth={sw}
                        strokeDasharray={`${dash} ${circ - dash}`}
                        strokeDashoffset={dOff}
                        strokeLinecap="round"
                        style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dasharray .8s cubic-bezier(.4,0,.2,1)" }}
                    />
                );
            })}
        </svg>
    );
}

const TABS = [
    { key: 'overview', label: 'Tổng quan',   Icon: BarChart2  },
    { key: 'stats',    label: 'Thống kê',    Icon: TrendingUp },
    { key: 'tracks',   label: 'Top bài hát', Icon: Music      },
    { key: 'artists',  label: 'Nghệ sĩ',     Icon: Users      },
] as const;
type TabKey = typeof TABS[number]['key'];

// ─── Component ──────────────────────────────────────────────────────────────
function AdminHomePageInner() {
    const router       = useRouter();
    const searchParams = useSearchParams();
    const tab          = (searchParams?.get('tab') ?? 'overview') as TabKey;

    const [tracks,   setTracks]   = useState<any[]>([]);
    const [artists,  setArtists]  = useState<any[]>([]);
    const [loading,  setLoading]  = useState(true);
    const [error,    setError]    = useState(false);
    const [counters, setCounters] = useState({ tracks: 0, artists: 0, plays: 0, followers: 0 });
    const animRef = useRef<number>(0);

    useEffect(() => {
        (async () => {
            try {
                const [t, a] = await Promise.all([
                    trackService.getAll({ limit: 200 }),
                    artistService.getAll({ limit: 200 }),
                ]);
                const tracks: any[]  = t.data ?? [];
                const artists: any[] = a.data ?? [];
                setTracks(tracks);
                setArtists(artists);

                const targets = {
                    tracks:    tracks.length,
                    artists:   artists.length,
                    plays:     tracks.reduce((s, x) => s + (x.plays ?? 0), 0),
                    followers: artists.reduce((s, x) => s + (x.followers ?? 0), 0),
                };
                const start = performance.now(), dur = 1200;
                const tick = (now: number) => {
                    const p    = Math.min((now - start) / dur, 1);
                    const ease = 1 - Math.pow(1 - p, 3);
                    setCounters({
                        tracks:    Math.round(ease * targets.tracks),
                        artists:   Math.round(ease * targets.artists),
                        plays:     Math.round(ease * targets.plays),
                        followers: Math.round(ease * targets.followers),
                    });
                    if (p < 1) animRef.current = requestAnimationFrame(tick);
                };
                animRef.current = requestAnimationFrame(tick);
            } catch { setError(true); }
            finally  { setLoading(false); }
        })();
        return () => cancelAnimationFrame(animRef.current);
    }, []);

    // ── derived ──
    const totalPlays     = tracks.reduce((s, t) => s + (t.plays    ?? 0), 0);
    const totalDuration  = tracks.reduce((s, t) => s + (t.duration ?? 0), 0);
    const totalFollowers = artists.reduce((s, a) => s + (a.followers ?? 0), 0);
    const verifiedCount  = artists.filter(a => a.verified).length;
    const publishedCount = tracks.filter(t => t.isPublished).length;
    const avgDuration    = tracks.length ? Math.round(totalDuration / tracks.length) : 0;
    const avgPlays       = tracks.length ? Math.round(totalPlays / tracks.length) : 0;

    const topTracks  = [...tracks].sort((a, b)  => (b.plays    ?? 0) - (a.plays    ?? 0)).slice(0, 8);
    const topArtists = [...artists].sort((a, b) => (b.followers ?? 0) - (a.followers ?? 0)).slice(0, 6);

    const genreMap: Record<string, number> = {};
    tracks.forEach(t => { if (t.genre) genreMap[t.genre] = (genreMap[t.genre] ?? 0) + 1; });
    const genreEntries = Object.entries(genreMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const genreTotal   = genreEntries.reduce((s, [, v]) => s + v, 0) || 1;

    const artistGenreMap: Record<string, number> = {};
    artists.forEach(a => {
        const gs: string[] = a.genres?.length ? a.genres : (a.genre ? [a.genre] : []);
        gs.forEach((g: string) => { artistGenreMap[g] = (artistGenreMap[g] ?? 0) + 1; });
    });
    const donutSegs = Object.entries(artistGenreMap)
        .sort((a, b) => b[1] - a[1]).slice(0, 5)
        .map(([label, value], i) => ({ label, value, color: GENRE_COLORS[i] }));

    const STATS = [
        { label: "Tổng bài hát",   value: tracks.length,   sub: `${fTime(totalDuration)} tổng`, Icon: Music,      iconCls: "text-indigo-600", bgCls: "bg-indigo-50",  href: "/admin/tracks"  },
        { label: "Nghệ sĩ",        value: artists.length,  sub: `${verifiedCount} xác minh`,    Icon: Users,      iconCls: "text-blue-600",   bgCls: "bg-blue-50",    href: "/admin/artists" },
        { label: "Tổng lượt nghe", value: fNum(totalPlays), sub: "Toàn thời gian",              Icon: Play,       iconCls: "text-pink-600",   bgCls: "bg-pink-50",    href: "/admin/tracks"  },
        { label: "Đã xác minh",    value: verifiedCount,   sub: `/ ${artists.length} nghệ sĩ`,  Icon: BadgeCheck, iconCls: "text-orange-600", bgCls: "bg-orange-50",  href: "/admin/artists" },
    ];

    const NAV_CARDS = [
        { label: "Quản lý bài hát", desc: "Thêm, sửa, xoá bài hát",      Icon: Music,     href: "/admin/tracks",   bg: "bg-indigo-600 hover:bg-indigo-700"   },
        { label: "Quản lý nghệ sĩ", desc: "Thêm, sửa thông tin nghệ sĩ", Icon: Mic2,      href: "/admin/artists",  bg: "bg-blue-600 hover:bg-blue-700"      },
        { label: "Thống kê",         desc: "Xem báo cáo và biểu đồ",      Icon: BarChart2, href: "?tab=stats",      bg: "bg-violet-600 hover:bg-violet-700"  },
        { label: "Top bài hát",      desc: "Bài hát được nghe nhiều nhất", Icon: TrendingUp,href: "?tab=tracks",    bg: "bg-pink-600 hover:bg-pink-700"       },
    ];

    const KPIS = [
        { label: "Tổng bài hát",    value: loading ? null : fNum(counters.tracks),    sub: `${publishedCount} đã xuất bản`,                                        Icon: Music,      iconCls: "text-indigo-600", bgCls: "bg-indigo-50",  color: "#6366f1", spark: [3,5,4,7,6,8,5,9,7,8,10,9],  delay: "0s"   },
        { label: "Nghệ sĩ",         value: loading ? null : fNum(counters.artists),   sub: `${verifiedCount} đã xác minh`,                                         Icon: Mic2,       iconCls: "text-blue-600",   bgCls: "bg-blue-50",   color: "#3b82f6", spark: [2,4,3,5,4,6,5,7,6,7,8,7],  delay: ".07s" },
        { label: "Tổng lượt nghe",  value: loading ? null : fNum(counters.plays),     sub: `TB ${fNum(avgPlays)} / bài`,                                           Icon: TrendingUp, iconCls: "text-pink-600",   bgCls: "bg-pink-50",   color: "#ec4899", spark: [5,8,6,9,7,11,8,12,9,11,13,12], delay: ".14s" },
        { label: "Tổng followers",  value: loading ? null : fNum(counters.followers), sub: `TB ${fNum(artists.length ? Math.round(totalFollowers / artists.length) : 0)} / NS`, Icon: Users, iconCls: "text-orange-500", bgCls: "bg-orange-50", color: "#f97316", spark: [4,6,5,8,7,9,6,10,8,9,11,10], delay: ".21s" },
        { label: "Tổng thời lượng", value: loading ? null : fHours(totalDuration),   sub: `TB ${fTime(avgDuration)} / bài`,                                       Icon: Clock,      iconCls: "text-violet-600", bgCls: "bg-violet-50", color: "#8b5cf6", spark: [3,5,4,6,5,7,4,8,6,7,9,8],  delay: ".28s" },
        { label: "Tỉ lệ xuất bản",  value: loading ? null : `${tracks.length ? Math.round(publishedCount / tracks.length * 100) : 0}%`, sub: `${tracks.length - publishedCount} bản nháp`, Icon: Globe, iconCls: "text-teal-600", bgCls: "bg-teal-50", color: "#10b981", spark: [6,8,7,9,8,10,9,10,8,11,10,12], delay: ".35s" },
    ];

    if (error) return (
        <div className="py-16 text-center">
            <p className="text-red-400 text-sm mb-3">Không thể tải dữ liệu dashboard.</p>
            <button
                onClick={() => window.location.reload()}
                className="px-5 py-2 rounded-lg bg-red-50 border border-red-200 text-red-500 text-sm cursor-pointer hover:bg-red-100 transition-colors"
            >
                Thử lại
            </button>
        </div>
    );

    return (
        <div>
            <style>{`
                @keyframes dhUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
                @keyframes dhEq  { 0%,100%{transform:scaleY(.2)} 50%{transform:scaleY(1)} }
                @keyframes dhBar { from{width:0} to{width:var(--w)} }
                @keyframes stBar { from{transform:scaleY(0)} to{transform:scaleY(1)} }
            `}</style>

            {/* ── Header ── */}
            <div className="mb-7" style={{ animation: "dhUp .3s both" }}>
                <div className="flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" />
                    <span className="text-[11px] text-indigo-500 tracking-widest uppercase font-semibold">Won Music Admin</span>
                </div>
                <div className="flex items-end justify-between flex-wrap gap-2">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Tổng quan hệ thống Won Music</p>
                    </div>
                    <span className="text-xs text-gray-400 font-medium">
                        {new Date().toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                    </span>
                </div>
                <div className="flex items-end gap-[2.5px] h-5 mt-3">
                    {EQ_H.map((h, i) => (
                        <div
                            key={i}
                            className="w-1 rounded-sm bg-indigo-400/40"
                            style={{
                                height: `${h}%`,
                                transformOrigin: "bottom",
                                animation: `dhEq ${.38 + (i % 5) * .13}s ease-in-out infinite`,
                                animationDelay: `${i * .07}s`,
                                opacity: 0.2 + i * 0.055,
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* ── Tab bar ── */}
            <div className="flex gap-1.5 mb-5 flex-wrap" style={{ animation: "dhUp .35s both" }}>
                {TABS.map(({ key, label, Icon }) => (
                    <button
                        key={key}
                        onClick={() => router.replace(`?tab=${key}`, { scroll: false })}
                        className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold border transition-all cursor-pointer ${
                            tab === key
                                ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                                : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        }`}
                    >
                        <Icon size={14} />{label}
                    </button>
                ))}
            </div>

            {/* ════ Tab: Tổng quan ════ */}
            {tab === 'overview' && (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                        {STATS.map(({ label, value, sub, Icon, iconCls, bgCls, href }, i) => (
                            <Link
                                key={label}
                                href={href}
                                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:-translate-y-0.5 hover:shadow-md transition-all no-underline group"
                                style={{ animation: `dhUp .4s ${i * .07}s both` }}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`w-10 h-10 rounded-xl ${bgCls} flex items-center justify-center`}>
                                        <Icon size={18} className={iconCls} />
                                    </div>
                                    <ArrowRight size={14} className="text-gray-300 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all mt-1" />
                                </div>
                                <div className="text-2xl font-bold text-gray-900 leading-none mb-1">
                                    {loading ? <div className="h-7 w-16 bg-gray-100 rounded animate-pulse" /> : value}
                                </div>
                                <p className="text-xs text-gray-500 font-medium mb-0.5">{label}</p>
                                <p className="text-[11px] text-gray-400">{loading ? "" : sub}</p>
                            </Link>
                        ))}
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5" style={{ animation: "dhUp .55s both" }}>
                        <div className="flex items-center gap-2 mb-4">
                            <p className="text-[10px] font-bold tracking-[2px] uppercase text-gray-400">Truy cập nhanh</p>
                            <div className="flex-1 h-px bg-gray-100" />
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {NAV_CARDS.map(({ label, desc, Icon, href, bg }, i) => (
                                <Link
                                    key={label}
                                    href={href}
                                    className={`${bg} rounded-xl p-4 text-white no-underline flex items-start gap-3 transition-all hover:-translate-y-0.5 hover:shadow-lg group`}
                                    style={{ animation: `dhUp .5s ${i * .07}s both` }}
                                >
                                    <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:bg-white/30 transition-colors">
                                        <Icon size={16} className="text-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold leading-tight">{label}</p>
                                        <p className="text-[11px] text-white/70 mt-0.5 leading-snug">{desc}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* ════ Tab: Thống kê ════ */}
            {tab === 'stats' && (
                <div style={{ animation: "dhUp .3s both" }}>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                        {KPIS.map(({ label, value, sub, Icon, iconCls, bgCls, color, spark, delay }) => (
                            <div
                                key={label}
                                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:-translate-y-0.5 hover:shadow-md transition-all"
                                style={{ animation: `dhUp .4s ${delay} both` }}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`w-10 h-10 rounded-xl ${bgCls} flex items-center justify-center`}>
                                        <Icon size={18} className={iconCls} />
                                    </div>
                                    {!loading && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                                            <ArrowUpRight size={9} /> live
                                        </span>
                                    )}
                                </div>
                                {loading ? (
                                    <div className="h-8 w-20 bg-gray-100 rounded animate-pulse mb-1" />
                                ) : (
                                    <div className="text-3xl font-bold text-gray-900 leading-none mb-1 tabular-nums">{value}</div>
                                )}
                                <p className="text-xs font-semibold text-gray-500 mb-0.5">{label}</p>
                                <p className="text-[11px] text-gray-400 mb-3">{loading ? "" : sub}</p>
                                {!loading && <MiniBar values={spark} color={color} />}
                            </div>
                        ))}
                    </div>

                    {/* Row 2: Top Tracks + Genre */}
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 mb-5">

                        {/* Top tracks */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                                        <TrendingUp size={13} className="text-indigo-500" />
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">Top bài hát theo lượt nghe</span>
                                </div>
                                <Link href="/admin/tracks" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 no-underline">
                                    Tất cả <ArrowRight size={11} />
                                </Link>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {loading
                                    ? Array.from({ length: 6 }).map((_, i) => (
                                        <div key={i} className="flex items-center gap-3 px-5 py-3 animate-pulse">
                                            <div className="w-5 h-2.5 bg-gray-100 rounded flex-shrink-0" />
                                            <div className="w-9 h-9 rounded-lg bg-gray-100 flex-shrink-0" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-3 bg-gray-100 rounded w-3/5" />
                                                <div className="h-1.5 bg-gray-50 rounded w-4/5" />
                                            </div>
                                            <div className="w-10 h-3 bg-gray-100 rounded" />
                                        </div>
                                    ))
                                    : topTracks.map((track, idx) => {
                                        const pct   = Math.round((track.plays / (topTracks[0]?.plays || 1)) * 100);
                                        const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : null;
                                        return (
                                            <Link
                                                key={track._id}
                                                href={`/admin/tracks/${track._id}`}
                                                className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 transition-colors no-underline group"
                                                style={{ animation: `dhUp .28s ${idx * .03}s both` }}
                                            >
                                                <span className="text-[11px] w-5 text-center flex-shrink-0 text-gray-300">
                                                    {medal ?? <span className="font-mono">{String(idx + 1).padStart(2, "0")}</span>}
                                                </span>
                                                <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
                                                    {track.coverUrl
                                                        ? <img src={track.coverUrl} alt="" className="w-full h-full object-cover" />
                                                        : <span className="text-indigo-400 text-sm">♪</span>
                                                    }
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[13px] font-semibold text-gray-800 truncate mb-1 group-hover:text-indigo-600 transition-colors">
                                                        {track.title}
                                                    </p>
                                                    <div className="h-0.5 bg-gray-100 rounded overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded"
                                                            style={{ width: `${pct}%`, animation: "dhBar .7s cubic-bezier(.4,0,.2,1) both", ["--w" as any]: `${pct}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <p className="text-[12px] font-bold text-gray-700 tabular-nums flex items-center gap-1 justify-end">
                                                        <Play size={9} className="text-indigo-400" />
                                                        {fNum(track.plays ?? 0)}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400">{fTime(track.duration ?? 0)}</p>
                                                </div>
                                            </Link>
                                        );
                                    })
                                }
                            </div>
                        </div>

                        {/* Genre breakdown */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
                                    <BarChart2 size={13} className="text-violet-500" />
                                </div>
                                <span className="text-sm font-bold text-gray-900">Phân bố thể loại</span>
                            </div>

                            {loading ? (
                                <div className="animate-pulse">
                                    <div className="w-32 h-32 rounded-full bg-gray-100 mx-auto mb-4" />
                                    {[1,2,3,4].map(i => <div key={i} className="h-7 rounded-lg bg-gray-50 mb-2" />)}
                                </div>
                            ) : genreEntries.length === 0 ? (
                                <div className="py-8 text-center">
                                    <Disc3 size={32} className="text-gray-200 mx-auto mb-2" />
                                    <p className="text-xs text-gray-400">Chưa có dữ liệu</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-center mb-4 relative">
                                        <Donut segments={donutSegs.length ? donutSegs : [{ value: 1, color: "#e5e7eb", label: "" }]} />
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                                            <div className="text-2xl font-bold text-gray-900">{genreEntries.length}</div>
                                            <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400">thể loại</div>
                                        </div>
                                    </div>
                                    <div className="space-y-2.5">
                                        {genreEntries.map(([genre, count], i) => (
                                            <div key={genre}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: GENRE_COLORS[i] }} />
                                                        <span className="text-xs text-gray-700 font-medium">{genre}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[11px] text-gray-500 font-semibold tabular-nums">{count}</span>
                                                        <span className="text-[10px] text-gray-400">{Math.round(count / genreTotal * 100)}%</span>
                                                    </div>
                                                </div>
                                                <div className="h-1 bg-gray-100 rounded overflow-hidden">
                                                    <div
                                                        className="h-full rounded"
                                                        style={{ width: `${count / genreTotal * 100}%`, background: GENRE_COLORS[i], transition: "width .8s cubic-bezier(.4,0,.2,1)" }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Row 3: Top Artists + Insights */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                        {/* Top artists */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                                        <Mic2 size={13} className="text-blue-500" />
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">Top nghệ sĩ theo followers</span>
                                </div>
                                <Link href="/admin/artists" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 no-underline">
                                    Tất cả <ArrowRight size={11} />
                                </Link>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {loading
                                    ? Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="flex items-center gap-3 px-5 py-3 animate-pulse">
                                            <div className="w-9 h-9 rounded-full bg-gray-100 flex-shrink-0" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-3 bg-gray-100 rounded w-2/5" />
                                                <div className="h-1.5 bg-gray-50 rounded w-3/5" />
                                            </div>
                                            <div className="w-12 h-3 bg-gray-100 rounded" />
                                        </div>
                                    ))
                                    : topArtists.map((artist, idx) => {
                                        const maxF = topArtists[0]?.followers || 1;
                                        const pct  = Math.round((artist.followers / maxF) * 100);
                                        return (
                                            <Link
                                                key={artist._id}
                                                href={`/admin/artists/${artist._id}`}
                                                className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 transition-colors no-underline group"
                                                style={{ animation: `dhUp .35s ${idx * .04}s both` }}
                                            >
                                                <span className="text-[11px] font-mono text-gray-300 w-5 text-center flex-shrink-0">
                                                    {String(idx + 1).padStart(2, "0")}
                                                </span>
                                                <div className="relative w-9 h-9 flex-shrink-0">
                                                    <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-600 border-2 border-white shadow-sm">
                                                        {artist.avatar
                                                            ? <img src={artist.avatar} alt="" className="w-full h-full object-cover" />
                                                            : artist.name.split(" ").slice(-2).map((w: string) => w[0]).join("").toUpperCase()
                                                        }
                                                    </div>
                                                    {artist.verified && (
                                                        <div className="absolute -bottom-0.5 -right-0.5 w-[14px] h-[14px] rounded-full bg-indigo-600 border border-white flex items-center justify-center">
                                                            <BadgeCheck size={8} className="text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[13px] font-semibold text-gray-800 truncate mb-1 group-hover:text-indigo-600 transition-colors">
                                                        {artist.name}
                                                    </p>
                                                    <div className="h-0.5 bg-gray-100 rounded overflow-hidden">
                                                        <div
                                                            className="h-full rounded"
                                                            style={{
                                                                width: `${pct}%`,
                                                                background: idx === 0 ? "linear-gradient(90deg,#6366f1,#818cf8)" : `rgba(99,102,241,${.2 + pct / 100 * .55})`,
                                                                transition: "width .8s cubic-bezier(.4,0,.2,1)",
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    <Users size={9} className="text-indigo-400" />
                                                    <span className="text-[12px] font-bold text-gray-600 tabular-nums">{fNum(artist.followers ?? 0)}</span>
                                                </div>
                                            </Link>
                                        );
                                    })
                                }
                            </div>
                        </div>

                        {/* Insights */}
                        <div className="flex flex-col gap-4">

                            {/* Plays insight */}
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center">
                                        <Activity size={13} className="text-pink-500" />
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">Phân tích lượt nghe</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: "Bài nghe nhiều nhất", value: topTracks[0] ? fNum(topTracks[0].plays) : "—",  Icon: Zap,       iconCls: "text-indigo-500",  bgCls: "bg-indigo-50"  },
                                        { label: "Bài nghe ít nhất",    value: tracks.length ? fNum([...tracks].sort((a,b)=>(a.plays??0)-(b.plays??0))[0]?.plays ?? 0) : "—", Icon: Minus, iconCls: "text-red-400", bgCls: "bg-red-50" },
                                        { label: "Trung bình / bài",    value: fNum(avgPlays),           Icon: BarChart2,  iconCls: "text-blue-500",   bgCls: "bg-blue-50"   },
                                        { label: "Tổng giờ nghe",       value: fHours(totalDuration),    Icon: Headphones, iconCls: "text-orange-500", bgCls: "bg-orange-50" },
                                    ].map(({ label, value, Icon, iconCls, bgCls }) => (
                                        <div key={label} className="p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                                            <div className={`w-7 h-7 rounded-lg ${bgCls} flex items-center justify-center mb-2`}>
                                                <Icon size={12} className={iconCls} />
                                            </div>
                                            <div className="text-xl font-bold text-gray-900 tabular-nums leading-none mb-1">
                                                {loading ? <div className="h-5 w-12 bg-gray-100 rounded animate-pulse" /> : value}
                                            </div>
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Artist insight */}
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex-1">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
                                        <Star size={13} className="text-orange-500" />
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">Phân tích nghệ sĩ</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    {[
                                        { label: "Đã xác minh",   value: verifiedCount,               color: "#6366f1", textCls: "text-indigo-600", bgCls: "bg-indigo-50",  Icon: BadgeCheck },
                                        { label: "Chưa xác minh", value: artists.length-verifiedCount, color: "#f97316", textCls: "text-orange-500", bgCls: "bg-orange-50", Icon: Mic2       },
                                    ].map(({ label, value, color, textCls, bgCls, Icon }) => (
                                        <div key={label} className="p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                                            <div className={`w-7 h-7 rounded-lg ${bgCls} flex items-center justify-center mb-2`}>
                                                <Icon size={12} className={textCls} />
                                            </div>
                                            <div className={`text-2xl font-bold tabular-nums leading-none mb-2 ${textCls}`}>
                                                {loading ? <div className="h-6 w-8 bg-gray-100 rounded animate-pulse" /> : value}
                                            </div>
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">{label}</p>
                                            <div className="h-1 bg-gray-100 rounded overflow-hidden">
                                                <div className="h-full rounded transition-all duration-700" style={{ width: `${artists.length ? value / artists.length * 100 : 0}%`, background: color, opacity: .7 }} />
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-1">{artists.length ? Math.round(value / artists.length * 100) : 0}%</p>
                                        </div>
                                    ))}
                                </div>
                                {!loading && donutSegs.length > 0 && (
                                    <div className="pt-3 border-t border-gray-100">
                                        <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-2">Thể loại phổ biến</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {donutSegs.slice(0, 4).map(seg => (
                                                <span
                                                    key={seg.label}
                                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                                                    style={{ background: `${seg.color}18`, borderColor: `${seg.color}33`, color: seg.color }}
                                                >
                                                    {seg.label}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ════ Tab: Top bài hát ════ */}
            {tab === 'tracks' && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden" style={{ animation: "dhUp .3s both" }}>
                    <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                                <Music size={13} className="text-indigo-500" />
                            </div>
                            <span className="text-sm font-bold text-gray-900">Top bài hát</span>
                            <div className="flex items-end gap-[1.5px] h-3">
                                {[40, 70, 50, 85, 55].map((h, i) => (
                                    <div
                                        key={i}
                                        className="w-[2.5px] rounded-sm bg-indigo-400/60"
                                        style={{ height: `${h}%`, transformOrigin: "bottom", animation: `dhEq ${.4 + i * .1}s ease-in-out infinite`, animationDelay: `${i * .07}s` }}
                                    />
                                ))}
                            </div>
                        </div>
                        <Link href="/admin/tracks" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors no-underline flex items-center gap-1">
                            Tất cả <ArrowRight size={11} />
                        </Link>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {loading
                            ? Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3 px-5 py-3 animate-pulse">
                                    <div className="w-5 h-2.5 bg-gray-100 rounded flex-shrink-0" />
                                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex-shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 bg-gray-100 rounded w-3/5" />
                                        <div className="h-1.5 bg-gray-50 rounded w-4/5" />
                                    </div>
                                    <div className="w-8 h-3 bg-gray-100 rounded" />
                                </div>
                            ))
                            : topTracks.map((track, idx) => {
                                const pct = Math.round((track.plays / (topTracks[0]?.plays || 1)) * 100);
                                return (
                                    <Link
                                        key={track._id}
                                        href={`/admin/tracks/${track._id}`}
                                        className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors no-underline group"
                                        style={{ animation: `dhUp .28s ${idx * .03}s both` }}
                                    >
                                        <span className="text-xs font-mono text-gray-300 w-5 text-right flex-shrink-0">
                                            {idx === 0 ? <span className="text-amber-400">🥇</span>
                                                : idx === 1 ? <span className="text-gray-400">🥈</span>
                                                : idx === 2 ? <span className="text-orange-400">🥉</span>
                                                : String(idx + 1).padStart(2, "0")
                                            }
                                        </span>
                                        <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
                                            {track.coverUrl
                                                ? <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                                                : <span className="text-indigo-400 text-base">♪</span>
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-semibold text-gray-800 truncate mb-1 group-hover:text-indigo-600 transition-colors">
                                                {track.title}
                                            </p>
                                            <div className="h-0.5 bg-gray-100 rounded overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded"
                                                    style={{ width: `${pct}%`, animation: "dhBar .7s cubic-bezier(.4,0,.2,1) both", ["--w" as any]: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-[12px] font-semibold text-gray-600 tabular-nums">{fNum(track.plays ?? 0)}</p>
                                            <p className="text-[10px] text-gray-400 tabular-nums">{fTime(track.duration ?? 0)}</p>
                                        </div>
                                    </Link>
                                );
                            })
                        }
                    </div>
                </div>
            )}

            {/* ════ Tab: Nghệ sĩ ════ */}
            {tab === 'artists' && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden" style={{ animation: "dhUp .3s both" }}>
                    <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                                <Users size={13} className="text-blue-500" />
                            </div>
                            <span className="text-sm font-bold text-gray-900">Nghệ sĩ nổi bật</span>
                        </div>
                        <Link href="/admin/artists" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors no-underline flex items-center gap-1">
                            Tất cả <ArrowRight size={11} />
                        </Link>
                    </div>

                    <div className="p-4 grid grid-cols-3 gap-2.5">
                        {loading
                            ? Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="p-3.5 rounded-xl bg-gray-50 text-center animate-pulse">
                                    <div className="w-12 h-12 rounded-full bg-gray-200 mx-auto mb-2" />
                                    <div className="h-2.5 bg-gray-200 rounded w-3/4 mx-auto mb-1.5" />
                                    <div className="h-2 bg-gray-100 rounded w-1/2 mx-auto" />
                                </div>
                            ))
                            : topArtists.map((artist, idx) => (
                                <Link
                                    key={artist._id}
                                    href={`/admin/artists/${artist._id}`}
                                    className="block p-3 rounded-xl border border-gray-100 bg-gray-50/60 text-center hover:bg-indigo-50 hover:border-indigo-200 hover:-translate-y-0.5 transition-all no-underline group"
                                    style={{ animation: `dhUp .4s ${idx * .06}s both` }}
                                >
                                    <div className="relative w-12 h-12 mx-auto mb-2.5">
                                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-sm font-bold text-indigo-600 border-2 border-white shadow-sm">
                                            {artist.avatar
                                                ? <img src={artist.avatar} alt={artist.name} className="w-full h-full object-cover" />
                                                : artist.name.split(" ").slice(-2).map((w: string) => w[0]).join("").toUpperCase()
                                            }
                                        </div>
                                        {artist.verified && (
                                            <div className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center">
                                                <BadgeCheck size={9} className="text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[12px] font-semibold text-gray-800 truncate group-hover:text-indigo-600 transition-colors">
                                        {artist.name}
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                        {(() => {
                                            const gs: string[] = artist.genres?.length ? artist.genres : (artist.genre ? [artist.genre] : []);
                                            return gs.length > 0 ? gs.slice(0, 2).join(" · ") : "—";
                                        })()}
                                    </p>
                                    <p className="text-[11px] font-semibold text-gray-500 mt-1 tabular-nums">
                                        {fNum(artist.followers ?? 0)}
                                        <span className="font-normal text-gray-400"> followers</span>
                                    </p>
                                </Link>
                            ))
                        }
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AdminHomePage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center py-24">
                <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <AdminHomePageInner />
        </Suspense>
    );
}
