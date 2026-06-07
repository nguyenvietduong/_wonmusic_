'use client'

import Link from "next/link";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { footerText } from "@/locales/footer";
import { companyConfig } from "@/config/company.config";
import { useIsMobile } from "@/hooks/use-mobile";

const EQ_HEIGHTS = [40, 70, 55, 85, 45, 75, 60, 90, 50, 65];

const SOCIAL = [
    { label: "f", href: "#" },
    { label: "in", href: "#" },
    { label: "▶", href: "#" },
    { label: "♪", href: "#" },
    { label: "tt", href: "#" },
];

const Footer = () => {
    const { lang } = useLanguageStore();
    const t = footerText[lang].footer;
    const isMobile = useIsMobile();

    const navLinks = [
        { to: "/gioi-thieu", label: t.introduction },
        { to: "/artists",    label: t.artists      },
        { to: "/lien-he",    label: t.contact      },
    ];

    const serviceLinks = [t.service1, t.service2, t.service3, t.service4, t.service5];

    return (
        <>
            <style>{`
                @keyframes wonEq {
                    0%,100% { transform: scaleY(0.3); }
                    50%     { transform: scaleY(1); }
                }
                @keyframes wonWave {
                    0%   { d: path("M0,18 Q20,8 40,18 Q60,28 80,18 Q100,8 120,18 Q140,28 160,18 Q180,8 200,18"); }
                    50%  { d: path("M0,18 Q20,28 40,18 Q60,8 80,18 Q100,28 120,18 Q140,8 160,18 Q180,28 200,18"); }
                    100% { d: path("M0,18 Q20,8 40,18 Q60,28 80,18 Q100,8 120,18 Q140,28 160,18 Q180,8 200,18"); }
                }
                .footer-link {
                    display: flex; align-items: center; gap: 8px;
                    font-size: 13px; color: rgba(0,0,0,0.68);
                    text-decoration: none;
                    transition: color 0.2s, padding-left 0.2s;
                }
                .footer-link:hover { color: #34D4B8; padding-left: 4px; }
                .footer-link::before {
                    content: '';
                    width: 4px; height: 4px;
                    border-radius: 50%;
                    background: currentColor;
                    flex-shrink: 0;
                    transition: background 0.2s;
                }
            `}</style>

            <footer style={{ background: "#F0F0F8", color: "rgba(0,0,0,0.72)", position: "relative", overflow: "hidden" }}>

                {/* Top shimmer border */}
                <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: 1,
                    background: "linear-gradient(90deg, transparent, #00A98F 30%, #34D4B8 50%, #00A98F 70%, transparent)",
                }} />

                <div style={{ maxWidth: 1440, margin: "0 auto", padding: isMobile ? "40px 20px 24px" : "56px 32px 28px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 40, paddingBottom: 40 }}>

                        {/* ── Col 1: Brand ── */}
                        <div>
                            {/* Logo */}
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 8,
                                    background: "linear-gradient(135deg, #00A98F, #818CF8, #6366F1)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 16, color: "#fff",
                                    flexShrink: 0,
                                }}>W</div>
                                <div>
                                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 14, color: "#0D0D1A", letterSpacing: "-0.3px" }}>
                                        WON MUSIC
                                    </div>
                                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(0,0,0,0.68)", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                                        MUSIC PLATFORM
                                    </div>
                                </div>
                            </div>

                            <p style={{ fontSize: 9, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(0,0,0,0.68)", marginBottom: 10 }}>
                                {t.tagline}
                            </p>
                            <p style={{ fontSize: 13, color: "rgba(0,0,0,0.68)", lineHeight: 1.65, maxWidth: 240, marginBottom: 20 }}>
                                {t.description}
                            </p>

                            {/* Equalizer bars */}
                            <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 28, marginBottom: 20 }}>
                                {EQ_HEIGHTS.map((h, i) => (
                                    <div key={i} style={{
                                        width: 4, borderRadius: 2,
                                        background: "linear-gradient(to top, #00A98F, #34D4B8)",
                                        height: `${h}%`,
                                        transformOrigin: "bottom",
                                        animation: `wonEq ${0.4 + (i % 5) * 0.15}s ease-in-out infinite`,
                                        animationDelay: `${i * 0.07}s`,
                                    }} />
                                ))}
                            </div>

                            {/* Socials */}
                            <div style={{ display: "flex", gap: 8 }}>
                                {SOCIAL.map(({ label, href }) => (
                                    <a key={label} href={href} style={{
                                        width: 32, height: 32, borderRadius: "50%",
                                        border: "1px solid rgba(0,169,143,0.2)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 13, color: "rgba(0,0,0,0.68)", textDecoration: "none",
                                        transition: "all 0.2s",
                                    }}
                                        onMouseEnter={e => Object.assign(e.currentTarget.style, { borderColor: "#34D4B8", color: "#34D4B8", background: "rgba(0,169,143,0.08)", transform: "translateY(-2px)" })}
                                        onMouseLeave={e => Object.assign(e.currentTarget.style, { borderColor: "rgba(0,169,143,0.2)", color: "rgba(0,0,0,0.68)", background: "transparent", transform: "translateY(0)" })}
                                    >
                                        {label}
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* ── Col 2: Explore ── */}
                        <div>
                            <h4 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: "#34D4B8", marginBottom: 20, paddingBottom: 10, borderBottom: "1px solid rgba(0,169,143,0.15)" }}>
                                {t.exploreTitle}
                            </h4>
                            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                                {navLinks.map(({ to, label }) => (
                                    <li key={to}>
                                        <Link href={to} className="footer-link">{label}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* ── Col 3: Services ── */}
                        <div>
                            <h4 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: "#34D4B8", marginBottom: 20, paddingBottom: 10, borderBottom: "1px solid rgba(0,169,143,0.15)" }}>
                                {t.ourServices}
                            </h4>
                            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                                {serviceLinks.map((s, i) => (
                                    <li key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(0,0,0,0.68)" }}>
                                        <span style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(0,169,143,0.4)", flexShrink: 0 }} />
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* ── Col 4: Contact ── */}
                        <div>
                            <h4 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: "#34D4B8", marginBottom: 20, paddingBottom: 10, borderBottom: "1px solid rgba(0,169,143,0.15)" }}>
                                {t.contact}
                            </h4>
                            <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13, color: "rgba(0,0,0,0.68)" }}>
                                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                    <span style={{ color: "#34D4B8", flexShrink: 0, marginTop: 1 }}>📍</span>
                                    <span>{companyConfig.address.headquarter[lang]}</span>
                                </div>
                                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                    <span style={{ color: "#34D4B8", flexShrink: 0 }}>📞</span>
                                    <span>{companyConfig.phone}</span>
                                </div>
                                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                    <span style={{ color: "#34D4B8", flexShrink: 0 }}>✉</span>
                                    <span>{companyConfig.email.contact}</span>
                                </div>
                            </div>

                            {/* Wave widget */}
                            <div style={{
                                display: "flex", alignItems: "center", gap: 12,
                                marginTop: 20, padding: "10px 14px", borderRadius: 10,
                                background: "rgba(0,169,143,0.05)",
                                border: "1px solid rgba(0,169,143,0.15)",
                            }}>
                                <svg width="70" height="30" viewBox="0 0 200 36" fill="none" style={{ flexShrink: 0 }}>
                                    <path
                                        d="M0,18 Q20,8 40,18 Q60,28 80,18 Q100,8 120,18 Q140,28 160,18 Q180,8 200,18"
                                        stroke="#34D4B8" strokeWidth="2" strokeLinecap="round"
                                        style={{ animation: "wonWave 1.8s ease-in-out infinite" }}
                                    />
                                </svg>
                                <div>
                                    <strong style={{ display: "block", fontSize: 12, color: "#34D4B8", marginBottom: 2 }}>{t.liveLabel}</strong>
                                    <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "rgba(0,0,0,0.68)" }}>{t.liveUrl}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(0,169,143,0.15), transparent)", marginBottom: 24 }} />

                    {/* Bottom bar */}
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <p style={{ fontSize: 12, color: "rgba(0,0,0,0.68)" }}>
                            © {new Date().getFullYear()}{" "}
                            <span style={{ color: "#34D4B8" }}>{companyConfig.name}</span>.{" "}
                            {t.copyright}
                        </p>

                        {/* Vinyl spinner */}
                        <div style={{
                            width: 32, height: 32, borderRadius: "50%",
                            background: "radial-gradient(circle, #D8DCF0 30%, #C8CEE8 31%, #C8CEE8 45%, rgba(0,169,143,0.35) 46%, #C8CEE8 47%)",
                            border: "1px solid rgba(0,169,143,0.15)",
                            animation: "wonEq 3s linear infinite",
                        }} />

                        <div style={{ display: "flex", gap: 20 }}>
                            {[
                                { to: "/chinh-sach", label: t.privacy },
                                { to: "/dieu-khoan", label: t.terms   },
                                { to: "/cookie",     label: t.cookie  },
                            ].map(({ to, label }) => (
                                <Link key={to} href={to} style={{ fontSize: 12, color: "rgba(0,0,0,0.68)", textDecoration: "none", transition: "color 0.2s" }}
                                    onMouseEnter={e => (e.currentTarget.style.color = "#34D4B8")}
                                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(0,0,0,0.68)")}
                                >
                                    {label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
};

export default Footer;
