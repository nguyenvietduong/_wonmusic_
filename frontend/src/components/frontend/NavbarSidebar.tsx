import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Home, Info,
    Phone, BarChart2, Users,
} from "lucide-react";
import type { NavbarSidebarProps } from "@/types/navbar";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { navbarText } from "@/locales/navbar";
import { usePlayerStore } from "@/stores/usePlayerStore";
import LanguageSwitcher from "./LanguageSwitcher";

const NOTES = ["♩","♪","♫","♬","𝄞","♭","♮"];

const NAV_ITEMS = [
    { to: "/",           labelKey: "home",    Icon: Home,      label: "Trang chủ"  },
    { to: "/artists",    labelKey: "artists", Icon: Users,     label: "Nghệ sĩ"    },
    { to: "/charts",     labelKey: "charts",  Icon: BarChart2, label: "BXH nhạc"   },
    { to: "/gioi-thieu", labelKey: "about",   Icon: Info,      label: "Giới thiệu" },
    { to: "/lien-he",    labelKey: "contact", Icon: Phone,     label: "Liên hệ"    },
] as const;

const EQ_HEIGHTS = [40, 70, 55, 85, 45, 75, 60];

const NavbarSidebar = ({ open, onOpenChange }: NavbarSidebarProps) => {
    const { pathname }          = useLocation();
    const { lang }              = useLanguageStore();
    const t                     = navbarText[lang];
    const notesBgRef            = useRef<HTMLDivElement>(null);
    const { currentTrack, isPlaying } = usePlayerStore();

    // ── Floating notes ──
    useEffect(() => {
        if (!open) return;
        const spawn = () => {
            if (!notesBgRef.current) return;
            const el = document.createElement("div");
            el.textContent = NOTES[Math.floor(Math.random() * NOTES.length)];
            const dur = 5 + Math.random() * 6;
            el.style.cssText = `
                position:absolute;
                left:${Math.random()*90}%;
                bottom:-20px;
                font-size:${12+Math.random()*12}px;
                color:rgba(74,222,128,${0.15+Math.random()*0.25});
                pointer-events:none; user-select:none;
                animation:sbNoteRise ${dur}s linear forwards;
                z-index:0;
            `;
            notesBgRef.current.appendChild(el);
            setTimeout(() => el.remove(), dur * 1000);
        };
        spawn();
        const id = setInterval(spawn, 700);
        return () => clearInterval(id);
    }, [open]);

    const getLabel = (item: typeof NAV_ITEMS[number]) => {
        if (item.labelKey && t[item.labelKey as keyof typeof t]) {
            return t[item.labelKey as keyof typeof t];
        }
        return item.label;
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="left"
                className="p-0 border-r border-white/10 flex flex-col"
                style={{
                    width: 280,
                    background: "linear-gradient(160deg,#052e16 0%,#0a3d1f 50%,#071a0d 100%)",
                    color: "#fff",
                    overflow: "hidden",
                }}
            >
                <style>{`
                    @keyframes sbNoteRise {
                        0%   { transform:translateY(0) rotate(0deg); opacity:0; }
                        10%  { opacity:1; }
                        90%  { opacity:.5; }
                        100% { transform:translateY(-400px) rotate(25deg); opacity:0; }
                    }
                    @keyframes sbEq {
                        0%,100% { transform:scaleY(.2); }
                        50%     { transform:scaleY(1); }
                    }
                    @keyframes sbDotPulse {
                        0%,100% { opacity:1; transform:scale(1); }
                        50%     { opacity:.3; transform:scale(.5); }
                    }
                    @keyframes sbFadeIn {
                        from { opacity:0; transform:translateX(-8px); }
                        to   { opacity:1; transform:translateX(0); }
                    }
                    @keyframes sbVinylSpin { to { transform:rotate(360deg); } }
                    @keyframes sbShimmer {
                        0%   { background-position:-200% center; }
                        100% { background-position: 200% center; }
                    }

                    .sb-nav-link {
                        display:flex; align-items:center; gap:12px;
                        padding:13px 20px;
                        font-size:13.5px; font-weight:600;
                        text-decoration:none; color:rgba(255,255,255,.65);
                        transition:all .2s; position:relative;
                        border-left:2px solid transparent;
                        animation:sbFadeIn .3s both;
                    }
                    .sb-nav-link:hover {
                        color:#fff;
                        background:rgba(74,222,128,.08);
                        border-left-color:rgba(74,222,128,.4);
                    }
                    .sb-nav-link.active {
                        color:#4ade80;
                        background:rgba(74,222,128,.1);
                        border-left-color:#4ade80;
                    }
                    .sb-nav-link .sb-icon {
                        width:32px; height:32px; border-radius:10px;
                        display:flex; align-items:center; justify-content:center;
                        background:rgba(255,255,255,.06);
                        transition:all .2s; flex-shrink:0;
                    }
                    .sb-nav-link:hover .sb-icon { background:rgba(74,222,128,.15); }
                    .sb-nav-link.active .sb-icon {
                        background:rgba(74,222,128,.2);
                        box-shadow:0 0 12px rgba(74,222,128,.3);
                    }
                `}</style>

                {/* ── Floating notes BG ── */}
                <div
                    ref={notesBgRef}
                    style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none", zIndex:0 }}
                />

                {/* ── Grid lines decoration ── */}
                <div style={{ position:"absolute", inset:0, pointerEvents:"none", opacity:.03, zIndex:0 }}>
                    {[0,1,2,3].map(i => (
                        <div key={i} style={{ position:"absolute", left:`${i*33}%`, top:0, bottom:0, width:1, background:"#4ade80" }} />
                    ))}
                </div>

                {/* ══════ HEADER ══════ */}
                <SheetHeader
                    className="shrink-0"
                    style={{
                        padding:"20px 20px 16px",
                        borderBottom:"1px solid rgba(74,222,128,.12)",
                        position:"relative", zIndex:1,
                    }}
                >
                    {/* Logo + title */}
                    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                        {/* Vinyl mini */}
                        <div style={{
                            width:36, height:36, borderRadius:"50%",
                            background:"conic-gradient(from 0deg,#052e16,#16a34a,#1a3d2a,#052e16)",
                            border:"2px solid rgba(74,222,128,.3)",
                            display:"flex", alignItems:"center", justifyContent:"center",
                            animation:"sbVinylSpin 4s linear infinite",
                            flexShrink:0,
                        }}>
                            <div style={{ width:12, height:12, borderRadius:"50%", background:"#16a34a", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                <div style={{ width:4, height:4, borderRadius:"50%", background:"#052e16" }} />
                            </div>
                        </div>
                        <SheetTitle style={{ color:"#fff", fontSize:17, fontWeight:700, letterSpacing:-.3, margin:0 }}>
                            Won <span style={{ color:"#4ade80" }}>Music</span>
                        </SheetTitle>
                    </div>

                    {/* Equalizer bars */}
                    <div style={{ display:"flex", alignItems:"flex-end", gap:2.5, height:24 }}>
                        {EQ_HEIGHTS.map((h, i) => (
                            <div key={i} style={{
                                width:4, height:`${h}%`,
                                background:`rgba(74,222,128,${.3+i*.05})`,
                                borderRadius:2, transformOrigin:"bottom",
                                animation:`sbEq ${.38+(i%5)*.13}s ease-in-out infinite`,
                                animationDelay:`${i*.07}s`,
                            }} />
                        ))}
                        <span style={{ fontSize:11, color:"rgba(255,255,255,.35)", marginLeft:6, letterSpacing:"1.5px", textTransform:"uppercase", alignSelf:"center" }}>
                            Menu
                        </span>
                    </div>
                </SheetHeader>

                {/* ══════ NAV ══════ */}
                <ScrollArea className="flex-1" style={{ position:"relative", zIndex:1 }}>
                    <div style={{ padding:"8px 0" }}>
                        {/* Section label */}
                        <div style={{ padding:"8px 20px 4px", fontSize:10, color:"rgba(255,255,255,.25)", letterSpacing:"2px", textTransform:"uppercase", fontWeight:600 }}>
                            {t.navigation}
                        </div>

                        {NAV_ITEMS.map(({ to, Icon }, idx) => {
                            const item    = NAV_ITEMS[idx];
                            const isActive = pathname === to;
                            const label   = getLabel(item);
                            return (
                                <Link
                                    key={to}
                                    to={to}
                                    onClick={() => onOpenChange(false)}
                                    className={cn("sb-nav-link", isActive && "active")}
                                    style={{ animationDelay:`${idx*.06}s` }}
                                >
                                    <div className="sb-icon">
                                        <Icon size={15} color={isActive ? "#4ade80" : "rgba(255,255,255,0.5)"} />
                                    </div>
                                    <span style={{ flex:1 }}>{label}</span>
                                    {isActive && (
                                        <span style={{ width:5, height:5, borderRadius:"50%", background:"#4ade80", animation:"sbDotPulse 1.5s ease-in-out infinite" }} />
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* ── Now Playing mini ── */}
                    {currentTrack && (
                        <div style={{
                            margin:"16px 12px 4px",
                            padding:"12px 14px",
                            background:"rgba(74,222,128,.07)",
                            border:"1px solid rgba(74,222,128,.15)",
                            borderRadius:14,
                        }}>
                            <div style={{ fontSize:10, color:"rgba(74,222,128,.7)", letterSpacing:"1.5px", textTransform:"uppercase", fontWeight:600, marginBottom:8 }}>
                                {isPlaying ? t.nowPlaying : t.paused}
                            </div>
                            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                {/* Cover */}
                                <div style={{
                                    width:36, height:36, borderRadius:8, overflow:"hidden", flexShrink:0,
                                    background:"linear-gradient(135deg,#dcfce7,#86efac)",
                                    border: isPlaying ? "1.5px solid rgba(74,222,128,.4)" : "none",
                                }}>
                                    {currentTrack.coverUrl
                                        ? <img src={currentTrack.coverUrl} alt={currentTrack.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                                        : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, color:"#16a34a" }}>♪</div>
                                    }
                                </div>
                                <div style={{ flex:1, minWidth:0 }}>
                                    <p style={{ fontSize:12, fontWeight:600, color:"#fff", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                                        {currentTrack.title}
                                    </p>
                                    <p style={{ fontSize:11, color:"rgba(255,255,255,.45)", marginTop:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                                        {currentTrack.artist}
                                    </p>
                                </div>
                                {/* Mini EQ */}
                                {isPlaying && (
                                    <div style={{ display:"flex", alignItems:"flex-end", gap:1.5, height:16, flexShrink:0 }}>
                                        {[40,70,50,85,55].map((h,i) => (
                                            <div key={i} style={{
                                                width:2.5, height:`${h}%`, background:"#4ade80",
                                                borderRadius:1.5, transformOrigin:"bottom",
                                                animation:`sbEq ${.4+i*.1}s ease-in-out infinite`,
                                                animationDelay:`${i*.07}s`,
                                            }} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Footer ── */}
                    <div style={{ padding:"16px 20px 24px", marginTop:8 }}>
                        {/* Divider */}
                        <div style={{ height:1, background:"rgba(74,222,128,.1)", marginBottom:16 }} />

                        {/* Language switcher */}
                        <div style={{ marginBottom:14 }}>
                            <LanguageSwitcher />
                        </div>

                        {/* Social links */}
                        <div style={{ display:"flex", gap:8, marginBottom:14 }}>
                            {[
                                { icon:"🌐", label:"Facebook", href:"https://web.facebook.com/wonmediavn" },
                                { icon:"▶",  label:"YouTube",  href:"#" },
                                { icon:"♪",  label:"TikTok",   href:"#" },
                            ].map(({ icon, label, href }) => (
                                <a key={label} href={href} target="_blank" rel="noreferrer" style={{
                                    flex:1, padding:"7px 0", borderRadius:10,
                                    background:"rgba(255,255,255,.05)",
                                    border:"1px solid rgba(255,255,255,.08)",
                                    color:"rgba(255,255,255,.5)", fontSize:12,
                                    textDecoration:"none", textAlign:"center",
                                    transition:"all .2s",
                                }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background="rgba(74,222,128,.1)"; (e.currentTarget as HTMLAnchorElement).style.borderColor="rgba(74,222,128,.3)"; (e.currentTarget as HTMLAnchorElement).style.color="#4ade80"; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background="rgba(255,255,255,.05)"; (e.currentTarget as HTMLAnchorElement).style.borderColor="rgba(255,255,255,.08)"; (e.currentTarget as HTMLAnchorElement).style.color="rgba(255,255,255,.5)"; }}
                                >
                                    {icon}
                                </a>
                            ))}
                        </div>

                        {/* Copyright */}
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                            <div style={{ display:"flex", alignItems:"flex-end", gap:1, height:10 }}>
                                {[3,5,4,6,3].map((h,i) => (
                                    <div key={i} style={{ width:2, height:`${h*2}px`, background:"rgba(74,222,128,.3)", borderRadius:1, transformOrigin:"bottom", animation:`sbEq ${.4+i*.1}s ease-in-out infinite`, animationDelay:`${i*.08}s` }} />
                                ))}
                            </div>
                            <span style={{ fontSize:10, color:"rgba(255,255,255,.2)", letterSpacing:"2px", textTransform:"uppercase" }}>
                                © 2024 Won Music
                            </span>
                            <div style={{ display:"flex", alignItems:"flex-end", gap:1, height:10 }}>
                                {[3,5,4,6,3].map((h,i) => (
                                    <div key={i} style={{ width:2, height:`${h*2}px`, background:"rgba(74,222,128,.3)", borderRadius:1, transformOrigin:"bottom", animation:`sbEq ${.4+i*.1}s ease-in-out infinite`, animationDelay:`${i*.08+.3}s` }} />
                                ))}
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
};

export default NavbarSidebar;