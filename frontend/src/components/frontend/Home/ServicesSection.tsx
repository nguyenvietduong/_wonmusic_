'use client'
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import "@/styles/music-theme.css";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { musicServicesText } from "@/locales/home/musicServices";

interface ServiceItem { icon: string; title: string; desc: string; tag: string; accent?: string }

const ServicesSection = () => {
    const lang = useLanguageStore((s) => s.lang);
    const t = musicServicesText[lang];
    const {
        homepageSvcLabelVi, homepageSvcHeadingVi, homepageSvcHighlightVi, homepageSvcDescVi,
        homepageSvcLabelEn, homepageSvcHeadingEn, homepageSvcHighlightEn, homepageSvcDescEn,
        homepageServicesVi, homepageServicesEn,
        loaded, fetch: fetchSettings,
    } = useSettingsStore();

    useEffect(() => { if (!loaded) fetchSettings(); }, [loaded, fetchSettings]);

    const isEn = lang === "en";
    const displayLabel    = (isEn ? homepageSvcLabelEn    : homepageSvcLabelVi)    || t.label;
    const displayHeading  = (isEn ? homepageSvcHeadingEn  : homepageSvcHeadingVi)  || t.heading;
    const displayHighlight= (isEn ? homepageSvcHighlightEn: homepageSvcHighlightVi)|| t.highlight;
    const displayDesc     = (isEn ? homepageSvcDescEn     : homepageSvcDescVi)     || t.desc;

    let displayServices: ServiceItem[] = [...t.services];
    try {
        const raw = isEn ? homepageServicesEn : homepageServicesVi;
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) displayServices = parsed;
        }
    } catch { /* keep locale fallback */ }

    const [selectedIndex, setSelectedIndex] = useState(0);
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
    const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
        emblaApi.on("select", onSelect);
        onSelect();
        return () => { emblaApi.off("select", onSelect); };
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        const id = setInterval(() => emblaApi.scrollNext(), 5000);
        return () => clearInterval(id);
    }, [emblaApi]);

    return (
        <section
            className="services-section"
            style={{
                background: "#0a0f0d",
                paddingBlock: "88px",
                position: "relative",
                overflow: "hidden",
            }}
        >
            <style>{`
                /* Radial ambient glow behind section */
                .services-section::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background:
                        radial-gradient(ellipse at 15% 50%, rgba(74,222,128,0.07) 0%, transparent 55%),
                        radial-gradient(ellipse at 85% 50%, rgba(52,211,153,0.05) 0%, transparent 55%);
                    pointer-events: none;
                }

                /* Mesh card */
                .svc-mesh-card {
                    position: relative;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.10);
                    border-radius: 16px;
                    padding: 28px 24px 26px;
                    overflow: hidden;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                    transition: border-color 0.4s ease;
                    height: 100%;
                }
                .svc-mesh-card:hover { border-color: transparent; }

                /* Radial gradient bg reveal on hover */
                .svc-mesh-card::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background:
                        radial-gradient(at 0% 0%, rgba(74,222,128,0.14) 0%, transparent 55%),
                        radial-gradient(at 100% 100%, rgba(52,211,153,0.12) 0%, transparent 55%);
                    opacity: 0;
                    transition: opacity 0.5s ease;
                    z-index: 0;
                    pointer-events: none;
                }
                .svc-mesh-card:hover::before { opacity: 1; }

                /* Yellow dot indicator on hover */
                .svc-mesh-card::after {
                    content: '';
                    position: absolute;
                    top: 14px; right: 14px;
                    width: 8px; height: 8px;
                    border-radius: 50%;
                    background: #fcd34d;
                    box-shadow: 0 0 12px rgba(252,211,77,0.7);
                    opacity: 0;
                    transform: scale(0.4);
                    transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1);
                    z-index: 3;
                }
                .svc-mesh-card:hover::after { opacity: 1; transform: scale(1); }

                /* Animated gradient border sweep */
                .svc-mesh-border {
                    position: absolute;
                    inset: 0;
                    border-radius: 16px;
                    padding: 1.5px;
                    background: linear-gradient(
                        120deg,
                        transparent 0%,
                        #4ade80 20%,
                        #34d399 50%,
                        #4ade80 80%,
                        transparent 100%
                    );
                    -webkit-mask:
                        linear-gradient(#fff 0 0) content-box,
                        linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor;
                    mask-composite: exclude;
                    opacity: 0;
                    transition: opacity 0.5s ease;
                    pointer-events: none;
                    z-index: 2;
                }
                .svc-mesh-card:hover .svc-mesh-border { opacity: 1; }

                /* Card content */
                .svc-mesh-content {
                    position: relative;
                    z-index: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    flex: 1;
                    transition: transform 0.4s ease;
                }
                .svc-mesh-card:hover .svc-mesh-content { transform: translateY(-2px); }

                /* Carousel track */
                .svc-carousel-track {
                    display: flex;
                    align-items: stretch;
                    margin-left: -20px;
                }
                .svc-carousel-slide {
                    flex: 0 0 25%;
                    min-width: 0;
                    padding-left: 20px;
                    display: flex;
                    flex-direction: column;
                }
                @media (max-width: 1024px) {
                    .svc-carousel-slide { flex: 0 0 50%; }
                }
                @media (max-width: 600px) {
                    .svc-carousel-slide { flex: 0 0 100%; }
                }

                /* Carousel nav buttons */
                .svc-carousel-btn {
                    position: absolute;
                    top: 50%; transform: translateY(-50%);
                    width: 40px; height: 40px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.06);
                    border: 1px solid rgba(255,255,255,0.14);
                    color: rgba(255,255,255,0.8);
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer;
                    z-index: 10;
                    transition: background 0.2s, border-color 0.2s;
                }
                .svc-carousel-btn:hover { background: #4ade8033; border-color: #4ade8055; }
                .svc-carousel-btn--prev { left: -6px; }
                .svc-carousel-btn--next { right: -6px; }

                /* Dot indicators — mobile only */
                .svc-dots {
                    display: none;
                    justify-content: center;
                    align-items: center;
                    gap: 6px;
                    margin-top: 20px;
                }
                .svc-dot {
                    width: 6px; height: 6px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.25);
                    border: none; padding: 0; cursor: pointer;
                    transition: all 0.3s ease;
                }
                .svc-dot.active {
                    width: 20px;
                    border-radius: 3px;
                    background: #4ade80;
                }

                /* ── Mobile overrides ── */
                @media (max-width: 600px) {
                    .services-section { padding-block: 56px !important; }
                    .svc-section-inner { padding: 0 20px !important; }
                    .svc-carousel-slide { flex: 0 0 82%; }
                    .svc-carousel-btn { display: none; }
                    .svc-dots { display: flex; }
                    .svc-section-desc { display: none; }
                    .svc-section-head { flex-direction: column; align-items: flex-start !important; gap: 12px; }
                    .svc-mesh-card { padding: 22px 18px 20px; }
                }
            `}</style>

            <div className="svc-section-inner" style={{ maxWidth: 1440, margin: "0 auto", padding: "0 32px", position: "relative" }}>
                {/* Section heading */}
                <div className="svc-section-head" style={{
                    display: "flex", alignItems: "flex-end", justifyContent: "space-between",
                    gap: 24, marginBottom: 36,
                    paddingBottom: 16,
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                    position: "relative",
                }}>
                    <div style={{
                        position: "absolute", left: 0, bottom: -1,
                        width: 64, height: 3,
                        background: "#4ade80", borderRadius: 2,
                    }} />

                    <div>
                        <div style={{
                            color: "#4ade80", fontSize: 12, fontWeight: 700,
                            letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: 8,
                        }}>
                            {displayLabel}
                        </div>
                        <h2 style={{
                            fontSize: "clamp(20px, 2.5vw, 30px)", fontWeight: 800,
                            color: "#fff", margin: 0, letterSpacing: "-0.4px",
                        }}>
                            {displayHeading} <span style={{ color: "#4ade80" }}>{displayHighlight}</span>
                        </h2>
                    </div>

                    <p className="svc-section-desc" style={{
                        color: "rgba(255,255,255,0.45)",
                        fontSize: 13,
                        lineHeight: 1.65,
                        maxWidth: 360,
                        margin: 0,
                        flexShrink: 0,
                        textAlign: "right",
                    }}>
                        {displayDesc}
                    </p>
                </div>

                {/* Carousel */}
                <div style={{ position: "relative" }}>
                    <button onClick={scrollPrev} className="svc-carousel-btn svc-carousel-btn--prev" aria-label="Prev">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>

                    <div ref={emblaRef} style={{ overflow: "hidden", padding: "8px 4px 16px" }}>
                        <div className="svc-carousel-track">
                            {displayServices.map((service, i) => (
                                <div key={i} className="svc-carousel-slide">
                                    <div className="svc-mesh-card">
                                        <span className="svc-mesh-border" />
                                        <div className="svc-mesh-content">
                                            {/* Icon */}
                                            <div style={{
                                                width: 52, height: 52,
                                                borderRadius: 12,
                                                background: "rgba(74,222,128,0.10)",
                                                border: "1px solid rgba(74,222,128,0.22)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                fontSize: 24,
                                                flexShrink: 0,
                                                transition: "background 0.4s ease",
                                            }}>
                                                {service.icon}
                                            </div>

                                            {/* Title */}
                                            <h3 style={{
                                                fontSize: 18, fontWeight: 700,
                                                color: "#fff", margin: 0, lineHeight: 1.3,
                                                letterSpacing: "-0.3px",
                                            }}>
                                                {service.title}
                                            </h3>

                                            {/* Desc */}
                                            <p style={{
                                                fontSize: 13.5, lineHeight: 1.7,
                                                color: "rgba(255,255,255,0.65)",
                                                margin: 0, flex: 1,
                                            }}>
                                                {service.desc}
                                            </p>

                                            {/* Tag + arrow row */}
                                            <div style={{
                                                display: "flex", alignItems: "center",
                                                justifyContent: "space-between", gap: 8, marginTop: 4,
                                            }}>
                                                <span style={{
                                                    fontSize: 11, fontWeight: 700,
                                                    letterSpacing: "0.07em",
                                                    textTransform: "uppercase",
                                                    color: "#4ade80",
                                                    background: "rgba(74,222,128,0.12)",
                                                    padding: "3px 9px", borderRadius: 20,
                                                    border: "1px solid rgba(74,222,128,0.25)",
                                                }}>
                                                    {service.tag}
                                                </span>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" width="16" height="16" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="5" y1="12" x2="19" y2="12" />
                                                    <polyline points="12 5 19 12 12 19" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button onClick={scrollNext} className="svc-carousel-btn svc-carousel-btn--next" aria-label="Next">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </button>

                    {/* Dot indicators — mobile only */}
                    <div className="svc-dots">
                        {displayServices.map((_, i) => (
                            <button
                                key={i}
                                className={`svc-dot${selectedIndex === i ? " active" : ""}`}
                                onClick={() => emblaApi?.scrollTo(i)}
                                aria-label={`Slide ${i + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ServicesSection;
