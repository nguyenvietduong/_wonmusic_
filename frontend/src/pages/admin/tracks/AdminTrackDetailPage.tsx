// src/pages/admin/AdminTrackDetailPage.tsx
import { useEffect, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router";
import {
    ArrowLeft, Play, Pause, Volume2, VolumeX,
    Edit2, Trash2, Music, Clock,
    Calendar, Mic2, Tag, Heart,
    Share2, SkipBack, SkipForward, Repeat, Shuffle,
    CheckCircle2, XCircle, ExternalLink, TrendingUp,
    Loader2,
} from "lucide-react";
import { trackService } from "@/services/trackService";
import { toast } from "sonner";

// ─── helpers ────────────────────────────────────────────────────────────────
const formatNum = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
};
const formatTime = (sec: number) =>
    `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;

// Static waveform shape
const WAVE = Array.from({ length: 64 }, (_, i) =>
    18 + Math.abs(Math.sin(i * 0.38) * 58 + Math.cos(i * 0.71) * 28)
);

// ─── Component ──────────────────────────────────────────────────────────────
export default function AdminTrackDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [track, setTrack] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(80);
    const [activeTab, setActiveTab] = useState<"info" | "lyrics" | "stats">("info");
    const [deleteModal, setDeleteModal] = useState(false);
    const [deleting,    setDeleting]    = useState(false);

    const audioRef = useRef<HTMLAudioElement>(null);
    const rafRef = useRef<number>(0);

    useEffect(() => {
        (async () => {
            try {
                const res = await trackService.getById?.(id!);
                // support both { data } and raw object responses
                const data = res;
                setTrack(data ?? null);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.volume = volume / 100;
        audio.muted = muted;
    }, [volume, muted]);

    const tick = () => {
        const audio = audioRef.current;
        if (!audio) return;
        setCurrentTime(audio.currentTime);
        setProgress((audio.currentTime / (audio.duration || 1)) * 100);
        rafRef.current = requestAnimationFrame(tick);
    };

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (playing) {
            audio.pause();
            cancelAnimationFrame(rafRef.current);
        } else {
            audio.play();
            rafRef.current = requestAnimationFrame(tick);
        }
        setPlaying(p => !p);
    };

    const seek = (e: React.MouseEvent<HTMLDivElement>) => {
        const audio = audioRef.current;
        if (!audio) return;
        const rect = e.currentTarget.getBoundingClientRect();
        audio.currentTime = ((e.clientX - rect.left) / rect.width) * (audio.duration || 0);
    };

    // ── Delete ──
    const handleDelete = async () => {
        setDeleting(true);
        try {
            await trackService.delete(id!);
            toast.success("Đã xoá bài hát thành công.");
            navigate("/admin/tracks");
        } catch {
            setDeleting(false);
            setDeleteModal(false);
            toast.error("Xoá bài hát thất bại. Vui lòng thử lại.");
        }
    };

    // ── Loading skeleton ──
    if (loading) return (
        <div style={{ fontFamily: "'Be Vietnam Pro',sans-serif" }}>
            <style>{`@keyframes sk{0%,100%{opacity:.35}50%{opacity:.75}}`}</style>
            <div style={{ animation: "sk 1.5s ease-in-out infinite" }}>
                <div style={{ width: 120, height: 14, borderRadius: 6, background: "rgba(255,255,255,.07)", marginBottom: 28 }} />
                <div style={{ display: "flex", gap: 0, borderRadius: 22, overflow: "hidden", border: "1px solid rgba(255,255,255,.07)", background: "rgba(255,255,255,.02)", marginBottom: 22 }}>
                    <div style={{ width: 240, height: 240, background: "rgba(255,255,255,.06)", flexShrink: 0 }} />
                    <div style={{ flex: 1, padding: 26, display: "flex", flexDirection: "column", gap: 14 }}>
                        {[55, 38, 25, 60, 80].map((w, i) => (
                            <div key={i} style={{ height: i === 1 ? 28 : 12, width: `${w}%`, borderRadius: 6, background: "rgba(255,255,255,.06)" }} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    if (!track) return (
        <div style={{ fontFamily: "'Be Vietnam Pro',sans-serif", padding: "60px 0", textAlign: "center" }}>
            <Music size={40} color="rgba(255,255,255,.1)" style={{ margin: "0 auto 12px", display: "block" }} />
            <p style={{ color: "rgba(255,255,255,.3)", fontSize: 14 }}>Không tìm thấy bài hát</p>
            <Link to="/admin/tracks" style={{ color: "#4ade80", fontSize: 13, textDecoration: "none", marginTop: 10, display: "inline-block" }}>
                ← Quay lại danh sách
            </Link>
        </div>
    );

    // Normalise field names — API returns artistId
    const artist = track.artistId ?? track.artist;

    const weeklyPlays: number[] = track.weeklyPlays ?? [0, 0, 0, 0, 0, 0, 0];
    const weeklyMax = Math.max(...weeklyPlays, 1);

    return (
        <div style={{ fontFamily: "'Be Vietnam Pro',sans-serif" }}>
            <style>{`
                @keyframes ahEq     { 0%,100%{transform:scaleY(.2)} 50%{transform:scaleY(1)} }
                @keyframes ahFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
                @keyframes ahScale  { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
                @keyframes ahGlow   { 0%,100%{opacity:.6} 50%{opacity:1} }
                @keyframes ahSpin   { to{transform:rotate(360deg)} }

                .td-pill-btn {
                    display:inline-flex; align-items:center; gap:7px;
                    padding:8px 15px; border-radius:100px;
                    border:1px solid rgba(255,255,255,.09);
                    background:rgba(255,255,255,.03);
                    color:rgba(255,255,255,.5); font-size:13px; font-weight:500;
                    text-decoration:none; cursor:pointer; font-family:'Be Vietnam Pro',sans-serif;
                    transition:all .18s;
                }
                .td-pill-btn:hover { background:rgba(255,255,255,.07); color:#fff; border-color:rgba(255,255,255,.15); }

                .td-icon-btn {
                    width:36px; height:36px; border-radius:10px;
                    border:1px solid rgba(255,255,255,.08);
                    background:rgba(255,255,255,.03);
                    display:inline-flex; align-items:center; justify-content:center;
                    cursor:pointer; transition:all .18s; color:rgba(255,255,255,.4);
                    font-family:'Be Vietnam Pro',sans-serif;
                }
                .td-icon-btn:hover { background:rgba(255,255,255,.08); color:#fff; border-color:rgba(255,255,255,.15); }

                .td-tab {
                    padding:8px 20px; border-radius:100px;
                    font-size:13px; font-weight:600; cursor:pointer;
                    border:1px solid transparent; transition:all .18s;
                    font-family:'Be Vietnam Pro',sans-serif; color:rgba(255,255,255,.38);
                    background:transparent;
                }
                .td-tab:hover { color:rgba(255,255,255,.7); }
                .td-tab.active { color:#4ade80; border-color:rgba(74,222,128,.22); background:rgba(74,222,128,.07); }

                .td-card {
                    border-radius:18px; border:1px solid rgba(255,255,255,.07);
                    background:rgba(255,255,255,.02);
                }

                .td-info-row {
                    display:flex; align-items:flex-start; gap:12px;
                    padding:11px 0; border-bottom:1px solid rgba(255,255,255,.05);
                }
                .td-info-row:last-child { border-bottom:none; }

                .td-stat-mini {
                    padding:14px 16px; border-radius:14px;
                    border:1px solid rgba(255,255,255,.07);
                    background:rgba(255,255,255,.02);
                    transition:all .2s; animation:ahFadeUp .4s both;
                }
                .td-stat-mini:hover { background:rgba(255,255,255,.05); transform:translateY(-2px); }

                .td-vol-slider {
                    -webkit-appearance:none; appearance:none;
                    width:76px; height:3px; border-radius:3px; cursor:pointer; outline:none;
                    background:linear-gradient(90deg,#4ade80 var(--val),rgba(255,255,255,.1) var(--val));
                }
                .td-vol-slider::-webkit-slider-thumb {
                    -webkit-appearance:none; width:11px; height:11px;
                    border-radius:50%; background:#4ade80; cursor:pointer;
                }

                .td-modal-overlay {
                    position:fixed; inset:0; z-index:999;
                    background:rgba(0,0,0,.72); display:flex;
                    align-items:center; justify-content:center;
                    backdrop-filter:blur(5px); animation:ahFadeUp .15s ease;
                }
                .td-modal {
                    background:#141a14; border:1px solid rgba(255,255,255,.1);
                    border-radius:20px; padding:28px; max-width:400px; width:90%;
                    animation:ahScale .18s ease;
                }

                .td-progress-wrap {
                    position:relative; height:36px; cursor:pointer; border-radius:6px; overflow:hidden;
                }
                .td-progress-thumb {
                    position:absolute; top:50%; width:11px; height:11px;
                    border-radius:50%; background:#4ade80; transform:translate(-50%,-50%);
                    box-shadow:0 0 8px rgba(74,222,128,.55); pointer-events:none;
                    transition:left .05s linear;
                }
            `}</style>

            {/* hidden audio */}
            {track.audioUrl && (
                <audio
                    ref={audioRef}
                    src={track.audioUrl}
                    onEnded={() => { setPlaying(false); setProgress(0); setCurrentTime(0); cancelAnimationFrame(rafRef.current); }}
                />
            )}

            {/* ── Breadcrumb ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22, animation: "ahFadeUp .3s both", flexWrap: "wrap" }}>
                <Link to="/admin" className="td-pill-btn"><ArrowLeft size={13} /> Admin</Link>
                <span style={{ color: "rgba(255,255,255,.18)", fontSize: 12 }}>/</span>
                <Link to="/admin/tracks" className="td-pill-btn"><Music size={12} /> Bài hát</Link>
                <span style={{ color: "rgba(255,255,255,.18)", fontSize: 12 }}>/</span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,.4)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {track.title}
                </span>
            </div>

            {/* ── Hero card ── */}
            <div className="td-card" style={{ overflow: "hidden", marginBottom: 20, animation: "ahFadeUp .35s both" }}>
                <div style={{ display: "grid", gridTemplateColumns: "240px 1fr" }}>

                    {/* Cover */}
                    <div style={{ position: "relative", width: 240, height: 240, flexShrink: 0 }}>
                        <div style={{
                            width: 240, height: 240,
                            background: "linear-gradient(135deg,#052e16,#14532d,#16a34a)",
                            display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
                        }}>
                            {track.coverUrl
                                ? <img src={track.coverUrl} alt={track.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                : <Music size={52} color="rgba(74,222,128,.28)" style={playing ? { animation: "ahSpin 5s linear infinite" } : {}} />
                            }
                        </div>
                        {playing && (
                            <div style={{ position: "absolute", inset: 0, background: "rgba(74,222,128,.06)", animation: "ahGlow 2s ease-in-out infinite", pointerEvents: "none" }} />
                        )}
                    </div>

                    {/* Meta + player */}
                    <div style={{ padding: "22px 26px", display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>

                        {/* Top meta */}
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                <span style={{ fontSize: 10, color: "#4ade80", letterSpacing: "2px", textTransform: "uppercase", fontWeight: 700 }}>Bài hát</span>
                                {track.isPublished
                                    ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, color: "#4ade80", background: "rgba(74,222,128,.1)", padding: "2px 8px", borderRadius: 100 }}>
                                        <CheckCircle2 size={9} /> Đã xuất bản
                                    </span>
                                    : <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, color: "#f87171", background: "rgba(248,113,113,.1)", padding: "2px 8px", borderRadius: 100 }}>
                                        <XCircle size={9} /> Chưa xuất bản
                                    </span>
                                }
                            </div>

                            <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 38, color: "#fff", letterSpacing: 2, lineHeight: 1, marginBottom: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {track.title}
                            </h1>

                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                {/* Artist avatar */}
                                <div style={{ width: 22, height: 22, borderRadius: "50%", overflow: "hidden", background: "linear-gradient(135deg,#bbf7d0,#4ade80)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#166534", fontWeight: 700, flexShrink: 0 }}>
                                    {artist?.avatar
                                        ? <img src={artist.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        : (artist?.name?.[0] ?? "A")
                                    }
                                </div>
                                <Link to={`/admin/artists/${artist?._id}`} style={{ fontSize: 13, fontWeight: 700, color: "#4ade80", textDecoration: "none" }}>
                                    {artist?.name ?? "—"}
                                </Link>
                                {track.genre && (
                                    <>
                                        <span style={{ color: "rgba(255,255,255,.2)" }}>·</span>
                                        <span style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>{track.genre}</span>
                                    </>
                                )}
                                {track.releaseYear && (
                                    <>
                                        <span style={{ color: "rgba(255,255,255,.2)" }}>·</span>
                                        <span style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>{track.releaseYear}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Quick stats */}
                        <div style={{ display: "flex", gap: 22 }}>
                            {[
                                { icon: Play, val: formatNum(track.plays ?? 0), label: "lượt nghe" },
                                { icon: Heart, val: formatNum(track.likes ?? 0), label: "lượt thích" },
                                { icon: Clock, val: formatTime(track.duration ?? 0), label: "thời lượng" },
                            ].map(({ icon: Icon, val, label }) => (
                                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <Icon size={12} color="rgba(74,222,128,.55)" />
                                    <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{val}</span>
                                    <span style={{ fontSize: 11, color: "rgba(255,255,255,.28)" }}>{label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Waveform progress */}
                        <div
                            className="td-progress-wrap"
                            onClick={seek}
                            title="Click to seek"
                        >
                            <div style={{ display: "flex", alignItems: "flex-end", gap: 1.5, height: "100%", overflow: "hidden" }}>
                                {WAVE.map((h, i) => {
                                    const filled = (i / WAVE.length) * 100 <= progress;
                                    return (
                                        <div key={i} style={{
                                            flex: 1,
                                            height: `${Math.min(h, 100)}%`,
                                            background: filled
                                                ? `rgba(74,222,128,${.45 + (h / 100) * .55})`
                                                : `rgba(255,255,255,${.05 + (h / 100) * .04})`,
                                            borderRadius: 2,
                                            ...(playing && filled ? { animation: `ahEq ${.4 + (i % 5) * .1}s ease-in-out infinite`, animationDelay: `${i * .018}s` } : {}),
                                        }} />
                                    );
                                })}
                            </div>
                            <div className="td-progress-thumb" style={{ left: `${progress}%` }} />
                        </div>

                        {/* Time row */}
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: -10 }}>
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>{formatTime(currentTime)}</span>
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>{formatTime(track.duration ?? 0)}</span>
                        </div>

                        {/* Controls */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <button className="td-icon-btn" style={{ opacity: .5, cursor: "default" }}><Shuffle size={13} /></button>
                            <button className="td-icon-btn" onClick={() => { if (audioRef.current) audioRef.current.currentTime = 0; setProgress(0); setCurrentTime(0); }}>
                                <SkipBack size={14} />
                            </button>

                            {/* Main play button */}
                            <button
                                onClick={togglePlay}
                                disabled={!track.audioUrl}
                                style={{
                                    width: 44, height: 44, borderRadius: "50%",
                                    background: track.audioUrl
                                        ? "linear-gradient(135deg,#16a34a,#4ade80)"
                                        : "rgba(255,255,255,.08)",
                                    border: "none", cursor: track.audioUrl ? "pointer" : "not-allowed",
                                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                                    boxShadow: track.audioUrl ? "0 4px 18px rgba(74,222,128,.3)" : "none",
                                    flexShrink: 0, transition: "transform .15s",
                                }}
                                onMouseEnter={e => { if (track.audioUrl) e.currentTarget.style.transform = "scale(1.08)"; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
                            >
                                {playing
                                    ? <Pause size={17} color="#0a1a0a" />
                                    : <Play size={17} color={track.audioUrl ? "#0a1a0a" : "rgba(255,255,255,.3)"} style={{ marginLeft: 2 }} />
                                }
                            </button>

                            <button className="td-icon-btn"><SkipForward size={14} /></button>
                            <button className="td-icon-btn" style={{ opacity: .5, cursor: "default" }}><Repeat size={13} /></button>

                            <div style={{ flex: 1 }} />

                            <button className="td-icon-btn" onClick={() => setMuted(m => !m)}>
                                {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                            </button>
                            <input
                                type="range" min={0} max={100} value={muted ? 0 : volume}
                                className="td-vol-slider"
                                style={{ "--val": `${muted ? 0 : volume}%` } as any}
                                onChange={e => { setVolume(+e.target.value); if (+e.target.value > 0) setMuted(false); }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Action bar ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22, animation: "ahFadeUp .4s both", flexWrap: "wrap" }}>
                <Link
                    to={`/admin/tracks/${id}/edit`}
                    className="td-pill-btn"
                    style={{ borderColor: "rgba(96,165,250,.25)", background: "rgba(96,165,250,.08)", color: "#60a5fa" }}
                >
                    <Edit2 size={13} /> Chỉnh sửa
                </Link>
                <button
                    className="td-pill-btn"
                    style={{ borderColor: "rgba(248,113,113,.25)", background: "rgba(248,113,113,.08)", color: "#f87171" }}
                    onClick={() => setDeleteModal(true)}
                >
                    <Trash2 size={13} /> Xoá bài hát
                </button>
                <div style={{ flex: 1 }} />
                <button className="td-icon-btn"><Share2 size={14} /></button>
                {track.audioUrl && (
                    <a href={track.audioUrl} target="_blank" rel="noopener noreferrer" className="td-icon-btn" style={{ textDecoration: "none" }}>
                        <ExternalLink size={14} />
                    </a>
                )}
            </div>

            {/* ── Tabs ── */}
            <div style={{ display: "flex", gap: 6, marginBottom: 18, animation: "ahFadeUp .45s both" }}>
                {(["info", "stats"] as const).map(tab => (
                    <button
                        key={tab}
                        className={`td-tab ${activeTab === tab ? "active" : ""}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {{ info: "Thông tin", stats: "Thống kê" }[tab]}
                    </button>
                ))}
            </div>

            {/* ════ Tab: Info ════ */}
            {activeTab === "info" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, animation: "ahFadeUp .3s both" }}>

                    {/* Details */}
                    <div className="td-card" style={{ padding: "20px 22px" }}>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,.28)", letterSpacing: "2px", textTransform: "uppercase", fontWeight: 700, marginBottom: 14 }}>
                            Chi tiết
                        </p>
                        {[
                            { icon: Music, label: "Tên bài hát", value: track.title },
                            { icon: Mic2, label: "Nghệ sĩ", value: artist?.name ?? "—" },
                            { icon: Tag, label: "Thể loại", value: track.genre ?? "—" },
                            { icon: Clock, label: "Thời lượng", value: formatTime(track.duration ?? 0) },
                            { icon: Calendar, label: "Năm phát hành", value: track.releaseYear ?? "—" },
                            { icon: CheckCircle2, label: "Trạng thái", value: track.isPublished ? "Đã xuất bản" : "Chưa xuất bản", color: track.isPublished ? "#4ade80" : "#f87171" },
                        ].map(({ icon: Icon, label, value, color }) => (
                            <div key={label} className="td-info-row">
                                <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(74,222,128,.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <Icon size={13} color="rgba(74,222,128,.65)" />
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <p style={{ fontSize: 11, color: "rgba(255,255,255,.28)", marginBottom: 2 }}>{label}</p>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: color ?? "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Stat cards */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {[
                            { label: "Tổng lượt nghe", value: formatNum(track.plays ?? 0), icon: Play, color: "#4ade80", bg: "rgba(74,222,128,.1)", sub: "Toàn thời gian" },
                            { label: "Lượt thích", value: formatNum(track.likes ?? 0), icon: Heart, color: "#f472b6", bg: "rgba(244,114,182,.1)", sub: "Toàn thời gian" },
                            { label: "Thời lượng", value: formatTime(track.duration ?? 0), icon: Clock, color: "#60a5fa", bg: "rgba(96,165,250,.1)", sub: "mm:ss" },
                            { label: "Năm phát hành", value: track.releaseYear ?? "—", icon: Calendar, color: "#fb923c", bg: "rgba(251,146,60,.1)", sub: "" },
                        ].map(({ label, value, icon: Icon, color, bg, sub }, i) => (
                            <div key={label} className="td-stat-mini" style={{ animationDelay: `${i * .06}s`, display: "flex", alignItems: "center", gap: 14 }}>
                                <div style={{ width: 42, height: 42, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <Icon size={18} color={color} />
                                </div>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <p style={{ fontSize: 11, color: "rgba(255,255,255,.3)", marginBottom: 3 }}>{label}</p>
                                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 26, color: "#fff", letterSpacing: 1, lineHeight: 1 }}>{value}</div>
                                </div>
                                {sub && <span style={{ fontSize: 10, color: "rgba(255,255,255,.18)", flexShrink: 0 }}>{sub}</span>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ════ Tab: Stats ════ */}
            {activeTab === "stats" && (
                <div style={{ animation: "ahFadeUp .3s both" }}>
                    <div className="td-card" style={{ padding: "20px 22px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22 }}>
                            <TrendingUp size={15} color="#4ade80" />
                            <p style={{ fontSize: 11, color: "rgba(255,255,255,.28)", letterSpacing: "2px", textTransform: "uppercase", fontWeight: 700 }}>
                                Lượt nghe 7 ngày gần nhất
                            </p>
                        </div>

                        {/* Bar chart */}
                        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 140 }}>
                            {weeklyPlays.map((val, i) => {
                                const days = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
                                const pct = (val / weeklyMax) * 100;
                                const isToday = i === weeklyPlays.length - 1;
                                return (
                                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, height: "100%" }}>
                                        <span style={{ fontSize: 10, color: "rgba(255,255,255,.3)", marginTop: "auto" }}>{formatNum(val)}</span>
                                        <div style={{
                                            width: "100%", borderRadius: "5px 5px 3px 3px",
                                            background: isToday
                                                ? "linear-gradient(180deg,#4ade80,#16a34a)"
                                                : "linear-gradient(180deg,rgba(74,222,128,.38),rgba(74,222,128,.12))",
                                            height: `${Math.max(pct, 3)}%`,
                                            transition: "height .5s cubic-bezier(.4,0,.2,1)",
                                            animation: `ahFadeUp .4s ${i * .05}s both`,
                                        }} />
                                        <span style={{ fontSize: 10, color: isToday ? "#4ade80" : "rgba(255,255,255,.28)", fontWeight: isToday ? 700 : 400 }}>
                                            {days[i]}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Summary */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 20, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,.05)" }}>
                            {[
                                { label: "Tổng tuần", value: formatNum(weeklyPlays.reduce((a, b) => a + b, 0)) },
                                { label: "Ngày cao nhất", value: formatNum(weeklyMax) },
                                { label: "Trung bình / ngày", value: formatNum(Math.round(weeklyPlays.reduce((a, b) => a + b, 0) / 7)) },
                            ].map(({ label, value }) => (
                                <div key={label} style={{ textAlign: "center", padding: "14px 10px", borderRadius: 12, background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.05)" }}>
                                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 28, color: "#4ade80", letterSpacing: 1, lineHeight: 1 }}>{value}</div>
                                    <p style={{ fontSize: 11, color: "rgba(255,255,255,.32)", marginTop: 5 }}>{label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete modal ── */}
            {deleteModal && (
                <div className="td-modal-overlay" onClick={() => setDeleteModal(false)}>
                    <div className="td-modal" onClick={e => e.stopPropagation()}>
                        <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(248,113,113,.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                            <Trash2 size={22} color="#f87171" />
                        </div>
                        <h3 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 24, color: "#fff", letterSpacing: 1, marginBottom: 8 }}>
                            Xoá bài hát?
                        </h3>
                        <p style={{ fontSize: 13, color: "rgba(255,255,255,.5)", marginBottom: 24, lineHeight: 1.6 }}>
                            Bạn có chắc muốn xoá <span style={{ color: "#fff", fontWeight: 600 }}>"{track.title}"</span>?
                            Hành động này không thể hoàn tác.
                        </p>
                        <div style={{ display: "flex", gap: 10 }}>
                            <button
                                onClick={() => setDeleteModal(false)}
                                disabled={deleting}
                                style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,.1)", background: "transparent", color: "rgba(255,255,255,.6)", fontSize: 13, fontWeight: 600, cursor: deleting ? "not-allowed" : "pointer", fontFamily: "'Be Vietnam Pro',sans-serif", opacity: deleting ? .5 : 1 }}
                            >
                                Huỷ
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#dc2626,#f87171)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Be Vietnam Pro',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: deleting ? .7 : 1 }}
                            >
                                {deleting
                                    ? <><Loader2 size={14} style={{ animation: "ahSpin .7s linear infinite" }} /> Đang xoá...</>
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