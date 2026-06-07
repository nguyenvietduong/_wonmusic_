'use client'
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { artistService, type Artist } from "@/services/artistService";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { artistsSectionText } from "@/locales/home/artistsSection";

const GENRE_KEYS = ["Pop", "Indie", "EDM", "Ballad", "Hip-hop", "R&B"];

const avatarColors = [
    "linear-gradient(135deg, #E8ECF8, #D8DFF0)",
    "linear-gradient(135deg, #E0F4F0, #C8EDE8)",
    "linear-gradient(135deg, #EEEEFB, #DDDAF8)",
    "linear-gradient(135deg, #EAEAFB, #D4D5F8)",
];

const getInitials = (name: string) =>
    name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase();

const formatFollowers = (num?: number) => {
    if (!num) return "0";
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000)     return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
};

// ── Skeleton card ──
const SkeletonCard = ({ idx }: { idx: number }) => (
    <div className="artist-card" style={{ opacity: 0.5, pointerEvents: "none", flexShrink: 0 }}>
        <div
            className="artist-avatar"
            style={{ background: avatarColors[idx % avatarColors.length] }}
        />
        <div style={{ height: 12, background: "var(--m-border)", borderRadius: 4, margin: "12px auto 6px", width: "60%" }} />
        <div style={{ height: 10, background: "var(--m-border)", borderRadius: 4, margin: "0 auto",         width: "40%" }} />
    </div>
);

