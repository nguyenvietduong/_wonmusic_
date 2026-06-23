'use client';
import { useEffect, useState } from "react";
import Link from "next/link";
import SEO from "@/components/frontend/SEO";
import "@/styles/music-theme.css";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { aboutPageText } from "@/locales/aboutPage";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useIsMobile } from "@/hooks/use-mobile";

const STAT_ACCENTS = [
    { bg: "linear-gradient(135deg,rgba(0,169,143,0.12),rgba(0,169,143,0.04))", border: "rgba(0,169,143,0.3)", color: "#00A98F", glow: "rgba(0,169,143,0.15)" },
    { bg: "linear-gradient(135deg,rgba(99,102,241,0.12),rgba(99,102,241,0.04))", border: "rgba(99,102,241,0.3)", color: "#818CF8", glow: "rgba(99,102,241,0.15)" },
    { bg: "linear-gradient(135deg,rgba(252,211,77,0.12),rgba(252,211,77,0.04))", border: "rgba(252,211,77,0.3)", color: "#F59E0B", glow: "rgba(252,211,77,0.15)" },
    { bg: "linear-gradient(135deg,rgba(52,212,184,0.12),rgba(52,212,184,0.04))", border: "rgba(52,212,184,0.3)", color: "#34D4B8", glow: "rgba(52,212,184,0.15)" },
];

const SERVICE_COLORS = [
    { bg: "rgba(0,169,143,0.1)", color: "#00A98F" },
    { bg: "rgba(99,102,241,0.1)", color: "#818CF8" },
    { bg: "rgba(252,211,77,0.1)", color: "#F59E0B" },
    { bg: "rgba(52,212,184,0.1)", color: "#34D4B8" },
    { bg: "rgba(239,68,68,0.1)", color: "#F87171" },
    { bg: "rgba(34,197,94,0.1)", color: "#4ADE80" },
];

const TEAM_COLORS = [
    "linear-gradient(135deg,#E8ECF8,#D8DFF0)",
    "linear-gradient(135deg,#E0F4F0,#C8EDE8)",
    "linear-gradient(135deg,#EEEEFB,#DDDAF8)",
    "linear-gradient(135deg,#EAEAFB,#D4D5F8)",
];

