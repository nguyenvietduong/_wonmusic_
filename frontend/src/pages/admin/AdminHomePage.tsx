'use client';
import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Music, Users, TrendingUp, Play, Clock,
    BadgeCheck, ArrowRight, BarChart2, Mic2,
    Star, ChevronUp,
} from "lucide-react";
import { trackService } from "@/services/trackService";
import { artistService } from "@/services/artistService";

// ─── helpers ────────────────────────────────────────────────────────────────
const fNum = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
};
const fTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

const EQ_H = [40, 70, 55, 85, 45, 75, 60, 90, 50, 65];

// ─── Component ──────────────────────────────────────────────────────────────
export default function AdminHomePage() {
    const [tracks,  setTracks]  = useState<any[]>([]);
    const [artists, setArtists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const [t, a] = await Promise.all([
                    trackService.getAll({ limit: 200 }),
                    artistService.getAll({ limit: 200 }),
                ]);
                setTracks(t.data ?? []);
                setArtists(a.data ?? []);
            } catch { setError(true); }
            finally  { setLoading(false); }
        })();
    }, []);

    const totalPlays    = tracks.reduce((s, t) => s + (t.plays    ?? 0), 0);
    const totalDuration = tracks.reduce((s, t) => s + (t.duration ?? 0), 0);
    const verifiedCount = artists.filter(a => a.verified).length;

    // top 8 by plays for list, top 6 by followers for grid
    const topTracks  = [...tracks].sort((a, b) => (b.plays ?? 0) - (a.plays ?? 0)).slice(0, 8);
    const topArtists = [...artists].sort((a, b) => (b.followers ?? 0) - (a.followers ?? 0)).slice(0, 6);

    const STATS = [
        {
            label: "Tổng bài hát",
            value: tracks.length,
            sub: `${fTime(totalDuration)} tổng`,
            Icon: Music,
            iconCls: "text-indigo-600", bgCls: "bg-indigo-50",
            href: "/admin/tracks",
        },
        {
            label: "Nghệ sĩ",
            value: artists.length,
            sub: `${verifiedCount} xác minh`,
            Icon: Users,
            iconCls: "text-blue-600", bgCls: "bg-blue-50",
            href: "/admin/artists",
        },
        {
            label: "Tổng lượt nghe",
            value: fNum(totalPlays),
            sub: "Toàn thời gian",
            Icon: Play,
            iconCls: "text-pink-600", bgCls: "bg-pink-50",
            href: "/admin/tracks",
        },
        {
            label: "Đã xác minh",
            value: verifiedCount,
            sub: `/ ${artists.length} nghệ sĩ`,
            Icon: BadgeCheck,
            iconCls: "text-orange-600", bgCls: "bg-orange-50",
            href: "/admin/artists",
        },
    ];

    const NAV_CARDS = [
        { label: "Quản lý bài hát",  desc: "Thêm, sửa, xoá bài hát",    Icon: Music,    href: "/admin/tracks",  bg: "bg-indigo-600 hover:bg-indigo-700" },
        { label: "Quản lý nghệ sĩ",  desc: "Thêm, sửa thông tin nghệ sĩ",Icon: Mic2,     href: "/admin/artists", bg: "bg-blue-600 hover:bg-blue-700"   },
        { label: "Thống kê",          desc: "Xem báo cáo và biểu đồ",     Icon: BarChart2, href: "/admin/charts",  bg: "bg-violet-600 hover:bg-violet-700"},
        { label: "Top bài hát",       desc: "Bài hát được nghe nhiều nhất",Icon: TrendingUp,href: "/admin/tracks",  bg: "bg-pink-600 hover:bg-pink-700"   },
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
            `}</style>

            {/* ── Header ── */}
            <div className="mb-7" style={{ animation: "dhUp .3s both" }}>
                <div className="flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" />
                    <span className="text-[11px] text-indigo-500 tracking-widest uppercase font-semibold">
                        Won Music Admin
                    </span>
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
                {/* EQ decoration */}
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

            {/* ── Stats ── */}
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
                            {loading ? (
                                <div className="h-7 w-16 bg-gray-100 rounded animate-pulse" />
                            ) : value}
                        </div>
                        <p className="text-xs text-gray-500 font-medium mb-0.5">{label}</p>
                        <p className="text-[11px] text-gray-400">{loading ? "" : sub}</p>
                    </Link>
                ))}
            </div>

            {/* ── Main grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">

                {/* Top tracks */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden" style={{ animation: "dhUp .45s both" }}>
                    <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                                <Music size={13} className="text-indigo-500" />
                            </div>
                            <span className="text-sm font-bold text-gray-900">Top bài hát</span>
                            {/* mini EQ */}
                            <div className="flex items-end gap-[1.5px] h-3">
                                {[40, 70, 50, 85, 55].map((h, i) => (
                                    <div
                                        key={i}
                                        className="w-[2.5px] rounded-sm bg-indigo-400/60"
                                        style={{
                                            height: `${h}%`,
                                            transformOrigin: "bottom",
                                            animation: `dhEq ${.4 + i * .1}s ease-in-out infinite`,
                                            animationDelay: `${i * .07}s`,
                                        }}
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
                                        {/* rank */}
                                        <span className="text-xs font-mono text-gray-300 w-5 text-right flex-shrink-0">
                                            {idx === 0
                                                ? <span className="text-amber-400">🥇</span>
                                                : idx === 1
                                                ? <span className="text-gray-400">🥈</span>
                                                : idx === 2
                                                ? <span className="text-orange-400">🥉</span>
                                                : String(idx + 1).padStart(2, "0")
                                            }
                                        </span>

                                        {/* cover */}
                                        <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
                                            {track.coverUrl
                                                ? <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                                                : <span className="text-indigo-400 text-base">♪</span>
                                            }
                                        </div>

                                        {/* title + bar */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-semibold text-gray-800 truncate mb-1 group-hover:text-indigo-600 transition-colors">
                                                {track.title}
                                            </p>
                                            <div className="h-0.5 bg-gray-100 rounded overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded"
                                                    style={{
                                                        width: `${pct}%`,
                                                        animation: "dhBar .7s cubic-bezier(.4,0,.2,1) both",
                                                        ["--w" as any]: `${pct}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* stats */}
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-[12px] font-semibold text-gray-600 tabular-nums">
                                                {fNum(track.plays ?? 0)}
                                            </p>
                                            <p className="text-[10px] text-gray-400 tabular-nums">
                                                {fTime(track.duration ?? 0)}
                                            </p>
                                        </div>
                                    </Link>
                                );
                            })
                        }
                    </div>
                </div>

                {/* Artists */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden" style={{ animation: "dhUp .5s both" }}>
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
                                            <div className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 w-[18px] h-[18px] rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center">
                                                <BadgeCheck size={9} className="text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[12px] font-semibold text-gray-800 truncate group-hover:text-indigo-600 transition-colors">
                                        {artist.name}
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">{artist.genre ?? "—"}</p>
                                    <p className="text-[11px] font-semibold text-gray-500 mt-1 tabular-nums">
                                        {fNum(artist.followers ?? 0)}
                                        <span className="font-normal text-gray-400"> followers</span>
                                    </p>
                                </Link>
                            ))
                        }
                    </div>
                </div>
            </div>

            {/* ── Quick nav ── */}
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
        </div>
    );
}
