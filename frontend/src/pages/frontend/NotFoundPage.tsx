'use client';
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import SEO from "@/components/frontend/SEO";

const EQ_HEIGHTS = [22, 45, 31, 68, 42, 78, 35, 88, 52, 61, 74, 38, 57, 44, 83, 46, 65, 29, 72, 50];

export default function NotFoundPage() {
    const canvasRef  = useRef<HTMLCanvasElement>(null);
    const vinylRef   = useRef<HTMLDivElement>(null);
    const [glitch,   setGlitch]   = useState(false);
    const [progress, setProgress] = useState(37);
    const [dots,     setDots]     = useState(".");

    // Canvas broken waveform
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
            const bars = 80;
            const bw   = canvas.width / bars;
            for (let i = 0; i < bars; i++) {
                // glitch bars randomly drop out
                if (Math.sin(i * 7.3 + frame * 0.2) > 0.6) continue;
                const h = (
                    Math.sin(i * 0.22 + frame * 0.04) * 0.3 +
                    Math.sin(i * 0.5  + frame * 0.025) * 0.22 +
                    Math.sin(i * 1.1  + frame * 0.06) * 0.1 + 0.28
                ) * canvas.height * 0.85;
                const alpha = 0.15 + Math.sin(i * 0.3 + frame * 0.05) * 0.1;
                ctx.fillStyle = i % 11 === 0
                    ? `rgba(155,100,255,${alpha * 1.5})`
                    : `rgba(0,212,170,${alpha})`;
                ctx.beginPath();
                try { ctx.roundRect(i * bw + 1, canvas.height - h, bw - 2, h, 2); }
                catch { ctx.rect(i * bw + 1, canvas.height - h, bw - 2, h); }
                ctx.fill();
            }
            frame++;
            raf = requestAnimationFrame(draw);
        };
        draw();
        return () => cancelAnimationFrame(raf);
    }, []);

    // Vinyl spin (slow & erratic)
    useEffect(() => {
        let angle = 0, raf: number, paused = false;
        const spin = () => {
            if (!paused) {
                angle += 0.18 + Math.sin(angle * 0.01) * 0.12;
            }
            if (vinylRef.current) vinylRef.current.style.transform = `rotate(${angle}deg)`;
            raf = requestAnimationFrame(spin);
        };
        spin();
        // simulate glitch stutter
        const stutter = setInterval(() => {
            paused = true;
            setTimeout(() => { paused = false; }, 180 + Math.random() * 300);
        }, 3500 + Math.random() * 2000);
        return () => { cancelAnimationFrame(raf); clearInterval(stutter); };
    }, []);

    // Glitch flash
    useEffect(() => {
        const id = setInterval(() => {
            setGlitch(true);
            setTimeout(() => setGlitch(false), 120);
        }, 4000 + Math.random() * 2000);
        return () => clearInterval(id);
    }, []);

    // Fake "Loading…" progress that stalls
    useEffect(() => {
        const id = setInterval(() => {
            setProgress(p => p >= 37 ? 37 : p + 1);
        }, 80);
        return () => clearInterval(id);
    }, []);

    // Animated dots
    useEffect(() => {
        const id = setInterval(() => {
            setDots(d => d.length >= 3 ? "." : d + ".");
        }, 480);
        return () => clearInterval(id);
    }, []);

    return (
        <>
        <SEO
            title="404 – Track Not Found | Won Music"
            description="Trang bạn tìm kiếm không tồn tại. Quay lại trang chủ Won Music."
            canonical="https://www.wonmusic.vn/404"
            robots="noindex, nofollow"
        />

        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(160deg, #080B14 0%, #0D1120 50%, #080B14 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Be Vietnam Pro', sans-serif",
            position: "relative", overflow: "hidden",
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Barlow+Condensed:wght@700;800;900&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');

                @keyframes nf-fadeup {
                    from { opacity:0; transform:translateY(20px); }
                    to   { opacity:1; transform:translateY(0); }
                }
                @keyframes nf-blink {
                    0%,100% { opacity:1; } 50% { opacity:0.25; }
                }
                @keyframes nf-scan {
                    0%   { transform:translateY(-100%); }
                    100% { transform:translateY(100vh); }
                }
                @keyframes nf-eq {
                    0%,100% { transform:scaleY(0.15); }
                    50%     { transform:scaleY(1); }
                }
                @keyframes nf-glitch-h {
                    0%,95%,100% { transform:translate(0); opacity:1; }
                    96% { transform:translate(-6px, 2px); opacity:0.8; }
                    97% { transform:translate(4px, -3px); opacity:0.9; }
                    98% { transform:translate(-3px, 4px); }
                    99% { transform:translate(5px, -1px); opacity:0.85; }
                }
                @keyframes nf-spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes nf-pulse-ring {
                    0%   { transform:scale(1);   opacity:0.4; }
                    100% { transform:scale(1.6); opacity:0; }
                }
                @keyframes nf-float {
                    0%,100% { transform:translateY(0px); }
                    50%     { transform:translateY(-10px); }
                }
                @keyframes nf-shimmer {
                    0%   { background-position: -200% center; }
                    100% { background-position:  200% center; }
                }
                @keyframes nf-progress-stuck {
                    0%,100% { width: 37%; }
                    50%     { width: 38%; }
                }
                @keyframes nf-noise {
                    0%   { background-position: 0 0; }
                    20%  { background-position: -5% -10%; }
                    40%  { background-position: -15% 5%; }
                    60%  { background-position: 7% -25%; }
                    80%  { background-position: 0% 5%; }
                    100% { background-position: 0 0; }
                }

                .nf-404-big {
                    font-family: 'Barlow Condensed', sans-serif;
                    font-weight: 900;
                    font-size: clamp(160px, 26vw, 300px);
                    line-height: 0.85;
                    letter-spacing: -4px;
                    color: transparent;
                    -webkit-text-stroke: 1px rgba(0,212,170,0.12);
                    user-select: none;
                    pointer-events: none;
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -54%);
                    white-space: nowrap;
                    animation: nf-glitch-h 5s ease-in-out infinite;
                }

                .nf-badge {
                    font-family: 'Space Grotesk', sans-serif;
                    font-size: 10px;
                    font-weight: 600;
                    letter-spacing: 3px;
                    text-transform: uppercase;
                    color: #00D4AA;
                    background: rgba(0,212,170,0.08);
                    border: 1px solid rgba(0,212,170,0.25);
                    padding: 5px 14px;
                    border-radius: 100px;
                    display: inline-flex;
                    align-items: center;
                    gap: 7px;
                }

                .nf-error-code {
                    font-family: 'Space Grotesk', sans-serif;
                    font-weight: 700;
                    font-size: clamp(56px, 10vw, 96px);
                    color: #fff;
                    line-height: 1;
                    letter-spacing: -2px;
                    background: linear-gradient(135deg, #ffffff 30%, #00D4AA 70%, #9B64FF 100%);
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    animation: nf-shimmer 4s linear infinite;
                }

                .nf-track-title {
                    font-family: 'Barlow Condensed', sans-serif;
                    font-weight: 800;
                    font-size: clamp(28px, 5vw, 52px);
                    color: #fff;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    line-height: 1;
                }

                .nf-subtitle {
                    font-family: 'Space Grotesk', sans-serif;
                    font-weight: 400;
                    font-size: 14px;
                    color: rgba(255,255,255,0.45);
                    letter-spacing: 0.3px;
                    line-height: 1.7;
                }

                .nf-meta-label {
                    font-family: 'Space Grotesk', sans-serif;
                    font-size: 10px;
                    font-weight: 600;
                    letter-spacing: 2.5px;
                    text-transform: uppercase;
                    color: rgba(255,255,255,0.25);
                }

                .nf-meta-value {
                    font-family: 'Space Grotesk', sans-serif;
                    font-size: 13px;
                    font-weight: 500;
                    color: rgba(255,255,255,0.65);
                }

                .nf-btn-primary {
                    display: inline-flex; align-items: center; gap: 8px;
                    padding: 13px 28px; border-radius: 12px;
                    background: linear-gradient(135deg, #00A98F, #00D4AA);
                    color: #080B14; text-decoration: none;
                    font-family: 'Space Grotesk', sans-serif;
                    font-size: 14px; font-weight: 700;
                    letter-spacing: 0.3px;
                    transition: all 0.2s;
                    border: none; cursor: pointer;
                }
                .nf-btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 32px rgba(0,212,170,0.35);
                }

                .nf-btn-ghost {
                    display: inline-flex; align-items: center; gap: 8px;
                    padding: 12px 24px; border-radius: 12px;
                    border: 1px solid rgba(255,255,255,0.1);
                    color: rgba(255,255,255,0.6); text-decoration: none;
                    font-family: 'Space Grotesk', sans-serif;
                    font-size: 13px; font-weight: 600;
                    letter-spacing: 0.3px;
                    background: rgba(255,255,255,0.04);
                    backdrop-filter: blur(8px);
                    transition: all 0.2s;
                }
                .nf-btn-ghost:hover {
                    border-color: rgba(0,212,170,0.4);
                    color: #00D4AA;
                    background: rgba(0,212,170,0.07);
                    transform: translateY(-2px);
                }

                .nf-player-card {
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 20px;
                    backdrop-filter: blur(20px);
                    padding: 24px;
                    animation: nf-float 5s ease-in-out infinite;
                }

                .nf-scan-line {
                    position: absolute;
                    left: 0; right: 0;
                    height: 2px;
                    background: linear-gradient(90deg, transparent, rgba(0,212,170,0.4), transparent);
                    animation: nf-scan 3s linear infinite;
                    pointer-events: none;
                }
            `}</style>

            {/* ── Background 404 watermark ── */}
            <div className="nf-404-big" aria-hidden="true">404</div>

            {/* ── Scan line ── */}
            <div className="nf-scan-line" />

            {/* ── Grid ── */}
            <div style={{ position:"absolute", inset:0, pointerEvents:"none", opacity:0.025 }}>
                {Array.from({length:8}).map((_,i) => (
                    <div key={i} style={{ position:"absolute", left:`${i*14.3}%`, top:0, bottom:0, width:1, background:"#00D4AA" }} />
                ))}
                {Array.from({length:5}).map((_,i) => (
                    <div key={i} style={{ position:"absolute", top:`${i*25}%`, left:0, right:0, height:1, background:"#00D4AA" }} />
                ))}
            </div>

            {/* ── Glow blobs ── */}
            <div style={{ position:"absolute", top:"-20%", left:"-10%", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle, rgba(0,169,143,0.06) 0%, transparent 70%)", pointerEvents:"none" }} />
            <div style={{ position:"absolute", bottom:"-15%", right:"-8%", width:420, height:420, borderRadius:"50%", background:"radial-gradient(circle, rgba(155,100,255,0.05) 0%, transparent 70%)", pointerEvents:"none" }} />

            {/* ── Canvas waveform ── */}
            <canvas ref={canvasRef} style={{ position:"absolute", bottom:0, left:0, width:"100%", height:100, opacity:0.5, pointerEvents:"none" }} />

            {/* ══════ MAIN CONTENT ══════ */}
            <div style={{ position:"relative", zIndex:2, width:"100%", maxWidth:680, margin:"0 auto", padding:"40px 24px", textAlign:"center" }}>

                {/* Badge */}
                <div style={{ marginBottom:28, animation:"nf-fadeup 0.4s both" }}>
                    <span className="nf-badge">
                        <span style={{ width:6, height:6, borderRadius:"50%", background:"#00D4AA", display:"inline-block", animation:"nf-blink 1.4s ease-in-out infinite" }} />
                        Won Music
                    </span>
                </div>

                {/* Vinyl + error code row */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:32, marginBottom:32, animation:"nf-fadeup 0.4s 0.05s both", flexWrap:"wrap" }}>

                    {/* Vinyl */}
                    <div style={{ position:"relative", flexShrink:0 }}>
                        {/* Pulse rings */}
                        <div style={{ position:"absolute", inset:-12, borderRadius:"50%", border:"1px solid rgba(0,212,170,0.2)", animation:"nf-pulse-ring 2s ease-out infinite" }} />
                        <div style={{ position:"absolute", inset:-12, borderRadius:"50%", border:"1px solid rgba(0,212,170,0.15)", animation:"nf-pulse-ring 2s ease-out infinite 0.7s" }} />

                        <div ref={vinylRef} style={{
                            width: 96, height: 96, borderRadius: "50%",
                            background: `conic-gradient(from 0deg,
                                #0D1120 0deg, #00A98F 40deg, #0D1120 80deg,
                                #1a1a2e 120deg, #9B64FF 160deg, #0D1120 200deg,
                                #00A98F 240deg, #0D1120 280deg, #1a1a2e 320deg, #0D1120 360deg
                            )`,
                            border: "2px solid rgba(0,212,170,0.3)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 0 40px rgba(0,169,143,0.2)",
                        }}>
                            <div style={{
                                width: 32, height: 32, borderRadius: "50%",
                                background: "radial-gradient(circle, #1a1a2e 40%, #0D1120 100%)",
                                border: "1.5px solid rgba(0,212,170,0.25)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(0,212,170,0.4)" }} />
                            </div>
                        </div>

                        {/* Broken needle */}
                        <div style={{
                            position: "absolute", top: -4, right: -8,
                            width: 28, height: 3,
                            background: "linear-gradient(90deg, rgba(255,255,255,0.6), rgba(255,255,255,0.1))",
                            borderRadius: 2,
                            transform: "rotate(45deg)",
                            transformOrigin: "left center",
                        }} />
                    </div>

                    {/* Error code */}
                    <div style={{ textAlign:"left" }}>
                        <div className="nf-error-code" style={{ filter: glitch ? "hue-rotate(30deg) brightness(1.3)" : "none", transition:"filter 0.05s" }}>
                            404
                        </div>
                        <div className="nf-track-title" style={{ marginTop:4, color:"rgba(255,255,255,0.85)" }}>
                            Track Not Found
                        </div>
                    </div>
                </div>

                {/* Player card */}
                <div className="nf-player-card" style={{ marginBottom:28, animation:"nf-fadeup 0.4s 0.1s both" }}>

                    {/* Track info row */}
                    <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:20 }}>
                        {/* Mini vinyl placeholder */}
                        <div style={{
                            width:44, height:44, borderRadius:8, flexShrink:0,
                            background:"linear-gradient(135deg, #1a1a2e, #0D1120)",
                            border:"1px solid rgba(255,255,255,0.08)",
                            display:"flex", alignItems:"center", justifyContent:"center",
                            fontSize:20,
                        }}>
                            ✕
                        </div>
                        <div style={{ flex:1, textAlign:"left", minWidth:0 }}>
                            <div style={{
                                fontFamily:"'Space Grotesk',sans-serif",
                                fontSize:13, fontWeight:600,
                                color:"rgba(255,255,255,0.35)",
                                letterSpacing:0.5,
                                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                            }}>
                                Unknown Track — ERROR_404
                            </div>
                            <div style={{
                                fontFamily:"'Space Grotesk',sans-serif",
                                fontSize:11, color:"rgba(255,255,255,0.2)",
                                marginTop:3,
                            }}>
                                Won Music · Not available
                            </div>
                        </div>
                        {/* EQ (frozen/broken) */}
                        <div style={{ display:"flex", alignItems:"flex-end", gap:2, height:22, flexShrink:0 }}>
                            {EQ_HEIGHTS.slice(0,8).map((h, i) => (
                                <div key={i} style={{
                                    width:3, borderRadius:2,
                                    background: i === 3 || i === 6 ? "rgba(155,100,255,0.4)" : "rgba(0,212,170,0.3)",
                                    height:`${h * 0.25}px`,
                                    transformOrigin:"bottom",
                                    animation: i % 3 !== 0 ? `nf-eq ${0.4+(i%5)*0.13}s ease-in-out infinite ${i*0.06}s` : "none",
                                    opacity: i % 3 === 0 ? 0.2 : 1,
                                }} />
                            ))}
                        </div>
                    </div>

                    {/* Progress bar (stuck) */}
                    <div style={{ marginBottom:12 }}>
                        <div style={{
                            height:3, borderRadius:3,
                            background:"rgba(255,255,255,0.07)",
                            overflow:"hidden", position:"relative",
                        }}>
                            <div style={{
                                position:"absolute", left:0, top:0, bottom:0,
                                width:`${progress}%`,
                                background:"linear-gradient(90deg, #00A98F, #00D4AA)",
                                borderRadius:3,
                                animation:"nf-progress-stuck 1.5s ease-in-out infinite",
                            }} />
                        </div>
                        <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
                            <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:10, color:"rgba(255,255,255,0.2)" }}>1:27</span>
                            <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:10, color:"rgba(255,255,255,0.15)" }}>--:--</span>
                        </div>
                    </div>

                    {/* Player controls (disabled) */}
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:24 }}>
                        {["⏮", "⏪", "▶", "⏩", "⏭"].map((icon, i) => (
                            <div key={i} style={{
                                fontSize: i === 2 ? 22 : 14,
                                color: i === 2 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.12)",
                                cursor:"not-allowed",
                                width: i === 2 ? 38 : 28,
                                height: i === 2 ? 38 : 28,
                                borderRadius:"50%",
                                border: i === 2 ? "1.5px solid rgba(255,255,255,0.08)" : "none",
                                display:"flex", alignItems:"center", justifyContent:"center",
                            }}>
                                {icon}
                            </div>
                        ))}
                    </div>

                    {/* Error message */}
                    <div style={{
                        marginTop:16, padding:"10px 14px", borderRadius:10,
                        background:"rgba(155,100,255,0.07)",
                        border:"1px solid rgba(155,100,255,0.15)",
                        display:"flex", alignItems:"center", gap:10,
                    }}>
                        <span style={{ fontSize:14 }}>⚠</span>
                        <span style={{
                            fontFamily:"'Space Grotesk',sans-serif",
                            fontSize:12, color:"rgba(155,100,255,0.8)",
                            letterSpacing:0.3,
                        }}>
                            Đang tải{dots} — Trang này không tồn tại trong hệ thống
                        </span>
                    </div>
                </div>

                {/* Description */}
                <p className="nf-subtitle" style={{ marginBottom:32, maxWidth:440, margin:"0 auto 32px", animation:"nf-fadeup 0.4s 0.15s both" }}>
                    Trang bạn tìm không tồn tại — có thể đã bị xóa, đổi link, hoặc chưa từng được phát hành.
                </p>

                {/* CTA Buttons */}
                <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap", animation:"nf-fadeup 0.4s 0.2s both" }}>
                    <Link href="/" className="nf-btn-primary">
                        <span>♪</span> Về trang chủ
                    </Link>
                    <Link href="/charts" className="nf-btn-ghost">
                        <span>🎵</span> Bảng xếp hạng
                    </Link>
                    <Link href="/artists" className="nf-btn-ghost">
                        <span>🎤</span> Nghệ sĩ
                    </Link>
                </div>

                {/* Footer text */}
                <div style={{ marginTop:44, animation:"nf-fadeup 0.4s 0.25s both" }}>
                    <span style={{
                        fontFamily:"'Space Grotesk',sans-serif",
                        fontSize:11, color:"rgba(255,255,255,0.15)",
                        letterSpacing:"3px", textTransform:"uppercase",
                    }}>
                        WON MUSIC · HTTP 404 · TRACK_NOT_FOUND
                    </span>
                </div>
            </div>
        </div>
        </>
    );
}
