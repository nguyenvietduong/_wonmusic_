// src/pages/admin/AdminHomePage.tsx
import { useEffect, useState }              from "react";
import { Link }                             from "react-router";
import { Music, Users, TrendingUp, Play }   from "lucide-react";
import { trackService }                     from "@/services/trackService";
import { artistService }                    from "@/services/artistService";

const formatNum = (n: number) => {
    if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `${(n/1_000).toFixed(1)}K`;
    return n.toString();
};
const formatTime = (sec: number) =>
    `${Math.floor(sec/60)}:${String(Math.floor(sec%60)).padStart(2,"0")}`;

const EQ_H = [40,70,55,85,45,75,60,90,50,65];

export default function AdminHomePage() {
    const [tracks,  setTracks]  = useState<any[]>([]);
    const [artists, setArtists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const [t, a] = await Promise.all([
                    trackService.getTop(10),
                    artistService.getAll({ limit:6 }),
                ]);
                setTracks(t);
                setArtists(a.data);
            } catch {
                setError(true);
            } finally { setLoading(false); }
        })();
    }, []);

    const totalPlays = tracks.reduce((s, t) => s + (t.plays ?? 0), 0);

    const STATS = [
        { label:"Tổng bài hát",  value: tracks.length,                          icon:Music,         color:"#4ade80", bg:"rgba(74,222,128,.1)"  },
        { label:"Nghệ sĩ",       value: artists.length,                         icon:Users,         color:"#60a5fa", bg:"rgba(96,165,250,.1)"  },
        { label:"Lượt nghe",     value: formatNum(totalPlays), icon:Play,                           color:"#f472b6", bg:"rgba(244,114,182,.1)" },
        { label:"Đang hoạt động",value: artists.filter(a=>a.verified).length,   icon:TrendingUp,    color:"#fb923c", bg:"rgba(251,146,60,.1)" },
    ];

    if (error) return (
        <div style={{ fontFamily: "'Be Vietnam Pro',sans-serif", padding: "60px 0", textAlign: "center" }}>
            <p style={{ color: "#f87171", fontSize: 14, marginBottom: 12 }}>Không thể tải dữ liệu dashboard.</p>
            <button
                onClick={() => window.location.reload()}
                style={{ padding: "8px 20px", borderRadius: 10, background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.2)", color: "#f87171", fontSize: 13, cursor: "pointer" }}
            >
                Thử lại
            </button>
        </div>
    );

    return (
        <div style={{ fontFamily: "'Be Vietnam Pro',sans-serif" }}>
            <style>{`
                @keyframes ahEq    { 0%,100%{transform:scaleY(.2)} 50%{transform:scaleY(1)} }
                @keyframes ahFadeUp{ from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
                @keyframes ahPulse { 0%,100%{opacity:.5} 50%{opacity:1} }
                @keyframes ahBar   { from{width:0} to{width:var(--w)} }

                .ah-stat-card {
                    padding:20px 22px; border-radius:16px;
                    border:1px solid rgba(255,255,255,.07);
                    background:rgba(255,255,255,.03);
                    transition:all .25s; animation:ahFadeUp .4s both;
                    cursor:default;
                }
                .ah-stat-card:hover {
                    background:rgba(255,255,255,.06);
                    border-color:rgba(74,222,128,.2);
                    transform:translateY(-4px);
                }
                .ah-track-row {
                    display:flex; align-items:center; gap:14px;
                    padding:10px 14px; border-radius:12px;
                    transition:all .2s; cursor:pointer;
                    border:1px solid transparent;
                    animation:ahFadeUp .35s both;
                }
                .ah-track-row:hover {
                    background:rgba(74,222,128,.06);
                    border-color:rgba(74,222,128,.12);
                }
                .ah-artist-card {
                    padding:16px; border-radius:14px;
                    border:1px solid rgba(255,255,255,.07);
                    background:rgba(255,255,255,.03);
                    text-align:center; transition:all .25s;
                    text-decoration:none; color:inherit;
                    display:block; animation:ahFadeUp .4s both;
                }
                .ah-artist-card:hover {
                    background:rgba(255,255,255,.06);
                    border-color:rgba(74,222,128,.2);
                    transform:translateY(-4px);
                }
            `}</style>

            {/* ── Header ── */}
            <div style={{ marginBottom:28, animation:"ahFadeUp .3s both" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                    <span style={{ width:5, height:5, borderRadius:"50%", background:"#4ade80", display:"inline-block" }} />
                    <span style={{ fontSize:11, color:"#4ade80", letterSpacing:"2px", textTransform:"uppercase", fontWeight:600 }}>
                        Won Music Admin
                    </span>
                </div>
                <h1 style={{ fontSize:40, color:"#fff", letterSpacing: 1, marginBottom: 4, lineHeight:1 }}>
                    Dashboard
                </h1>
                <p style={{ fontSize:13, color:"rgba(255,255,255,.4)" }}>
                    Tổng quan hệ thống Won Music
                </p>

                {/* EQ decoration */}
                <div style={{ display:"flex", alignItems:"flex-end", gap:2.5, height:20, marginTop:12 }}>
                    {EQ_H.map((h,i) => (
                        <div key={i} style={{
                            width:4, height:`${h}%`,
                            background:`rgba(74,222,128,${.25+i*.05})`,
                            borderRadius:2, transformOrigin:"bottom",
                            animation:`ahEq ${.38+(i%5)*.13}s ease-in-out infinite`,
                            animationDelay:`${i*.07}s`,
                        }} />
                    ))}
                </div>
            </div>

            {/* ── Stats ── */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:16, marginBottom:32 }}>
                {STATS.map(({ label, value, icon:Icon, color, bg }, i) => (
                    <div key={label} className="ah-stat-card" style={{ animationDelay:`${i*.07}s` }}>
                        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 }}>
                            <div style={{ width:40, height:40, borderRadius:12, background:bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
                                <Icon size={18} color={color} />
                            </div>
                            <span style={{ fontSize:10, color:"rgba(74,222,128,.6)", background:"rgba(74,222,128,.08)", padding:"3px 8px", borderRadius:100, fontWeight:600, letterSpacing:.5 }}>
                                Live
                            </span>
                        </div>
                        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:36, color:"#fff", letterSpacing:1, lineHeight:1, marginBottom:4 }}>
                            {loading ? "—" : value}
                        </div>
                        <p style={{ fontSize:12, color:"rgba(255,255,255,.4)", fontWeight:500 }}>{label}</p>
                    </div>
                ))}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:32 }}>

                {/* ── Top tracks ── */}
                <div style={{
                    borderRadius:18, border:"1px solid rgba(255,255,255,.07)",
                    background:"rgba(255,255,255,.02)", overflow:"hidden",
                }}>
                    <div style={{ padding:"16px 18px 12px", borderBottom:"1px solid rgba(255,255,255,.05)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, color:"#fff", letterSpacing:1.5 }}>Top bài hát</span>
                            <div style={{ display:"flex", alignItems:"flex-end", gap:1.5, height:12 }}>
                                {[40,70,50,85,55].map((h,i) => (
                                    <div key={i} style={{ width:2.5, height:`${h}%`, background:"#4ade80", borderRadius:1.5, transformOrigin:"bottom", animation:`ahEq ${.4+i*.1}s ease-in-out infinite`, animationDelay:`${i*.07}s` }} />
                                ))}
                            </div>
                        </div>
                        <Link to="/admin/tracks" style={{ fontSize:12, color:"#4ade80", textDecoration:"none" }}>Xem tất cả →</Link>
                    </div>

                    <div style={{ padding:"8px" }}>
                        {loading
                            ? Array.from({length:5}).map((_,i) => (
                                <div key={i} style={{ display:"flex", gap:12, padding:"10px 14px", borderRadius:12, animation:`ahPulse 1.5s ${i*.05}s ease-in-out infinite` }}>
                                    <div style={{ width:40, height:40, borderRadius:8, background:"rgba(255,255,255,.06)", flexShrink:0 }} />
                                    <div style={{ flex:1 }}>
                                        <div style={{ height:12, background:"rgba(255,255,255,.06)", borderRadius:4, width:"55%", marginBottom:6 }} />
                                        <div style={{ height:10, background:"rgba(255,255,255,.04)", borderRadius:4, width:"35%" }} />
                                    </div>
                                </div>
                            ))
                            : tracks.slice(0,8).map((track, idx) => {
                                const pct = Math.round((track.plays / (tracks[0]?.plays||1)) * 100);
                                return (
                                    <div key={track._id} className="ah-track-row" style={{ animationDelay:`${idx*.04}s` }}>
                                        <div style={{ width:28, textAlign:"center", flexShrink:0 }}>
                                            <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, color:"rgba(74,222,128,.3)", lineHeight:1 }}>
                                                {String(idx+1).padStart(2,"0")}
                                            </span>
                                        </div>
                                        <div style={{ width:40, height:40, borderRadius:8, overflow:"hidden", flexShrink:0, background:"linear-gradient(135deg,#dcfce7,#86efac)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                            {track.coverUrl
                                                ? <img src={track.coverUrl} alt={track.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                                                : <span style={{ fontSize:18, color:"#16a34a" }}>♪</span>
                                            }
                                        </div>
                                        <div style={{ flex:1, minWidth:0 }}>
                                            <p style={{ fontSize:13, fontWeight:500, color:"#fff", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", marginBottom:4 }}>
                                                {track.title}
                                            </p>
                                            <div style={{ height:3, background:"rgba(255,255,255,.06)", borderRadius:2, overflow:"hidden" }}>
                                                <div style={{ height:"100%", background:"linear-gradient(90deg,#16a34a,#4ade80)", borderRadius:2, width:`${pct}%`, animation:"ahBar .8s cubic-bezier(.4,0,.2,1) both", "--w":`${pct}%` } as any} />
                                            </div>
                                        </div>
                                        <div style={{ textAlign:"right", flexShrink:0 }}>
                                            <p style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,.6)" }}>{formatNum(track.plays)}</p>
                                            <p style={{ fontSize:10, color:"rgba(255,255,255,.25)" }}>{formatTime(track.duration)}</p>
                                        </div>
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>

                {/* ── Artists ── */}
                <div style={{
                    borderRadius:18, border:"1px solid rgba(255,255,255,.07)",
                    background:"rgba(255,255,255,.02)", overflow:"hidden",
                }}>
                    <div style={{ padding:"16px 18px 12px", borderBottom:"1px solid rgba(255,255,255,.05)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                        <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, color:"#fff", letterSpacing:1.5 }}>Nghệ sĩ</span>
                        <Link to="/admin/artists" style={{ fontSize:12, color:"#4ade80", textDecoration:"none" }}>Xem tất cả →</Link>
                    </div>
                    <div style={{ padding:"12px", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                        {loading
                            ? Array.from({length:6}).map((_,i) => (
                                <div key={i} style={{ padding:"14px 10px", borderRadius:12, background:"rgba(255,255,255,.03)", textAlign:"center", animation:`ahPulse 1.5s ${i*.05}s ease-in-out infinite` }}>
                                    <div style={{ width:48, height:48, borderRadius:"50%", background:"rgba(255,255,255,.06)", margin:"0 auto 8px" }} />
                                    <div style={{ height:10, background:"rgba(255,255,255,.06)", borderRadius:4, width:"70%", margin:"0 auto" }} />
                                </div>
                            ))
                            : artists.map((artist, idx) => (
                                <Link key={artist._id} to={`/admin/artists`} className="ah-artist-card" style={{ animationDelay:`${idx*.06}s` }}>
                                    <div style={{
                                        width:48, height:48, borderRadius:"50%",
                                        background:"linear-gradient(135deg,#bbf7d0,#4ade80)",
                                        margin:"0 auto 10px",
                                        display:"flex", alignItems:"center", justifyContent:"center",
                                        fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, color:"#166534",
                                        overflow:"hidden", border:"2px solid rgba(74,222,128,.2)",
                                    }}>
                                        {artist.avatar
                                            ? <img src={artist.avatar} alt={artist.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e => { e.currentTarget.style.display="none"; }} />
                                            : artist.name.split(" ").slice(-2).map((w:string) => w[0]).join("").toUpperCase()
                                        }
                                    </div>
                                    <p style={{ fontSize:12, fontWeight:600, color:"#fff", marginBottom:3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                                        {artist.name}
                                    </p>
                                    <p style={{ fontSize:10, color:"#4ade80" }}>{artist.genre ?? "—"}</p>
                                    {artist.verified && (
                                        <span style={{ fontSize:9, color:"#4ade80", background:"rgba(74,222,128,.1)", padding:"2px 6px", borderRadius:100, marginTop:4, display:"inline-block" }}>✓ Xác minh</span>
                                    )}
                                </Link>
                            ))
                        }
                    </div>
                </div>
            </div>

            {/* ── Quick actions ── */}
            <div style={{ borderRadius:18, border:"1px solid rgba(255,255,255,.07)", background:"rgba(255,255,255,.02)", padding:"18px" }}>
                <p style={{ fontSize:12, color:"rgba(255,255,255,.3)", letterSpacing:"2px", textTransform:"uppercase", fontWeight:600, marginBottom:14 }}>
                    Thao tác nhanh
                </p>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                    {[
                        { label:"+ Thêm bài hát",  to:"/admin/tracks",  color:"#4ade80" },
                        { label:"+ Thêm nghệ sĩ",  to:"/admin/artists", color:"#60a5fa" },
                    ].map(({ label, to, color }) => (
                        <Link key={to} to={to} style={{
                            padding:"10px 20px", borderRadius:100,
                            border:`1px solid ${color}30`,
                            background:`${color}10`,
                            color, fontSize:13, fontWeight:500,
                            textDecoration:"none", transition:"all .2s",
                        }}
                            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background=`${color}20`; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background=`${color}10`; }}
                        >
                            {label}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}