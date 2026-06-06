'use client'
import { useState, useEffect } from "react";
import Link from "next/link";
import { trackService, type Track } from "@/services/trackService";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { chartsSectionText } from "@/locales/home/chartsSection";

type Period = "day" | "week" | "month";

const PERIOD_LIMITS: Record<Period, number> = {
    day:   5,
    week:  8,
    month: 6,
};

const ACCENT_COLORS = [
    { from: "#E8ECF8", to: "#D8DFF0" },
    { from: "#E0F4F0", to: "#C8EDE8" },
    { from: "#EEEEFB", to: "#DDDAF8" },
    { from: "#EAEAFB", to: "#D4D5F8" },
    { from: "#E0F4F0", to: "#C8EDE8" },
    { from: "#E8ECF8", to: "#D8DFF0" },
    { from: "#DCF4F0", to: "#C4EDE8" },
    { from: "#EAEAFB", to: "#DDDAF8" },
];

const TrendIndicator = ({ rank }: { rank: number }) => {
    if (rank === 1) return <span className="trend-badge new">HOT</span>;
    if (rank <= 3)  return <span className="trend-badge up">▲ TOP</span>;
    return <span className="trend-badge same">─</span>;
};

const formatPlays = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000)     return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
};

// Skeleton row
const SkeletonRow = () => (
    <div className="chart-item" style={{ opacity: 0.4, pointerEvents: "none" }}>
        <div className="chart-rank" style={{ background: "var(--m-border)", borderRadius: 4, width: 32, height: 20 }} />
        <div className="chart-thumb" style={{ background: "var(--m-border)" }} />
        <div className="chart-info" style={{ flex: 1 }}>
            <div style={{ height: 13, background: "var(--m-border)", borderRadius: 4, width: "60%", marginBottom: 8 }} />
            <div style={{ height: 11, background: "var(--m-border)", borderRadius: 4, width: "40%" }} />
        </div>
        <div style={{ width: 40, height: 20, background: "var(--m-border)", borderRadius: 4 }} />
        <div className="chart-bar-col">
            <div className="chart-bar-bg" />
        </div>
    </div>
);

const ChartsSection = () => {
    const lang = useLanguageStore((s) => s.lang);
    const t    = chartsSectionText[lang];

    const [period,    setPeriod]    = useState<Period>("week");
    const [tracks,    setTracks]    = useState<Track[]>([]);
    const [loading,   setLoading]   = useState(true);
    const [error,     setError]     = useState<string | null>(null);

    const { play, currentTrack, isPlaying, togglePlay } = usePlayerStore();

    useEffect(() => {
        const fetchTracks = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await trackService.getTop(PERIOD_LIMITS[period]);
                setTracks(data);
            } catch {
                setError(t.error);
            } finally {
                setLoading(false);
            }
        };
        fetchTracks();
    }, [period]);

    // ── Max plays để tính % bar ──
    const maxPlays = tracks.length > 0 ? tracks[0].plays : 1;

    // ── Play / Pause ──
    const handlePlay = (track: Track) => {
        const isThisTrack = currentTrack?.id === track._id;
        if (isThisTrack) {
            togglePlay();
        } else {
            play(
                {
                    id:       track._id,
                    title:    track.title,
                    artist:   track.artistId.name,
                    album:    track.albumId?.title,
                    audioUrl: track.audioUrl,
                    coverUrl: track.coverUrl,
                    duration: track.duration,
                },
                tracks.map((t) => ({
                    id:       t._id,
                    title:    t.title,
                    artist:   t.artistId.name,
                    album:    t.albumId?.title,
                    audioUrl: t.audioUrl,
                    coverUrl: t.coverUrl,
                    duration: t.duration,
                }))
            );
        }
    };

    return (
        <section className="music-section charts-section">
            <div className="music-container">
                <div className="charts-header">
                    <div>
                        <div className="section-label">
                            <span className="section-line" />
                            <span className="section-tag">{t.label}</span>
                        </div>
                        <h2 className="section-title">
                            <span className="text-green">{t.highlight}</span> {t.heading}
                        </h2>
                    </div>

                    {/* Period tabs */}
                    <div className="period-tabs">
                        {(["day", "week", "month"] as Period[]).map((p) => (
                            <button
                                key={p}
                                className={`period-tab ${period === p ? "active" : ""}`}
                                onClick={() => setPeriod(p)}
                            >
                                {t.periods[p]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Error */}
                {error && !loading && (
                    <div style={{ textAlign: "center", color: "var(--m-muted)", padding: "40px 0" }}>
                        <p>{error}</p>
                        <button
                            className="btn-outline-music"
                            style={{ marginTop: 12 }}
                            onClick={() => setPeriod(period)}
                        >
                            {t.retry}
                        </button>
                    </div>
                )}

                {/* Chart list */}
                <div className="chart-list">
                    {loading
                        ? Array.from({ length: PERIOD_LIMITS[period] }).map((_, i) => (
                            <SkeletonRow key={i} />
                        ))
                        : tracks.map((track, idx) => {
                            const isThisTrack   = currentTrack?.id === track._id;
                            const isThisPlaying = isThisTrack && isPlaying;
                            const accent        = ACCENT_COLORS[idx % ACCENT_COLORS.length];
                            const percent       = Math.round((track.plays / maxPlays) * 100);

                            return (
                                <div
                                    key={track._id}
                                    className={`chart-item ${isThisPlaying ? "playing" : ""}`}
                                    style={{ animationDelay: `${idx * 0.06}s` }}
                                >
                                    {/* Rank */}
                                    <div className="chart-rank">
                                        {String(idx + 1).padStart(2, "0")}
                                    </div>

                                    {/* Thumbnail */}
                                    <div
                                        className="chart-thumb"
                                        style={{
                                            background: track.coverUrl
                                                ? `url(${track.coverUrl}) center/cover`
                                                : `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                                        }}
                                    >
                                        <button
                                            className="chart-play-btn"
                                            onClick={() => handlePlay(track)}
                                            aria-label={isThisPlaying ? t.pause : t.play}
                                        >
                                            {isThisPlaying ? "⏸" : "▶"}
                                        </button>
                                    </div>

                                    {/* Info */}
                                    <div className="chart-info">
                                        <div className="chart-title">{track.title}</div>
                                        <div className="chart-artist">
                                            {track.artistId.name}
                                            {track.artistId.verified && (
                                                <span style={{ marginLeft: 4, fontSize: 11 }}>✓</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Trend */}
                                    <TrendIndicator rank={idx + 1} />

                                    {/* Bar */}
                                    <div className="chart-bar-col">
                                        <div className="chart-bar-bg">
                                            <div
                                                className="chart-bar-fill"
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                        <div className="chart-plays">
                                            {formatPlays(track.plays)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    }
                </div>

                <div className="charts-footer">
                    <Link href="/charts" className="btn-outline-music">
                        {t.viewFull}
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default ChartsSection;