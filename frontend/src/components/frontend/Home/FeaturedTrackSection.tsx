import { useState, useEffect } from "react";
import "@/styles/music-theme.css";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { trackService, type Track } from "@/services/trackService";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { featuredTrackText } from "@/locales/home/featuredTrack";

const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
};

const formatPlays = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000)     return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
};

const FeaturedTrackSection = () => {
    const lang = useLanguageStore((s) => s.lang);
    const t    = featuredTrackText[lang];

    const [liked,         setLiked]         = useState(false);
    const [featuredTrack, setFeaturedTrack] = useState<Track | null>(null);
    const [loading,       setLoading]       = useState(true);

    const {
        play, togglePlay,
        currentTrack, isPlaying,
        currentTime, duration, seekTo,
    } = usePlayerStore();

    // ── Fetch bài có lượt nghe cao nhất ──
    useEffect(() => {
        const fetchTopTrack = async () => {
            try {
                setLoading(true);
                const tracks = await trackService.getTop(1); // chỉ lấy 1 bài đầu

                if (tracks.length > 0) setFeaturedTrack(tracks[0]);
            } catch (err) {
                console.error("Không thể tải bài hát nổi bật:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTopTrack();
    }, []);

    const isThisTrack   = currentTrack?.id === featuredTrack?._id;
    const isThisPlaying = isThisTrack && isPlaying;

    const progress      = isThisTrack && duration ? (currentTime / duration) * 100 : 0;
    const displayTime   = isThisTrack ? currentTime : 0;
    const displayDuration = isThisTrack && duration
        ? duration
        : (featuredTrack?.duration ?? 0);

    // ── Play / Pause ──
    const handleTogglePlay = () => {
        if (!featuredTrack) return;
        if (!isThisTrack) {
            trackService.incrementPlays(featuredTrack._id);
            play({
                id:       featuredTrack._id,
                title:    featuredTrack.title,
                artist:   featuredTrack.artistId.name,
                album:    featuredTrack.albumId?.title,
                audioUrl: featuredTrack.audioUrl,
                coverUrl: featuredTrack.coverUrl,
                duration: featuredTrack.duration,
            });
        } else {
            togglePlay();
        }
    };

    // ── Seek ──
    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isThisTrack) return;
        const rect  = e.currentTarget.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        seekTo(Math.floor(ratio * displayDuration));
    };

    // ── Loading skeleton ──
    if (loading) return (
        <section className="music-section featured-section">
            <div className="featured-blob b1" />
            <div className="featured-blob b2" />
            <div className="music-container">
                <div className="featured-grid" style={{ opacity: 0.4 }}>
                    <div className="featured-cover-wrap">
                        <div className="featured-cover" />
                    </div>
                    <div className="featured-info">
                        {[200, 140, 100, 80].map((w, i) => (
                            <div key={i} style={{
                                height: i === 0 ? 48 : 16,
                                width: w,
                                background: "var(--m-border)",
                                borderRadius: 6,
                                marginBottom: 16,
                            }} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );

    if (!featuredTrack) return null;

    return (
        <section className="music-section featured-section">
            <div className="featured-blob b1" />
            <div className="featured-blob b2" />

            <div className="music-container">
                <div className="section-label">
                    <span className="section-line" />
                    <span className="section-tag">{t.label}</span>
                </div>

                <div className="featured-grid">
                    {/* Album Cover */}
                    <div className="featured-cover-wrap">
                        <div
                            className={`featured-cover ${isThisPlaying ? "spinning" : ""}`}
                            style={featuredTrack.coverUrl ? {
                                backgroundImage:    `url(${featuredTrack.coverUrl})`,
                                backgroundSize:     "cover",
                                backgroundPosition: "center",
                            } : undefined}
                        >
                            <div className="cover-overlay">
                                <button
                                    className={`cover-play-btn ${isThisPlaying ? "playing" : ""}`}
                                    onClick={handleTogglePlay}
                                    aria-label={isThisPlaying ? t.pause : t.play}
                                >
                                    {isThisPlaying ? "⏸" : "▶"}
                                </button>
                            </div>
                            <div className="cover-ring r1" />
                            <div className="cover-ring r2" />
                            <div className="cover-ring r3" />
                        </div>

                        <div className="cover-reflection" />
                        <span className="badge-new">{t.hotBadge}</span>

                        <div className={`waveform ${isThisPlaying ? "active" : ""}`}>
                            {Array.from({ length: 48 }).map((_, i) => (
                                <span
                                    key={i}
                                    className="waveform-bar"
                                    style={{
                                        height: `${20 + Math.sin(i * 0.4) * 16 + Math.random() * 20}px`,
                                        animationDelay: `${i * 0.04}s`,
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Track Info */}
                    <div className="featured-info">
                        <h2 className="featured-title">{featuredTrack.title}</h2>

                        <div className="featured-artist">
                            {featuredTrack.artistId.avatar && (
                                <img
                                    src={featuredTrack.artistId.avatar}
                                    alt={featuredTrack.artistId.name}
                                    style={{
                                        width: 24, height: 24,
                                        borderRadius: "50%",
                                        objectFit: "cover",
                                        marginRight: 8,
                                        verticalAlign: "middle",
                                    }}
                                />
                            )}
                            {featuredTrack.artistId.name}
                            {featuredTrack.artistId.verified && (
                                <span style={{ marginLeft: 6, fontSize: 13 }}>✓</span>
                            )}
                        </div>

                        {featuredTrack.albumId && (
                            <div className="featured-album">
                                <span className="icon-disc">💿</span>
                                {featuredTrack.albumId.title}
                            </div>
                        )}

                        {/* Stats */}
                        <div className="track-stats">
                            <div className="track-stat-item">
                                <strong>{formatPlays(featuredTrack.plays)}</strong>
                                <span>{t.plays}</span>
                            </div>
                            {featuredTrack.releaseYear && (
                                <div className="track-stat-item">
                                    <strong>{featuredTrack.releaseYear}</strong>
                                    <span>{t.releaseYear}</span>
                                </div>
                            )}
                            {featuredTrack.genre && (
                                <div className="track-stat-item">
                                    <strong>{featuredTrack.genre}</strong>
                                    <span>{t.genre}</span>
                                </div>
                            )}
                        </div>

                        {/* Progress */}
                        <div className="progress-container">
                            <div className="progress-track" onClick={handleSeek}>
                                <div className="progress-fill" style={{ width: `${progress}%` }}>
                                    <div className="progress-thumb" />
                                </div>
                            </div>
                            <div className="progress-time">
                                <span>{formatTime(Math.floor(displayTime))}</span>
                                <span>{formatTime(displayDuration)}</span>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="player-controls">
                            <button className="ctrl-btn" title="Shuffle">🔀</button>
                            <button
                                className="ctrl-btn"
                                title={t.rewind}
                                onClick={() => isThisTrack && seekTo(0)}
                            >
                                ⏮
                            </button>
                            <button className="ctrl-btn play-main" onClick={handleTogglePlay}>
                                {isThisPlaying ? "⏸" : "▶"}
                            </button>
                            <button className="ctrl-btn" title={t.next}>⏭</button>
                            <button
                                className={`ctrl-btn ${liked ? "liked" : ""}`}
                                onClick={() => setLiked(!liked)}
                            >
                                {liked ? "❤️" : "🤍"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FeaturedTrackSection;