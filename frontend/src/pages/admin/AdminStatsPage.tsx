// src/pages/admin/AdminStatsPage.tsx
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
    Music, Mic2, TrendingUp, Clock, Play,
    Users, BarChart2, Activity, ArrowUpRight,
    Minus, Star, BadgeCheck,
    Disc3, Headphones, Zap, Globe,
} from "lucide-react";
import { trackService }  from "@/services/trackService";
import { artistService } from "@/services/artistService";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
};
const fmtTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const fmtHours = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
};

const EQ_H = [28, 55, 40, 72, 33, 62, 48, 80, 38, 55, 68, 42, 76, 30, 58];

// ─── Mini bar chart ───────────────────────────────────────────────────────────
function MiniBar({ values, color = "#4ade80" }: { values: number[]; color?: string }) {
    const max = Math.max(...values, 1);
    return (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 40 }}>
            {values.map((v, i) => (
                <div
                    key={i}
                    style={{
                        flex: 1,
                        height: `${(v / max) * 100}%`,
                        minHeight: 3,
                        borderRadius: "3px 3px 1px 1px",
                        background: color,
                        opacity: 0.3 + (v / max) * 0.7,
                        animation: `ahBar .5s ${i * .04}s cubic-bezier(.4,0,.2,1) both`,
                    }}
                />
            ))}
        </div>
    );
}