const ArtistsSection = () => {
    const lang = useLanguageStore((s) => s.lang);
    const t    = artistsSectionText[lang];

    const genres = [t.all, ...GENRE_KEYS];

    const [activeGenre, setActiveGenre] = useState<string>(t.all);
    const [hoveredId,   setHoveredId]   = useState<string | null>(null);
    const [artists,     setArtists]     = useState<Artist[]>([]);
    const [loading,     setLoading]     = useState(true);
    const [error,       setError]       = useState<string | null>(null);
    const scrollRef                     = useRef<HTMLDivElement>(null);

    // reset active genre label when language changes
    useEffect(() => { setActiveGenre(t.all); }, [t.all]);

    useEffect(() => {
        const fetch = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await artistService.getAll({ limit: 8 });
                setArtists(res.data);
            } catch {
                setError(t.error);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    useEffect(() => {
        scrollRef.current?.scrollTo({ left: 0, behavior: "smooth" });
    }, [activeGenre]);

    const filtered = activeGenre === t.all
        ? artists
        : artists.filter((a) => a.genre?.toLowerCase().includes(activeGenre.toLowerCase()));

    // ── Scroll buttons (desktop) ──
    const scroll = (dir: "left" | "right") => {
        scrollRef.current?.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" });
    };

    return (
        <section className="music-section artists-section">
            <style>{`
                .artists-scroll {
                    display: flex;
                    gap: 16px;
                    overflow-x: auto;
                    scroll-snap-type: x proximity;
                    -webkit-overflow-scrolling: touch;
                    scrollbar-width: none;
                    padding-bottom: 8px;
                    touch-action: pan-x;
                }
                .artists-scroll::-webkit-scrollbar { display: none; }

                .artists-scroll .artist-card {
                    flex: 0 0 200px;
                    scroll-snap-align: start;
                    scroll-snap-stop: normal;
                    width: 200px;
                }

                @media (max-width: 768px) {
                    .artists-scroll .artist-card {
                        flex: 0 0 160px;
                        width: 160px;
                    }
                }
                @media (max-width: 480px) {
                    .artists-scroll .artist-card {
                        flex: 0 0 140px;
                        width: 140px;
                    }
                }

                .scroll-btn {
                    width: 36px; height: 36px;
                    border-radius: 50%;
                    border: 1px solid var(--m-border);
                    background: var(--m-surface-1);
                    color: var(--m-text);
                    cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 14px;
                    transition: all 0.2s;
                    flex-shrink: 0;
                }
                .scroll-btn:hover {
                    border-color: var(--m-border-hover);
                    background: var(--m-surface-2);
                }

                .scroll-dots {
                    display: none;
                    justify-content: center;
                    gap: 6px;
                    margin-top: 16px;
                }
                @media (max-width: 768px) {
                    .scroll-dots { display: flex; }
                    .scroll-btn  { display: none; }
                }

                .scroll-dot {
                    width: 6px; height: 6px;
                    border-radius: 50%;
                    background: var(--m-border);
                    transition: all 0.2s;
                }
                .scroll-dot.active {
                    background: var(--m-green-500);
                    width: 18px;
                    border-radius: 3px;
                }
            `}</style>

            <div className="music-container">
                {/* Header */}
                <div className="artists-header">
                    <div>
                        <div className="section-label">
                            <span className="section-line" />
                            <span className="section-tag">{t.label}</span>
                        </div>
                        <h2 className="section-title">
                            {t.heading} <span className="text-green">{t.highlight}</span>
                        </h2>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {/* Scroll buttons — ẩn trên mobile */}
                        <button className="scroll-btn" onClick={() => scroll("left")}>‹</button>
                        <button className="scroll-btn" onClick={() => scroll("right")}>›</button>
                        <Link href="/artists" className="btn-outline-music">
                            {t.viewAll}
                        </Link>
                    </div>
                </div>

                {/* Genre tabs */}
                <div className="genre-tabs">
                    {genres.map((g) => (
                        <button
                            key={g}
                            className={`genre-tab ${activeGenre === g ? "active" : ""}`}
                            onClick={() => setActiveGenre(g)}
                        >
                            {g}
                        </button>
                    ))}
                </div>

                {/* Error */}
                {error && !loading && (
                    <div style={{ textAlign: "center", color: "var(--m-muted)", padding: "40px 0" }}>
                        <p>{error}</p>
                        <button
                            className="btn-outline-music"
                            style={{ marginTop: 12 }}
                            onClick={() => window.location.reload()}
                        >
                            {t.retry}
                        </button>
                    </div>
                )}

                {/* Scroll container */}
                {!error && (
                    <div ref={scrollRef} className="artists-scroll">
                        {loading
                            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} idx={i} />)
                            : filtered.length === 0
                                ? (
                                    <div style={{ color: "var(--m-muted)", padding: "40px 0", whiteSpace: "nowrap" }}>
                                        {t.noArtists}
                                    </div>
                                )
                                : filtered.map((artist, idx) => (
                                    <Link
                                        href={`/artists/${artist._id}`}
                                        key={artist._id}
                                        className={`artist-card ${hoveredId === artist._id ? "hovered" : ""}`}
                                        onMouseEnter={() => setHoveredId(artist._id)}
                                        onMouseLeave={() => setHoveredId(null)}
                                        style={{ animationDelay: `${idx * 0.06}s` }}
                                    >
                                        <div className="artist-card-glow" />

                                        {/* Avatar */}
                                        <div
                                            className="artist-avatar"
                                            style={{ background: avatarColors[idx % avatarColors.length] }}
                                        >
                                            {artist.avatar ? (
                                                <img
                                                    src={artist.avatar}
                                                    alt={artist.name}
                                                    style={{
                                                        width: "100%", height: "100%",
                                                        objectFit: "cover", borderRadius: "50%",
                                                    }}
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = "none";
                                                    }}
                                                />
                                            ) : (
                                                getInitials(artist.name)
                                            )}
                                            {artist.verified && (
                                                <div className="verified-badge" title={t.verifiedTitle}>✓</div>
                                            )}
                                        </div>

                                        <div className="artist-name">{artist.name}</div>
                                        <div className="artist-genre-tag">{artist.genre ?? "—"}</div>

                                        <div className="artist-stats">
                                            <div className="artist-stat">
                                                <strong>{formatFollowers(artist.followers)}</strong>
                                                <span>Followers</span>
                                            </div>
                                        </div>

                                        <div className="artist-play-hint">
                                            <span>{t.viewArtist}</span>
                                        </div>
                                    </Link>
                                ))
                        }
                    </div>
                )}

                {/* Scroll dots — chỉ hiện trên mobile */}
                {!loading && !error && filtered.length > 0 && (
                    <div className="scroll-dots">
                        {filtered.map((_, i) => (
                            <div
                                key={i}
                                className={`scroll-dot ${i === 0 ? "active" : ""}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default ArtistsSection;