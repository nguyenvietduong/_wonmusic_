'use client'
import { useState, useEffect } from "react";
import Link from "next/link";
import { trackService, type Track } from "@/services/trackService";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { chartsSectionText } from "@/locales/home/chartsSection";

type Period = "day" | "week" | "month";

const PERIOD_LIMITS: Record<Period, number> = {
    day: 5,
    week: 8,
    month: 6,
};

const formatPlays = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
};

const TrendBadge = ({ rank }: { rank: number }) => {
    if (rank === 1) return (
        <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
            padding: "3px 8px", borderRadius: 20,
            background: "color-mix(in srgb, #f59e0b 12%, transparent)",
            color: "#d97706",
            border: "1px solid color-mix(in srgb, #f59e0b 28%, transparent)",
        }}>HOT</span>
    );
    if (rank <= 3) return (
        <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
            padding: "3px 8px", borderRadius: 20,
            background: "color-mix(in srgb, var(--m-green-500) 12%, transparent)",
            color: "var(--m-green-500)",
            border: "1px solid color-mix(in srgb, var(--m-green-500) 25%, transparent)",
        }}>▲ TOP</span>
    );
    return <span style={{ fontSize: 12, color: "var(--m-muted)" }}>—</span>;
};

const SkeletonRow = () => (
    <div style={{
        display: "flex", alignItems: "center", gap: 16,
        padding: "12px 16px", borderRadius: 12,
        background: "var(--m-surface-1)", border: "1px solid var(--m-border)",
        opacity: 0.45,
    }}>
        <div style={{ width: 28, height: 16, background: "var(--m-border)", borderRadius: 4, flexShrink: 0 }} />
        <div style={{ width: 48, height: 48, borderRadius: 10, background: "var(--m-border)", flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ height: 13, background: "var(--m-border)", borderRadius: 4, width: "55%" }} />
            <div style={{ height: 11, background: "var(--m-border)", borderRadius: 4, width: "35%" }} />
        </div>
        <div style={{ width: 44, height: 16, background: "var(--m-border)", borderRadius: 4 }} />
    </div>
);

