// src/pages/ArtistDetailPage.tsx
import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { artistService, type Artist, type Track } from "@/services/artistService";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { FaFacebookF, FaInstagram, FaYoutube, FaTiktok } from "react-icons/fa";
import SEO from "@/components/frontend/SEO";

const NOTES = ["♩", "♪", "♫", "♬", "𝄞", "𝄢", "♭", "♮", "♯"];

const formatFollowers = (num?: number) => {
    if (!num) return "0";
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
};
const formatTime = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
const formatPlays = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
};
const getInitials = (name: string) =>
    name.split(" ").slice(-2).map(w => w[0]).join("").toUpperCase();

const ArtistDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const [artist, setArtist] = useState<Artist | null>(null);
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"tracks" | "about">("tracks");
    const [hoveredTrack, setHoveredTrack] = useState<string | null>(null);
    const heroBgRef = useRef<HTMLDivElement>(null);
    const bodyBgRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const { play, togglePlay, currentTrack, isPlaying } = usePlayerStore();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);
    
    // ── Floating notes (hero) ──
    useEffect(() => {
        const spawn = (container: HTMLDivElement | null, colorA: string, colorB: string) => {
            if (!container) return;
            const el = document.createElement("div");
            el.textContent = NOTES[Math.floor(Math.random() * NOTES.length)];
            const dur = 6 + Math.random() * 8;
            const size = 13 + Math.random() * 18;
            el.style.cssText = `
                position:absolute;
                left:${Math.random() * 100}%;
                bottom:-30px;
                font-size:${size}px;
                color:${Math.random() > .5 ? colorA : colorB};
                pointer-events:none; user-select:none;
                animation: noteRise ${dur}s linear forwards;
                z-index:1;
            `;
            container.appendChild(el);
            setTimeout(() => el.remove(), dur * 1000);
        };

        const id1 = setInterval(() => spawn(heroBgRef.current, "rgba(74,222,128,0.6)", "rgba(255,255,255,0.4)"), 600);
        const id2 = setInterval(() => spawn(bodyBgRef.current, "rgba(22,163,74,0.25)", "rgba(74,222,128,0.18)"), 900);
        spawn(heroBgRef.current, "rgba(74,222,128,0.6)", "rgba(255,255,255,0.4)");
        spawn(bodyBgRef.current, "rgba(22,163,74,0.25)", "rgba(74,222,128,0.18)");
        return () => { clearInterval(id1); clearInterval(id2); };
    }, []);

    // ── Canvas waveform ──
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        let frame = 0;
        let raf: number;
        const draw = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const bars = 80;
            const barW = canvas.width / bars;
            for (let i = 0; i < bars; i++) {
                const h = (Math.sin(i * 0.2 + frame * 0.05) * 0.4 + Math.sin(i * 0.5 + frame * 0.03) * 0.3 + 0.3) * canvas.height * 0.8;
                const alpha = 0.3 + Math.sin(i * 0.3 + frame * 0.04) * 0.2;
                ctx.fillStyle = `rgba(74,222,128,${alpha})`;
                ctx.beginPath();
                ctx.roundRect(i * barW + 1, canvas.height - h, barW - 2, h, 2);
                ctx.fill();
            }
            frame++;
            raf = requestAnimationFrame(draw);
        };
        draw();
        return () => cancelAnimationFrame(raf);
    }, []);

    // ── Fetch ──
    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                setLoading(true);
                const [a, t] = await Promise.all([
                    artistService.getById(id),
                    artistService.getTracks(id, { limit: 20 }),
                ]);
                setArtist(a);
                setTracks(t.data);
            } finally { setLoading(false); }
        })();
    }, [id]);

    const handlePlay = (track: Track) => {
        if (currentTrack?.id === track._id) { togglePlay(); return; }
        play(
            { id: track._id, title: track.title, artist: artist?.name ?? "", album: track.albumId?.title, audioUrl: track.audioUrl, coverUrl: track.coverUrl, duration: track.duration },
            tracks.map(t => ({ id: t._id, title: t.title, artist: artist?.name ?? "", audioUrl: t.audioUrl, coverUrl: t.coverUrl, duration: t.duration }))
        );
    };

    // ── Loading ──
    if (loading) return (
        <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Be Vietnam Pro',sans-serif" }}>
            <style>{`@keyframes apPulse{0%,100%{opacity:.4}50%{opacity:1}}`}</style>
            <div style={{ height: 420, background: "linear-gradient(135deg,#0a3d1f,#16a34a)", animation: "apPulse 1.5s ease-in-out infinite" }} />
            <div style={{ maxWidth: 1200, margin: "0 auto", padding: 48 }}>
                {[300, 200, 160].map((w, i) => (
                    <div key={i} style={{ height: i === 0 ? 40 : 16, width: w, background: "#f0fdf4", borderRadius: 8, marginBottom: 16, animation: "apPulse 1.5s ease-in-out infinite" }} />
                ))}
            </div>
        </div>
    );

    if (!artist) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Be Vietnam Pro',sans-serif" }}>
            <div style={{ textAlign: "center", color: "#9ca3af" }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>♪</div>
                <p>Không tìm thấy nghệ sĩ</p>
                <Link to="/artists" style={{ color: "#16a34a", marginTop: 12, display: "inline-block" }}>← Quay lại</Link>
            </div>
        </div>
    );

    return (
        <>
        <SEO
            title={`${artist.name} – Won Music`}
            description={artist.bio
                ? artist.bio.slice(0, 160)
                : `Nghe nhạc ${artist.name} trên Won Music.${artist.genre ? ` Thể loại: ${artist.genre}.` : ""} ${formatFollowers(artist.followers)} người theo dõi.`
            }
            canonical={`https://www.wonmusic.vn/artists/${id}`}
            image={artist.avatar}
            imageAlt={artist.name}
            type="artist"
            name={artist.name}
            genre={artist.genre}
        />
        <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Be Vietnam Pro',sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');

                @keyframes noteRise {
                    0%   { transform:translateY(0) rotate(0deg) scale(0.8); opacity:0; }
                    8%   { opacity:1; }
                    92%  { opacity:0.7; }
                    100% { transform:translateY(-500px) rotate(35deg) scale(1.1); opacity:0; }
                }
                @keyframes eqBar {
                    0%,100% { transform:scaleY(.25); }
                    50%     { transform:scaleY(1); }
                }
                @keyframes fadeUp {
                    from { opacity:0; transform:translateY(18px); }
                    to   { opacity:1; transform:translateY(0); }
                }
                @keyframes dotPulse {
                    0%,100% { opacity:1; transform:scale(1); }
                    50%     { opacity:.3; transform:scale(.55); }
                }
                @keyframes shimmerSlide {
                    0%   { background-position:-200% center; }
                    100% { background-position: 200% center; }
                }
                @keyframes ringRotate { to { transform:rotate(360deg); } }
                @keyframes glowPulse {
                    0%,100% { box-shadow:0 0 24px rgba(74,222,128,0.3); }
                    50%     { box-shadow:0 0 48px rgba(74,222,128,0.6); }
                }
                @keyframes slideIn {
                    from { opacity:0; transform:translateX(-12px); }
                    to   { opacity:1; transform:translateX(0); }
                }

                .adp-track-row {
                    display:flex; align-items:center; gap:16px;
                    padding:12px 16px; border-radius:14px;
                    transition:all .2s; cursor:pointer;
                    border:1px solid transparent;
                    animation:fadeUp .35s both;
                    position:relative; overflow:hidden;
                }
                .adp-track-row::before {
                    content:''; position:absolute; left:0; top:0; bottom:0;
                    width:3px; background:linear-gradient(to bottom,#4ade80,#16a34a);
                    transform:scaleY(0); transition:transform .2s; border-radius:0 2px 2px 0;
                }
                .adp-track-row:hover { background:#f0fdf4; border-color:rgba(22,163,74,.15); }
                .adp-track-row:hover::before { transform:scaleY(1); }
                .adp-track-row.playing { background:#f0fdf4; border-color:rgba(22,163,74,.3); }
                .adp-track-row.playing::before { transform:scaleY(1); }

                .adp-tab {
                    padding:10px 24px; border-radius:100px;
                    border:1.5px solid #e5e7eb;
                    background:transparent; color:#6b7280;
                    font-size:14px; font-weight:500; cursor:pointer;
                    transition:all .2s; font-family:'Be Vietnam Pro',sans-serif;
                }
                .adp-tab:hover { border-color:#16a34a; color:#16a34a; }
                .adp-tab.active {
                    background:#16a34a; border-color:#16a34a; color:#fff;
                    box-shadow:0 4px 16px rgba(22,163,74,.35);
                }

                .adp-social-btn-light {
                    display:inline-flex; align-items:center; gap:8px;
                    padding:8px 18px; border-radius:100px;
                    border:1px solid #e5e7eb; background:#fff;
                    color:#374151; font-size:13px; text-decoration:none;
                    transition:all .2s; font-family:'Be Vietnam Pro',sans-serif;
                }
                .adp-social-btn-light:hover {
                    border-color:#16a34a; color:#16a34a; background:#f0fdf4;
                }

                .adp-play-all {
                    display:flex; align-items:center; gap:10px;
                    padding:14px 32px; border-radius:100px;
                    background:linear-gradient(135deg,#16a34a,#22c55e);
                    border:none; color:#fff;
                    font-size:14px; font-weight:600; cursor:pointer;
                    box-shadow:0 8px 28px rgba(22,163,74,.4);
                    transition:all .25s; font-family:'Be Vietnam Pro',sans-serif;
                    animation:glowPulse 3s ease-in-out infinite;
                }
                .adp-play-all:hover { transform:translateY(-2px) scale(1.03); box-shadow:0 12px 36px rgba(22,163,74,.5); }
                .adp-play-all:active { transform:scale(.98); }

                .adp-social-btn {
                    width: 36px; height: 36px;
                    border-radius: 50%;
                    border: 1px solid rgba(255,255,255,0.25);
                    background: rgba(255,255,255,0.1);
                    color: #fff;
                    display: flex; align-items: center; justify-content: center;
                    text-decoration: none;
                    transition: all .2s;
                    backdrop-filter: blur(8px);
                }
                .adp-social-btn:hover {
                    background: rgba(74,222,128,0.25);
                    border-color: rgba(74,222,128,0.6);
                    color: #4ade80;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(74,222,128,0.2);
                }
            `}</style>

            {/* ══════════ HERO ══════════ */}
            <div style={{
                height: 480, position: "relative", overflow: "hidden",
                backgroundImage: artist.avatar ? `url(${artist.avatar})` : "linear-gradient(135deg,#052e16,#16a34a)",
                backgroundSize: "cover", backgroundPosition: "center top",
            }}>
                {/* Dark overlay gradient */}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.65) 55%, rgba(0,0,0,0.92) 100%)" }} />

                {/* Floating notes */}
                <div ref={heroBgRef} style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 1 }} />

                {/* Canvas waveform */}
                <canvas ref={canvasRef} style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 100, width: "100%", opacity: 0.35, pointerEvents: "none", zIndex: 1 }} />

                {/* Rotating ring behind avatar */}
                <div style={{
                    position: "absolute", bottom: 32, left: 48,
                    width: 136, height: 136,
                    border: "1.5px dashed rgba(74,222,128,0.35)",
                    borderRadius: "50%", zIndex: 2,
                    animation: "ringRotate 12s linear infinite",
                }} />
                <div style={{
                    position: "absolute", bottom: 40, left: 56,
                    width: 120, height: 120,
                    border: "1px dashed rgba(74,222,128,0.2)",
                    borderRadius: "50%", zIndex: 2,
                    animation: "ringRotate 8s linear infinite reverse",
                }} />

                {/* Back */}
                <div style={{ position: "absolute", top: 80, left: 48, zIndex: 4 }}>
                    <Link to="/artists" style={{
                        display: "inline-flex", alignItems: "center", gap: 8,
                        color: "rgba(255,255,255,0.75)", textDecoration: "none",
                        fontSize: 13, fontWeight: 500, letterSpacing: 0.5,
                        background: "rgba(0,0,0,0.25)", backdropFilter: "blur(8px)",
                        padding: "8px 16px", borderRadius: 100,
                        border: "1px solid rgba(255,255,255,0.15)",
                        transition: "all .2s",
                    }}>
                        ← Nghệ sĩ
                    </Link>
                </div>

                {/* Artist info bottom */}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 48px 36px", zIndex: 4 }}>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 28, flexWrap: "wrap" }}>

                        {/* Avatar */}
                        <div style={{ position: "relative", flexShrink: 0 }}>
                            <div style={{
                                width: 120, height: 120, borderRadius: "50%",
                                border: "4px solid rgba(255,255,255,0.9)",
                                overflow: "hidden",
                                background: "linear-gradient(135deg,#bbf7d0,#4ade80)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontFamily: "'Barlow Condensed',sans-serif", fontSize: 40, color: "#166534",
                                boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 0 4px rgba(74,222,128,0.2)",
                                position: "relative", zIndex: 3,
                            }}>
                                {artist.avatar
                                    ? <img src={artist.avatar} alt={artist.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    : getInitials(artist.name)
                                }
                            </div>
                            {artist.verified && (
                                <div style={{
                                    position: "absolute", bottom: 4, right: 4, zIndex: 5,
                                    width: 30, height: 30, borderRadius: "50%",
                                    background: "linear-gradient(135deg,#16a34a,#4ade80)",
                                    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 13, fontWeight: 700,
                                    border: "3px solid #fff",
                                    boxShadow: "0 2px 12px rgba(22,163,74,0.6)",
                                }}>✓</div>
                            )}
                        </div>

                        {/* Name */}
                        <div style={{ flex: 1, minWidth: 0, animation: "slideIn .5s both" }}>
                            {artist.verified && (
                                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
                                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block", animation: "dotPulse 1.5s ease-in-out infinite" }} />
                                    <span style={{ fontSize: 11, color: "#4ade80", letterSpacing: "2.5px", textTransform: "uppercase", fontWeight: 600 }}>
                                        Nghệ sĩ
                                    </span>
                                </div>
                            )}
                            <h1 style={{
                                fontFamily: "'Poppins', 'Montserrat', 'Be Vietnam Pro', sans-serif",
                                fontWeight: 700,
                                fontSize: "clamp(44px,7vw,80px)",
                                color: "#fff", 
                                lineHeight: 0.92,
                                letterSpacing: 1.5, 
                                marginBottom: 10,
                                textShadow: "0 4px 24px rgba(0,0,0,0.3)",
                            }}>
                                {artist.name}
                            </h1>
                            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", marginBottom: 18, fontWeight: 500 }}>
                                {artist.genre}
                            </p>

                            {/* Stats */}
                            <div style={{ display: "flex", gap: 28 }}>
                                {[
                                    { label: "Followers", value: formatFollowers(artist.followers) },
                                    { label: "Bài hát", value: tracks.length },
                                ].map(({ label, value }) => (
                                    <div key={label} style={{ animation: "fadeUp .5s both" }}>
                                        <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: -1 }}>{value}</div>
                                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 1.5 }}>{label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-end", animation: "fadeUp .6s both" }}>
                            <button className="adp-play-all" onClick={() => tracks.length && handlePlay(tracks[0])}>
                                <span style={{ fontSize: 16 }}>▶</span> Phát tất cả
                            </button>

                            <div style={{ display: "flex", gap: 8 }}>
                                {artist.socialLinks?.facebook && (
                                    <a href={artist.socialLinks.facebook} target="_blank" rel="noreferrer" className="adp-social-btn" title="Facebook">
                                        <FaFacebookF size={14} />
                                    </a>
                                )}
                                {artist.socialLinks?.instagram && (
                                    <a href={artist.socialLinks.instagram} target="_blank" rel="noreferrer" className="adp-social-btn" title="Instagram">
                                        <FaInstagram size={14} />
                                    </a>
                                )}
                                {artist.socialLinks?.youtube && (
                                    <a href={artist.socialLinks.youtube} target="_blank" rel="noreferrer" className="adp-social-btn" title="YouTube">
                                        <FaYoutube size={14} />
                                    </a>
                                )}
                                {artist.socialLinks?.tiktok && (
                                    <a href={artist.socialLinks.tiktok} target="_blank" rel="noreferrer" className="adp-social-btn" title="TikTok">
                                        <FaTiktok size={14} />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════════ BODY ══════════ */}
            <div style={{ position: "relative", overflow: "hidden" }}>
                {/* Background floating notes */}
                <div ref={bodyBgRef} style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }} />

                <div style={{ maxWidth: 1200, margin: "0 auto", padding: "44px 48px 80px", position: "relative", zIndex: 1 }}>

                    {/* Tabs */}
                    <div style={{ display: "flex", gap: 10, marginBottom: 40 }}>
                        <button className={`adp-tab ${activeTab === "tracks" ? "active" : ""}`} onClick={() => setActiveTab("tracks")}>
                            ♪ Bài hát ({tracks.length})
                        </button>
                        <button className={`adp-tab ${activeTab === "about" ? "active" : ""}`} onClick={() => setActiveTab("about")}>
                            Giới thiệu
                        </button>
                    </div>

                    {/* ── TRACKS ── */}
                    {activeTab === "tracks" && (
                        tracks.length === 0
                            ? (
                                <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
                                    <div style={{ fontSize: 56, marginBottom: 12 }}>♪</div>
                                    <p>Chưa có bài hát nào</p>
                                </div>
                            )
                            : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                    {/* Header */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "0 16px 14px", borderBottom: "1px solid #f3f4f6", marginBottom: 6 }}>
                                        <div style={{ width: 36 }} />
                                        <div style={{ width: 48 }} />
                                        <div style={{ flex: 1, fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600 }}>Tên bài</div>
                                        <div style={{ width: 80, fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600, textAlign: "right" }}>Plays</div>
                                        <div style={{ width: 50, fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600, textAlign: "right" }}>TG</div>
                                    </div>

                                    {tracks.map((track, idx) => {
                                        const isThis = currentTrack?.id === track._id;
                                        const isThisPlaying = isThis && isPlaying;
                                        return (
                                            <div
                                                key={track._id}
                                                className={`adp-track-row ${isThisPlaying ? "playing" : ""}`}
                                                style={{ animationDelay: `${idx * .04}s` }}
                                                onMouseEnter={() => setHoveredTrack(track._id)}
                                                onMouseLeave={() => setHoveredTrack(null)}
                                                onClick={() => handlePlay(track)}
                                            >
                                                {/* Rank / EQ */}
                                                <div style={{ width: 36, textAlign: "center", flexShrink: 0 }}>
                                                    {isThisPlaying ? (
                                                        <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 18, justifyContent: "center" }}>
                                                            {[40, 70, 55, 90, 45, 75].map((h, i) => (
                                                                <div key={i} style={{
                                                                    width: 3, height: `${h}%`, background: "#16a34a",
                                                                    borderRadius: 2, transformOrigin: "bottom",
                                                                    animation: `eqBar ${0.38 + i * .1}s ease-in-out infinite`,
                                                                    animationDelay: `${i * .06}s`,
                                                                }} />
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontSize: 13, color: hoveredTrack === track._id ? "#16a34a" : "#9ca3af", fontWeight: 500 }}>
                                                            {String(idx + 1).padStart(2, "0")}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Cover */}
                                                <div style={{
                                                    width: 48, height: 48, borderRadius: 10, overflow: "hidden",
                                                    background: "linear-gradient(135deg,#dcfce7,#86efac)",
                                                    flexShrink: 0, position: "relative",
                                                    boxShadow: isThisPlaying ? "0 4px 16px rgba(22,163,74,0.3)" : "none",
                                                    transition: "box-shadow .2s",
                                                }}>
                                                    {track.coverUrl
                                                        ? <img src={track.coverUrl} alt={track.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "#16a34a" }}>♪</div>
                                                    }
                                                    {hoveredTrack === track._id && (
                                                        <div style={{
                                                            position: "absolute", inset: 0,
                                                            background: "rgba(0,0,0,0.45)",
                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                            color: "#fff", fontSize: 15,
                                                        }}>
                                                            {isThisPlaying ? "⏸" : "▶"}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Title */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{
                                                        fontSize: 14, fontWeight: 500,
                                                        color: isThisPlaying ? "#16a34a" : "#111827",
                                                        marginBottom: 2, whiteSpace: "nowrap",
                                                        overflow: "hidden", textOverflow: "ellipsis",
                                                        transition: "color .2s",
                                                    }}>
                                                        {track.title}
                                                    </p>
                                                    {track.genre && (
                                                        <span style={{
                                                            fontSize: 10, color: "#16a34a",
                                                            background: "#f0fdf4", padding: "2px 8px",
                                                            borderRadius: 100, border: "1px solid rgba(22,163,74,0.2)",
                                                            fontWeight: 500,
                                                        }}>
                                                            {track.genre}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Plays */}
                                                <div style={{ width: 80, textAlign: "right", flexShrink: 0 }}>
                                                    <p style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>{formatPlays(track.plays)}</p>
                                                </div>

                                                {/* Duration */}
                                                <div style={{ width: 50, textAlign: "right", flexShrink: 0 }}>
                                                    <p style={{ fontSize: 13, color: "#9ca3af" }}>{formatTime(track.duration)}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )
                    )}

                    {/* ── ABOUT ── */}
                    {activeTab === "about" && (
                        <div style={{ maxWidth: 640, animation: "fadeUp .4s both" }}>
                            {artist.bio && (
                                <div style={{ marginBottom: 40 }}>
                                    {/* Decorative quote mark */}
                                    <div style={{ fontSize: 64, color: "#dcfce7", lineHeight: 1, marginBottom: -16, fontFamily: "Georgia,serif" }}>"</div>
                                    <p style={{ fontSize: 16, color: "#374151", lineHeight: 1.9, fontStyle: "italic" }}>
                                        {artist.bio}
                                    </p>
                                </div>
                            )}

                            {/* Info cards */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 40 }}>
                                {[
                                    { label: "Thể loại", value: artist.genre, icon: "🎵" },
                                    { label: "Followers", value: formatFollowers(artist.followers), icon: "👥" },
                                    { label: "Trạng thái", value: artist.verified ? "✓ Xác minh" : "Chưa xác minh", icon: "🏅" },
                                    { label: "Bài hát", value: `${tracks.length} bài hát`, icon: "🎶" },
                                ].map(({ label, value, icon }) => value && (
                                    <div key={label} style={{
                                        padding: "18px 20px", borderRadius: 14,
                                        border: "1px solid #e5e7eb", background: "#fafafa",
                                        transition: "all .2s",
                                    }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(22,163,74,0.3)"; (e.currentTarget as HTMLDivElement).style.background = "#f0fdf4"; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#e5e7eb"; (e.currentTarget as HTMLDivElement).style.background = "#fafafa"; }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                            <span style={{ fontSize: 16 }}>{icon}</span>
                                            <p style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600 }}>{label}</p>
                                        </div>
                                        <p style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Social */}
                            {(artist.socialLinks?.facebook || artist.socialLinks?.instagram || artist.socialLinks?.youtube || artist.socialLinks?.tiktok) && (
                                <div>
                                    <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 14, letterSpacing: -0.3 }}>Mạng xã hội</h3>
                                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                        {artist.socialLinks?.facebook && (
                                            <a href={artist.socialLinks.facebook} target="_blank" rel="noreferrer" className="adp-social-btn-light">
                                                <FaFacebookF size={13} /> Facebook
                                            </a>
                                        )}
                                        {artist.socialLinks?.instagram && (
                                            <a href={artist.socialLinks.instagram} target="_blank" rel="noreferrer" className="adp-social-btn-light">
                                                <FaInstagram size={13} /> Instagram
                                            </a>
                                        )}
                                        {artist.socialLinks?.youtube && (
                                            <a href={artist.socialLinks.youtube} target="_blank" rel="noreferrer" className="adp-social-btn-light">
                                                <FaYoutube size={13} /> YouTube
                                            </a>
                                        )}
                                        {artist.socialLinks?.tiktok && (
                                            <a href={artist.socialLinks.tiktok} target="_blank" rel="noreferrer" className="adp-social-btn-light">
                                                <FaTiktok size={13} /> TikTok
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
        </>
    );
};

export default ArtistDetailPage;