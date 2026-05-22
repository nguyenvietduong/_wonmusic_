// src/pages/SearchPage.tsx
import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { trackService, type Track } from "@/services/trackService";
import { artistService, type Artist } from "@/services/artistService";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { searchText } from "@/locales/search";
import SEO from "@/components/frontend/SEO";

const NOTES = ["♩","♪","♫","♬","𝄞","𝄢","♭"];

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

const SkeletonTrack = ({ idx }: { idx: number }) => (
    <div style={{
        display:"flex", alignItems:"center", gap:16,
        padding:"12px 16px", borderRadius:14,
        background:"#fafafa", border:"1px solid #f3f4f6",
        animation:`spPulse 1.5s ${idx*0.05}s ease-in-out infinite`,
    }}>
        <div style={{ width:48, height:48, borderRadius:10, background:"#f0fdf4", flexShrink:0 }} />
        <div style={{ flex:1 }}>
            <div style={{ height:13, background:"#f0fdf4", borderRadius:4, width:"55%", marginBottom:8 }} />
            <div style={{ height:11, background:"#f0fdf4", borderRadius:4, width:"35%" }} />
        </div>
        <div style={{ width:40, height:11, background:"#f0fdf4", borderRadius:4 }} />
    </div>
);

const SkeletonArtist = ({ idx }: { idx: number }) => (
    <div style={{
        padding:"24px 20px", borderRadius:20, textAlign:"center",
        background:"#fafafa", border:"1px solid #f3f4f6",
        animation:`spPulse 1.5s ${idx*0.05}s ease-in-out infinite`,
    }}>
        <div style={{ width:80, height:80, borderRadius:"50%", background:"#f0fdf4", margin:"0 auto 12px" }} />
        <div style={{ height:13, background:"#f0fdf4", borderRadius:4, width:"60%", margin:"0 auto 8px" }} />
        <div style={{ height:11, background:"#f0fdf4", borderRadius:4, width:"40%", margin:"0 auto" }} />
    </div>
);

const AVATAR_GRADIENTS = [
    "linear-gradient(135deg,#bbf7d0,#4ade80)",
    "linear-gradient(135deg,#86efac,#16a34a)",
    "linear-gradient(135deg,#dcfce7,#22c55e)",
    "linear-gradient(135deg,#a7f3d0,#059669)",
];

