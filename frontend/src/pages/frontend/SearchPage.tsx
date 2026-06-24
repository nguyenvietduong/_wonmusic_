// src/pages/SearchPage.tsx
'use client'
import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { trackService, type Track } from "@/services/trackService";
import { artistService, type Artist } from "@/services/artistService";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { searchText } from "@/locales/search";
import { useIsMobile } from "@/hooks/use-mobile";
import SEO from "@/components/frontend/SEO";

const formatPlays = (num: number) => {
    if (num >= 1_000_000) return `${(num/1_000_000).toFixed(1)}M`;
    if (num >= 1_000)     return `${(num/1_000).toFixed(1)}K`;
    return num.toString();
};
const formatTime = (sec: number) =>
    `${Math.floor(sec/60)}:${String(Math.floor(sec%60)).padStart(2,"0")}`;
const formatFollowers = (num?: number) => {
    if (!num) return "0";
    if (num >= 1_000_000) return `${(num/1_000_000).toFixed(1)}M`;
    if (num >= 1_000)     return `${(num/1_000).toFixed(1)}K`;
    return num.toString();
};
const getInitials = (name: string) =>
    name.split(" ").slice(-2).map(w => w[0]).join("").toUpperCase();

type Tab = "all" | "tracks" | "artists";

const AVATAR_GRADIENTS = [
    "linear-gradient(135deg,#E8ECF8,#D8DFF0)",
    "linear-gradient(135deg,#E0F4F0,#C8EDE8)",
    "linear-gradient(135deg,#EEEEFB,#DDDAF8)",
    "linear-gradient(135deg,#EAEAFB,#D4D5F8)",
];

const EQ_HEIGHTS = [38, 70, 52, 88, 44, 76, 58, 92, 46, 80, 62, 36, 68, 54, 84];

const SkeletonTrack = ({ idx }: { idx: number }) => (
    <div style={{
        display:"flex", alignItems:"center", gap:16,
        padding:"12px 16px", borderRadius:14,
        background:"rgba(0,0,0,0.03)", border:"1px solid rgba(0,0,0,0.06)",
        animation:`spPulse 1.5s ${idx*0.05}s ease-in-out infinite`,
    }}>
        <div style={{ width:46, height:46, borderRadius:10, background:"rgba(0,169,143,0.07)", flexShrink:0 }} />
        <div style={{ flex:1 }}>
            <div style={{ height:11, background:"rgba(0,0,0,0.07)", borderRadius:4, width:"52%", marginBottom:8 }} />
            <div style={{ height:9,  background:"rgba(0,0,0,0.04)", borderRadius:4, width:"33%" }} />
        </div>
        <div style={{ width:38, height:9, background:"rgba(0,0,0,0.05)", borderRadius:4 }} />
    </div>
);

const SkeletonArtist = ({ idx }: { idx: number }) => (
    <div style={{
        padding:"22px 16px", borderRadius:16, textAlign:"center",
        background:"rgba(0,0,0,0.03)", border:"1px solid rgba(0,0,0,0.06)",
        animation:`spPulse 1.5s ${idx*0.05}s ease-in-out infinite`,
    }}>
        <div style={{ width:76, height:76, borderRadius:"50%", background:"rgba(0,169,143,0.07)", margin:"0 auto 14px" }} />
        <div style={{ height:11, background:"rgba(0,0,0,0.07)", borderRadius:4, width:"58%", margin:"0 auto 8px" }} />
        <div style={{ height:9,  background:"rgba(0,0,0,0.04)", borderRadius:4, width:"38%", margin:"0 auto" }} />
    </div>
);

