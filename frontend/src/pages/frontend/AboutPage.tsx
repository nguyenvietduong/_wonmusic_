// src/pages/AboutPage.tsx
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import SEO from "@/components/frontend/SEO";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { aboutPageText } from "@/locales/aboutPage";

const NOTES = ["♩","♪","♫","♬","𝄞","𝄢","♭","♮","♯"];

const TEAM = [
    { name: "Nguyễn Văn Minh", role: "CEO & Founder", avatar: "NM", color: "linear-gradient(135deg,#bbf7d0,#4ade80)" },
    { name: "Trần Thị Lan",    role: "Head of Music",  avatar: "TL", color: "linear-gradient(135deg,#86efac,#16a34a)" },
    { name: "Lê Quang Hùng",  role: "Lead Producer",  avatar: "LH", color: "linear-gradient(135deg,#dcfce7,#22c55e)" },
    { name: "Phạm Thùy Dung", role: "Artist Manager", avatar: "PD", color: "linear-gradient(135deg,#a7f3d0,#059669)" },
];

export default function AboutPage() {
    const { lang } = useLanguageStore();
    const t = aboutPageText[lang];

    const notesBgRef  = useRef<HTMLDivElement>(null);
    const canvasRef   = useRef<HTMLCanvasElement>(null);
    const vinylRef    = useRef<HTMLDivElement>(null);
    const [activeYear, setActiveYear] = useState("2024");

    useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, []);

    // ── Floating notes ──
    useEffect(() => {
        const spawn = () => {
            if (!notesBgRef.current) return;
            const el = document.createElement("div");
            el.textContent = NOTES[Math.floor(Math.random() * NOTES.length)];
            const dur = 7 + Math.random() * 8;
            el.style.cssText = `
                position:absolute;
                left:${Math.random()*100}%;
                bottom:-30px;
                font-size:${14+Math.random()*18}px;
                color:${Math.random()>.5?"rgba(74,222,128,0.5)":"rgba(255,255,255,0.2)"};
                pointer-events:none; user-select:none;
                animation:abNoteRise ${dur}s linear forwards;
            `;
            notesBgRef.current.appendChild(el);
            setTimeout(() => el.remove(), dur * 1000);
        };
        spawn();
        const id = setInterval(spawn, 600);
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
            const bars = 100, bw = canvas.width / bars;
            for (let i = 0; i < bars; i++) {
                const h = (Math.sin(i*.2+frame*.05)*.38 + Math.sin(i*.45+frame*.03)*.28 + .32) * canvas.height * .9;
                const a = .2 + Math.sin(i*.28+frame*.04) * .15;
                ctx.fillStyle = `rgba(74,222,128,${a})`;
                ctx.beginPath();
                ctx.roundRect(i*bw+1, canvas.height-h, bw-2, h, 2);
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
            angle += 0.25;
            if (vinylRef.current) vinylRef.current.style.transform = `rotate(${angle}deg)`;
            raf = requestAnimationFrame(spin);
        };
        spin();
        return () => cancelAnimationFrame(raf);
    }, []);

    return (
        <>
            <SEO
                title={t.seo.title}
                description={t.seo.description}
                canonical="https://www.wonmusic.vn/gioi-thieu"
                type="website"
            />

            <div style={{ fontFamily:"'Be Vietnam Pro',sans-serif", background:"#fff" }}>
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');

                    @keyframes abNoteRise {
                        0%   { transform:translateY(0) rotate(0deg) scale(.7); opacity:0; }
                        8%   { opacity:1; }
                        92%  { opacity:.6; }
                        100% { transform:translateY(-110vh) rotate(35deg) scale(1.2); opacity:0; }
                    }
                    @keyframes abFadeUp {
                        from { opacity:0; transform:translateY(24px); }
                        to   { opacity:1; transform:translateY(0); }
                    }
                    @keyframes abEq {
                        0%,100% { transform:scaleY(.2); }
                        50%     { transform:scaleY(1); }
                    }
                    @keyframes abDotPulse {
                        0%,100% { opacity:1; transform:scale(1); }
                        50%     { opacity:.3; transform:scale(.5); }
                    }
                    @keyframes abGlow {
                        0%,100% { box-shadow:0 0 24px rgba(74,222,128,.3); }
                        50%     { box-shadow:0 0 56px rgba(74,222,128,.65); }
                    }
                    @keyframes abSpin { to { transform:rotate(360deg); } }
                    @keyframes abBarGrow {
                        from { width:0; }
                        to   { width:100%; }
                    }
                    @keyframes abShimmer {
                        0%   { background-position:-200% center; }
                        100% { background-position: 200% center; }
                    }
                    @keyframes abCardIn {
                        from { opacity:0; transform:translateY(32px) scale(.96); }
                        to   { opacity:1; transform:translateY(0) scale(1); }
                    }

                    .ab-service-card {
                        padding:28px 24px; border-radius:20px;
                        border:1px solid #e5e7eb; background:#fff;
                        transition:all .3s cubic-bezier(.4,0,.2,1);
                        position:relative; overflow:hidden;
                        animation:abCardIn .5s both;
                    }
                    .ab-service-card::after {
                        content:''; position:absolute; bottom:0; left:0; right:0;
                        height:3px;
                        background:linear-gradient(90deg,#16a34a,#4ade80,#16a34a);
                        background-size:200%;
                        transform:scaleX(0); transition:transform .3s;
                    }
                    .ab-service-card:hover {
                        border-color:rgba(22,163,74,.3);
                        transform:translateY(-8px);
                        box-shadow:0 20px 48px rgba(22,163,74,.12);
                    }
                    .ab-service-card:hover::after {
                        transform:scaleX(1);
                        animation:abShimmer 1.5s linear infinite;
                    }

                    .ab-stat-card {
                        padding:28px 20px; border-radius:20px; text-align:center;
                        border:1px solid rgba(74,222,128,.2);
                        background:rgba(240,253,244,.5);
                        transition:all .3s; animation:abCardIn .5s both;
                    }
                    .ab-stat-card:hover {
                        background:#f0fdf4;
                        border-color:rgba(22,163,74,.4);
                        transform:translateY(-6px);
                        box-shadow:0 16px 40px rgba(22,163,74,.1);
                        animation:abGlow 2s ease-in-out infinite;
                    }

                    .ab-timeline-item {
                        position:relative; padding-left:64px;
                        cursor:pointer; transition:all .2s;
                    }
                    .ab-timeline-item::before {
                        content:''; position:absolute; left:20px; top:0; bottom:-32px;
                        width:1px; background:rgba(22,163,74,.2);
                    }
                    .ab-timeline-item:last-child::before { display:none; }

                    .ab-team-card {
                        padding:28px 20px; border-radius:20px; text-align:center;
                        border:1px solid #e5e7eb; background:#fff;
                        transition:all .3s; animation:abCardIn .5s both;
                    }
                    .ab-team-card:hover {
                        border-color:rgba(22,163,74,.3);
                        transform:translateY(-8px);
                        box-shadow:0 16px 40px rgba(22,163,74,.1);
                    }
                `}</style>

                {/* ══════════ HERO ══════════ */}
                <div style={{
                    minHeight:"100vh", position:"relative", overflow:"hidden",
                    background:"linear-gradient(135deg,#052e16 0%,#0a3d1f 45%,#14532d 75%,#052e16 100%)",
                    display:"flex", alignItems:"center",
                }}>
                    <div ref={notesBgRef} style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }} />
                    <canvas ref={canvasRef} style={{ position:"absolute", bottom:0, left:0, width:"100%", height:120, opacity:.35, pointerEvents:"none" }} />

                    {/* Vinyl BG */}
                    <div style={{ position:"absolute", right:-100, top:"50%", transform:"translateY(-50%)", opacity:.08, pointerEvents:"none" }}>
                        <div ref={vinylRef} style={{
                            width:560, height:560, borderRadius:"50%",
                            background:"conic-gradient(from 0deg,#052e16,#16a34a,#1a3d2a,#052e16,#0a2214,#16a34a,#052e16)",
                            border:"2px solid rgba(74,222,128,.3)",
                            display:"flex", alignItems:"center", justifyContent:"center",
                        }}>
                            <div style={{ width:180, height:180, borderRadius:"50%", background:"#16a34a", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                <div style={{ width:50, height:50, borderRadius:"50%", background:"#052e16" }} />
                            </div>
                        </div>
                    </div>

                    {/* Grid lines */}
                    <div style={{ position:"absolute", inset:0, opacity:.03, pointerEvents:"none" }}>
                        {[0,1,2,3,4,5,6].map(i => (
                            <div key={i} style={{ position:"absolute", left:`${i*16.6}%`, top:0, bottom:0, width:1, background:"#4ade80" }} />
                        ))}
                    </div>

                    <div style={{ maxWidth:1200, margin:"0 auto", padding:"120px 48px 80px", position:"relative", zIndex:2, width:"100%" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20, animation:"abFadeUp .5s both" }}>
                            <span style={{ width:6, height:6, borderRadius:"50%", background:"#4ade80", display:"inline-block", animation:"abDotPulse 1.5s ease-in-out infinite" }} />
                            <span style={{ fontSize:11, color:"#4ade80", letterSpacing:"2.5px", textTransform:"uppercase", fontWeight:600 }}>
                                {t.hero.label}
                            </span>
                        </div>

                        <h1 style={{
                            fontFamily: "'Be Vietnam Pro',sans-serif",
                            fontSize:"clamp(64px,10vw,100px)",
                            color:"#fff", lineHeight: 1, letterSpacing:4,
                            marginBottom:24, animation:"abFadeUp .5s .1s both",
                        }}>
                            {t.hero.line1}<br />
                            <span style={{ color:"#4ade80" }}>{t.hero.highlight}</span>
                            {t.hero.line2 && <><br />{t.hero.line2}</>}
                        </h1>

                        <p style={{ fontSize:16, color:"rgba(255,255,255,.65)", maxWidth:520, lineHeight:1.85, marginBottom:40, animation:"abFadeUp .5s .2s both" }}>
                            {t.hero.subtitle}
                        </p>

                        {/* EQ bars */}
                        <div style={{ display:"flex", alignItems:"flex-end", gap:3, height:48, marginBottom:40, animation:"abFadeUp .5s .3s both" }}>
                            {[30,55,42,78,48,68,35,88,52,62,72,36,58,44,82,46,66,33,76,50,40,70,55,85,45].map((h,i) => (
                                <div key={i} style={{
                                    width:5, height:`${h}%`,
                                    background:`rgba(74,222,128,${.25+i*.015})`,
                                    borderRadius:3, transformOrigin:"bottom",
                                    animation:`abEq ${.36+(i%6)*.13}s ease-in-out infinite`,
                                    animationDelay:`${i*.055}s`,
                                }} />
                            ))}
                        </div>

                        <div style={{ display:"flex", gap:14, flexWrap:"wrap", animation:"abFadeUp .5s .4s both" }}>
                            <Link to="/artists" style={{
                                display:"inline-flex", alignItems:"center", gap:10,
                                padding:"15px 32px", borderRadius:100,
                                background:"linear-gradient(135deg,#16a34a,#22c55e)",
                                color:"#fff", textDecoration:"none",
                                fontSize:14, fontWeight:600,
                                boxShadow:"0 8px 28px rgba(22,163,74,.4)",
                                transition:"all .25s",
                            }}>
                                {t.hero.exploreBtn}
                            </Link>
                            <Link to="/lien-he" style={{
                                display:"inline-flex", alignItems:"center", gap:10,
                                padding:"14px 28px", borderRadius:100,
                                border:"1.5px solid rgba(255,255,255,.25)",
                                color:"rgba(255,255,255,.8)", textDecoration:"none",
                                fontSize:14, fontWeight:500,
                                background:"rgba(255,255,255,.06)", backdropFilter:"blur(8px)",
                                transition:"all .25s",
                            }}>
                                {t.hero.contactBtn}
                            </Link>
                        </div>
                    </div>
                </div>

                {/* ══════════ STATS ══════════ */}
                <div style={{ background:"#f0fdf4", padding:"80px 0", borderBottom:"1px solid rgba(22,163,74,.1)" }}>
                    <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 48px" }}>
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:20 }}>
                            {t.stats.map(({ value, label, icon }, i) => (
                                <div key={label} className="ab-stat-card" style={{ animationDelay:`${i*.1}s` }}>
                                    <div style={{ fontSize:36, marginBottom:8 }}>{icon}</div>
                                    <div style={{
                                        fontFamily:"'Barlow Condensed',sans-serif",
                                        fontSize:52, color:"#16a34a", lineHeight:.9,
                                        letterSpacing:2, marginBottom:8,
                                    }}>
                                        {value}
                                    </div>
                                    <p style={{ fontSize:13, color:"#4b6e57", fontWeight:500, textTransform:"uppercase", letterSpacing:1 }}>{label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ══════════ MISSION ══════════ */}
                <div style={{ padding:"100px 0", background:"#fff", position:"relative", overflow:"hidden" }}>
                    {/* Decorative vinyl */}
                    <div style={{ position:"absolute", left:-120, top:"50%", transform:"translateY(-50%)", opacity:.04, pointerEvents:"none" }}>
                        <div style={{ width:400, height:400, borderRadius:"50%", background:"conic-gradient(from 0deg,#052e16,#16a34a,#1a3d2a,#052e16)", animation:"abSpin 15s linear infinite", display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <div style={{ width:130, height:130, borderRadius:"50%", background:"#16a34a", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                <div style={{ width:36, height:36, borderRadius:"50%", background:"#052e16" }} />
                            </div>
                        </div>
                    </div>

                    <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 48px", position:"relative", zIndex:1 }}>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:80, alignItems:"center" }}>
                            <div>
                                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                                    <span style={{ width:32, height:1, background:"#16a34a", display:"inline-block" }} />
                                    <span style={{ fontSize:11, color:"#16a34a", letterSpacing:"2px", textTransform:"uppercase", fontWeight:600 }}>{t.mission.sectionLabel}</span>
                                </div>
                                <h2 style={{
                                    fontFamily: "'Be Vietnam Pro',sans-serif",
                                    fontSize:"clamp(40px,5vw,50px)",
                                    color:"#0f1f14", lineHeight:.92, letterSpacing:2,
                                    marginBottom:24,
                                }}>
                                    {t.mission.heading}<br />
                                    <span style={{ color:"#16a34a" }}>{t.mission.highlight}</span>
                                </h2>
                                <p style={{ fontSize:15, color:"#4b5563", lineHeight:1.9, marginBottom:20 }}>
                                    {t.mission.p1}
                                </p>
                                <p style={{ fontSize:15, color:"#4b5563", lineHeight:1.9, marginBottom:32 }}>
                                    {t.mission.p2}
                                </p>
                                {/* Values */}
                                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                                    {t.mission.values.map(({ label, pct }) => (
                                        <div key={label}>
                                            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                                                <span style={{ fontSize:13, fontWeight:500, color:"#111827" }}>{label}</span>
                                                <span style={{ fontSize:13, color:"#16a34a", fontWeight:600 }}>{pct}%</span>
                                            </div>
                                            <div style={{ height:5, background:"#f3f4f6", borderRadius:3, overflow:"hidden" }}>
                                                <div style={{
                                                    height:"100%", width:`${pct}%`,
                                                    background:"linear-gradient(90deg,#16a34a,#4ade80)",
                                                    borderRadius:3,
                                                    animation:"abBarGrow 1.2s cubic-bezier(.4,0,.2,1) both",
                                                }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Vinyl visual */}
                            <div style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
                                <div style={{ position:"relative", width:320, height:320 }}>
                                    {/* Outer ring */}
                                    <div style={{
                                        position:"absolute", inset:-20,
                                        borderRadius:"50%",
                                        border:"1.5px dashed rgba(22,163,74,.25)",
                                        animation:"abSpin 20s linear infinite",
                                    }} />
                                    <div style={{
                                        position:"absolute", inset:-8,
                                        borderRadius:"50%",
                                        border:"1px dashed rgba(22,163,74,.15)",
                                        animation:"abSpin 14s linear infinite reverse",
                                    }} />
                                    {/* Vinyl */}
                                    <div style={{
                                        width:"100%", height:"100%", borderRadius:"50%",
                                        background:"conic-gradient(from 0deg,#0a3d1f,#16a34a,#1a3d2a,#0a3d1f,#052e16,#22c55e,#0a3d1f)",
                                        border:"3px solid rgba(74,222,128,.3)",
                                        display:"flex", alignItems:"center", justifyContent:"center",
                                        boxShadow:"0 0 60px rgba(22,163,74,.2)",
                                        animation:"abSpin 8s linear infinite",
                                    }}>
                                        <div style={{ width:108, height:108, borderRadius:"50%", background:"linear-gradient(135deg,#16a34a,#22c55e)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 20px rgba(22,163,74,.4)" }}>
                                            <div style={{ width:30, height:30, borderRadius:"50%", background:"#052e16" }} />
                                        </div>
                                        {/* Grooves */}
                                        {[0.68,0.78,0.88].map((r,i) => (
                                            <div key={i} style={{
                                                position:"absolute",
                                                width:`${r*100}%`, height:`${r*100}%`,
                                                borderRadius:"50%",
                                                border:"1px solid rgba(255,255,255,.06)",
                                            }} />
                                        ))}
                                    </div>
                                    {/* Needle */}
                                    <div style={{
                                        position:"absolute", top:-16, right:20,
                                        width:3, height:90,
                                        background:"linear-gradient(to bottom,rgba(74,222,128,.8),transparent)",
                                        borderRadius:2, transformOrigin:"top center",
                                        transform:"rotate(25deg)",
                                    }} />
                                    {/* Now playing badge */}
                                    <div style={{
                                        position:"absolute", bottom:-20, left:"50%", transform:"translateX(-50%)",
                                        display:"flex", alignItems:"center", gap:8,
                                        background:"#fff", border:"1px solid rgba(22,163,74,.2)",
                                        padding:"8px 16px", borderRadius:100,
                                        boxShadow:"0 4px 16px rgba(22,163,74,.1)",
                                        whiteSpace:"nowrap",
                                    }}>
                                        <span style={{ width:6, height:6, borderRadius:"50%", background:"#16a34a", animation:"abDotPulse 1.2s ease-in-out infinite" }} />
                                        <span style={{ fontSize:12, color:"#16a34a", fontWeight:600 }}>{t.mission.nowPlaying}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══════════ SERVICES ══════════ */}
                <div style={{ padding:"100px 0", background:"#f8faf8" }}>
                    <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 48px" }}>
                        <div style={{ textAlign:"center", marginBottom:56 }}>
                            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:14 }}>
                                <span style={{ width:24, height:1, background:"#16a34a" }} />
                                <span style={{ fontSize:11, color:"#16a34a", letterSpacing:"2px", textTransform:"uppercase", fontWeight:600 }}>{t.services.sectionLabel}</span>
                                <span style={{ width:24, height:1, background:"#16a34a" }} />
                            </div>
                            <h2 style={{ fontFamily: "'Be Vietnam Pro',sans-serif", fontSize:"clamp(36px,5vw,60px)", color:"#0f1f14", letterSpacing:2, marginBottom:12 }}>
                                {t.services.heading} <span style={{ color:"#16a34a" }}>{t.services.highlight}</span>
                            </h2>
                            <p style={{ fontSize:15, color:"#6b7280", maxWidth:480, margin:"0 auto", lineHeight:1.8 }}>
                                {t.services.subtitle}
                            </p>
                        </div>

                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:20 }}>
                            {t.services.items.map(({ icon, title, desc }, i) => (
                                <div key={title} className="ab-service-card" style={{ animationDelay:`${i*.08}s` }}>
                                    <div style={{ fontSize:36, marginBottom:16 }}>{icon}</div>
                                    <h3 style={{ fontSize:17, fontWeight:600, color:"#111827", marginBottom:10 }}>{title}</h3>
                                    <p style={{ fontSize:14, color:"#6b7280", lineHeight:1.75 }}>{desc}</p>
                                    {/* EQ mini */}
                                    <div style={{ display:"flex", alignItems:"flex-end", gap:2, height:16, marginTop:20 }}>
                                        {[40,65,50,80,45,70,55].map((h,j) => (
                                            <div key={j} style={{
                                                width:3, height:`${h}%`, background:"rgba(22,163,74,.25)",
                                                borderRadius:2, transformOrigin:"bottom",
                                                animation:`abEq ${.4+j*.1}s ease-in-out infinite`,
                                                animationDelay:`${j*.07}s`,
                                            }} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ══════════ TIMELINE ══════════ */}
                <div style={{ padding:"100px 0", background:"#fff" }}>
                    <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 48px" }}>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:80, alignItems:"start" }}>
                            <div>
                                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                                    <span style={{ width:24, height:1, background:"#16a34a" }} />
                                    <span style={{ fontSize:11, color:"#16a34a", letterSpacing:"2px", textTransform:"uppercase", fontWeight:600 }}>{t.timeline.sectionLabel}</span>
                                </div>
                                <h2 style={{ fontFamily: "'Be Vietnam Pro',sans-serif", fontSize:"clamp(36px,5vw,60px)", color:"#0f1f14", letterSpacing:2, marginBottom:16 }}>
                                    {t.timeline.heading}<br /><span style={{ color:"#16a34a" }}>{t.timeline.highlight}</span>
                                </h2>
                                <p style={{ fontSize:15, color:"#6b7280", lineHeight:1.8 }}>
                                    {t.timeline.subtitle}
                                </p>
                            </div>

                            <div style={{ display:"flex", flexDirection:"column", gap:32 }}>
                                {t.timeline.items.map(({ year, title, desc }) => (
                                    <div
                                        key={year}
                                        className="ab-timeline-item"
                                        onClick={() => setActiveYear(year)}
                                    >
                                        {/* Dot */}
                                        <div style={{
                                            position:"absolute", left:12, top:4,
                                            width:16, height:16, borderRadius:"50%",
                                            background: activeYear===year ? "#16a34a" : "#e5e7eb",
                                            border:`2px solid ${activeYear===year ? "#4ade80" : "#e5e7eb"}`,
                                            transition:"all .2s",
                                            boxShadow: activeYear===year ? "0 0 12px rgba(74,222,128,.5)" : "none",
                                        }} />
                                        <div style={{
                                            fontSize:12, fontWeight:700, color:"#16a34a",
                                            letterSpacing:1.5, textTransform:"uppercase",
                                            marginBottom:4,
                                        }}>
                                            {year}
                                        </div>
                                        <h4 style={{ fontSize:15, fontWeight:600, color: activeYear===year ? "#16a34a" : "#111827", marginBottom:6, transition:"color .2s" }}>
                                            {title}
                                        </h4>
                                        <p style={{ fontSize:13, color:"#6b7280", lineHeight:1.7 }}>{desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══════════ TEAM ══════════ */}
                <div style={{ padding:"100px 0", background:"linear-gradient(135deg,#052e16,#0a3d1f,#14532d)", position:"relative", overflow:"hidden" }}>
                    <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }}>
                        {[30,55,42,78,48,68,35,88].map((h,i) => (
                            <div key={i} style={{
                                position:"absolute",
                                left:`${i*13}%`, bottom:0,
                                width:4, height:`${h*2}px`,
                                background:"rgba(74,222,128,.08)",
                                borderRadius:"4px 4px 0 0",
                                transformOrigin:"bottom",
                                animation:`abEq ${.5+i*.12}s ease-in-out infinite`,
                                animationDelay:`${i*.09}s`,
                            }} />
                        ))}
                    </div>

                    <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 48px", position:"relative", zIndex:1 }}>
                        <div style={{ textAlign:"center", marginBottom:56 }}>
                            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:14 }}>
                                <span style={{ width:24, height:1, background:"#4ade80" }} />
                                <span style={{ fontSize:11, color:"#4ade80", letterSpacing:"2px", textTransform:"uppercase", fontWeight:600 }}>{t.team.sectionLabel}</span>
                                <span style={{ width:24, height:1, background:"#4ade80" }} />
                            </div>
                            <h2 style={{ fontFamily: "'Be Vietnam Pro',sans-serif", fontSize:"clamp(36px,5vw,60px)", color:"#fff", letterSpacing:2, marginBottom:12 }}>
                                {t.team.heading} <span style={{ color:"#4ade80" }}>{t.team.highlight}</span>
                            </h2>
                        </div>

                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:20 }}>
                            {TEAM.map(({ name, role, avatar, color }, i) => (
                                <div key={name} className="ab-team-card" style={{
                                    animationDelay:`${i*.1}s`,
                                    background:"rgba(255,255,255,.06)",
                                    border:"1px solid rgba(255,255,255,.1)",
                                    backdropFilter:"blur(12px)",
                                }}>
                                    <div style={{
                                        width:80, height:80, borderRadius:"50%",
                                        background:color, margin:"0 auto 16px",
                                        display:"flex", alignItems:"center", justifyContent:"center",
                                        fontFamily:"'Barlow Condensed',sans-serif",
                                        fontSize:28, color:"#166534",
                                        border:"3px solid rgba(74,222,128,.3)",
                                        boxShadow:"0 4px 20px rgba(22,163,74,.2)",
                                    }}>
                                        {avatar}
                                    </div>
                                    <h4 style={{ fontSize:15, fontWeight:600, color:"#fff", marginBottom:5 }}>{name}</h4>
                                    <p style={{ fontSize:12, color:"#4ade80", fontWeight:500, marginBottom:14 }}>{role}</p>
                                    {/* Mini EQ */}
                                    <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"center", gap:2, height:14 }}>
                                        {[40,70,50,85,55].map((h,j) => (
                                            <div key={j} style={{
                                                width:3, height:`${h}%`, background:"rgba(74,222,128,.4)",
                                                borderRadius:2, transformOrigin:"bottom",
                                                animation:`abEq ${.4+j*.12}s ease-in-out infinite`,
                                                animationDelay:`${j*.08}s`,
                                            }} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ══════════ CTA ══════════ */}
                <div style={{ padding:"100px 0", background:"#fff" }}>
                    <div style={{ maxWidth:800, margin:"0 auto", padding:"0 48px", textAlign:"center" }}>
                        {/* Spinning vinyl */}
                        <div style={{ margin:"0 auto 32px", width:72, height:72, borderRadius:"50%", background:"conic-gradient(from 0deg,#0a3d1f,#16a34a,#1a3d2a,#0a3d1f)", border:"2px solid rgba(22,163,74,.3)", display:"flex", alignItems:"center", justifyContent:"center", animation:"abSpin 5s linear infinite, abGlow 2.5s ease-in-out infinite" }}>
                            <div style={{ width:24, height:24, borderRadius:"50%", background:"#16a34a", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                <div style={{ width:7, height:7, borderRadius:"50%", background:"#052e16" }} />
                            </div>
                        </div>

                        <h2 style={{ fontFamily: "'Be Vietnam Pro',sans-serif", fontSize:"clamp(36px,5vw,56px)", color:"#0f1f14", letterSpacing:2, marginBottom:16 }}>
                            {t.cta.heading}<br />
                            <span style={{ color:"#16a34a" }}>{t.cta.highlight}</span>
                        </h2>
                        <p style={{ fontSize:15, color:"#6b7280", lineHeight:1.85, marginBottom:36, maxWidth:480, margin:"0 auto 36px" }}>
                            {t.cta.subtitle}
                        </p>

                        <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
                            <Link to="/lien-he" style={{
                                display:"inline-flex", alignItems:"center", gap:10,
                                padding:"16px 36px", borderRadius:100,
                                background:"linear-gradient(135deg,#16a34a,#22c55e)",
                                color:"#fff", textDecoration:"none",
                                fontSize:15, fontWeight:600,
                                boxShadow:"0 8px 28px rgba(22,163,74,.35)",
                                transition:"all .25s",
                            }}>
                                {t.cta.primaryBtn}
                            </Link>
                            <Link to="/artists" style={{
                                display:"inline-flex", alignItems:"center", gap:10,
                                padding:"15px 28px", borderRadius:100,
                                border:"1.5px solid #e5e7eb", color:"#374151",
                                textDecoration:"none", fontSize:14, fontWeight:500,
                                background:"#fff", transition:"all .25s",
                            }}>
                                {t.cta.secondaryBtn}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}