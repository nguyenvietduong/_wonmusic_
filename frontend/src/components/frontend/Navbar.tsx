import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { MenuIcon, Search, X, User } from "lucide-react";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { navbarText } from "@/locales/navbar";
import NavbarSidebar from "./NavbarSidebar";
import LanguageSwitcher from "./LanguageSwitcher";
import { Button } from "../ui/button";
import { FaFacebookF } from "react-icons/fa";
import { trackService, type Track } from "@/services/trackService";
import { artistService, type Artist } from "@/services/artistService";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useAuthStore } from "@/stores/useAuthStore";

// ─── Constants ────────────────────────────────────────────────────────────────

const DEBOUNCE_MS = 350;

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
                <div className="w-10 h-10 rounded-lg flex-shrink-0 bg-white/[0.06]" />
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
        <div className="text-3xl mb-2 opacity-40">♪</div>
        <p className="text-sm text-white/40">
            {noResultsFor}{" "}
            <span className="text-green-400">"{query}"</span>
        </p>
    </div>
);

interface TrackItemProps { track: Track; onPlay: (track: Track) => void }
const TrackItem = ({ track, onPlay }: TrackItemProps) => (
    <div className="nav-result-item" onClick={() => onPlay(track)}>
        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#0a3d1f] to-[#16a34a] flex items-center justify-center">
            {track.coverUrl ? (
                <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
            ) : (
                <span className="text-green-400 text-base">♪</span>
            )}
        </div>

        <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-white truncate">{track.title}</p>
            <p className="text-xs text-white/45 mt-0.5">{track.artistId.name}</p>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
            {track.genre && (
                <span className="text-[10px] text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full">
                    {track.genre}
                </span>
            )}
            <span className="text-[11px] text-white/30">{formatTime(track.duration)}</span>
            <span className="text-base text-green-400/70">▶</span>
        </div>
    </div>
);