export default function SearchPage() {
    const isMobile = useIsMobile();
    const { lang } = useLanguageStore();
    const t = searchText[lang];
    const router = useRouter();

    const searchParams = useSearchParams();
    const query = searchParams?.get("q") ?? "";

    const [tab,          setTab]          = useState<Tab>("all");
    const [tracks,       setTracks]       = useState<Track[]>([]);
    const [artists,      setArtists]      = useState<Artist[]>([]);
    const [loading,      setLoading]      = useState(false);
    const [inputVal,     setInputVal]     = useState(query);
    const [hoveredTrack, setHoveredTrack] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { play, togglePlay, currentTrack, isPlaying } = usePlayerStore();

    useEffect(() => { window.scrollTo({ top:0, behavior:"smooth" }); }, []);

    useEffect(() => {
        if (!query.trim()) { setTracks([]); setArtists([]); return; }
        (async () => {
            try {
                setLoading(true);
                const [tr, a] = await Promise.all([
                    trackService.search(query, 20),
                    artistService.getAll({ limit: 20 }),
                ]);
                setTracks(tr);
                setArtists(a.data.filter(ar => ar.name.toLowerCase().includes(query.toLowerCase())));
            } finally { setLoading(false); }
        })();
    }, [query]);

    const handleInput = (val: string) => {
        setInputVal(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            if (val.trim()) router.push(`/search?q=${encodeURIComponent(val)}`);
        }, 400);
    };

    const handlePlay = (track: Track) => {
        if (currentTrack?.id === track._id) { togglePlay(); return; }
        play(
            { id:track._id, title:track.title, artist:track.artistId.name, audioUrl:track.audioUrl, coverUrl:track.coverUrl, duration:track.duration },
            tracks.map(tr => ({ id:tr._id, title:tr.title, artist:tr.artistId.name, audioUrl:tr.audioUrl, coverUrl:tr.coverUrl, duration:tr.duration }))
        );
    };

    const hasResults   = tracks.length > 0 || artists.length > 0;
    const showTracks   = tab === "all" || tab === "tracks";
    const showArtists  = tab === "all" || tab === "artists";
    const totalResults = tracks.length + artists.length;

    return (
        <>
        <SEO
            title={query ? `"${query}" – Tìm Kiếm | Won Music` : "Tìm Kiếm – Won Music"}
            description={query ? `Kết quả tìm kiếm cho "${query}" trên Won Music.` : "Tìm kiếm bài hát, nghệ sĩ yêu thích trên Won Music."}
            canonical={`https://www.wonmusic.vn/search${query ? `?q=${encodeURIComponent(query)}` : ""}`}
            robots="noindex, follow"
        />
        <div style={{ minHeight:"100vh", background:"#F8F8FC", fontFamily:"'Be Vietnam Pro',sans-serif", color:"#0D0D1A" }}>
            <style>{`
                @keyframes spPulse  { 0%,100%{opacity:.35} 50%{opacity:.75} }
                @keyframes spFadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
                @keyframes spEq     { 0%,100%{transform:scaleY(.2)} 50%{transform:scaleY(1)} }

                .sp-input {
                    width:100%; background:rgba(0,0,0,.05);
                    border:1px solid rgba(0,169,143,.28);
                    border-radius:14px; outline:none;
                    padding:15px 52px 15px 50px;
                    font-size:15px; color:#0D0D1A;
                    font-family:'Be Vietnam Pro',sans-serif;
                    transition:all .25s;
                }
                .sp-input:focus {
                    background:rgba(0,0,0,.04);
                    border-color:rgba(0,169,143,.6);
                    box-shadow:0 0 0 4px rgba(0,169,143,.08);
                }
                .sp-input::placeholder { color:rgba(0,0,0,.35); }

                .sp-tab {
                    padding:8px 20px; border-radius:9px;
                    border:1px solid rgba(0,0,0,.1);
                    background:transparent; color:rgba(0,0,0,.45);
                    font-family:'Space Grotesk',sans-serif;
                    font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase;
                    cursor:pointer; transition:all .2s; white-space:nowrap;
                }
                .sp-tab:hover  { border-color:rgba(0,169,143,.4); color:#00A98F; }
                .sp-tab.active { background:rgba(0,169,143,.13); border-color:rgba(0,169,143,.5); color:#00A98F; }

                .sp-track-row {
                    display:flex; align-items:center; gap:16px;
                    padding:11px 16px; border-radius:14px;
                    transition:all .2s; cursor:pointer;
                    border:1px solid transparent;
                    animation:spFadeUp .35s both;
                    position:relative; overflow:hidden;
                    background:rgba(0,0,0,.02);
                }
                .sp-track-row::before {
                    content:''; position:absolute; left:0; top:0; bottom:0;
                    width:3px; background:linear-gradient(to bottom,#34D4B8,#00A98F);
                    transform:scaleY(0); transition:transform .2s;
                    border-radius:0 2px 2px 0;
                }
                .sp-track-row:hover { background:rgba(0,169,143,.055); border-color:rgba(0,169,143,.2); transform:translateX(4px); }
                .sp-track-row:hover::before { transform:scaleY(1); }
                .sp-track-row.playing { background:rgba(0,169,143,.07); border-color:rgba(0,169,143,.3); }
                .sp-track-row.playing::before { transform:scaleY(1); }

                .sp-artist-card {
                    padding:22px 16px; border-radius:18px; text-align:center;
                    border:1px solid rgba(0,0,0,.07); background:rgba(0,0,0,.02);
                    text-decoration:none; color:#0D0D1A; display:block;
                    transition:all .3s; animation:spFadeUp .4s both;
                    position:relative; overflow:hidden;
                }
                .sp-artist-card::before {
                    content:''; position:absolute; inset:0; border-radius:18px;
                    background:radial-gradient(ellipse at 50% 0%, rgba(0,169,143,.1) 0%, transparent 60%);
                    opacity:0; transition:opacity .3s;
                }
                .sp-artist-card::after {
                    content:''; position:absolute; bottom:0; left:0; right:0;
                    height:2px; background:linear-gradient(90deg,#00A98F,#34D4B8);
                    transform:scaleX(0); transition:transform .3s;
                }
                .sp-artist-card:hover { border-color:rgba(0,169,143,.32); transform:translateY(-8px); box-shadow:0 20px 48px rgba(0,169,143,.1); }
                .sp-artist-card:hover::before { opacity:1; }
                .sp-artist-card:hover::after  { transform:scaleX(1); }
            `}</style>

            {/* ══ HERO ══ */}
            <div style={{
                position:"relative", overflow:"hidden",
                height: isMobile ? 220 : 300,
                backgroundImage:"url('/partner-bg.png')",
                backgroundSize:"cover",
                backgroundPosition:"center",
                backgroundRepeat:"no-repeat",
            }}>
                {/* Teal glow */}
                <div style={{ position:"absolute", top:"-20%", right:"-5%", width:460, height:460, borderRadius:"50%", background:"radial-gradient(circle,rgba(0,169,143,0.10),transparent 65%)", pointerEvents:"none" }} />

                {/* EQ bars */}
                <div style={{ position:"absolute", bottom:0, left:0, right:0, display:"flex", alignItems:"flex-end", gap:2, height: isMobile ? 28 : 40, opacity:.13, pointerEvents:"none" }}>
                    {EQ_HEIGHTS.map((h, i) => (
                        <div key={i} style={{ flex:1, height:`${h}%`, background:"#00A98F", borderRadius:"2px 2px 0 0" }} />
                    ))}
                </div>

                {/* Content */}
                <div style={{ maxWidth:1440, margin:"0 auto", padding:`${isMobile ? 76 : 82}px 32px ${isMobile ? 24 : 28}px`, position:"relative", zIndex:2 }}>
                    {/* Eyebrow */}
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                        <span style={{ width:24, height:2, background:"#00A98F", borderRadius:2, display:"block" }} />
                        <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", color:"#00A98F" }}>
                            {t.label}
                        </span>
                    </div>

                    {/* Heading */}
                    <h1 style={{
                        fontFamily:"'Be Vietnam Pro', sans-serif",
                        fontSize: isMobile ? "clamp(22px,6vw,28px)" : "clamp(24px,2.8vw,36px)",
                        lineHeight:1.15, letterSpacing:"-0.5px",
                        color:"#0D0D1A", margin:0, textTransform:"uppercase",
                    }}>
                        <b>
                            {t.heading}{" "}
                            <span style={{ color:"#00A98F" }}>{t.highlight}</span>
                        </b>
                    </h1>

                    {/* Divider */}
                    <div style={{ display:"flex", alignItems:"center", gap:16, marginTop:14 }}>
                        <div style={{ width:48, height:2, background:"linear-gradient(90deg,#00A98F,#34D4B8)", borderRadius:2 }} />
                        <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:11, color:"rgba(0,0,0,.45)", letterSpacing:"0.5px" }}>
                            {t.placeholder}
                        </span>
                    </div>
                </div>
            </div>

            {/* ══ CONTENT ══ */}
            <div style={{ maxWidth:1440, margin:"0 auto", padding: isMobile ? "24px 16px 60px" : "40px 32px 80px" }}>

                {/* Search input */}
                <div style={{ marginBottom:24, position:"relative" }}>
                    <span style={{ position:"absolute", left:18, top:"50%", transform:"translateY(-50%)", fontSize:16, pointerEvents:"none", color:"#00A98F" }}>🔍</span>
                    <input
                        className="sp-input"
                        placeholder={t.placeholder}
                        value={inputVal}
                        onChange={e => handleInput(e.target.value)}
                        autoFocus
                    />
                    {inputVal && (
                        <button
                            onClick={() => { setInputVal(""); router.push("/search"); setTracks([]); setArtists([]); }}
                            style={{ position:"absolute", right:16, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"rgba(0,0,0,.35)", fontSize:16, cursor:"pointer", padding:4, transition:"color .2s" }}
                            onMouseEnter={e => (e.currentTarget.style.color="#00A98F")}
                            onMouseLeave={e => (e.currentTarget.style.color="rgba(0,0,0,.35)")}
                        >✕</button>
                    )}
                </div>

                {/* Result count */}
                {query && !loading && (
                    <p style={{ marginBottom:24, fontFamily:"'Space Grotesk',sans-serif", fontSize:12, color:"rgba(0,0,0,.45)" }}>
                        {hasResults
                            ? <><span style={{ color:"#00A98F", fontWeight:700 }}>{totalResults}</span> {t.resultsSuffix} "<span style={{ color:"#0D0D1A" }}>{query}</span>"</>
                            : <>{t.noResultsPrefix} "<span style={{ color:"#0D0D1A" }}>{query}</span>"</>
                        }
                    </p>
                )}

                {/* Empty state — no query */}
                {!query && (
                    <div style={{ textAlign:"center", padding:"80px 0", animation:"spFadeUp .4s both" }}>
                        <div style={{ fontSize:64, marginBottom:18, opacity:.15 }}>♪</div>
                        <p style={{ fontSize:17, fontWeight:500, color:"rgba(0,0,0,.55)", marginBottom:8 }}>{t.emptyTitle}</p>
                        <p style={{ fontSize:13, color:"rgba(0,0,0,.38)" }}>{t.emptyHint}</p>
                    </div>
                )}

                {query && (
                    <>
                        {/* Tabs */}
                        <div style={{ display:"flex", gap:8, marginBottom:32, flexWrap:"wrap" }}>
                            {([
                                { key:"all",     label:`${t.tabAll} (${totalResults})` },
                                { key:"tracks",  label:`${t.tabTracks} (${tracks.length})` },
                                { key:"artists", label:`${t.tabArtists} (${artists.length})` },
                            ] as {key:Tab, label:string}[]).map(({ key, label }) => (
                                <button key={key} className={`sp-tab ${tab===key?"active":""}`} onClick={() => setTab(key)}>
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Skeletons */}
                        {loading && (
                            <div>
                                <div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:40 }}>
                                    {Array.from({length:6}).map((_,i) => <SkeletonTrack key={i} idx={i} />)}
                                </div>
                                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))", gap:14 }}>
                                    {Array.from({length:4}).map((_,i) => <SkeletonArtist key={i} idx={i} />)}
                                </div>
                            </div>
                        )}

                        {/* No results */}
                        {!loading && !hasResults && (
                            <div style={{ textAlign:"center", padding:"88px 0", animation:"spFadeUp .4s both" }}>
                                <div style={{ fontSize:56, marginBottom:18, opacity:.15 }}>🎵</div>
                                <h3 style={{ fontSize:18, fontWeight:600, color:"rgba(0,0,0,.55)", marginBottom:8 }}>{t.noResults}</h3>
                                <p style={{ fontSize:13, color:"rgba(0,0,0,.38)", marginBottom:28 }}>{t.noResultsHint}</p>
                                <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
                                    <Link href="/charts" style={{ padding:"10px 22px", borderRadius:10, background:"rgba(0,169,143,.12)", border:"1px solid rgba(0,169,143,.35)", color:"#34D4B8", textDecoration:"none", fontFamily:"'Space Grotesk',sans-serif", fontSize:12, fontWeight:700, letterSpacing:"1px" }}>
                                        {t.hotMusic}
                                    </Link>
                                    <Link href="/artists" style={{ padding:"10px 22px", borderRadius:10, border:"1px solid rgba(0,0,0,.1)", color:"rgba(0,0,0,.5)", textDecoration:"none", fontFamily:"'Space Grotesk',sans-serif", fontSize:12, fontWeight:700, letterSpacing:"1px" }}>
                                        {t.allArtists}
                                    </Link>
                                </div>
                            </div>
                        )}

                        {!loading && hasResults && (
                            <div style={{ display:"flex", flexDirection:"column", gap:48 }}>

                                {/* ── TRACKS ── */}
                                {showTracks && tracks.length > 0 && (
                                    <div>
                                        {/* Section header */}
                                        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                                            <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"2.5px", textTransform:"uppercase", color:"rgba(0,0,0,.45)" }}>{t.tracksSection}</span>
                                            <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:11, color:"#34D4B8", background:"rgba(0,169,143,.1)", border:"1px solid rgba(0,169,143,.25)", padding:"2px 10px", borderRadius:100 }}>{tracks.length}</span>
                                            <span style={{ flex:1, height:1, background:"rgba(0,0,0,.07)" }} />
                                            {/* Mini EQ */}
                                            <div style={{ display:"flex", alignItems:"flex-end", gap:2, height:14 }}>
                                                {[40,70,50,85,55].map((h,i) => (
                                                    <div key={i} style={{ width:3, height:`${h}%`, background:"linear-gradient(to top,#00A98F,#34D4B8)", borderRadius:2, transformOrigin:"bottom", animation:`spEq ${.4+i*.1}s ease-in-out infinite`, animationDelay:`${i*.07}s` }} />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Column headers */}
                                        <div style={{ display:"flex", alignItems:"center", gap:16, padding:"0 16px 8px", borderBottom:"1px solid rgba(0,0,0,.07)", marginBottom:4 }}>
                                            <div style={{ width:32 }} />
                                            <div style={{ width: isMobile ? 40 : 46 }} />
                                            <div style={{ flex:1, fontFamily:"'Space Grotesk',sans-serif", fontSize:9, color:"rgba(0,0,0,.4)", textTransform:"uppercase", letterSpacing:"2px", fontWeight:700 }}>Bài hát</div>
                                            {!isMobile && <div style={{ width:80, fontFamily:"'Space Grotesk',sans-serif", fontSize:9, color:"rgba(0,0,0,.4)", textTransform:"uppercase", letterSpacing:"2px", fontWeight:700 }}>Thể loại</div>}
                                            {!isMobile && <div style={{ width:52, textAlign:"right", fontFamily:"'Space Grotesk',sans-serif", fontSize:9, color:"rgba(0,0,0,.4)", textTransform:"uppercase", letterSpacing:"2px", fontWeight:700 }}>Plays</div>}
                                            <div style={{ width:42, textAlign:"right", fontFamily:"'Space Grotesk',sans-serif", fontSize:9, color:"rgba(0,0,0,.4)", textTransform:"uppercase", letterSpacing:"2px", fontWeight:700 }}>TG</div>
                                        </div>

                                        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                                            {tracks.map((track, idx) => {
                                                const isThis        = currentTrack?.id === track._id;
                                                const isThisPlaying = isThis && isPlaying;
                                                return (
                                                    <div
                                                        key={track._id}
                                                        className={`sp-track-row ${isThisPlaying?"playing":""}`}
                                                        style={{ animationDelay:`${idx*.04}s` }}
                                                        onMouseEnter={() => setHoveredTrack(track._id)}
                                                        onMouseLeave={() => setHoveredTrack(null)}
                                                        onClick={() => handlePlay(track)}
                                                    >
                                                        {/* Index / EQ */}
                                                        <div style={{ width:32, flexShrink:0, textAlign:"center" }}>
                                                            {isThisPlaying ? (
                                                                <div style={{ display:"flex", alignItems:"flex-end", gap:1.5, height:15, justifyContent:"center" }}>
                                                                    {[40,70,55,90,45].map((h,i) => (
                                                                        <div key={i} style={{ width:3, height:`${h}%`, background:"linear-gradient(to top,#00A98F,#34D4B8)", borderRadius:2, transformOrigin:"bottom", animation:`spEq ${.38+i*.1}s ease-in-out infinite`, animationDelay:`${i*.06}s` }} />
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color: hoveredTrack===track._id ? "#34D4B8" : "rgba(0,0,0,.35)" }}>
                                                                    {String(idx+1).padStart(2,"0")}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Cover */}
                                                        <div style={{
                                                            width: isMobile ? 40 : 46, height: isMobile ? 40 : 46, borderRadius:10,
                                                            overflow:"hidden", flexShrink:0,
                                                            background:"linear-gradient(135deg,#E8ECF8,#D8DFF0)",
                                                            border:`1px solid ${isThisPlaying ? "rgba(0,169,143,.4)" : "rgba(0,0,0,.07)"}`,
                                                            position:"relative",
                                                            boxShadow: isThisPlaying ? "0 3px 14px rgba(0,169,143,.28)" : "none",
                                                            transition:"all .18s",
                                                        }}>
                                                            {track.coverUrl
                                                                ? <img src={track.coverUrl} alt={track.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                                                                : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, color:"#34D4B8", opacity:.5 }}>♪</div>
                                                            }
                                                            {hoveredTrack === track._id && (
                                                                <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.52)", display:"flex", alignItems:"center", justifyContent:"center", color:"#34D4B8", fontSize:14, borderRadius:10 }}>
                                                                    {isThisPlaying?"⏸":"▶"}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Title + artist */}
                                                        <div style={{ flex:1, minWidth:0 }}>
                                                            <p style={{ fontSize:13, fontWeight:500, color: isThisPlaying ? "#34D4B8" : "#0D0D1A", marginBottom:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", transition:"color .18s" }}>
                                                                {track.title}
                                                            </p>
                                                            <Link href={`/artists/${track.artistId._id}`} onClick={e => e.stopPropagation()}
                                                                style={{ fontSize:12, color:"rgba(0,0,0,.45)", textDecoration:"none", transition:"color .2s" }}
                                                                onMouseEnter={e => (e.currentTarget.style.color="#34D4B8")}
                                                                onMouseLeave={e => (e.currentTarget.style.color="rgba(0,0,0,.45)")}
                                                            >
                                                                {track.artistId.name}
                                                                {track.artistId.verified && <span style={{ color:"#34D4B8", marginLeft:4, fontSize:10 }}>✓</span>}
                                                            </Link>
                                                        </div>

                                                        {/* Genre */}
                                                        {!isMobile && (
                                                        <div style={{ width:80, flexShrink:0 }}>
                                                            {track.genre && (
                                                                <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:9, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"#34D4B8", background:"rgba(0,169,143,.09)", padding:"3px 9px", borderRadius:100, border:"1px solid rgba(0,169,143,.22)", whiteSpace:"nowrap" }}>
                                                                    {track.genre}
                                                                </span>
                                                            )}
                                                        </div>
                                                        )}

                                                        {/* Plays */}
                                                        {!isMobile && (
                                                        <div style={{ width:52, textAlign:"right", flexShrink:0 }}>
                                                            <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:12, color:"rgba(0,0,0,.45)", fontWeight:600 }}>{formatPlays(track.plays)}</span>
                                                        </div>
                                                        )}

                                                        {/* Duration */}
                                                        <div style={{ width:42, textAlign:"right", flexShrink:0 }}>
                                                            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"rgba(0,0,0,.4)" }}>{formatTime(track.duration)}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* ── ARTISTS ── */}
                                {showArtists && artists.length > 0 && (
                                    <div>
                                        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                                            <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"2.5px", textTransform:"uppercase", color:"rgba(0,0,0,.45)" }}>{t.artistsSection}</span>
                                            <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:11, color:"#34D4B8", background:"rgba(0,169,143,.1)", border:"1px solid rgba(0,169,143,.25)", padding:"2px 10px", borderRadius:100 }}>{artists.length}</span>
                                            <span style={{ flex:1, height:1, background:"rgba(0,0,0,.07)" }} />
                                        </div>

                                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(175px,1fr))", gap:14 }}>
                                            {artists.map((artist, idx) => (
                                                <Link href={`/artists/${artist._id}`} key={artist._id} className="sp-artist-card" style={{ animationDelay:`${idx*.06}s` }}>
                                                    {/* Avatar */}
                                                    <div style={{ position:"relative", width:80, margin:"0 auto 14px" }}>
                                                        <div style={{
                                                            width:80, height:80, borderRadius:"50%",
                                                            background:AVATAR_GRADIENTS[idx%AVATAR_GRADIENTS.length],
                                                            display:"flex", alignItems:"center", justifyContent:"center",
                                                            fontFamily:"'Space Grotesk',sans-serif",
                                                            fontSize:26, fontWeight:700, color:"#00A98F",
                                                            border:"2px solid rgba(0,169,143,.2)",
                                                            overflow:"hidden", position:"relative",
                                                            boxShadow:"0 4px 20px rgba(0,0,0,.1)",
                                                            transition:"all .3s",
                                                        }}>
                                                            {artist.avatar
                                                                ? <img src={artist.avatar} alt={artist.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e => { e.currentTarget.style.display="none"; }} />
                                                                : getInitials(artist.name)
                                                            }
                                                            {artist.verified && (
                                                                <div style={{ position:"absolute", bottom:0, right:0, width:22, height:22, borderRadius:"50%", background:"linear-gradient(135deg,#00A98F,#34D4B8)", color:"#F8F8FC", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, border:"2px solid #F8F8FC", boxShadow:"0 2px 10px rgba(0,169,143,.5)" }}>✓</div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <p style={{ fontSize:14, fontWeight:600, color:"#0D0D1A", marginBottom:5, lineHeight:1.3 }}>{artist.name}</p>
                                                    <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:9, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"#34D4B8", marginBottom:10 }}>{artist.genre ?? "—"}</p>
                                                    <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:12, color:"rgba(0,0,0,.45)" }}>
                                                        <span style={{ fontWeight:700, color:"rgba(0,0,0,.65)" }}>{formatFollowers(artist.followers)}</span> followers
                                                    </p>

                                                    {/* Mini EQ */}
                                                    <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"center", gap:2, height:10, marginTop:12 }}>
                                                        {[40,65,50,80,55].map((h,i) => (
                                                            <div key={i} style={{ width:3, height:`${h}%`, background:"rgba(0,169,143,.22)", borderRadius:2, transformOrigin:"bottom", animation:`spEq ${.4+i*.1}s ease-in-out infinite`, animationDelay:`${i*.07}s` }} />
                                                        ))}
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
        </>
    );
}
