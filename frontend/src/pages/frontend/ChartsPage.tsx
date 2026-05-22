// src/pages/ChartsPage.tsx
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { trackService, type Track } from "@/services/trackService";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { chartsText } from "@/locales/charts";
import SEO from "@/components/frontend/SEO";

const NOTES = ["♩","♪","♫","♬","𝄞","𝄢","♭","♮","♯"];

const formatPlays = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000)     return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
};
const formatTime = (sec: number) =>
    `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;

type Period = "day" | "week" | "month";
const PERIOD_LIMITS: Record<Period, number> = { day:10, week:20, month:15 };

const MEDAL: Record<number, string> = { 0:"🥇", 1:"🥈", 2:"🥉" };

const SkeletonRow = ({ idx }: { idx: number }) => (
    <div style={{
        display:"flex", alignItems:"center", gap:16,
        padding:"14px 20px", borderRadius:16,
        background:"#fafafa", border:"1px solid #f3f4f6",
        animation:`apPulse 1.5s ${idx*0.05}s ease-in-out infinite`,
    }}>
        <div style={{ width:40, height:16, background:"#f0fdf4", borderRadius:4 }} />
        <div style={{ width:52, height:52, borderRadius:12, background:"#f0fdf4" }} />
        <div style={{ flex:1 }}>
            <div style={{ height:14, background:"#f0fdf4", borderRadius:4, width:"50%", marginBottom:8 }} />
            <div style={{ height:11, background:"#f0fdf4", borderRadius:4, width:"35%" }} />
        </div>
        <div style={{ width:60, height:6, background:"#f0fdf4", borderRadius:3 }} />
    </div>
);

const ChartsPage = () => {
    const { lang } = useLanguageStore();
    const t = chartsText[lang];

    const [period,    setPeriod]    = useState<Period>("week");
    const [tracks,    setTracks]    = useState<Track[]>([]);
    const [loading,   setLoading]   = useState(true);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const notesBgRef = useRef<HTMLDivElement>(null);
    const canvasRef  = useRef<HTMLCanvasElement>(null);
    const vinylRef   = useRef<HTMLDivElement>(null);

    const { play, togglePlay, currentTrack, isPlaying } = usePlayerStore();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);
    
    // ── Floating notes ──
    useEffect(() => {
        const spawn = () => {
            if (!notesBgRef.current) return;
            const el = document.createElement("div");
            el.textContent = NOTES[Math.floor(Math.random() * NOTES.length)];
            const dur  = 7 + Math.random() * 8;
            const size = 13 + Math.random() * 16;
            el.style.cssText = `
                position:absolute;
                left:${Math.random() * 100}%;
                bottom:-30px;
                font-size:${size}px;
                color:${Math.random()>.5 ? "rgba(74,222,128,0.35)" : "rgba(22,163,74,0.25)"};
                pointer-events:none; user-select:none;
                animation:noteRise ${dur}s linear forwards;
                z-index:0;
            `;
            notesBgRef.current.appendChild(el);
            setTimeout(() => el.remove(), dur * 1000);
        };
        spawn();
        const id = setInterval(spawn, 700);
        return () => clearInterval(id);
    }, []);

    // ── Canvas waveform hero ──
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        let frame = 0, raf: number;
        const draw = () => {
            canvas.width  = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const bars = 120;
            const bw   = canvas.width / bars;
            for (let i = 0; i < bars; i++) {
                const h = (
                    Math.sin(i * 0.18 + frame * 0.04) * 0.35 +
                    Math.sin(i * 0.42 + frame * 0.025) * 0.28 +
                    Math.sin(i * 0.9  + frame * 0.06) * 0.12 +
                    0.35
                ) * canvas.height * 0.85;
                const alpha = 0.25 + Math.sin(i * 0.25 + frame * 0.035) * 0.18;
                ctx.fillStyle = `rgba(74,222,128,${alpha})`;
                ctx.beginPath();
                ctx.roundRect(i * bw + 1, canvas.height - h, bw - 2, h, 2);
                ctx.fill();
            }
            frame++;
            raf = requestAnimationFrame(draw);
        };
        draw();
        return () => cancelAnimationFrame(raf);
    }, []);

    // ── Vinyl spin ──
    useEffect(() => {
        let angle = 0, raf: number;
        const spin = () => {
            angle += 0.3;
            if (vinylRef.current) vinylRef.current.style.transform = `rotate(${angle}deg)`;
            raf = requestAnimationFrame(spin);
        };
        spin();
        return () => cancelAnimationFrame(raf);
    }, []);

    // ── Fetch ──
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const data = await trackService.getTop(PERIOD_LIMITS[period]);
                setTracks(data);
            } finally { setLoading(false); }
        })();
    }, [period]);

    const maxPlays = tracks.length > 0 ? tracks[0].plays : 1;

    const handlePlay = (track: Track) => {
        if (currentTrack?.id === track._id) { togglePlay(); return; }
        play(
            { id:track._id, title:track.title, artist:track.artistId.name, audioUrl:track.audioUrl, coverUrl:track.coverUrl, duration:track.duration },
            tracks.map(t => ({ id:t._id, title:t.title, artist:t.artistId.name, audioUrl:t.audioUrl, coverUrl:t.coverUrl, duration:t.duration }))
        );
    };

    return (
        <>
        <SEO
            title="Bảng Xếp Hạng – Won Music"
            description="Top bài hát hot nhất theo ngày, tuần, tháng trên Won Music. Khám phá charts âm nhạc trending và cập nhật mới nhất."
            canonical="https://www.wonmusic.vn/charts"
        />
        <div style={{ minHeight:"100vh", background:"#fff", fontFamily:"'Be Vietnam Pro',sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');

                @keyframes noteRise {
                    0%   { transform:translateY(0) rotate(0deg) scale(.8); opacity:0; }
                    8%   { opacity:1; }
                    92%  { opacity:.6; }
                    100% { transform:translateY(-520px) rotate(32deg) scale(1.1); opacity:0; }
                }
                @keyframes apPulse { 0%,100%{opacity:.5} 50%{opacity:1} }
                @keyframes eqBar   { 0%,100%{transform:scaleY(.2)} 50%{transform:scaleY(1)} }
                @keyframes fadeUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
                @keyframes shimmerMove {
                    0%   { background-position:-200% center; }
                    100% { background-position: 200% center; }
                }
                @keyframes dotPulse {
                    0%,100%{opacity:1;transform:scale(1)}
                    50%{opacity:.3;transform:scale(.5)}
                }
                @keyframes barGrow {
                    from { width:0; }
                    to   { width:var(--w); }
                }
                @keyframes rankPop {
                    0%   { transform:scale(0.6); opacity:0; }
                    70%  { transform:scale(1.15); }
                    100% { transform:scale(1); opacity:1; }
                }

                /* ── Track row ── */
                .cp-row {
                    display:flex; align-items:center; gap:16px;
                    padding:14px 20px; border-radius:16px;
                    transition:all .25s cubic-bezier(.4,0,.2,1);
                    cursor:pointer; border:1px solid transparent;
                    animation:fadeUp .4s both;
                    position:relative; overflow:hidden;
                    background:#fff;
                }
                .cp-row::before {
                    content:''; position:absolute; left:0; top:0; bottom:0;
                    width:4px;
                    background:linear-gradient(to bottom,#4ade80,#16a34a);
                    transform:scaleY(0); transition:transform .25s;
                    border-radius:0 3px 3px 0;
                }
                .cp-row:hover {
                    background:#f0fdf4;
                    border-color:rgba(22,163,74,.2);
                    transform:translateX(4px);
                    box-shadow:0 4px 24px rgba(22,163,74,.08);
                }
                .cp-row:hover::before { transform:scaleY(1); }
                .cp-row.playing {
                    background:#f0fdf4;
                    border-color:rgba(22,163,74,.3);
                    box-shadow:0 4px 20px rgba(22,163,74,.1);
                }
                .cp-row.playing::before { transform:scaleY(1); }

                /* ── Period tab ── */
                .cp-period-tab {
                    padding:10px 22px; border-radius:100px;
                    border:1.5px solid #e5e7eb;
                    background:transparent; color:#6b7280;
                    font-size:13px; font-weight:500; cursor:pointer;
                    transition:all .2s; font-family:'Be Vietnam Pro',sans-serif;
                    white-space:nowrap;
                }
                .cp-period-tab:hover { border-color:#16a34a; color:#16a34a; }
                .cp-period-tab.active {
                    background:#16a34a; border-color:#16a34a; color:#fff;
                    box-shadow:0 4px 14px rgba(22,163,74,.35);
                }

                /* ── Bar fill ── */
                .cp-bar-fill {
                    height:100%; border-radius:3px;
                    background:linear-gradient(90deg,#16a34a,#4ade80);
                    animation:barGrow .8s cubic-bezier(.4,0,.2,1) both;
                }

                /* ── Rank ── */
                .cp-rank { animation:rankPop .5s cubic-bezier(.4,0,.2,1) both; }
            `}</style>

            {/* ══════════ HERO ══════════ */}
            <div style={{
                height:360, position:"relative", overflow:"hidden",
                padding: "250px 0 200px 0",
                background:"linear-gradient(135deg,#052e16 0%,#0a3d1f 40%,#14532d 70%,#0f2d1a 100%)",
            }}>
                {/* Floating notes */}
                <div ref={notesBgRef} style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }} />

                {/* Canvas waveform */}
                <canvas ref={canvasRef} style={{ position:"absolute", bottom:0, left:0, width:"100%", height:120, opacity:.4, pointerEvents:"none" }} />

                {/* Decorative vinyl */}
                <div style={{ position:"absolute", right:-60, top:"50%", transform:"translateY(-50%)", opacity:.12 }}>
                    <div ref={vinylRef} style={{
                        width:360, height:360, borderRadius:"50%",
                        background:"conic-gradient(from 0deg,#052e16,#16a34a,#1a3d2a,#052e16,#0a2214,#16a34a,#052e16)",
                        border:"2px solid rgba(74,222,128,.2)",
                        display:"flex", alignItems:"center", justifyContent:"center",
                    }}>
                        <div style={{ width:120, height:120, borderRadius:"50%", background:"#16a34a", display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <div style={{ width:32, height:32, borderRadius:"50%", background:"#052e16" }} />
                        </div>
                    </div>
                </div>

                {/* Grid lines decoration */}
                <div style={{ position:"absolute", inset:0, pointerEvents:"none", opacity:.04 }}>
                    {[0,1,2,3,4,5].map(i => (
                        <div key={i} style={{ position:"absolute", left:`${i*20}%`, top:0, bottom:0, width:"1px", background:"#4ade80" }} />
                    ))}
                </div>

                {/* Content */}
                <div style={{ position:"relative", zIndex:2, maxWidth:1200, margin:"0 auto", padding:"0 48px", height:"100%", display:"flex", flexDirection:"column", justifyContent:"center" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                        <span style={{ width:6, height:6, borderRadius:"50%", background:"#4ade80", display:"inline-block", animation:"dotPulse 1.5s ease-in-out infinite" }} />
                        <span style={{ fontSize:11, color:"#4ade80", letterSpacing:"2.5px", textTransform:"uppercase", fontWeight:600 }}>
                            {t.label}
                        </span>
                    </div>

                    <h1 style={{
                        fontFamily: "'Be Vietnam Pro',sans-serif",
                        fontSize:"clamp(56px,9vw,108px)",
                        color:"#fff", lineHeight:.88, letterSpacing:3,
                        marginBottom:16,
                        textShadow:"0 4px 32px rgba(0,0,0,0.3)",
                    }}>
                        {t.heading}<br />
                        <span style={{ color:"#4ade80" }}>{t.highlight}</span>
                    </h1>

                    <p style={{ fontSize:15, color:"rgba(255,255,255,.6)", maxWidth:400, lineHeight:1.7, marginBottom:28 }}>
                        {t.subtitle}
                    </p>

                    {/* Equalizer decoration */}
                    <div style={{ display:"flex", alignItems:"flex-end", gap:3, height:40 }}>
                        {[35,60,45,80,50,70,40,90,55,65,75,38,62,48,85].map((h,i) => (
                            <div key={i} style={{
                                width:5, height:`${h}%`,
                                background:"rgba(74,222,128,0.5)",
                                borderRadius:3, transformOrigin:"bottom",
                                animation:`eqBar ${.38+(i%5)*.14}s ease-in-out infinite`,
                                animationDelay:`${i*.06}s`,
                            }} />
                        ))}
                    </div>
                </div>
            </div>

            {/* ══════════ CONTENT ══════════ */}
            <div style={{ position:"relative", overflow:"hidden" }}>
                <div style={{ maxWidth:1200, margin:"0 auto", padding:"48px 48px 80px", position:"relative", zIndex:1 }}>

                    {/* Period tabs + info */}
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:36, flexWrap:"wrap", gap:16 }}>
                        <div>
                            <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:32, color:"#111827", letterSpacing:1.5, marginBottom:4 }}>
                                Top {PERIOD_LIMITS[period]} · <span style={{ color:"#16a34a" }}>{t.periods[period]}</span>
                            </h2>
                            <p style={{ fontSize:13, color:"#9ca3af" }}>
                                {loading ? t.loading : `${tracks.length} ${t.songs}`}
                            </p>
                        </div>

                        <div style={{ display:"flex", gap:8 }}>
                            {(["day","week","month"] as Period[]).map(p => (
                                <button key={p} className={`cp-period-tab ${period===p?"active":""}`} onClick={() => setPeriod(p)}>
                                    {t.periods[p]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Table header ── */}
                    {!loading && tracks.length > 0 && (
                        <div style={{ display:"flex", alignItems:"center", gap:16, padding:"0 20px 12px", borderBottom:"1px solid #f3f4f6", marginBottom:8 }}>
                            <div style={{ width:56, fontSize:11, color:"#9ca3af", textTransform:"uppercase", letterSpacing:1.5, fontWeight:600 }}>#</div>
                            <div style={{ width:52 }} />
                            <div style={{ flex:1, fontSize:11, color:"#9ca3af", textTransform:"uppercase", letterSpacing:1.5, fontWeight:600 }}>{t.colTrack}</div>
                            <div style={{ width:120, fontSize:11, color:"#9ca3af", textTransform:"uppercase", letterSpacing:1.5, fontWeight:600 }}>{t.colArtist}</div>
                            <div style={{ width:180, fontSize:11, color:"#9ca3af", textTransform:"uppercase", letterSpacing:1.5, fontWeight:600 }}>{t.colPlays}</div>
                            <div style={{ width:50, fontSize:11, color:"#9ca3af", textTransform:"uppercase", letterSpacing:1.5, fontWeight:600, textAlign:"right" }}>{t.colDuration}</div>
                        </div>
                    )}

                    {/* ── List ── */}
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                        {loading
                            ? Array.from({ length: PERIOD_LIMITS[period] }).map((_, i) => <SkeletonRow key={i} idx={i} />)
                            : tracks.map((track, idx) => {
                                const isThis        = currentTrack?.id === track._id;
                                const isThisPlaying = isThis && isPlaying;
                                const pct           = Math.round((track.plays / maxPlays) * 100);
                                const isTop3        = idx < 3;

                                return (
                                    <div
                                        key={track._id}
                                        className={`cp-row ${isThisPlaying ? "playing" : ""}`}
                                        style={{ animationDelay:`${idx*.04}s` }}
                                        onMouseEnter={() => setHoveredId(track._id)}
                                        onMouseLeave={() => setHoveredId(null)}
                                        onClick={() => handlePlay(track)}
                                    >
                                        {/* Rank */}
                                        <div className="cp-rank" style={{ width:56, flexShrink:0, animationDelay:`${idx*.05}s` }}>
                                            {isThisPlaying ? (
                                                <div style={{ display:"flex", alignItems:"flex-end", gap:2, height:20, justifyContent:"center" }}>
                                                    {[40,70,55,90,45,75].map((h,i) => (
                                                        <div key={i} style={{
                                                            width:3, height:`${h}%`, background:"#16a34a",
                                                            borderRadius:2, transformOrigin:"bottom",
                                                            animation:`eqBar ${.38+i*.1}s ease-in-out infinite`,
                                                            animationDelay:`${i*.06}s`,
                                                        }} />
                                                    ))}
                                                </div>
                                            ) : isTop3 ? (
                                                <div style={{ fontSize:22, textAlign:"center", lineHeight:1 }}>
                                                    {MEDAL[idx]}
                                                </div>
                                            ) : (
                                                <div style={{
                                                    fontFamily:"'Barlow Condensed',sans-serif",
                                                    fontSize:22,
                                                    color: hoveredId===track._id ? "#16a34a" : "#d1d5db",
                                                    textAlign:"center", lineHeight:1,
                                                    transition:"color .2s",
                                                }}>
                                                    {String(idx+1).padStart(2,"0")}
                                                </div>
                                            )}
                                        </div>

                                        {/* Cover */}
                                        <div style={{
                                            width:52, height:52, borderRadius:12, overflow:"hidden",
                                            background:"linear-gradient(135deg,#dcfce7,#86efac)",
                                            flexShrink:0, position:"relative",
                                            boxShadow: isThisPlaying ? "0 4px 16px rgba(22,163,74,.3)" : isTop3 ? "0 4px 12px rgba(0,0,0,.1)" : "none",
                                            transition:"box-shadow .2s",
                                            border: isTop3 ? "2px solid rgba(22,163,74,.3)" : "none",
                                        }}>
                                            {track.coverUrl
                                                ? <img src={track.coverUrl} alt={track.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                                                : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, color:"#16a34a" }}>♪</div>
                                            }
                                            {hoveredId === track._id && (
                                                <div style={{
                                                    position:"absolute", inset:0,
                                                    background:"rgba(0,0,0,.45)",
                                                    display:"flex", alignItems:"center", justifyContent:"center",
                                                    color:"#fff", fontSize:16, borderRadius:12,
                                                }}>
                                                    {isThisPlaying ? "⏸" : "▶"}
                                                </div>
                                            )}
                                        </div>

                                        {/* Title */}
                                        <div style={{ flex:1, minWidth:0 }}>
                                            <p style={{
                                                fontSize:14, fontWeight:600,
                                                color: isThisPlaying ? "#16a34a" : "#111827",
                                                marginBottom:3, whiteSpace:"nowrap",
                                                overflow:"hidden", textOverflow:"ellipsis",
                                                transition:"color .2s",
                                            }}>
                                                {track.title}
                                                {isTop3 && (
                                                    <span style={{
                                                        marginLeft:8, fontSize:10, fontWeight:600,
                                                        color:"#16a34a", background:"#f0fdf4",
                                                        padding:"2px 8px", borderRadius:100,
                                                        border:"1px solid rgba(22,163,74,.2)",
                                                    }}>
                                                        HOT
                                                    </span>
                                                )}
                                            </p>
                                            {track.genre && (
                                                <span style={{ fontSize:11, color:"#9ca3af" }}>{track.genre}</span>
                                            )}
                                        </div>

                                        {/* Artist */}
                                        <div style={{ width:120, flexShrink:0 }}>
                                            <Link
                                                to={`/artists/${track.artistId._id}`}
                                                onClick={e => e.stopPropagation()}
                                                style={{
                                                    fontSize:13, color:"#6b7280",
                                                    textDecoration:"none", whiteSpace:"nowrap",
                                                    overflow:"hidden", textOverflow:"ellipsis",
                                                    display:"flex", alignItems:"center", gap:6,
                                                    transition:"color .2s",
                                                }}
                                                onMouseEnter={e => (e.currentTarget.style.color="#16a34a")}
                                                onMouseLeave={e => (e.currentTarget.style.color="#6b7280")}
                                            >
                                                {track.artistId.avatar && (
                                                    <img src={track.artistId.avatar} alt={track.artistId.name}
                                                        style={{ width:20, height:20, borderRadius:"50%", objectFit:"cover", flexShrink:0 }}
                                                    />
                                                )}
                                                <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                                    {track.artistId.name}
                                                </span>
                                                {track.artistId.verified && (
                                                    <span style={{ color:"#16a34a", fontSize:10, flexShrink:0 }}>✓</span>
                                                )}
                                            </Link>
                                        </div>

                                        {/* Bar + plays */}
                                        <div style={{ width:180, flexShrink:0 }}>
                                            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                                <div style={{ flex:1, height:5, background:"#f3f4f6", borderRadius:3, overflow:"hidden" }}>
                                                    <div
                                                        className="cp-bar-fill"
                                                        style={{ "--w":`${pct}%` } as React.CSSProperties}
                                                    />
                                                </div>
                                                <span style={{ fontSize:12, fontWeight:600, color:"#374151", minWidth:36, textAlign:"right" }}>
                                                    {formatPlays(track.plays)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Duration */}
                                        <div style={{ width:50, textAlign:"right", flexShrink:0 }}>
                                            <span style={{ fontSize:12, color:"#9ca3af" }}>{formatTime(track.duration)}</span>
                                        </div>
                                    </div>
                                );
                            })
                        }
                    </div>

                    {/* Empty */}
                    {!loading && tracks.length === 0 && (
                        <div style={{ textAlign:"center", padding:"80px 0", color:"#9ca3af" }}>
                            <div style={{ fontSize:56, marginBottom:16 }}>♪</div>
                            <p style={{ fontSize:16 }}>{t.empty}</p>
                        </div>
                    )}

                    {/* Footer link */}
                    {!loading && tracks.length > 0 && (
                        <div style={{ textAlign:"center", marginTop:48 }}>
                            <Link to="/" style={{
                                display:"inline-flex", alignItems:"center", gap:8,
                                padding:"12px 28px", borderRadius:100,
                                border:"1.5px solid #e5e7eb", color:"#374151",
                                textDecoration:"none", fontSize:14, fontWeight:500,
                                transition:"all .2s", background:"#fff",
                            }}
                                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor="#16a34a"; (e.currentTarget as HTMLAnchorElement).style.color="#16a34a"; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor="#e5e7eb"; (e.currentTarget as HTMLAnchorElement).style.color="#374151"; }}
                            >
                                {t.backHome}
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
        </>
    );
};

export default ChartsPage;