export default function AboutPage() {
    const isMobile = useIsMobile();
    const { lang } = useLanguageStore();
    const t = aboutPageText[lang];

    const {
        aboutHeroSubtitle, aboutMissionP1, aboutMissionP2, aboutCtaSubtitle,
        aboutHeroSubtitleEn, aboutMissionP1En, aboutMissionP2En, aboutCtaSubtitleEn,
        aboutStats, aboutTeam,
        aboutMissionHeadingVi, aboutMissionHighlightVi, aboutMissionHeadingEn, aboutMissionHighlightEn,
        aboutServicesVi, aboutServicesEn,
        aboutCtaHeadingVi, aboutCtaHighlightVi, aboutCtaHeadingEn, aboutCtaHighlightEn,
        fetch: fetchSettings, loaded: settingsLoaded,
    } = useSettingsStore();

    useEffect(() => { if (!settingsLoaded) fetchSettings(); }, [settingsLoaded, fetchSettings]);

    const isEn = lang === "en";
    const heroSubtitle    = (isEn ? (aboutHeroSubtitleEn    || aboutHeroSubtitle)    : (aboutHeroSubtitle    || aboutHeroSubtitleEn))    || t.hero.subtitle;
    const missionHeading  = (isEn ? (aboutMissionHeadingEn  || aboutMissionHeadingVi)  : (aboutMissionHeadingVi  || aboutMissionHeadingEn))  || t.mission.heading;
    const missionHighlight= (isEn ? (aboutMissionHighlightEn|| aboutMissionHighlightVi): (aboutMissionHighlightVi|| aboutMissionHighlightEn)) || t.mission.highlight;
    const missionP1       = (isEn ? (aboutMissionP1En       || aboutMissionP1)       : (aboutMissionP1       || aboutMissionP1En))       || t.mission.p1;
    const missionP2       = (isEn ? (aboutMissionP2En       || aboutMissionP2)       : (aboutMissionP2       || aboutMissionP2En))       || t.mission.p2;
    const ctaHeading      = (isEn ? (aboutCtaHeadingEn      || aboutCtaHeadingVi)     : (aboutCtaHeadingVi     || aboutCtaHeadingEn))     || t.cta.heading;
    const ctaHighlight    = (isEn ? (aboutCtaHighlightEn    || aboutCtaHighlightVi)   : (aboutCtaHighlightVi   || aboutCtaHighlightEn))   || t.cta.highlight;
    const ctaSubtitle     = (isEn ? (aboutCtaSubtitleEn     || aboutCtaSubtitle)      : (aboutCtaSubtitle      || aboutCtaSubtitleEn))     || t.cta.subtitle;

    let parsedStats: Array<{ value: string; label: string; icon: string }> = [];
    try { parsedStats = aboutStats ? JSON.parse(aboutStats) : []; } catch { parsedStats = []; }
    const displayStats = parsedStats.length > 0 ? parsedStats : t.stats;

    const rawSvc = isEn ? aboutServicesEn : aboutServicesVi;
    let displayServices: Array<{ icon: string; title: string; desc: string }> = [...t.services.items];
    try { if (rawSvc) { const p = JSON.parse(rawSvc); if (Array.isArray(p) && p.length > 0) displayServices = p; } } catch {}

    let parsedTeam: Array<{ name: string; role: string; initials: string }> = [];
    try { parsedTeam = aboutTeam ? JSON.parse(aboutTeam) : []; } catch { parsedTeam = []; }
    parsedTeam = parsedTeam.filter(m => m.name.trim() !== "");
    const displayTeam = parsedTeam.map((m, i) => ({
        name: m.name, role: m.role,
        avatar: m.initials || m.name.slice(0, 2).toUpperCase(),
        color: TEAM_COLORS[i % TEAM_COLORS.length],
    }));
    const showTeam = displayTeam.length > 0;

    const [activeYear, setActiveYear] = useState("2024");

    useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, []);

    return (
        <>
            <SEO title={t.seo.title} description={t.seo.description} canonical="https://www.wonmusic.vn/gioi-thieu" type="website" />

            <div style={{ fontFamily: "var(--m-font-body)", background: "var(--m-bg)", color: "var(--m-text)" }}>
                <style>{`
                    @keyframes abBarGrow {
                        from { width: 0; }
                        to   { width: 100%; }
                    }
                    @keyframes fadeInUp {
                        from { opacity:0; transform:translateY(20px); }
                        to   { opacity:1; transform:translateY(0); }
                    }
                    @keyframes scaleIn {
                        from { opacity:0; transform:scale(0.95); }
                        to   { opacity:1; transform:scale(1); }
                    }
                    .ab-stat-card {
                        padding: 28px 24px;
                        border-radius: 16px;
                        border: 1px solid;
                        animation: fadeInUp .5s both;
                        transition: transform .25s, box-shadow .25s;
                        position: relative;
                        overflow: hidden;
                    }
                    .ab-stat-card::before {
                        content: '';
                        position: absolute;
                        top: -30px; right: -30px;
                        width: 90px; height: 90px;
                        border-radius: 50%;
                        opacity: .5;
                        filter: blur(20px);
                    }
                    .ab-stat-card:hover {
                        transform: translateY(-5px);
                        box-shadow: 0 20px 48px -12px var(--glow);
                    }
                    .ab-timeline-item {
                        position: relative;
                        padding-left: 72px;
                        cursor: pointer;
                        transition: all .25s;
                    }
                    .ab-timeline-item::before {
                        content: '';
                        position: absolute;
                        left: 23px; top: 20px; bottom: -40px;
                        width: 2px;
                        background: linear-gradient(to bottom, rgba(0,169,143,.3), rgba(0,169,143,.05));
                    }
                    .ab-timeline-item:last-child::before { display: none; }
                    .ab-timeline-dot {
                        position: absolute;
                        left: 12px; top: 4px;
                        width: 22px; height: 22px;
                        border-radius: 50%;
                        border: 2px solid;
                        display: flex; align-items: center; justify-content: center;
                        transition: all .25s;
                        font-size: 8px; font-weight: 700;
                    }
                    .ab-service-card {
                        background: rgba(255,255,255,0.6);
                        border: 1px solid rgba(0,0,0,0.07);
                        border-radius: 16px;
                        padding: 28px 24px;
                        transition: all .3s cubic-bezier(0.2,0.8,0.2,1);
                        backdrop-filter: blur(8px);
                        position: relative;
                        overflow: hidden;
                    }
                    .ab-service-card::after {
                        content: '';
                        position: absolute;
                        inset: 0;
                        opacity: 0;
                        transition: opacity .3s;
                        border-radius: 16px;
                    }
                    .ab-service-card:hover {
                        transform: translateY(-6px);
                        border-color: rgba(0,169,143,0.25);
                        box-shadow: 0 24px 48px -16px rgba(0,169,143,0.18);
                    }
                    .ab-icon-wrap {
                        width: 52px; height: 52px;
                        border-radius: 14px;
                        display: flex; align-items: center; justify-content: center;
                        font-size: 24px;
                        margin-bottom: 16px;
                        transition: transform .25s;
                    }
                    .ab-service-card:hover .ab-icon-wrap {
                        transform: scale(1.1) rotate(-3deg);
                    }
                    .ab-progress-wrap {
                        position: relative;
                        height: 6px;
                        background: rgba(0,0,0,0.06);
                        border-radius: 100px;
                        overflow: hidden;
                    }
                    .ab-progress-fill {
                        height: 100%;
                        border-radius: 100px;
                        background: linear-gradient(90deg, var(--m-green-500), #34D4B8);
                        animation: abBarGrow 1.4s cubic-bezier(.4,0,.2,1) both;
                    }
                    .ab-quote-mark {
                        font-size: 72px;
                        line-height: 1;
                        color: rgba(0,169,143,0.12);
                        font-family: Georgia, serif;
                        position: absolute;
                        top: -16px; left: -8px;
                        pointer-events: none;
                    }
                `}</style>

                {/* ══════════ BANNER ══════════ */}
                <div style={{
                    position: "relative",
                    width: "100%",
                    height: isMobile ? 220 : 300,
                    overflow: "hidden",
                    backgroundImage: "url('/partner-bg.png')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                }}>
                    {/* Subtle teal glow */}
                    <div style={{ position:"absolute", top:"-30%", right:"-5%", width:480, height:480, borderRadius:"50%", background:"radial-gradient(circle,rgba(0,169,143,0.10),transparent 65%)", pointerEvents:"none" }} />
                    {/* EQ bars bottom */}
                    <div style={{ position:"absolute", bottom:0, left:0, right:0, display:"flex", alignItems:"flex-end", gap:2, height: isMobile ? 32 : 48, opacity:.15, pointerEvents:"none" }}>
                        {[22,38,28,50,35,60,42,72,30,55,65,28,48,38,70,32,52,42,62,36,58,26,44,34,66,30,50,40,68,24].map((h, i) => (
                            <div key={i} style={{ flex:1, height:`${h}%`, background:"#00A98F", borderRadius:"2px 2px 0 0", transformOrigin:"bottom", animation:`waveform-anim ${.4+(i%6)*.13}s ease-in-out infinite`, animationDelay:`${i*.04}s` }} />
                        ))}
                    </div>

                    <div style={{ maxWidth: 1440, margin: "0 auto", padding: `${isMobile ? 76 : 82}px 32px ${isMobile ? 24 : 28}px`, position:"relative", zIndex:10 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                            <span style={{ width:24, height:2, background:"#00A98F", borderRadius:2, display:"block" }} />
                            <span style={{ fontFamily:"var(--m-font-display)", fontSize:10, fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", color:"#00A98F" }}>{t.hero.label}</span>
                        </div>
                        <h1 style={{
                            fontFamily: "var(--m-font-body)",
                            fontSize: isMobile ? "clamp(22px,6vw,28px)" : "clamp(24px,2.8vw,36px)",
                            fontWeight: 900,
                            lineHeight: 1.15,
                            letterSpacing: "-0.5px",
                            color: "#0D0D1A",
                            margin: 0,
                        }}>
                            {t.hero.line1} <span style={{ color:"#00A98F" }}>{t.hero.highlight}</span>
                            {t.hero.line2 && <> {t.hero.line2}</>}
                        </h1>
                        {!isMobile && (
                            <p style={{ marginTop:10, fontSize:13, color:"rgba(0,0,0,0.5)", lineHeight:1.65, maxWidth:480 }}>{heroSubtitle}</p>
                        )}
                        <div style={{ display:"flex", gap:10, marginTop: isMobile ? 14 : 18, flexWrap:"wrap" }}>
                            <Link href="/artists" className="btn-primary-music" style={{ fontSize:12, padding:"9px 20px" }}>{t.hero.exploreBtn}</Link>
                            <Link href="/lien-he" style={{ display:"inline-flex", alignItems:"center", gap:6, color:"rgba(0,0,0,0.65)", fontSize:12, fontWeight:700, textDecoration:"none", border:"1.5px solid rgba(0,0,0,0.18)", padding:"9px 20px", borderRadius:100, transition:"all .25s", fontFamily:"var(--m-font-body)" }}>{t.hero.contactBtn}</Link>
                        </div>
                    </div>
                </div>

                {/* ══════════ STATS ══════════ */}
                <section style={{ padding: "64px 0", background: "var(--m-bg)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                    <div className="music-container">
                        <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: isMobile ? 12 : 20 }}>
                            {displayStats.map(({ value, label, icon }, i) => {
                                const acc = STAT_ACCENTS[i % STAT_ACCENTS.length];
                                return (
                                    <div
                                        key={label}
                                        className="ab-stat-card"
                                        style={{
                                            background: acc.bg,
                                            borderColor: acc.border,
                                            animationDelay: `${i * .1}s`,
                                            ["--glow" as string]: acc.glow,
                                        }}
                                    >
                                        <div style={{ width:40, height:40, borderRadius:12, background:acc.glow, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, marginBottom:14 }}>
                                            {icon}
                                        </div>
                                        <div style={{ fontSize: isMobile ? 26 : 32, fontWeight:800, fontFamily:"var(--m-font-display)", color: acc.color, letterSpacing:"-1px", lineHeight:1, marginBottom:6 }}>
                                            {value}
                                        </div>
                                        <div style={{ fontSize:13, color:"var(--m-muted)", fontWeight:500, lineHeight:1.4 }}>{label}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* ══════════ MISSION ══════════ */}
                <section className="music-section" style={{ background:"var(--m-surface-1)", position:"relative" }}>
                    <div style={{ position:"absolute", left:-80, top:"50%", transform:"translateY(-50%)", opacity:.05, pointerEvents:"none" }}>
                        <div style={{ width:360, height:360, borderRadius:"50%", background:"conic-gradient(from 0deg,#D8DCF0,#00A98F,#C8CEE8,#D8DCF0)", animation:"vinyl-spin 18s linear infinite", display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <div style={{ width:116, height:116, borderRadius:"50%", background:"#00A98F", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                <div style={{ width:32, height:32, borderRadius:"50%", background:"#F0F2FA" }} />
                            </div>
                        </div>
                    </div>

                    <div className="music-container" style={{ position:"relative", zIndex:1 }}>
                        <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 40 : 80, alignItems:"center" }}>
                            <div>
                                <div className="section-label">
                                    <span className="section-line" />
                                    <span className="section-tag">{t.mission.sectionLabel}</span>
                                </div>
                                <h2 className="section-title" style={{ fontSize:"clamp(20px,2.5vw,30px)" }}>
                                    {missionHeading}<br />
                                    <span className="text-green">{missionHighlight}</span>
                                </h2>

                                {/* Quote blocks */}
                                <div style={{ position:"relative", paddingLeft:20, marginBottom:16, borderLeft:"3px solid rgba(0,169,143,0.3)" }}>
                                    <p style={{ fontSize:15, color:"var(--m-muted)", lineHeight:1.9 }}>{missionP1}</p>
                                </div>
                                <div style={{ position:"relative", paddingLeft:20, marginBottom:36, borderLeft:"3px solid rgba(99,102,241,0.25)" }}>
                                    <p style={{ fontSize:15, color:"var(--m-muted)", lineHeight:1.9 }}>{missionP2}</p>
                                </div>

                                {/* Progress bars */}
                                <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
                                    {t.mission.values.map(({ label, pct }) => (
                                        <div key={label}>
                                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                                                <span style={{ fontSize:13, fontWeight:600, color:"var(--m-text)" }}>{label}</span>
                                                <span style={{ fontSize:12, fontWeight:700, color:"#00A98F", background:"rgba(0,169,143,0.1)", padding:"2px 8px", borderRadius:100 }}>{pct}%</span>
                                            </div>
                                            <div className="ab-progress-wrap">
                                                <div className="ab-progress-fill" style={{ width:`${pct}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Vinyl visual */}
                            <div style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
                                <div style={{ position:"relative", width: isMobile ? 220 : 320, height: isMobile ? 220 : 320 }}>
                                    <div style={{ position:"absolute", inset:-24, borderRadius:"50%", border:"1.5px dashed rgba(0,169,143,.2)", animation:"vinyl-spin 22s linear infinite" }} />
                                    <div style={{ position:"absolute", inset:-10, borderRadius:"50%", border:"1px dashed rgba(99,102,241,.15)", animation:"vinyl-spin 16s linear infinite reverse" }} />
                                    <div style={{ width:"100%", height:"100%", borderRadius:"50%", background:"conic-gradient(from 0deg,#D8DCF0,#00A98F,#C8CEE8,#D8DCF0,#E0E4F4,#34D4B8,#D8DCF0)", border:"3px solid rgba(0,169,143,.25)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 72px rgba(0,169,143,.15)", animation:"vinyl-spin 9s linear infinite" }}>
                                        <div style={{ width:isMobile?90:110, height:isMobile?90:110, borderRadius:"50%", background:"linear-gradient(135deg,var(--m-green-500),var(--m-green-300))", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 24px rgba(0,169,143,.4)" }}>
                                            <div style={{ width:30, height:30, borderRadius:"50%", background:"#F0F2FA" }} />
                                        </div>
                                        {[0.68,0.78,0.88].map((r, i) => (
                                            <div key={i} style={{ position:"absolute", width:`${r*100}%`, height:`${r*100}%`, borderRadius:"50%", border:"1px solid rgba(0,0,0,.08)" }} />
                                        ))}
                                    </div>
                                    <div style={{ position:"absolute", top:-20, right:24, width:3, height:88, background:"linear-gradient(to bottom,rgba(0,169,143,.8),transparent)", borderRadius:2, transformOrigin:"top center", transform:"rotate(28deg)" }} />
                                    {/* Now playing badge */}
                                    <div style={{ position:"absolute", bottom:-28, left:"50%", transform:"translateX(-50%)", display:"flex", alignItems:"center", gap:8, background:"var(--m-bg)", border:"1px solid rgba(0,169,143,.2)", padding:"8px 18px", borderRadius:100, boxShadow:"0 4px 20px rgba(0,169,143,.12)", whiteSpace:"nowrap" }}>
                                        <span className="live-dot" />
                                        <span style={{ fontSize:12, color:"var(--m-green-500)", fontWeight:700, fontFamily:"var(--m-font-display)" }}>{t.mission.nowPlaying}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ══════════ SERVICES ══════════ */}
                <section className="music-section" style={{ background:"var(--m-bg)" }}>
                    <div className="music-container">
                        <div style={{ marginBottom: isMobile ? 36 : 56 }}>
                            <div className="section-label">
                                <span className="section-line" />
                                <span className="section-tag">{t.services.sectionLabel}</span>
                            </div>
                            <h2 className="section-title" style={{ fontSize:"clamp(20px,2.5vw,30px)" }}>
                                {t.services.heading} <span className="text-green">{t.services.highlight}</span>
                            </h2>
                            <p className="section-desc">{t.services.subtitle}</p>
                        </div>

                        <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: isMobile ? 12 : 20 }}>
                            {displayServices.map(({ icon, title, desc }, i) => {
                                const sc = SERVICE_COLORS[i % SERVICE_COLORS.length];
                                return (
                                    <div key={title} className="ab-service-card" style={{ animationDelay:`${i*.08}s` }}>
                                        <div className="ab-icon-wrap" style={{ background: sc.bg }}>
                                            <span style={{ fontSize:24 }}>{icon}</span>
                                        </div>
                                        <h3 style={{ fontSize:16, fontWeight:700, color:"var(--m-text)", marginBottom:10, lineHeight:1.3 }}>{title}</h3>
                                        <p style={{ fontSize:14, color:"var(--m-muted)", lineHeight:1.75 }}>{desc}</p>
                                        <div style={{ display:"flex", alignItems:"flex-end", gap:2, height:12, marginTop:16, opacity:.5 }}>
                                            {[40,65,50,80,45,70,55].map((h, j) => (
                                                <div key={j} style={{ width:3, height:`${h}%`, background: sc.color, borderRadius:2, transformOrigin:"bottom", animation:`waveform-anim ${.4+j*.1}s ease-in-out infinite`, animationDelay:`${j*.07}s` }} />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* ══════════ TIMELINE ══════════ */}
                <section className="music-section" style={{ background:"var(--m-surface-1)" }}>
                    <div className="music-container">
                        <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 36 : 80, alignItems:"start" }}>
                            <div style={{ position: isMobile ? "static" : "sticky", top:120 }}>
                                <div className="section-label">
                                    <span className="section-line" />
                                    <span className="section-tag">{t.timeline.sectionLabel}</span>
                                </div>
                                <h2 className="section-title" style={{ fontSize:"clamp(20px,2.5vw,30px)" }}>
                                    {t.timeline.heading}<br />
                                    <span className="text-green">{t.timeline.highlight}</span>
                                </h2>
                                <p className="section-desc" style={{ marginBottom:0 }}>{t.timeline.subtitle}</p>

                                {/* Year indicator */}
                                {!isMobile && (
                                    <div style={{ marginTop:32, display:"inline-flex", alignItems:"center", gap:10, background:"rgba(0,169,143,0.08)", border:"1px solid rgba(0,169,143,0.2)", padding:"10px 20px", borderRadius:100 }}>
                                        <span className="live-dot" />
                                        <span style={{ fontFamily:"var(--m-font-display)", fontWeight:700, fontSize:13, color:"var(--m-green-500)" }}>{activeYear}</span>
                                    </div>
                                )}
                            </div>

                            <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
                                {t.timeline.items.map(({ year, title, desc }, idx) => {
                                    const isActive = activeYear === year;
                                    return (
                                        <div
                                            key={year}
                                            className="ab-timeline-item"
                                            style={{ paddingBottom:36 }}
                                            onClick={() => setActiveYear(year)}
                                        >
                                            <div
                                                className="ab-timeline-dot"
                                                style={{
                                                    background: isActive ? "var(--m-green-500)" : "var(--m-surface-2)",
                                                    borderColor: isActive ? "rgba(0,169,143,.5)" : "rgba(0,0,0,.12)",
                                                    boxShadow: isActive ? "0 0 16px rgba(0,169,143,.45)" : "none",
                                                    color: isActive ? "#fff" : "transparent",
                                                }}
                                            >
                                                ✓
                                            </div>
                                            <div style={{
                                                background: isActive ? "rgba(0,169,143,0.06)" : "transparent",
                                                border: `1px solid ${isActive ? "rgba(0,169,143,0.2)" : "transparent"}`,
                                                borderRadius:12,
                                                padding: isActive ? "16px 20px" : "4px 0",
                                                transition:"all .3s",
                                            }}>
                                                <div style={{ fontSize:11, fontWeight:800, color: isActive ? "var(--m-green-500)" : "var(--m-muted)", letterSpacing:"2px", textTransform:"uppercase", marginBottom:6, fontFamily:"var(--m-font-display)" }}>{year}</div>
                                                <h4 style={{ fontSize:15, fontWeight:700, color: isActive ? "var(--m-green-500)" : "var(--m-text)", marginBottom:6, transition:"color .25s" }}>{title}</h4>
                                                <p style={{ fontSize:13, color:"var(--m-muted)", lineHeight:1.75 }}>{desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ══════════ TEAM ══════════ */}
                {showTeam && (
                    <section className="music-section" style={{ background:"linear-gradient(135deg,#F0F2FA,#E8ECF8,#EAEAFB)" }}>
                        <div className="music-container">
                            <div style={{ marginBottom:48 }}>
                                <div className="section-label">
                                    <span className="section-line" style={{ background:"var(--m-green-300)" }} />
                                    <span className="section-tag" style={{ color:"var(--m-green-300)" }}>{t.team.sectionLabel}</span>
                                </div>
                                <h2 className="section-title" style={{ fontSize:"clamp(20px,2.5vw,30px)" }}>
                                    {t.team.heading} <span style={{ color:"var(--m-green-300)" }}>{t.team.highlight}</span>
                                </h2>
                            </div>

                            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:16 }}>
                                {displayTeam.map(({ name, role, avatar, color }, i) => (
                                    <div key={name} className="ab-service-card" style={{ textAlign:"center", padding:"32px 20px", animation:"fadeInUp .5s both", animationDelay:`${i*.1}s`, background:"rgba(255,255,255,.75)" }}>
                                        <div style={{ width:80, height:80, borderRadius:"50%", background:color, margin:"0 auto 16px", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--m-font-display)", fontSize:26, fontWeight:700, color:"#34D4B8", border:"3px solid rgba(0,169,143,.2)", boxShadow:"0 4px 20px rgba(0,169,143,.15)" }}>
                                            {avatar}
                                        </div>
                                        <p style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>{name}</p>
                                        <p style={{ fontSize:12, color:"#34D4B8", fontWeight:600 }}>{role}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* ══════════ CTA ══════════ */}
                <section style={{ padding: isMobile ? "64px 0" : "88px 0", background:"#0a1220", position:"relative", overflow:"hidden" }}>
                    {/* Top accent border */}
                    <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:"linear-gradient(90deg,#00A98F 0%,#34D4B8 50%,#00A98F 100%)" }} />
                    {/* BG glows */}
                    <div style={{ position:"absolute", top:"-30%", right:"-5%", width:520, height:520, borderRadius:"50%", background:"radial-gradient(circle,rgba(0,169,143,0.10),transparent 65%)", pointerEvents:"none" }} />
                    <div style={{ position:"absolute", bottom:"-20%", left:"5%", width:380, height:380, borderRadius:"50%", background:"radial-gradient(circle,rgba(52,211,184,0.07),transparent 65%)", pointerEvents:"none" }} />

                    <div style={{ maxWidth:1440, margin:"0 auto", padding:"0 32px", position:"relative", zIndex:1 }}>
                        <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 40 : 80, alignItems:"center" }}>

                            {/* ── Left: text content ── */}
                            <div>
                                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                                    <span style={{ width:24, height:2, background:"#34D4B8", borderRadius:2, display:"block" }} />
                                    <span style={{ fontFamily:"var(--m-font-display)", fontSize:10, fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", color:"#34D4B8" }}>
                                        {lang === "en" ? "Get in touch" : "Hợp tác cùng chúng tôi"}
                                    </span>
                                </div>

                                <h2 style={{ fontFamily:"var(--m-font-body)", fontSize:"clamp(22px,2.8vw,34px)", fontWeight:800, color:"#fff", lineHeight:1.2, letterSpacing:"-0.5px", margin:"0 0 16px" }}>
                                    {ctaHeading}<br />
                                    <span style={{ color:"#34D4B8" }}>{ctaHighlight}</span>
                                </h2>

                                <p style={{ fontSize:14, color:"rgba(255,255,255,0.5)", lineHeight:1.8, marginBottom:32, maxWidth:400 }}>
                                    {ctaSubtitle}
                                </p>

                                <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                                    <Link href="/lien-he" style={{ display:"inline-flex", alignItems:"center", gap:8, background:"linear-gradient(135deg,#00A98F,#007D69)", color:"#fff", padding:"12px 28px", borderRadius:100, fontSize:13, fontWeight:700, textDecoration:"none", boxShadow:"0 6px 20px rgba(0,169,143,0.35)", fontFamily:"var(--m-font-body)", transition:"all .25s" }}>
                                        {t.cta.primaryBtn}
                                    </Link>
                                    <Link href="/artists" style={{ display:"inline-flex", alignItems:"center", gap:8, color:"rgba(255,255,255,0.75)", padding:"11px 26px", borderRadius:100, fontSize:13, fontWeight:700, textDecoration:"none", border:"1.5px solid rgba(255,255,255,0.18)", fontFamily:"var(--m-font-body)", transition:"all .25s" }}>
                                        {t.cta.secondaryBtn}
                                    </Link>
                                </div>
                            </div>

                            {/* ── Right: feature cards ── */}
                            {!isMobile && (
                                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                                    {displayServices.slice(0, 3).map(({ icon, title, desc }, i) => (
                                        <div key={i} style={{
                                            display:"flex", alignItems:"center", gap:16,
                                            background:"rgba(255,255,255,0.04)",
                                            border:"1px solid rgba(255,255,255,0.08)",
                                            borderRadius:14, padding:"16px 20px",
                                            transition:"border-color .25s, background .25s",
                                        }}
                                            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,169,143,0.35)"; (e.currentTarget as HTMLDivElement).style.background = "rgba(0,169,143,0.06)"; }}
                                            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)"; }}
                                        >
                                            <div style={{ width:44, height:44, borderRadius:12, background:"rgba(0,169,143,0.12)", border:"1px solid rgba(0,169,143,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>
                                                {icon}
                                            </div>
                                            <div style={{ minWidth:0 }}>
                                                <p style={{ fontSize:14, fontWeight:700, color:"#fff", margin:"0 0 3px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{title}</p>
                                                <p style={{ fontSize:12, color:"rgba(255,255,255,0.45)", margin:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{desc}</p>
                                            </div>
                                            <svg style={{ marginLeft:"auto", flexShrink:0 }} viewBox="0 0 24 24" fill="none" stroke="rgba(0,169,143,0.6)" strokeWidth="2" width="16" height="16" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                                            </svg>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}
