'use client';
import { useState, useEffect } from "react";
import Link from "next/link";
import { artistService, type Artist } from "@/services/artistService";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { artistsText } from "@/locales/artists";
import SEO from "@/components/frontend/SEO";
import { useIsMobile } from "@/hooks/use-mobile";

const GENRE_KEYS = ["Pop", "Indie", "R&B", "Hip-hop", "Ballad", "EDM", "Folk"];

const AVATAR_GRADIENTS = [
    "linear-gradient(135deg,#E8ECF8,#D8DFF0)",
    "linear-gradient(135deg,#E0F4F0,#C8EDE8)",
    "linear-gradient(135deg,#EEEEFB,#DDDAF8)",
    "linear-gradient(135deg,#EAEAFB,#D4D5F8)",
    "linear-gradient(135deg,#E0F4F0,#C8EDE8)",
    "linear-gradient(135deg,#E8ECF8,#C8EDE8)",
];

const getInitials = (name: string) =>
    name.split(" ").slice(-2).map(w => w[0]).join("").toUpperCase();

const formatFollowers = (num?: number) => {
    if (!num) return "0";
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000)     return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
};

// Skeleton card
const SkeletonCard = ({ idx }: { idx: number }) => (
    <div style={{
        background: "rgba(0,0,0,0.03)",
        border: "1px solid rgba(0,0,0,0.06)",
        borderRadius: 20, padding: "28px 20px 22px",
        textAlign: "center",
        animation: `apFadeUp 0.4s ${idx * 0.04}s both`,
    }}>
        <div style={{ width: 96, height: 96, borderRadius: "50%", background: "rgba(0,169,143,0.06)", margin: "0 auto 18px", animation: "apPulse 1.5s ease-in-out infinite" }} />
        <div style={{ height: 12, background: "rgba(0,0,0,0.07)", borderRadius: 6, width: "62%", margin: "0 auto 8px" }} />
        <div style={{ height: 9, background: "rgba(0,0,0,0.05)", borderRadius: 6, width: "38%", margin: "0 auto" }} />
    </div>
);