interface ArtistItemProps { artist: Artist; artistsLabel: string; onClick: () => void }
const ArtistItem = ({ artist, artistsLabel, onClick }: ArtistItemProps) => (
    <Link to={`/artists/${artist._id}`} className="nav-result-item" onClick={onClick}>
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-green-400/30 bg-gradient-to-br from-[#bbf7d0] to-[#4ade80] flex items-center justify-center text-sm font-bold text-[#166534]">
            {artist.avatar ? (
                <img src={artist.avatar} alt={artist.name} className="w-full h-full object-cover" />
            ) : (
                getInitials(artist.name)
            )}
        </div>

        <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-white truncate">
                {artist.name}
                {artist.verified && (
                    <span className="text-green-400 text-[11px] ml-1.5">✓</span>
                )}
            </p>
            <p className="text-xs text-white/45 mt-0.5">{artist.genre ?? artistsLabel}</p>
        </div>

        <span className="text-xs text-white/30 flex-shrink-0">→</span>
    </Link>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const Navbar = () => {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const { lang } = useLanguageStore();
    const t = navbarText[lang];
    const { play } = usePlayerStore();

    // UI state
    const [atTop, setAtTop] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Search state
    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [tracks, setTracks] = useState<Track[]>([]);
    const [artists, setArtists] = useState<Artist[]>([]);
    const [searching, setSearching] = useState(false);

    // Refs
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const hasResults = tracks.length > 0 || artists.length > 0;

    const navLinks = [
        { to: "/", label: t.home },
        { to: "/gioi-thieu", label: t.about },
        { to: "/artists", label: t.artists },
        { to: "/lien-he", label: t.contact },
    ];

    // ── Scroll listener ──
    useEffect(() => {
        const onScroll = () => setAtTop(window.scrollY < 50);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

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

        if (!query.trim()) {
            setTracks([]);
            setArtists([]);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            try {
                setSearching(true);
                const [tracksRes, artistsRes] = await Promise.all([
                    trackService.search(query, 5),
                    artistService.getAll({ limit: 3 }),
                ]);
                setTracks(tracksRes);
                setArtists(
                    artistsRes.data
                        .filter((a) => a.name.toLowerCase().includes(query.toLowerCase()))
                        .slice(0, 3)
                );
            } finally {
                setSearching(false);
            }
        }, DEBOUNCE_MS);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query]);

    // ── Handlers ──
    const goHome = useCallback(() => {
        if (pathname !== "/") {
            navigate("/");
            setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
        } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, [pathname, navigate]);

    const handlePlayTrack = useCallback((track: Track) => {
        play({
            id: track._id,
            title: track.title,
            artist: track.artistId.name,
            audioUrl: track.audioUrl,
            coverUrl: track.coverUrl,
            duration: track.duration,
        });
        setSearchOpen(false);
    }, [play]);

    const handleSubmit = useCallback((e?: React.FormEvent) => {
        e?.preventDefault();
        if (!query.trim()) return;
        navigate(`/search?q=${encodeURIComponent(query)}`);
        setSearchOpen(false);
    }, [navigate, query]);

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <>
            <style>{`
                /* ── Nav links ── */
                .nav-link {
                    position: relative;
                    padding: 6px 12px;
                    font-size: 13px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.8px;
                    color: rgba(255,255,255,0.85);
                    text-decoration: none;
                    transition: color 0.2s;
                    white-space: nowrap;
                }
                .nav-link::after {
                    content: '';
                    position: absolute;
                    bottom: -2px; left: 12px; right: 12px;
                    height: 1.5px;
                    background: #4ade80;
                    transform: scaleX(0);
                    transition: transform 0.25s cubic-bezier(0.4,0,0.2,1);
                    transform-origin: center;
                }
                .nav-link:hover,
                .nav-link.active { color: #4ade80; }
                .nav-link:hover::after,
                .nav-link.active::after { transform: scaleX(1); }

                /* ── Search input ── */
                .nav-search-input {
                    width: 100%;
                    background: transparent;
                    border: none;
                    outline: none;
                    font-size: 14px;
                    color: #fff;
                    font-family: 'Be Vietnam Pro', sans-serif;
                }
                .nav-search-input::placeholder { color: rgba(255,255,255,0.4); }

                /* ── Dropdown ── */
                .nav-search-dropdown {
                    position: absolute;
                    top: calc(100% + 8px);
                    left: 0; right: 0;
                    background: #0d1f13;
                    border: 1px solid rgba(74,222,128,0.15);
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                    z-index: 100;
                    animation: navDropDown 0.2s ease;
                }
                @keyframes navDropDown {
                    from { opacity: 0; transform: translateY(-8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                /* ── Result item ── */
                .nav-result-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 16px;
                    cursor: pointer;
                    transition: background 0.15s;
                    text-decoration: none;
                    color: inherit;
                }
                .nav-result-item:hover { background: rgba(74,222,128,0.08); }

                /* ── Skeleton shimmer ── */
                @keyframes navShimmer {
                    0%   { background-position: -200% center; }
                    100% { background-position:  200% center; }
                }
                .nav-skeleton {
                    background: linear-gradient(
                        90deg,
                        rgba(255,255,255,0.06) 0%,
                        rgba(255,255,255,0.12) 50%,
                        rgba(255,255,255,0.06) 100%
                    );
                    background-size: 200%;
                    animation: navShimmer 1.5s linear infinite;
                }
            `}</style>

            <nav
                className={cn(
                    "fixed inset-x-0 top-0 z-40 transition-all duration-300",
                    atTop
                        ? "bg-transparent"
                        : "bg-[#05070b]/92 backdrop-blur-md shadow-[0_1px_0_rgba(74,222,128,0.1)]"
                )}
            >
                <div className="w-full flex h-16 items-center px-6 xl:px-10 gap-4 justify-between xl:justify-start">

                    {/* Logo */}
                    <button onClick={goHome} className="flex-shrink-0">
                        <img
                            src="/logo.png"
                            alt="logo"
                            className="h-20 w-auto object-contain cursor-pointer"
                        />
                    </button>

                    {/* Nav links — desktop only */}
                    <div className="hidden xl:flex items-center gap-1 ml-4">
                        {navLinks.map(({ to, label }) => (
                            <Link
                                key={to}
                                to={to}
                                className={cn("nav-link", pathname === to && "active")}
                            >
                                {label}
                            </Link>
                        ))}
                    </div>

                    {/* Search bar — desktop only */}
                    <div
                        ref={searchRef}
                        className="hidden xl:block relative ml-auto"
                        style={{
                            width: searchOpen ? 400 : 200,
                            transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)",
                        }}
                    >
                        <form
                            onSubmit={handleSubmit}
                            onClick={() => setSearchOpen(true)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                background: searchOpen
                                    ? "rgba(255,255,255,0.08)"
                                    : "rgba(255,255,255,0.05)",
                                border: `1px solid ${searchOpen
                                        ? "rgba(74,222,128,0.4)"
                                        : "rgba(255,255,255,0.1)"
                                    }`,
                                borderRadius: 100,
                                padding: "8px 16px",
                                cursor: "text",
                                transition: "all 0.3s",
                            }}
                        >
                            <Search
                                size={14}
                                style={{
                                    color: searchOpen ? "#4ade80" : "rgba(255,255,255,0.4)",
                                    flexShrink: 0,
                                    transition: "color 0.2s",
                                }}
                            />
                            <input
                                ref={inputRef}
                                className="nav-search-input"
                                placeholder={t.searchPlaceholder}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            {query && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setQuery("");
                                        inputRef.current?.focus();
                                    }}
                                    className="flex flex-shrink-0 text-white/40 hover:text-white/70 transition-colors"
                                >
                                    <X size={14} />
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
                                        {/* Tracks */}
                                        {tracks.length > 0 && (
                                            <>
                                                <p className="px-4 pt-2.5 pb-1.5 text-[11px] text-white/40 uppercase tracking-[1.5px] font-semibold">
                                                    {t.tracksLabel}
                                                </p>
                                                {tracks.map((track) => (
                                                    <TrackItem
                                                        key={track._id}
                                                        track={track}
                                                        onPlay={handlePlayTrack}
                                                    />
                                                ))}
                                            </>
                                        )}

                                        {/* Divider */}
                                        {tracks.length > 0 && artists.length > 0 && (
                                            <div className="h-px bg-white/[0.06] my-1" />
                                        )}

                                        {/* Artists */}
                                        {artists.length > 0 && (
                                            <>
                                                <p className="px-4 pt-2.5 pb-1.5 text-[11px] text-white/40 uppercase tracking-[1.5px] font-semibold">
                                                    {t.artistsLabel}
                                                </p>
                                                {artists.map((artist) => (
                                                    <ArtistItem
                                                        key={artist._id}
                                                        artist={artist}
                                                        artistsLabel={t.artistsLabel}
                                                        onClick={() => setSearchOpen(false)}
                                                    />
                                                ))}
                                            </>
                                        )}

                                        {/* View all */}
                                        <button
                                            type="button"
                                            onClick={() => handleSubmit()}
                                            className="w-full px-4 py-3 border-t border-white/[0.06] bg-green-400/5 hover:bg-green-400/10 text-green-400 text-[13px] font-medium transition-colors text-left"
                                            style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
                                        >
                                            {t.seeAllResults} "<strong>{query}</strong>" →
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right section */}
                    <div className="ml-4 xl:ml-0 flex items-center gap-3 flex-shrink-0">
                        <div className="hidden xl:block h-5 w-px bg-white/10" />

                        {/* Language switcher — desktop only */}
                        <div className="hidden xl:block">
                            <LanguageSwitcher />
                        </div>

                        <div className="hidden xl:block h-5 w-px bg-white/10" />

                        {/* Facebook — desktop only */}
                        <Button
                            asChild
                            className="hidden xl:flex bg-transparent hover:bg-transparent px-0"
                        >
                            <a
                                href="https://web.facebook.com/wonmediavn"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 group"
                            >
                                <div className="bg-blue-600 text-white p-1.5 rounded text-sm">
                                    <FaFacebookF />
                                </div>
                                <div className="flex flex-col text-left leading-tight">
                                    <span className="text-[11px] text-white/60">Fanpage</span>
                                    <strong className="text-[13px] text-white group-hover:text-green-400 transition-colors">
                                        Won Media
                                    </strong>
                                </div>
                            </a>
                        </Button>

                        {/* User badge — desktop only, shown when logged in */}
                        {user && (
                            <>
                                <div className="hidden xl:block h-5 w-px bg-white/10" />
                                <Button className="hidden xl:flex items-center gap-2 rounded-[5.28px] bg-white px-4 py-1.5 text-xs font-semibold text-black hover:bg-white/90 transition-colors">
                                    <a
                                        href="/admin"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 group"
                                    >
                                        <User size={13} />
                                        {user.displayName ?? t.member}
                                    </a>
                                </Button>
                            </>
                        )}

                        {/* Hamburger — mobile only */}
                        <button
                            className="xl:hidden rounded bg-white/10 p-2 text-green-400 hover:bg-white/20 transition-colors"
                            onClick={() => setIsSidebarOpen(true)}
                            aria-label={t.openMenu}
                        >
                            <MenuIcon size={18} />
                        </button>
                    </div>
                </div>
            </nav>

            <NavbarSidebar open={isSidebarOpen} onOpenChange={setIsSidebarOpen} />
        </>
    );
};

export default Navbar;