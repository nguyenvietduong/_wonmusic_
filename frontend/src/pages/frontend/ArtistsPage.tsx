'use client';
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { artistService, type Artist } from "@/services/artistService";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
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

const EQ_H = [22,38,28,50,35,60,42,72,30,55,65,28,48,38,70,32,52,42,62,36];

const getInitials = (name: string) =>
    name.split(" ").slice(-2).map(w => w[0]).join("").toUpperCase();

const formatFollowers = (num?: number) => {
    if (!num) return "0";
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000)     return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
};

const SkeletonCard = ({ idx }: { idx: number }) => (
    <div style={{
        background: "#fff",
        border: "1px solid rgba(0,0,0,0.07)",
        borderRadius: 16,
        overflow: "hidden",
        animation: `apFadeUp 0.4s ${idx * 0.04}s both`,
    }}>
        <div style={{ paddingTop: "70%", background: "rgba(0,169,143,0.05)", animation: "apPulse 1.5s ease-in-out infinite" }} />
        <div style={{ padding: "14px 16px 16px" }}>
            <div style={{ height: 11, background: "rgba(0,0,0,0.07)", borderRadius: 6, width: "65%", marginBottom: 8 }} />
            <div style={{ height: 9, background: "rgba(0,0,0,0.05)", borderRadius: 6, width: "38%" }} />
        </div>
    </div>
);

