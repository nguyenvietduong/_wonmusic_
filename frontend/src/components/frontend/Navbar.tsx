'use client'

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Search, X, User, MenuIcon, LogOut } from "lucide-react";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { navbarText } from "@/locales/navbar";
import NavbarSidebar from "./NavbarSidebar";
import LanguageSwitcher from "./LanguageSwitcher";
import { trackService, type Track } from "@/services/trackService";
import { artistService, type Artist } from "@/services/artistService";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSettingsStore } from "@/stores/useSettingsStore";

// ─── Constants ────────────────────────────────────────────────────────────────

const DEBOUNCE_MS = 350;
const GENRES = ["Pop", "Indie", "EDM", "Ballad", "Hip-hop", "R&B", "Folk"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatTime = (sec: number): string => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
};

const getInitials = (name: string): string =>
    name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase();

// ─── Sub-components ───────────────────────────────────────────────────────────

interface SearchSkeletonProps { rows?: number }
const SearchSkeleton = ({ rows = 3 }: SearchSkeletonProps) => (
    <div className="p-4 space-y-1">
        {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
                <div className="w-10 h-10 rounded-lg flex-shrink-0" style={{ background: "rgba(0,0,0,0.07)" }} />
                <div className="flex-1 space-y-1.5">
                    <div className="nav-skeleton h-3 rounded-full w-3/5" />
                    <div className="nav-skeleton h-2.5 rounded-full w-2/5" />
                </div>
            </div>
        ))}
    </div>
);

interface SearchEmptyProps { query: string; noResultsFor: string }
const SearchEmpty = ({ query, noResultsFor }: SearchEmptyProps) => (
    <div className="py-6 px-4 text-center">
        <div className="text-3xl mb-2" style={{ opacity: 0.35 }}>♪</div>
        <p className="text-sm" style={{ color: "rgba(0,0,0,0.45)" }}>
            {noResultsFor}{" "}
            <span style={{ color: "#34D4B8" }}>"{query}"</span>
        </p>
    </div>
);

interface TrackItemProps { track: Track; onPlay: (track: Track) => void }
const TrackItem = ({ track, onPlay }: TrackItemProps) => (
    <div className="nav-result-item" onClick={() => onPlay(track)}>
        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #E8ECF8, #D8DFF0)" }}>
            {track.coverUrl ? (
                <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
            ) : (
                <span style={{ color: "#34D4B8", fontSize: 16 }}>♪</span>
            )}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium truncate" style={{ color: "#0D0D1A" }}>{track.title}</p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(0,0,0,0.45)" }}>{track.artistId.name}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
            {track.genre && (
                <span className="nav-genre-pill">{track.genre}</span>
            )}
            <span style={{ fontSize: 11, color: "rgba(0,0,0,0.35)" }}>{formatTime(track.duration)}</span>
            <span style={{ color: "rgba(0,169,143,0.7)", fontSize: 14 }}>▶</span>
        </div>
    </div>
);

