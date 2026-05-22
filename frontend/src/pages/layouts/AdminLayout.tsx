// src/pages/layouts/AdminLayout.tsx
import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router";
import {
    LayoutDashboard, Music, Users,
    BarChart2, ChevronLeft,
    ChevronRight, Bell, Search,
} from "lucide-react";

const NAV_ITEMS = [
    { to:"/admin",          icon:LayoutDashboard, label:"Dashboard"   },
    { to:"/admin/tracks",   icon:Music,           label:"Bài hát"     },
    { to:"/admin/artists",  icon:Users,           label:"Nghệ sĩ"     },
    { to:"/admin/charts",   icon:BarChart2,       label:"Thống kê"    },
];

const EQ = [40,70,55,85,45,75,60];

export default function AdminLayout() {
    const { pathname } = useLocation();
    const [collapsed,  setCollapsed]  = useState(false);
    const [searchVal,  setSearchVal]  = useState("");

    // Màu sáng hơn một chút so với bản gốc, nhưng không quá sáng như bản trước
    const MAIN_BG = "#18291e"; // Đổi màu nền chính  
    const SIDEBAR_BG = "linear-gradient(160deg,#193824 0%,#174629 100%)"; // Sáng hơn mà vẫn tông xanh lá
    const TITLE_COLOR = "#e6f9ee";
    const NAV_ICON_ACTIVE = "#4ade80";
    const NAV_ICON = "rgba(255,255,255,0.55)";
    const NAV_BG_HOVER = "rgba(74,222,128,0.11)";
    const NAV_BG_ACTIVE = "rgba(74,222,128,0.16)";
    const NAV_BORDER = "rgba(74,222,128,0.13)";
    const TOPBAR_BG = "rgba(35, 51, 39, .86)";
    const SEARCH_BG = "rgba(255,255,255,.07)";
    const SEARCH_BORDER = "rgba(255,255,255,.13)";
    const AVATAR_BG = "linear-gradient(135deg,#16a34a,#4ade80)";

    return (
        <div style={{
            display:"flex", minHeight:"100vh",
            background: MAIN_BG,
            fontFamily:"'Be Vietnam Pro',sans-serif",
            color: TITLE_COLOR,
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
                @keyframes adEq { 0%,100%{transform:scaleY(.2)} 50%{transform:scaleY(1)} }
                @keyframes adDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(.5)} }
                @keyframes adFadeIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
                @keyframes adVinyl  { to{transform:rotate(360deg)} }

                .ad-nav-link {
                    display:flex; align-items:center; gap:12px;
                    padding:11px 16px; border-radius:12px;
                    text-decoration:none; color:rgba(255,255,255,0.62);
                    transition:all .2s; cursor:pointer;
                    border:1px solid transparent;
                    white-space:nowrap; overflow:hidden;
                    animation:adFadeIn .3s both;
                }
                .ad-nav-link:hover {
                    background:${NAV_BG_HOVER};
                    color:rgba(255,255,255,.93);
                    border-color:${NAV_BORDER};
                }
                .ad-nav-link.active {
                    background:${NAV_BG_ACTIVE};
                    color:${NAV_ICON_ACTIVE};
                    border-color:rgba(74,222,128,.18);
                }
                .ad-nav-link .ad-icon {
                    width:32px; height:32px; border-radius:9px;
                    display:flex; align-items:center; justify-content:center;
                    background:rgba(255,255,255,.065); flex-shrink:0;
                    transition:all .2s;
                }
                .ad-nav-link:hover .ad-icon  { background:rgba(74,222,128,.13); }
                .ad-nav-link.active .ad-icon  { background:rgba(74,222,128,.20); box-shadow:0 0 12px rgba(74,222,128,.14); }

                .ad-search {
                    width:100%; background:${SEARCH_BG};
                    border:1px solid ${SEARCH_BORDER};
                    border-radius:100px; outline:none;
                    padding:9px 16px 9px 38px;
                    font-size:13px; color:#f1fff5;
                    font-family:'Be Vietnam Pro',sans-serif;
                    transition:all .2s;
                }
                .ad-search:focus {
                    border-color:rgba(74,222,128,.34);
                    background:rgba(74,222,128,.09);
                    box-shadow:0 0 0 3px rgba(74,222,128,.11);
                }
                .ad-search::placeholder { color:rgba(255,255,255,.22); }
            `}</style>

            {/* ══════ SIDEBAR ══════ */}
            <aside style={{
                width: collapsed ? 68 : 240,
                flexShrink:0,
                background: SIDEBAR_BG,
                borderRight:`1px solid ${NAV_BORDER}`,
                display:"flex", flexDirection:"column",
                transition:"width .25s cubic-bezier(.4,0,.2,1)",
                position:"relative", zIndex:10,
            }}>
                {/* Logo */}
                <div style={{ padding:"20px 16px 16px", borderBottom:`1px solid ${NAV_BORDER}`, flexShrink:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        {/* Vinyl */}
                        <div style={{
                            width:36, height:36, borderRadius:"50%", flexShrink:0,
                            background:"conic-gradient(from 0deg,#185e2a,#19d56c,#299d6a,#185e2a)", // Sáng hơn một chút nhưng vẫn giữ chất dark green
                            border:"2px solid rgba(74,222,128,.23)",
                            display:"flex", alignItems:"center", justifyContent:"center",
                            animation:"adVinyl 4s linear infinite",
                        }}>
                            <div style={{ width:12, height:12, borderRadius:"50%", background:"#16a34a", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                <div style={{ width:4, height:4, borderRadius:"50%", background:"#174629" }} />
                            </div>
                        </div>
                        {!collapsed && (
                            <div>
                                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, color:"#fff", letterSpacing:1.5, lineHeight:1 }}>
                                    Won <span style={{ color:NAV_ICON_ACTIVE }}>Music</span>
                                </div>
                                <div style={{ fontSize:10, color:"rgba(255,255,255,.32)", letterSpacing:"1.5px", textTransform:"uppercase" }}>
                                    Admin Panel
                                </div>
                            </div>
                        )}
                    </div>

                    {/* EQ mini */}
                    {!collapsed && (
                        <div style={{ display:"flex", alignItems:"flex-end", gap:2, height:14, marginTop:12 }}>
                            {EQ.map((h,i) => (
                                <div key={i} style={{
                                    width:3, height:`${h}%`, background:`rgba(74,222,128,${.2+i*.05})`,
                                    borderRadius:2, transformOrigin:"bottom",
                                    animation:`adEq ${.38+(i%5)*.13}s ease-in-out infinite`,
                                    animationDelay:`${i*.07}s`,
                                }} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Nav */}
                <nav style={{ flex:1, padding:"12px 10px", overflowY:"auto", overflowX:"hidden" }}>
                    {!collapsed && (
                        <div style={{ fontSize:10, color:"rgba(255,255,255,.20)", letterSpacing:"2px", textTransform:"uppercase", padding:"4px 6px 8px", fontWeight:600 }}>
                            Quản lý
                        </div>
                    )}
                    {NAV_ITEMS.map(({ to, icon:Icon, label }, idx) => {
                        const isActive = pathname === to;
                        return (
                            <Link
                                key={to}
                                to={to}
                                className={`ad-nav-link ${isActive?"active":""}`}
                                style={{ animationDelay:`${idx*.05}s`, marginBottom:4, justifyContent:collapsed?"center":"flex-start" }}
                                title={collapsed ? label : undefined}
                            >
                                <div className="ad-icon">
                                    <Icon size={15} color={isActive?NAV_ICON_ACTIVE:NAV_ICON} />
                                </div>
                                {!collapsed && (
                                    <span style={{ fontSize:13.5, fontWeight:isActive?600:400 }}>{label}</span>
                                )}
                                {!collapsed && isActive && (
                                    <span style={{ marginLeft:"auto", width:5, height:5, borderRadius:"50%", background:NAV_ICON_ACTIVE, animation:"adDot 1.5s ease-in-out infinite", flexShrink:0 }} />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Collapse toggle */}
                <button
                    onClick={() => setCollapsed(v => !v)}
                    style={{
                        position:"absolute", top:"50%", right:-12,
                        transform:"translateY(-50%)",
                        width:24, height:24, borderRadius:"50%",
                        background:NAV_ICON_ACTIVE, border:`2px solid ${MAIN_BG}`,
                        color:"#fff", display:"flex", alignItems:"center", justifyContent:"center",
                        cursor:"pointer", zIndex:20, transition:"all .2s",
                    }}
                >
                    {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
                </button>
            </aside>

            {/* ══════ MAIN ══════ */}
            <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

                {/* Topbar */}
                <header style={{
                    height:60, flexShrink:0,
                    background: TOPBAR_BG,
                    backdropFilter:"blur(12px)",
                    borderBottom:`1px solid ${NAV_BORDER}`,
                    display:"flex", alignItems:"center",
                    padding:"0 24px", gap:16,
                }}>
                    {/* Search */}
                    <div style={{ flex:1, maxWidth:400, position:"relative" }}>
                        <Search size={14} style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,.23)" }} />
                        <input
                            className="ad-search"
                            placeholder="Tìm kiếm..."
                            value={searchVal}
                            onChange={e => setSearchVal(e.target.value)}
                        />
                    </div>

                    <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:12 }}>
                        {/* Bell */}
                        <button style={{
                            width:36, height:36, borderRadius:"50%",
                            background:"rgba(74,222,128,0.11)",
                            border:"1px solid rgba(74,222,128,.11)",
                            color:"rgba(255,255,255,0.62)", display:"flex",
                            alignItems:"center", justifyContent:"center",
                            cursor:"pointer", position:"relative",
                            transition:"all .2s",
                        }}>
                            <Bell size={15} />
                            <span style={{
                                position:"absolute", top:6, right:6,
                                width:7, height:7, borderRadius:"50%",
                                background:NAV_ICON_ACTIVE, border:`2px solid ${MAIN_BG}`,
                                animation:"adDot 1.5s ease-in-out infinite",
                            }} />
                        </button>

                        {/* Avatar */}
                        <div style={{
                            width:36, height:36, borderRadius:"50%",
                            background: AVATAR_BG,
                            display:"flex", alignItems:"center", justifyContent:"center",
                            fontSize:13, fontWeight:700, color:"#052e16",
                            cursor:"pointer",
                        }}>
                            A
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main style={{ flex:1, overflowY:"auto", padding:"24px" }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}