const ArtistsPage = () => {
    const isMobile = useIsMobile();
    const { lang } = useLanguageStore();
    const { artistsSeoTitleVi, artistsSeoTitleEn, artistsSeoDescVi, artistsSeoDescEn } = useSettingsStore();
    const t = artistsText[lang];
    const GENRES = [t.all, ...GENRE_KEYS];
    const router = useRouter();
    const touchStart = useRef<{ x: number; y: number } | null>(null);

    const [artists,     setArtists]     = useState<Artist[]>([]);
    const [filtered,    setFiltered]    = useState<Artist[]>([]);
    const [loading,     setLoading]     = useState(true);
    const [fetchError,  setFetchError]  = useState(false);
    const [retryCount,  setRetryCount]  = useState(0);
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
                setFetchError(false);
                const res = await artistService.getAll({ page, limit: LIMIT });
                setArtists(res.data);
                setTotal(res.pagination.total);
            } catch {
                setFetchError(true);
            } finally { setLoading(false); }
        })();
    }, [page, retryCount]);

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
            title={(lang === "en" ? artistsSeoTitleEn : artistsSeoTitleVi) || "Nghệ Sĩ – Won Music"}
            description={(lang === "en" ? artistsSeoDescEn : artistsSeoDescVi) || "Khám phá danh sách nghệ sĩ tại Won Music – Pop, Indie, R&B, Hip-hop, Ballad, EDM và nhiều thể loại âm nhạc khác."}
            canonical="https://www.wonmusic.vn/artists"
        />
        <div style={{ minHeight: "100vh", background: "#F8F8FC", fontFamily: "'Be Vietnam Pro',sans-serif", color: "#0D0D1A" }}>
            <style>{`
                @keyframes apFadeUp {
                    from { opacity:0; transform:translateY(18px); }
                    to   { opacity:1; transform:translateY(0); }
                }
                @keyframes apPulse { 0%,100%{opacity:.35} 50%{opacity:.75} }

                /* ── artist mesh card ── */
                .ap-card {
                    background: #fff;
                    border: 1px solid rgba(0,0,0,0.08);
                    border-radius: 16px;
                    overflow: hidden;
                    text-decoration: none;
                    color: #0D0D1A;
                    display: block;
                    position: relative;
                    cursor: pointer;
                    touch-action: manipulation;
                    -webkit-tap-highlight-color: transparent;
                    transition: transform 0.35s cubic-bezier(.4,0,.2,1), box-shadow 0.35s ease, border-color 0.4s ease;
                }
                .ap-card:hover {
                    transform: translateY(-6px);
                    box-shadow: 0 20px 48px rgba(0,169,143,0.10), 0 4px 16px rgba(0,0,0,0.06);
                    border-color: transparent;
                }

                /* Yellow dot indicator */
                .ap-card::after {
                    content: '';
                    position: absolute;
                    top: 12px; right: 12px;
                    width: 7px; height: 7px;
                    border-radius: 50%;
                    background: #fcd34d;
                    box-shadow: 0 0 10px rgba(252,211,77,0.7);
                    opacity: 0;
                    transform: scale(0.4);
                    transition: opacity 0.35s ease, transform 0.35s cubic-bezier(0.34,1.56,0.64,1);
                    z-index: 3;
                    pointer-events: none;
                }
                .ap-card:hover::after { opacity: 1; transform: scale(1); }

                /* Gradient border sweep */
                .ap-card-border {
                    position: absolute;
                    inset: 0;
                    border-radius: 16px;
                    padding: 1.5px;
                    background: linear-gradient(
                        120deg,
                        transparent 0%,
                        #00A98F 20%,
                        #34D4B8 50%,
                        #00A98F 80%,
                        transparent 100%
                    );
                    -webkit-mask:
                        linear-gradient(#fff 0 0) content-box,
                        linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor;
                    mask-composite: exclude;
                    opacity: 0;
                    transition: opacity 0.45s ease;
                    pointer-events: none;
                    z-index: 2;
                }
                .ap-card:hover .ap-card-border { opacity: 1; }

                /* Avatar area */
                .ap-avatar-wrap {
                    position: relative;
                    width: 100%;
                    padding-top: 72%;
                    overflow: hidden;
                    background: linear-gradient(135deg,#E8ECF8,#D8DFF0);
                    transition: transform 0.4s ease;
                }
                .ap-card:hover .ap-avatar-wrap { transform: scale(1.04); }
                .ap-avatar-img {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .ap-avatar-initials {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: 'Space Grotesk', sans-serif;
                    font-size: 28px;
                    font-weight: 700;
                    color: #00A98F;
                }

                /* Verified badge */
                .ap-verified {
                    position: absolute;
                    bottom: 10px; right: 10px;
                    width: 22px; height: 22px;
                    border-radius: 50%;
                    background: linear-gradient(135deg,#00A98F,#34D4B8);
                    color: #fff;
                    font-size: 10px; font-weight: 800;
                    display: flex; align-items: center; justify-content: center;
                    border: 2px solid #fff;
                    box-shadow: 0 2px 8px rgba(0,169,143,.4);
                    z-index: 2;
                }

                /* Card body */
                .ap-card-body {
                    padding: 14px 16px 16px;
                    position: relative;
                    z-index: 1;
                }

                /* ── filter bar inputs ── */
                .ap-genre-btn {
                    padding: 6px 13px;
                    border-radius: 100px;
                    border: 1px solid rgba(0,0,0,0.12);
                    background: transparent;
                    color: rgba(0,0,0,.65);
                    font-family: 'Space Grotesk', sans-serif;
                    font-size: 10px; font-weight: 700;
                    letter-spacing: 1.2px; text-transform: uppercase;
                    cursor: pointer; transition: all .2s; white-space: nowrap;
                }
                .ap-genre-btn:hover { border-color: rgba(0,169,143,.4); color: #00A98F; background: rgba(0,169,143,.07); }
                .ap-genre-btn.active { background: rgba(0,169,143,.12); border-color: rgba(0,169,143,.45); color: #00A98F; }

                .ap-search {
                    width: 100%;
                    padding: 9px 16px 9px 40px;
                    background: rgba(0,0,0,0.04);
                    border: 1px solid rgba(0,0,0,0.10);
                    border-radius: 10px;
                    font-size: 13px; outline: none;
                    color: #0D0D1A;
                    font-family: 'Be Vietnam Pro', sans-serif;
                    transition: all .2s;
                }
                .ap-search:focus { border-color: rgba(0,169,143,.5); background: rgba(0,0,0,.03); }
                .ap-search::placeholder { color: rgba(0,0,0,.5); }

                .ap-genre-select {
                    flex: 1 1 auto;
                    padding: 9px 34px 9px 13px;
                    background: rgba(0,0,0,0.04);
                    border: 1px solid rgba(0,0,0,0.10);
                    border-radius: 10px;
                    font-size: 12px; font-weight: 700; letter-spacing: .5px;
                    color: #0D0D1A;
                    font-family: 'Space Grotesk', sans-serif;
                    outline: none; cursor: pointer;
                    appearance: none; -webkit-appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%2334D4B8' d='M5 7L0 2h10z'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 12px center;
                    transition: border-color .2s;
                }
                .ap-genre-select:focus { border-color: rgba(0,169,143,.5); }

                .ap-page-btn {
                    width: 34px; height: 34px;
                    border-radius: 9px;
                    border: 1px solid rgba(0,0,0,.10);
                    background: rgba(0,0,0,.04);
                    font-size: 13px; cursor: pointer;
                    transition: all .2s;
                    display: flex; align-items: center; justify-content: center;
                    color: rgba(0,0,0,.5);
                    font-family: 'Space Grotesk', sans-serif;
                }
                .ap-page-btn:hover:not(:disabled) { border-color: rgba(0,169,143,.4); color: #00A98F; background: rgba(0,169,143,.08); }
                .ap-page-btn.active { background: rgba(0,169,143,.15); border-color: rgba(0,169,143,.5); color: #00A98F; font-weight: 700; }
                .ap-page-btn:disabled { opacity: .28; cursor: default; }
            `}</style>

            {/* ══════════ HERO ══════════ */}
            <div style={{
                position: "relative",
                overflow: "hidden",
                height: isMobile ? 220 : 300,
                backgroundImage: "url('/partner-bg.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
            }}>
                {/* Subtle teal glow */}
                <div style={{ position:"absolute", top:"-20%", right:"-5%", width:460, height:460, borderRadius:"50%", background:"radial-gradient(circle,rgba(0,169,143,0.10),transparent 65%)", pointerEvents:"none" }} />

                {/* EQ bars */}
                <div style={{ position:"absolute", bottom:0, left:0, right:0, display:"flex", alignItems:"flex-end", gap:2, height: isMobile ? 28 : 40, opacity:.13, pointerEvents:"none" }}>
                    {EQ_H.map((h, i) => (
                        <div key={i} style={{ flex:1, height:`${h}%`, background:"#00A98F", borderRadius:"2px 2px 0 0" }} />
                    ))}
                </div>

                {/* Content */}
                <div style={{ maxWidth:1440, margin:"0 auto", padding:`${isMobile ? 76 : 82}px 32px ${isMobile ? 24 : 28}px`, position:"relative", zIndex:2 }}>
                    {/* Eyebrow */}
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                        <span style={{ width:24, height:2, background:"#00A98F", borderRadius:2, display:"block" }} />
                        <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", color:"#00A98F" }}>
                            {t.label}
                        </span>
                    </div>

                    {/* Heading */}
                    <h1 style={{
                        fontFamily: "'Be Vietnam Pro', sans-serif",
                        fontSize: isMobile ? "clamp(22px,6vw,28px)" : "clamp(24px,2.8vw,36px)",
                        lineHeight: 1.15,
                        letterSpacing: "-0.5px",
                        color: "#0D0D1A",
                        margin: 0,
                        textTransform: "uppercase"
                    }}>
                        <b>
                            {t.heading}{" "}
                            <span style={{ color:"#00A98F" }}>{t.highlight}</span>
                        </b>
                    </h1>

                    {/* Stats + divider */}
                    <div style={{ display:"flex", alignItems:"center", gap:16, marginTop:14 }}>
                        <div style={{ width:48, height:2, background:"linear-gradient(90deg,#00A98F,#34D4B8)", borderRadius:2 }} />
                        {total > 0 && (
                            <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:11, color:"rgba(0,0,0,.45)", letterSpacing:"1px" }}>
                                <span style={{ color:"#00A98F", fontWeight:700 }}>{total}</span> {t.artistCount}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* ══════════ STICKY FILTER BAR ══════════ */}
            <div style={{
                position: "sticky", top: 60, zIndex: 30,
                background: "rgba(248,248,252,0.96)",
                backdropFilter: "blur(20px)",
                borderBottom: "1px solid rgba(0,169,143,.08)",
                padding: "10px 0",
            }}>
                <div style={{ maxWidth:1440, margin:"0 auto", padding: isMobile ? "0 16px" : "0 32px", display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                    {/* Search */}
                    <div style={{ position:"relative", flex: isMobile ? "1 1 auto" : "0 0 210px" }}>
                        <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color:"rgba(0,0,0,.35)", fontSize:12 }}>🔍</span>
                        <input className="ap-search" placeholder={t.searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)} />
                    </div>

                    {/* Genre filter */}
                    {isMobile ? (
                        <select
                            className="ap-genre-select"
                            value={activeGenre}
                            onChange={e => setActiveGenre(e.target.value)}
                            style={{ color: activeGenre !== t.all ? "#00A98F" : "#0D0D1A", borderColor: activeGenre !== t.all ? "rgba(0,169,143,.5)" : undefined }}
                        >
                            {GENRES.map(g => (
                                <option key={g} value={g}>{g}</option>
                            ))}
                        </select>
                    ) : (
                        <div style={{ display:"flex", gap:5, flexWrap:"wrap", flex:1 }}>
                            {GENRES.map(g => (
                                <button key={g} className={`ap-genre-btn ${activeGenre === g ? "active" : ""}`} onClick={() => setActiveGenre(g)}>
                                    {g}
                                </button>
                            ))}
                        </div>
                    )}

                    <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:11, color:"rgba(0,0,0,.6)", flexShrink:0 }}>
                        <span style={{ color:"#00A98F", fontWeight:700 }}>{filtered.length}</span> {t.artistCount}
                    </span>
                </div>
            </div>

            {/* ══════════ GRID ══════════ */}
            <div style={{ maxWidth:1440, margin:"0 auto", padding: isMobile ? "24px 16px 60px" : "44px 32px 80px" }}>
                {loading ? (
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:16 }}>
                        {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} idx={i} />)}
                    </div>
                ) : fetchError ? (
                    <div style={{ textAlign:"center", padding:"80px 0" }}>
                        <div style={{ fontSize:48, marginBottom:16, opacity:.2 }}>⚠</div>
                        <p style={{ fontSize:14, color:"rgba(0,0,0,.4)", marginBottom:16 }}>{t.error}</p>
                        <button
                            className="btn-outline-music"
                            onClick={() => setRetryCount(c => c + 1)}
                            style={{ cursor:"pointer" }}
                        >
                            {t.retry}
                        </button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign:"center", padding:"80px 0" }}>
                        <div style={{ fontSize:48, marginBottom:16, opacity:.2 }}>♪</div>
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
                                onTouchStart={(e) => {
                                    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                                }}
                                onTouchEnd={(e) => {
                                    if (!touchStart.current) return;
                                    const dx = Math.abs(e.changedTouches[0].clientX - touchStart.current.x);
                                    const dy = Math.abs(e.changedTouches[0].clientY - touchStart.current.y);
                                    touchStart.current = null;
                                    if (dx < 10 && dy < 10) {
                                        e.preventDefault();
                                        router.push(`/artists/${artist._id}`);
                                    }
                                }}
                            >
                                <span className="ap-card-border" />

                                {/* Avatar */}
                                <div className="ap-avatar-wrap" style={{ background: AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length] }}>
                                    {artist.avatar ? (
                                        <img
                                            src={artist.avatar}
                                            alt={artist.name}
                                            className="ap-avatar-img"
                                            onError={e => {
                                                (e.currentTarget as HTMLImageElement).style.display = "none";
                                                const parent = e.currentTarget.parentElement;
                                                if (parent) {
                                                    const initials = document.createElement("div");
                                                    initials.className = "ap-avatar-initials";
                                                    initials.textContent = getInitials(artist.name);
                                                    parent.appendChild(initials);
                                                }
                                            }}
                                        />
                                    ) : (
                                        <div className="ap-avatar-initials">{getInitials(artist.name)}</div>
                                    )}
                                    {artist.verified && (
                                        <div className="ap-verified">✓</div>
                                    )}
                                </div>

                                {/* Body */}
                                <div className="ap-card-body">
                                    {/* Name */}
                                    <p style={{ fontSize:14, fontWeight:700, color:"#0D0D1A", margin:"0 0 6px", lineHeight:1.3, letterSpacing:"-.1px" }}>
                                        {artist.name}
                                    </p>

                                    {/* Genre tag */}
                                    <span style={{
                                        display: "inline-block",
                                        fontFamily: "'Space Grotesk',sans-serif",
                                        fontSize: 9, fontWeight: 700,
                                        letterSpacing: "1.4px", textTransform: "uppercase",
                                        color: "#00A98F",
                                        background: "rgba(0,169,143,.08)",
                                        border: "1px solid rgba(0,169,143,.20)",
                                        padding: "3px 9px",
                                        borderRadius: 100,
                                        marginBottom: 10,
                                    }}>
                                        {artist.genre ?? "—"}
                                    </span>

                                    {/* Followers row */}
                                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                                        <div>
                                            <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:16, fontWeight:700, color:"#0D0D1A", letterSpacing:"-.4px" }}>
                                                {formatFollowers(artist.followers)}
                                            </span>
                                            <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:9, color:"rgba(0,0,0,.38)", textTransform:"uppercase", letterSpacing:"1.4px", marginLeft:5 }}>
                                                Followers
                                            </span>
                                        </div>

                                        {/* Arrow */}
                                        <svg viewBox="0 0 24 24" fill="none" stroke="#00A98F" strokeWidth="2.5" width="14" height="14" strokeLinecap="round" strokeLinejoin="round" style={{ opacity:.6, flexShrink:0 }}>
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                            <polyline points="12 5 19 12 12 19" />
                                        </svg>
                                    </div>
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
