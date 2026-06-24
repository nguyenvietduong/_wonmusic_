'use client'

import Link from "next/link";
import { useEffect } from "react";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { footerText } from "@/locales/footer";

const Footer = () => {
    const { lang } = useLanguageStore();
    const t = footerText[lang].footer;

    const {
        siteName, logoUrl,
        facebook, instagram, youtube, tiktok, sliderSoundcloudUrl,
        contactPhone, contactAddress, contactAddressEn, contactEmail,
        fetch: fetchSettings, loaded: settingsLoaded,
    } = useSettingsStore();

    useEffect(() => { if (!settingsLoaded) fetchSettings(); }, [settingsLoaded, fetchSettings]);

    const navLinks = [
        { to: "/",           label: lang === "vi" ? "Trang chủ"   : "Home"       },
        { to: "/gioi-thieu", label: t.introduction                               },
        { to: "/artists",    label: t.artists                                    },
        { to: "/lien-he",    label: t.contact                                    },
    ];

    const serviceLinks = [t.service1, t.service2, t.service3, t.service4, t.service5];

    const SOCIAL_ICONS: { label: string; key: string; url: string; d: string }[] = [
        {
            label: "Facebook",
            key: "fb",
            url: facebook,
            d: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
        },
        {
            label: "Instagram",
            key: "ig",
            url: instagram,
            d: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z",
        },
        {
            label: "YouTube",
            key: "yt",
            url: youtube,
            d: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
        },
        {
            label: "TikTok",
            key: "tt",
            url: tiktok,
            d: "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.3a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.06a8.21 8.21 0 0 0 4.8 1.54v-3.4a4.85 4.85 0 0 1-1.03-.51z",
        },
        {
            label: "SoundCloud",
            key: "sc",
            url: sliderSoundcloudUrl,
            d: "M1.175 12.225c-.056 0-.094.05-.101.13l-.233 2.154.233 2.105c.007.08.045.13.101.13.055 0 .094-.05.101-.13l.265-2.105-.265-2.154c-.007-.08-.046-.13-.101-.13zm.899-.309c-.068 0-.117.058-.124.143l-.2 2.463.2 2.394c.007.085.056.143.124.143.067 0 .117-.058.124-.143l.227-2.394-.227-2.463c-.007-.085-.057-.143-.124-.143zm10.267-2.57c-.28 0-.548.056-.797.158-.164-3.405-2.97-6.113-6.42-6.113-1.02 0-1.986.248-2.832.686-.313.163-.396.33-.4.476v12.055c.004.153.122.279.274.293h10.175c.835 0 1.512-.676 1.512-1.512V10.64c0-.835-.677-1.511-1.512-1.511z",
        },
    ].filter(s => !!s.url);

    const address = lang === "en" && contactAddressEn ? contactAddressEn : contactAddress;

    const year = new Date().getFullYear();

    return (
        <footer style={{ position: "relative", overflow: "hidden", background: "#0a1220", color: "rgba(255,255,255,0.6)" }}>
            <style>{`
                .wm-footer-nav-link {
                    font-size: 13.5px;
                    color: rgba(255,255,255,0.6);
                    text-decoration: none;
                    padding: 5px 0;
                    display: block;
                    transition: color 0.15s, padding-left 0.15s;
                }
                .wm-footer-nav-link:hover { color: #fff; padding-left: 4px; }

                .wm-footer-social-btn {
                    width: 38px; height: 38px;
                    border-radius: 50%;
                    border: 1px solid rgba(255,255,255,0.12);
                    display: inline-flex; align-items: center; justify-content: center;
                    color: rgba(255,255,255,0.6);
                    text-decoration: none;
                    transition: all 0.2s;
                    flex-shrink: 0;
                }
                .wm-footer-social-btn:hover {
                    background: var(--m-green-500, #4ade80);
                    border-color: var(--m-green-500, #4ade80);
                    color: #fff;
                    transform: translateY(-2px);
                }

                .wm-footer-contact-link {
                    display: flex; gap: 10px; align-items: center;
                    text-decoration: none; transition: opacity 0.15s;
                }
                .wm-footer-contact-link:hover { opacity: 0.8; }

                .wm-footer-email-btn {
                    display: inline-flex; gap: 10px; align-items: center;
                    text-decoration: none;
                    padding: 9px 14px; border-radius: 10px;
                    background: rgba(74,222,128,0.08);
                    border: 1px solid rgba(74,222,128,0.2);
                    transition: all 0.2s; width: fit-content;
                }
                .wm-footer-email-btn:hover {
                    background: rgba(74,222,128,0.15);
                    border-color: rgba(74,222,128,0.4);
                }

                .wm-footer-grid {
                    display: grid;
                    grid-template-columns: 2fr 1fr 1fr 1.5fr;
                    gap: 48px 40px;
                    padding-bottom: 56px;
                }
                @media (max-width: 900px) {
                    .wm-footer-grid {
                        grid-template-columns: 1fr 1fr;
                    }
                    .wm-footer-grid > div:first-child { grid-column: 1 / -1; }
                    .wm-footer-grid > div:last-child  { grid-column: 1 / -1; }
                }
                @media (max-width: 560px) {
                    .wm-footer-grid { grid-template-columns: 1fr; gap: 32px 0; }
                    .wm-footer-grid > div:first-child,
                    .wm-footer-grid > div:last-child { grid-column: auto; }
                }
            `}</style>

            {/* Top gradient border */}
            <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 3,
                background: "linear-gradient(90deg, var(--m-green-500, #4ade80), #34d399, var(--m-green-500, #4ade80))",
                backgroundSize: "200% 100%",
            }} />

            {/* Radial glow decorations */}
            <div style={{ position: "absolute", top: -120, right: -120, width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle, rgba(74,222,128,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -80, left: -80, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(52,211,153,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

            <div style={{ maxWidth: 1440, margin: "0 auto", padding: "64px 32px 0", position: "relative", zIndex: 1 }}>
                <div className="wm-footer-grid">

                    {/* ── Col 1: Brand ── */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        {/* Logo */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ background: "#fff", borderRadius: 10, padding: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <img
                                    src={logoUrl || "/icon.png"}
                                    alt={siteName || "Won Music"}
                                    style={{ height: 36, width: "auto", objectFit: "contain", maxWidth: 100, display: "block" }}
                                />
                            </div>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: 15, color: "#fff", letterSpacing: "-0.3px", lineHeight: 1.2 }}>
                                    {siteName || "WON MUSIC"}
                                </div>
                                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "1.8px", textTransform: "uppercase", marginTop: 2 }}>
                                    MUSIC PLATFORM
                                </div>
                            </div>
                        </div>

                        <p style={{ fontFamily:"var(--m-font-body)", fontSize: 13, lineHeight: 1.75, color: "rgba(255,255,255,0.5)", maxWidth: 280, margin: 0 }}>
                            {t.description}
                        </p>

                        {/* Social icons — chỉ hiện nếu URL được cấu hình trong admin */}
                        {SOCIAL_ICONS.length > 0 && (
                            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                                {SOCIAL_ICONS.map(({ label, key, url, d }) => (
                                    <a key={key} href={url} target="_blank" rel="noreferrer" aria-label={label} className="wm-footer-social-btn">
                                        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                                            <path d={d} />
                                        </svg>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Col 2: Explore ── */}
                    <div>
                        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#4ade80", marginBottom: 20 }}>
                            {t.exploreTitle}
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            {navLinks.map(({ to, label }) => (
                                <Link key={to} href={to} className="wm-footer-nav-link">
                                    {label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* ── Col 3: Services ── */}
                    <div>
                        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#4ade80", marginBottom: 20 }}>
                            {t.ourServices}
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            {serviceLinks.map((s, i) => (
                                <span key={i} style={{ fontSize: 13.5, color: "rgba(255,255,255,0.55)", padding: "5px 0", display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#4ade80", flexShrink: 0, opacity: 0.7 }} />
                                    {s}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* ── Col 4: Contact ── */}
                    <div>
                        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#4ade80", marginBottom: 20 }}>
                            {t.contact}
                        </p>

                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {/* Address */}
                            {address && (
                                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                    <span style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" width="13" height="13" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                                        </svg>
                                    </span>
                                    <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.5)", lineHeight: 1.65 }}>
                                        {address}
                                    </span>
                                </div>
                            )}

                            {/* Phone */}
                            {contactPhone && (
                                <a href={`tel:${contactPhone}`} className="wm-footer-contact-link">
                                    <span style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" width="13" height="13" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.95-.9a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                                        </svg>
                                    </span>
                                    <span style={{ fontSize: 13.5, color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>{contactPhone}</span>
                                </a>
                            )}

                            {/* Email */}
                            {contactEmail && (
                                <a href={`mailto:${contactEmail}`} className="wm-footer-email-btn">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" width="13" height="13" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                                    </svg>
                                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>{contactEmail}</span>
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div style={{
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                    padding: "20px 0 24px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    flexWrap: "wrap", gap: 12,
                    fontSize: 12, color: "rgba(255,255,255,0.3)",
                }}>
                    <span>© {year} <span style={{ color: "#4ade80" }}>WON MUSIC</span>. {t.copyright}</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <span style={{ color: "#f87171" }}>♥</span>
                        Made by NguyenVietDuong
                    </span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
