'use client';
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { trackService, type Track } from "@/services/trackService";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useLanguageStore } from "@/stores/useLanguageStore";
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
const PERIOD_LIMITS: Record<Period, number> = { day:10, week:20, month:15 };
const MEDAL: Record<number, string> = { 0:"🥇", 1:"🥈", 2:"🥉" };

const SkeletonRow = ({ idx }: { idx: number }) => (
    <div style={{
        display:"flex", alignItems:"center", gap:16,
        padding:"12px 20px", borderRadius:12,
        background:"rgba(0,0,0,0.03)", border:"1px solid rgba(0,0,0,0.07)",
        animation:`cpPulse 1.5s ${idx*0.05}s ease-in-out infinite`,
    }}>
        <div style={{ width:40, height:14, background:"rgba(0,0,0,0.07)", borderRadius:4 }} />
        <div style={{ width:48, height:48, borderRadius:10, background:"rgba(0,169,143,0.08)" }} />
        <div style={{ flex:1 }}>
            <div style={{ height:13, background:"rgba(0,0,0,0.07)", borderRadius:4, width:"50%", marginBottom:7 }} />
            <div style={{ height:10, background:"rgba(0,0,0,0.05)", borderRadius:4, width:"35%" }} />
        </div>
        <div style={{ width:60, height:5, background:"rgba(0,0,0,0.07)", borderRadius:3 }} />
    </div>
);

