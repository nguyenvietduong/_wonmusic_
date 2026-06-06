// src/pages/ArtistDetailPage.tsx
'use client';
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { artistService, type Artist, type Track } from "@/services/artistService";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { FaFacebookF, FaInstagram, FaYoutube, FaTiktok } from "react-icons/fa";
import SEO from "@/components/frontend/SEO";

// ─── helpers ─────────────────────────────────────────────────────────────────
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

const AVATAR_GRADIENTS = [
    "linear-gradient(135deg,#E8ECF8,#D8DFF0)",
    "linear-gradient(135deg,#E0F4F0,#C8EDE8)",
    "linear-gradient(135deg,#EEEEFB,#DDDAF8)",
    "linear-gradient(135deg,#EAEAFB,#D4D5F8)",
];

// Rank medals for top 3
const MEDALS = ["🥇", "🥈", "🥉"];

export default function ArtistDetailPage() {
    const params = useParams();
    const id = params?.id as string | undefined;

    const [artist,       setArtist]       = useState<Artist | null>(null);
    const [tracks,       setTracks]       = useState<Track[]>([]);
    const [loading,      setLoading]      = useState(true);
    const [activeTab,    setActiveTab]    = useState<"tracks" | "about">("tracks");
    const [hoveredTrack, setHoveredTrack] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const { play, togglePlay, currentTrack, isPlaying } = usePlayerStore();

    useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, []);

    // Animated waveform at hero bottom
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
                ctx.roundRect(i * bw + 1, canvas.height - h, bw - 2, h, 2);
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
                const [a, t] = await Promise.all([
                    artistService.getById(id),
                    artistService.getTracks(id, { limit: 20 }),
                ]);
                setArtist(a);
                setTracks(t.data);
            } finally { setLoading(false); }
        })();
    }, [id]);

    const handlePlay = (track: Track, queue?: Track[]) => {
        if (currentTrack?.id === track._id) { togglePlay(); return; }
        play(
            { id: track._id, title: track.title, artist: artist?.name ?? "", album: track.albumId?.title, audioUrl: track.audioUrl, coverUrl: track.coverUrl, duration: track.duration },
            (queue ?? tracks).map(t => ({ id: t._id, title: t.title, artist: artist?.name ?? "", audioUrl: t.audioUrl, coverUrl: t.coverUrl, duration: t.duration }))
        );
    };

    // ── Loading state ─────────────────────────────────────────────────────────
    if (loading) return (
        <div style={{ minHeight:"100vh", background:"#F8F8FC", fontFamily:"'Be Vietnam Pro',sans-serif" }}>
            <style>{`@keyframes adpP{0%,100%{opacity:.18}50%{opacity:.5}}`}</style>
            <div style={{ height:400, background:"linear-gradient(145deg,#E8ECF8,#EAE8F8)", animation:"adpP 1.6s ease-in-out infinite" }} />
            <div style={{ maxWidth:1440, margin:"0 auto", padding:"40px 32px" }}>
                <div style={{ display:"flex", gap:20, marginBottom:40 }}>
                    <div style={{ width:128, height:128, borderRadius:"50%", background:"rgba(0,169,143,.07)", animation:"adpP 1.6s ease-in-out infinite" }} />
                    <div style={{ display:"flex", flexDirection:"column", gap:12, justifyContent:"center" }}>
                        {[220, 140, 100].map((w, i) => (
                            <div key={i} style={{ height: i === 0 ? 28 : 12, width:w, background:"rgba(0,0,0,.06)", borderRadius:6, animation:"adpP 1.6s ease-in-out infinite" }} />
                        ))}
                    </div>
                </div>
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} style={{ height:52, background:"rgba(0,0,0,.03)", borderRadius:12, marginBottom:8, animation:`adpP ${1.4+i*.1}s ease-in-out infinite` }} />
                ))}
            </div>
        </div>
    );

    if (!artist) return (
        <div style={{ minHeight:"100vh", background:"#F8F8FC", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Be Vietnam Pro',sans-serif" }}>
            <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:56, marginBottom:14, opacity:.18 }}>♪</div>
                <p style={{ color:"rgba(0,0,0,.45)", marginBottom:16 }}>Không tìm thấy nghệ sĩ</p>
                <Link href="/artists" style={{ color:"#34D4B8", textDecoration:"none", fontFamily:"'Space Grotesk',sans-serif", fontSize:13, fontWeight:700 }}>← Quay lại nghệ sĩ</Link>
            </div>
        </div>
    );

    const hasSocial = artist.socialLinks?.facebook || artist.socialLinks?.instagram || artist.socialLinks?.youtube || artist.socialLinks?.tiktok;
    const totalPlays = tracks.reduce((s, t) => s + (t.plays || 0), 0);
    // Top 3 by plays for the featured section
    const topTracks = [...tracks].sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 3);
    const maxPlays  = topTracks[0]?.plays || 1;

    return (
        <>
        <SEO
            title={`${artist.name} – Won Music`}
            description={artist.bio ? artist.bio.slice(0, 160) : `Nghe nhạc ${artist.name} trên Won Music.`}
            canonical={`https://www.wonmusic.vn/artists/${id}`}
            image={artist.avatar}
            imageAlt={artist.name}
            type="artist"
            name={artist.name}
            genre={artist.genre}
        />
        <div style={{ minHeight:"100vh", background:"#F8F8FC", fontFamily:"'Be Vietnam Pro',sans-serif", color:"#0D0D1A" }}>

            <style>{`
                @keyframes adpFadeUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
                @keyframes adpSlideIn { from{opacity:0;transform:translateX(-16px)} to{opacity:1;transform:translateX(0)} }
                @keyframes adpDot     { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.22;transform:scale(.48)} }
                @keyframes adpEq      { 0%,100%{transform:scaleY(.2)} 50%{transform:scaleY(1)} }
                @keyframes adpGlow    { 0%,100%{box-shadow:0 0 28px rgba(0,169,143,.22)} 50%{box-shadow:0 0 52px rgba(0,169,143,.48)} }
                @keyframes adpRing    { to{transform:rotate(360deg)} }
                @keyframes adpBarGrow { from{width:0} to{width:100%} }
                @keyframes adpShimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
                @keyframes adpVinyl  { to{transform:translateY(-50%) rotate(360deg)} }
                @keyframes adpPulse  { 0%,100%{opacity:.55} 50%{opacity:.85} }

                /* ── popular card ── */
                .adp-pop {
                    display:flex; align-items:center; gap:16px;
                    padding:14px 16px; border-radius:16px;
                    border:1px solid rgba(0,0,0,.07);
                    background:rgba(0,0,0,.03);
                    cursor:pointer; transition:all .22s;
                    position:relative; overflow:hidden;
                    animation:adpFadeUp .4s both;
                }
                .adp-pop::before {
                    content:''; position:absolute; inset:0; border-radius:16px;
                    background:radial-gradient(ellipse at 0% 50%, rgba(0,169,143,.1) 0%, transparent 60%);
                    opacity:0; transition:opacity .3s;
                }
                .adp-pop:hover { border-color:rgba(0,169,143,.3); transform:translateY(-3px); box-shadow:0 12px 36px rgba(0,169,143,.1); }
                .adp-pop:hover::before { opacity:1; }
                .adp-pop.playing { border-color:rgba(0,169,143,.35); background:rgba(0,169,143,.06); box-shadow:0 8px 28px rgba(0,169,143,.12); animation:adpGlow 3s ease-in-out infinite; }

                /* ── track row ── */
                .adp-row {
                    display:flex; align-items:center; gap:14px;
                    padding:9px 12px; border-radius:11px;
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
                .adp-row:hover { background:rgba(0,169,143,.05); border-color:rgba(0,169,143,.15); }
                .adp-row:hover::before { transform:scaleY(1); }
                .adp-row.playing { background:rgba(0,169,143,.07); border-color:rgba(0,169,143,.25); }
                .adp-row.playing::before { transform:scaleY(1); }

                /* ── tabs ── */
                .adp-tab {
                    padding:8px 20px; border-radius:9px;
                    border:1px solid rgba(0,0,0,.1);
                    background:transparent; color:rgba(0,0,0,.45);
                    font-family:'Space Grotesk',sans-serif;
                    font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase;
                    cursor:pointer; transition:all .2s;
                }
                .adp-tab:hover { border-color:rgba(0,169,143,.35); color:#34D4B8; }
                .adp-tab.active { background:rgba(0,169,143,.13); border-color:rgba(0,169,143,.45); color:#34D4B8; }

                /* ── about bio card ── */
                .adp-bio {
                    padding:28px 32px; border-radius:20px;
                    border:1px solid rgba(0,0,0,.07);
                    background:rgba(0,0,0,.03);
                    position:relative; overflow:hidden;
                }
                .adp-bio::before {
                    content:'"'; position:absolute; top:-8px; left:20px;
                    font-size:120px; color:rgba(0,169,143,.08);
                    font-family:Georgia,serif; line-height:1; pointer-events:none;
                }

                /* ── stat chip ── */
                .adp-stat-chip {
                    padding:18px 20px; border-radius:14px;
                    border:1px solid rgba(0,0,0,.07);
                    background:rgba(0,0,0,.03);
                    transition:all .2s; text-align:center;
                }
                .adp-stat-chip:hover { border-color:rgba(0,169,143,.28); background:rgba(0,169,143,.05); }

                /* ── social pill ── */
                .adp-social-pill {
                    display:inline-flex; align-items:center; gap:8px;
                    padding:9px 18px; border-radius:10px;
                    border:1px solid rgba(0,0,0,.1); background:rgba(0,0,0,.04);
                    color:rgba(0,0,0,.55); font-size:13px; text-decoration:none;
                    transition:all .2s; font-family:'Be Vietnam Pro',sans-serif;
                }
                .adp-social-pill:hover { border-color:rgba(0,169,143,.4); color:#34D4B8; background:rgba(0,169,143,.07); }

                /* ── play-all button ── */
                .adp-play-all {
                    display:inline-flex; align-items:center; gap:10px;
                    padding:12px 26px; border-radius:10px;
                    background:linear-gradient(135deg,#00A98F,#34D4B8);
                    border:none; color:#0A0A12;
                    font-size:13px; font-weight:800; cursor:pointer;
                    font-family:'Space Grotesk',sans-serif; letter-spacing:.5px;
                    transition:all .25s; animation:adpGlow 3s ease-in-out infinite;
                }
                .adp-play-all:hover { transform:translateY(-2px) scale(1.03); }

                /* ── social icon in hero ── */
                .adp-social-icon {
                    width:34px; height:34px; border-radius:50%;
                    border:1px solid rgba(0,0,0,.12);
                    background:rgba(0,0,0,.05); color:rgba(0,0,0,.55);
                    display:flex; align-items:center; justify-content:center;
                    text-decoration:none; transition:all .2s; flex-shrink:0;
                }
                .adp-social-icon:hover { background:rgba(0,169,143,.22); border-color:rgba(0,169,143,.55); color:#34D4B8; transform:translateY(-2px); }
            `}</style>

            {/* ══════════════════════════════════════
                HERO BANNER
            ══════════════════════════════════════ */}
            <div style={{ height:560, position:"relative", overflow:"hidden", background:"#F0F2FA" }}>

                {/* Atmospheric blur — brighter so artist colors bleed through */}
                {artist.avatar && (
                    <img
                        src={artist.avatar} alt="" aria-hidden="true"
                        style={{
                            position:"absolute", inset:0,
                            width:"100%", height:"100%", objectFit:"cover",
                            filter:"blur(60px) brightness(0.65) saturate(2)",
                            transform:"scale(1.15)", zIndex:0,
                        }}
                    />
                )}

                {/* Gradient overlays: teal glow left + indigo accent top-right + darken */}
                <div style={{ position:"absolute", inset:0, zIndex:1, background:[
                    "radial-gradient(ellipse 55% 80% at 30% 70%, rgba(0,169,143,.12) 0%, transparent 62%)",
                    "radial-gradient(ellipse 40% 50% at 72% 25%, rgba(99,102,241,.07) 0%, transparent 55%)",
                    "linear-gradient(160deg, rgba(240,242,250,.72) 0%, rgba(240,242,250,.28) 45%, rgba(240,242,250,.08) 70%)",
                ].join(",") }} />

                {/* Vinyl record — right-side music decoration */}
                <div style={{
                    position:"absolute", right:-70, top:"50%",
                    width:480, height:480, borderRadius:"50%",
                    animation:"adpVinyl 22s linear infinite",
                    zIndex:2,
                    background:"conic-gradient(from 0deg,#D8DCF0,#C8CEE8 5%,#D8DCF0 10%,#C8CEE8 15%,#D8DCF0 20%,#C8CEE8 25%,#D8DCF0 30%,#C8CEE8 35%,#D8DCF0 40%,#C8CEE8 45%,#D8DCF0 50%,#C8CEE8 55%,#D8DCF0 60%,#C8CEE8 65%,#D8DCF0 70%,#C8CEE8 75%,#D8DCF0 80%,#C8CEE8 85%,#D8DCF0 90%,#C8CEE8 95%,#D8DCF0)",
                    boxShadow:"inset 0 0 80px rgba(0,0,0,.08), 0 0 0 1px rgba(0,169,143,.12), 0 0 120px rgba(0,169,143,.06)",
                    opacity:.65,
                }}>
                    {/* Groove rings */}
                    {[62,95,128,162,196,228].map(r => (
                        <div key={r} style={{
                            position:"absolute", top:"50%", left:"50%",
                            transform:"translate(-50%,-50%)",
                            width:r*2, height:r*2, borderRadius:"50%",
                            border:"1px solid rgba(0,0,0,.1)",
                        }} />
                    ))}
                    {/* Center label */}
                    <div style={{
                        position:"absolute", top:"50%", left:"50%",
                        transform:"translate(-50%,-50%)",
                        width:128, height:128, borderRadius:"50%",
                        background:"linear-gradient(135deg,#F0F4FC,#E8EEF8)",
                        border:"1px solid rgba(0,169,143,.28)",
                        boxShadow:"0 0 44px rgba(0,169,143,.22)",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        animation:"adpPulse 4s ease-in-out infinite",
                    }}>
                        <div style={{ width:20, height:20, borderRadius:"50%", background:"#F0F2FA", border:"2px solid rgba(0,169,143,.4)" }} />
                    </div>
                </div>

                {/* Right-side vignette so vinyl doesn't overwhelm artist info */}
                <div style={{ position:"absolute", inset:0, zIndex:3, background:"linear-gradient(to right, transparent 50%, rgba(240,242,250,.5) 100%)" }} />

                {/* Bottom fade to page bg */}
                <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"80%", background:"linear-gradient(to bottom,transparent 0%,rgba(248,248,252,.9) 55%,#F8F8FC 100%)", zIndex:4 }} />

                {/* Waveform canvas */}
                <canvas ref={canvasRef} style={{ position:"absolute", bottom:0, left:0, width:"100%", height:90, opacity:.6, pointerEvents:"none", zIndex:5 }} />

                {/* Back link — same centering wrapper as navbar */}
                <div style={{ position:"absolute", top:108, left:0, right:0, zIndex:20 }}>
                    <div style={{ maxWidth:1440, margin:"0 auto", padding:"0 32px" }}>
                        <Link href="/artists" style={{
                            display:"inline-flex", alignItems:"center", gap:8,
                            color:"rgba(0,0,0,.6)", textDecoration:"none", fontSize:13,
                            background:"rgba(248,248,252,.8)", backdropFilter:"blur(10px)",
                            padding:"8px 16px", borderRadius:9,
                            border:"1px solid rgba(0,0,0,.1)",
                            fontFamily:"'Space Grotesk',sans-serif", fontWeight:600,
                        }}>
                            ← Nghệ sĩ
                        </Link>
                    </div>
                </div>

                {/* Artist identity row — same centering wrapper as navbar */}
                <div style={{ position:"absolute", bottom:0, left:0, right:0, zIndex:20, paddingBottom:36 }}>
                    <div style={{ maxWidth:1440, margin:"0 auto", padding:"0 32px" }}>
                    <div style={{ display:"flex", alignItems:"flex-end", gap:24, flexWrap:"wrap" }}>

                        {/* Avatar */}
                        <div style={{ position:"relative", flexShrink:0, animation:"adpFadeUp .4s both" }}>
                            <div style={{ position:"absolute", inset:-7, borderRadius:"50%", border:"1.5px dashed rgba(0,169,143,.35)", animation:"adpRing 10s linear infinite", zIndex:0 }} />
                            <div style={{
                                width:132, height:132, borderRadius:"50%",
                                border:"3px solid rgba(0,169,143,.35)",
                                overflow:"hidden", position:"relative", zIndex:1,
                                background:AVATAR_GRADIENTS[0],
                                display:"flex", alignItems:"center", justifyContent:"center",
                                fontFamily:"'Space Grotesk',sans-serif", fontSize:42, fontWeight:700, color:"#00A98F",
                                boxShadow:"0 8px 48px rgba(0,0,0,.15),0 0 0 5px rgba(0,169,143,.12)",
                            }}>
                                {artist.avatar
                                    ? <img src={artist.avatar} alt={artist.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                                    : getInitials(artist.name)
                                }
                            </div>
                            {artist.verified && (
                                <div style={{
                                    position:"absolute", bottom:5, right:5, zIndex:2,
                                    width:30, height:30, borderRadius:"50%",
                                    background:"linear-gradient(135deg,#00A98F,#34D4B8)",
                                    color:"#F8F8FC", display:"flex", alignItems:"center", justifyContent:"center",
                                    fontSize:12, fontWeight:800, border:"3px solid #F8F8FC",
                                    boxShadow:"0 2px 14px rgba(0,169,143,.7)",
                                }}>✓</div>
                            )}
                        </div>

                        {/* Name / genre / stats */}
                        <div style={{ flex:1, minWidth:0, animation:"adpSlideIn .5s both" }}>
                            {artist.verified && (
                                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:7 }}>
                                    <span style={{ width:5, height:5, borderRadius:"50%", background:"#34D4B8", display:"inline-block", animation:"adpDot 1.6s ease-in-out infinite" }} />
                                    <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:9, color:"#34D4B8", letterSpacing:"2.5px", textTransform:"uppercase", fontWeight:700 }}>Nghệ sĩ xác minh</span>
                                </div>
                            )}
                            <h1 style={{
                                fontFamily:"'Be Vietnam Pro',sans-serif", fontWeight:700,
                                fontSize:"clamp(38px,6vw,72px)", color:"#0D0D1A",
                                lineHeight:.93, marginBottom:8,
                                textShadow:"0 2px 12px rgba(0,0,0,.12)",
                            }}>
                                {artist.name}
                            </h1>
                            {artist.genre && (
                                <span style={{
                                    display:"inline-block", fontFamily:"'Space Grotesk',sans-serif",
                                    fontSize:9, fontWeight:700, letterSpacing:"2px", textTransform:"uppercase",
                                    color:"#34D4B8", background:"rgba(0,169,143,.12)",
                                    border:"1px solid rgba(0,169,143,.3)",
                                    padding:"3px 12px", borderRadius:100, marginBottom:14,
                                }}>
                                    {artist.genre}
                                </span>
                            )}
                            <div style={{ display:"flex", gap:24, alignItems:"center" }}>
                                {[
                                    { label:"Followers",    value: fmt.followers(artist.followers) },
                                    { label:"Bài hát",      value: tracks.length },
                                    { label:"Tổng lượt nghe", value: fmt.plays(totalPlays) },
                                ].map(({ label, value }, i) => (
                                    <div key={label} style={{ animation:`adpFadeUp .4s ${i*.08}s both` }}>
                                        <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:18, fontWeight:700, color:"#0D0D1A", letterSpacing:"-0.5px" }}>{value}</div>
                                        <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:9, color:"rgba(0,0,0,.45)", textTransform:"uppercase", letterSpacing:"1.5px" }}>{label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display:"flex", flexDirection:"column", gap:12, alignItems:"flex-end", animation:"adpFadeUp .55s both" }}>
                            <button className="adp-play-all" onClick={() => tracks.length && handlePlay(tracks[0])}>
                                <span style={{ fontSize:14 }}>▶</span> Phát tất cả
                            </button>
                            {hasSocial && (
                                <div style={{ display:"flex", gap:7 }}>
                                    {artist.socialLinks?.facebook  && <a href={artist.socialLinks.facebook}  target="_blank" rel="noreferrer" className="adp-social-icon" title="Facebook"><FaFacebookF  size={11}/></a>}
                                    {artist.socialLinks?.instagram && <a href={artist.socialLinks.instagram} target="_blank" rel="noreferrer" className="adp-social-icon" title="Instagram"><FaInstagram size={11}/></a>}
                                    {artist.socialLinks?.youtube   && <a href={artist.socialLinks.youtube}   target="_blank" rel="noreferrer" className="adp-social-icon" title="YouTube"><FaYoutube    size={11}/></a>}
                                    {artist.socialLinks?.tiktok    && <a href={artist.socialLinks.tiktok}    target="_blank" rel="noreferrer" className="adp-social-icon" title="TikTok"><FaTiktok      size={11}/></a>}
                                </div>
                            )}
                        </div>
                    </div>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════
                BODY
            ══════════════════════════════════════ */}
            <div style={{ maxWidth:1440, margin:"0 auto", padding:"32px 32px 80px" }}>

                {/* Tabs */}
                <div style={{ display:"flex", gap:8, marginBottom:36 }}>
                    <button className={`adp-tab ${activeTab === "tracks" ? "active" : ""}`} onClick={() => setActiveTab("tracks")}>
                        ♪ Bài hát ({tracks.length})
                    </button>
                    <button className={`adp-tab ${activeTab === "about" ? "active" : ""}`} onClick={() => setActiveTab("about")}>
                        Giới thiệu
                    </button>
                </div>

                {/* ─────────────────────────────────────
                    TAB: TRACKS
                ───────────────────────────────────── */}
                {activeTab === "tracks" && (
                    tracks.length === 0 ? (
                        <div style={{ textAlign:"center", padding:"72px 0" }}>
                            <div style={{ fontSize:52, marginBottom:14, opacity:.18 }}>♪</div>
                            <p style={{ color:"rgba(0,0,0,.4)" }}>Chưa có bài hát nào</p>
                        </div>
                    ) : (
                        <div>
                            {/* ── Top 3 featured cards ── */}
                            {topTracks.length > 0 && (
                                <div style={{ marginBottom:40 }}>
                                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                                        <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"2.5px", textTransform:"uppercase", color:"rgba(0,0,0,.45)" }}>Bài hát nổi bật</span>
                                        <span style={{ flex:1, height:1, background:"rgba(0,0,0,.07)" }} />
                                    </div>
                                    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                                        {topTracks.map((track, rank) => {
                                            const isThis        = currentTrack?.id === track._id;
                                            const isThisPlaying = isThis && isPlaying;
                                            const pct           = Math.round(((track.plays || 0) / maxPlays) * 100);
                                            return (
                                                <div
                                                    key={track._id}
                                                    className={`adp-pop ${isThisPlaying ? "playing" : ""}`}
                                                    style={{ animationDelay:`${rank * .08}s` }}
                                                    onClick={() => handlePlay(track)}
                                                >
                                                    {/* Rank medal */}
                                                    <div style={{ fontSize:22, flexShrink:0, width:32, textAlign:"center", lineHeight:1 }}>
                                                        {isThisPlaying ? (
                                                            <div style={{ display:"flex", alignItems:"flex-end", gap:2, height:22, justifyContent:"center" }}>
                                                                {[40,70,55,88,44,72].map((h,i) => (
                                                                    <div key={i} style={{ width:3, height:`${h}%`, background:"linear-gradient(to top,#00A98F,#34D4B8)", borderRadius:2, transformOrigin:"bottom", animation:`adpEq ${.36+i*.1}s ease-in-out infinite`, animationDelay:`${i*.055}s` }} />
                                                                ))}
                                                            </div>
                                                        ) : MEDALS[rank]}
                                                    </div>

                                                    {/* Cover art — bigger than list */}
                                                    <div style={{
                                                        width:64, height:64, borderRadius:12,
                                                        overflow:"hidden", flexShrink:0,
                                                        background:"linear-gradient(135deg,#E8ECF8,#D8DFF0)",
                                                        border:`1px solid ${isThisPlaying ? "rgba(0,169,143,.45)" : "rgba(0,0,0,.07)"}`,
                                                        boxShadow: isThisPlaying ? "0 4px 20px rgba(0,169,143,.35)" : "none",
                                                        position:"relative", transition:"all .2s",
                                                    }}>
                                                        {track.coverUrl
                                                            ? <img src={track.coverUrl} alt={track.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                                                            : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, color:"#34D4B8", opacity:.45 }}>♪</div>
                                                        }
                                                        <div style={{
                                                            position:"absolute", inset:0,
                                                            background:"rgba(0,0,0,.45)",
                                                            display:"flex", alignItems:"center", justifyContent:"center",
                                                            color:"#FFF", fontSize:18, opacity:0, transition:"opacity .2s",
                                                        }} className="adp-pop-play">
                                                            {isThisPlaying ? "⏸" : "▶"}
                                                        </div>
                                                    </div>

                                                    {/* Info + plays bar */}
                                                    <div style={{ flex:1, minWidth:0 }}>
                                                        <p style={{ fontSize:15, fontWeight:600, color: isThisPlaying ? "#34D4B8" : "#0D0D1A", marginBottom:4, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", transition:"color .2s" }}>
                                                            {track.title}
                                                        </p>
                                                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                                            {track.genre && (
                                                                <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:9, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"#34D4B8", background:"rgba(0,169,143,.1)", padding:"2px 8px", borderRadius:100, border:"1px solid rgba(0,169,143,.2)", flexShrink:0 }}>
                                                                    {track.genre}
                                                                </span>
                                                            )}
                                                            <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:11, color:"rgba(0,0,0,.45)", flexShrink:0 }}>
                                                                {fmt.plays(track.plays)} plays
                                                            </span>
                                                        </div>
                                                        {/* Plays progress bar */}
                                                        <div style={{ height:3, background:"rgba(0,0,0,.07)", borderRadius:2, marginTop:10, overflow:"hidden" }}>
                                                            <div style={{
                                                                height:"100%", borderRadius:2,
                                                                background: isThisPlaying
                                                                    ? "linear-gradient(90deg,#00A98F,#34D4B8)"
                                                                    : "rgba(0,169,143,.45)",
                                                                width:`${pct}%`,
                                                                animation:"adpBarGrow .9s cubic-bezier(.4,0,.2,1) both",
                                                            }} />
                                                        </div>
                                                    </div>

                                                    {/* Duration */}
                                                    <div style={{ flexShrink:0, textAlign:"right" }}>
                                                        <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:"rgba(0,0,0,.4)" }}>{fmt.time(track.duration)}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* ── Full track list ── */}
                            {tracks.length > 3 && (
                                <div>
                                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                                        <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"2.5px", textTransform:"uppercase", color:"rgba(0,0,0,.45)" }}>Tất cả bài hát</span>
                                        <span style={{ flex:1, height:1, background:"rgba(0,0,0,.07)" }} />
                                    </div>

                                    {/* Column headers */}
                                    <div style={{ display:"flex", alignItems:"center", gap:14, padding:"0 12px 8px", borderBottom:"1px solid rgba(0,0,0,.07)", marginBottom:4 }}>
                                        <div style={{ width:28 }} />
                                        <div style={{ width:40 }} />
                                        <div style={{ flex:1, fontFamily:"'Space Grotesk',sans-serif", fontSize:9, color:"rgba(0,0,0,.4)", textTransform:"uppercase", letterSpacing:"2px", fontWeight:700 }}>Tên bài</div>
                                        <div style={{ width:72, textAlign:"right", fontFamily:"'Space Grotesk',sans-serif", fontSize:9, color:"rgba(0,0,0,.4)", textTransform:"uppercase", letterSpacing:"2px", fontWeight:700 }}>Plays</div>
                                        <div style={{ width:44, textAlign:"right", fontFamily:"'Space Grotesk',sans-serif", fontSize:9, color:"rgba(0,0,0,.4)", textTransform:"uppercase", letterSpacing:"2px", fontWeight:700 }}>TG</div>
                                    </div>

                                    <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                                        {tracks.map((track, idx) => {
                                            const isThis        = currentTrack?.id === track._id;
                                            const isThisPlaying = isThis && isPlaying;
                                            const isHovered     = hoveredTrack === track._id;
                                            return (
                                                <div
                                                    key={track._id}
                                                    className={`adp-row ${isThisPlaying ? "playing" : ""}`}
                                                    style={{ animationDelay:`${idx * .03}s` }}
                                                    onMouseEnter={() => setHoveredTrack(track._id)}
                                                    onMouseLeave={() => setHoveredTrack(null)}
                                                    onClick={() => handlePlay(track)}
                                                >
                                                    {/* Index / EQ */}
                                                    <div style={{ width:28, textAlign:"center", flexShrink:0 }}>
                                                        {isThisPlaying ? (
                                                            <div style={{ display:"flex", alignItems:"flex-end", gap:1.5, height:14, justifyContent:"center" }}>
                                                                {[40,70,52,88,42,72].map((h, i) => (
                                                                    <div key={i} style={{ width:2.5, height:`${h}%`, background:"linear-gradient(to top,#00A98F,#34D4B8)", borderRadius:2, transformOrigin:"bottom", animation:`adpEq ${.36+i*.1}s ease-in-out infinite`, animationDelay:`${i*.055}s` }} />
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color: isHovered ? "#34D4B8" : "rgba(0,0,0,.35)" }}>
                                                                {String(idx + 1).padStart(2, "0")}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Cover */}
                                                    <div style={{
                                                        width:40, height:40, borderRadius:9,
                                                        overflow:"hidden", flexShrink:0,
                                                        background:"linear-gradient(135deg,#E8ECF8,#D8DFF0)",
                                                        border:`1px solid ${isThisPlaying ? "rgba(0,169,143,.4)" : "rgba(0,0,0,.07)"}`,
                                                        position:"relative",
                                                        boxShadow: isThisPlaying ? "0 3px 14px rgba(0,169,143,.28)" : "none",
                                                        transition:"all .18s",
                                                    }}>
                                                        {track.coverUrl
                                                            ? <img src={track.coverUrl} alt={track.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                                                            : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, color:"#34D4B8", opacity:.45 }}>♪</div>
                                                        }
                                                        {isHovered && (
                                                            <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.52)", display:"flex", alignItems:"center", justifyContent:"center", color:"#34D4B8", fontSize:14 }}>
                                                                {isThisPlaying ? "⏸" : "▶"}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Title + genre */}
                                                    <div style={{ flex:1, minWidth:0 }}>
                                                        <p style={{ fontSize:13, fontWeight:500, color: isThisPlaying ? "#34D4B8" : "#0D0D1A", marginBottom:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", transition:"color .18s" }}>
                                                            {track.title}
                                                        </p>
                                                        {track.genre && (
                                                            <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:9, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"rgba(52,212,184,.7)", background:"rgba(0,169,143,.08)", padding:"1px 7px", borderRadius:100 }}>
                                                                {track.genre}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Plays */}
                                                    <div style={{ width:72, textAlign:"right", flexShrink:0 }}>
                                                        <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:11, color:"rgba(0,0,0,.45)", fontWeight:600 }}>{fmt.plays(track.plays)}</p>
                                                    </div>

                                                    {/* Duration */}
                                                    <div style={{ width:44, textAlign:"right", flexShrink:0 }}>
                                                        <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"rgba(0,0,0,.4)" }}>{fmt.time(track.duration)}</p>
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

                {/* ─────────────────────────────────────
                    TAB: ABOUT — two-column layout
                ───────────────────────────────────── */}
                {activeTab === "about" && (
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:24, alignItems:"start", animation:"adpFadeUp .4s both" }}>

                        {/* Left column: bio + social */}
                        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
                            {artist.bio ? (
                                <div className="adp-bio">
                                    <p style={{ fontSize:15, color:"rgba(0,0,0,.7)", lineHeight:1.95, fontStyle:"italic", position:"relative", zIndex:1 }}>
                                        {artist.bio}
                                    </p>
                                </div>
                            ) : (
                                <div style={{ padding:"32px", borderRadius:20, border:"1px dashed rgba(0,0,0,.1)", textAlign:"center" }}>
                                    <div style={{ fontSize:36, marginBottom:10, opacity:.2 }}>🎵</div>
                                    <p style={{ color:"rgba(0,0,0,.35)", fontSize:13 }}>Chưa có thông tin giới thiệu</p>
                                </div>
                            )}

                            {hasSocial && (
                                <div>
                                    <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"2.5px", textTransform:"uppercase", color:"rgba(0,0,0,.45)", marginBottom:14 }}>Mạng xã hội</p>
                                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                                        {artist.socialLinks?.facebook  && <a href={artist.socialLinks.facebook}  target="_blank" rel="noreferrer" className="adp-social-pill"><FaFacebookF  size={12}/> Facebook</a>}
                                        {artist.socialLinks?.instagram && <a href={artist.socialLinks.instagram} target="_blank" rel="noreferrer" className="adp-social-pill"><FaInstagram size={12}/> Instagram</a>}
                                        {artist.socialLinks?.youtube   && <a href={artist.socialLinks.youtube}   target="_blank" rel="noreferrer" className="adp-social-pill"><FaYoutube    size={12}/> YouTube</a>}
                                        {artist.socialLinks?.tiktok    && <a href={artist.socialLinks.tiktok}    target="_blank" rel="noreferrer" className="adp-social-pill"><FaTiktok      size={12}/> TikTok</a>}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right column: stat chips */}
                        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                            <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"2.5px", textTransform:"uppercase", color:"rgba(0,0,0,.45)", marginBottom:4 }}>Thông tin</p>

                            {[
                                { label:"Thể loại",       value: artist.genre ?? "—",                              icon:"🎵" },
                                { label:"Followers",       value: fmt.followers(artist.followers),                  icon:"👥" },
                                { label:"Tổng lượt nghe", value: fmt.plays(totalPlays),                            icon:"🎧" },
                                { label:"Bài hát",        value: `${tracks.length} bài hát`,                       icon:"🎶" },
                                { label:"Trạng thái",     value: artist.verified ? "✓ Đã xác minh" : "Chưa xác minh", icon:"🏅" },
                            ].map(({ label, value, icon }) => (
                                <div key={label} className="adp-stat-chip">
                                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                            <span style={{ fontSize:16 }}>{icon}</span>
                                            <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:10, color:"rgba(0,0,0,.45)", textTransform:"uppercase", letterSpacing:"1.5px", fontWeight:700 }}>{label}</span>
                                        </div>
                                        <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:13, fontWeight:700, color: label === "Trạng thái" && artist.verified ? "#34D4B8" : "#0D0D1A" }}>
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
