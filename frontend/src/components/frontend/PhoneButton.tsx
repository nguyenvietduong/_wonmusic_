'use client'
import { FaPhoneAlt } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { companyConfig } from "@/config/company.config";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useEffect, useState } from "react";

const PhoneButton = () => {
    const router = useRouter();
    const isMobile = useIsMobile();
    const currentTrack = usePlayerStore(s => s.currentTrack);
    const { wonmediaUrl, loaded, fetch: fetchSettings } = useSettingsStore();
    const bottom = isMobile && currentTrack ? 124 : 80;

    const [phoneHover, setPhoneHover] = useState(false);
    const [mediaHover, setMediaHover] = useState(false);

    useEffect(() => { if (!loaded) fetchSettings(); }, [loaded, fetchSettings]);

    return (
        <div
            className="fixed left-5 z-[9999] flex flex-col items-start gap-3"
            style={{ bottom, transition: "bottom .3s" }}
        >
            <style>{`
                @keyframes wm-float {
                    0%,100% { transform: translateY(0px); }
                    50%     { transform: translateY(-5px); }
                }
                @keyframes wm-float2 {
                    0%,100% { transform: translateY(0px); }
                    50%     { transform: translateY(-6px); }
                }
                @keyframes wm-ripple {
                    0%   { transform:scale(1);   opacity:.5; }
                    100% { transform:scale(2.2); opacity:0;  }
                }
                @keyframes wm-glow-phone {
                    0%,100% { box-shadow: 0 8px 25px rgba(0,169,143,0.45); }
                    50%     { box-shadow: 0 8px 40px rgba(0,169,143,0.75), 0 0 0 6px rgba(0,169,143,0.12); }
                }
                @keyframes wm-glow-media {
                    0%,100% { box-shadow: 0 8px 25px rgba(168,85,247,0.45); }
                    50%     { box-shadow: 0 8px 40px rgba(168,85,247,0.75), 0 0 0 6px rgba(168,85,247,0.12); }
                }
                @keyframes wm-icon-ring {
                    0%   { transform:scale(1);    opacity:.6; }
                    70%  { transform:scale(1.55); opacity:0;  }
                    100% { transform:scale(1.55); opacity:0;  }
                }
                @keyframes wm-shimmer {
                    0%   { transform:translateX(-160%); }
                    100% { transform:translateX(160%);  }
                }
                @keyframes wm-spin-icon {
                    0%   { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .wm-btn-phone { animation: wm-float 3s ease-in-out infinite, wm-glow-phone 3s ease-in-out infinite; }
                .wm-btn-media { animation: wm-float2 3.4s ease-in-out infinite, wm-glow-media 3.4s ease-in-out infinite; }

                .wm-btn-phone:hover { animation: none !important; transform: scale(1.06) translateY(-3px); box-shadow: 0 12px 40px rgba(0,169,143,0.7) !important; }
                .wm-btn-media:hover { animation: none !important; transform: scale(1.06) translateY(-3px); box-shadow: 0 12px 40px rgba(168,85,247,0.7) !important; }

                .wm-shimmer-phone { animation: wm-shimmer 2.5s linear infinite; }
                .wm-shimmer-media { animation: wm-shimmer 2.8s linear infinite; }

                .wm-icon-phone { animation: wm-icon-ring 1.8s ease-out infinite; }
                .wm-icon-media { animation: wm-icon-ring 2.2s ease-out infinite; }

                .wm-phone-icon:hover svg { animation: wm-spin-icon .5s ease; }
            `}</style>

            {/* ── WonMedia button ── */}
            {wonmediaUrl && (
                <a
                    href={wonmediaUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{ textDecoration: "none", display: "block", position: "relative" }}
                    onMouseEnter={() => setMediaHover(true)}
                    onMouseLeave={() => setMediaHover(false)}
                >
                    {/* Ripple rings */}
                    <span className="wm-icon-media" style={{
                        position: "absolute", top: "50%", left: 7, marginTop: -27,
                        width: 54, height: 54, borderRadius: "50%",
                        border: "2px solid rgba(168,85,247,0.6)",
                        pointerEvents: "none",
                    }} />
                    <span className="wm-icon-media" style={{
                        position: "absolute", top: "50%", left: 7, marginTop: -27,
                        width: 54, height: 54, borderRadius: "50%",
                        border: "2px solid rgba(99,102,241,0.4)",
                        animationDelay: ".6s",
                        pointerEvents: "none",
                    }} />

                    <div
                        className="wm-btn-media relative flex items-center rounded-full pl-1 pr-1 lg:pr-4 xl:pr-4 py-1 transition-all duration-300"
                        style={{
                            background: "linear-gradient(135deg,#a855f7,#6366f1)",
                            overflow: "hidden",
                            cursor: "pointer",
                        }}
                    >
                        {/* Continuous shimmer */}
                        <span className="wm-shimmer-media" style={{
                            position: "absolute", inset: 0,
                            background: "linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.2) 50%,transparent 65%)",
                            pointerEvents: "none",
                        }} />

                        {/* Icon circle */}
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300"
                            style={{ color: "#a855f7", transform: mediaHover ? "rotate(15deg) scale(1.1)" : "rotate(0deg) scale(1)" }}>
                            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                            </svg>
                        </div>

                        <span className="ml-none lg:ml-3 xl:ml-3 text-white font-semibold text-sm whitespace-nowrap overflow-hidden max-w-none sm:max-w-none lg:max-w-[200px] xl:max-w-[200px]">
                            WonMedia
                        </span>
                    </div>
                </a>
            )}

            {/* ── Phone button ── */}
            <div
                onClick={() => router.push("/lien-he")}
                title="Liên hệ ngay"
                className="cursor-pointer"
                style={{ position: "relative" }}
                onMouseEnter={() => setPhoneHover(true)}
                onMouseLeave={() => setPhoneHover(false)}
            >
                {/* Ripple rings */}
                <span className="wm-icon-phone" style={{
                    position: "absolute", top: "50%", left: 7, marginTop: -27,
                    width: 54, height: 54, borderRadius: "50%",
                    border: "2px solid rgba(52,212,184,0.6)",
                    pointerEvents: "none",
                }} />
                <span className="wm-icon-phone" style={{
                    position: "absolute", top: "50%", left: 7, marginTop: -27,
                    width: 54, height: 54, borderRadius: "50%",
                    border: "2px solid rgba(0,169,143,0.4)",
                    animationDelay: ".6s",
                    pointerEvents: "none",
                }} />

                <div
                    className="wm-btn-phone relative flex items-center rounded-full pl-1 pr-1 lg:pr-4 xl:pr-4 py-1 transition-all duration-300"
                    style={{
                        background: "linear-gradient(135deg,#00A98F,#007D69)",
                        overflow: "hidden",
                    }}
                >
                    {/* Continuous shimmer */}
                    <span className="wm-shimmer-phone" style={{
                        position: "absolute", inset: 0,
                        background: "linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.18) 50%,transparent 65%)",
                        pointerEvents: "none",
                    }} />

                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300"
                        style={{ color: "#00A98F", transform: phoneHover ? "rotate(-15deg) scale(1.1)" : "rotate(0deg) scale(1)" }}>
                        <FaPhoneAlt className="text-lg" />
                    </div>

                    <span className="ml-none lg:ml-3 xl:ml-3 text-white font-semibold text-sm whitespace-nowrap overflow-hidden max-w-none sm:max-w-none lg:max-w-[200px] xl:max-w-[200px]">
                        {companyConfig.phone}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default PhoneButton;
