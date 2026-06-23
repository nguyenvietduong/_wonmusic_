'use client'
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { artistService, type Artist } from "@/services/artistService";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { artistsSectionText } from "@/locales/home/artistsSection";

const GENRE_KEYS = ["Pop", "Indie", "EDM", "Ballad", "Hip-hop", "R&B"];

const avatarColors = [
    "linear-gradient(135deg, #e0f4f0, #b8ede8)",
    "linear-gradient(135deg, #e8ecf8, #d0d9f0)",
    "linear-gradient(135deg, #f0eefb, #dddaf8)",
    "linear-gradient(135deg, #eaf4ec, #c8e8cc)",
];

const getInitials = (name: string) =>
    name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase();

const formatFollowers = (num?: number) => {
    if (!num) return "0";
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
};

const ArtistsSection = () => {
    const lang = useLanguageStore((s) => s.lang);
    const t = artistsSectionText[lang];
    const {
        artistsHeadingVi, artistsHighlightVi, artistsHeadingEn, artistsHighlightEn,
        loaded, fetch: fetchSettings,
    } = useSettingsStore();

    useEffect(() => { if (!loaded) fetchSettings(); }, [loaded, fetchSettings]);

    const isEn = lang === "en";
    const displayHeading   = (isEn ? artistsHeadingEn   : artistsHeadingVi)   || t.heading;
    const displayHighlight = (isEn ? artistsHighlightEn : artistsHighlightVi) || t.highlight;

    const genres = [t.all, ...GENRE_KEYS];

    const [activeGenre, setActiveGenre] = useState<string>(t.all);
    const [artists, setArtists] = useState<Artist[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const isPausedRef = useRef(false);
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
    const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

    useEffect(() => { setActiveGenre(t.all); }, [t.all]);

    useEffect(() => {
        const fetch = async () => {
            try {
                setLoading(true);
                setHasError(false);
                const res = await artistService.getAll({ limit: 8 });
                setArtists(res.data);
            } catch {
                setHasError(true);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    useEffect(() => {
        if (!emblaApi) return;
        const id = setInterval(() => {
            if (!isPausedRef.current) emblaApi.scrollNext();
        }, 5500);
        return () => clearInterval(id);
    }, [emblaApi]);

    const filtered = activeGenre === t.all
        ? artists
        : artists.filter((a) => {
            const gs: string[] = a.genres?.length ? a.genres : (a.genre ? [a.genre] : []);
            return gs.some((g: string) => g.toLowerCase().includes(activeGenre.toLowerCase()));
          });

    return (
        <section
            className="artists-section"
            style={{
                paddingBlock: "72px",
                backgroundImage: "url('/partner-bg.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
            }}
            onMouseEnter={() => { isPausedRef.current = true; }}
            onMouseLeave={() => { isPausedRef.current = false; }}
        >
            <style>{`
                /* Section header — qp-sechead style */
                .artists-sechead {
                    position: relative;
                    display: flex; align-items: flex-end; justify-content: space-between;
                    gap: 24px;
                    margin-bottom: 24px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid var(--m-border);
                }
                .artists-sechead::after {
                    content: '';
                    position: absolute; left: 0; bottom: -1px;
                    width: 64px; height: 3px;
                    background: var(--m-green-500);
                    border-radius: 2px;
                }
                .artists-sechead__link {
                    flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px;
                    font-size: 13px; font-weight: 700; color: #000;
                    text-decoration: none; white-space: nowrap;
                    transition: color 0.2s;
                }
                .artists-sechead__link:hover { color: var(--m-green-500); }

                /* Genre tabs */
                .artists-genre-row {
                    display: flex; gap: 8px; flex-wrap: wrap;
                    margin-bottom: 24px;
                }
                .artists-genre-btn {
                    font-size: 12px; font-weight: 600; letter-spacing: 0.04em;
                    padding: 5px 14px; border-radius: 20px;
                    border: 1px solid var(--m-border);
                    background: transparent; color: var(--m-muted);
                    cursor: pointer; transition: all 0.2s;
                }
                .artists-genre-btn:hover { border-color: var(--m-green-500); color: var(--m-green-500); }
                .artists-genre-btn.active {
                    background: var(--m-green-500); color: #fff;
                    border-color: var(--m-green-500);
                }

                /* Carousel prev/next — white buttons */
                .artists-nav-btn {
                    position: absolute; top: 50%; transform: translateY(-50%);
                    z-index: 10; width: 40px; height: 40px; border-radius: 50%;
                    background: #fff; border: 1.5px solid var(--m-border);
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer; color: var(--m-text);
                    box-shadow: 0 2px 10px rgba(0,0,0,0.08);
                    transition: border-color 0.2s, background 0.2s;
                }
                .artists-nav-btn:hover { background: var(--m-surface-1); border-color: var(--m-green-500); }
                .artists-nav-btn--prev { left: -20px; }
                .artists-nav-btn--next { right: -20px; }

                /* Artist card — qp-mesh-card style */
                .artist-mesh-card {
                    position: relative;
                    display: flex; flex-direction: column;
                    background: var(--m-surface-1);
                    border: 1px solid var(--m-border);
                    border-radius: 14px; overflow: hidden;
                    text-decoration: none; color: inherit;
                    transition: border-color 0.35s ease;
                    height: 100%;
                }
                /* Animated gradient border on hover */
                .artist-mesh-card::before {
                    content: '';
                    position: absolute; inset: 0; z-index: 3; pointer-events: none;
                    border-radius: 14px; padding: 1px;
                    background: linear-gradient(120deg, transparent 0%, var(--m-green-500) 25%, #34d399 55%, var(--m-green-500) 80%, transparent 100%);
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor; mask-composite: exclude;
                    opacity: 0; transition: opacity 0.45s ease;
                }
                /* Yellow dot on hover */
                .artist-mesh-card::after {
                    content: '';
                    position: absolute; top: 12px; right: 12px; z-index: 4; pointer-events: none;
                    width: 8px; height: 8px; border-radius: 50%;
                    background: #fcd34d; box-shadow: 0 0 10px rgba(252,211,77,0.65);
                    opacity: 0; transform: scale(0.4);
                    transition: opacity 0.35s ease, transform 0.35s cubic-bezier(0.34,1.56,0.64,1);
                }
                .artist-mesh-card:hover { border-color: transparent; }
                .artist-mesh-card:hover::before { opacity: 1; }
                .artist-mesh-card:hover::after { opacity: 1; transform: scale(1); }
                .artist-mesh-card:hover .artist-mesh-name { transform: translateY(-2px); }

                /* Media — square avatar area */
                .artist-mesh-media {
                    position: relative;
                    aspect-ratio: 1 / 1;
                    background: var(--m-surface-2);
                    overflow: hidden;
                    display: flex; align-items: center; justify-content: center;
                }
                .artist-mesh-media img {
                    width: 100%; height: 100%; object-fit: cover; display: block;
                }
                .artist-mesh-initials {
                    font-size: 32px; font-weight: 800;
                    color: var(--m-muted); letter-spacing: -0.03em;
                    user-select: none;
                }
                .artist-mesh-verified {
                    position: absolute; bottom: 10px; right: 10px;
                    width: 22px; height: 22px; border-radius: 50%;
                    background: var(--m-green-500); color: #fff;
                    font-size: 12px; font-weight: 700;
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.15);
                }

                /* Card body */
                .artist-mesh-body {
                    padding: 16px 18px;
                    display: flex; flex-direction: column; gap: 8px; flex: 1;
                }
                .artist-mesh-name {
                    font-size: 16px; font-weight: 700;
                    color: var(--m-text); line-height: 1.3;
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                    transition: transform 0.35s ease;
                }
                .artist-mesh-genre {
                    display: inline-block;
                    font-size: 11px; font-weight: 700; letter-spacing: 0.07em;
                    text-transform: uppercase;
                    color: var(--m-green-500);
                    background: color-mix(in srgb, var(--m-green-500) 12%, transparent);
                    padding: 3px 9px; border-radius: 20px;
                    border: 1px solid color-mix(in srgb, var(--m-green-500) 25%, transparent);
                    align-self: flex-start;
                }
                .artist-mesh-meta {
                    margin-top: auto; padding-top: 10px;
                    border-top: 1px solid var(--m-border);
                    display: flex; align-items: center; justify-content: space-between;
                    font-size: 12px; color: var(--m-muted);
                }
                .artist-mesh-meta__link {
                    display: inline-flex; align-items: center; gap: 5px;
                    color: var(--m-green-500); font-weight: 700; font-size: 12px;
                }

                /* Skeleton */
                .artist-mesh-skeleton .artist-mesh-media {
                    background: var(--m-border);
                }
                .artist-mesh-skeleton .artist-mesh-name {
                    background: var(--m-border); border-radius: 4px;
                    width: 70%; height: 14px; color: transparent;
                }
                .artist-mesh-skeleton .artist-mesh-genre {
                    background: var(--m-border); color: transparent;
                    border-color: transparent;
                }

                /* Slide sizing */
                .artist-slide { flex: 0 0 25%; min-width: 0; padding-left: 20px; display: flex; flex-direction: column; }
                @media (max-width: 1024px) { .artist-slide { flex: 0 0 33.333%; } }
                @media (max-width: 768px)  { .artist-slide { flex: 0 0 50%; } }
                @media (max-width: 480px)  { .artist-slide { flex: 0 0 85%; } }

                @media (max-width: 480px) {
                    .artists-nav-btn { display: none; }
                }
            `}</style>

            <div className="music-container">
                {/* Section header */}
                <div className="artists-sechead">
                    <div>
                        <div style={{
                            color: "var(--m-green-500)", fontSize: 12, fontWeight: 700,
                            letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: 8,
                        }}>
                            {t.label}
                        </div>
                        <h2 style={{
                            fontSize: "clamp(20px, 2.5vw, 30px)", fontWeight: 800,
                            color: "var(--m-text)", margin: 0, letterSpacing: "-0.4px",
                        }}>
                            {displayHeading} <span style={{ color: "var(--m-green-500)" }}>{displayHighlight}</span>
                        </h2>
                    </div>

                    <Link href="/artists" className="artists-sechead__link">
                        {t.viewAll}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                        </svg>
                    </Link>
                </div>

                {/* Genre tabs */}
                <div className="artists-genre-row">
                    {genres.map((g) => (
                        <button
                            key={g}
                            className={`artists-genre-btn${activeGenre === g ? " active" : ""}`}
                            onClick={() => setActiveGenre(g)}
                        >
                            {g}
                        </button>
                    ))}
                </div>

                {/* Error state */}
                {hasError && !loading && (
                    <div style={{ textAlign: "center", color: "var(--m-muted)", padding: "40px 0" }}>
                        <p>{t.error}</p>
                        <button
                            className="btn-outline-music"
                            style={{ marginTop: 12 }}
                            onClick={() => window.location.reload()}
                        >
                            {t.retry}
                        </button>
                    </div>
                )}

                {/* Carousel */}
                {!hasError && (
                    <div style={{ position: "relative" }}>
                        <button onClick={scrollPrev} className="artists-nav-btn artists-nav-btn--prev" aria-label="Prev">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </button>

                        <div ref={emblaRef} style={{ overflow: "hidden", padding: "4px 2px 8px" }}>
                            <div style={{ display: "flex", marginLeft: -20, alignItems: "stretch" }}>
                                {loading
                                    ? Array.from({ length: 8 }).map((_, i) => (
                                        <div key={i} className="artist-slide">
                                            <div className="artist-mesh-card artist-mesh-skeleton" style={{ opacity: 0.5 }}>
                                                <div className="artist-mesh-media" />
                                                <div className="artist-mesh-body">
                                                    <div className="artist-mesh-name">Loading</div>
                                                    <div className="artist-mesh-genre">Genre</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                    : filtered.length === 0
                                        ? (
                                            <div style={{ color: "var(--m-muted)", padding: "40px 0" }}>
                                                {t.noArtists}
                                            </div>
                                        )
                                        : filtered.map((artist, idx) => (
                                            <div key={artist._id} className="artist-slide">
                                                <Link href={`/artists/${artist._id}`} className="artist-mesh-card">
                                                    {/* Avatar */}
                                                    <div
                                                        className="artist-mesh-media"
                                                        style={{
                                                            background: !artist.avatar
                                                                ? avatarColors[idx % avatarColors.length]
                                                                : undefined,
                                                        }}
                                                    >
                                                        {artist.avatar ? (
                                                            <img
                                                                src={artist.avatar}
                                                                alt={artist.name}
                                                                onError={(e) => { e.currentTarget.style.display = "none"; }}
                                                            />
                                                        ) : (
                                                            <span className="artist-mesh-initials">
                                                                {getInitials(artist.name)}
                                                            </span>
                                                        )}
                                                        {artist.verified && (
                                                            <div className="artist-mesh-verified" title={t.verifiedTitle}>✓</div>
                                                        )}
                                                    </div>

                                                    {/* Body */}
                                                    <div className="artist-mesh-body">
                                                        <div className="artist-mesh-name">{artist.name}</div>
                                                        {(() => {
                                                            const gs: string[] = artist.genres?.length ? artist.genres : (artist.genre ? [artist.genre] : []);
                                                            return gs.length > 0 && <span className="artist-mesh-genre">{gs.join(" · ")}</span>;
                                                        })()}
                                                        <div className="artist-mesh-meta">
                                                            <span>{formatFollowers(artist.followers)} followers</span>
                                                            <span className="artist-mesh-meta__link">
                                                                {t.viewArtist}
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12" strokeLinecap="round" strokeLinejoin="round">
                                                                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                                                                </svg>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </Link>
                                            </div>
                                        ))
                                }
                            </div>
                        </div>

                        <button onClick={scrollNext} className="artists-nav-btn artists-nav-btn--next" aria-label="Next">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
};

export default ArtistsSection;