const ArtistsPage = () => {
    const isMobile = useIsMobile();
    const { lang } = useLanguageStore();
    const t = artistsText[lang];
    const GENRES = [t.all, ...GENRE_KEYS];

    const [artists,     setArtists]     = useState<Artist[]>([]);
    const [filtered,    setFiltered]    = useState<Artist[]>([]);
    const [loading,     setLoading]     = useState(true);
    const [activeGenre, setActiveGenre] = useState(t.all);
    const [search,      setSearch]      = useState("");
    const [page,        setPage]        = useState(1);
    const [total,       setTotal]       = useState(0);
    const LIMIT = 12;

    useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, []);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const res = await artistService.getAll({ page, limit: LIMIT });
                setArtists(res.data);
                setTotal(res.pagination.total);
            } finally { setLoading(false); }
        })();
    }, [page]);

    useEffect(() => { setActiveGenre(t.all); }, [lang]);

    useEffect(() => {
        let result = [...artists];
        if (activeGenre !== t.all)
            result = result.filter(a => a.genre?.toLowerCase().includes(activeGenre.toLowerCase()));
        if (search.trim())
            result = result.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));
        setFiltered(result);
    }, [artists, activeGenre, search, t.all]);

    const totalPages = Math.ceil(total / LIMIT);

    return (
        <>
        <SEO
            title="Nghệ Sĩ – Won Music"
            description="Khám phá danh sách nghệ sĩ tại Won Music – Pop, Indie, R&B, Hip-hop, Ballad, EDM và nhiều thể loại âm nhạc khác."
            canonical="https://www.wonmusic.vn/artists"
        />
        <div style={{ minHeight: "100vh", background: "#F8F8FC", fontFamily: "'Be Vietnam Pro',sans-serif", color: "#0D0D1A" }}>
            <style>{`
                @keyframes apFadeUp {
                    from { opacity:0; transform:translateY(22px); }
                    to   { opacity:1; transform:translateY(0); }
                }
                @keyframes apPulse { 0%,100%{opacity:.35} 50%{opacity:.75} }
                @keyframes apEq { 0%,100%{transform:scaleY(.2)} 50%{transform:scaleY(1)} }
                @keyframes apVinyl { to{transform:rotate(360deg)} }
                @keyframes apShimmer {
                    0%  {background-position:-200% center}
                    100%{background-position: 200% center}
                }
                @keyframes apDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(.55)} }
                @keyframes apGlow { 0%,100%{opacity:.06} 50%{opacity:.14} }

                /* ── card ── */
                .ap-card {
                    background: rgba(0,0,0,0.03);
                    border: 1px solid rgba(0,0,0,0.07);
                    border-radius: 20px;
                    padding: 28px 18px 20px;
                    text-align: center;
                    text-decoration: none;
                    color: #0D0D1A;
                    display: block;
                    transition: all .3s cubic-bezier(.4,0,.2,1);
                    position: relative;
                    overflow: hidden;
                    cursor: pointer;
                }
                .ap-card::before {
                    content:'';
                    position:absolute; inset:0; border-radius:20px;
                    background: radial-gradient(ellipse at 50% 0%, rgba(0,169,143,0.12) 0%, transparent 65%);
                    opacity:0; transition:opacity .35s;
                }
                .ap-card::after {
                    content:'';
                    position:absolute; bottom:0; left:0; right:0; height:2px;
                    background:linear-gradient(90deg,#00A98F,#34D4B8,#6366F1);
                    background-size:200%;
                    transform:scaleX(0); transition:transform .3s;
                    border-radius:0 0 20px 20px;
                }
                .ap-card:hover { border-color:rgba(0,169,143,.3); transform:translateY(-10px); box-shadow:0 24px 56px rgba(0,169,143,.12),0 8px 24px rgba(0,0,0,.4); }
                .ap-card:hover::before { opacity:1; }
                .ap-card:hover::after { transform:scaleX(1); animation:apShimmer 1.8s linear infinite; }

                /* ── avatar ── */
                .ap-avatar {
                    width:100px; height:100px; border-radius:50%;
                    margin:0 auto 18px;
                    display:flex; align-items:center; justify-content:center;
                    font-family:'Space Grotesk',sans-serif;
                    font-size:30px; font-weight:700; color:#00A98F;
                    border:2.5px solid rgba(0,0,0,0.1);
                    position:relative; transition:all .35s; overflow:hidden;
                }
                .ap-card:hover .ap-avatar {
                    border-color:rgba(0,169,143,.55);
                    box-shadow:0 0 0 6px rgba(0,169,143,.1),0 8px 32px rgba(0,169,143,.25);
                    transform:scale(1.07);
                }
                .ap-ring {
                    position:absolute; inset:-4px; border-radius:50%;
                    border:2px dashed rgba(52,212,184,.5);
                    opacity:0; transition:opacity .3s;
                }
                .ap-card:hover .ap-ring { opacity:1; animation:apVinyl 5s linear infinite; }

                /* ── eq on hover ── */
                .ap-eq {
                    display:flex; align-items:flex-end; justify-content:center;
                    gap:2px; height:18px; margin-top:12px;
                    opacity:0; transition:opacity .3s;
                }
                .ap-card:hover .ap-eq { opacity:1; }
                .ap-eq-bar {
                    width:3px; background:linear-gradient(to top,#00A98F,#34D4B8);
                    border-radius:2px; transform-origin:bottom;
                    animation:apEq ease-in-out infinite;
                }

                /* ── verified badge ── */
                .ap-verified {
                    position:absolute; bottom:0; right:0;
                    width:23px; height:23px; border-radius:50%;
                    background:linear-gradient(135deg,#00A98F,#34D4B8);
                    color:#F8F8FC; font-size:10px; font-weight:800;
                    display:flex; align-items:center; justify-content:center;
                    border:2.5px solid #F8F8FC;
                    box-shadow:0 2px 10px rgba(0,169,143,.55);
                }

                /* ── filter bar ── */
                .ap-genre-btn {
                    padding:6px 14px; border-radius:100px;
                    border:1px solid rgba(0,0,0,0.1);
                    background:transparent; color:rgba(0,0,0,.5);
                    font-family:'Space Grotesk',sans-serif;
                    font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase;
                    cursor:pointer; transition:all .2s; white-space:nowrap;
                }
                .ap-genre-btn:hover { border-color:rgba(0,169,143,.4); color:#34D4B8; background:rgba(0,169,143,.07); }
                .ap-genre-btn.active { background:rgba(0,169,143,.14); border-color:rgba(0,169,143,.5); color:#34D4B8; }

                .ap-search {
                    width:100%; padding:10px 16px 10px 42px;
                    background:rgba(0,0,0,0.05);
                    border:1px solid rgba(0,0,0,0.1); border-radius:10px;
                    font-size:13px; outline:none; color:#0D0D1A;
                    font-family:'Be Vietnam Pro',sans-serif; transition:all .2s;
                }
                .ap-search:focus { border-color:rgba(0,169,143,.5); background:rgba(0,0,0,.04); }
                .ap-search::placeholder { color:rgba(0,0,0,.35); }

                .ap-page-btn {
                    width:34px; height:34px; border-radius:9px;
                    border:1px solid rgba(0,0,0,.1); background:rgba(0,0,0,.04);
                    font-size:13px; cursor:pointer; transition:all .2s;
                    display:flex; align-items:center; justify-content:center; color:rgba(0,0,0,.5);
                    font-family:'Space Grotesk',sans-serif;
                }
                .ap-page-btn:hover:not(:disabled) { border-color:rgba(0,169,143,.4); color:#34D4B8; background:rgba(0,169,143,.08); }
                .ap-page-btn.active { background:rgba(0,169,143,.18); border-color:rgba(0,169,143,.55); color:#34D4B8; font-weight:700; }
                .ap-page-btn:disabled { opacity:.28; cursor:default; }
            `}</style>

            {/* ══════════ HERO ══════════ */}
            <div style={{
                padding: "120px 0 64px",
                background: "linear-gradient(145deg, #F0F2FA 0%, #E8ECF8 35%, #EAE8F8 60%, #ECF0FA 100%)",
                position: "relative", overflow: "hidden",
            }}>
                {/* Subtle grid */}
                <div style={{ position:"absolute", inset:0, opacity:.03, pointerEvents:"none" }}>
                    {[0,1,2,3,4,5,6].map(i => (
                        <div key={i} style={{ position:"absolute", left:`${i*16.5}%`, top:0, bottom:0, width:1, background:"#34D4B8" }} />
                    ))}
                </div>

                {/* Ambient glows */}
                <div style={{ position:"absolute", top:"20%", left:"15%", width:480, height:480, borderRadius:"50%", background:"radial-gradient(circle,rgba(99,102,241,.07) 0%,transparent 65%)", pointerEvents:"none" }} />
                <div style={{ position:"absolute", top:"40%", left:"55%", width:360, height:360, borderRadius:"50%", background:"radial-gradient(circle,rgba(0,169,143,.07) 0%,transparent 65%)", pointerEvents:"none" }} />

                {/* Vinyl decoration — right side */}
                <div style={{ position:"absolute", right:-120, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
                    {/* Outer rings */}
                    <div style={{ position:"absolute", inset:-32, borderRadius:"50%", border:"1px dashed rgba(0,169,143,.1)", animation:"apVinyl 25s linear infinite" }} />
                    <div style={{ position:"absolute", inset:-16, borderRadius:"50%", border:"1px dashed rgba(0,169,143,.06)", animation:"apVinyl 18s linear infinite reverse" }} />
                    {/* Disc */}
                    <div style={{
                        width:480, height:480, borderRadius:"50%",
                        background:"conic-gradient(from 0deg,#D8DCF0,rgba(0,169,143,.2),#C8CEE8,#D8DCF0,#D0D4EC,rgba(52,212,184,.15),#D8DCF0)",
                        opacity:.35, animation:"apVinyl 30s linear infinite",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        boxShadow:"0 0 80px rgba(0,169,143,.08) inset",
                    }}>
                        <div style={{ width:160, height:160, borderRadius:"50%", background:"rgba(0,169,143,.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <div style={{ width:44, height:44, borderRadius:"50%", background:"#030710", opacity:.8 }} />
                        </div>
                    </div>
                    {/* Groove rings */}
                    {[0.58, 0.68, 0.78, 0.88].map((r, i) => (
                        <div key={i} style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:`${r*480}px`, height:`${r*480}px`, borderRadius:"50%", border:"1px solid rgba(0,0,0,.07)" }} />
                    ))}
                </div>

                {/* Content */}
                <div style={{ maxWidth:1440, margin:"0 auto", padding:"0 32px", position:"relative", zIndex:2 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:18, animation:"apFadeUp .4s both" }}>
                        <span style={{ width:6, height:6, borderRadius:"50%", background:"#34D4B8", display:"inline-block", animation:"apDot 1.6s ease-in-out infinite" }} />
                        <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:10, letterSpacing:"2.5px", textTransform:"uppercase", color:"#34D4B8", fontWeight:700 }}>
                            {t.label}
                        </span>
                    </div>

                    <h1 style={{
                        fontFamily:"'Be Vietnam Pro',sans-serif",
                        fontSize:"clamp(52px,9vw,104px)",
                        lineHeight:.96, letterSpacing:-1,
                        color:"#0D0D1A", marginBottom:18,
                        animation:"apFadeUp .4s .06s both",
                        maxWidth:700,
                    }}>
                        {t.heading}<br />
                        <span style={{ color:"#34D4B8" }}>{t.highlight}</span>
                    </h1>

                    <p style={{ fontSize:15, color:"rgba(0,0,0,.55)", maxWidth:440, lineHeight:1.8, animation:"apFadeUp .4s .12s both" }}>
                        {t.subtitle}
                    </p>

                    {/* Stats row */}
                    <div style={{ display:"flex", alignItems:"center", gap:24, marginTop:28, animation:"apFadeUp .4s .18s both" }}>
                        <div>
                            <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:22, fontWeight:700, color:"#0D0D1A" }}>{total}</span>
                            <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:11, color:"rgba(0,0,0,.4)", marginLeft:6, textTransform:"uppercase", letterSpacing:"1.5px" }}>{t.artistCount}</span>
                        </div>
                        <span style={{ width:1, height:20, background:"rgba(0,0,0,.1)" }} />
                        <div style={{ display:"flex", alignItems:"flex-end", gap:2.5, height:28 }}>
                            {[35,62,48,80,42,70,55,88,45,60,75,38,65,50,44].map((h, i) => (
                                <div key={i} style={{
                                    width:3.5, height:`${h}%`,
                                    background:`rgba(0,169,143,${.25+(i%3)*.1})`,
                                    borderRadius:2, transformOrigin:"bottom",
                                    animation:`apEq ${.38+(i%5)*.14}s ease-in-out infinite`,
                                    animationDelay:`${i*.06}s`,
                                }} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════════ STICKY FILTER BAR ══════════ */}
            <div style={{
                position:"sticky", top:60, zIndex:30,
                background:"rgba(248,248,252,0.96)",
                backdropFilter:"blur(20px)",
                borderBottom:"1px solid rgba(0,169,143,.1)",
                padding:"10px 0",
            }}>
                <div style={{ maxWidth:1440, margin:"0 auto", padding: isMobile ? "0 16px" : "0 32px", display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                    {/* Search */}
                    <div style={{ position:"relative", flex: isMobile ? "1 1 auto" : "0 0 220px", minWidth: isMobile ? 0 : undefined }}>
                        <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"rgba(0,0,0,.35)", fontSize:12 }}>🔍</span>
                        <input className="ap-search" placeholder={t.searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)} />
                    </div>

                    {/* Genre tabs */}
                    <div style={{ display:"flex", gap:5, flexWrap:"wrap", flex:1 }}>
                        {GENRES.map(g => (
                            <button key={g} className={`ap-genre-btn ${activeGenre === g ? "active" : ""}`} onClick={() => setActiveGenre(g)}>
                                {g}
                            </button>
                        ))}
                    </div>

                    <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:11, color:"rgba(0,0,0,.4)", flexShrink:0 }}>
                        <span style={{ color:"#34D4B8", fontWeight:700 }}>{filtered.length}</span> {t.artistCount}
                    </span>
                </div>
            </div>

            {/* ══════════ GRID ══════════ */}
            <div style={{ maxWidth:1440, margin:"0 auto", padding: isMobile ? "24px 16px 60px" : "44px 32px 80px" }}>
                {loading ? (
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:16 }}>
                        {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} idx={i} />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign:"center", padding:"80px 0" }}>
                        <div style={{ fontSize:52, marginBottom:16, opacity:.2 }}>♪</div>
                        <p style={{ fontSize:14, color:"rgba(0,0,0,.4)" }}>{t.noArtists}</p>
                    </div>
                ) : (
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:16 }}>
                        {filtered.map((artist, idx) => (
                            <Link
                                href={`/artists/${artist._id}`}
                                key={artist._id}
                                className="ap-card"
                                style={{ animationDelay:`${idx * .04}s`, animation:"apFadeUp .45s both" }}
                            >
                                {/* Avatar */}
                                <div style={{ position:"relative", width:100, margin:"0 auto 18px" }}>
                                    <div className="ap-avatar" style={{ background:AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length] }}>
                                        {artist.avatar ? (
                                            <img
                                                src={artist.avatar} alt={artist.name}
                                                style={{ width:"100%", height:"100%", objectFit:"cover" }}
                                                onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                                            />
                                        ) : getInitials(artist.name)}
                                        <div className="ap-ring" />
                                        {artist.verified && <div className="ap-verified">✓</div>}
                                    </div>
                                </div>

                                {/* Name */}
                                <p style={{ fontSize:14, fontWeight:600, color:"#0D0D1A", marginBottom:6, letterSpacing:"-.1px", lineHeight:1.3 }}>
                                    {artist.name}
                                </p>

                                {/* Genre tag */}
                                <div style={{
                                    display:"inline-block",
                                    fontFamily:"'Space Grotesk',sans-serif",
                                    fontSize:9, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase",
                                    color:"#34D4B8", background:"rgba(0,169,143,.1)",
                                    border:"1px solid rgba(0,169,143,.22)",
                                    padding:"3px 10px", borderRadius:100, marginBottom:14,
                                }}>
                                    {artist.genre ?? "—"}
                                </div>

                                {/* Followers */}
                                <div>
                                    <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:17, fontWeight:700, color:"#0D0D1A", letterSpacing:"-.5px" }}>
                                        {formatFollowers(artist.followers)}
                                    </span>
                                    <br />
                                    <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:9, color:"rgba(0,0,0,.4)", textTransform:"uppercase", letterSpacing:"1.5px" }}>
                                        Followers
                                    </span>
                                </div>

                                {/* EQ on hover */}
                                <div className="ap-eq">
                                    {[38,72,52,88,44,78,58,92,48].map((h, i) => (
                                        <div key={i} className="ap-eq-bar" style={{
                                            height:`${h}%`,
                                            animationDuration:`${.38+(i%4)*.14}s`,
                                            animationDelay:`${i*.055}s`,
                                        }} />
                                    ))}
                                </div>

                                {/* Hover hint */}
                                <div style={{
                                    fontSize:11, fontWeight:600, color:"#34D4B8",
                                    marginTop:12, opacity:0, transform:"translateY(6px)",
                                    transition:"all .25s",
                                    display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                                    fontFamily:"'Space Grotesk',sans-serif",
                                }} className="ap-hint">
                                    {t.viewArtist}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:6, marginTop:52 }}>
                        <button className="ap-page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
                        {Array.from({ length: totalPages }).map((_, i) => (
                            <button key={i} className={`ap-page-btn ${page === i+1 ? "active" : ""}`} onClick={() => setPage(i+1)}>
                                {i + 1}
                            </button>
                        ))}
                        <button className="ap-page-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>›</button>
                    </div>
                )}
            </div>
        </div>
        </>
    );
};

export default ArtistsPage;
