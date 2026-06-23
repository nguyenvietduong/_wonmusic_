'use client';
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
    ArrowLeft, Mic2, Edit2, Trash2, BadgeCheck,
    Users, Music, Clock, Play, TrendingUp,
    Facebook, Instagram, Youtube, ExternalLink,
    Calendar, Hash, AlertCircle, Loader2, Star,
} from "lucide-react";
import { artistService } from "@/services/artistService";
import { trackService }  from "@/services/trackService";
import { toast }         from "sonner";

// ─── helpers ────────────────────────────────────────────────────────────────
const fNum = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
};
const fTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

const EQ_H = [30, 60, 45, 75, 35, 68, 52, 82, 40, 58, 70, 42];

const TABS = [
    { key: 'info',   label: 'Thông tin', Icon: Mic2       },
    { key: 'tracks', label: 'Bài hát',   Icon: Music      },
    { key: 'stats',  label: 'Thống kê',  Icon: TrendingUp },
] as const;
type TabKey = typeof TABS[number]['key'];

function AdminArtistDetailPageInner() {
    const params = useParams();
    const id = params?.id as string | undefined;
    if (!id) return null;
    const router       = useRouter();
    const searchParams = useSearchParams();
    const tab          = (searchParams?.get('tab') ?? 'info') as TabKey;

    const [artist,        setArtist]        = useState<any>(null);
    const [tracks,        setTracks]        = useState<any[]>([]);
    const [loading,       setLoading]       = useState(true);
    const [loadingTracks, setLoadingTracks] = useState(true);
    const [error,         setError]         = useState<string | null>(null);
    const [delModal,      setDelModal]      = useState(false);
    const [deleting,      setDeleting]      = useState(false);

    // ── fetch artist ──
    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                setArtist(await artistService.getById(id));
            } catch {
                setError("Không thể tải thông tin nghệ sĩ.");
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    // ── fetch tracks ──
    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const res = await trackService.getAll({ artistId: id, limit: 50 });
                setTracks(res.data ?? []);
            } catch {
                setTracks([]);
            } finally {
                setLoadingTracks(false);
            }
        })();
    }, [id]);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await artistService.delete(id);
            toast.success("Đã xoá nghệ sĩ thành công.");
            router.push("/admin/artists");
        } catch {
            setDeleting(false);
            setDelModal(false);
            toast.error("Xoá nghệ sĩ thất bại. Vui lòng thử lại.");
        }
    };

    const totalPlays    = tracks.reduce((s, t) => s + (t.plays    ?? 0), 0);
    const totalDuration = tracks.reduce((s, t) => s + (t.duration ?? 0), 0);

    // ── skeleton ──
    if (loading) return (
        <div className="animate-pulse space-y-4">
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex gap-5">
                    <div className="w-28 h-28 rounded-full bg-gray-200 flex-shrink-0" />
                    <div className="flex-1 space-y-3 pt-2">
                        <div className="h-8 w-48 bg-gray-200 rounded" />
                        <div className="h-3 w-24 bg-gray-100 rounded" />
                        <div className="h-3 w-64 bg-gray-100 rounded" />
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
                {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white rounded-xl border border-gray-200" />)}
            </div>
        </div>
    );

    if (!artist) return (
        <div className="py-20 text-center">
            <AlertCircle className="text-red-300 mx-auto mb-3" size={40} />
            <p className="text-sm text-gray-400 mb-4">{error ?? "Không tìm thấy nghệ sĩ"}</p>
            <Link href="/admin/artists" className="text-indigo-600 text-sm font-medium hover:underline">
                ← Quay lại
            </Link>
        </div>
    );

    const socials  = artist.socialLinks ?? {};
    const maxPlays = tracks[0]?.plays || 1;

    return (
        <div className="pb-16">
            <style>{`
                @keyframes adUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
                @keyframes adEq  { 0%,100%{transform:scaleY(.2)} 50%{transform:scaleY(1)} }
                @keyframes adSpin{ to{transform:rotate(360deg)} }
                @keyframes adBar { from{width:0} to{width:var(--w)} }
            `}</style>

            {/* ── Breadcrumb ── */}
            <div className="flex items-center gap-2 mb-6 flex-wrap" style={{ animation: "adUp .3s both" }}>
                <Link href="/admin" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors">
                    <ArrowLeft size={12} /> Admin
                </Link>
                <span className="text-gray-300 text-xs">/</span>
                <Link href="/admin/artists" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors">
                    <Mic2 size={11} /> Nghệ sĩ
                </Link>
                <span className="text-gray-300 text-xs">/</span>
                <span className="text-xs text-gray-400 max-w-[220px] truncate">{artist.name}</span>
            </div>

            {/* ── Tab bar ── */}
            <div className="flex gap-1.5 mb-5" style={{ animation: "adUp .33s both" }}>
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

            {/* ════ Tab: Thông tin ════ */}
            {tab === 'info' && (
                <div
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-5 relative overflow-hidden"
                    style={{ animation: "adUp .35s both" }}
                >
                    {/* subtle top-left glow */}
                    <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-indigo-50 opacity-60 pointer-events-none" />

                    <div className="relative flex items-start gap-6 flex-wrap">

                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            <div className={`w-28 h-28 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-indigo-100 to-indigo-200 ${artist.verified ? "ring-4 ring-indigo-400 ring-offset-2" : "ring-2 ring-gray-200"}`}>
                                {artist.avatar
                                    ? <img src={artist.avatar} alt={artist.name} className="w-full h-full object-cover" />
                                    : <Mic2 size={38} className="text-indigo-300" />
                                }
                            </div>
                            {artist.verified && (
                                <div className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center shadow">
                                    <BadgeCheck size={14} className="text-white" />
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            {/* badges */}
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                                {artist.verified && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wide text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                                        <BadgeCheck size={10} /> XÁC MINH
                                    </span>
                                )}
                                {(() => {
                                    const gs: string[] = artist.genres?.length ? artist.genres : (artist.genre ? [artist.genre] : []);
                                    return gs.map((g: string) => (
                                        <span key={g} className="inline-flex items-center text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                                            {g}
                                        </span>
                                    ));
                                })()}
                            </div>

                            <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-2 break-words">
                                {artist.name}
                            </h1>

                            {artist.bio && (
                                <p className="text-sm text-gray-500 leading-relaxed max-w-xl mb-4">
                                    {artist.bio}
                                </p>
                            )}

                            {/* Socials */}
                            {(socials.facebook || socials.instagram || socials.youtube || socials.tiktok) && (
                                <div className="flex items-center gap-2 flex-wrap">
                                    {socials.facebook  && (
                                        <a href={socials.facebook} target="_blank" rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors no-underline">
                                            <Facebook size={12} /> Facebook <ExternalLink size={9} className="opacity-50" />
                                        </a>
                                    )}
                                    {socials.instagram && (
                                        <a href={socials.instagram} target="_blank" rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-pink-600 bg-pink-50 border border-pink-200 px-3 py-1.5 rounded-lg hover:bg-pink-100 transition-colors no-underline">
                                            <Instagram size={12} /> Instagram <ExternalLink size={9} className="opacity-50" />
                                        </a>
                                    )}
                                    {socials.youtube   && (
                                        <a href={socials.youtube} target="_blank" rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors no-underline">
                                            <Youtube size={12} /> YouTube <ExternalLink size={9} className="opacity-50" />
                                        </a>
                                    )}
                                    {socials.tiktok    && (
                                        <a href={socials.tiktok} target="_blank" rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors no-underline">
                                            <Music size={12} /> TikTok <ExternalLink size={9} className="opacity-50" />
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2.5 flex-shrink-0 flex-wrap">
                            <Link
                                href={`/admin/artists/${id}/edit`}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors no-underline"
                            >
                                <Edit2 size={13} /> Chỉnh sửa
                            </Link>
                            <button
                                onClick={() => setDelModal(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-100 transition-colors cursor-pointer"
                            >
                                <Trash2 size={13} /> Xoá
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════ Tab: Bài hát ════ */}
            {tab === 'tracks' && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden" style={{ animation: "adUp .3s both" }}>
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <p className="text-[10px] font-bold tracking-[2px] uppercase text-gray-400">Danh sách bài hát</p>
                        {!loadingTracks && tracks.length > 0 && (
                            <span className="text-xs text-gray-400 font-medium">{tracks.length} bài</span>
                        )}
                    </div>

                    {loadingTracks ? (
                        <div className="p-5 space-y-3 animate-pulse">
                            {[1,2,3,4,5].map(i => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex-shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                                        <div className="h-1.5 bg-gray-50 rounded w-3/4" />
                                    </div>
                                    <div className="w-10 h-3 bg-gray-100 rounded" />
                                </div>
                            ))}
                        </div>
                    ) : tracks.length === 0 ? (
                        <div className="py-16 text-center">
                            <Music size={36} className="text-gray-200 mx-auto mb-3" />
                            <p className="text-sm text-gray-400">Chưa có bài hát nào</p>
                        </div>
                    ) : (
                        <div>
                            {tracks.map((track, idx) => {
                                const pct = Math.round((track.plays / maxPlays) * 100);
                                return (
                                    <div
                                        key={track._id}
                                        className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors"
                                        style={{ animation: `adUp .25s ${idx * .03}s both` }}
                                    >
                                        {/* rank */}
                                        <span className="text-xs font-mono text-gray-300 w-5 text-right flex-shrink-0">
                                            {String(idx + 1).padStart(2, "0")}
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
                                            <Link href={`/admin/tracks/${track._id}`} className="block no-underline">
                                                <p className="text-sm font-semibold text-gray-800 truncate mb-1">
                                                    {track.title}
                                                </p>
                                            </Link>
                                            <div className="h-0.5 bg-gray-100 rounded overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded"
                                                    style={{
                                                        width: `${pct}%`,
                                                        animation: "adBar .6s cubic-bezier(.4,0,.2,1) both",
                                                        ["--w" as any]: `${pct}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* plays */}
                                        <span className="inline-flex items-center gap-1.5 flex-shrink-0">
                                            <Play size={10} className="text-indigo-400" />
                                            <span className="text-xs font-semibold text-gray-500 tabular-nums">
                                                {fNum(track.plays ?? 0)}
                                            </span>
                                        </span>

                                        {/* duration */}
                                        <span className="inline-flex items-center gap-1.5 flex-shrink-0">
                                            <Clock size={10} className="text-gray-300" />
                                            <span className="text-xs text-gray-400 tabular-nums">
                                                {fTime(track.duration ?? 0)}
                                            </span>
                                        </span>

                                        {/* edit */}
                                        <Link
                                            href={`/admin/tracks/${track._id}/edit`}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-600 text-[11px] font-semibold hover:bg-indigo-100 transition-colors no-underline flex-shrink-0"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <Edit2 size={10} /> Sửa
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ════ Tab: Thống kê ════ */}
            {tab === 'stats' && (
                <div style={{ animation: "adUp .3s both" }}>
                    {/* Stat cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                        {[
                            { label: "Followers",       value: fNum(artist.followers ?? 0),                     Icon: Users,      iconCls: "text-indigo-500", bgCls: "bg-indigo-50"  },
                            { label: "Bài hát",         value: loadingTracks ? "—" : String(tracks.length),     Icon: Music,      iconCls: "text-blue-500",   bgCls: "bg-blue-50"    },
                            { label: "Tổng lượt nghe",  value: loadingTracks ? "—" : fNum(totalPlays),          Icon: TrendingUp, iconCls: "text-pink-500",   bgCls: "bg-pink-50"    },
                            { label: "Tổng thời lượng", value: loadingTracks ? "—" : fTime(totalDuration),      Icon: Clock,      iconCls: "text-orange-500", bgCls: "bg-orange-50"  },
                        ].map(({ label, value, Icon, iconCls, bgCls }, i) => (
                            <div
                                key={label}
                                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:-translate-y-0.5 hover:shadow-md transition-all"
                                style={{ animation: `adUp .4s ${i * .07}s both` }}
                            >
                                <div className={`w-10 h-10 rounded-xl ${bgCls} flex items-center justify-center mb-3`}>
                                    <Icon size={18} className={iconCls} />
                                </div>
                                <div className="text-2xl font-bold text-gray-900 leading-none mb-1">{value}</div>
                                <p className="text-xs text-gray-500 font-medium">{label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Info sidebar */}
                    <div className="flex flex-col gap-4 max-w-sm">
                        {/* System info */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                            <p className="text-[10px] font-bold tracking-[2px] uppercase text-gray-400 mb-4">
                                Thông tin hệ thống
                            </p>
                            <div className="space-y-0.5">
                                {[
                                    { Icon: Hash,      label: "Artist ID",  value: id.slice(-8) + "...",                                          mono: true  },
                                    { Icon: Calendar,  label: "Ngày tạo",   value: artist.createdAt ? new Date(artist.createdAt).toLocaleDateString("vi-VN") : "—" },
                                    { Icon: Calendar,  label: "Cập nhật",   value: artist.updatedAt ? new Date(artist.updatedAt).toLocaleDateString("vi-VN") : "—" },
                                    { Icon: Users,     label: "Followers",  value: fNum(artist.followers ?? 0)                                                 },
                                    { Icon: artist.verified ? BadgeCheck : Star, label: "Trạng thái", value: artist.verified ? "Đã xác minh" : "Thường",
                                      valueColor: artist.verified ? "text-indigo-600" : "text-gray-500" },
                                ].map(({ Icon, label, value, mono, valueColor }) => (
                                    <div key={label} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                                        <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                                            <Icon size={12} className="text-gray-400" />
                                        </div>
                                        <span className="text-xs text-gray-400 w-20 flex-shrink-0">{label}</span>
                                        <span className={`text-xs font-semibold truncate ${valueColor ?? "text-gray-700"} ${mono ? "font-mono" : ""}`}>
                                            {value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* EQ visualizer */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                            <p className="text-[10px] font-bold tracking-[2px] uppercase text-gray-400 mb-3">Visualizer</p>
                            <div className="flex items-end gap-[3px] h-12">
                                {EQ_H.map((h, i) => (
                                    <div
                                        key={i}
                                        className="flex-1 rounded-t-[3px] bg-indigo-400"
                                        style={{
                                            height: `${h}%`,
                                            opacity: 0.3 + (h / 100) * 0.5,
                                            transformOrigin: "bottom",
                                            animation: `adEq ${.4 + (i % 5) * .12}s ease-in-out infinite`,
                                            animationDelay: `${i * .06}s`,
                                        }}
                                    />
                                ))}
                            </div>
                            <p className="text-[11px] text-gray-400 text-center mt-3">
                                {tracks.length} bài · {fTime(totalDuration)} tổng
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete modal ── */}
            {delModal && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => !deleting && setDelModal(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
                        onClick={e => e.stopPropagation()}
                        style={{ animation: "adUp .18s ease" }}
                    >
                        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-4">
                            <Trash2 size={22} className="text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Xoá nghệ sĩ?</h3>
                        <p className="text-sm text-gray-500 mb-2 leading-relaxed">
                            Bạn có chắc muốn xoá <span className="font-semibold text-gray-900">"{artist.name}"</span>?
                        </p>
                        <p className="text-xs text-red-400 mb-6 leading-relaxed">
                            ⚠ Hành động này không thể hoàn tác. Các bài hát liên quan sẽ mất thông tin nghệ sĩ.
                        </p>
                        <div className="flex gap-2.5">
                            <button
                                onClick={() => setDelModal(false)}
                                disabled={deleting}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                Huỷ
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors disabled:opacity-70 cursor-pointer flex items-center justify-center gap-2"
                            >
                                {deleting
                                    ? <><Loader2 size={14} style={{ animation: "adSpin .7s linear infinite" }} /> Đang xoá...</>
                                    : <><Trash2 size={14} /> Xoá nghệ sĩ</>
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AdminArtistDetailPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center py-24">
                <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <AdminArtistDetailPageInner />
        </Suspense>
    );
}
