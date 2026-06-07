'use client';
// src/pages/NotFoundPage.tsx
import { useEffect, useRef } from "react";
import Link from "next/link";
import SEO from "@/components/frontend/SEO";

const NOTES = ["♩","♪","♫","♬","𝄞","𝄢","♭","♮","♯"];

export default function NotFoundPage() {
    const notesBgRef = useRef<HTMLDivElement>(null);
    const canvasRef  = useRef<HTMLCanvasElement>(null);
    const vinylRef   = useRef<HTMLDivElement>(null);
    const textRef    = useRef<HTMLDivElement>(null);

    // ── Floating notes ──
    useEffect(() => {
        const spawn = () => {
            if (!notesBgRef.current) return;
            const el = document.createElement("div");
            el.textContent = NOTES[Math.floor(Math.random() * NOTES.length)];
            const dur  = 5 + Math.random() * 8;
            const size = 16 + Math.random() * 24;
            el.style.cssText = `
                position:absolute;
                left:${Math.random() * 100}%;
                bottom:-40px;
                font-size:${size}px;
                color:${Math.random() > .5 ? "rgba(0,169,143,0.5)" : "rgba(255,255,255,0.25)"};
                pointer-events:none; user-select:none;
                animation: nfNoteRise ${dur}s linear forwards;
            `;
            notesBgRef.current.appendChild(el);
            setTimeout(() => el.remove(), dur * 1000);
        };
        spawn();
        const id = setInterval(spawn, 500);
        return () => clearInterval(id);
    }, []);

    // ── Canvas waveform ──
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
            const bars = 100;
            const bw   = canvas.width / bars;
            for (let i = 0; i < bars; i++) {
                const h = (
                    Math.sin(i * 0.2  + frame * 0.05) * 0.38 +
                    Math.sin(i * 0.45 + frame * 0.03) * 0.28 +
                    Math.sin(i * 0.85 + frame * 0.07) * 0.14 +
                    0.3
                ) * canvas.height * 0.9;
                const alpha = 0.2 + Math.sin(i * 0.28 + frame * 0.04) * 0.15;
                ctx.fillStyle = `rgba(0,169,143,${alpha})`;
                ctx.beginPath();
                try { ctx.roundRect(i * bw + 1, canvas.height - h, bw - 2, h, 2); } catch { ctx.rect(i * bw + 1, canvas.height - h, bw - 2, h); }
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
            angle += 0.5;
            if (vinylRef.current) vinylRef.current.style.transform = `rotate(${angle}deg)`;
            raf = requestAnimationFrame(spin);
        };
        spin();
        return () => cancelAnimationFrame(raf);
    }, []);

    // ── Mouse parallax on 404 text ──
    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (!textRef.current) return;
            const cx = window.innerWidth  / 2;
            const cy = window.innerHeight / 2;
            const dx = (e.clientX - cx) / cx;
            const dy = (e.clientY - cy) / cy;
            textRef.current.style.transform = `translate(${dx * 14}px, ${dy * 10}px)`;
        };
        window.addEventListener("mousemove", onMove);
        return () => window.removeEventListener("mousemove", onMove);
    }, []);

    return (
        <>
        <SEO
            title="404 – Trang Không Tồn Tại | Won Music"
            description="Trang bạn tìm kiếm không tồn tại. Quay lại trang chủ Won Music để khám phá âm nhạc."
            canonical="https://www.wonmusic.vn/404"
            robots="noindex, nofollow"
        />
        <div style={{
            minHeight:"100vh", overflow:"hidden", position:"relative",
            background:"linear-gradient(135deg,#242424 0%,#2E2E2E 40%,#383838 70%,#242424 100%)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontFamily:"'Be Vietnam Pro',sans-serif",
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');

                @keyframes nfNoteRise {
                    0%   { transform:translateY(0) rotate(0deg) scale(.7); opacity:0; }
                    8%   { opacity:1; }
                    92%  { opacity:.6; }
                    100% { transform:translateY(-110vh) rotate(40deg) scale(1.2); opacity:0; }
                }
                @keyframes nfFadeUp {
                    from { opacity:0; transform:translateY(24px); }
                    to   { opacity:1; transform:translateY(0); }
                }
                @keyframes nfGlitch1 {
                    0%,95%,100% { clip-path:inset(0 0 100% 0); transform:translate(0); }
                    96%  { clip-path:inset(20% 0 60% 0); transform:translate(-4px,2px); }
                    97%  { clip-path:inset(50% 0 30% 0); transform:translate(4px,-2px); }
                    98%  { clip-path:inset(70% 0 10% 0); transform:translate(-2px,4px); }
                    99%  { clip-path:inset(10% 0 80% 0); transform:translate(2px,-4px); }
                }
                @keyframes nfGlitch2 {
                    0%,95%,100% { clip-path:inset(100% 0 0 0); transform:translate(0); }
                    96%  { clip-path:inset(60% 0 20% 0); transform:translate(4px,-2px); color:#34D4B8; }
                    97%  { clip-path:inset(30% 0 50% 0); transform:translate(-4px,2px); }
                    98%  { clip-path:inset(10% 0 70% 0); transform:translate(2px,4px); }
                    99%  { clip-path:inset(80% 0 10% 0); transform:translate(-2px,-4px); color:#34D4B8; }
                }
                @keyframes nfPulse {
                    0%,100% { box-shadow:0 0 24px rgba(0,169,143,.3); }
                    50%     { box-shadow:0 0 56px rgba(0,169,143,.7); }
                }
                @keyframes nfDotBlink {
                    0%,100% { opacity:1; transform:scale(1); }
                    50%     { opacity:.3; transform:scale(.5); }
                }
                @keyframes nfEq {
                    0%,100% { transform:scaleY(.2); }
                    50%     { transform:scaleY(1); }
                }
                @keyframes nfSpin { to { transform:rotate(360deg); } }
                @keyframes nfShimmer {
                    0%   { background-position:-200% center; }
                    100% { background-position: 200% center; }
                }
                @keyframes nfBtnGlow {
                    0%,100% { box-shadow:0 4px 20px rgba(0,169,143,.3); }
                    50%     { box-shadow:0 8px 40px rgba(0,169,143,.7); }
                }

                .nf-404-text {
                    font-family:'Barlow Condensed',sans-serif;
                    font-size:clamp(140px,22vw,260px);
                    line-height:.85; letter-spacing:8px;
                    color:#fff;
                    text-shadow:0 0 80px rgba(0,169,143,.25);
                    position:relative; user-select:none;
                }
                .nf-404-text::before,
                .nf-404-text::after {
                    content:'404';
                    position:absolute; inset:0;
                    font-family:'Barlow Condensed',sans-serif;
                    font-size:inherit; letter-spacing:inherit;
                }
                .nf-404-text::before {
                    color:#34D4B8;
                    animation:nfGlitch1 6s ease-in-out infinite;
                }
                .nf-404-text::after {
                    color:#86efac;
                    animation:nfGlitch2 6s ease-in-out infinite .15s;
                }

                .nf-btn {
                    display:inline-flex; align-items:center; gap:10px;
                    padding:16px 36px; border-radius:100px;
                    background:linear-gradient(135deg,#00A98F,#34D4B8);
                    color:#fff; text-decoration:none;
                    font-size:15px; font-weight:600;
                    font-family:'Be Vietnam Pro',sans-serif;
                    transition:all .25s;
                    animation:nfBtnGlow 2.5s ease-in-out infinite, nfFadeUp .6s .5s both;
                }
                .nf-btn:hover { transform:translateY(-3px) scale(1.04); }
                .nf-btn:active { transform:scale(.97); }

                .nf-outline-btn {
                    display:inline-flex; align-items:center; gap:8px;
                    padding:14px 28px; border-radius:100px;
                    border:1.5px solid rgba(255,255,255,.2);
                    color:rgba(255,255,255,.7); text-decoration:none;
                    font-size:14px; font-weight:500;
                    font-family:'Be Vietnam Pro',sans-serif;
                    transition:all .25s; background:rgba(255,255,255,.05);
                    backdrop-filter:blur(8px);
                    animation:nfFadeUp .6s .65s both;
                }
                .nf-outline-btn:hover {
                    border-color:rgba(0,169,143,.5);
                    color:#34D4B8; background:rgba(0,169,143,.1);
                    transform:translateY(-2px);
                }
            `}</style>

            {/* ── Floating notes ── */}
            <div ref={notesBgRef} style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none", zIndex:1 }} />

            {/* ── Canvas waveform (bottom) ── */}
            <canvas ref={canvasRef} style={{ position:"absolute", bottom:0, left:0, width:"100%", height:130, opacity:.35, pointerEvents:"none", zIndex:1 }} />

            {/* ── Vinyl (BG decoration) ── */}
            <div style={{ position:"absolute", right:-80, bottom:-80, opacity:.08, pointerEvents:"none", zIndex:0 }}>
                <div ref={vinylRef} style={{
                    width:480, height:480, borderRadius:"50%",
                    background:"conic-gradient(from 0deg,#242424,#00A98F,#1E1E30,#242424,#2E2E2E,#00A98F,#242424)",
                    border:"2px solid rgba(0,169,143,.3)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                    <div style={{ width:160, height:160, borderRadius:"50%", background:"#00A98F", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <div style={{ width:44, height:44, borderRadius:"50%", background:"#242424" }} />
                    </div>
                </div>
            </div>

            {/* ── Vinyl small (top-left) ── */}
            <div style={{ position:"absolute", left:-40, top:-40, opacity:.06, pointerEvents:"none" }}>
                <div style={{
                    width:240, height:240, borderRadius:"50%",
                    background:"conic-gradient(from 0deg,#242424,#34D4B8,#242424,#00A98F,#242424)",
                    animation:"nfSpin 8s linear infinite",
                    display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                    <div style={{ width:80, height:80, borderRadius:"50%", background:"#00A98F", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <div style={{ width:22, height:22, borderRadius:"50%", background:"#242424" }} />
                    </div>
                </div>
            </div>

            {/* ── Grid lines ── */}
            <div style={{ position:"absolute", inset:0, opacity:.03, pointerEvents:"none" }}>
                {[0,1,2,3,4,5,6,7].map(i => (
                    <div key={i} style={{ position:"absolute", left:`${i*14.28}%`, top:0, bottom:0, width:1, background:"#34D4B8" }} />
                ))}
                {[0,1,2,3,4].map(i => (
                    <div key={i} style={{ position:"absolute", top:`${i*25}%`, left:0, right:0, height:1, background:"#34D4B8" }} />
                ))}
            </div>

            {/* ══════ MAIN CONTENT ══════ */}
            <div style={{ position:"relative", zIndex:2, textAlign:"center", padding:"0 24px" }}>

                {/* Live dot + label */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:20, animation:"nfFadeUp .5s both" }}>
                    <span style={{ width:7, height:7, borderRadius:"50%", background:"#34D4B8", display:"inline-block", animation:"nfDotBlink 1.5s ease-in-out infinite" }} />
                    <span style={{ fontSize:11, color:"#34D4B8", letterSpacing:"2.5px", textTransform:"uppercase", fontWeight:600 }}>
                        Won Music · Trang không tồn tại
                    </span>
                </div>

                {/* 404 Glitch text */}
                <div ref={textRef} style={{ transition:"transform .1s ease-out", marginBottom:8 }}>
                    <div className="nf-404-text">404</div>
                </div>

                {/* Equalizer under 404 */}
                <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"center", gap:3, height:36, marginBottom:28, animation:"nfFadeUp .5s .1s both" }}>
                    {[30,55,42,78,48,68,35,88,52,62,72,36,58,44,82,46,66,33,76,50].map((h,i) => (
                        <div key={i} style={{
                            width:4, height:`${h}%`,
                            background:`rgba(0,169,143,${.3+i*.02})`,
                            borderRadius:2, transformOrigin:"bottom",
                            animation:`nfEq ${.36+(i%6)*.13}s ease-in-out infinite`,
                            animationDelay:`${i*.055}s`,
                        }} />
                    ))}
                </div>

                {/* Message */}
                <div style={{ animation:"nfFadeUp .5s .2s both", marginBottom:12 }}>
                    <h2 style={{
                        fontFamily:"'Barlow Condensed',sans-serif",
                        fontSize:"clamp(24px,4vw,40px)",
                        color:"#fff", letterSpacing:2, marginBottom:10,
                    }}>
                        Ôi! Bài hát này không có trong danh sách
                    </h2>
                    <p style={{ fontSize:15, color:"rgba(255,255,255,.55)", lineHeight:1.75, maxWidth:420, margin:"0 auto" }}>
                        Trang bạn tìm kiếm đã bị xóa, đổi tên hoặc chưa từng tồn tại — giống như một bài hát chưa được phát hành.
                    </p>
                </div>

                {/* Vinyl record decoration */}
                <div style={{ margin:"28px auto", display:"flex", justifyContent:"center", animation:"nfFadeUp .5s .3s both" }}>
                    <div style={{
                        width:80, height:80, borderRadius:"50%",
                        background:"conic-gradient(from 0deg,#2E2E2E,#00A98F,#1E1E30,#2E2E2E,#242424,#00A98F,#2E2E2E)",
                        border:"2px solid rgba(0,169,143,.4)",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        animation:"nfSpin 4s linear infinite, nfPulse 2s ease-in-out infinite",
                    }}>
                        <div style={{ width:28, height:28, borderRadius:"50%", background:"#00A98F", display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <div style={{ width:8, height:8, borderRadius:"50%", background:"#242424" }} />
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
                    <Link href="/" className="nf-btn">
                        ♪ Về trang chủ
                    </Link>
                    <Link href="/charts" className="nf-outline-btn">
                        🎵 Xem BXH nhạc hot
                    </Link>
                    <Link href="/artists" className="nf-outline-btn">
                        🎤 Khám phá nghệ sĩ
                    </Link>
                </div>

                {/* Broken record text */}
                <p style={{ marginTop:36, fontSize:12, color:"rgba(255,255,255,.25)", letterSpacing:2, textTransform:"uppercase", animation:"nfFadeUp .5s .7s both" }}>
                    ♪ — Won Music — ♪
                </p>
            </div>
        </div>
        </>
    );
}