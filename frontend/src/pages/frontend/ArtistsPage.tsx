// src/pages/ArtistsPage.tsx
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { artistService, type Artist } from "@/services/artistService";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { artistsText } from "@/locales/artists";
import SEO from "@/components/frontend/SEO";

const GENRE_KEYS = ["Pop", "Indie", "R&B", "Hip-hop", "Ballad", "EDM", "Folk"];

const AVATAR_GRADIENTS = [
    "linear-gradient(135deg,#bbf7d0,#4ade80)",
    "linear-gradient(135deg,#86efac,#16a34a)",
    "linear-gradient(135deg,#dcfce7,#22c55e)",
    "linear-gradient(135deg,#a7f3d0,#059669)",
    "linear-gradient(135deg,#d1fae5,#10b981)",
    "linear-gradient(135deg,#ecfdf5,#4ade80)",
];

const NOTES = ["♩","♪","♫","♬","𝄞","𝄢"];

const getInitials = (name: string) =>
    name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase();

const formatFollowers = (num?: number) => {
    if (!num) return "0";
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000)     return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
};

const SkeletonCard = ({ idx }: { idx: number }) => (
    <div style={{
        background: "#fff", border: "1px solid #e5e7eb",
        borderRadius: 20, padding: 28, textAlign: "center",
        animation: `apFadeUp 0.4s ${idx * 0.05}s both`,
    }}>
        <div style={{ width: 96, height: 96, borderRadius: "50%", background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", margin: "0 auto 16px", animation: "apPulse 1.5s ease-in-out infinite" }} />
        <div style={{ height: 14, background: "#f0fdf4", borderRadius: 6, width: "60%", margin: "0 auto 8px" }} />
        <div style={{ height: 12, background: "#f0fdf4", borderRadius: 6, width: "40%", margin: "0 auto" }} />
    </div>
);

const ArtistsPage = () => {
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
    const notesBgRef                    = useRef<HTMLDivElement>(null);
    const LIMIT = 12;

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    // ── Floating notes ──
    useEffect(() => {
        const spawn = () => {
            if (!notesBgRef.current) return;
            const el = document.createElement("div");
            el.textContent = NOTES[Math.floor(Math.random() * NOTES.length)];
            const dur = 8 + Math.random() * 6;
            el.style.cssText = `
                position:absolute;
                left:${Math.random() * 100}%;
                bottom:-30px;
                font-size:${14 + Math.random() * 16}px;
                color:${Math.random() > .5 ? "rgba(74,222,128,0.5)" : "rgba(22,163,74,0.35)"};
                pointer-events:none;
                user-select:none;
                animation: noteFloat ${dur}s linear forwards;
            `;
            notesBgRef.current.appendChild(el);
            setTimeout(() => el.remove(), dur * 1000);
        };
        spawn();
        const id = setInterval(spawn, 800);
        return () => clearInterval(id);
    }, []);

    // ── Fetch ──
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await artistService.getAll({ page, limit: LIMIT });
                setArtists(res.data);
                setTotal(res.pagination.total);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [page]);

    // Reset genre filter when language changes
    useEffect(() => {
        setActiveGenre(t.all);
    }, [lang]);

    // ── Filter ──
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
        <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Be Vietnam Pro', sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');

                @keyframes noteFloat {
                    0%   { transform: translateY(0) rotate(0deg); opacity: 0; }
                    10%  { opacity: 1; }
                    90%  { opacity: 0.6; }
                    100% { transform: translateY(-500px) rotate(30deg); opacity: 0; }
                }
                @keyframes apFadeUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes apPulse {
                    0%,100% { opacity: 0.5; }
                    50%     { opacity: 1; }
                }
                @keyframes eqBar {
                    0%,100% { transform: scaleY(0.3); }
                    50%     { transform: scaleY(1); }
                }
                @keyframes vinylSpin {
                    to { transform: rotate(360deg); }
                }
                @keyframes shimmer {
                    0%   { background-position: -200% center; }
                    100% { background-position:  200% center; }
                }
                @keyframes dotPulse {
                    0%,100% { transform: scale(1); opacity: 1; }
                    50%     { transform: scale(0.6); opacity: 0.4; }
                }

                /* ── Card ── */
                .ap-card {
                    background: #fff;
                    border: 1px solid #e5e7eb;
                    border-radius: 20px;
                    padding: 32px 24px 24px;
                    text-align: center;
                    text-decoration: none;
                    color: inherit;
                    display: block;
                    transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                }
                .ap-card::after {
                    content: '';
                    position: absolute; bottom: 0; left: 0; right: 0;
                    height: 3px;
                    background: linear-gradient(90deg,#16a34a,#4ade80,#16a34a);
                    background-size: 200%;
                    transform: scaleX(0);
                    transition: transform 0.3s;
                }
                .ap-card:hover {
                    border-color: rgba(22,163,74,0.3);
                    transform: translateY(-8px);
                    box-shadow: 0 20px 48px rgba(22,163,74,0.12), 0 4px 16px rgba(0,0,0,0.06);
                }
                .ap-card:hover::after {
                    transform: scaleX(1);
                    animation: shimmer 1.5s linear infinite;
                }

                /* ── Avatar ── */
                .ap-avatar {
                    width: 96px; height: 96px;
                    border-radius: 50%;
                    margin: 0 auto 16px;
                    display: flex; align-items: center; justify-content: center;
                    font-family: 'Barlow Condensed', sans-serif;
                    font-size: 32px; color: #166534;
                    border: 3px solid rgba(22,163,74,0.2);
                    position: relative;
                    transition: all 0.3s;
                    overflow: hidden;
                    box-shadow: 0 4px 16px rgba(22,163,74,0.12);
                }
                .ap-card:hover .ap-avatar {
                    border-color: rgba(22,163,74,0.5);
                    box-shadow: 0 8px 28px rgba(22,163,74,0.25);
                    transform: scale(1.06);
                }

                /* ── Vinyl ring ── */
                .ap-vinyl-ring {
                    position: absolute; inset: -3px;
                    border-radius: 50%;
                    border: 2px dashed rgba(22,163,74,0.3);
                    opacity: 0;
                    transition: opacity 0.3s;
                }
                .ap-card:hover .ap-vinyl-ring {
                    opacity: 1;
                    animation: vinylSpin 4s linear infinite;
                }

                /* ── Equalizer ── */
                .ap-eq {
                    display: flex; align-items: flex-end;
                    justify-content: center; gap: 2px;
                    height: 20px; margin-top: 10px;
                    opacity: 0; transition: opacity 0.3s;
                }
                .ap-card:hover .ap-eq { opacity: 1; }
                .ap-eq-bar {
                    width: 3px; background: #16a34a;
                    border-radius: 2px; transform-origin: bottom;
                    animation: eqBar ease-in-out infinite;
                }

                /* ── Verified ── */
                .ap-verified {
                    position: absolute; bottom: 0; right: 0;
                    width: 24px; height: 24px; border-radius: 50%;
                    background: #16a34a; color: #fff;
                    font-size: 12px; font-weight: 600;
                    display: flex; align-items: center; justify-content: center;
                    border: 2px solid #fff;
                    box-shadow: 0 2px 8px rgba(22,163,74,0.4);
                }

                /* ── Text ── */
                .ap-name {
                    font-size: 15px; font-weight: 600;
                    color: #111827; margin-bottom: 5px;
                    letter-spacing: -0.2px;
                }
                .ap-genre-tag {
                    display: inline-block;
                    font-size: 11px; color: #16a34a;
                    background: #f0fdf4;
                    border: 1px solid rgba(22,163,74,0.2);
                    padding: 3px 10px; border-radius: 100px;
                    margin-bottom: 14px; font-weight: 500;
                }
                .ap-stat strong {
                    display: block; font-size: 18px;
                    font-weight: 600; color: #111827;
                    letter-spacing: -0.5px;
                }
                .ap-stat span {
                    font-size: 10px; color: #9ca3af;
                    text-transform: uppercase; letter-spacing: 0.5px;
                }

                /* ── Hint ── */
                .ap-hint {
                    font-size: 12px; font-weight: 500;
                    color: #16a34a; margin-top: 12px;
                    opacity: 0; transform: translateY(6px);
                    transition: all 0.25s;
                    display: flex; align-items: center;
                    justify-content: center; gap: 6px;
                }
                .ap-hint::before {
                    content: '';
                    width: 16px; height: 1px; background: #16a34a;
                }
                .ap-card:hover .ap-hint { opacity: 1; transform: translateY(0); }

                /* ── Filter ── */
                .ap-genre-btn {
                    padding: 8px 18px; border-radius: 100px;
                    border: 1.5px solid #e5e7eb;
                    background: transparent; color: #6b7280;
                    font-size: 13px; cursor: pointer;
                    transition: all 0.2s;
                    font-family: 'Be Vietnam Pro', sans-serif;
                    white-space: nowrap;
                }
                .ap-genre-btn:hover { border-color: #16a34a; color: #16a34a; background: #f0fdf4; }
                .ap-genre-btn.active {
                    background: #16a34a; border-color: #16a34a;
                    color: #fff; font-weight: 500;
                    box-shadow: 0 4px 12px rgba(22,163,74,0.3);
                }

                /* ── Search ── */
                .ap-search {
                    width: 100%; padding: 11px 16px 11px 44px;
                    border: 1.5px solid #e5e7eb; border-radius: 100px;
                    font-size: 14px; outline: none;
                    font-family: 'Be Vietnam Pro', sans-serif;
                    transition: all 0.2s; background: #fff; color: #111827;
                }
                .ap-search:focus {
                    border-color: #16a34a;
                    box-shadow: 0 0 0 3px rgba(22,163,74,0.1);
                }
                .ap-search::placeholder { color: #9ca3af; }

                /* ── Pagination ── */
                .ap-page-btn {
                    width: 36px; height: 36px; border-radius: 50%;
                    border: 1px solid #e5e7eb; background: #fff;
                    font-size: 13px; cursor: pointer;
                    transition: all 0.2s;
                    display: flex; align-items: center; justify-content: center;
                    color: #374151;
                }
                .ap-page-btn:hover:not(:disabled) { border-color: #16a34a; color: #16a34a; }
                .ap-page-btn.active { background: #16a34a; border-color: #16a34a; color: #fff; }
                .ap-page-btn:disabled { opacity: 0.3; cursor: default; }
            `}</style>

            {/* ── Hero ── */}
            <div style={{
                padding: "100px 0 70px",
                backgroundImage: "url('/setups/banners/artist.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                position: "relative",
                overflow: "hidden",
            }}>
                {/* Overlay */}
                <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(135deg, rgba(0,0,0,0.72) 0%, rgba(0,30,15,0.6) 60%, rgba(0,0,0,0.25) 100%)",
                }} />

                {/* Floating notes */}
                <div ref={notesBgRef} style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }} />

                {/* Sound wave decoration */}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, opacity: 0.15 }}>
                    <svg viewBox="0 0 1440 60" fill="none" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
                        <path d="M0,30 Q60,10 120,30 Q180,50 240,30 Q300,10 360,30 Q420,50 480,30 Q540,10 600,30 Q660,50 720,30 Q780,10 840,30 Q900,50 960,30 Q1020,10 1080,30 Q1140,50 1200,30 Q1260,10 1320,30 Q1380,50 1440,30"
                            stroke="#4ade80" strokeWidth="2" fill="none"/>
                    </svg>
                </div>

                <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 48px", position: "relative", zIndex: 1 }}>
                    {/* Live dot */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                        <span style={{
                            width: 8, height: 8, borderRadius: "50%", background: "#4ade80",
                            display: "inline-block",
                            animation: "dotPulse 1.5s ease-in-out infinite",
                        }} />
                        <span style={{ fontSize: 11, letterSpacing: "2.5px", textTransform: "uppercase", color: "#4ade80", fontWeight: 600 }}>
                            {t.label}
                        </span>
                    </div>

                    <h1 style={{
                        fontFamily: "'Be Vietnam Pro',sans-serif",
                        fontSize: "clamp(64px, 9vw, 108px)",
                        lineHeight: 1.2, letterSpacing: 3,
                        color: "#ffffff", marginBottom: 20,
                    }}>
                        {t.heading}<br />
                        <span style={{ color: "#4ade80" }}>{t.highlight}</span>
                    </h1>

                    <p style={{ fontSize: 15, color: "rgba(255,255,255,0.75)", maxWidth: 440, lineHeight: 1.75, marginBottom: 32 }}>
                        {t.subtitle}
                    </p>

                    {/* Equalizer bars decoration */}
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 36 }}>
                        {[40,70,55,85,45,75,60,90,50,65,80,40,70,55,45].map((h, i) => (
                            <div key={i} style={{
                                width: 4, height: `${h}%`,
                                background: "rgba(74,222,128,0.6)",
                                borderRadius: 2,
                                transformOrigin: "bottom",
                                animation: `eqBar ${0.4 + (i % 5) * 0.15}s ease-in-out infinite`,
                                animationDelay: `${i * 0.07}s`,
                            }} />
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Sticky filter ── */}
            <div style={{
                position: "sticky", top: 0, zIndex: 10,
                background: "rgba(255,255,255,0.96)",
                backdropFilter: "blur(16px)",
                borderBottom: "1px solid #f3f4f6",
                padding: "14px 0",
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
            }}>
                <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 48px", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                    {/* Search */}
                    <div style={{ position: "relative", flex: "0 0 240px" }}>
                        <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: 13 }}>🔍</span>
                        <input className="ap-search" placeholder={t.searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)} />
                    </div>

                    {/* Genres */}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flex: 1 }}>
                        {GENRES.map(g => (
                            <button key={g} className={`ap-genre-btn ${activeGenre === g ? "active" : ""}`} onClick={() => setActiveGenre(g)}>
                                {g}
                            </button>
                        ))}
                    </div>

                    <p style={{ fontSize: 13, color: "#9ca3af", flexShrink: 0 }}>
                        {filtered.length} {t.artistCount}
                    </p>
                </div>
            </div>

            {/* ── Grid ── */}
            <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 48px 80px" }}>
                {loading ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 20 }}>
                        {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} idx={i} />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "80px 0", color: "#9ca3af" }}>
                        <div style={{ fontSize: 56, marginBottom: 16 }}>♪</div>
                        <p style={{ fontSize: 16 }}>{t.noArtists}</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 20 }}>
                        {filtered.map((artist, idx) => (
                            <Link
                                to={`/artists/${artist._id}`}
                                key={artist._id}
                                className="ap-card"
                                style={{ animationDelay: `${idx * 0.05}s` }}
                            >
                                {/* Avatar */}
                                <div style={{ position: "relative", width: 96, margin: "0 auto 16px" }}>
                                    <div className="ap-avatar" style={{ background: AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length] }}>
                                        {artist.avatar ? (
                                            <img src={artist.avatar} alt={artist.name}
                                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                onError={e => { e.currentTarget.style.display = "none"; }}
                                            />
                                        ) : getInitials(artist.name)}

                                        {/* Vinyl ring on hover */}
                                        <div className="ap-vinyl-ring" />

                                        {artist.verified && <div className="ap-verified">✓</div>}
                                    </div>
                                </div>

                                <div className="ap-name">{artist.name}</div>
                                <div className="ap-genre-tag">{artist.genre ?? "—"}</div>

                                <div style={{ display: "flex", justifyContent: "center" }}>
                                    <div className="ap-stat">
                                        <strong>{formatFollowers(artist.followers)}</strong>
                                        <span>Followers</span>
                                    </div>
                                </div>

                                {/* Equalizer bars on hover */}
                                <div className="ap-eq">
                                    {[40,70,55,85,45,75,60,90,50].map((h, i) => (
                                        <div key={i} className="ap-eq-bar" style={{
                                            height: `${h}%`,
                                            animationDuration: `${0.4 + (i % 4) * 0.15}s`,
                                            animationDelay: `${i * 0.06}s`,
                                        }} />
                                    ))}
                                </div>

                                {artist.bio && (
                                    <p style={{
                                        fontSize: 12, color: "#9ca3af", marginTop: 10,
                                        lineHeight: 1.5,
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden",
                                    }}>
                                        {artist.bio}
                                    </p>
                                )}

                                <div className="ap-hint">{t.viewArtist}</div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 48 }}>
                        <button className="ap-page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
                        {Array.from({ length: totalPages }).map((_, i) => (
                            <button key={i} className={`ap-page-btn ${page === i + 1 ? "active" : ""}`} onClick={() => setPage(i + 1)}>
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