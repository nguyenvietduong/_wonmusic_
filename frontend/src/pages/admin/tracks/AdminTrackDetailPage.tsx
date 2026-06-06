'use client';
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft, Play, Pause, Volume2, VolumeX,
    Edit2, Trash2, Music, Clock, Calendar, Mic2, Tag,
    SkipBack, SkipForward, Shuffle, Repeat, Share2,
    ExternalLink, TrendingUp, CheckCircle2, XCircle,
    Loader2, Heart,
} from "lucide-react";
import { trackService } from "@/services/trackService";
import { toast } from "sonner";

// ─── helpers ────────────────────────────────────────────────────────────────
const fNum = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
};
const fTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

const WAVE = Array.from({ length: 52 }, (_, i) =>
    20 + Math.abs(Math.sin(i * 0.42) * 52 + Math.cos(i * 0.73) * 24)
);

type Tab = "info" | "stats";

export default function AdminTrackDetailPage() {
    const params = useParams();
    const id = params?.id as string | undefined;
    if (!id) return null;
    const router = useRouter();

    const [track,       setTrack]       = useState<any>(null);
    const [loading,     setLoading]     = useState(true);
    const [playing,     setPlaying]     = useState(false);
    const [muted,       setMuted]       = useState(false);
    const [progress,    setProgress]    = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume,      setVolume]      = useState(80);
    const [tab,         setTab]         = useState<Tab>("info");
    const [delModal,    setDelModal]    = useState(false);
    const [deleting,    setDeleting]    = useState(false);

    const audioRef = useRef<HTMLAudioElement>(null);
    const rafRef   = useRef<number>(0);

    // ── fetch ──
    useEffect(() => {
        (async () => {
            try {
                const data = await trackService.getById(id);
                setTrack(data ?? null);
            } catch { /* empty */ } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    // ── sync audio volume ──
    useEffect(() => {
        const a = audioRef.current;
        if (!a) return;
        a.volume = volume / 100;
        a.muted = muted;
    }, [volume, muted]);

    const tick = () => {
        const a = audioRef.current;
        if (!a) return;
        setCurrentTime(a.currentTime);
        setProgress((a.currentTime / (a.duration || 1)) * 100);
        rafRef.current = requestAnimationFrame(tick);
    };

    const togglePlay = () => {
        const a = audioRef.current;
        if (!a) return;
        if (playing) { a.pause(); cancelAnimationFrame(rafRef.current); }
        else { a.play(); rafRef.current = requestAnimationFrame(tick); }
        setPlaying(p => !p);
    };

    const seek = (e: React.MouseEvent<HTMLDivElement>) => {
        const a = audioRef.current;
        if (!a) return;
        const r = e.currentTarget.getBoundingClientRect();
        a.currentTime = ((e.clientX - r.left) / r.width) * (a.duration || 0);
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await trackService.delete(id);
            toast.success("Đã xoá bài hát thành công.");
            router.push("/admin/tracks");
        } catch {
            setDeleting(false);
            setDelModal(false);
            toast.error("Xoá bài hát thất bại. Vui lòng thử lại.");
        }
    };

    // ── Loading skeleton ──
    if (loading) return (
        <div className="animate-pulse space-y-4">
            <div className="h-4 w-36 bg-gray-200 rounded" />
            <div className="bg-white rounded-2xl border border-gray-200 h-52" />
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-gray-200 h-64" />
                <div className="space-y-3">
                    {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-xl border border-gray-200 h-14" />)}
                </div>
            </div>
        </div>
    );

    if (!track) return (
        <div className="py-20 text-center">
            <Music className="text-gray-200 mx-auto mb-3" size={44} />
            <p className="text-sm text-gray-400 mb-4">Không tìm thấy bài hát</p>
            <Link href="/admin/tracks" className="text-indigo-600 text-sm font-medium hover:underline">
                ← Quay lại danh sách
            </Link>
        </div>
    );

    const artist     = track.artistId ?? track.artist;
    const weeklyPlays: number[] = track.weeklyPlays ?? [0, 0, 0, 0, 0, 0, 0];
    const weeklyMax  = Math.max(...weeklyPlays, 1);
    const DAYS       = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

    return (
        <div>
            <style>{`
                @keyframes tdEq   { 0%,100%{transform:scaleY(.2)} 50%{transform:scaleY(1)} }
                @keyframes tdUp   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
                @keyframes tdSpin { to{transform:rotate(360deg)} }
                @keyframes tdBar  { from{width:0} to{width:var(--w)} }
                .td-vol::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:#6366f1;cursor:pointer}
                .td-vol{-webkit-appearance:none;appearance:none;height:3px;border-radius:3px;cursor:pointer;outline:none}
            `}</style>

            {/* hidden audio */}
            {track.audioUrl && (
                <audio
                    ref={audioRef}
                    src={track.audioUrl}
                    onEnded={() => {
                        setPlaying(false); setProgress(0); setCurrentTime(0);
                        cancelAnimationFrame(rafRef.current);
                    }}
                />
            )}

            {/* ── Breadcrumb ── */}
            <div className="flex items-center gap-2 mb-6 flex-wrap" style={{ animation: "tdUp .3s both" }}>
                <Link href="/admin" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors">
                    <ArrowLeft size={12} /> Admin
                </Link>
                <span className="text-gray-300 text-xs">/</span>
                <Link href="/admin/tracks" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors">
                    <Music size={11} /> Bài hát
                </Link>
                <span className="text-gray-300 text-xs">/</span>
                <span className="text-xs text-gray-400 max-w-[200px] truncate">{track.title}</span>
            </div>

            {/* ── Hero card ── */}
            <div
                className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-5"
                style={{ animation: "tdUp .35s both" }}
            >
                <div className="grid" style={{ gridTemplateColumns: "220px 1fr" }}>

                    {/* Cover */}
                    <div className="relative w-[220px] h-[220px] flex-shrink-0 bg-gradient-to-br from-indigo-100 to-indigo-200">
                        {track.coverUrl
                            ? <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center">
                                <Music
                                    size={52}
                                    className="text-indigo-300"
                                    style={playing ? { animation: "tdSpin 5s linear infinite" } : {}}
                                />
                              </div>
                        }
                        {playing && (
                            <div className="absolute inset-0 bg-indigo-500/10 animate-pulse pointer-events-none" />
                        )}
                    </div>

                    {/* Meta + player */}
                    <div className="px-6 py-5 flex flex-col gap-3 min-w-0">

                        {/* Label + publish badge */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold tracking-[2px] uppercase text-indigo-500">Bài hát</span>
                            {track.isPublished
                                ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                    <CheckCircle2 size={9} /> Đã xuất bản
                                  </span>
                                : <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                                    <XCircle size={9} /> Chưa xuất bản
                                  </span>
                            }
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl font-bold text-gray-900 leading-tight truncate">{track.title}</h1>

                        {/* Artist + meta */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600 flex-shrink-0">
                                {artist?.avatar
                                    ? <img src={artist.avatar} alt="" className="w-full h-full object-cover" />
                                    : (artist?.name?.[0] ?? "A")
                                }
                            </div>
                            <Link href={`/admin/artists/${artist?._id}`} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 no-underline">
                                {artist?.name ?? "—"}
                            </Link>
                            {track.genre && <><span className="text-gray-300">·</span><span className="text-xs text-gray-400">{track.genre}</span></>}
                            {track.releaseYear && <><span className="text-gray-300">·</span><span className="text-xs text-gray-400">{track.releaseYear}</span></>}
                        </div>

                        {/* Quick stats */}
                        <div className="flex items-center gap-5">
                            {[
                                { Icon: Play,  val: fNum(track.plays ?? 0),    label: "lượt nghe",  cls: "text-indigo-400" },
                                { Icon: Heart, val: fNum(track.likes ?? 0),    label: "lượt thích", cls: "text-pink-400" },
                                { Icon: Clock, val: fTime(track.duration ?? 0),label: "thời lượng", cls: "text-orange-400" },
                            ].map(({ Icon, val, label, cls }) => (
                                <div key={label} className="flex items-center gap-1.5">
                                    <Icon size={12} className={cls} />
                                    <span className="text-sm font-bold text-gray-800">{val}</span>
                                    <span className="text-xs text-gray-400">{label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Waveform */}
                        <div
                            className="relative h-8 cursor-pointer rounded overflow-hidden"
                            onClick={seek}
                        >
                            <div className="flex items-end gap-[1.5px] h-full overflow-hidden">
                                {WAVE.map((h, i) => {
                                    const filled = (i / WAVE.length) * 100 <= progress;
                                    return (
                                        <div
                                            key={i}
                                            className="flex-1 rounded-[2px]"
                                            style={{
                                                height: `${Math.min(h, 100)}%`,
                                                background: filled
                                                    ? `rgba(99,102,241,${0.45 + (h / 100) * 0.55})`
                                                    : `rgba(99,102,241,${0.08 + (h / 100) * 0.06})`,
                                                transformOrigin: "bottom",
                                                ...(playing && filled
                                                    ? { animation: `tdEq ${0.4 + (i % 5) * 0.1}s ease-in-out infinite`, animationDelay: `${i * 0.02}s` }
                                                    : {}),
                                            }}
                                        />
                                    );
                                })}
                            </div>
                            {/* thumb */}
                            <div
                                className="absolute top-1/2 w-3 h-3 rounded-full bg-indigo-600 shadow-md pointer-events-none"
                                style={{ left: `${progress}%`, transform: "translate(-50%,-50%)", transition: "left .05s linear" }}
                            />
                        </div>

                        {/* Time row */}
                        <div className="flex justify-between -mt-1">
                            <span className="text-[11px] text-gray-400 tabular-nums">{fTime(currentTime)}</span>
                            <span className="text-[11px] text-gray-400 tabular-nums">{fTime(track.duration ?? 0)}</span>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-2">
                            <button className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-300 flex items-center justify-center opacity-40 cursor-default">
                                <Shuffle size={13} />
                            </button>
                            <button
                                onClick={() => { if (audioRef.current) { audioRef.current.currentTime = 0; setProgress(0); setCurrentTime(0); } }}
                                className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-500 flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                                <SkipBack size={14} />
                            </button>

                            {/* Main play */}
                            <button
                                onClick={togglePlay}
                                disabled={!track.audioUrl}
                                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${track.audioUrl ? "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 cursor-pointer" : "bg-gray-100 cursor-not-allowed"}`}
                            >
                                {playing
                                    ? <Pause size={16} className="text-white" />
                                    : <Play size={16} className={track.audioUrl ? "text-white ml-0.5" : "text-gray-300 ml-0.5"} />
                                }
                            </button>

                            <button className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-500 flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer">
                                <SkipForward size={14} />
                            </button>
                            <button className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-300 flex items-center justify-center opacity-40 cursor-default">
                                <Repeat size={13} />
                            </button>

                            <div className="flex-1" />

                            <button
                                onClick={() => setMuted(m => !m)}
                                className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-500 flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                                {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                            </button>
                            <input
                                type="range" min={0} max={100} value={muted ? 0 : volume}
                                className="td-vol w-20"
                                style={{
                                    background: `linear-gradient(90deg,#6366f1 ${muted ? 0 : volume}%,#e5e7eb ${muted ? 0 : volume}%)`,
                                }}
                                onChange={e => { setVolume(+e.target.value); if (+e.target.value > 0) setMuted(false); }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Action bar ── */}
            <div className="flex items-center gap-2.5 mb-5 flex-wrap" style={{ animation: "tdUp .4s both" }}>
                <Link
                    href={`/admin/tracks/${id}/edit`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 text-sm font-semibold hover:bg-indigo-100 transition-colors no-underline"
                >
                    <Edit2 size={13} /> Chỉnh sửa
                </Link>
                <button
                    onClick={() => setDelModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-100 transition-colors cursor-pointer"
                >
                    <Trash2 size={13} /> Xoá bài hát
                </button>
                <div className="flex-1" />
                <button className="w-9 h-9 rounded-lg border border-gray-200 bg-white text-gray-500 flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer">
                    <Share2 size={14} />
                </button>
                {track.audioUrl && (
                    <a href={track.audioUrl} target="_blank" rel="noopener noreferrer"
                        className="w-9 h-9 rounded-lg border border-gray-200 bg-white text-gray-500 flex items-center justify-center hover:bg-gray-50 transition-colors no-underline">
                        <ExternalLink size={14} />
                    </a>
                )}
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-1.5 mb-5" style={{ animation: "tdUp .45s both" }}>
                {(["info", "stats"] as Tab[]).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-5 py-2 rounded-full text-sm font-semibold border transition-all cursor-pointer ${tab === t
                            ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                            : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        }`}
                    >
                        {{ info: "Thông tin", stats: "Thống kê" }[t]}
                    </button>
                ))}
            </div>

            {/* ════ Tab: Info ════ */}
            {tab === "info" && (
                <div className="grid grid-cols-2 gap-4" style={{ animation: "tdUp .3s both" }}>

                    {/* Details card */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                        <p className="text-[10px] font-bold tracking-[2px] uppercase text-gray-400 mb-4">Chi tiết</p>
                        <div className="space-y-0.5">
                            {[
                                { Icon: Music,        label: "Tên bài hát",   value: track.title,                  color: "" },
                                { Icon: Mic2,         label: "Nghệ sĩ",       value: artist?.name ?? "—",           color: "" },
                                { Icon: Tag,          label: "Thể loại",      value: track.genre ?? "—",            color: "" },
                                { Icon: Clock,        label: "Thời lượng",    value: fTime(track.duration ?? 0),    color: "" },
                                { Icon: Calendar,     label: "Năm phát hành", value: track.releaseYear ?? "—",      color: "" },
                                { Icon: CheckCircle2, label: "Trạng thái",    value: track.isPublished ? "Đã xuất bản" : "Chưa xuất bản", color: track.isPublished ? "text-emerald-600" : "text-red-500" },
                            ].map(({ Icon, label, value, color }) => (
                                <div key={label} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                        <Icon size={13} className="text-indigo-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] text-gray-400 mb-0.5">{label}</p>
                                        <p className={`text-sm font-semibold truncate ${color || "text-gray-800"}`}>{value as string}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Stat mini cards */}
                    <div className="grid grid-cols-2 gap-3 content-start">
                        {[
                            { label: "Tổng lượt nghe", value: fNum(track.plays ?? 0),     Icon: Play,     iconCls: "text-indigo-500", bgCls: "bg-indigo-50",  sub: "Toàn thời gian" },
                            { label: "Lượt thích",      value: fNum(track.likes ?? 0),     Icon: Heart,    iconCls: "text-pink-500",   bgCls: "bg-pink-50",    sub: "Toàn thời gian" },
                            { label: "Thời lượng",      value: fTime(track.duration ?? 0), Icon: Clock,    iconCls: "text-orange-500", bgCls: "bg-orange-50",  sub: "mm:ss" },
                            { label: "Năm phát hành",   value: track.releaseYear ?? "—",   Icon: Calendar, iconCls: "text-teal-500",   bgCls: "bg-teal-50",    sub: "" },
                        ].map(({ label, value, Icon, iconCls, bgCls, sub }, i) => (
                            <div
                                key={label}
                                className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:-translate-y-0.5 hover:shadow-md transition-all"
                                style={{ animation: `tdUp .4s ${i * .06}s both` }}
                            >
                                <div className={`w-10 h-10 rounded-xl ${bgCls} flex items-center justify-center mb-3`}>
                                    <Icon size={18} className={iconCls} />
                                </div>
                                <div className="text-2xl font-bold text-gray-900 leading-none mb-1">{value}</div>
                                <p className="text-xs text-gray-500 font-medium">{label}</p>
                                {sub && <p className="text-[10px] text-gray-300 mt-0.5">{sub}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ════ Tab: Stats ════ */}
            {tab === "stats" && (
                <div style={{ animation: "tdUp .3s both" }}>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                        <div className="flex items-center gap-2 mb-5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                                <TrendingUp size={15} className="text-indigo-500" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-800">Lượt nghe 7 ngày gần nhất</p>
                                <p className="text-[11px] text-gray-400">Theo dõi xu hướng</p>
                            </div>
                        </div>

                        {/* Bar chart */}
                        <div className="flex items-end gap-2.5 h-36 mb-2">
                            {weeklyPlays.map((val, i) => {
                                const pct = (val / weeklyMax) * 100;
                                const isToday = i === 6;
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full">
                                        <span className="text-[10px] text-gray-400 mt-auto tabular-nums">{fNum(val)}</span>
                                        <div
                                            className={`w-full rounded-t-md transition-all ${isToday ? "bg-indigo-500" : "bg-indigo-100"}`}
                                            style={{
                                                height: `${Math.max(pct, 3)}%`,
                                                animation: `tdUp .4s ${i * .05}s both`,
                                            }}
                                        />
                                        <span className={`text-[10px] font-medium ${isToday ? "text-indigo-600" : "text-gray-400"}`}>
                                            {DAYS[i]}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Summary row */}
                        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
                            {[
                                { label: "Tổng tuần",        value: fNum(weeklyPlays.reduce((a, b) => a + b, 0)) },
                                { label: "Ngày cao nhất",    value: fNum(weeklyMax) },
                                { label: "Trung bình / ngày",value: fNum(Math.round(weeklyPlays.reduce((a, b) => a + b, 0) / 7)) },
                            ].map(({ label, value }) => (
                                <div key={label} className="text-center p-3 rounded-xl bg-gray-50 border border-gray-100">
                                    <div className="text-2xl font-bold text-indigo-600 leading-none mb-1">{value}</div>
                                    <p className="text-[11px] text-gray-500">{label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete confirmation modal ── */}
            {delModal && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setDelModal(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
                        onClick={e => e.stopPropagation()}
                        style={{ animation: "tdUp .18s ease" }}
                    >
                        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-4">
                            <Trash2 size={22} className="text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Xoá bài hát?</h3>
                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                            Bạn có chắc muốn xoá <span className="font-semibold text-gray-900">"{track.title}"</span>?
                            Hành động này không thể hoàn tác.
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
                                    ? <><Loader2 size={14} style={{ animation: "tdSpin .7s linear infinite" }} /> Đang xoá...</>
                                    : <><Trash2 size={14} /> Xoá bài hát</>
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
