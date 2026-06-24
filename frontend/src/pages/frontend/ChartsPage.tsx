'use client';
import { useState, useEffect } from "react";
import Link from "next/link";
import { trackService, type Track } from "@/services/trackService";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { chartsText } from "@/locales/charts";
import SEO from "@/components/frontend/SEO";
import { useIsMobile } from "@/hooks/use-mobile";

const formatPlays = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000)     return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
};
const formatTime = (sec: number) =>
    `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;

type Period = "day" | "week" | "month";

const EQ_H = [22, 38, 28, 50, 35, 60, 42, 72, 30, 55, 65, 28, 48, 38, 70, 32, 52, 42, 62, 36];
const MEDAL: Record<number, string> = { 0: "🥇", 1: "🥈", 2: "🥉" };
const PAGE_SIZE_OPTIONS = [5, 10, 20];

const SkeletonRow = ({ idx }: { idx: number }) => (
    <div style={{
        display: "flex", alignItems: "center", gap: 16,
        padding: "12px 20px", borderRadius: 12,
        background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)",
        animation: `cpPulse 1.5s ${idx * 0.05}s ease-in-out infinite`,
    }}>
        <div style={{ width: 40, height: 14, background: "rgba(0,0,0,0.07)", borderRadius: 4 }} />
        <div style={{ width: 48, height: 48, borderRadius: 10, background: "rgba(0,169,143,0.08)" }} />
        <div style={{ flex: 1 }}>
            <div style={{ height: 13, background: "rgba(0,0,0,0.07)", borderRadius: 4, width: "50%", marginBottom: 7 }} />
            <div style={{ height: 10, background: "rgba(0,0,0,0.05)", borderRadius: 4, width: "35%" }} />
        </div>
        <div style={{ width: 60, height: 5, background: "rgba(0,0,0,0.07)", borderRadius: 3 }} />
    </div>
);

const ChartsPage = () => {
    const isMobile = useIsMobile();
    const { lang } = useLanguageStore();
    const t = chartsText[lang];

    const {
        chartsLimitDay, chartsLimitWeek, chartsLimitMonth,
        chartsSeoTitleVi, chartsSeoTitleEn, chartsSeoDescVi, chartsSeoDescEn,
    } = useSettingsStore();

    const PERIOD_LIMITS: Record<Period, number> = {
        day:   chartsLimitDay   || 10,
        week:  chartsLimitWeek  || 20,
        month: chartsLimitMonth || 15,
    };

    const [period,    setPeriod]    = useState<Period>("week");
    const [tracks,    setTracks]    = useState<Track[]>([]);
    const [loading,   setLoading]   = useState(true);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [chartPage, setChartPage] = useState(1);
    const [pageSize,  setPageSize]  = useState(10);

    const { play, togglePlay, currentTrack, isPlaying } = usePlayerStore();
    const currentLimit = PERIOD_LIMITS[period];

    useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, []);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                setChartPage(1);
                const data = await trackService.getTop(currentLimit);
                setTracks(data);
            } finally { setLoading(false); }
        })();
    }, [period, currentLimit]);

    const maxPlays        = tracks.length > 0 ? tracks[0].plays : 1;
    const totalChartPages = Math.ceil(tracks.length / pageSize);
    const pagedTracks     = tracks.slice((chartPage - 1) * pageSize, chartPage * pageSize);

    const handlePlay = (track: Track) => {
        if (currentTrack?.id === track._id) { togglePlay(); return; }
        play(
            { id: track._id, title: track.title, artist: track.artistId.name, audioUrl: track.audioUrl, coverUrl: track.coverUrl, duration: track.duration },
            tracks.map(tr => ({ id: tr._id, title: tr.title, artist: tr.artistId.name, audioUrl: tr.audioUrl, coverUrl: tr.coverUrl, duration: tr.duration }))
        );
    };

    return (
        <>
        <SEO
            title={(lang === "en" ? chartsSeoTitleEn : chartsSeoTitleVi) || "Bảng Xếp Hạng – Won Music"}
            description={(lang === "en" ? chartsSeoDescEn : chartsSeoDescVi) || "Top bài hát hot nhất theo ngày, tuần, tháng trên Won Music."}
            canonical="https://www.wonmusic.vn/charts"
        />
        <div style={{ minHeight: "100vh", background: "#F8F8FC", fontFamily: "'Be Vietnam Pro',sans-serif", color: "#0D0D1A" }}>
            <style>{`
                @keyframes cpPulse  { 0%,100%{opacity:.4} 50%{opacity:.8} }
                @keyframes eqBar    { 0%,100%{transform:scaleY(.2)} 50%{transform:scaleY(1)} }
                @keyframes waveform-anim { 0%,100%{transform:scaleY(.2)} 50%{transform:scaleY(1)} }
                @keyframes cpFadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
                @keyframes barGrow  { from{width:0} to{width:var(--w)} }
                @keyframes rankPop  { 0%{transform:scale(.6);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }

                .cp-row {
                    display:flex; align-items:center; gap:16px;
                    padding:12px 20px; border-radius:12px;
                    transition:all .25s cubic-bezier(.4,0,.2,1);
                    cursor:pointer; border:1px solid transparent;
                    animation:cpFadeUp .4s both;
                    position:relative; overflow:hidden;
                    background:rgba(0,0,0,0.03);
                }
                .cp-row::before {
                    content:''; position:absolute; left:0; top:0; bottom:0; width:3px;
                    background:linear-gradient(to bottom,#34D4B8,#00A98F);
                    transform:scaleY(0); transition:transform .25s;
                    border-radius:0 3px 3px 0;
                }
                .cp-row:hover {
                    background:rgba(0,169,143,0.06);
                    border-color:rgba(0,169,143,0.2);
                    transform:translateX(4px);
                    box-shadow:0 4px 24px rgba(0,169,143,0.10);
                }
                .cp-row:hover::before { transform:scaleY(1); }
                .cp-row.playing {
                    background:rgba(0,169,143,0.08);
                    border-color:rgba(0,169,143,0.30);
                    box-shadow:0 4px 20px rgba(0,169,143,0.12);
                }
                .cp-row.playing::before { transform:scaleY(1); }

                .cp-period-tab {
                    padding:7px 18px; border-radius:8px;
                    border:1px solid rgba(0,0,0,0.10);
                    background:transparent; color:rgba(0,0,0,.5);
                    font-family:'Space Grotesk',sans-serif;
                    font-size:11px; font-weight:700; letter-spacing:1.2px; text-transform:uppercase;
                    cursor:pointer; transition:all .2s; white-space:nowrap;
                }
                .cp-period-tab:hover { border-color:rgba(0,169,143,0.4); color:#00A98F; }
                .cp-period-tab.active {
                    background:rgba(0,169,143,0.12); border-color:rgba(0,169,143,.45);
                    color:#00A98F;
                }
                .cp-bar-fill {
                    height:100%; border-radius:3px;
                    background:linear-gradient(90deg,#00A98F,#34D4B8);
                    animation:barGrow .8s cubic-bezier(.4,0,.2,1) both;
                }
                .cp-rank { animation:rankPop .5s cubic-bezier(.4,0,.2,1) both; }
                .cp-th {
                    font-family:'Space Grotesk',sans-serif;
                    font-size:10px; color:rgba(0,0,0,.4);
                    text-transform:uppercase; letter-spacing:2px; font-weight:700;
                }
                .cp-page-btn {
                    width:34px; height:34px; border-radius:9px;
                    border:1px solid rgba(0,0,0,.10);
                    background:rgba(0,0,0,.04);
                    font-size:13px; cursor:pointer; transition:all .2s;
                    display:flex; align-items:center; justify-content:center;
                    color:rgba(0,0,0,.5);
                    font-family:'Space Grotesk',sans-serif;
                }
                .cp-page-btn:hover:not(:disabled) { border-color:rgba(0,169,143,.4); color:#00A98F; background:rgba(0,169,143,.08); }
                .cp-page-btn.active { background:rgba(0,169,143,.15); border-color:rgba(0,169,143,.5); color:#00A98F; font-weight:700; }
                .cp-page-btn:disabled { opacity:.28; cursor:default; }
                .cp-page-select {
                    padding:6px 28px 6px 10px; border-radius:8px;
                    border:1px solid rgba(0,0,0,.10);
                    background:rgba(0,0,0,.04);
                    font-size:12px; font-weight:700;
                    color:#0D0D1A;
                    font-family:'Space Grotesk',sans-serif;
                    outline:none; cursor:pointer;
                    appearance:none; -webkit-appearance:none;
                    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%2334D4B8' d='M5 7L0 2h10z'/%3E%3C/svg%3E");
                    background-repeat:no-repeat; background-position:right 9px center;
                    transition:border-color .2s;
                }
                .cp-page-select:focus { border-color:rgba(0,169,143,.5); }
            `}</style>

            {/* ══ Hero ══ */}
            <div style={{
                position: "relative",
                overflow: "hidden",
                height: isMobile ? 220 : 300,
                backgroundImage: "url('/partner-bg.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
            }}>
                {/* Teal glow */}
                <div style={{ position: "absolute", top: "-20%", right: "-5%", width: 460, height: 460, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,169,143,0.10),transparent 65%)", pointerEvents: "none" }} />

                {/* EQ bars */}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", alignItems: "flex-end", gap: 2, height: isMobile ? 28 : 40, opacity: .13, pointerEvents: "none" }}>
                    {EQ_H.map((h, i) => (
                        <div key={i} style={{ flex: 1, height: `${h}%`, background: "#00A98F", borderRadius: "2px 2px 0 0", transformOrigin: "bottom", animation: `waveform-anim ${.4+(i%6)*.13}s ease-in-out infinite`, animationDelay: `${i*.04}s` }} />
                    ))}
                </div>

                {/* Content */}
                <div style={{ maxWidth: 1440, margin: "0 auto", padding: `${isMobile ? 76 : 82}px 32px ${isMobile ? 24 : 28}px`, position: "relative", zIndex: 2 }}>
                    {/* Eyebrow */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <span style={{ width: 24, height: 2, background: "#00A98F", borderRadius: 2, display: "block" }} />
                        <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#00A98F" }}>
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
                            <span style={{ color: "#00A98F" }}>{t.highlight}</span>
                        </b>
                    </h1>

                    {/* Subtitle + divider */}
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 14 }}>
                        <div style={{ width: 48, height: 2, background: "linear-gradient(90deg,#00A98F,#34D4B8)", borderRadius: 2 }} />
                        <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, color: "rgba(0,0,0,.45)", letterSpacing: "0.5px" }}>
                            {t.subtitle}
                        </span>
                    </div>
                </div>
            </div>

            {/* ══ Content ══ */}
            <div style={{ maxWidth: 1440, margin: "0 auto", padding: isMobile ? "24px 16px 60px" : "40px 32px 80px" }}>

                {/* Period tabs + sub-heading */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 14 }}>
                    <div>
                        <h2 style={{
                            fontFamily: "'Be Vietnam Pro',sans-serif",
                            fontSize: isMobile ? 18 : 22,
                            fontWeight: 800,
                            color: "#0D0D1A",
                            letterSpacing: "-0.3px",
                            margin: "0 0 4px",
                        }}>
                            Top {currentLimit} · <span style={{ color: "#00A98F" }}>{t.periods[period]}</span>
                        </h2>
                        <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, color: "rgba(0,0,0,.45)", margin: 0 }}>
                            {loading ? t.loading : `${tracks.length} ${t.songs}`}
                        </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        {(["day", "week", "month"] as Period[]).map(p => (
                            <button key={p} className={`cp-period-tab ${period === p ? "active" : ""}`} onClick={() => setPeriod(p)}>
                                {t.periods[p]}
                            </button>
                        ))}
                        <div style={{ width: 1, height: 20, background: "rgba(0,0,0,0.1)", margin: "0 4px" }} />
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, color: "rgba(0,0,0,.4)", whiteSpace: "nowrap" }}>
                                {lang === "vi" ? "Hiển thị" : "Show"}
                            </span>
                            <select
                                className="cp-page-select"
                                value={pageSize}
                                onChange={e => { setPageSize(Number(e.target.value)); setChartPage(1); }}
                            >
                                {PAGE_SIZE_OPTIONS.map(n => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, color: "rgba(0,0,0,.4)", whiteSpace: "nowrap" }}>
                                {lang === "vi" ? "bài/trang" : "per page"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Table header */}
                {!loading && tracks.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "0 20px 10px", borderBottom: "1px solid rgba(0,0,0,0.07)", marginBottom: 6 }}>
                        <div className="cp-th" style={{ width: isMobile ? 36 : 56 }}>#</div>
                        <div style={{ width: isMobile ? 40 : 48 }} />
                        <div className="cp-th" style={{ flex: 1 }}>{t.colTrack}</div>
                        {!isMobile && <div className="cp-th" style={{ width: 120 }}>{t.colArtist}</div>}
                        {!isMobile && <div className="cp-th" style={{ width: 180 }}>{t.colPlays}</div>}
                        <div className="cp-th" style={{ width: 50, textAlign: "right" }}>{t.colDuration}</div>
                    </div>
                )}

                {/* Track list */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {loading
                        ? Array.from({ length: Math.min(pageSize, currentLimit) }).map((_, i) => <SkeletonRow key={i} idx={i} />)
                        : pagedTracks.map((track, idx) => {
                            const globalIdx     = (chartPage - 1) * pageSize + idx;
                            const isThis        = currentTrack?.id === track._id;
                            const isThisPlaying = isThis && isPlaying;
                            const pct           = Math.round((track.plays / maxPlays) * 100);
                            const isTop3        = globalIdx < 3;

                            return (
                                <div
                                    key={track._id}
                                    className={`cp-row ${isThisPlaying ? "playing" : ""}`}
                                    style={{ animationDelay: `${idx * .04}s` }}
                                    onMouseEnter={() => setHoveredId(track._id)}
                                    onMouseLeave={() => setHoveredId(null)}
                                    onClick={() => handlePlay(track)}
                                >
                                    {/* Rank */}
                                    <div className="cp-rank" style={{ width: isMobile ? 36 : 56, flexShrink: 0, animationDelay: `${idx * .05}s` }}>
                                        {isThisPlaying ? (
                                            <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 20, justifyContent: "center" }}>
                                                {[40, 70, 55, 90, 45, 75].map((h, i) => (
                                                    <div key={i} style={{
                                                        width: 3, height: `${h}%`,
                                                        background: "linear-gradient(to top,#00A98F,#34D4B8)",
                                                        borderRadius: 2, transformOrigin: "bottom",
                                                        animation: `eqBar ${.38 + i * .1}s ease-in-out infinite`,
                                                        animationDelay: `${i * .06}s`,
                                                    }} />
                                                ))}
                                            </div>
                                        ) : isTop3 ? (
                                            <div style={{ fontSize: 20, textAlign: "center", lineHeight: 1 }}>{MEDAL[globalIdx]}</div>
                                        ) : (
                                            <div style={{
                                                fontFamily: "'Space Grotesk',sans-serif",
                                                fontSize: 18, fontWeight: 700,
                                                color: hoveredId === track._id ? "#00A98F" : "rgba(0,0,0,.25)",
                                                textAlign: "center", lineHeight: 1, transition: "color .2s",
                                            }}>
                                                {String(globalIdx + 1).padStart(2, "0")}
                                            </div>
                                        )}
                                    </div>

                                    {/* Cover */}
                                    <div style={{
                                        width: isMobile ? 40 : 48, height: isMobile ? 40 : 48,
                                        borderRadius: 10, overflow: "hidden",
                                        background: "linear-gradient(135deg,#E8ECF8,#D8DFF0)",
                                        flexShrink: 0, position: "relative",
                                        boxShadow: isThisPlaying ? "0 4px 16px rgba(0,169,143,.30)" : isTop3 ? "0 4px 12px rgba(0,0,0,.10)" : "none",
                                        border: isTop3 ? "1px solid rgba(0,169,143,.30)" : "1px solid rgba(0,0,0,0.07)",
                                        transition: "box-shadow .2s",
                                    }}>
                                        {track.coverUrl
                                            ? <img src={track.coverUrl} alt={track.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "#00A98F", opacity: 0.6 }}>♪</div>
                                        }
                                        {hoveredId === track._id && (
                                            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16, borderRadius: 10 }}>
                                                {isThisPlaying ? "⏸" : "▶"}
                                            </div>
                                        )}
                                    </div>

                                    {/* Title + genre */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{
                                            fontFamily: "'Be Vietnam Pro',sans-serif",
                                            fontSize: 14, fontWeight: 700, margin: "0 0 3px",
                                            color: isThisPlaying ? "#00A98F" : "#0D0D1A",
                                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                            transition: "color .2s",
                                        }}>
                                            {track.title}
                                            {isTop3 && (
                                                <span style={{
                                                    marginLeft: 8, fontSize: 9, fontWeight: 700,
                                                    fontFamily: "'Space Grotesk',sans-serif",
                                                    color: "#00A98F",
                                                    background: "rgba(0,169,143,0.10)",
                                                    padding: "2px 8px", borderRadius: 100,
                                                    border: "1px solid rgba(0,169,143,.22)",
                                                    letterSpacing: "1.5px", textTransform: "uppercase",
                                                }}>HOT</span>
                                            )}
                                        </p>
                                        {track.genre && (
                                            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, color: "rgba(0,0,0,.45)" }}>
                                                {track.genre}
                                            </span>
                                        )}
                                    </div>

                                    {/* Artist */}
                                    {!isMobile && (
                                        <div style={{ width: 120, flexShrink: 0 }}>
                                            <Link
                                                href={`/artists/${track.artistId._id}`}
                                                onClick={e => e.stopPropagation()}
                                                style={{ fontFamily: "'Be Vietnam Pro',sans-serif", fontSize: 13, color: "rgba(0,0,0,.55)", textDecoration: "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "flex", alignItems: "center", gap: 6, transition: "color .2s" }}
                                                onMouseEnter={e => (e.currentTarget.style.color = "#00A98F")}
                                                onMouseLeave={e => (e.currentTarget.style.color = "rgba(0,0,0,.55)")}
                                            >
                                                {track.artistId.avatar && (
                                                    <img src={track.artistId.avatar} alt={track.artistId.name} style={{ width: 18, height: 18, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                                                )}
                                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.artistId.name}</span>
                                                {track.artistId.verified && <span style={{ color: "#00A98F", fontSize: 10, flexShrink: 0 }}>✓</span>}
                                            </Link>
                                        </div>
                                    )}

                                    {/* Bar + play count */}
                                    {!isMobile && (
                                        <div style={{ width: 180, flexShrink: 0 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <div style={{ flex: 1, height: 4, background: "rgba(0,0,0,0.07)", borderRadius: 3, overflow: "hidden" }}>
                                                    <div className="cp-bar-fill" style={{ "--w": `${pct}%` } as React.CSSProperties} />
                                                </div>
                                                <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, fontWeight: 600, color: "rgba(0,0,0,.55)", minWidth: 36, textAlign: "right" }}>
                                                    {formatPlays(track.plays)}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Duration */}
                                    <div style={{ width: 50, textAlign: "right", flexShrink: 0 }}>
                                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "rgba(0,0,0,.45)" }}>
                                            {formatTime(track.duration)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    }
                </div>

                {/* Empty state */}
                {!loading && tracks.length === 0 && (
                    <div style={{ textAlign: "center", padding: "80px 0" }}>
                        <div style={{ fontSize: 52, marginBottom: 16, opacity: .3 }}>♪</div>
                        <p style={{ fontFamily: "'Be Vietnam Pro',sans-serif", fontSize: 15, color: "rgba(0,0,0,.45)" }}>{t.empty}</p>
                    </div>
                )}

                {/* Pagination */}
                {!loading && totalChartPages > 1 && (
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 36 }}>
                        <button className="cp-page-btn" onClick={() => setChartPage(p => p - 1)} disabled={chartPage === 1}>‹</button>
                        {Array.from({ length: totalChartPages }).map((_, i) => (
                            <button key={i} className={`cp-page-btn ${chartPage === i + 1 ? "active" : ""}`} onClick={() => setChartPage(i + 1)}>
                                {i + 1}
                            </button>
                        ))}
                        <button className="cp-page-btn" onClick={() => setChartPage(p => p + 1)} disabled={chartPage === totalChartPages}>›</button>
                    </div>
                )}

                {/* Back button */}
                {!loading && tracks.length > 0 && (
                    <div style={{ textAlign: "center", marginTop: 36 }}>
                        <Link
                            href="/"
                            style={{
                                display: "inline-flex", alignItems: "center", gap: 8,
                                padding: "10px 24px", borderRadius: 8,
                                border: "1px solid rgba(0,0,0,0.10)", color: "rgba(0,0,0,.55)",
                                textDecoration: "none",
                                fontFamily: "'Space Grotesk',sans-serif",
                                fontSize: 12, fontWeight: 700, letterSpacing: "0.5px",
                                transition: "all .2s", background: "rgba(0,0,0,0.03)",
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(0,169,143,0.4)"; (e.currentTarget as HTMLAnchorElement).style.color = "#00A98F"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(0,0,0,0.10)"; (e.currentTarget as HTMLAnchorElement).style.color = "rgba(0,0,0,.55)"; }}
                        >
                            {t.backHome}
                        </Link>
                    </div>
                )}
            </div>
        </div>
        </>
    );
};

export default ChartsPage;