// ─── Donut chart ──────────────────────────────────────────────────────────────
function Donut({ segments }: { segments: { value: number; color: string; label: string }[] }) {
    const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
    const r = 52, cx = 64, cy = 64, stroke = 14;
    const circumference = 2 * Math.PI * r;
    let offset = 0;

    return (
        <svg width={128} height={128} viewBox="0 0 128 128">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth={stroke} />
            {segments.map((seg, i) => {
                const dashArray = (seg.value / total) * circumference;
                const dashOffset = circumference - offset;
                offset += dashArray;
                return (
                    <circle
                        key={i}
                        cx={cx} cy={cy} r={r}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth={stroke}
                        strokeDasharray={`${dashArray} ${circumference - dashArray}`}
                        strokeDashoffset={dashOffset}
                        strokeLinecap="round"
                        style={{
                            transform: "rotate(-90deg)",
                            transformOrigin: "center",
                            transition: "stroke-dasharray .8s cubic-bezier(.4,0,.2,1)",
                        }}
                    />
                );
            })}
        </svg>
    );
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function AdminStatsPage() {
    const [tracks,  setTracks]  = useState<any[]>([]);
    const [artists, setArtists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState(false);

    // animated counters
    const [counters, setCounters] = useState({
        tracks: 0, artists: 0, plays: 0, followers: 0,
    });
    const animRef = useRef<number>(0);

    useEffect(() => {
        (async () => {
            try {
                const [tRes, aRes] = await Promise.all([
                    trackService.getAll?.() ?? trackService.getTop(200),
                    artistService.getAll({ limit: 200 }),
                ]);
                const t = Array.isArray(tRes) ? tRes : tRes?.data ?? [];
                const a = Array.isArray(aRes) ? aRes : aRes?.data ?? [];
                setTracks(t);
                setArtists(a);

                // animate counters
                const targets = {
                    tracks:    t.length,
                    artists:   a.length,
                    plays:     t.reduce((s: number, x: any) => s + (x.plays ?? 0), 0),
                    followers: a.reduce((s: number, x: any) => s + (x.followers ?? 0), 0),
                };
                const start = performance.now();
                const dur = 1200;
                const tick = (now: number) => {
                    const p = Math.min((now - start) / dur, 1);
                    const ease = 1 - Math.pow(1 - p, 3);
                    setCounters({
                        tracks:    Math.round(ease * targets.tracks),
                        artists:   Math.round(ease * targets.artists),
                        plays:     Math.round(ease * targets.plays),
                        followers: Math.round(ease * targets.followers),
                    });
                    if (p < 1) animRef.current = requestAnimationFrame(tick);
                };
                animRef.current = requestAnimationFrame(tick);
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        })();
        return () => cancelAnimationFrame(animRef.current);
    }, []);

    // ── Derived stats ──
    const totalPlays     = tracks.reduce((s, t) => s + (t.plays ?? 0), 0);
    const totalDuration  = tracks.reduce((s, t) => s + (t.duration ?? 0), 0);
    const totalFollowers = artists.reduce((s, a) => s + (a.followers ?? 0), 0);
    const verifiedCount  = artists.filter(a => a.verified).length;
    const publishedCount = tracks.filter(t => t.isPublished).length;
    const avgDuration    = tracks.length ? Math.round(totalDuration / tracks.length) : 0;
    const avgPlays       = tracks.length ? Math.round(totalPlays / tracks.length) : 0;

    // Top tracks
    const topTracks = [...tracks].sort((a, b) => (b.plays ?? 0) - (a.plays ?? 0)).slice(0, 8);

    // Top artists by followers
    const topArtists = [...artists].sort((a, b) => (b.followers ?? 0) - (a.followers ?? 0)).slice(0, 6);

    // Genre distribution
    const genreMap: Record<string, number> = {};
    tracks.forEach(t => {
        if (t.genre) genreMap[t.genre] = (genreMap[t.genre] ?? 0) + 1;
    });
    const genreEntries = Object.entries(genreMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);
    const genreTotal = genreEntries.reduce((s, [, v]) => s + v, 0) || 1;

    const GENRE_COLORS = ["#4ade80", "#60a5fa", "#f472b6", "#fb923c", "#a78bfa", "#34d399"];

    // Artist genre donut data
    const artistGenreMap: Record<string, number> = {};
    artists.forEach(a => {
        if (a.genre) artistGenreMap[a.genre] = (artistGenreMap[a.genre] ?? 0) + 1;
    });
    const donutSegments = Object.entries(artistGenreMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([label, value], i) => ({ label, value, color: GENRE_COLORS[i] }));

    const skeletonPulse = `@keyframes sk{0%,100%{opacity:.3}50%{opacity:.7}}`;

    if (error) return (
        <div style={{ fontFamily: "'Be Vietnam Pro',sans-serif", padding: "60px 0", textAlign: "center" }}>
            <p style={{ color: "#f87171", fontSize: 14, marginBottom: 12 }}>Không thể tải dữ liệu thống kê.</p>
            <button
                onClick={() => window.location.reload()}
                style={{ padding: "8px 20px", borderRadius: 10, background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.2)", color: "#f87171", fontSize: 13, cursor: "pointer" }}
            >
                Thử lại
            </button>
        </div>
    );

    return (
        <div style={{ fontFamily: "'Be Vietnam Pro',sans-serif", paddingBottom: 80 }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
                ${skeletonPulse}

                @keyframes ahFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
                @keyframes ahEq     { 0%,100%{transform:scaleY(.2)} 50%{transform:scaleY(1)} }
                @keyframes ahBar    { from{transform:scaleY(0)} to{transform:scaleY(1)} }
                @keyframes ahSpin   { to{transform:rotate(360deg)} }
                @keyframes countUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
                @keyframes ahPulse  { 0%,100%{opacity:.35} 50%{opacity:.75} }
                @keyframes shimmer  {
                    0%   { background-position: 200% 0 }
                    100% { background-position: -200% 0 }
                }

                .as-card {
                    border-radius:18px;
                    border:1px solid rgba(255,255,255,.07);
                    background:rgba(255,255,255,.025);
                    transition:border-color .2s;
                }
                .as-card:hover { border-color:rgba(74,222,128,.12); }

                .as-kpi {
                    padding:20px 22px; border-radius:16px;
                    border:1px solid rgba(255,255,255,.07);
                    background:rgba(255,255,255,.025);
                    transition:all .22s; animation:ahFadeUp .4s both;
                    position:relative; overflow:hidden;
                }
                .as-kpi:hover {
                    background:rgba(255,255,255,.045);
                    border-color:rgba(74,222,128,.2);
                    transform:translateY(-2px);
                }
                .as-kpi::before {
                    content:''; position:absolute; top:0; left:0; right:0; height:1px;
                    background:linear-gradient(90deg,transparent,rgba(74,222,128,.3),transparent);
                    opacity:0; transition:opacity .3s;
                }
                .as-kpi:hover::before { opacity:1; }

                .as-stitle {
                    font-size:11px; color:rgba(255,255,255,.28);
                    letter-spacing:2px; text-transform:uppercase; font-weight:700;
                    margin-bottom:18px; display:flex; align-items:center; gap:8px;
                }
                .as-stitle::after { content:''; flex:1; height:1px; background:rgba(255,255,255,.05); }

                .as-track-row {
                    display:flex; align-items:center; gap:12px;
                    padding:9px 14px; border-radius:11px; transition:background .14s;
                }
                .as-track-row:hover { background:rgba(74,222,128,.05); }

                .as-artist-row {
                    display:flex; align-items:center; gap:10px;
                    padding:8px 14px; border-radius:11px; transition:background .14s;
                }
                .as-artist-row:hover { background:rgba(74,222,128,.05); }

                .as-badge {
                    display:inline-flex; align-items:center; gap:4px;
                    padding:3px 9px; border-radius:100px;
                    font-size:10px; font-weight:700; letter-spacing:.5px;
                }

                .as-delta {
                    display:inline-flex; align-items:center; gap:3px;
                    font-size:11px; font-weight:700; padding:2px 7px;
                    border-radius:100px;
                }
            `}</style>

            {/* ── Header ── */}
            <div style={{ marginBottom: 28, animation: "ahFadeUp .3s both" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
                    <span style={{ fontSize: 11, color: "#4ade80", letterSpacing: "2px", textTransform: "uppercase", fontWeight: 600 }}>
                        Won Music Admin
                    </span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div>
                        <h1 style={{ fontSize: 40, color: "#fff", letterSpacing: 1, marginBottom: 4, lineHeight: 1 }}>
                            Thống Kê Tổng Quan
                        </h1>
                        <p style={{ fontSize: 13, color: "rgba(255,255,255,.4)" }}>
                            Dữ liệu realtime từ toàn bộ hệ thống
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                        <Link to="/admin/tracks"  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", color: "rgba(255,255,255,.5)", fontSize: 12, fontWeight: 600, textDecoration: "none", transition: "all .18s" }}>
                            <Music size={13} /> Bài hát
                        </Link>
                        <Link to="/admin/artists" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", color: "rgba(255,255,255,.5)", fontSize: 12, fontWeight: 600, textDecoration: "none", transition: "all .18s" }}>
                            <Mic2 size={13} /> Nghệ sĩ
                        </Link>
                    </div>
                </div>
                {/* EQ */}
                <div style={{ display: "flex", alignItems: "flex-end", gap: 2.5, height: 20, marginTop: 12 }}>
                    {EQ_H.map((h, i) => (
                        <div key={i} style={{ width: 4, height: `${h}%`, background: `rgba(74,222,128,${.18 + i * .04})`, borderRadius: 2, transformOrigin: "bottom", animation: `ahEq ${.38 + (i % 5) * .13}s ease-in-out infinite`, animationDelay: `${i * .07}s` }} />
                    ))}
                </div>
            </div>

            {/* ════════ KPI Cards ════════ */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginBottom: 24 }}>
                {[
                    {
                        label: "Tổng bài hát",     value: loading ? "—" : fmt(counters.tracks),
                        sub: `${publishedCount} đã xuất bản`,
                        icon: Music,      color: "#4ade80", bg: "rgba(74,222,128,.1)",
                        spark: [3,5,4,7,6,8,5,9,7,8,10,9],
                        delay: "0s",
                    },
                    {
                        label: "Tổng nghệ sĩ",     value: loading ? "—" : fmt(counters.artists),
                        sub: `${verifiedCount} đã xác minh`,
                        icon: Mic2,       color: "#60a5fa", bg: "rgba(96,165,250,.1)",
                        spark: [2,4,3,5,4,6,5,7,6,7,8,7],
                        delay: ".07s",
                    },
                    {
                        label: "Tổng lượt nghe",   value: loading ? "—" : fmt(counters.plays),
                        sub: `TB ${fmt(avgPlays)} / bài`,
                        icon: TrendingUp, color: "#f472b6", bg: "rgba(244,114,182,.1)",
                        spark: [5,8,6,9,7,11,8,12,9,11,13,12],
                        delay: ".14s",
                    },
                    {
                        label: "Tổng followers",   value: loading ? "—" : fmt(counters.followers),
                        sub: `TB ${fmt(artists.length ? Math.round(totalFollowers / artists.length) : 0)} / nghệ sĩ`,
                        icon: Users,      color: "#fb923c", bg: "rgba(251,146,60,.1)",
                        spark: [4,6,5,8,7,9,6,10,8,9,11,10],
                        delay: ".21s",
                    },
                    {
                        label: "Tổng thời lượng",  value: loading ? "—" : fmtHours(totalDuration),
                        sub: `TB ${fmtTime(avgDuration)} / bài`,
                        icon: Clock,      color: "#a78bfa", bg: "rgba(167,139,250,.1)",
                        spark: [3,5,4,6,5,7,4,8,6,7,9,8],
                        delay: ".28s",
                    },
                    {
                        label: "Tỉ lệ xuất bản",   value: loading ? "—" : `${tracks.length ? Math.round(publishedCount / tracks.length * 100) : 0}%`,
                        sub: `${tracks.length - publishedCount} bản nháp`,
                        icon: Globe,      color: "#34d399", bg: "rgba(52,211,153,.1)",
                        spark: [6,8,7,9,8,10,9,10,8,11,10,12],
                        delay: ".35s",
                    },
                ].map(({ label, value, sub, icon: Icon, color, bg, spark, delay }) => (
                    <div key={label} className="as-kpi" style={{ animationDelay: delay }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                            <div style={{ width: 38, height: 38, borderRadius: 11, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Icon size={17} color={color} />
                            </div>
                            {!loading && (
                                <span className="as-delta" style={{ background: "rgba(74,222,128,.1)", color: "#4ade80" }}>
                                    <ArrowUpRight size={10} /> live
                                </span>
                            )}
                        </div>
                        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 36, color: "#fff", letterSpacing: 1, lineHeight: 1, marginBottom: 4 }}>
                            {value}
                        </div>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,.38)", fontWeight: 500, marginBottom: 12 }}>{label}</p>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,.22)", marginBottom: 12 }}>{sub}</p>
                        {!loading && <MiniBar values={spark} color={color} />}
                    </div>
                ))}
            </div>

            {/* ════════ Row 2: Top Tracks + Genre ════════ */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, marginBottom: 16 }}>

                {/* Top tracks */}
                <div className="as-card" style={{ padding: "22px 0", animation: "ahFadeUp .45s both" }}>
                    <div style={{ padding: "0 22px 0 22px" }}>
                        <p className="as-stitle"><TrendingUp size={11} /> Top bài hát theo lượt nghe</p>
                    </div>

                    {loading
                        ? Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 22px", animation: `ahPulse 1.6s ${i * .08}s ease-in-out infinite` }}>
                                <div style={{ width: 22, height: 11, borderRadius: 3, background: "rgba(255,255,255,.07)" }} />
                                <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(255,255,255,.07)", flexShrink: 0 }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ height: 11, borderRadius: 3, background: "rgba(255,255,255,.07)", width: "55%", marginBottom: 7 }} />
                                    <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,.05)", width: "80%" }} />
                                </div>
                                <div style={{ width: 38, height: 11, borderRadius: 3, background: "rgba(255,255,255,.05)" }} />
                            </div>
                        ))
                        : topTracks.map((track, idx) => {
                            const maxP = topTracks[0]?.plays || 1;
                            const pct  = Math.round((track.plays / maxP) * 100);
                            const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : null;
                            return (
                                <div key={track._id} className="as-track-row" style={{ animationDelay: `${idx * .04}s`, margin: "0 8px" }}>
                                    <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, color: medal ? "transparent" : "rgba(74,222,128,.25)", width: 26, textAlign: "center", flexShrink: 0 }}>
                                        {medal ?? String(idx + 1).padStart(2, "0")}
                                    </span>
                                    <div style={{ width: 36, height: 36, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "linear-gradient(135deg,#052e16,#14532d)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        {track.coverUrl
                                            ? <img src={track.coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                            : <Music size={14} color="rgba(74,222,128,.3)" />
                                        }
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <Link to={`/admin/tracks/${track._id}`} style={{ textDecoration: "none" }}>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {track.title}
                                            </p>
                                        </Link>
                                        <div style={{ height: 3, background: "rgba(255,255,255,.07)", borderRadius: 2, overflow: "hidden" }}>
                                            <div style={{ height: "100%", width: `${pct}%`, borderRadius: 2, background: idx < 3 ? "linear-gradient(90deg,#16a34a,#4ade80)" : "rgba(74,222,128,.35)", transition: "width .8s cubic-bezier(.4,0,.2,1)" }} />
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                                        <Play size={10} color="rgba(74,222,128,.5)" />
                                        <span style={{ fontSize: 12, fontWeight: 700, color: idx < 3 ? "#4ade80" : "rgba(255,255,255,.5)" }}>
                                            {fmt(track.plays ?? 0)}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: 11, color: "rgba(255,255,255,.25)", flexShrink: 0 }}>
                                        {track.artistId?.name ?? "—"}
                                    </span>
                                </div>
                            );
                        })
                    }
                </div>

                {/* Genre breakdown */}
                <div className="as-card" style={{ padding: "22px", animation: "ahFadeUp .5s both" }}>
                    <p className="as-stitle"><BarChart2 size={11} /> Phân bố thể loại</p>

                    {loading ? (
                        <div style={{ animation: "ahPulse 1.5s ease-in-out infinite" }}>
                            <div style={{ width: 128, height: 128, borderRadius: "50%", background: "rgba(255,255,255,.06)", margin: "0 auto 20px" }} />
                            {[1,2,3,4].map(i => <div key={i} style={{ height: 28, borderRadius: 8, background: "rgba(255,255,255,.04)", marginBottom: 8 }} />)}
                        </div>
                    ) : genreEntries.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "30px 0" }}>
                            <Disc3 size={32} color="rgba(255,255,255,.1)" style={{ margin: "0 auto 10px", display: "block" }} />
                            <p style={{ fontSize: 12, color: "rgba(255,255,255,.25)" }}>Chưa có dữ liệu</p>
                        </div>
                    ) : (
                        <>
                            {/* Donut */}
                            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20, position: "relative" }}>
                                <Donut segments={donutSegments.length ? donutSegments : [{ value: 1, color: "rgba(74,222,128,.2)", label: "" }]} />
                                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
                                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, color: "#fff", letterSpacing: 1 }}>
                                        {genreEntries.length}
                                    </div>
                                    <div style={{ fontSize: 9, color: "rgba(255,255,255,.3)", letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: 700 }}>
                                        thể loại
                                    </div>
                                </div>
                            </div>

                            {/* Legend bars */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {genreEntries.map(([genre, count], i) => (
                                    <div key={genre}>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                                <div style={{ width: 8, height: 8, borderRadius: 2, background: GENRE_COLORS[i], flexShrink: 0 }} />
                                                <span style={{ fontSize: 12, color: "rgba(255,255,255,.6)", fontWeight: 500 }}>{genre}</span>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                <span style={{ fontSize: 11, color: "rgba(255,255,255,.35)" }}>{count}</span>
                                                <span style={{ fontSize: 10, color: "rgba(255,255,255,.2)" }}>
                                                    {Math.round(count / genreTotal * 100)}%
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ height: 3, background: "rgba(255,255,255,.06)", borderRadius: 2, overflow: "hidden" }}>
                                            <div style={{ height: "100%", width: `${count / genreTotal * 100}%`, background: GENRE_COLORS[i], borderRadius: 2, transition: "width .8s cubic-bezier(.4,0,.2,1)" }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ════════ Row 3: Top Artists + Quick Stats ════════ */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

                {/* Top artists */}
                <div className="as-card" style={{ padding: "22px", animation: "ahFadeUp .55s both" }}>
                    <p className="as-stitle"><Mic2 size={11} /> Top nghệ sĩ theo followers</p>

                    {loading
                        ? Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,.04)", animation: `ahPulse 1.6s ${i * .08}s ease-in-out infinite` }}>
                                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,.07)", flexShrink: 0 }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ height: 11, borderRadius: 3, background: "rgba(255,255,255,.07)", width: "45%", marginBottom: 6 }} />
                                    <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,.05)", width: "65%" }} />
                                </div>
                                <div style={{ width: 42, height: 11, borderRadius: 3, background: "rgba(255,255,255,.05)" }} />
                            </div>
                        ))
                        : topArtists.map((artist, idx) => {
                            const maxF = topArtists[0]?.followers || 1;
                            const pct  = Math.round((artist.followers / maxF) * 100);
                            return (
                                <div key={artist._id} className="as-artist-row" style={{ borderBottom: idx < topArtists.length - 1 ? "1px solid rgba(255,255,255,.04)" : "none", borderRadius: 0, padding: "10px 8px", animationDelay: `${idx * .05}s` }}>
                                    <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, color: "rgba(74,222,128,.22)", width: 22, flexShrink: 0, textAlign: "center" }}>
                                        {String(idx + 1).padStart(2, "0")}
                                    </span>
                                    <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "linear-gradient(135deg,#052e16,#14532d)", display: "flex", alignItems: "center", justifyContent: "center", border: artist.verified ? "2px solid rgba(74,222,128,.35)" : "2px solid transparent" }}>
                                        {artist.avatar
                                            ? <img src={artist.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                            : <Mic2 size={14} color="rgba(74,222,128,.3)" />
                                        }
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                                            <Link to={`/admin/artists/${artist._id}`} style={{ textDecoration: "none" }}>
                                                <span style={{ fontSize: 13, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {artist.name}
                                                </span>
                                            </Link>
                                            {artist.verified && <BadgeCheck size={11} color="#4ade80" />}
                                        </div>
                                        <div style={{ height: 3, background: "rgba(255,255,255,.07)", borderRadius: 2, overflow: "hidden" }}>
                                            <div style={{ height: "100%", width: `${pct}%`, borderRadius: 2, background: idx === 0 ? "linear-gradient(90deg,#16a34a,#4ade80)" : `rgba(74,222,128,${.25 + pct / 100 * .4})`, transition: "width .8s cubic-bezier(.4,0,.2,1)" }} />
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                                        <Users size={10} color="rgba(74,222,128,.5)" />
                                        <span style={{ fontSize: 12, fontWeight: 700, color: idx === 0 ? "#4ade80" : "rgba(255,255,255,.5)" }}>
                                            {fmt(artist.followers ?? 0)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    }
                </div>

                {/* Quick insight cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                    {/* Plays insight */}
                    <div className="as-card" style={{ padding: "20px 22px", animation: "ahFadeUp .6s both" }}>
                        <p className="as-stitle"><Activity size={11} /> Phân tích lượt nghe</p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                            {[
                                { label: "Bài nghe nhiều nhất", value: topTracks[0] ? fmt(topTracks[0].plays) : "—", icon: Zap, color: "#4ade80" },
                                { label: "Bài nghe ít nhất",    value: topTracks.length ? fmt([...tracks].sort((a, b) => (a.plays ?? 0) - (b.plays ?? 0))[0]?.plays ?? 0) : "—", icon: Minus, color: "#f87171" },
                                { label: "Trung bình / bài",    value: fmt(avgPlays), icon: BarChart2, color: "#60a5fa" },
                                { label: "Tổng giờ nghe",       value: fmtHours(totalDuration), icon: Headphones, color: "#fb923c" },
                            ].map(({ label, value, icon: Icon, color }) => (
                                <div key={label} style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                                        <Icon size={12} color={color} />
                                        <span style={{ fontSize: 10, color: "rgba(255,255,255,.3)", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>{label}</span>
                                    </div>
                                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 26, color, letterSpacing: 1 }}>
                                        {loading ? "—" : value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Artist insight */}
                    <div className="as-card" style={{ padding: "20px 22px", animation: "ahFadeUp .65s both", flex: 1 }}>
                        <p className="as-stitle"><Star size={11} /> Phân tích nghệ sĩ</p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            {[
                                { label: "Xác minh", value: verifiedCount, total: artists.length, color: "#4ade80", icon: BadgeCheck },
                                { label: "Chưa xác minh", value: artists.length - verifiedCount, total: artists.length, color: "#fb923c", icon: Mic2 },
                            ].map(({ label, value, total, color, icon: Icon }) => (
                                <div key={label} style={{ padding: "14px", borderRadius: 12, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                                        <Icon size={12} color={color} />
                                        <span style={{ fontSize: 10, color: "rgba(255,255,255,.3)", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>{label}</span>
                                    </div>
                                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 30, color, letterSpacing: 1, marginBottom: 6 }}>
                                        {loading ? "—" : value}
                                    </div>
                                    <div style={{ height: 4, background: "rgba(255,255,255,.06)", borderRadius: 2, overflow: "hidden" }}>
                                        <div style={{ height: "100%", width: `${total ? value / total * 100 : 0}%`, background: color, borderRadius: 2, transition: "width .8s cubic-bezier(.4,0,.2,1)", opacity: .7 }} />
                                    </div>
                                    <span style={{ fontSize: 10, color: "rgba(255,255,255,.2)", marginTop: 4, display: "block" }}>
                                        {total ? Math.round(value / total * 100) : 0}% tổng số
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Most popular genre among artists */}
                        {!loading && donutSegments.length > 0 && (
                            <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,.05)" }}>
                                <p style={{ fontSize: 10, color: "rgba(255,255,255,.25)", letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: 700, marginBottom: 10 }}>
                                    Thể loại phổ biến nhất
                                </p>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                    {donutSegments.slice(0, 4).map((seg) => (
                                        <span key={seg.label} className="as-badge" style={{ background: `${seg.color}18`, border: `1px solid ${seg.color}33`, color: seg.color }}>
                                            {seg.label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}