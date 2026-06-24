// src/pages/ArtistDetailPage.tsx
'use client';
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { artistService, type Artist, type Track } from "@/services/artistService";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { FaFacebookF, FaInstagram, FaYoutube, FaTiktok } from "react-icons/fa";
import SEO from "@/components/frontend/SEO";
import { useIsMobile } from "@/hooks/use-mobile";

const fmt = {
    followers: (n?: number) => {
        if (!n) return "0";
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
        if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
        return n.toString();
    },
    time: (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`,
    plays: (n: number) => {
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
        if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
        return n.toString();
    },
};
const getInitials = (name: string) =>
    name.split(" ").slice(-2).map(w => w[0]).join("").toUpperCase();

const MEDALS = ["🥇", "🥈", "🥉"];

export default function ArtistDetailPage({ artistId }: { artistId?: string }) {
    const isMobile = useIsMobile();
    const params = useParams();
    const id = artistId || (params?.id as string | undefined);

    const [artist,       setArtist]       = useState<Artist | null>(null);
    const [tracks,       setTracks]       = useState<Track[]>([]);
    const [loading,      setLoading]      = useState(true);
    const [fetchError,   setFetchError]   = useState(false);
    const [retryCount,   setRetryCount]   = useState(0);
    const [activeTab,    setActiveTab]    = useState<"tracks" | "about">("tracks");
    const [hoveredTrack, setHoveredTrack] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const { play, togglePlay, currentTrack, isPlaying } = usePlayerStore();

    useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        let frame = 0, raf: number;
        const draw = () => {
            canvas.width  = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const bars = 90, bw = canvas.width / bars;
            for (let i = 0; i < bars; i++) {
                const h = (Math.sin(i * .2 + frame * .05) * .38 + Math.sin(i * .48 + frame * .03) * .28 + .32) * canvas.height * .82;
                const a = .18 + Math.sin(i * .28 + frame * .04) * .1;
                ctx.fillStyle = `rgba(0,169,143,${a})`;
                ctx.beginPath();
                try { ctx.roundRect(i * bw + 1, canvas.height - h, bw - 2, h, 2); } catch { ctx.rect(i * bw + 1, canvas.height - h, bw - 2, h); }
                ctx.fill();
            }
            frame++;
            raf = requestAnimationFrame(draw);
        };
        draw();
        return () => cancelAnimationFrame(raf);
    }, []);

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                setLoading(true);
                setFetchError(false);
                const [a, t] = await Promise.all([
                    artistService.getById(id),
                    artistService.getTracks(id, { limit: 20 }),
                ]);
                setArtist(a);
                setTracks(t.data);
            } catch {
                setFetchError(true);
            } finally { setLoading(false); }
        })();
    }, [id, retryCount]);

    const handlePlay = (track: Track, queue?: Track[]) => {
        if (currentTrack?.id === track._id) { togglePlay(); return; }
        play(
            { id: track._id, title: track.title, artist: artist?.name ?? "", album: track.albumId?.title, audioUrl: track.audioUrl, coverUrl: track.coverUrl, duration: track.duration },
            (queue ?? tracks).map(t => ({ id: t._id, title: t.title, artist: artist?.name ?? "", audioUrl: t.audioUrl, coverUrl: t.coverUrl, duration: t.duration }))
        );
    };

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) return (
        <div style={{ minHeight:"100vh", background:"#F8F8FC", fontFamily:"'Be Vietnam Pro',sans-serif" }}>
            <style>{`@keyframes adpP{0%,100%{opacity:.18}50%{opacity:.5}}`}</style>
            <div style={{ height: isMobile ? 260 : 360, background:"linear-gradient(145deg,#E8ECF8,#EAE8F8)", animation:"adpP 1.6s ease-in-out infinite" }} />
            <div style={{ maxWidth:1440, margin:"0 auto", padding:"40px 32px" }}>
                <div style={{ display:"flex", gap:20, marginBottom:40 }}>
                    <div style={{ width:128, height:128, borderRadius:"50%", background:"rgba(0,169,143,.07)", animation:"adpP 1.6s ease-in-out infinite" }} />
                    <div style={{ display:"flex", flexDirection:"column", gap:12, justifyContent:"center" }}>
                        {[220,140,100].map((w,i) => (
                            <div key={i} style={{ height:i===0?28:12, width:w, background:"rgba(0,0,0,.06)", borderRadius:6, animation:"adpP 1.6s ease-in-out infinite" }} />
                        ))}
                    </div>
                </div>
                {Array.from({length:5}).map((_,i) => (
                    <div key={i} style={{ height:56, background:"rgba(0,0,0,.03)", borderRadius:14, marginBottom:8, animation:`adpP ${1.4+i*.1}s ease-in-out infinite` }} />
                ))}
            </div>
        </div>
    );

    if (fetchError) return (
        <div style={{ minHeight:"100vh", background:"#F8F8FC", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Be Vietnam Pro',sans-serif" }}>
            <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:56, marginBottom:14, opacity:.18 }}>⚠</div>
                <p style={{ fontFamily:"'Be Vietnam Pro',sans-serif", fontSize:15, color:"rgba(0,0,0,.45)", marginBottom:8 }}>Không thể tải thông tin nghệ sĩ</p>
                <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:12, color:"rgba(0,0,0,.3)", marginBottom:20 }}>Vui lòng thử lại sau</p>
                <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
                    <button onClick={() => setRetryCount(c => c+1)} style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:12, fontWeight:700, color:"#00A98F", background:"rgba(0,169,143,.08)", border:"1px solid rgba(0,169,143,.3)", borderRadius:10, padding:"8px 18px", cursor:"pointer" }}>Thử lại</button>
                    <Link href="/artists" style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:12, fontWeight:700, color:"rgba(0,0,0,.45)", textDecoration:"none", lineHeight:"36px" }}>← Quay lại</Link>
                </div>
            </div>
        </div>
    );

    if (!artist) return (
        <div style={{ minHeight:"100vh", background:"#F8F8FC", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Be Vietnam Pro',sans-serif" }}>
            <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:56, marginBottom:14, opacity:.18 }}>♪</div>
                <p style={{ fontFamily:"'Be Vietnam Pro',sans-serif", fontSize:15, color:"rgba(0,0,0,.45)", marginBottom:16 }}>Không tìm thấy nghệ sĩ</p>
                <Link href="/artists" style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:12, fontWeight:700, color:"#00A98F", textDecoration:"none" }}>← Quay lại nghệ sĩ</Link>
            </div>
        </div>
    );

    const hasSocial  = artist.socialLinks?.facebook || artist.socialLinks?.instagram || artist.socialLinks?.youtube || artist.socialLinks?.tiktok;
    const totalPlays = tracks.reduce((s, t) => s + (t.plays || 0), 0);
    const topTracks  = [...tracks].sort((a, b) => (b.plays||0)-(a.plays||0)).slice(0,3);
    const maxPlays   = topTracks[0]?.plays || 1;

    return (
        <>
        <SEO
            title={`${artist.name} – Won Music`}
            description={artist.bio ? artist.bio.slice(0,160) : `Nghe nhạc ${artist.name} trên Won Music.`}
            canonical={`https://www.wonmusic.vn/artists/${id}`}
            image={artist.avatar}
            imageAlt={artist.name}
            type="artist"
            name={artist.name}
            genre={artist.genre}
        />
        <div style={{ minHeight:"100vh", background:"#F8F8FC", fontFamily:"'Be Vietnam Pro',sans-serif", color:"#0D0D1A" }}>

            <style>{`
                @keyframes adpFadeUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
                @keyframes adpEq      { 0%,100%{transform:scaleY(.18)} 50%{transform:scaleY(1)} }
                @keyframes adpGlow    { 0%,100%{box-shadow:0 0 24px rgba(0,169,143,.18)} 50%{box-shadow:0 0 48px rgba(0,169,143,.42)} }
                @keyframes adpRing    { to{transform:rotate(360deg)} }
                @keyframes adpBarGrow { from{width:0} to{width:100%} }
                @keyframes adpPulse   { 0%,100%{opacity:.18} 50%{opacity:.5} }

                /* ── popular card ── */
                .adp-pop {
                    display:flex; align-items:center; gap:16px;
                    padding:16px 18px; border-radius:16px;
                    border:1px solid rgba(0,0,0,.07);
                    background:#fff;
                    cursor:pointer; transition:all .22s;
                    position:relative; overflow:hidden;
                    animation:adpFadeUp .4s both;
                    box-shadow:0 2px 8px rgba(0,0,0,.04);
                }
                .adp-pop:hover { border-color:rgba(0,169,143,.3); transform:translateY(-3px); box-shadow:0 12px 32px rgba(0,169,143,.1),0 2px 8px rgba(0,0,0,.04); }
                .adp-pop.playing { border-color:rgba(0,169,143,.35); background:rgba(0,169,143,.04); box-shadow:0 8px 28px rgba(0,169,143,.12); animation:adpGlow 3s ease-in-out infinite; }

                /* ── track row ── */
                .adp-row {
                    display:flex; align-items:center; gap:14px;
                    padding:10px 14px; border-radius:12px;
                    transition:all .18s; cursor:pointer;
                    border:1px solid transparent;
                    animation:adpFadeUp .35s both;
                    position:relative; overflow:hidden;
                }
                .adp-row::before {
                    content:''; position:absolute; left:0; top:0; bottom:0; width:3px;
                    background:linear-gradient(to bottom,#34D4B8,#00A98F);
                    transform:scaleY(0); transition:transform .2s; border-radius:0 2px 2px 0;
                }
                .adp-row:hover { background:rgba(0,169,143,.05); border-color:rgba(0,169,143,.14); }
                .adp-row:hover::before { transform:scaleY(1); }
                .adp-row.playing { background:rgba(0,169,143,.06); border-color:rgba(0,169,143,.22); }
                .adp-row.playing::before { transform:scaleY(1); }

                /* ── tabs ── */
                .adp-tab {
                    padding:9px 22px; border-radius:10px;
                    border:1px solid rgba(0,0,0,.1);
                    background:transparent; color:rgba(0,0,0,.45);
                    font-family:'Space Grotesk',sans-serif;
                    font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase;
                    cursor:pointer; transition:all .2s;
                }
                .adp-tab:hover { border-color:rgba(0,169,143,.35); color:#00A98F; }
                .adp-tab.active { background:rgba(0,169,143,.1); border-color:rgba(0,169,143,.4); color:#00A98F; }

                /* ── bio card ── */
                .adp-bio {
                    padding:30px 32px; border-radius:20px;
                    border:1px solid rgba(0,0,0,.07);
                    background:#fff;
                    position:relative; overflow:hidden;
                    box-shadow:0 2px 12px rgba(0,0,0,.04);
                }
                .adp-bio::before {
                    content:'"'; position:absolute; top:-12px; left:18px;
                    font-size:140px; color:rgba(0,169,143,.06);
                    font-family:Georgia,serif; line-height:1; pointer-events:none;
                }

                /* ── stat chip ── */
                .adp-stat-chip {
                    padding:16px 18px; border-radius:14px;
                    border:1px solid rgba(0,0,0,.07);
                    background:#fff;
                    transition:all .2s;
                    box-shadow:0 1px 6px rgba(0,0,0,.04);
                }
                .adp-stat-chip:hover { border-color:rgba(0,169,143,.25); background:rgba(0,169,143,.03); }

                /* ── social pill ── */
                .adp-social-pill {
                    display:inline-flex; align-items:center; gap:8px;
                    padding:9px 18px; border-radius:10px;
                    border:1px solid rgba(0,0,0,.1); background:#fff;
                    color:rgba(0,0,0,.55);
                    font-family:'Space Grotesk',sans-serif;
                    font-size:12px; font-weight:700; letter-spacing:.3px;
                    text-decoration:none; transition:all .2s;
                }
                .adp-social-pill:hover { border-color:rgba(0,169,143,.4); color:#00A98F; background:rgba(0,169,143,.06); }

                /* ── play-all button ── */
                .adp-play-all {
                    display:inline-flex; align-items:center; gap:9px;
                    padding:12px 26px; border-radius:12px;
                    background:linear-gradient(135deg,#00A98F,#34D4B8);
                    border:none; color:#fff;
                    font-family:'Space Grotesk',sans-serif;
                    font-size:12px; font-weight:800; letter-spacing:.8px; text-transform:uppercase;
                    cursor:pointer; transition:all .25s;
                    box-shadow:0 6px 20px rgba(0,169,143,.3);
                }
                .adp-play-all:hover { transform:translateY(-2px); box-shadow:0 10px 28px rgba(0,169,143,.4); }

                /* ── social icon hero ── */
                .adp-social-icon {
                    width:36px; height:36px; border-radius:50%;
                    border:1px solid rgba(0,0,0,.12);
                    background:rgba(255,255,255,.8); color:rgba(0,0,0,.55);
                    display:flex; align-items:center; justify-content:center;
                    text-decoration:none; transition:all .2s; flex-shrink:0;
                }
                .adp-social-icon:hover { background:rgba(0,169,143,.15); border-color:rgba(0,169,143,.5); color:#00A98F; transform:translateY(-2px); }

                /* ── section divider ── */
                .adp-section-label {
                    font-family:'Space Grotesk',sans-serif;
                    font-size:10px; font-weight:700;
                    letter-spacing:2.5px; text-transform:uppercase;
                    color:rgba(0,0,0,.35);
                }
            `}</style>

            {/* ══ HERO ══ */}
            <div style={{
                position:"relative", overflow:"hidden",
                height: isMobile ? 260 : 360,
                backgroundImage:"url('/partner-bg.png')",
                backgroundSize:"cover", backgroundPosition:"center", backgroundRepeat:"no-repeat",
            }}>
                <div style={{ position:"absolute", top:"-20%", right:"-5%", width:480, height:480, borderRadius:"50%", background:"radial-gradient(circle,rgba(0,169,143,0.10),transparent 65%)", pointerEvents:"none" }} />
                <canvas ref={canvasRef} style={{ position:"absolute", bottom:0, left:0, width:"100%", height:isMobile?32:48, opacity:.18, pointerEvents:"none" }} />

                <div style={{ maxWidth:1440, margin:"0 auto", padding:`${isMobile?88:104}px 32px ${isMobile?24:32}px`, position:"relative", zIndex:2 }}>

                    {/* Back */}
                    <Link href="/artists" style={{
                        display:"inline-flex", alignItems:"center", gap:6,
                        fontFamily:"'Space Grotesk',sans-serif", fontSize:11, fontWeight:700, letterSpacing:"0.8px",
                        color:"rgba(0,0,0,.5)", textDecoration:"none", marginBottom:14,
                    }}>
                        ← Nghệ sĩ
                    </Link>

                    {/* Eyebrow */}
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                        <span style={{ width:28, height:2, background:"linear-gradient(90deg,#00A98F,#34D4B8)", borderRadius:2, display:"block" }} />
                        <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:12, fontWeight:700, letterSpacing:"2.5px", textTransform:"uppercase", color:"#00A98F" }}>
                            {artist.verified ? "Nghệ sĩ xác minh" : "Nghệ sĩ"}
                        </span>
                    </div>

                    {/* Name */}
                    <h1 style={{
                        fontFamily:"'Be Vietnam Pro',sans-serif",
                        fontSize: isMobile ? "clamp(28px,7vw,38px)" : "clamp(36px,4vw,52px)",
                        fontWeight:900, lineHeight:1.1, letterSpacing:"-1px",
                        color:"#0D0D1A", margin:"0 0 10px",
                    }}>
                        {artist.name}
                    </h1>
                    {artist.genre && (
                        <span style={{
                            display:"inline-block",
                            fontFamily:"'Space Grotesk',sans-serif",
                            fontSize:10, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase",
                            color:"#00A98F", background:"rgba(0,169,143,.1)",
                            border:"1px solid rgba(0,169,143,.25)",
                            padding:"4px 12px", borderRadius:100,
                        }}>{artist.genre}</span>
                    )}

                    {/* Stats row */}
                    <div style={{ display:"flex", alignItems:"center", gap:16, marginTop: artist.genre ? 12 : 16 }}>
                        <div style={{ width:48, height:2, background:"linear-gradient(90deg,#00A98F,#34D4B8)", borderRadius:2, flexShrink:0 }} />
                        <div style={{ display:"flex", gap: isMobile ? 16 : 28, alignItems:"center" }}>
                            {[
                                { label:"Followers",  value: fmt.followers(artist.followers) },
                                { label:"Bài hát",    value: tracks.length },
                                { label:"Lượt nghe",  value: fmt.plays(totalPlays) },
                            ].map(({ label, value }) => (
                                <div key={label} style={{ display:"flex", alignItems:"baseline", gap:5 }}>
                                    <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize: isMobile ? 14 : 17, fontWeight:800, color:"#0D0D1A", letterSpacing:"-0.3px" }}>{value}</span>
                                    <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:10, color:"rgba(0,0,0,.4)", textTransform:"uppercase", letterSpacing:"1.2px" }}>{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ══ PROFILE STRIP ══ */}
            <div style={{ borderBottom:"1px solid rgba(0,0,0,.07)", background:"#fff", boxShadow:"0 2px 12px rgba(0,0,0,.04)" }}>
                <div style={{ maxWidth:1440, margin:"0 auto", padding: isMobile ? "14px 16px" : "16px 32px", display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>

                    {/* Avatar */}
                    <div style={{ position:"relative", flexShrink:0 }}>
                        <div style={{ position:"absolute", inset:-6, borderRadius:"50%", border:"1.5px dashed rgba(0,169,143,.28)", animation:"adpRing 10s linear infinite" }} />
                        <div style={{
                            width: isMobile ? 60 : 76, height: isMobile ? 60 : 76,
                            borderRadius:"50%", overflow:"hidden", position:"relative",
                            background:"linear-gradient(135deg,#E0F4F0,#C8EDE8)",
                            display:"flex", alignItems:"center", justifyContent:"center",
                            fontFamily:"'Space Grotesk',sans-serif",
                            fontSize: isMobile ? 20 : 26, fontWeight:700, color:"#00A98F",
                            border:"2.5px solid rgba(0,169,143,.3)",
                            boxShadow:"0 4px 18px rgba(0,169,143,.15)",
                        }}>
                            {artist.avatar
                                ? <img src={artist.avatar} alt={artist.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                                : getInitials(artist.name)
                            }
                        </div>
                        {artist.verified && (
                            <div style={{
                                position:"absolute", bottom:2, right:2,
                                width:20, height:20, borderRadius:"50%",
                                background:"linear-gradient(135deg,#00A98F,#34D4B8)",
                                color:"#fff", display:"flex", alignItems:"center", justifyContent:"center",
                                fontSize:9, fontWeight:800, border:"2.5px solid #fff",
                                boxShadow:"0 2px 8px rgba(0,169,143,.45)",
                            }}>✓</div>
                        )}
                    </div>

                    {/* Name + genre (mobile) */}
                    {isMobile && (
                        <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ fontFamily:"'Be Vietnam Pro',sans-serif", fontSize:15, fontWeight:800, color:"#0D0D1A", margin:"0 0 2px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{artist.name}</p>
                            {artist.genre && <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:10, fontWeight:700, color:"#00A98F", letterSpacing:"1.5px", textTransform:"uppercase", margin:0 }}>{artist.genre}</p>}
                        </div>
                    )}

                    {/* Actions */}
                    <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                        <button className="adp-play-all" onClick={() => tracks.length && handlePlay(tracks[0])}>
                            ▶ Phát tất cả
                        </button>
                        {hasSocial && (
                            <div style={{ display:"flex", gap:7 }}>
                                {artist.socialLinks?.facebook  && <a href={artist.socialLinks.facebook}  target="_blank" rel="noreferrer" className="adp-social-icon" title="Facebook"><FaFacebookF  size={12}/></a>}
                                {artist.socialLinks?.instagram && <a href={artist.socialLinks.instagram} target="_blank" rel="noreferrer" className="adp-social-icon" title="Instagram"><FaInstagram size={12}/></a>}
                                {artist.socialLinks?.youtube   && <a href={artist.socialLinks.youtube}   target="_blank" rel="noreferrer" className="adp-social-icon" title="YouTube"><FaYoutube    size={12}/></a>}
                                {artist.socialLinks?.tiktok    && <a href={artist.socialLinks.tiktok}    target="_blank" rel="noreferrer" className="adp-social-icon" title="TikTok"><FaTiktok      size={12}/></a>}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ══ BODY ══ */}
            <div style={{ maxWidth:1440, margin:"0 auto", padding: isMobile ? "28px 16px 100px" : "36px 32px 80px" }}>

                {/* Tabs */}
                <div style={{ display:"flex", gap:8, marginBottom:32 }}>
                    <button className={`adp-tab ${activeTab === "tracks" ? "active" : ""}`} onClick={() => setActiveTab("tracks")}>
                        ♪ Bài hát ({tracks.length})
                    </button>
                    <button className={`adp-tab ${activeTab === "about" ? "active" : ""}`} onClick={() => setActiveTab("about")}>
                        Giới thiệu
                    </button>
                </div>

                {/* ── TAB TRACKS ── */}
                {activeTab === "tracks" && (
                    tracks.length === 0 ? (
                        <div style={{ textAlign:"center", padding:"80px 0" }}>
                            <div style={{ fontSize:52, marginBottom:14, opacity:.18 }}>♪</div>
                            <p style={{ fontFamily:"'Be Vietnam Pro',sans-serif", fontSize:15, color:"rgba(0,0,0,.4)" }}>Chưa có bài hát nào</p>
                        </div>
                    ) : (
                        <div style={{ display:"flex", flexDirection:"column", gap:36 }}>

                            {/* Top 3 nổi bật */}
                            {topTracks.length > 0 && (
                                <div>
                                    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                                        <span className="adp-section-label">Bài hát nổi bật</span>
                                        <span style={{ flex:1, height:1, background:"rgba(0,0,0,.07)" }} />
                                    </div>
                                    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                                        {topTracks.map((track, rank) => {
                                            const isThis        = currentTrack?.id === track._id;
                                            const isThisPlaying = isThis && isPlaying;
                                            const pct           = Math.round(((track.plays||0)/maxPlays)*100);
                                            return (
                                                <div
                                                    key={track._id}
                                                    className={`adp-pop ${isThisPlaying ? "playing" : ""}`}
                                                    style={{ animationDelay:`${rank*.08}s` }}
                                                    onClick={() => handlePlay(track)}
                                                >
                                                    {/* Medal / EQ */}
                                                    <div style={{ fontSize:22, flexShrink:0, width:32, textAlign:"center", lineHeight:1 }}>
                                                        {isThisPlaying ? (
                                                            <div style={{ display:"flex", alignItems:"flex-end", gap:2, height:22, justifyContent:"center" }}>
                                                                {[40,70,55,88,44,72].map((h,i) => (
                                                                    <div key={i} style={{ width:3, height:`${h}%`, background:"linear-gradient(to top,#00A98F,#34D4B8)", borderRadius:2, transformOrigin:"bottom", animation:`adpEq ${.36+i*.1}s ease-in-out infinite`, animationDelay:`${i*.055}s` }} />
                                                                ))}
                                                            </div>
                                                        ) : MEDALS[rank]}
                                                    </div>

                                                    {/* Cover */}
                                                    <div style={{
                                                        width:64, height:64, borderRadius:12, overflow:"hidden", flexShrink:0,
                                                        background:"linear-gradient(135deg,#E8ECF8,#D8DFF0)",
                                                        border:`1.5px solid ${isThisPlaying?"rgba(0,169,143,.4)":"rgba(0,0,0,.07)"}`,
                                                        boxShadow:isThisPlaying?"0 4px 20px rgba(0,169,143,.3)":"0 2px 8px rgba(0,0,0,.06)",
                                                        position:"relative", transition:"all .2s",
                                                    }}>
                                                        {track.coverUrl
                                                            ? <img src={track.coverUrl} alt={track.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                                                            : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, color:"#34D4B8", opacity:.45 }}>♪</div>
                                                        }
                                                    </div>

                                                    {/* Info */}
                                                    <div style={{ flex:1, minWidth:0 }}>
                                                        <p style={{ fontFamily:"'Be Vietnam Pro',sans-serif", fontSize:15, fontWeight:700, color:isThisPlaying?"#00A98F":"#0D0D1A", marginBottom:5, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", transition:"color .2s", letterSpacing:"-0.2px" }}>
                                                            {track.title}
                                                        </p>
                                                        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                                                            {track.genre && (
                                                                <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:9, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"#00A98F", background:"rgba(0,169,143,.09)", padding:"2px 9px", borderRadius:100, border:"1px solid rgba(0,169,143,.2)", flexShrink:0 }}>
                                                                    {track.genre}
                                                                </span>
                                                            )}
                                                            <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:11, fontWeight:600, color:"rgba(0,0,0,.4)", flexShrink:0 }}>
                                                                {fmt.plays(track.plays)} plays
                                                            </span>
                                                        </div>
                                                        <div style={{ height:3, background:"rgba(0,0,0,.06)", borderRadius:2, overflow:"hidden" }}>
                                                            <div style={{
                                                                height:"100%", borderRadius:2,
                                                                background:isThisPlaying?"linear-gradient(90deg,#00A98F,#34D4B8)":"rgba(0,169,143,.4)",
                                                                width:`${pct}%`,
                                                                animation:"adpBarGrow .9s cubic-bezier(.4,0,.2,1) both",
                                                            }} />
                                                        </div>
                                                    </div>

                                                    {/* Duration */}
                                                    <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:12, fontWeight:600, color:"rgba(0,0,0,.38)", flexShrink:0 }}>{fmt.time(track.duration)}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Full list */}
                            {tracks.length > 3 && (
                                <div>
                                    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                                        <span className="adp-section-label">Tất cả bài hát</span>
                                        <span style={{ flex:1, height:1, background:"rgba(0,0,0,.07)" }} />
                                    </div>

                                    {/* Header */}
                                    <div style={{ display:"flex", alignItems:"center", gap:14, padding:"0 14px 10px", borderBottom:"1px solid rgba(0,0,0,.07)", marginBottom:4 }}>
                                        <div style={{ width:28 }} />
                                        <div style={{ width:42 }} />
                                        <div style={{ flex:1, fontFamily:"'Space Grotesk',sans-serif", fontSize:9, color:"rgba(0,0,0,.35)", textTransform:"uppercase", letterSpacing:"2px", fontWeight:700 }}>Tên bài</div>
                                        {!isMobile && <div style={{ width:76, textAlign:"right", fontFamily:"'Space Grotesk',sans-serif", fontSize:9, color:"rgba(0,0,0,.35)", textTransform:"uppercase", letterSpacing:"2px", fontWeight:700 }}>Plays</div>}
                                        <div style={{ width:46, textAlign:"right", fontFamily:"'Space Grotesk',sans-serif", fontSize:9, color:"rgba(0,0,0,.35)", textTransform:"uppercase", letterSpacing:"2px", fontWeight:700 }}>TG</div>
                                    </div>

                                    <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                                        {tracks.map((track, idx) => {
                                            const isThis        = currentTrack?.id === track._id;
                                            const isThisPlaying = isThis && isPlaying;
                                            const isHovered     = hoveredTrack === track._id;
                                            return (
                                                <div
                                                    key={track._id}
                                                    className={`adp-row ${isThisPlaying?"playing":""}`}
                                                    style={{ animationDelay:`${idx*.03}s` }}
                                                    onMouseEnter={() => setHoveredTrack(track._id)}
                                                    onMouseLeave={() => setHoveredTrack(null)}
                                                    onClick={() => handlePlay(track)}
                                                >
                                                    {/* Index / EQ */}
                                                    <div style={{ width:28, textAlign:"center", flexShrink:0 }}>
                                                        {isThisPlaying ? (
                                                            <div style={{ display:"flex", alignItems:"flex-end", gap:1.5, height:14, justifyContent:"center" }}>
                                                                {[40,70,52,88,42,72].map((h,i) => (
                                                                    <div key={i} style={{ width:2.5, height:`${h}%`, background:"linear-gradient(to top,#00A98F,#34D4B8)", borderRadius:2, transformOrigin:"bottom", animation:`adpEq ${.36+i*.1}s ease-in-out infinite`, animationDelay:`${i*.055}s` }} />
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:11, fontWeight:700, color:isHovered?"#00A98F":"rgba(0,0,0,.3)" }}>
                                                                {String(idx+1).padStart(2,"0")}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Cover */}
                                                    <div style={{
                                                        width:42, height:42, borderRadius:10, overflow:"hidden", flexShrink:0,
                                                        background:"linear-gradient(135deg,#E8ECF8,#D8DFF0)",
                                                        border:`1px solid ${isThisPlaying?"rgba(0,169,143,.38)":"rgba(0,0,0,.07)"}`,
                                                        position:"relative",
                                                        boxShadow:isThisPlaying?"0 3px 14px rgba(0,169,143,.25)":"none",
                                                        transition:"all .18s",
                                                    }}>
                                                        {track.coverUrl
                                                            ? <img src={track.coverUrl} alt={track.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                                                            : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, color:"#34D4B8", opacity:.45 }}>♪</div>
                                                        }
                                                        {isHovered && (
                                                            <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:14, borderRadius:10 }}>
                                                                {isThisPlaying ? "⏸" : "▶"}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Title + genre */}
                                                    <div style={{ flex:1, minWidth:0 }}>
                                                        <p style={{ fontFamily:"'Be Vietnam Pro',sans-serif", fontSize:13, fontWeight:600, color:isThisPlaying?"#00A98F":"#0D0D1A", marginBottom:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", transition:"color .18s", letterSpacing:"-0.1px" }}>
                                                            {track.title}
                                                        </p>
                                                        {track.genre && (
                                                            <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:9, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"rgba(0,169,143,.7)", background:"rgba(0,169,143,.08)", padding:"1px 7px", borderRadius:100 }}>
                                                                {track.genre}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Plays */}
                                                    {!isMobile && (
                                                        <div style={{ width:76, textAlign:"right", flexShrink:0 }}>
                                                            <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:12, fontWeight:600, color:"rgba(0,0,0,.38)" }}>{fmt.plays(track.plays)}</span>
                                                        </div>
                                                    )}

                                                    {/* Duration */}
                                                    <div style={{ width:46, textAlign:"right", flexShrink:0 }}>
                                                        <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:12, fontWeight:600, color:"rgba(0,0,0,.35)" }}>{fmt.time(track.duration)}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                )}

                {/* ── TAB ABOUT ── */}
                {activeTab === "about" && (
                    <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 320px", gap:24, alignItems:"start", animation:"adpFadeUp .4s both" }}>

                        {/* Left: bio + social */}
                        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
                            {artist.bio ? (
                                <div className="adp-bio">
                                    <p style={{ fontFamily:"'Be Vietnam Pro',sans-serif", fontSize:15, color:"rgba(0,0,0,.68)", lineHeight:1.95, fontStyle:"italic", position:"relative", zIndex:1 }}>
                                        {artist.bio}
                                    </p>
                                </div>
                            ) : (
                                <div style={{ padding:"40px 32px", borderRadius:20, border:"1px dashed rgba(0,0,0,.1)", textAlign:"center", background:"#fff" }}>
                                    <div style={{ fontSize:36, marginBottom:10, opacity:.2 }}>🎵</div>
                                    <p style={{ fontFamily:"'Be Vietnam Pro',sans-serif", fontSize:14, color:"rgba(0,0,0,.35)" }}>Chưa có thông tin giới thiệu</p>
                                </div>
                            )}

                            {hasSocial && (
                                <div>
                                    <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"2.5px", textTransform:"uppercase", color:"rgba(0,0,0,.35)", marginBottom:14 }}>Mạng xã hội</p>
                                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                                        {artist.socialLinks?.facebook  && <a href={artist.socialLinks.facebook}  target="_blank" rel="noreferrer" className="adp-social-pill"><FaFacebookF  size={12}/> Facebook</a>}
                                        {artist.socialLinks?.instagram && <a href={artist.socialLinks.instagram} target="_blank" rel="noreferrer" className="adp-social-pill"><FaInstagram size={12}/> Instagram</a>}
                                        {artist.socialLinks?.youtube   && <a href={artist.socialLinks.youtube}   target="_blank" rel="noreferrer" className="adp-social-pill"><FaYoutube    size={12}/> YouTube</a>}
                                        {artist.socialLinks?.tiktok    && <a href={artist.socialLinks.tiktok}    target="_blank" rel="noreferrer" className="adp-social-pill"><FaTiktok      size={12}/> TikTok</a>}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right: stat chips */}
                        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                            <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"2.5px", textTransform:"uppercase", color:"rgba(0,0,0,.35)", marginBottom:6 }}>Thông tin</p>

                            {[
                                { label:"Thể loại",       value: artist.genre ?? "—",                                    icon:"🎵" },
                                { label:"Followers",       value: fmt.followers(artist.followers),                        icon:"👥" },
                                { label:"Tổng lượt nghe", value: fmt.plays(totalPlays),                                  icon:"🎧" },
                                { label:"Bài hát",        value: `${tracks.length} bài`,                                 icon:"🎶" },
                                { label:"Trạng thái",     value: artist.verified ? "✓ Đã xác minh" : "Chưa xác minh",  icon:"🏅" },
                            ].map(({ label, value, icon }) => (
                                <div key={label} className="adp-stat-chip">
                                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                                        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                                            <span style={{ fontSize:15 }}>{icon}</span>
                                            <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:10, color:"rgba(0,0,0,.4)", textTransform:"uppercase", letterSpacing:"1.5px", fontWeight:700 }}>{label}</span>
                                        </div>
                                        <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:13, fontWeight:700, color: label==="Trạng thái" && artist.verified ? "#00A98F" : "#0D0D1A" }}>
                                            {value}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
        </>
    );
}