const ChartsSection = () => {
    const lang = useLanguageStore((s) => s.lang);
    const t = chartsSectionText[lang];
    const {
        chartsLimitDay, chartsLimitWeek, chartsLimitMonth,
        chartsHighlightVi, chartsHeadingVi, chartsHighlightEn, chartsHeadingEn,
        loaded, fetch: fetchSettings,
    } = useSettingsStore();

    const displayHighlight = (lang === "en" ? chartsHighlightEn : chartsHighlightVi) || t.highlight;
    const displayHeading   = (lang === "en" ? chartsHeadingEn   : chartsHeadingVi)   || t.heading;

    useEffect(() => { if (!loaded) fetchSettings(); }, [loaded, fetchSettings]);

    const limits: Record<Period, number> = {
        day:   chartsLimitDay   || PERIOD_LIMITS.day,
        week:  chartsLimitWeek  || PERIOD_LIMITS.week,
        month: chartsLimitMonth || PERIOD_LIMITS.month,
    };

    const [period, setPeriod] = useState<Period>("week");
    const [retryCount, setRetryCount] = useState(0);
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const { play, currentTrack, isPlaying, togglePlay } = usePlayerStore();

    const currentLimit = limits[period];

    useEffect(() => {
        const fetchTracks = async () => {
            try {
                setLoading(true);
                setHasError(false);
                const data = await trackService.getTop(currentLimit);
                setTracks(data);
            } catch {
                setHasError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchTracks();
    }, [period, currentLimit, retryCount]);

    const maxPlays = tracks.length > 0 ? tracks[0].plays : 1;

    const handlePlay = (track: Track) => {
        const isThisTrack = currentTrack?.id === track._id;
        if (isThisTrack) {
            togglePlay();
        } else {
            play(
                { id: track._id, title: track.title, artist: track.artistId.name, album: track.albumId?.title, audioUrl: track.audioUrl, coverUrl: track.coverUrl, duration: track.duration },
                tracks.map((t) => ({ id: t._id, title: t.title, artist: t.artistId.name, album: t.albumId?.title, audioUrl: t.audioUrl, coverUrl: t.coverUrl, duration: t.duration }))
            );
        }
    };

    return (
        <div className="music-section charts-section">
            <style>{`
                /* Section header — wonmedia qp-sechead style */
                .charts-sechead {
                    position: relative;
                    display: flex; align-items: flex-end; justify-content: space-between;
                    gap: 24px; margin-bottom: 24px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid var(--m-border);
                }
                .charts-sechead::after {
                    content: '';
                    position: absolute; left: 0; bottom: -1px;
                    width: 64px; height: 3px;
                    background: var(--m-green-500); border-radius: 2px;
                }
                .charts-sechead__link {
                    flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px;
                    font-size: 13px; font-weight: 700; color: var(--m-text);
                    text-decoration: none; white-space: nowrap; transition: color 0.2s;
                }
                .charts-sechead__link:hover { color: var(--m-green-500); }

                /* Period tabs */
                .charts-period-row {
                    display: flex; gap: 8px; margin-bottom: 20px;
                }
                .charts-period-btn {
                    font-size: 12px; font-weight: 600; letter-spacing: 0.04em;
                    padding: 5px 16px; border-radius: 20px;
                    border: 1px solid var(--m-border);
                    background: transparent; color: var(--m-muted);
                    cursor: pointer; transition: all 0.2s;
                }
                .charts-period-btn:hover { border-color: var(--m-green-500); color: var(--m-green-500); }
                .charts-period-btn.active {
                    background: var(--m-green-500); color: #fff; border-color: var(--m-green-500);
                }

                /* Chart row card */
                .chart-row {
                    display: flex; align-items: center; gap: 14px;
                    padding: 10px 14px; border-radius: 12px;
                    background: var(--m-surface-1);
                    border: 1px solid var(--m-border);
                    transition: border-color 0.35s ease;
                    position: relative; overflow: hidden;
                    margin-bottom: 8px; cursor: pointer;
                }
                /* Gradient border on hover */
                .chart-row::before {
                    content: '';
                    position: absolute; inset: 0; z-index: 3; pointer-events: none;
                    border-radius: 12px; padding: 1px;
                    background: linear-gradient(120deg, transparent 0%, var(--m-green-500) 25%, #34d399 55%, var(--m-green-500) 80%, transparent 100%);
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor; mask-composite: exclude;
                    opacity: 0; transition: opacity 0.4s ease;
                }
                .chart-row:hover { border-color: transparent; }
                .chart-row:hover::before { opacity: 1; }
                .chart-row:hover .chart-row__title { color: var(--m-green-500); }
                .chart-row.playing { border-color: color-mix(in srgb, var(--m-green-500) 35%, transparent); }

                .chart-row__rank {
                    font-size: 13px; font-weight: 800; color: var(--m-muted);
                    width: 28px; text-align: center; flex-shrink: 0;
                    font-variant-numeric: tabular-nums;
                }
                .chart-row.playing .chart-row__rank { color: var(--m-green-500); }

                .chart-row__thumb {
                    width: 48px; height: 48px; border-radius: 10px;
                    background: var(--m-surface-2); flex-shrink: 0;
                    overflow: hidden; position: relative;
                    display: flex; align-items: center; justify-content: center;
                }
                .chart-row__thumb img { width: 100%; height: 100%; object-fit: cover; }
                .chart-row__play-btn {
                    position: absolute; inset: 0;
                    display: flex; align-items: center; justify-content: center;
                    background: rgba(0,0,0,0.35);
                    font-size: 14px; color: #fff;
                    opacity: 0; transition: opacity 0.2s;
                    border: none; cursor: pointer;
                }
                .chart-row:hover .chart-row__play-btn { opacity: 1; }
                .chart-row.playing .chart-row__play-btn { opacity: 1; background: rgba(0,0,0,0.45); }

                .chart-row__info { flex: 1; min-width: 0; }
                .chart-row__title {
                    font-size: 14px; font-weight: 700; color: var(--m-text);
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                    transition: color 0.2s; line-height: 1.3;
                    margin-bottom: 3px;
                }
                .chart-row__artist {
                    font-size: 12px; color: var(--m-muted);
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }

                .chart-row__right {
                    display: flex; align-items: center; gap: 12px;
                    flex-shrink: 0;
                }
                .chart-row__plays {
                    font-size: 12px; font-weight: 600; color: var(--m-muted);
                    font-variant-numeric: tabular-nums; min-width: 40px; text-align: right;
                }

                /* Thin play bar */
                .chart-row__bar {
                    width: 80px; height: 4px;
                    background: var(--m-border); border-radius: 2px;
                    overflow: hidden;
                }
                .chart-row__bar-fill {
                    height: 100%; background: var(--m-green-500);
                    border-radius: 2px; transition: width 0.6s ease;
                }

                @media (max-width: 640px) {
                    .chart-row__bar { display: none; }
                    .chart-row__right { gap: 8px; }
                }
            `}</style>

            <div className="music-container">
                {/* Section header */}
                <div className="charts-sechead">
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
                            <span style={{ color: "var(--m-green-500)" }}>{displayHighlight}</span> {displayHeading}
                        </h2>
                    </div>

                    <Link href="/charts" className="charts-sechead__link">
                        {t.viewFull}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                        </svg>
                    </Link>
                </div>

                {/* Period tabs */}
                <div className="charts-period-row">
                    {(["day", "week", "month"] as Period[]).map((p) => (
                        <button
                            key={p}
                            className={`charts-period-btn${period === p ? " active" : ""}`}
                            onClick={() => setPeriod(p)}
                        >
                            {t.periods[p]}
                        </button>
                    ))}
                </div>

                {/* Error */}
                {hasError && !loading && (
                    <div style={{ textAlign: "center", color: "var(--m-muted)", padding: "40px 0" }}>
                        <p>{t.error}</p>
                        <button
                            className="btn-outline-music"
                            style={{ marginTop: 12 }}
                            onClick={() => setRetryCount(c => c + 1)}
                        >
                            {t.retry}
                        </button>
                    </div>
                )}

                {/* Chart list */}
                <div>
                    {loading
                        ? Array.from({ length: currentLimit }).map((_, i) => <SkeletonRow key={i} />)
                        : tracks.map((track, idx) => {
                            const isThisTrack = currentTrack?.id === track._id;
                            const isThisPlaying = isThisTrack && isPlaying;
                            const percent = Math.round((track.plays / maxPlays) * 100);

                            return (
                                <div
                                    key={track._id}
                                    className={`chart-row${isThisPlaying ? " playing" : ""}`}
                                    style={{ animationDelay: `${idx * 0.05}s` }}
                                >
                                    {/* Rank */}
                                    <div className="chart-row__rank">
                                        {String(idx + 1).padStart(2, "0")}
                                    </div>

                                    {/* Thumbnail + play btn */}
                                    <div
                                        className="chart-row__thumb"
                                        style={!track.coverUrl ? { background: `hsl(${(idx * 47) % 360}, 40%, 88%)` } : undefined}
                                    >
                                        {track.coverUrl && (
                                            <img src={track.coverUrl} alt={track.title} />
                                        )}
                                        <button
                                            className="chart-row__play-btn"
                                            onClick={() => handlePlay(track)}
                                            aria-label={isThisPlaying ? t.pause : t.play}
                                        >
                                            {isThisPlaying ? "⏸" : "▶"}
                                        </button>
                                    </div>

                                    {/* Info */}
                                    <div className="chart-row__info">
                                        <div className="chart-row__title">{track.title}</div>
                                        <div className="chart-row__artist">
                                            {track.artistId.name}
                                            {track.artistId.verified && (
                                                <span style={{ marginLeft: 4, color: "var(--m-green-500)", fontSize: 11 }}>✓</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right side */}
                                    <div className="chart-row__right">
                                        <TrendBadge rank={idx + 1} />

                                        <div className="chart-row__bar">
                                            <div className="chart-row__bar-fill" style={{ width: `${percent}%` }} />
                                        </div>

                                        <div className="chart-row__plays">
                                            {formatPlays(track.plays)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    }
                </div>
            </div>
        </div>
    );
};

export default ChartsSection;
