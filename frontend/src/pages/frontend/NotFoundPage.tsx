'use client';
import Link from "next/link";
import SEO from "@/components/frontend/SEO";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguageStore } from "@/stores/useLanguageStore";

const EQ_H = [22, 38, 28, 50, 35, 60, 42, 72, 30, 55, 65, 28, 48, 38, 70, 32, 52, 42, 62, 36];

export default function NotFoundPage() {
    const isMobile = useIsMobile();
    const { lang } = useLanguageStore();
    const isEn = lang === "en";

    return (
        <>
        <SEO
            title="404 – Không Tìm Thấy | Won Music"
            description="Trang bạn tìm kiếm không tồn tại. Quay lại trang chủ Won Music."
            canonical="https://www.wonmusic.vn/404"
            robots="noindex, nofollow"
        />

        <div style={{
            height: "100vh",
            overflow: "hidden",
            position: "relative",
            fontFamily: "'Be Vietnam Pro', sans-serif",
            color: "#0D0D1A",
            backgroundImage: "url('/partner-bg.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
        }}>
            <style>{`
                @keyframes nf-fadeup { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
                @keyframes nf-eq     { 0%,100%{transform:scaleY(.2)} 50%{transform:scaleY(1)} }

                .nf-btn-primary {
                    display:inline-flex; align-items:center; gap:8px;
                    padding:11px 26px; border-radius:10px;
                    background:linear-gradient(135deg,#00A98F,#34D4B8);
                    color:#fff; text-decoration:none;
                    font-family:'Space Grotesk',sans-serif;
                    font-size:13px; font-weight:700; letter-spacing:0.5px;
                    transition:all .2s; border:none; cursor:pointer;
                }
                .nf-btn-primary:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(0,169,143,.3); }

                .nf-btn-ghost {
                    display:inline-flex; align-items:center; gap:8px;
                    padding:10px 20px; border-radius:10px;
                    border:1px solid rgba(0,0,0,.12);
                    color:rgba(0,0,0,.55); text-decoration:none;
                    font-family:'Space Grotesk',sans-serif;
                    font-size:13px; font-weight:600;
                    background:rgba(255,255,255,.45);
                    backdrop-filter:blur(8px);
                    transition:all .2s;
                }
                .nf-btn-ghost:hover {
                    border-color:rgba(0,169,143,.45); color:#00A98F;
                    background:rgba(0,169,143,.07); transform:translateY(-2px);
                }
            `}</style>

            {/* Teal glow top-right */}
            <div style={{ position:"absolute", top:"-15%", right:"-5%", width:520, height:520, borderRadius:"50%", background:"radial-gradient(circle,rgba(0,169,143,0.12),transparent 65%)", pointerEvents:"none" }} />

            {/* EQ bars bottom */}
            <div style={{ position:"absolute", bottom:0, left:0, right:0, display:"flex", alignItems:"flex-end", gap:2, height: isMobile ? 28 : 40, opacity:.13, pointerEvents:"none" }}>
                {EQ_H.map((h, i) => (
                    <div key={i} style={{ flex:1, height:`${h}%`, background:"#00A98F", borderRadius:"2px 2px 0 0" }} />
                ))}
            </div>

            {/* ── Content ── */}
            <div style={{ textAlign:"center", maxWidth:480, width:"100%", padding:"0 24px", position:"relative", zIndex:2 }}>

                {/* Eyebrow */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:16, animation:"nf-fadeup .35s both" }}>
                    <span style={{ width:24, height:2, background:"#00A98F", borderRadius:2, display:"block" }} />
                    <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", color:"#00A98F" }}>
                        Won Music · {isEn ? "Error" : "Lỗi"}
                    </span>
                    <span style={{ width:24, height:2, background:"#00A98F", borderRadius:2, display:"block" }} />
                </div>

                {/* 404 */}
                <div style={{
                    fontFamily: "'Be Vietnam Pro', sans-serif",
                    fontSize: isMobile ? "clamp(80px,22vw,120px)" : "clamp(100px,16vw,160px)",
                    fontWeight: 800,
                    lineHeight: 1,
                    letterSpacing: "-4px",
                    color: "transparent",
                    WebkitTextStroke: "2px rgba(0,169,143,0.3)",
                    marginBottom: 6,
                    animation: "nf-fadeup .4s .04s both",
                    userSelect: "none",
                }}>
                    404
                </div>

                {/* Mini EQ */}
                <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"center", gap:3, height:20, marginBottom:20, animation:"nf-fadeup .4s .07s both" }}>
                    {[40,65,50,80,55,70,45,85,60,75].map((h, i) => (
                        <div key={i} style={{
                            width:4, height:`${h}%`,
                            background: i % 3 === 0 ? "rgba(0,169,143,.25)" : "linear-gradient(to top,#00A98F,#34D4B8)",
                            borderRadius:2, transformOrigin:"bottom",
                            animation:`nf-eq ${.4+i*.1}s ease-in-out infinite`,
                            animationDelay:`${i*.07}s`,
                            opacity: i % 3 === 0 ? 0.4 : 1,
                        }} />
                    ))}
                </div>

                {/* Title */}
                <h1 style={{
                    fontFamily: "'Be Vietnam Pro', sans-serif",
                    fontSize: isMobile ? 20 : 24,
                    fontWeight: 700,
                    color: "#0D0D1A",
                    margin: "0 0 10px",
                    textTransform: "uppercase",
                    letterSpacing: "-0.3px",
                    animation: "nf-fadeup .4s .1s both",
                }}>
                    {isEn ? "Page " : "Trang "}
                    <span style={{ color: "#00A98F" }}>{isEn ? "Not Found" : "Không Tồn Tại"}</span>
                </h1>

                {/* Divider */}
                <div style={{ width:48, height:2, background:"linear-gradient(90deg,#00A98F,#34D4B8)", borderRadius:2, margin:"0 auto 16px", animation:"nf-fadeup .4s .12s both" }} />

                {/* Description */}
                <p style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 13,
                    color: "rgba(0,0,0,.5)",
                    lineHeight: 1.7,
                    marginBottom: 28,
                    animation: "nf-fadeup .4s .14s both",
                }}>
                    {isEn
                        ? "The page you're looking for doesn't exist — it may have been removed or the link is incorrect."
                        : "Trang bạn tìm không tồn tại — có thể đã bị xóa hoặc đường dẫn không đúng."}
                </p>

                {/* Buttons */}
                <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap", animation:"nf-fadeup .4s .17s both" }}>
                    <Link href="/" className="nf-btn-primary">
                        ♪ {isEn ? "Back to Home" : "Về trang chủ"}
                    </Link>
                    <Link href="/charts" className="nf-btn-ghost">
                        🎵 {isEn ? "Charts" : "Bảng xếp hạng"}
                    </Link>
                    <Link href="/artists" className="nf-btn-ghost">
                        🎤 {isEn ? "Artists" : "Nghệ sĩ"}
                    </Link>
                </div>

                {/* Footer note */}
                <div style={{ marginTop:36, animation:"nf-fadeup .4s .2s both" }}>
                    <span style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: 10,
                        color: "rgba(0,0,0,.25)",
                        letterSpacing: "2.5px",
                        textTransform: "uppercase",
                    }}>
                        Won Music · HTTP 404
                    </span>
                </div>
            </div>
        </div>
        </>
    );
}
