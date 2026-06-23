'use client';
import { useEffect } from "react";
import { bannerSectionText } from "@/locales/contact/bannerSection";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useIsMobile } from "@/hooks/use-mobile";

const EQ_H = [22,38,28,50,35,60,42,72,30,55,65,28,48,38,70,32,52,42,62,36,58,26,44,34,66,30,50,40,68,24];

const PageBannerSection = () => {
    const { lang } = useLanguageStore();
    const fallback = bannerSectionText[lang];
    const isMobile = useIsMobile();
    const {
        contactBannerSubtitleVi, contactBannerSubtitleEn,
        contactBannerTitleVi, contactBannerTitleEn,
        fetch: fetchSettings, loaded: settingsLoaded,
    } = useSettingsStore();

    useEffect(() => { if (!settingsLoaded) fetchSettings(); }, [settingsLoaded, fetchSettings]);

    const isEn = lang === "en";
    const subtitle = (isEn ? contactBannerSubtitleEn : contactBannerSubtitleVi) || fallback.subtitle;
    const title    = (isEn ? contactBannerTitleEn    : contactBannerTitleVi)    || fallback.title;

    const t = { subtitle, title };

    return (
        <div style={{
            position: "relative",
            overflow: "hidden",
            height: isMobile ? 220 : 300,
            backgroundImage: "url('/partner-bg.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
        }}>
            {/* Subtle teal glow */}
            <div style={{ position:"absolute", top:"-30%", right:"-5%", width:480, height:480, borderRadius:"50%", background:"radial-gradient(circle,rgba(0,169,143,0.10),transparent 65%)", pointerEvents:"none" }} />

            {/* EQ bars bottom */}
            <div style={{ position:"absolute", bottom:0, left:0, right:0, display:"flex", alignItems:"flex-end", gap:2, height: isMobile ? 28 : 40, opacity:.15, pointerEvents:"none" }}>
                {EQ_H.map((h, i) => (
                    <div key={i} style={{ flex:1, height:`${h}%`, background:"#00A98F", borderRadius:"2px 2px 0 0", transformOrigin:"bottom", animation:`waveform-anim ${.4+(i%6)*.13}s ease-in-out infinite`, animationDelay:`${i*.04}s` }} />
                ))}
            </div>

            {/* Content */}
            <div style={{ maxWidth:1440, margin:"0 auto", padding:`${isMobile ? 76 : 82}px 32px ${isMobile ? 24 : 28}px`, position:"relative", zIndex:2 }}>
                {/* Eyebrow */}
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                    <span style={{ width:24, height:2, background:"#00A98F", borderRadius:2, display:"block" }} />
                    <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", color:"#00A98F" }}>
                        {t.subtitle}
                    </span>
                </div>

                {/* Heading */}
                <h1 style={{
                    fontFamily: "'Be Vietnam Pro', sans-serif",
                    fontSize: isMobile ? "clamp(22px,6vw,28px)" : "clamp(24px,2.8vw,36px)",
                    fontWeight: 900,
                    lineHeight: 1.15,
                    letterSpacing: "-0.5px",
                    color: "#0D0D1A",
                    margin: 0,
                }}>
                    {t.title.split(" ").map((word, i, arr) =>
                        i === arr.length - 1
                            ? <span key={i} style={{ color:"#00A98F" }}>{word}</span>
                            : <span key={i}>{word}{" "}</span>
                    )}
                </h1>

                {/* Divider */}
                <div style={{ width:48, height:2, background:"linear-gradient(90deg,#00A98F,#34D4B8)", borderRadius:2, marginTop:14 }} />
            </div>
        </div>
    );
};

export default PageBannerSection;
