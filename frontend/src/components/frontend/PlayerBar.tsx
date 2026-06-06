// src/components/frontend/PlayerBar.tsx
import { useRef, useEffect, useCallback, useState } from "react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { trackService } from "@/services/trackService";

import {
    FaPlay, FaPause, FaStepForward, FaStepBackward,
    FaRandom, FaRedo, FaVolumeUp, FaVolumeMute, FaVolumeDown,
    FaChevronDown, FaListUl, FaTimes,
} from "react-icons/fa";

const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
};

const getRatio = (el: HTMLDivElement, clientX: number) =>
    Math.min(1, Math.max(0, (clientX - el.getBoundingClientRect().left) / el.getBoundingClientRect().width));

const EQ_H = [38, 72, 52, 88, 44, 78];

const PlayerBar = () => {
    const audioRef       = useRef<HTMLAudioElement>(null);
    const progressRef    = useRef<HTMLDivElement>(null);
    const volumeRef      = useRef<HTMLDivElement>(null);
    const isDraggingVol  = useRef(false);
    const isDraggingProg = useRef(false);
    const [minimized, setMinimized] = useState(false);
    const [showQueue,  setShowQueue]  = useState(false);

    const {
        currentTrack, isPlaying,
        currentTime, duration,
        volume, isMuted,
        repeatMode, isShuffle,
        queue, queueIndex,
        togglePlay, next, prev,
        seekTo, setDuration, setCurrentTime,
        setVolume, toggleMute,
        setRepeatMode, toggleShuffle,
        removeFromQueue,
        setPlayCountService,
    } = usePlayerStore();

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !currentTrack) return;
        const same = audio.src === currentTrack.audioUrl ||
            audio.src === window.location.origin + currentTrack.audioUrl;
        if (!same) { audio.src = currentTrack.audioUrl; audio.load(); audio.currentTime = 0; }
    }, [currentTrack]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.volume = isMuted ? 0 : volume;
    }, [volume, isMuted]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        if (isPlaying) audio.play().catch(() => {});
        else audio.pause();
    }, [isPlaying, currentTrack]);

    useEffect(() => {
        setPlayCountService({ recordPlay: (id) => trackService.incrementPlays(id) });
    }, []);

    const handleProgressMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!progressRef.current || !duration) return;
        isDraggingProg.current = true;
        const apply = (x: number) => {
            const t = getRatio(progressRef.current!, x) * duration;
            seekTo(t);
            if (audioRef.current) audioRef.current.currentTime = t;
        };
        apply(e.clientX);
        const onMove = (ev: MouseEvent) => { if (isDraggingProg.current) apply(ev.clientX); };
        const onUp   = () => { isDraggingProg.current = false; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup",   onUp);
    }, [duration, seekTo]);

    const handleVolumeMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!volumeRef.current) return;
        isDraggingVol.current = true;
        const apply = (x: number) => setVolume(getRatio(volumeRef.current!, x));
        apply(e.clientX);
        const onMove = (ev: MouseEvent) => { if (isDraggingVol.current) apply(ev.clientX); };
        const onUp   = () => { isDraggingVol.current = false; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup",   onUp);
    }, [setVolume]);

    useEffect(() => {
        if (!showQueue) return;
        const handler = (e: MouseEvent) => {
            const el = document.getElementById("pb-queue-panel");
            if (el && !el.contains(e.target as Node)) setShowQueue(false);
        };
        setTimeout(() => document.addEventListener("mousedown", handler), 0);
        return () => document.removeEventListener("mousedown", handler);
    }, [showQueue]);

    const cycleRepeat = () => {
        const modes: Array<"off" | "one" | "all"> = ["off", "all", "one"];
        setRepeatMode(modes[(modes.indexOf(repeatMode) + 1) % modes.length]);
    };

    const handlePrev = useCallback(() => {
        const { currentTime } = usePlayerStore.getState();
        if (currentTime > 3 && audioRef.current) audioRef.current.currentTime = 0;
        prev();
    }, [prev]);

    const VolumeIcon = isMuted || volume === 0 ? FaVolumeMute : volume < 0.5 ? FaVolumeDown : FaVolumeUp;
    const pct        = duration ? (currentTime / duration) * 100 : 0;
    const volPct     = isMuted ? 0 : volume * 100;

    return (
        <>
            <audio
                ref={audioRef}
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                onEnded={next}
            />

            {currentTrack && (
                <>
                <style>{`
                    @keyframes pbEq  { 0%,100%{transform:scaleY(.18)} 50%{transform:scaleY(1)} }
                    @keyframes pbDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.25;transform:scale(.5)} }
                    @keyframes pbQueueIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
                    @keyframes pbMinIn   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
                    @keyframes pbGlow    { 0%,100%{box-shadow:0 0 18px rgba(0,169,143,.3)} 50%{box-shadow:0 0 36px rgba(0,169,143,.55)} }
                    @keyframes pbSpin    { to{transform:rotate(360deg)} }

                    /* progress scrubber */
                    .pb-scrubber { height:4px; background:rgba(0,0,0,.07); position:relative; cursor:pointer; transition:height .18s; user-select:none; }
                    .pb-scrubber:hover { height:6px; }
                    .pb-scrubber-fill { position:absolute; left:0; top:0; height:100%; background:linear-gradient(90deg,#00A98F,#34D4B8); transition:width .15s linear; }
                    .pb-scrubber-thumb { position:absolute; top:50%; transform:translate(-50%,-50%); width:13px; height:13px; border-radius:50%; background:#E8E8F4; border:2px solid #34D4B8; box-shadow:0 0 8px rgba(0,169,143,.5); opacity:0; transition:opacity .18s; pointer-events:none; }
                    .pb-scrubber:hover .pb-scrubber-thumb { opacity:1; }

                    /* ctrl button */
                    .pb-btn { display:flex; align-items:center; justify-content:center; border-radius:50%; border:none; cursor:pointer; transition:all .2s; background:transparent; flex-shrink:0; }
                    .pb-btn:hover { background:rgba(0,0,0,.06); }

                    /* queue panel */
                    .pb-queue-item { display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:10px; cursor:pointer; transition:background .15s; }
                    .pb-queue-item:hover { background:rgba(0,0,0,.05); }
                    .pb-queue-item.active { background:rgba(0,169,143,.1); }

                    /* volume slider */
                    .pb-vol { position:relative; cursor:pointer; border-radius:100px; user-select:none; }
                    .pb-vol:hover .pb-vol-thumb { opacity:1; }
                    .pb-vol-thumb { position:absolute; top:50%; transform:translate(-50%,-50%); width:11px; height:11px; border-radius:50%; background:#D8DCF0; opacity:0; transition:opacity .18s; pointer-events:none; box-shadow:0 0 6px rgba(0,169,143,.4); }
                `}</style>

                {/* ── Queue panel ── */}
                {showQueue && (
                    <div id="pb-queue-panel" style={{
                        position:"fixed", bottom:80, right:16, zIndex:51,
                        width:320, maxHeight:430,
                        background:"rgba(248,248,252,.97)",
                        backdropFilter:"blur(24px)",
                        border:"1px solid rgba(0,169,143,.18)",
                        borderRadius:18,
                        boxShadow:"0 -12px 48px rgba(0,0,0,.12), 0 0 0 1px rgba(0,169,143,.06)",
                        display:"flex", flexDirection:"column",
                        animation:"pbQueueIn .22s ease",
                        overflow:"hidden",
                        fontFamily:"'Be Vietnam Pro',sans-serif",
                    }}>
                        {/* Header */}
                        <div style={{ padding:"14px 16px 12px", borderBottom:"1px solid rgba(0,0,0,.06)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
                            <div>
                                <p style={{ fontSize:13, fontWeight:700, color:"#0D0D1A", fontFamily:"'Space Grotesk',sans-serif" }}>Danh sách phát</p>
                                <p style={{ fontSize:11, color:"rgba(0,0,0,.45)", marginTop:3 }}>{queue.length} bài hát</p>
                            </div>
                            <button onClick={() => setShowQueue(false)} className="pb-btn" style={{ width:28, height:28, color:"rgba(0,0,0,.4)" }}>
                                <FaTimes style={{ fontSize:11 }} />
                            </button>
                        </div>

                        {/* List */}
                        <div style={{ overflowY:"auto", flex:1, padding:"8px" }}>
                            {queue.length === 0 ? (
                                <div style={{ textAlign:"center", padding:"36px 0", color:"rgba(0,0,0,.35)" }}>
                                    <div style={{ fontSize:36, marginBottom:10, opacity:.4 }}>♪</div>
                                    <p style={{ fontSize:13 }}>Danh sách trống</p>
                                </div>
                            ) : queue.map((track, idx) => {
                                const isCurrent = idx === queueIndex;
                                return (
                                    <div key={`${track.id}-${idx}`} className={`pb-queue-item ${isCurrent ? "active" : ""}`}>
                                        <div style={{
                                            width:40, height:40, borderRadius:10, overflow:"hidden", flexShrink:0,
                                            background:"rgba(0,0,0,.05)",
                                            border: isCurrent ? "2px solid rgba(0,169,143,.5)" : "1px solid rgba(0,0,0,.07)",
                                            boxShadow: isCurrent ? "0 0 12px rgba(0,169,143,.25)" : "none",
                                        }}>
                                            {track.coverUrl
                                                ? <img src={track.coverUrl} alt={track.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                                                : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, color:"#34D4B8" }}>♪</div>
                                            }
                                        </div>
                                        <div style={{ flex:1, minWidth:0 }}>
                                            <p style={{ fontSize:12, fontWeight: isCurrent ? 600 : 400, color: isCurrent ? "#34D4B8" : "#0D0D1A", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                                                {isCurrent && isPlaying && (
                                                    <span style={{ display:"inline-flex", alignItems:"flex-end", gap:1.5, height:10, marginRight:6, verticalAlign:"middle" }}>
                                                        {[40,80,55].map((h,i) => (
                                                            <span key={i} style={{ display:"inline-block", width:2.5, height:`${h}%`, background:"#34D4B8", borderRadius:2, transformOrigin:"bottom", animation:`pbEq ${.38+i*.13}s ease-in-out infinite`, animationDelay:`${i*.07}s` }} />
                                                        ))}
                                                    </span>
                                                )}
                                                {track.title}
                                            </p>
                                            <p style={{ fontSize:11, color:"rgba(0,0,0,.45)", marginTop:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                                                {track.artist}
                                            </p>
                                        </div>
                                        {!isCurrent && (
                                            <button
                                                onClick={e => { e.stopPropagation(); removeFromQueue(idx); }}
                                                className="pb-btn"
                                                style={{ width:24, height:24, color:"rgba(0,0,0,.3)", flexShrink:0, opacity:0 }}
                                                onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                                                onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
                                            >
                                                <FaTimes style={{ fontSize:10 }} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── Minimized pill ── */}
                {minimized && (
                    <div
                        style={{
                            position:"fixed", bottom:16, right:16, zIndex:50,
                            display:"flex", alignItems:"center", gap:10,
                            background:"rgba(248,248,252,.97)",
                            backdropFilter:"blur(20px)",
                            borderRadius:100,
                            padding:"8px 16px 8px 8px",
                            boxShadow:"0 8px 32px rgba(0,0,0,.12), 0 0 0 1px rgba(0,169,143,.18)",
                            border:"1px solid rgba(0,169,143,.18)",
                            animation:"pbMinIn .25s ease",
                            cursor:"pointer",
                            fontFamily:"'Be Vietnam Pro',sans-serif",
                        }}
                        onClick={() => setMinimized(false)}
                    >
                        <div style={{ width:36, height:36, borderRadius:"50%", overflow:"hidden", background:"rgba(0,0,0,.05)", flexShrink:0, border:"1px solid rgba(0,169,143,.3)" }}>
                            {currentTrack.coverUrl
                                ? <img src={currentTrack.coverUrl} alt={currentTrack.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                                : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, color:"#34D4B8" }}>♪</div>
                            }
                        </div>
                        <div style={{ maxWidth:130 }}>
                            <p style={{ fontSize:12, fontWeight:600, color:"#0D0D1A", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{currentTrack.title}</p>
                            <p style={{ fontSize:10, color:"rgba(0,0,0,.45)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{currentTrack.artist}</p>
                        </div>
                        <button
                            onClick={e => { e.stopPropagation(); togglePlay(); }}
                            style={{ width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg,#00A98F,#34D4B8)", border:"none", color:"#0A0A12", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0, boxShadow:"0 0 14px rgba(0,169,143,.4)" }}
                        >
                            {isPlaying ? <FaPause style={{ fontSize:11 }} /> : <FaPlay style={{ fontSize:11, marginLeft:1 }} />}
                        </button>
                        <div style={{ width:30, height:30, borderRadius:"50%", background:"rgba(0,0,0,.06)", display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(0,0,0,.5)", fontSize:11 }}>
                            ↑
                        </div>
                    </div>
                )}

                {/* ── Main bar ── */}
                {!minimized && (
                    <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:50, fontFamily:"'Be Vietnam Pro',sans-serif" }}>

                        {/* Progress scrubber — full width top */}
                        <div
                            ref={progressRef}
                            className="pb-scrubber"
                            onMouseDown={handleProgressMouseDown}
                        >
                            <div className="pb-scrubber-fill" style={{ width:`${pct}%` }} />
                            <div className="pb-scrubber-thumb" style={{ left:`${pct}%` }} />
                        </div>

                        {/* Bar body */}
                        <div style={{
                            height:72,
                            background:"rgba(248,248,252,.97)",
                            backdropFilter:"blur(24px)",
                            borderTop:"1px solid rgba(0,169,143,.15)",
                            boxShadow:"0 -8px 40px rgba(0,0,0,.08)",
                            display:"flex", alignItems:"center",
                            padding:"0 24px", gap:16,
                        }}>

                            {/* ── LEFT: track info ── */}
                            <div style={{ display:"flex", alignItems:"center", gap:12, width:260, flexShrink:0, minWidth:0 }}>

                                {/* Cover with EQ overlay */}
                                <div style={{ position:"relative", flexShrink:0 }}>
                                    {/* Spinning ring when playing */}
                                    {isPlaying && (
                                        <div style={{ position:"absolute", inset:-5, borderRadius:"50%", border:"1.5px dashed rgba(0,169,143,.35)", animation:"pbSpin 8s linear infinite" }} />
                                    )}
                                    <div style={{
                                        width:46, height:46, borderRadius:12, overflow:"hidden",
                                        background:"rgba(0,0,0,.05)",
                                        border: isPlaying ? "1.5px solid rgba(0,169,143,.45)" : "1px solid rgba(0,0,0,.08)",
                                        boxShadow: isPlaying ? "0 0 18px rgba(0,169,143,.28), 0 4px 20px rgba(0,0,0,.5)" : "0 4px 16px rgba(0,0,0,.4)",
                                        position:"relative",
                                        transition:"all .3s",
                                        flexShrink:0,
                                    }}>
                                        {currentTrack.coverUrl
                                            ? <img src={currentTrack.coverUrl} alt={currentTrack.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                                            : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, color:"#34D4B8" }}>♪</div>
                                        }
                                        {/* EQ bars overlay on cover */}
                                        {isPlaying && (
                                            <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"flex-end", justifyContent:"center", gap:2, paddingBottom:5, borderRadius:12 }}>
                                                {EQ_H.map((h, i) => (
                                                    <div key={i} style={{ width:3, height:`${h}%`, background:"linear-gradient(to top,#00A98F,#34D4B8)", borderRadius:2, transformOrigin:"bottom", animation:`pbEq ${.36+i*.1}s ease-in-out infinite`, animationDelay:`${i*.055}s` }} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Title + artist */}
                                <div style={{ flex:1, minWidth:0 }}>
                                    <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:3 }}>
                                        {isPlaying && (
                                            <span style={{ width:5, height:5, borderRadius:"50%", background:"#34D4B8", display:"inline-block", flexShrink:0, animation:"pbDot 1.6s ease-in-out infinite" }} />
                                        )}
                                        <p style={{ fontSize:13, fontWeight:600, color:"#0D0D1A", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", lineHeight:1.3 }}>
                                            {currentTrack.title}
                                        </p>
                                    </div>
                                    <p style={{ fontSize:11, color:"rgba(0,0,0,.45)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                                        {currentTrack.artist}
                                    </p>
                                </div>
                            </div>

                            {/* ── CENTER: controls + mini progress ── */}
                            <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:8, minWidth:0 }}>

                                {/* Buttons */}
                                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                    <button onClick={toggleShuffle} className="pb-btn" style={{ width:32, height:32, color: isShuffle ? "#34D4B8" : "rgba(0,0,0,.45)", background: isShuffle ? "rgba(0,169,143,.12)" : "transparent" }}>
                                        <FaRandom style={{ fontSize:11 }} />
                                    </button>
                                    <button onClick={handlePrev} className="pb-btn" style={{ width:36, height:36, color:"rgba(0,0,0,.7)" }}>
                                        <FaStepBackward style={{ fontSize:14 }} />
                                    </button>

                                    {/* Play/Pause — gradient circle */}
                                    <button
                                        onClick={togglePlay}
                                        style={{
                                            width:46, height:46, borderRadius:"50%",
                                            background:"linear-gradient(135deg,#00A98F,#34D4B8)",
                                            border:"none", color:"#050812", cursor:"pointer",
                                            display:"flex", alignItems:"center", justifyContent:"center",
                                            boxShadow:"0 0 22px rgba(0,169,143,.45), 0 4px 16px rgba(0,0,0,.4)",
                                            transition:"all .2s",
                                            animation: isPlaying ? "pbGlow 3s ease-in-out infinite" : "none",
                                            flexShrink:0,
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.08)")}
                                        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                                    >
                                        {isPlaying
                                            ? <FaPause  style={{ fontSize:14 }} />
                                            : <FaPlay   style={{ fontSize:14, marginLeft:2 }} />
                                        }
                                    </button>

                                    <button onClick={next} className="pb-btn" style={{ width:36, height:36, color:"rgba(0,0,0,.7)" }}>
                                        <FaStepForward style={{ fontSize:14 }} />
                                    </button>
                                    <button onClick={cycleRepeat} className="pb-btn" style={{ width:32, height:32, color: repeatMode !== "off" ? "#34D4B8" : "rgba(0,0,0,.45)", background: repeatMode !== "off" ? "rgba(0,169,143,.12)" : "transparent", position:"relative" }}>
                                        <FaRedo style={{ fontSize:11 }} />
                                        {repeatMode === "one" && (
                                            <span style={{ position:"absolute", top:2, right:2, fontSize:7, fontWeight:700, lineHeight:1, color:"#34D4B8", fontFamily:"'Space Grotesk',sans-serif" }}>1</span>
                                        )}
                                    </button>
                                </div>

                                {/* Mini progress + time */}
                                <div style={{ display:"flex", alignItems:"center", gap:8, width:"100%", maxWidth:380 }}>
                                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"rgba(0,0,0,.4)", minWidth:32, textAlign:"right" }}>{fmt(currentTime)}</span>
                                    <div style={{ flex:1, height:3, borderRadius:100, background:"rgba(0,0,0,.08)", overflow:"hidden" }}>
                                        <div style={{ height:"100%", borderRadius:100, background:"linear-gradient(90deg,#00A98F,#34D4B8)", width:`${pct}%`, transition:"width .15s linear" }} />
                                    </div>
                                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"rgba(0,0,0,.4)", minWidth:32 }}>{fmt(duration)}</span>
                                </div>
                            </div>

                            {/* ── RIGHT: queue + volume + minimize ── */}
                            <div style={{ display:"flex", alignItems:"center", gap:8, width:260, flexShrink:0, justifyContent:"flex-end" }}>

                                {/* Queue */}
                                <div style={{ position:"relative" }}>
                                    <button
                                        onClick={() => setShowQueue(v => !v)}
                                        className="pb-btn"
                                        style={{ width:32, height:32, color: showQueue ? "#34D4B8" : "rgba(0,0,0,.5)", background: showQueue ? "rgba(0,169,143,.12)" : "transparent" }}
                                        title="Danh sách phát"
                                    >
                                        <FaListUl style={{ fontSize:12 }} />
                                    </button>
                                    {queue.length > 0 && (
                                        <span style={{
                                            position:"absolute", top:-3, right:-3,
                                            width:15, height:15, borderRadius:"50%",
                                            background:"linear-gradient(135deg,#00A98F,#34D4B8)",
                                            color:"#050812", fontSize:8, fontWeight:700,
                                            display:"flex", alignItems:"center", justifyContent:"center",
                                            border:"2px solid rgba(248,248,252,.97)",
                                            fontFamily:"'Space Grotesk',sans-serif",
                                        }}>
                                            {queue.length > 9 ? "9+" : queue.length}
                                        </span>
                                    )}
                                </div>

                                {/* Volume */}
                                <button onClick={toggleMute} className="pb-btn" style={{ width:32, height:32, color:"rgba(0,0,0,.5)" }}>
                                    <VolumeIcon style={{ fontSize:13 }} />
                                </button>
                                <div
                                    ref={volumeRef}
                                    className="pb-vol"
                                    onMouseDown={handleVolumeMouseDown}
                                    style={{ width:80, height:4, background:"rgba(0,0,0,.1)" }}
                                >
                                    <div style={{ position:"absolute", left:0, top:0, height:"100%", borderRadius:100, background:"linear-gradient(90deg,#00A98F,#34D4B8)", width:`${volPct}%`, transition: isDraggingVol.current ? "none" : "width .1s" }} />
                                    <div className="pb-vol-thumb" style={{ left:`${volPct}%` }} />
                                </div>
                                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"rgba(0,0,0,.35)", minWidth:30, textAlign:"right" }}>
                                    {Math.round(volPct)}%
                                </span>

                                {/* Minimize */}
                                <button onClick={() => setMinimized(true)} className="pb-btn" style={{ width:32, height:32, color:"rgba(0,0,0,.4)" }} title="Thu nhỏ">
                                    <FaChevronDown style={{ fontSize:11 }} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                </>
            )}

            <div style={{ height: currentTrack && !minimized ? "76px" : "0" }} />
        </>
    );
};

export default PlayerBar;
