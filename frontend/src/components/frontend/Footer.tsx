import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaClock } from "react-icons/fa";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { footerText } from "@/locales/footer";
import { companyConfig } from "@/config/company.config";

const NOTES = ["♩", "♪", "♫", "♬", "𝄞"];
const EQ_HEIGHTS = [40, 70, 55, 85, 45, 75, 60, 90, 50, 65, 80, 40, 70, 55];

const Footer = () => {
    const { lang } = useLanguageStore();
    const t = footerText[lang].footer;
    const notesBgRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const spawn = () => {
            if (!notesBgRef.current) return;
            const el = document.createElement("div");
            el.textContent = NOTES[Math.floor(Math.random() * NOTES.length)];
            const dur = 6 + Math.random() * 8;
            el.style.cssText = `
                position:absolute; pointer-events:none; user-select:none;
                left:${10 + Math.random() * 80}%; bottom:-20px;
                font-size:${12 + Math.random() * 14}px;
                color:${Math.random() > .5 ? "#4ade80" : "#86efac"};
                opacity:0;
                animation: wonNoteFloat ${dur}s linear forwards;
            `;
            notesBgRef.current.appendChild(el);
            setTimeout(() => el.remove(), dur * 1000);
        };
        spawn();
        const id = setInterval(spawn, 900);
        return () => clearInterval(id);
    }, []);

    const navLinks = [
        { to: "/gioi-thieu", label: t.introduction },
        { to: "/dich-vu",    label: t.services     },
        { to: "/nghe-si",    label: t.artists      },
        { to: "/blog",       label: t.blog         },
        { to: "/tuyen-dung", label: t.careers      },
    ];

    const serviceLinks = [
        t.service1, t.service2, t.service3, t.service4, t.service5,
    ];

    const contactItems = [
        { icon: <FaMapMarkerAlt />, text: companyConfig.address.headquarter[lang] },
        { icon: <FaPhoneAlt />,     text: companyConfig.phone                     },
        { icon: <FaEnvelope />,     text: companyConfig.email.contact             },
        { icon: <FaClock />,        text: companyConfig.workingHours[lang]        },
    ];

    return (
        <>
            <style>{`
                @keyframes wonNoteFloat {
                    0%   { transform:translateY(0) rotate(0deg); opacity:0; }
                    10%  { opacity:.7; }
                    90%  { opacity:.4; }
                    100% { transform:translateY(-320px) rotate(25deg); opacity:0; }
                }
                @keyframes wonGradShift {
                    0%,100% { background-position:0% 50%; }
                    50%     { background-position:100% 50%; }
                }
                @keyframes wonShimmer {
                    0%   { background-position:-200% center; }
                    100% { background-position: 200% center; }
                }
                @keyframes wonBarPulse {
                    0%,100% { transform:scaleY(.3); }
                    50%     { transform:scaleY(1); }
                }
                @keyframes wonWave {
                    0%,100% { d:path("M0,18 Q20,8 40,18 Q60,28 80,18 Q100,8 120,18 Q140,28 160,18 Q180,8 200,18"); }
                    50%     { d:path("M0,18 Q20,28 40,18 Q60,8 80,18 Q100,28 120,18 Q140,8 160,18 Q180,28 200,18"); }
                }
                @keyframes wonSpin { to { transform:rotate(360deg); } }
            `}</style>

            <footer className="relative bg-[#143821] text-[#d4e8d4] overflow-hidden">

                {/* Shimmer top border */}
                <div className="absolute top-0 left-0 right-0 h-px" style={{
                    background: "linear-gradient(90deg,transparent,#4ade80,#22c55e,#86efac,transparent)",
                    backgroundSize: "200% 100%",
                    animation: "wonShimmer 3s linear infinite",
                }} />

                {/* Floating notes */}
                <div ref={notesBgRef} className="absolute inset-0 pointer-events-none overflow-hidden" />

                <div className="relative z-10 max-w-7xl mx-auto px-6 pt-14 pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-10">

                        {/* ── Brand ── */}
                        <div>
                            <div className="text-2xl font-bold" style={{
                                fontFamily: "'Playfair Display', serif",
                                background: "linear-gradient(135deg,#4ade80,#86efac,#a3e635)",
                                backgroundSize: "200% 200%",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                animation: "wonGradShift 4s ease infinite",
                            }}>
                                Won <em>Music</em>
                            </div>

                            <p className="text-xs tracking-[2.5px] uppercase text-[#6b7e6b] mt-1 mb-3">
                                {t.tagline}
                            </p>

                            <p className="text-[13px] text-[#7a8f7a] leading-relaxed max-w-[240px]">
                                {t.description}
                            </p>

                            {/* Equalizer bars */}
                            <div className="flex items-end gap-[3px] h-7 mt-5">
                                {EQ_HEIGHTS.map((h, i) => (
                                    <div key={i}
                                        className="w-1 bg-[#4ade80] rounded-[2px] origin-bottom"
                                        style={{
                                            height: `${h}%`,
                                            animation: `wonBarPulse ${0.4 + (i % 5) * 0.15}s ease-in-out infinite`,
                                            animationDelay: `${i * 0.07}s`,
                                        }}
                                    />
                                ))}
                            </div>

                            {/* Socials */}
                            <div className="flex gap-2 mt-4">
                                {["f", "ig", "▶", "♪", "tt"].map((s) => (
                                    <a key={s} href="#"
                                        className="w-8 h-8 rounded-full border border-[rgba(74,222,128,.2)] flex items-center justify-center text-[13px] text-[#6b7e6b] transition-all duration-300 hover:border-[#4ade80] hover:text-[#4ade80] hover:bg-[rgba(74,222,128,.1)] hover:-translate-y-0.5">
                                        {s}
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* ── Nav ── */}
                        <div>
                            <h4 className="text-[11px] font-semibold tracking-[2px] uppercase text-[#4ade80] mb-5 relative pb-[10px]">
                                {t.exploreTitle}
                                <span className="absolute bottom-0 left-0 w-6 h-px bg-[#4ade80]" />
                            </h4>
                            <ul className="space-y-3">
                                {navLinks.map(({ to, label }) => (
                                    <li key={to}>
                                        <Link to={to}
                                            className="text-sm text-[#7a8f7a] flex items-center gap-2 transition-all duration-300 hover:text-[#4ade80] hover:pl-1.5 group">
                                            <span className="w-1 h-1 rounded-full bg-[#6b7e6b] flex-shrink-0 group-hover:bg-[#4ade80] transition-colors" />
                                            {label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* ── Services ── */}
                        <div>
                            <h4 className="text-[11px] font-semibold tracking-[2px] uppercase text-[#4ade80] mb-5 relative pb-[10px]">
                                {t.ourServices}
                                <span className="absolute bottom-0 left-0 w-6 h-px bg-[#4ade80]" />
                            </h4>
                            <ul className="space-y-3">
                                {serviceLinks.map((s, i) => (
                                    <li key={i} className="text-sm text-[#7a8f7a] flex items-center gap-2">
                                        <span className="w-1 h-1 rounded-full bg-[#6b7e6b] flex-shrink-0" />
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* ── Contact ── */}
                        <div>
                            <h4 className="text-[11px] font-semibold tracking-[2px] uppercase text-[#4ade80] mb-5 relative pb-[10px]">
                                {t.contact}
                                <span className="absolute bottom-0 left-0 w-6 h-px bg-[#4ade80]" />
                            </h4>

                            <ul className="space-y-3 text-[13px] text-[#7a8f7a]">
                                {contactItems.map(({ icon, text }, i) => (
                                    <li key={i} className="flex gap-3 items-start group hover:text-[#d4e8d4] transition-colors">
                                        <div className="w-7 h-7 rounded-md border border-[rgba(74,222,128,.15)] bg-[rgba(74,222,128,.06)] flex items-center justify-center text-[#4ade80] text-xs flex-shrink-0 group-hover:border-[#4ade80] group-hover:scale-105 transition-all">
                                            {icon}
                                        </div>
                                        <span>{text}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* Sound wave widget */}
                            <div className="flex items-center gap-3 mt-4 px-4 py-3 rounded-xl bg-[rgba(74,222,128,.04)] border border-[rgba(74,222,128,.1)]">
                                <svg width="80" height="36" viewBox="0 0 200 36" fill="none">
                                    <path
                                        d="M0,18 Q20,8 40,18 Q60,28 80,18 Q100,8 120,18 Q140,28 160,18 Q180,8 200,18"
                                        stroke="#4ade80" strokeWidth="2" strokeLinecap="round"
                                        style={{ animation: "wonWave 1.8s ease-in-out infinite" }}
                                    />
                                </svg>
                                <div className="text-[12px] text-[#6b7e6b]">
                                    <strong className="block text-[13px] text-[#4ade80]">{t.liveLabel}</strong>
                                    {t.liveUrl}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px" style={{
                        background: "linear-gradient(90deg,transparent,rgba(74,222,128,.15),rgba(74,222,128,.08),transparent)",
                    }} />

                    {/* Bottom bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-5 text-[12px] text-[#6b7e6b]">
                        <p>
                            © {new Date().getFullYear()}{" "}
                            <span className="text-[#4ade80]">{companyConfig.name}</span>.{" "}
                            {t.copyright}
                        </p>

                        {/* Spinning vinyl */}
                        <div className="w-9 h-9 rounded-full border border-[rgba(74,222,128,.2)]" style={{
                            background: "radial-gradient(circle,#2a3a2a 30%,#1a2e1a 31%,#1a2e1a 45%,rgba(74,222,128,.3) 46%,#1a2e1a 47%)",
                            animation: "wonSpin 4s linear infinite",
                        }} />

                        <div className="flex gap-5">
                            <Link to="/chinh-sach" className="hover:text-[#4ade80] transition-colors">{t.privacy}</Link>
                            <Link to="/dieu-khoan" className="hover:text-[#4ade80] transition-colors">{t.terms}</Link>
                            <Link to="/cookie"     className="hover:text-[#4ade80] transition-colors">{t.cookie}</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
};

export default Footer;