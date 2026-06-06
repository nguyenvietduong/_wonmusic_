'use client';
import { bannerSectionText } from "@/locales/contact/bannerSection";
import { useLanguageStore } from "@/stores/useLanguageStore";

const EQ_H = [38, 72, 52, 88, 44, 78, 58, 92, 46, 68, 55, 82, 40, 76, 62];

const PageBannerSection = () => {
    const { lang } = useLanguageStore();
    const t = bannerSectionText[lang];

    return (
        <div style={{ position:"relative", overflow:"hidden", background:"#F0F2FA" }}>
            <style>{`
                @keyframes ctVinyl { to { transform: translateY(-50%) rotate(360deg); } }
                @keyframes ctEq    { 0%,100%{transform:scaleY(.18)} 50%{transform:scaleY(1)} }
                @keyframes ctDot   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.25;transform:scale(.5)} }
                @keyframes ctFadeUp{ from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
                @keyframes ctPulse { 0%,100%{opacity:.55} 50%{opacity:.9} }
            `}</style>

            {/* ── Ambient glows ── */}
            <div style={{ position:"absolute", top:"20%", left:"8%",  width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(0,169,143,.09) 0%,transparent 65%)", pointerEvents:"none" }} />
            <div style={{ position:"absolute", top:"30%", right:"15%", width:360, height:360, borderRadius:"50%", background:"radial-gradient(circle,rgba(99,102,241,.06) 0%,transparent 65%)", pointerEvents:"none" }} />

            {/* ── Vinyl record – right side ── */}
            <div style={{
                position:"absolute", right:-80, top:"50%",
                width:460, height:460, borderRadius:"50%",
                animation:"ctVinyl 22s linear infinite",
                background:"conic-gradient(from 0deg,#D8DCF0,#C8CEE8 5%,#D8DCF0 10%,#C8CEE8 15%,#D8DCF0 20%,#C8CEE8 25%,#D8DCF0 30%,#C8CEE8 35%,#D8DCF0 40%,#C8CEE8 45%,#D8DCF0 50%,#C8CEE8 55%,#D8DCF0 60%,#C8CEE8 65%,#D8DCF0 70%,#C8CEE8 75%,#D8DCF0 80%,#C8CEE8 85%,#D8DCF0 90%,#C8CEE8 95%,#D8DCF0)",
                boxShadow:"inset 0 0 80px rgba(0,0,0,.06), 0 0 0 1px rgba(0,169,143,.1)",
                opacity:.65, pointerEvents:"none",
            }}>
                {[58, 90, 124, 158, 192].map(r => (
                    <div key={r} style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:r*2, height:r*2, borderRadius:"50%", border:"1px solid rgba(0,0,0,.08)" }} />
                ))}
                <div style={{
                    position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
                    width:124, height:124, borderRadius:"50%",
                    background:"linear-gradient(135deg,#E8EEF8,#F0F4FC)",
                    border:"1px solid rgba(0,169,143,.28)",
                    boxShadow:"0 0 40px rgba(0,169,143,.12)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    animation:"ctPulse 4s ease-in-out infinite",
                }}>
                    <div style={{ width:20, height:20, borderRadius:"50%", background:"#F0F2FA", border:"2px solid rgba(0,169,143,.4)" }} />
                </div>
            </div>

            {/* ── Right vignette ── */}
            <div style={{ position:"absolute", inset:0, background:"linear-gradient(to right, transparent 40%, rgba(240,242,250,.55) 100%)", pointerEvents:"none" }} />

            {/* ── EQ bars bottom ── */}
            <div style={{ position:"absolute", bottom:0, left:0, right:0, display:"flex", alignItems:"flex-end", height:48, opacity:.12, pointerEvents:"none" }}>
                {[...EQ_H, ...EQ_H, ...EQ_H, ...EQ_H].map((h, i) => (
                    <div key={i} style={{ flex:1, height:`${h}%`, background:"#34D4B8", borderRadius:"2px 2px 0 0", transformOrigin:"bottom", animation:`ctEq ${.4+(i%5)*.12}s ease-in-out infinite`, animationDelay:`${i*.035}s` }} />
                ))}
            </div>

            {/* ── Bottom fade to page ── */}
            <div style={{ position:"absolute", bottom:0, left:0, right:0, height:80, background:"linear-gradient(to bottom, transparent, #F8F8FC)", pointerEvents:"none" }} />

            {/* ── Content ── */}
            <div style={{ maxWidth:1440, margin:"0 auto", padding:"0 32px", position:"relative", zIndex:2, paddingTop:148, paddingBottom:72 }}>
                {/* Label */}
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:18, animation:"ctFadeUp .35s both" }}>
                    <span style={{ width:6, height:6, borderRadius:"50%", background:"#34D4B8", display:"inline-block", animation:"ctDot 1.6s ease-in-out infinite" }} />
                    <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:10, color:"#34D4B8", letterSpacing:"2.5px", textTransform:"uppercase", fontWeight:700 }}>
                        {t.subtitle}
                    </span>
                </div>

                {/* Heading */}
                <h1 style={{
                    fontFamily:"'Be Vietnam Pro',sans-serif",
                    fontSize:"clamp(48px,8vw,96px)",
                    fontWeight:700, lineHeight:.95, letterSpacing:-1,
                    color:"#0D0D1A", maxWidth:680,
                    animation:"ctFadeUp .4s .07s both",
                }}>
                    {t.title.split(" ").map((word, i, arr) =>
                        i === arr.length - 1
                            ? <span key={i} style={{ color:"#34D4B8" }}>{word}</span>
                            : <span key={i}>{word}{" "}</span>
                    )}
                </h1>

                {/* Teal divider line */}
                <div style={{ width:64, height:3, background:"linear-gradient(90deg,#00A98F,#34D4B8)", borderRadius:2, marginTop:28, animation:"ctFadeUp .4s .14s both" }} />
            </div>
        </div>
    );
};

export default PageBannerSection;