const ChartsPage = () => {
    const isMobile = useIsMobile();
    const { lang } = useLanguageStore();
    const t = chartsText[lang];

    const [period,    setPeriod]    = useState<Period>("week");
    const [tracks,    setTracks]    = useState<Track[]>([]);
    const [loading,   setLoading]   = useState(true);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const canvasRef  = useRef<HTMLCanvasElement>(null);
    const vinylRef   = useRef<HTMLDivElement>(null);

    const { play, togglePlay, currentTrack, isPlaying } = usePlayerStore();

    useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, []);

    // Canvas waveform
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
            const bars = 120, bw = canvas.width / bars;
            for (let i = 0; i < bars; i++) {
                const h = (
                    Math.sin(i * 0.18 + frame * 0.04) * 0.35 +
                    Math.sin(i * 0.42 + frame * 0.025) * 0.28 +
                    Math.sin(i * 0.9  + frame * 0.06) * 0.12 + 0.35
                ) * canvas.height * 0.85;
                const alpha = 0.2 + Math.sin(i * 0.25 + frame * 0.035) * 0.12;
                ctx.fillStyle = `rgba(0,169,143,${alpha})`;
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

    // Vinyl spin
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
            tracks.map(tr => ({ id:tr._id, title:tr.title, artist:tr.artistId.name, audioUrl:tr.audioUrl, coverUrl:tr.coverUrl, duration:tr.duration }))
        );
    };

    return (
        <>
        <SEO
            title="Bảng Xếp Hạng – Won Music"
            description="Top bài hát hot nhất theo ngày, tuần, tháng trên Won Music."
            canonical="https://www.wonmusic.vn/charts"
        />
        <div style={{ minHeight:"100vh", background:"#F8F8FC", fontFamily:"'Be Vietnam Pro',sans-serif", color:"#0D0D1A" }}>
            <style>{`
                @keyframes cpPulse { 0%,100%{opacity:.4} 50%{opacity:.8} }
                @keyframes eqBar   { 0%,100%{transform:scaleY(.2)} 50%{transform:scaleY(1)} }
                @keyframes fadeUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
                @keyframes barGrow { from{width:0} to{width:var(--w)} }
                @keyframes rankPop { 0%{transform:scale(.6);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
                @keyframes dotPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(.5)} }

                .cp-row {
                    display:flex; align-items:center; gap:16px;
                    padding:12px 20px; border-radius:12px;
                    transition:all .25s cubic-bezier(.4,0,.2,1);
                    cursor:pointer; border:1px solid transparent;
                    animation:fadeUp .4s both;
                    position:relative; overflow:hidden;
                    background:rgba(0,0,0,0.03);
                }
                .cp-row::before {
                    content:''; position:absolute; left:0; top:0; bottom:0; width:3px;
                    background:linear-gradient(to bottom, #34D4B8, #00A98F);
                    transform:scaleY(0); transition:transform .25s;
                    border-radius:0 3px 3px 0;
                }
                .cp-row:hover {
                    background:rgba(0,169,143,0.06);
                    border-color:rgba(0,169,143,0.2);
                    transform:translateX(4px);
                    box-shadow:0 4px 24px rgba(0,169,143,0.1);
                }
                .cp-row:hover::before { transform:scaleY(1); }
                .cp-row.playing {
                    background:rgba(0,169,143,0.08);
                    border-color:rgba(0,169,143,0.3);
                    box-shadow:0 4px 20px rgba(0,169,143,0.12);
                }
                .cp-row.playing::before { transform:scaleY(1); }

                .cp-period-tab {
                    padding:9px 20px; border-radius:8px;
                    border:1px solid rgba(0,0,0,0.1);
                    background:transparent; color:rgba(0,0,0,.5);
                    font-family:'Space Grotesk',sans-serif;
                    font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase;
                    cursor:pointer; transition:all .2s; white-space:nowrap;
                }
                .cp-period-tab:hover { border-color:rgba(0,169,143,0.4); color:#34D4B8; }
                .cp-period-tab.active {
                    background:rgba(0,169,143,0.15); border-color:rgba(0,169,143,0.5);
                    color:#34D4B8;
                }
                .cp-bar-fill {
                    height:100%; border-radius:3px;
                    background:linear-gradient(90deg,#00A98F,#34D4B8);
                    animation:barGrow .8s cubic-bezier(.4,0,.2,1) both;
                }
                .cp-rank { animation:rankPop .5s cubic-bezier(.4,0,.2,1) both; }
                .cp-th {
                    font-family:'Space Grotesk',sans-serif;
                    font-size:10px; color:rgba(0,0,0,.4); text-transform:uppercase;
                    letter-spacing:2px; font-weight:700;
                }
            `}</style>

            {/* ══ Hero ══ */}
            <div style={{ height:300, position:"relative", overflow:"hidden", background:"linear-gradient(135deg, #F0F2FA 0%, #E8ECF8 40%, #EAEAFB 70%, #F0F2FA 100%)" }}>
                {/* Vinyl */}
                <div style={{ position:"absolute", right:-50, top:"50%", transform:"translateY(-50%)", opacity:.1 }}>
                    <div ref={vinylRef} style={{
                        width:320, height:320, borderRadius:"50%",
                        background:"conic-gradient(from 0deg, #D8DCF0, #C8CEE8, #D8DCF0, #E0E4F4, #D0D8F0, #00A98F, #D8DCF0)",
                        border:"2px solid rgba(0,169,143,0.2)",
                        display:"flex", alignItems:"center", justifyContent:"center",
                    }}>
                        <div style={{ width:110, height:110, borderRadius:"50%", background:"#D0D8F0", display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <div style={{ width:30, height:30, borderRadius:"50%", background:"#F0F2FA" }} />
                        </div>
                    </div>
                </div>

                {/* Grid lines */}
                <div style={{ position:"absolute", inset:0, pointerEvents:"none", opacity:.04 }}>
                    {[0,1,2,3,4,5].map(i => (
                        <div key={i} style={{ position:"absolute", left:`${i*20}%`, top:0, bottom:0, width:1, background:"#34D4B8" }} />
                    ))}
                </div>

                <canvas ref={canvasRef} style={{ position:"absolute", bottom:0, left:0, width:"100%", height:100, opacity:.5, pointerEvents:"none" }} />

                <div style={{ position:"relative", zIndex:2, maxWidth:1200, margin:"0 auto", padding: isMobile ? "0 16px" : "0 48px", height:"100%", display:"flex", flexDirection:"column", justifyContent:"center" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                        <span style={{ width:6, height:6, borderRadius:"50%", background:"#34D4B8", display:"inline-block", animation:"dotPulse 1.5s ease-in-out infinite" }} />
                        <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:10, color:"#34D4B8", letterSpacing:"2.5px", textTransform:"uppercase", fontWeight:700 }}>
                            {t.label}
                        </span>
                    </div>

                    <h1 style={{
                        fontFamily:"'Be Vietnam Pro',sans-serif",
                        fontSize:"clamp(44px,8vw,88px)", color:"#0D0D1A",
                        lineHeight:.9, letterSpacing:2, marginBottom:12,
                    }}>
                        {t.heading}<br />
                        <span style={{ color:"#34D4B8" }}>{t.highlight}</span>
                    </h1>

                    <p style={{ fontSize:14, color:"rgba(0,0,0,.55)", maxWidth:380, lineHeight:1.7 }}>{t.subtitle}</p>
                </div>
            </div>

            {/* ══ Content ══ */}
            <div style={{ maxWidth:1200, margin:"0 auto", padding: isMobile ? "24px 16px 60px" : "40px 48px 80px" }}>

                {/* Period tabs + heading */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28, flexWrap:"wrap", gap:14 }}>
                    <div>
                        <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:26, color:"#0D0D1A", letterSpacing:0, marginBottom:4, fontWeight:700 }}>
                            Top {PERIOD_LIMITS[period]} · <span style={{ color:"#34D4B8" }}>{t.periods[period]}</span>
                        </h2>
                        <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:12, color:"rgba(0,0,0,.45)" }}>
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

                {/* Table header */}
                {!loading && tracks.length > 0 && (
                    <div style={{ display:"flex", alignItems:"center", gap:16, padding:"0 20px 10px", borderBottom:"1px solid rgba(0,0,0,0.07)", marginBottom:6 }}>
                        <div className="cp-th" style={{ width: isMobile ? 36 : 56 }}>#</div>
                        <div style={{ width: isMobile ? 40 : 48 }} />
                        <div className="cp-th" style={{ flex:1 }}>{t.colTrack}</div>
                        {!isMobile && <div className="cp-th" style={{ width:120 }}>{t.colArtist}</div>}
                        {!isMobile && <div className="cp-th" style={{ width:180 }}>{t.colPlays}</div>}
                        <div className="cp-th" style={{ width:50, textAlign:"right" }}>{t.colDuration}</div>
                    </div>
                )}

                {/* List */}
                <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
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
                                    <div className="cp-rank" style={{ width: isMobile ? 36 : 56, flexShrink:0, animationDelay:`${idx*.05}s` }}>
                                        {isThisPlaying ? (
                                            <div style={{ display:"flex", alignItems:"flex-end", gap:2, height:20, justifyContent:"center" }}>
                                                {[40,70,55,90,45,75].map((h,i) => (
                                                    <div key={i} style={{
                                                        width:3, height:`${h}%`,
                                                        background:"linear-gradient(to top,#00A98F,#34D4B8)",
                                                        borderRadius:2, transformOrigin:"bottom",
                                                        animation:`eqBar ${.38+i*.1}s ease-in-out infinite`,
                                                        animationDelay:`${i*.06}s`,
                                                    }} />
                                                ))}
                                            </div>
                                        ) : isTop3 ? (
                                            <div style={{ fontSize:20, textAlign:"center", lineHeight:1 }}>{MEDAL[idx]}</div>
                                        ) : (
                                            <div style={{
                                                fontFamily:"'Space Grotesk',sans-serif", fontSize:18, fontWeight:700,
                                                color: hoveredId===track._id ? "#34D4B8" : "rgba(0,0,0,.25)",
                                                textAlign:"center", lineHeight:1, transition:"color .2s",
                                            }}>
                                                {String(idx+1).padStart(2,"0")}
                                            </div>
                                        )}
                                    </div>

                                    {/* Cover */}
                                    <div style={{
                                        width: isMobile ? 40 : 48, height: isMobile ? 40 : 48, borderRadius:10, overflow:"hidden",
                                        background:"linear-gradient(135deg,#E8ECF8,#D8DFF0)",
                                        flexShrink:0, position:"relative",
                                        boxShadow: isThisPlaying ? "0 4px 16px rgba(0,169,143,.3)" : isTop3 ? "0 4px 12px rgba(0,0,0,.1)" : "none",
                                        border: isTop3 ? "1px solid rgba(0,169,143,.3)" : "1px solid rgba(0,0,0,0.07)",
                                        transition:"box-shadow .2s",
                                    }}>
                                        {track.coverUrl
                                            ? <img src={track.coverUrl} alt={track.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                                            : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, color:"#34D4B8", opacity:0.6 }}>♪</div>
                                        }
                                        {hoveredId === track._id && (
                                            <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.55)", display:"flex", alignItems:"center", justifyContent:"center", color:"#34D4B8", fontSize:16, borderRadius:10 }}>
                                                {isThisPlaying ? "⏸" : "▶"}
                                            </div>
                                        )}
                                    </div>

                                    {/* Title */}
                                    <div style={{ flex:1, minWidth:0 }}>
                                        <p style={{
                                            fontSize:14, fontWeight:600,
                                            color: isThisPlaying ? "#34D4B8" : "#0D0D1A",
                                            marginBottom:2, whiteSpace:"nowrap",
                                            overflow:"hidden", textOverflow:"ellipsis",
                                            transition:"color .2s",
                                        }}>
                                            {track.title}
                                            {isTop3 && (
                                                <span style={{ marginLeft:8, fontSize:9, fontWeight:700, fontFamily:"'Space Grotesk',sans-serif", color:"#34D4B8", background:"rgba(0,169,143,0.12)", padding:"2px 8px", borderRadius:100, border:"1px solid rgba(0,169,143,.25)", letterSpacing:"1.5px", textTransform:"uppercase" }}>
                                                    HOT
                                                </span>
                                            )}
                                        </p>
                                        {track.genre && <span style={{ fontSize:11, color:"rgba(0,0,0,.45)" }}>{track.genre}</span>}
                                    </div>

                                    {/* Artist */}
                                    {!isMobile && <div style={{ width:120, flexShrink:0 }}>
                                        <Link
                                            href={`/artists/${track.artistId._id}`}
                                            onClick={e => e.stopPropagation()}
                                            style={{ fontSize:13, color:"rgba(0,0,0,.55)", textDecoration:"none", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", display:"flex", alignItems:"center", gap:6, transition:"color .2s" }}
                                            onMouseEnter={e => (e.currentTarget.style.color="#34D4B8")}
                                            onMouseLeave={e => (e.currentTarget.style.color="rgba(0,0,0,.55)")}
                                        >
                                            {track.artistId.avatar && (
                                                <img src={track.artistId.avatar} alt={track.artistId.name} style={{ width:18, height:18, borderRadius:"50%", objectFit:"cover", flexShrink:0 }} />
                                            )}
                                            <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{track.artistId.name}</span>
                                            {track.artistId.verified && <span style={{ color:"#34D4B8", fontSize:10, flexShrink:0 }}>✓</span>}
                                        </Link>
                                    </div>}

                                    {/* Bar + plays */}
                                    {!isMobile && <div style={{ width:180, flexShrink:0 }}>
                                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                            <div style={{ flex:1, height:4, background:"rgba(0,0,0,0.07)", borderRadius:3, overflow:"hidden" }}>
                                                <div className="cp-bar-fill" style={{ "--w":`${pct}%` } as React.CSSProperties} />
                                            </div>
                                            <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:12, fontWeight:600, color:"rgba(0,0,0,.55)", minWidth:36, textAlign:"right" }}>
                                                {formatPlays(track.plays)}
                                            </span>
                                        </div>
                                    </div>}

                                    {/* Duration */}
                                    <div style={{ width:50, textAlign:"right", flexShrink:0 }}>
                                        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:"rgba(0,0,0,.45)" }}>{formatTime(track.duration)}</span>
                                    </div>
                                </div>
                            );
                        })
                    }
                </div>

                {!loading && tracks.length === 0 && (
                    <div style={{ textAlign:"center", padding:"80px 0" }}>
                        <div style={{ fontSize:52, marginBottom:16, opacity:.3 }}>♪</div>
                        <p style={{ fontSize:15, color:"rgba(0,0,0,.45)" }}>{t.empty}</p>
                    </div>
                )}

                {!loading && tracks.length > 0 && (
                    <div style={{ textAlign:"center", marginTop:48 }}>
                        <Link href="/" style={{
                            display:"inline-flex", alignItems:"center", gap:8,
                            padding:"11px 24px", borderRadius:8,
                            border:"1px solid rgba(0,0,0,0.1)", color:"rgba(0,0,0,.55)",
                            textDecoration:"none", fontSize:13, fontWeight:500,
                            transition:"all .2s", background:"rgba(0,0,0,0.04)",
                            fontFamily:"'Space Grotesk',sans-serif",
                        }}
                            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor="rgba(0,169,143,0.4)"; (e.currentTarget as HTMLAnchorElement).style.color="#34D4B8"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor="rgba(0,0,0,0.1)"; (e.currentTarget as HTMLAnchorElement).style.color="rgba(0,0,0,.55)"; }}
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