interface ArtistItemProps { artist: Artist; artistsLabel: string; onClick: () => void }
const ArtistItem = ({ artist, artistsLabel, onClick }: ArtistItemProps) => (
    <Link href={`/artists/${artist._id}`} className="nav-result-item" onClick={onClick}>
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-sm font-bold"
            style={{ background: "linear-gradient(135deg, #D8DFF0, #C8F0EC)", color: "#00A98F", border: "2px solid rgba(0,169,143,0.3)" }}>
            {artist.avatar ? (
                <img src={artist.avatar} alt={artist.name} className="w-full h-full object-cover" />
            ) : getInitials(artist.name)}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium truncate" style={{ color: "#0D0D1A" }}>
                {artist.name}
                {artist.verified && <span style={{ color: "#34D4B8", fontSize: 11, marginLeft: 4 }}>✓</span>}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(0,0,0,0.45)" }}>
                {(() => {
                    const gs: string[] = artist.genres?.length ? artist.genres : (artist.genre ? [artist.genre] : []);
                    return gs.length > 0 ? gs.slice(0, 2).join(" · ") : artistsLabel;
                })()}
            </p>
        </div>
        <span style={{ fontSize: 12, color: "rgba(0,0,0,0.3)" }}>→</span>
    </Link>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const Navbar = () => {
    const pathname = usePathname();
    const router = useRouter();
    const user     = useAuthStore((s) => s.user);
    const signOut  = useAuthStore((s) => s.signOut);
    const { lang } = useLanguageStore();
    const { siteName, logoUrl, fetch: fetchSettings, loaded: settingsLoaded } = useSettingsStore();

    useEffect(() => { if (!settingsLoaded) fetchSettings(); }, [settingsLoaded, fetchSettings]);
    const t = navbarText[lang];
    const { play } = usePlayerStore();

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [tracks, setTracks] = useState<Track[]>([]);
    const [artists, setArtists] = useState<Artist[]>([]);
    const [searching, setSearching] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const isHome = pathname === "/";
    const isLightHeroPage = pathname === "/gioi-thieu" || pathname === "/lien-he" || pathname === "/artists" || (pathname ?? "").startsWith("/artists/");
    const isTransparent = (isHome || isLightHeroPage) && !scrolled;
    const isLightHero = isLightHeroPage && !scrolled;

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasResults = tracks.length > 0 || artists.length > 0;

    const navLinks = [
        { to: "/",            label: t.home },
        { to: "/gioi-thieu", label: t.about },
        { to: "/artists",    label: t.artists },
        { to: "/charts",     label: t.charts },
        { to: "/lien-he",    label: t.contact },
    ];

    // ── Focus / reset on search toggle ──
    useEffect(() => {
        if (searchOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setQuery("");
            setTracks([]);
            setArtists([]);
        }
    }, [searchOpen]);

    // ── Click-outside → close dropdown ──
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setSearchOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // ── ESC → close search ──
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") setSearchOpen(false);
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    // ── Debounced search ──
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!query.trim()) { setTracks([]); setArtists([]); return; }
        debounceRef.current = setTimeout(async () => {
            try {
                setSearching(true);
                const [tracksRes, artistsRes] = await Promise.all([
                    trackService.search(query, 5),
                    artistService.getAll({ search: query, limit: 3 }),
                ]);
                setTracks(tracksRes);
                setArtists(artistsRes.data);
            } catch {
                setTracks([]);
                setArtists([]);
            } finally {
                setSearching(false);
            }
        }, DEBOUNCE_MS);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [query]);

    const goHome = useCallback(() => {
        if (pathname !== "/") {
            router.push("/");
            setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
        } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, [pathname, router]);

    const handlePlayTrack = useCallback((track: Track) => {
        play({ id: track._id, title: track.title, artist: track.artistId.name, audioUrl: track.audioUrl, coverUrl: track.coverUrl, duration: track.duration });
        setSearchOpen(false);
    }, [play]);

    const handleSubmit = useCallback((e?: React.FormEvent) => {
        e?.preventDefault();
        if (!query.trim()) return;
        router.push(`/search?q=${encodeURIComponent(query)}`);
        setSearchOpen(false);
    }, [router, query]);

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <>
            <style>{`
                /* ── Transparent mode — dark hero (home) ── */
                .nav-transparent .nic-nav-link { color: rgba(255,255,255,0.85); }
                .nav-transparent .nic-nav-link:hover,
                .nav-transparent .nic-nav-link.active { color: #34D4B8; }
                .nav-transparent .nic-genre-tab { color: rgba(255,255,255,0.65); border-color: rgba(255,255,255,0.22); }
                .nav-transparent .nic-genre-tab:hover { color: #34D4B8; border-color: #34D4B8; background: rgba(255,255,255,0.08); }

                /* ── Transparent mode — light hero (about) ── */
                .nav-transparent-light .nic-nav-link { color: rgba(0,0,0,0.75); }
                .nav-transparent-light .nic-nav-link:hover,
                .nav-transparent-light .nic-nav-link.active { color: #00A98F; }
                .nav-transparent-light .nic-nav-link::after { background: #00A98F; }

                /* ── Nav link ── */
                .nic-nav-link {
                    position: relative;
                    padding: 6px 10px;
                    font-family: 'Space Grotesk', sans-serif;
                    font-size: 12px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    color: rgba(0,0,0,0.82);
                    text-decoration: none;
                    transition: color 0.2s;
                    white-space: nowrap;
                }
                .nic-nav-link::after {
                    content: '';
                    position: absolute;
                    bottom: -1px; left: 10px; right: 10px;
                    height: 2px;
                    background: #34D4B8;
                    transform: scaleX(0);
                    transition: transform 0.25s cubic-bezier(0.4,0,0.2,1);
                    transform-origin: center;
                    border-radius: 2px;
                }
                .nic-nav-link:hover,
                .nic-nav-link.active { color: #34D4B8; }
                .nic-nav-link:hover::after,
                .nic-nav-link.active::after { transform: scaleX(1); }

                /* ── Genre tab (row 2) ── */
                .nic-genre-tab {
                    padding: 5px 14px;
                    border-radius: 20px;
                    font-family: 'Space Grotesk', sans-serif;
                    font-size: 12px; font-weight: 600;
                    letter-spacing: 0.04em;
                    color: rgba(0,0,0,0.65);
                    background: transparent;
                    border: 1px solid rgba(0,0,0,0.15);
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                    text-decoration: none;
                }
                .nic-genre-tab:hover {
                    border-color: #34D4B8;
                    color: #34D4B8;
                    background: rgba(0,169,143,0.06);
                }

                /* ── Search input ── */
                .nic-search-input {
                    width: 100%;
                    background: transparent;
                    border: none; outline: none;
                    font-size: 13px; color: #0D0D1A;
                    font-family: 'Be Vietnam Pro', sans-serif;
                }
                .nic-search-input::placeholder { color: rgba(0,0,0,0.35); }

                /* ── Search dropdown ── */
                .nav-search-dropdown {
                    position: absolute;
                    top: calc(100% + 8px); left: 0; right: 0;
                    background: #FFFFFF;
                    border: 1px solid rgba(0,169,143,0.2);
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 24px 60px rgba(0,0,0,0.12);
                    z-index: 100;
                    animation: navDropDown 0.2s ease;
                }
                @keyframes navDropDown {
                    from { opacity: 0; transform: translateY(-8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                /* ── Result item ── */
                .nav-result-item {
                    display: flex; align-items: center; gap: 12px;
                    padding: 10px 16px; cursor: pointer;
                    transition: background 0.15s;
                    text-decoration: none; color: inherit;
                }
                .nav-result-item:hover { background: rgba(0,169,143,0.08); }

                /* ── Genre pill in dropdown ── */
                .nav-genre-pill {
                    font-family: 'Space Grotesk', sans-serif;
                    font-size: 9px; font-weight: 700;
                    letter-spacing: 1.5px; text-transform: uppercase;
                    color: #34D4B8;
                    background: rgba(0,169,143,0.1);
                    border: 1px solid rgba(0,169,143,0.25);
                    padding: 2px 8px; border-radius: 100px;
                }

                /* ── Skeleton shimmer ── */
                @keyframes navShimmer {
                    0%   { background-position: -200% center; }
                    100% { background-position:  200% center; }
                }
                .nav-skeleton {
                    background: linear-gradient(90deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.05) 100%);
                    background-size: 200%;
                    animation: navShimmer 1.5s linear infinite;
                }

                /* ── Logo mark ── */
                .nic-logo-mark {
                    width: 32px; height: 32px;
                    border-radius: 6px;
                    background: linear-gradient(135deg, #00A98F 0%, #818CF8 50%, #6366F1 100%);
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                    font-family: 'Space Grotesk', sans-serif;
                    font-size: 14px; font-weight: 800; color: #fff;
                }

                /* ── User badge ── */
                .nic-user-badge {
                    display: flex; align-items: center; gap: 6px;
                    padding: 6px 14px; border-radius: 6px;
                    background: linear-gradient(135deg, #00A98F, #34D4B8);
                    border: 1px solid transparent;
                    font-family: 'Space Grotesk', sans-serif;
                    font-size: 11px; font-weight: 700;
                    color: #fff;
                    text-decoration: none;
                    transition: all 0.2s;
                    letter-spacing: 0.5px;
                }
                .nic-user-badge:hover { opacity: 0.88; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(0,169,143,0.35); }

                /* ── Logout button ── */
                .nic-logout-btn {
                    display: flex; align-items: center; gap: 6px;
                    padding: 6px 14px; border-radius: 6px;
                    background: #ef4444;
                    border: 1px solid transparent;
                    font-family: 'Space Grotesk', sans-serif;
                    font-size: 11px; font-weight: 700;
                    color: #fff;
                    letter-spacing: 0.5px;
                    cursor: pointer; transition: all 0.2s;
                }
                .nic-logout-btn:hover {
                    background: #dc2626;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 14px rgba(239,68,68,0.35);
                }
            `}</style>

            {/* ═══════════════════════════════════════════════════════
                HEADER WRAPPER — fixed, 2-layer
            ═══════════════════════════════════════════════════════ */}
            <header
                className={`fixed inset-x-0 top-0 z-[9999]${isTransparent ? (isLightHero ? " nav-transparent-light" : " nav-transparent") : ""}`}
                style={{
                    background: isTransparent ? "transparent" : "rgba(248,248,252,0.96)",
                    backdropFilter: isTransparent ? "none" : "saturate(180%) blur(12px)",
                    borderBottom: isTransparent ? "none" : "1px solid rgba(0,169,143,0.15)",
                    boxShadow: isTransparent ? "none" : "0 1px 0 rgba(0,169,143,0.05), 0 4px 16px -8px rgba(0,0,0,0.08)",
                    transition: "background 0.3s, backdrop-filter 0.3s, border-color 0.3s, box-shadow 0.3s",
                }}
            >
                {/* ── Layer 1: brand + main nav + utils ── */}
                <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 32px", height: 60, display: "flex", alignItems: "center", gap: 24 }}>

                    {/* Logo */}
                    <button onClick={goHome} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>
                        {logoUrl ? (
                            <img
                                src={logoUrl}
                                alt={siteName}
                                style={{ height: 44, width: "auto", objectFit: "contain", maxWidth: 120 }}
                            />
                        ) : (
                            <div className="nic-logo-mark">W</div>
                        )}
                        {!logoUrl && (
                            <div style={{ textAlign: "left", lineHeight: 1.2 }}>
                                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, fontWeight: 800, color: (isTransparent && !isLightHero) ? "#fff" : "#0D0D1A", letterSpacing: "-0.3px", transition: "color 0.3s" }}>
                                    {siteName || "WON MUSIC"}
                                </div>
                                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: (isTransparent && !isLightHero) ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.38)", letterSpacing: "1.5px", textTransform: "uppercase", transition: "color 0.3s" }}>MUSIC PLATFORM</div>
                            </div>
                        )}
                    </button>

                    {/* Nav links — chỉ hiện trên desktop (xl) */}
                    <nav className="hidden xl:flex items-center gap-1 ml-8">
                        {navLinks.map(({ to, label }) => (
                            <Link
                                key={to}
                                href={to}
                                className={cn("nic-nav-link", pathname === to && "active")}
                            >
                                {label}
                            </Link>
                        ))}
                    </nav>

                    {/* Search — desktop, ml-auto pushes it right */}
                    <div
                        ref={searchRef}
                        className="hidden xl:block relative ml-auto"
                        style={{ width: searchOpen ? 380 : 200, transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)" }}
                    >
                        <form
                            onSubmit={handleSubmit}
                            onClick={() => setSearchOpen(true)}
                            style={{
                                display: "flex", alignItems: "center", gap: 8,
                                background: isTransparent
                                    ? (isLightHero ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.12)")
                                    : (searchOpen ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.06)"),
                                border: `1px solid ${isTransparent ? (isLightHero ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.2)") : (searchOpen ? "rgba(0,169,143,0.4)" : "rgba(0,0,0,0.08)")}`,
                                borderRadius: 8, padding: "7px 14px",
                                cursor: "text", transition: "all 0.25s",
                            }}
                        >
                            <Search size={13} style={{ color: searchOpen ? "#34D4B8" : "rgba(0,0,0,0.35)", flexShrink: 0, transition: "color 0.2s" }} />
                            <input
                                ref={inputRef}
                                className="nic-search-input"
                                placeholder={t.searchPlaceholder}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            {query && (
                                <button type="button" onClick={(e) => { e.stopPropagation(); setQuery(""); inputRef.current?.focus(); }}
                                    style={{ color: "rgba(0,0,0,0.35)", background: "none", border: "none", cursor: "pointer", display: "flex" }}>
                                    <X size={13} />
                                </button>
                            )}
                        </form>

                        {/* Search dropdown */}
                        {searchOpen && query.trim() && (
                            <div className="nav-search-dropdown">
                                {searching ? (
                                    <SearchSkeleton />
                                ) : !hasResults ? (
                                    <SearchEmpty query={query} noResultsFor={t.noResultsFor} />
                                ) : (
                                    <>
                                        {tracks.length > 0 && (
                                            <>
                                                <p style={{ padding: "10px 16px 6px", fontFamily: "'Space Grotesk',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(0,0,0,0.35)" }}>
                                                    {t.tracksLabel}
                                                </p>
                                                {tracks.map((track) => <TrackItem key={track._id} track={track} onPlay={handlePlayTrack} />)}
                                            </>
                                        )}
                                        {tracks.length > 0 && artists.length > 0 && (
                                            <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "4px 0" }} />
                                        )}
                                        {artists.length > 0 && (
                                            <>
                                                <p style={{ padding: "10px 16px 6px", fontFamily: "'Space Grotesk',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(0,0,0,0.35)" }}>
                                                    {t.artistsLabel}
                                                </p>
                                                {artists.map((artist) => <ArtistItem key={artist._id} artist={artist} artistsLabel={t.artistsLabel} onClick={() => setSearchOpen(false)} />)}
                                            </>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => handleSubmit()}
                                            style={{
                                                width: "100%", padding: "10px 16px",
                                                borderTop: "1px solid rgba(0,0,0,0.08)",
                                                background: "rgba(0,169,143,0.06)",
                                                color: "#34D4B8",
                                                fontFamily: "'Be Vietnam Pro',sans-serif",
                                                fontSize: 13, fontWeight: 600,
                                                border: "none", borderRadius: 0, cursor: "pointer",
                                                textAlign: "left", transition: "background 0.15s",
                                            }}
                                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,169,143,0.12)")}
                                            onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,169,143,0.06)")}
                                        >
                                            {t.seeAllResults} "<strong>{query}</strong>" →
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right utils — desktop */}
                    <div className="hidden xl:flex items-center gap-3 flex-shrink-0">
                        <LanguageSwitcher />

                        {user && (
                            <>
                                <a href="/admin" target="_blank" rel="noopener noreferrer" className="nic-user-badge">
                                    <User size={12} />
                                    {user.displayName ?? t.member}
                                </a>
                                <button
                                    onClick={() => signOut()}
                                    className="nic-logout-btn"
                                    title={t.logout}
                                >
                                    <LogOut size={12} />
                                    {t.logout}
                                </button>
                            </>
                        )}
                    </div>

                    {/* Hamburger — chỉ hiện trên mobile/tablet, ẩn desktop */}
                    <button
                        className="ml-auto xl:hidden rounded-md p-2 transition-colors"
                        style={{ background: "rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.1)", color: "#00A98F" }}
                        onClick={() => setIsSidebarOpen(true)}
                        aria-label={t.openMenu}
                    >
                        <MenuIcon size={18} />
                    </button>
                </div>

            </header>

            <NavbarSidebar open={isSidebarOpen} onOpenChange={setIsSidebarOpen} />
        </>
    );
};

export default Navbar;