export default function SearchPage() {
    const { lang } = useLanguageStore();
    const t = searchText[lang];

    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get("q") ?? "";

    const [tab,          setTab]          = useState<Tab>("all");
    const [tracks,       setTracks]       = useState<Track[]>([]);
    const [artists,      setArtists]      = useState<Artist[]>([]);
    const [loading,      setLoading]      = useState(false);
    const [inputVal,     setInputVal]     = useState(query);
    const [hoveredTrack, setHoveredTrack] = useState<string | null>(null);
    const notesBgRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { play, togglePlay, currentTrack, isPlaying } = usePlayerStore();

    useEffect(() => { window.scrollTo({ top:0, behavior:"smooth" }); }, []);

    // ── Floating notes ──
    useEffect(() => {
        const spawn = () => {
            if (!notesBgRef.current) return;
            const el = document.createElement("div");
            el.textContent = NOTES[Math.floor(Math.random() * NOTES.length)];
            const dur = 8 + Math.random() * 7;
            el.style.cssText = `
                position:absolute;
                left:${Math.random()*100}%;
                bottom:-30px;
                font-size:${13+Math.random()*14}px;
                color:${Math.random()>.5?"rgba(74,222,128,0.3)":"rgba(22,163,74,0.2)"};
                pointer-events:none; user-select:none;
                animation:spNoteRise ${dur}s linear forwards;
            `;
            notesBgRef.current.appendChild(el);
            setTimeout(() => el.remove(), dur * 1000);
        };
        spawn();
        const id = setInterval(spawn, 800);
        return () => clearInterval(id);
    }, []);

    // ── Search ──
    useEffect(() => {
        if (!query.trim()) { setTracks([]); setArtists([]); return; }
        (async () => {
            try {
                setLoading(true);
                const [t, a] = await Promise.all([
                    trackService.search(query, 20),
                    artistService.getAll({ limit: 20 }),
                ]);
                setTracks(t);
                setArtists(a.data.filter(ar =>
                    ar.name.toLowerCase().includes(query.toLowerCase())
                ));
            } finally { setLoading(false); }
        })();
    }, [query]);

    // ── Input debounce → update URL ──
    const handleInput = (val: string) => {
        setInputVal(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            if (val.trim()) setSearchParams({ q: val });
        }, 400);
    };

    const handlePlay = (track: Track) => {
        if (currentTrack?.id === track._id) { togglePlay(); return; }
        play(
            { id:track._id, title:track.title, artist:track.artistId.name, audioUrl:track.audioUrl, coverUrl:track.coverUrl, duration:track.duration },
            tracks.map(t => ({ id:t._id, title:t.title, artist:t.artistId.name, audioUrl:t.audioUrl, coverUrl:t.coverUrl, duration:t.duration }))
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
            description={query
                ? `Kết quả tìm kiếm cho "${query}" trên Won Music – bài hát, nghệ sĩ và nhiều hơn nữa.`
                : "Tìm kiếm bài hát, nghệ sĩ yêu thích trên Won Music."
            }
            canonical={`https://www.wonmusic.vn/search${query ? `?q=${encodeURIComponent(query)}` : ""}`}
            robots="noindex, follow"
        />
        <div style={{ minHeight:"100vh", background:"#fff", fontFamily:"'Be Vietnam Pro',sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');

                @keyframes spNoteRise {
                    0%   { transform:translateY(0) rotate(0deg) scale(.7); opacity:0; }
                    8%   { opacity:1; }
                    92%  { opacity:.5; }
                    100% { transform:translateY(-110vh) rotate(32deg) scale(1.1); opacity:0; }
                }
                @keyframes spPulse   { 0%,100%{opacity:.5} 50%{opacity:1} }
                @keyframes spFadeUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
                @keyframes spEq      { 0%,100%{transform:scaleY(.2)} 50%{transform:scaleY(1)} }
                @keyframes spDotBlink{ 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(.5)} }
                @keyframes spShimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
                @keyframes spBarGrow { from{width:0} to{width:var(--w)} }

                /* Search input */
                .sp-input {
                    width:100%; background:rgba(255,255,255,.08);
                    border:1.5px solid rgba(255,255,255,.15);
                    border-radius:100px; outline:none;
                    padding:16px 56px 16px 52px;
                    font-size:16px; color:#fff;
                    font-family:'Be Vietnam Pro',sans-serif;
                    transition:all .25s; backdrop-filter:blur(8px);
                }
                .sp-input:focus {
                    background:rgba(255,255,255,.12);
                    border-color:rgba(74,222,128,.5);
                    box-shadow:0 0 0 4px rgba(74,222,128,.12);
                }
                .sp-input::placeholder { color:rgba(255,255,255,.4); }

                /* Tab */
                .sp-tab {
                    padding:9px 22px; border-radius:100px;
                    border:1.5px solid #e5e7eb;
                    background:transparent; color:#6b7280;
                    font-size:13px; font-weight:500; cursor:pointer;
                    transition:all .2s; font-family:'Be Vietnam Pro',sans-serif;
                    white-space:nowrap;
                }
                .sp-tab:hover { border-color:#16a34a; color:#16a34a; }
                .sp-tab.active {
                    background:#16a34a; border-color:#16a34a; color:#fff;
                    box-shadow:0 4px 14px rgba(22,163,74,.3);
                }

                /* Track row */
                .sp-track-row {
                    display:flex; align-items:center; gap:16px;
                    padding:12px 16px; border-radius:14px;
                    transition:all .2s; cursor:pointer;
                    border:1px solid transparent;
                    animation:spFadeUp .35s both;
                    position:relative; overflow:hidden; background:#fff;
                }
                .sp-track-row::before {
                    content:''; position:absolute; left:0; top:0; bottom:0;
                    width:3px; background:linear-gradient(to bottom,#4ade80,#16a34a);
                    transform:scaleY(0); transition:transform .2s;
                    border-radius:0 2px 2px 0;
                }
                .sp-track-row:hover { background:#f0fdf4; border-color:rgba(22,163,74,.15); transform:translateX(4px); }
                .sp-track-row:hover::before { transform:scaleY(1); }
                .sp-track-row.playing { background:#f0fdf4; border-color:rgba(22,163,74,.3); }
                .sp-track-row.playing::before { transform:scaleY(1); }

                /* Artist card */
                .sp-artist-card {
                    padding:24px 20px; border-radius:20px; text-align:center;
                    border:1px solid #e5e7eb; background:#fff;
                    text-decoration:none; color:inherit; display:block;
                    transition:all .3s; animation:spFadeUp .4s both;
                    position:relative; overflow:hidden;
                }
                .sp-artist-card::after {
                    content:''; position:absolute; bottom:0; left:0; right:0;
                    height:3px; background:linear-gradient(90deg,#16a34a,#4ade80);
                    transform:scaleX(0); transition:transform .3s;
                }
                .sp-artist-card:hover {
                    border-color:rgba(22,163,74,.3);
                    transform:translateY(-6px);
                    box-shadow:0 16px 40px rgba(22,163,74,.1);
                }
                .sp-artist-card:hover::after { transform:scaleX(1); }

                /* Highlight match */
                .sp-highlight {
                    background:linear-gradient(90deg,rgba(74,222,128,.25),rgba(74,222,128,.15));
                    background-size:200%;
                    border-radius:3px; padding:0 2px;
                    animation:spShimmer 2s linear infinite;
                }
            `}</style>

            {/* ══════ HERO / SEARCH BAR ══════ */}
            <div style={{
                background:"linear-gradient(135deg,#052e16,#0a3d1f,#14532d)",
                padding:"100px 0 48px", position:"relative", overflow:"hidden",
            }}>
                <div ref={notesBgRef} style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }} />

                {/* EQ decoration */}
                <div style={{ position:"absolute", bottom:0, left:0, right:0, display:"flex", alignItems:"flex-end", gap:2, height:60, opacity:.12, pointerEvents:"none" }}>
                    {Array.from({length:80}).map((_,i) => {
                        const h = 20 + Math.sin(i*.3)*30 + Math.sin(i*.7)*20;
                        return <div key={i} style={{ flex:1, height:`${Math.max(8,h)}%`, background:"#4ade80", borderRadius:"2px 2px 0 0", transformOrigin:"bottom", animation:`spEq ${.4+(i%6)*.1}s ease-in-out infinite`, animationDelay:`${i*.04}s` }} />;
                    })}
                </div>

                <div style={{ maxWidth:800, margin:"0 auto", padding:"0 48px", position:"relative", zIndex:2 }}>
                    {/* Label */}
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16, justifyContent:"center" }}>
                        <span style={{ width:6, height:6, borderRadius:"50%", background:"#4ade80", display:"inline-block", animation:"spDotBlink 1.5s ease-in-out infinite" }} />
                        <span style={{ fontSize:11, color:"#4ade80", letterSpacing:"2.5px", textTransform:"uppercase", fontWeight:600 }}>
                            {t.label}
                        </span>
                    </div>

                    <h1 style={{
                        fontFamily:"'Barlow Condensed',sans-serif",
                        fontSize:"clamp(48px,8vw,88px)",
                        color:"#fff", lineHeight:.9, letterSpacing:3,
                        textAlign:"center", marginBottom:32,
                    }}>
                        {t.heading} <span style={{ color:"#4ade80" }}>{t.highlight}</span>
                    </h1>

                    {/* Search input */}
                    <div style={{ position:"relative" }}>
                        <span style={{ position:"absolute", left:20, top:"50%", transform:"translateY(-50%)", fontSize:18, pointerEvents:"none" }}>🔍</span>
                        <input
                            className="sp-input"
                            placeholder={t.placeholder}
                            value={inputVal}
                            onChange={e => handleInput(e.target.value)}
                            autoFocus
                        />
                        {inputVal && (
                            <button
                                onClick={() => { setInputVal(""); setSearchParams({}); setTracks([]); setArtists([]); }}
                                style={{ position:"absolute", right:20, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"rgba(255,255,255,.5)", fontSize:18, cursor:"pointer", padding:4 }}
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Result count */}
                    {query && !loading && (
                        <p style={{ textAlign:"center", marginTop:16, fontSize:13, color:"rgba(255,255,255,.5)", animation:"spFadeUp .3s both" }}>
                            {hasResults
                                ? <><span style={{ color:"#4ade80", fontWeight:600 }}>{totalResults}</span> {t.resultsSuffix} "<span style={{ color:"#fff" }}>{query}</span>"</>
                                : <>{t.noResultsPrefix} "<span style={{ color:"#fff" }}>{query}</span>"</>
                            }
                        </p>
                    )}
                </div>
            </div>

            {/* ══════ CONTENT ══════ */}
            <div style={{ maxWidth:1100, margin:"0 auto", padding:"40px 48px 80px" }}>

                {/* No query */}
                {!query && (
                    <div style={{ textAlign:"center", padding:"80px 0", color:"#9ca3af", animation:"spFadeUp .4s both" }}>
                        <div style={{ fontSize:64, marginBottom:16 }}>♪</div>
                        <p style={{ fontSize:18, fontWeight:500, color:"#374151", marginBottom:8 }}>{t.emptyTitle}</p>
                        <p style={{ fontSize:14, color:"#9ca3af" }}>{t.emptyHint}</p>
                    </div>
                )}

                {/* Has query */}
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

                        {/* Loading */}
                        {loading && (
                            <div>
                                <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:40 }}>
                                    {Array.from({length:5}).map((_,i) => <SkeletonTrack key={i} idx={i} />)}
                                </div>
                                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:16 }}>
                                    {Array.from({length:4}).map((_,i) => <SkeletonArtist key={i} idx={i} />)}
                                </div>
                            </div>
                        )}

                        {/* No results */}
                        {!loading && !hasResults && (
                            <div style={{ textAlign:"center", padding:"80px 0", animation:"spFadeUp .4s both" }}>
                                <div style={{ fontSize:56, marginBottom:16 }}>🎵</div>
                                <h3 style={{ fontSize:20, fontWeight:600, color:"#111827", marginBottom:8 }}>{t.noResults}</h3>
                                <p style={{ fontSize:14, color:"#9ca3af", marginBottom:28 }}>{t.noResultsHint}</p>
                                <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
                                    <Link to="/charts" style={{ padding:"10px 22px", borderRadius:100, background:"#16a34a", color:"#fff", textDecoration:"none", fontSize:13, fontWeight:500 }}>
                                        {t.hotMusic}
                                    </Link>
                                    <Link to="/artists" style={{ padding:"10px 22px", borderRadius:100, border:"1px solid #e5e7eb", color:"#374151", textDecoration:"none", fontSize:13, fontWeight:500 }}>
                                        {t.allArtists}
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Results */}
                        {!loading && hasResults && (
                            <div style={{ display:"flex", flexDirection:"column", gap:48 }}>

                                {/* ── TRACKS ── */}
                                {showTracks && tracks.length > 0 && (
                                    <div>
                                        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
                                            <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:26, color:"#111827", letterSpacing:1.5 }}>{t.tracksSection}</span>
                                            <span style={{ fontSize:12, color:"#9ca3af", background:"#f3f4f6", padding:"3px 10px", borderRadius:100 }}>{tracks.length}</span>
                                            {/* Mini EQ */}
                                            <div style={{ display:"flex", alignItems:"flex-end", gap:2, height:16, marginLeft:4 }}>
                                                {[40,70,50,85,55].map((h,i) => (
                                                    <div key={i} style={{ width:3, height:`${h}%`, background:"#16a34a", borderRadius:2, transformOrigin:"bottom", animation:`spEq ${.4+i*.1}s ease-in-out infinite`, animationDelay:`${i*.07}s` }} />
                                                ))}
                                            </div>
                                        </div>

                                        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
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
                                                        {/* Rank/EQ */}
                                                        <div style={{ width:32, flexShrink:0, textAlign:"center" }}>
                                                            {isThisPlaying ? (
                                                                <div style={{ display:"flex", alignItems:"flex-end", gap:1.5, height:16, justifyContent:"center" }}>
                                                                    {[40,70,55,90,45].map((h,i) => (
                                                                        <div key={i} style={{ width:3, height:`${h}%`, background:"#16a34a", borderRadius:2, transformOrigin:"bottom", animation:`spEq ${.38+i*.1}s ease-in-out infinite`, animationDelay:`${i*.06}s` }} />
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <span style={{ fontSize:12, color: hoveredTrack===track._id?"#16a34a":"#9ca3af", fontWeight:500 }}>
                                                                    {String(idx+1).padStart(2,"0")}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Cover */}
                                                        <div style={{
                                                            width:48, height:48, borderRadius:10, overflow:"hidden",
                                                            background:"linear-gradient(135deg,#dcfce7,#86efac)",
                                                            flexShrink:0, position:"relative",
                                                            boxShadow: isThisPlaying ? "0 4px 14px rgba(22,163,74,.3)" : "none",
                                                            transition:"box-shadow .2s",
                                                        }}>
                                                            {track.coverUrl
                                                                ? <img src={track.coverUrl} alt={track.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                                                                : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, color:"#16a34a" }}>♪</div>
                                                            }
                                                            {hoveredTrack === track._id && (
                                                                <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.4)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:14, borderRadius:10 }}>
                                                                    {isThisPlaying?"⏸":"▶"}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Info */}
                                                        <div style={{ flex:1, minWidth:0 }}>
                                                            <p style={{ fontSize:14, fontWeight:500, color: isThisPlaying?"#16a34a":"#111827", marginBottom:3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", transition:"color .2s" }}>
                                                                {track.title}
                                                            </p>
                                                            <Link
                                                                to={`/artists/${track.artistId._id}`}
                                                                onClick={e => e.stopPropagation()}
                                                                style={{ fontSize:12, color:"#9ca3af", textDecoration:"none", transition:"color .2s" }}
                                                                onMouseEnter={e => (e.currentTarget.style.color="#16a34a")}
                                                                onMouseLeave={e => (e.currentTarget.style.color="#9ca3af")}
                                                            >
                                                                {track.artistId.name}
                                                                {track.artistId.verified && <span style={{ color:"#16a34a", marginLeft:4, fontSize:10 }}>✓</span>}
                                                            </Link>
                                                        </div>

                                                        {/* Genre */}
                                                        {track.genre && (
                                                            <span style={{ fontSize:11, color:"#16a34a", background:"#f0fdf4", padding:"3px 10px", borderRadius:100, border:"1px solid rgba(22,163,74,.2)", flexShrink:0 }}>
                                                                {track.genre}
                                                            </span>
                                                        )}

                                                        {/* Plays */}
                                                        <div style={{ width:56, textAlign:"right", flexShrink:0 }}>
                                                            <p style={{ fontSize:12, color:"#6b7280", fontWeight:500 }}>{formatPlays(track.plays)}</p>
                                                        </div>

                                                        {/* Duration */}
                                                        <div style={{ width:44, textAlign:"right", flexShrink:0 }}>
                                                            <p style={{ fontSize:12, color:"#9ca3af" }}>{formatTime(track.duration)}</p>
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
                                        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
                                            <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:26, color:"#111827", letterSpacing:1.5 }}>{t.artistsSection}</span>
                                            <span style={{ fontSize:12, color:"#9ca3af", background:"#f3f4f6", padding:"3px 10px", borderRadius:100 }}>{artists.length}</span>
                                        </div>

                                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:16 }}>
                                            {artists.map((artist, idx) => (
                                                <Link
                                                    to={`/artists/${artist._id}`}
                                                    key={artist._id}
                                                    className="sp-artist-card"
                                                    style={{ animationDelay:`${idx*.06}s` }}
                                                >
                                                    {/* Avatar */}
                                                    <div style={{
                                                        width:80, height:80, borderRadius:"50%",
                                                        background:AVATAR_GRADIENTS[idx%AVATAR_GRADIENTS.length],
                                                        margin:"0 auto 14px",
                                                        display:"flex", alignItems:"center", justifyContent:"center",
                                                        fontFamily:"'Barlow Condensed',sans-serif",
                                                        fontSize:28, color:"#166534",
                                                        border:"2px solid rgba(22,163,74,.2)",
                                                        overflow:"hidden",
                                                        boxShadow:"0 4px 14px rgba(22,163,74,.1)",
                                                        position:"relative",
                                                    }}>
                                                        {artist.avatar
                                                            ? <img src={artist.avatar} alt={artist.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e => { e.currentTarget.style.display="none"; }} />
                                                            : getInitials(artist.name)
                                                        }
                                                        {artist.verified && (
                                                            <div style={{ position:"absolute", bottom:0, right:0, width:22, height:22, borderRadius:"50%", background:"#16a34a", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, border:"2px solid #fff" }}>✓</div>
                                                        )}
                                                    </div>

                                                    <p style={{ fontSize:14, fontWeight:600, color:"#111827", marginBottom:4 }}>{artist.name}</p>
                                                    <p style={{ fontSize:11, color:"#16a34a", marginBottom:10, fontWeight:500 }}>{artist.genre ?? "—"}</p>
                                                    <p style={{ fontSize:12, color:"#9ca3af" }}>
                                                        <span style={{ fontWeight:600, color:"#374151" }}>{formatFollowers(artist.followers)}</span> followers
                                                    </p>

                                                    {/* Mini EQ */}
                                                    <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"center", gap:2, height:12, marginTop:12 }}>
                                                        {[40,65,50,80,55].map((h,i) => (
                                                            <div key={i} style={{ width:3, height:`${h}%`, background:"rgba(22,163,74,.25)", borderRadius:2, transformOrigin:"bottom", animation:`spEq ${.4+i*.1}s ease-in-out infinite`, animationDelay:`${i*.07}s` }} />
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