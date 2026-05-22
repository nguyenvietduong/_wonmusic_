// src/pages/admin/AdminArtistDetailPage.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
    ArrowLeft, Mic2, Edit2, Trash2, BadgeCheck,
    Users, Music, Clock, Play, TrendingUp,
    Facebook, Instagram, Youtube,
    Calendar, Hash, AlertCircle, Loader2,
    CheckCircle2, Star, ExternalLink,
} from "lucide-react";
import { artistService } from "@/services/artistService";
import { trackService }  from "@/services/trackService";
import { toast }         from "sonner";

// ─── helpers ────────────────────────────────────────────────────────────────
const formatNum = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
};
const formatTime = (sec: number) =>
    `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;

const EQ_H = [30, 60, 45, 75, 35, 68, 52, 82, 40, 58, 70, 42];

// ─── Component ───────────────────────────────────────────────────────────────
export default function AdminArtistDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [artist,      setArtist]      = useState<any>(null);
    const [tracks,      setTracks]      = useState<any[]>([]);
    const [loading,     setLoading]     = useState(true);
    const [loadingTracks, setLoadingTracks] = useState(true);
    const [error,       setError]       = useState<string | null>(null);
    const [deleteModal, setDeleteModal] = useState(false);
    const [deleting,    setDeleting]    = useState(false);

    // ── Load artist ──
    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                setLoading(true);
                const res = await artistService.getById(id);
                setArtist(res);
            } catch {
                setError("Không thể tải thông tin nghệ sĩ.");
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    // ── Load tracks of artist ──
    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                setLoadingTracks(true);
                const res = await trackService.getAll?.({ artistId: id, limit: 50 })
                         ?? await trackService.getTop?.(50);
                const all = Array.isArray(res) ? res : res?.data ?? [];
                // Filter by artistId if getAll doesn't support param
                setTracks(all.filter((t: any) =>
                    (t.artistId?._id ?? t.artistId) === id
                ));
            } catch {
                setTracks([]);
            } finally {
                setLoadingTracks(false);
            }
        })();
    }, [id]);

    // ── Delete ──
    const handleDelete = async () => {
        setDeleting(true);
        try {
            await artistService.delete(id!);
            toast.success("Đã xoá nghệ sĩ thành công.");
            navigate("/admin/artists");
        } catch {
            setDeleting(false);
            setDeleteModal(false);
            toast.error("Xoá nghệ sĩ thất bại. Vui lòng thử lại.");
        }
    };

    const totalPlays    = tracks.reduce((s, t) => s + (t.plays ?? 0), 0);
    const totalDuration = tracks.reduce((s, t) => s + (t.duration ?? 0), 0);

    // ── Loading ──
    if (loading) return (
        <div style={{ fontFamily: "'Be Vietnam Pro',sans-serif" }}>
            <style>{`@keyframes sk{0%,100%{opacity:.3}50%{opacity:.7}}`}</style>
            <div style={{ animation: "sk 1.5s ease-in-out infinite" }}>
                <div style={{ width: 130, height: 14, borderRadius: 6, background: "rgba(255,255,255,.07)", marginBottom: 32 }} />
                <div style={{ display: "flex", gap: 24, marginBottom: 28 }}>
                    <div style={{ width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,.06)", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ width: "40%", height: 42, borderRadius: 8, background: "rgba(255,255,255,.07)", marginBottom: 14 }} />
                        <div style={{ width: "25%", height: 12, borderRadius: 4, background: "rgba(255,255,255,.05)", marginBottom: 10 }} />
                        <div style={{ width: "60%", height: 12, borderRadius: 4, background: "rgba(255,255,255,.05)" }} />
                    </div>
                </div>
                {[1, 2, 3].map(i => (
                    <div key={i} style={{ height: 52, borderRadius: 12, background: "rgba(255,255,255,.04)", marginBottom: 10 }} />
                ))}
            </div>
        </div>
    );

    if (!artist) return (
        <div style={{ fontFamily: "'Be Vietnam Pro',sans-serif", padding: "60px 0", textAlign: "center" }}>
            <AlertCircle size={36} color="rgba(248,113,113,.5)" style={{ margin: "0 auto 12px", display: "block" }} />
            <p style={{ color: "rgba(255,255,255,.3)", fontSize: 14 }}>{error ?? "Không tìm thấy nghệ sĩ"}</p>
            <Link to="/admin/artists" style={{ color: "#4ade80", fontSize: 13, textDecoration: "none", marginTop: 10, display: "inline-block" }}>
                ← Quay lại
            </Link>
        </div>
    );

    const socials = artist.socialLinks ?? {};

    return (
        <div style={{ fontFamily: "'Be Vietnam Pro',sans-serif", maxWidth: 960, paddingBottom: 80 }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');

                @keyframes ahFadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
                @keyframes ahFadeIn  { from{opacity:0} to{opacity:1} }
                @keyframes ahEq      { 0%,100%{transform:scaleY(.2)} 50%{transform:scaleY(1)} }
                @keyframes ahPulse   { 0%,100%{opacity:.35} 50%{opacity:.75} }
                @keyframes ahSpin    { to{transform:rotate(360deg)} }
                @keyframes ahScale   { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
                @keyframes ahBar     { from{width:0} to{width:var(--w)} }
                @keyframes shimmer   { from{background-position:200% 0} to{background-position:-200% 0} }

                .ad-card {
                    border-radius:18px;
                    border:1px solid rgba(255,255,255,.07);
                    background:rgba(255,255,255,.025);
                }

                .ad-pill-btn {
                    display:inline-flex; align-items:center; gap:7px;
                    padding:8px 15px; border-radius:100px;
                    border:1px solid rgba(255,255,255,.09);
                    background:rgba(255,255,255,.03);
                    color:rgba(255,255,255,.5); font-size:13px; font-weight:500;
                    text-decoration:none; cursor:pointer;
                    font-family:'Be Vietnam Pro',sans-serif; transition:all .18s;
                }
                .ad-pill-btn:hover { background:rgba(255,255,255,.07); color:#fff; border-color:rgba(255,255,255,.15); }

                .ad-edit-btn {
                    display:inline-flex; align-items:center; gap:7px;
                    padding:10px 20px; border-radius:11px;
                    background:linear-gradient(135deg,#16a34a,#4ade80);
                    color:#071207; font-size:13px; font-weight:700;
                    text-decoration:none; cursor:pointer; border:none;
                    font-family:'Be Vietnam Pro',sans-serif; transition:all .18s;
                    box-shadow:0 4px 16px rgba(74,222,128,.25);
                }
                .ad-edit-btn:hover { transform:translateY(-1px); filter:brightness(1.07); }

                .ad-del-btn {
                    display:inline-flex; align-items:center; gap:7px;
                    padding:10px 18px; border-radius:11px;
                    background:rgba(248,113,113,.08);
                    border:1px solid rgba(248,113,113,.18);
                    color:#f87171; font-size:13px; font-weight:600;
                    cursor:pointer; font-family:'Be Vietnam Pro',sans-serif; transition:all .18s;
                }
                .ad-del-btn:hover { background:rgba(248,113,113,.15); border-color:rgba(248,113,113,.3); }

                .ad-stat-card {
                    padding:16px 18px; border-radius:14px;
                    border:1px solid rgba(255,255,255,.06);
                    background:rgba(255,255,255,.02);
                    transition:all .2s;
                }
                .ad-stat-card:hover {
                    background:rgba(255,255,255,.045);
                    border-color:rgba(74,222,128,.15);
                    transform:translateY(-2px);
                }

                .ad-social-chip {
                    display:inline-flex; align-items:center; gap:7px;
                    padding:8px 14px; border-radius:10px;
                    font-size:12px; font-weight:600; text-decoration:none;
                    transition:all .18s; cursor:pointer;
                }
                .ad-social-chip:hover { transform:translateY(-1px); filter:brightness(1.15); }

                .ad-track-row {
                    display:flex; align-items:center; gap:12px;
                    padding:10px 16px; border-radius:12px;
                    transition:background .14s; cursor:default;
                    animation:ahFadeUp .25s both;
                }
                .ad-track-row:hover { background:rgba(74,222,128,.04); }

                .ad-stitle {
                    font-size:11px; color:rgba(255,255,255,.28);
                    letter-spacing:2px; text-transform:uppercase; font-weight:700;
                    margin-bottom:16px; display:flex; align-items:center; gap:8px;
                }
                .ad-stitle::after { content:''; flex:1; height:1px; background:rgba(255,255,255,.05); }

                .ad-info-row {
                    display:flex; align-items:center; gap:10px;
                    padding:9px 0; border-bottom:1px solid rgba(255,255,255,.04);
                }
                .ad-info-row:last-child { border-bottom:none; }

                .ad-modal-overlay {
                    position:fixed; inset:0; z-index:999;
                    background:rgba(0,0,0,.72); display:flex;
                    align-items:center; justify-content:center;
                    backdrop-filter:blur(4px); animation:ahFadeIn .15s ease;
                }
                .ad-modal {
                    background:#141a14; border:1px solid rgba(255,255,255,.1);
                    border-radius:20px; padding:28px;
                    max-width:400px; width:90%; animation:ahScale .18s ease;
                }
            `}</style>

            {/* ── Breadcrumb ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, animation: "ahFadeUp .3s both", flexWrap: "wrap" }}>
                <Link to="/admin/artists" className="ad-pill-btn"><ArrowLeft size={13} /> Nghệ sĩ</Link>
                <span style={{ color: "rgba(255,255,255,.18)", fontSize: 12 }}>/</span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,.4)", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {artist.name}
                </span>
            </div>

            {/* ══════════════════════════════════════════════
                  HERO — Avatar + Name + Meta
              ══════════════════════════════════════════════ */}
            <div className="ad-card" style={{ padding: "28px 32px", marginBottom: 20, animation: "ahFadeUp .35s both", position: "relative", overflow: "hidden" }}>

                {/* BG blur glow from avatar color */}
                <div style={{ position: "absolute", top: -60, left: -60, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(74,222,128,.08) 0%, transparent 70%)", pointerEvents: "none" }} />

                <div style={{ display: "flex", alignItems: "flex-start", gap: 28, flexWrap: "wrap", position: "relative" }}>

                    {/* Avatar */}
                    <div style={{ position: "relative", flexShrink: 0 }}>
                        <div style={{
                            width: 120, height: 120, borderRadius: "50%", overflow: "hidden",
                            background: "linear-gradient(135deg,#052e16,#14532d)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            border: artist.verified ? "3px solid rgba(74,222,128,.5)" : "3px solid rgba(255,255,255,.08)",
                            boxShadow: artist.verified ? "0 0 28px rgba(74,222,128,.2)" : "none",
                        }}>
                            {artist.avatar
                                ? <img src={artist.avatar} alt={artist.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                : <Mic2 size={40} color="rgba(74,222,128,.3)" />
                            }
                        </div>
                        {artist.verified && (
                            <div style={{ position: "absolute", bottom: 4, right: 4, width: 26, height: 26, borderRadius: "50%", background: "#4ade80", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #0a1a0a" }}>
                                <CheckCircle2 size={14} color="#071207" />
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                            {artist.verified && (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 100, background: "rgba(74,222,128,.1)", border: "1px solid rgba(74,222,128,.25)", fontSize: 11, fontWeight: 700, color: "#4ade80", letterSpacing: ".5px" }}>
                                    <BadgeCheck size={11} /> XÁC MINH
                                </span>
                            )}
                            {artist.genre && (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 100, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.09)", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.45)" }}>
                                    {artist.genre}
                                </span>
                            )}
                        </div>

                        <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 44, color: "#fff", letterSpacing: 2, lineHeight: 1, marginBottom: 10, wordBreak: "break-word" }}>
                            {artist.name}
                        </h1>

                        {artist.bio && (
                            <p style={{ fontSize: 13, color: "rgba(255,255,255,.45)", lineHeight: 1.65, maxWidth: 560, marginBottom: 14 }}>
                                {artist.bio}
                            </p>
                        )}

                        {/* Social chips */}
                        {(socials.facebook || socials.instagram || socials.youtube || socials.tiktok) && (
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {socials.facebook  && (
                                    <a href={socials.facebook} target="_blank" rel="noreferrer" className="ad-social-chip" style={{ background: "rgba(96,165,250,.1)", border: "1px solid rgba(96,165,250,.2)", color: "#60a5fa" }}>
                                        <Facebook size={13} /> Facebook <ExternalLink size={10} style={{ opacity: .5 }} />
                                    </a>
                                )}
                                {socials.instagram && (
                                    <a href={socials.instagram} target="_blank" rel="noreferrer" className="ad-social-chip" style={{ background: "rgba(244,114,182,.1)", border: "1px solid rgba(244,114,182,.2)", color: "#f472b6" }}>
                                        <Instagram size={13} /> Instagram <ExternalLink size={10} style={{ opacity: .5 }} />
                                    </a>
                                )}
                                {socials.youtube   && (
                                    <a href={socials.youtube} target="_blank" rel="noreferrer" className="ad-social-chip" style={{ background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.2)", color: "#f87171" }}>
                                        <Youtube size={13} /> YouTube <ExternalLink size={10} style={{ opacity: .5 }} />
                                    </a>
                                )}
                                {socials.tiktok    && (
                                    <a href={socials.tiktok} target="_blank" rel="noreferrer" className="ad-social-chip" style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.6)" }}>
                                        <Music size={13} /> TikTok <ExternalLink size={10} style={{ opacity: .5 }} />
                                    </a>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: 10, flexShrink: 0, flexWrap: "wrap" }}>
                        <Link to={`/admin/artists/${id}/edit`} className="ad-edit-btn">
                            <Edit2 size={14} /> Chỉnh sửa
                        </Link>
                        <button className="ad-del-btn" onClick={() => setDeleteModal(true)}>
                            <Trash2 size={14} /> Xoá
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Stat cards row ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 20, animation: "ahFadeUp .4s both" }}>
                {[
                    { label: "Followers",    value: formatNum(artist.followers ?? 0), icon: Users,      color: "#4ade80", bg: "rgba(74,222,128,.1)"  },
                    { label: "Bài hát",      value: loadingTracks ? "—" : tracks.length, icon: Music,  color: "#60a5fa", bg: "rgba(96,165,250,.1)"  },
                    { label: "Tổng nghe",    value: loadingTracks ? "—" : formatNum(totalPlays), icon: TrendingUp, color: "#f472b6", bg: "rgba(244,114,182,.1)" },
                    { label: "Tổng thời lượng", value: loadingTracks ? "—" : formatTime(totalDuration), icon: Clock, color: "#fb923c", bg: "rgba(251,146,60,.1)" },
                ].map(({ label, value, icon: Icon, color, bg }, i) => (
                    <div key={label} className="ad-stat-card" style={{ animationDelay: `${i * .06}s` }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                            <Icon size={16} color={color} />
                        </div>
                        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 28, color: "#fff", letterSpacing: 1, lineHeight: 1, marginBottom: 3 }}>
                            {value}
                        </div>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,.35)", fontWeight: 500 }}>{label}</p>
                    </div>
                ))}
            </div>

            {/* ── Bottom grid: info + tracks ── */}
            <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 16, animation: "ahFadeUp .45s both" }}>

                {/* ── System info card ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div className="ad-card" style={{ padding: "20px 22px" }}>
                        <p className="ad-stitle">Thông tin hệ thống</p>
                        {[
                            { label: "Artist ID",  value: id,                                                                               icon: Hash     },
                            { label: "Ngày tạo",   value: artist.createdAt ? new Date(artist.createdAt).toLocaleDateString("vi-VN") : "—", icon: Calendar },
                            { label: "Cập nhật",   value: artist.updatedAt ? new Date(artist.updatedAt).toLocaleDateString("vi-VN") : "—", icon: Calendar },
                            { label: "Followers",  value: formatNum(artist.followers ?? 0),                                                icon: Users    },
                            { label: "Trạng thái", value: artist.verified ? "Xác minh ✓" : "Thường",                                     icon: artist.verified ? BadgeCheck : Star },
                        ].map(({ label, value, icon: Icon }) => (
                            <div key={label} className="ad-info-row">
                                <Icon size={12} color="rgba(74,222,128,.4)" style={{ flexShrink: 0 }} />
                                <span style={{ fontSize: 12, color: "rgba(255,255,255,.3)", width: 86, flexShrink: 0 }}>{label}</span>
                                <span style={{ fontSize: 12, color: "rgba(255,255,255,.65)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {value}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* EQ decoration */}
                    <div className="ad-card" style={{ padding: "18px 20px" }}>
                        <p className="ad-stitle">Visualizer</p>
                        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 48 }}>
                            {EQ_H.map((h, i) => (
                                <div key={i} style={{
                                    flex: 1, height: `${h}%`,
                                    background: `linear-gradient(to top, #16a34a, rgba(74,222,128,${.3 + h / 100 * .5}))`,
                                    borderRadius: "3px 3px 2px 2px",
                                    transformOrigin: "bottom",
                                    animation: `ahEq ${.4 + (i % 5) * .12}s ease-in-out infinite`,
                                    animationDelay: `${i * .06}s`,
                                }} />
                            ))}
                        </div>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,.2)", marginTop: 10, textAlign: "center" }}>
                            {tracks.length} bài · {formatTime(totalDuration)} tổng
                        </p>
                    </div>
                </div>

                {/* ── Tracks list ── */}
                <div className="ad-card" style={{ padding: "20px 22px" }}>
                    <p className="ad-stitle">Danh sách bài hát</p>

                    {loadingTracks ? (
                        <div style={{ animation: "ahPulse 1.5s ease-in-out infinite" }}>
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
                                    <div style={{ width: 38, height: 38, borderRadius: 8, background: "rgba(255,255,255,.07)", flexShrink: 0 }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ height: 12, borderRadius: 4, background: "rgba(255,255,255,.07)", width: "50%", marginBottom: 7 }} />
                                        <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,.05)", width: "70%" }} />
                                    </div>
                                    <div style={{ width: 40, height: 11, borderRadius: 3, background: "rgba(255,255,255,.05)" }} />
                                </div>
                            ))}
                        </div>
                    ) : tracks.length === 0 ? (
                        <div style={{ padding: "40px 0", textAlign: "center" }}>
                            <Music size={36} color="rgba(255,255,255,.1)" style={{ margin: "0 auto 12px", display: "block" }} />
                            <p style={{ fontSize: 13, color: "rgba(255,255,255,.28)" }}>Chưa có bài hát nào</p>
                        </div>
                    ) : (
                        <div>
                            {tracks.map((track, idx) => {
                                const maxPlays = tracks[0]?.plays || 1;
                                const pct = Math.round((track.plays / maxPlays) * 100);
                                return (
                                    <div
                                        key={track._id}
                                        className="ad-track-row"
                                        style={{ animationDelay: `${idx * .04}s`, borderBottom: idx < tracks.length - 1 ? "1px solid rgba(255,255,255,.04)" : "none", borderRadius: 0 }}
                                    >
                                        {/* Rank */}
                                        <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, color: "rgba(74,222,128,.25)", width: 24, textAlign: "right", flexShrink: 0 }}>
                                            {String(idx + 1).padStart(2, "0")}
                                        </span>

                                        {/* Cover */}
                                        <div style={{ width: 38, height: 38, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "linear-gradient(135deg,#052e16,#14532d)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            {track.coverUrl
                                                ? <img src={track.coverUrl} alt={track.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                : <Music size={14} color="rgba(74,222,128,.3)" />
                                            }
                                        </div>

                                        {/* Title + bar */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <Link to={`/admin/tracks/${track._id}`} style={{ textDecoration: "none" }}>
                                                <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {track.title}
                                                </p>
                                            </Link>
                                            <div style={{ height: 3, background: "rgba(255,255,255,.07)", borderRadius: 2, overflow: "hidden" }}>
                                                <div style={{
                                                    height: "100%",
                                                    background: "linear-gradient(90deg,#16a34a,#4ade80)",
                                                    borderRadius: 2,
                                                    width: `${pct}%`,
                                                    animation: "ahBar .6s cubic-bezier(.4,0,.2,1) both",
                                                    ["--w" as any]: `${pct}%`,
                                                }} />
                                            </div>
                                        </div>

                                        {/* Plays */}
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                                            <Play size={10} color="rgba(74,222,128,.5)" />
                                            <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,.5)" }}>
                                                {formatNum(track.plays ?? 0)}
                                            </span>
                                        </span>

                                        {/* Duration */}
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                                            <Clock size={10} color="rgba(255,255,255,.2)" />
                                            <span style={{ fontSize: 12, color: "rgba(255,255,255,.35)" }}>
                                                {formatTime(track.duration ?? 0)}
                                            </span>
                                        </span>

                                        {/* Edit link */}
                                        <Link
                                            to={`/admin/tracks/${track._id}/edit`}
                                            style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 7, background: "rgba(34,197,94,.08)", border: "none", color: "#22c55e", fontSize: 11, fontWeight: 600, textDecoration: "none", flexShrink: 0, transition: "background .14s" }}
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
            </div>

            {/* ── Delete modal ── */}
            {deleteModal && (
                <div className="ad-modal-overlay" onClick={() => !deleting && setDeleteModal(false)}>
                    <div className="ad-modal" onClick={e => e.stopPropagation()}>
                        <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(248,113,113,.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                            <Trash2 size={22} color="#f87171" />
                        </div>
                        <h3 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 24, color: "#fff", letterSpacing: 1, marginBottom: 8 }}>
                            Xoá nghệ sĩ?
                        </h3>
                        <p style={{ fontSize: 13, color: "rgba(255,255,255,.5)", marginBottom: 6, lineHeight: 1.6 }}>
                            Bạn có chắc muốn xoá <span style={{ color: "#fff", fontWeight: 600 }}>"{artist.name}"</span>?
                        </p>
                        <p style={{ fontSize: 12, color: "rgba(248,113,113,.6)", marginBottom: 24, lineHeight: 1.6 }}>
                            ⚠ Hành động này không thể hoàn tác. Các bài hát liên quan sẽ mất thông tin nghệ sĩ.
                        </p>
                        <div style={{ display: "flex", gap: 10 }}>
                            <button
                                onClick={() => setDeleteModal(false)}
                                disabled={deleting}
                                style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,.1)", background: "transparent", color: "rgba(255,255,255,.6)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Be Vietnam Pro',sans-serif", opacity: deleting ? .5 : 1 }}
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