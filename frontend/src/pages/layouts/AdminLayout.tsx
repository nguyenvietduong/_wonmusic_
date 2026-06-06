// src/pages/layouts/AdminLayout.tsx
'use client'
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard, Music, Users,
    BarChart2, ChevronLeft,
    ChevronRight, Bell, Search, Settings,
} from "lucide-react";

const NAV_ITEMS = [
    { to:"/admin",           icon:LayoutDashboard, label:"Dashboard"   },
    { to:"/admin/tracks",    icon:Music,           label:"Bài hát"     },
    { to:"/admin/artists",   icon:Users,           label:"Nghệ sĩ"     },
    { to:"/admin/charts",    icon:BarChart2,       label:"Thống kê"    },
    { to:"/admin/settings",  icon:Settings,        label:"Cài đặt"     },
];

const EQ = [40,70,55,85,45,75,60];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [collapsed,  setCollapsed]  = useState(false);
    const [searchVal,  setSearchVal]  = useState("");

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 font-sans">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
                @keyframes adEq    { 0%,100%{transform:scaleY(.2)} 50%{transform:scaleY(1)} }
                @keyframes adVinyl { to{transform:rotate(360deg)} }
                @keyframes adDot   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(.5)} }
                @keyframes adFadeIn{ from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
                .ad-vinyl { animation: adVinyl 4s linear infinite; }
                .ad-eq-bar { transform-origin: bottom; animation: adEq var(--dur, .5s) ease-in-out infinite; }
                .ad-dot    { animation: adDot 1.5s ease-in-out infinite; }
                .ad-fade   { animation: adFadeIn .3s both; }
            `}</style>

            {/* ══════ SIDEBAR ══════ */}
            <aside
                className={`
                    relative flex flex-col flex-shrink-0 h-full bg-[#111827] border-r border-white/10
                    transition-all duration-[250ms] ease-[cubic-bezier(.4,0,.2,1)] z-10
                    ${collapsed ? "w-16" : "w-60"}
                `}
            >
                {/* Logo */}
                <div className="flex-shrink-0 px-4 pt-5 pb-4 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                        {/* Vinyl */}
                        <div
                            className="ad-vinyl w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center border-2 border-green-400/20"
                            style={{ background:"conic-gradient(from 0deg,#185e2a,#19d56c,#299d6a,#185e2a)" }}
                        >
                            <div className="w-3 h-3 rounded-full bg-green-700 flex items-center justify-center">
                                <div className="w-1 h-1 rounded-full bg-[#174629]" />
                            </div>
                        </div>
                        {!collapsed && (
                            <div>
                                <div className="font-['Barlow_Condensed'] text-[18px] text-white tracking-widest leading-none">
                                    Won <span className="text-green-400">Music</span>
                                </div>
                                <div className="text-[10px] text-white/30 tracking-[1.5px] uppercase mt-0.5">
                                    Admin Panel
                                </div>
                            </div>
                        )}
                    </div>

                    {/* EQ mini */}
                    {!collapsed && (
                        <div className="flex items-end gap-0.5 h-3.5 mt-3">
                            {EQ.map((h, i) => (
                                <div
                                    key={i}
                                    className="ad-eq-bar w-[3px] rounded-sm bg-green-400/50"
                                    style={{
                                        height: `${h}%`,
                                        "--dur": `${.38 + (i % 5) * .13}s`,
                                        animationDelay: `${i * .07}s`,
                                    } as React.CSSProperties}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 px-2.5 py-3 overflow-y-auto overflow-x-hidden">
                    {!collapsed && (
                        <div className="text-[10px] text-white/20 tracking-[2px] uppercase px-1.5 pb-2 font-semibold">
                            Quản lý
                        </div>
                    )}
                    {NAV_ITEMS.map(({ to, icon:Icon, label }, idx) => {
                        const isActive = pathname === to;
                        return (
                            <Link
                                key={to}
                                href={to}
                                title={collapsed ? label : undefined}
                                className={`
                                    ad-fade flex items-center gap-3 px-3 py-2.5 mb-1 rounded-lg
                                    transition-all duration-200 cursor-pointer text-sm whitespace-nowrap overflow-hidden
                                    ${isActive
                                        ? "bg-indigo-600 text-white"
                                        : "text-white/60 hover:bg-white/10 hover:text-white"
                                    }
                                    ${collapsed ? "justify-center" : ""}
                                `}
                                style={{ animationDelay: `${idx * .05}s` }}
                            >
                                {/* Icon wrapper */}
                                <div
                                    className={`
                                        w-8 h-8 rounded-[9px] flex-shrink-0 flex items-center justify-center transition-all duration-200
                                        ${isActive ? "bg-white/20" : "bg-white/[0.065]"}
                                    `}
                                >
                                    <Icon size={15} className={isActive ? "text-white" : "text-white/55"} />
                                </div>

                                {!collapsed && (
                                    <span className={`text-[13.5px] ${isActive ? "font-semibold" : "font-normal"}`}>
                                        {label}
                                    </span>
                                )}

                                {!collapsed && isActive && (
                                    <span className="ad-dot ml-auto w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Collapse toggle */}
                <button
                    onClick={() => setCollapsed(v => !v)}
                    className="
                        absolute top-1/2 -right-3 -translate-y-1/2
                        w-6 h-6 rounded-full bg-indigo-600 border-2 border-gray-50
                        text-white flex items-center justify-center
                        cursor-pointer z-20 transition-all duration-200
                        hover:bg-indigo-700
                    "
                >
                    {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
                </button>
            </aside>

            {/* ══════ MAIN ══════ */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* Topbar */}
                <header className="h-14 flex-shrink-0 bg-white border-b border-gray-200 flex items-center px-6 gap-4">
                    {/* Search */}
                    <div className="flex-1 max-w-sm relative">
                        <Search
                            size={14}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                        <input
                            type="text"
                            placeholder="Tìm kiếm..."
                            value={searchVal}
                            onChange={e => setSearchVal(e.target.value)}
                            className="
                                w-full pl-9 pr-4 py-2 text-[13px] text-gray-700
                                bg-white border border-gray-300 rounded-full
                                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                                placeholder:text-gray-400 transition-all duration-200
                            "
                        />
                    </div>

                    <div className="ml-auto flex items-center gap-3">
                        {/* Bell */}
                        <button className="relative w-9 h-9 rounded-full bg-gray-100 border border-gray-200 text-gray-500 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                            <Bell size={15} />
                            <span className="ad-dot absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-600" />
                        </button>

                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-[13px] font-bold text-white cursor-pointer">
                            A
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    {children}
                </main>
            </div>
        </div>
    );
}
