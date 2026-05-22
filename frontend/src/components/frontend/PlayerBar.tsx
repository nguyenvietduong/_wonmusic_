// src/components/frontend/PlayerBar.tsx
import { useRef, useEffect, useCallback, useState } from "react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { trackService } from "@/services/trackService";

import {
    FaPlay, FaPause, FaStepForward, FaStepBackward,
    FaRandom, FaRedo, FaVolumeUp, FaVolumeMute, FaVolumeDown,
    FaChevronDown, FaChevronUp, FaListUl, FaTimes,
} from "react-icons/fa";

const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
};

const getRatio = (el: HTMLDivElement, clientX: number) => {
    const rect = el.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
};

const PlayerBar = () => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const volumeRef = useRef<HTMLDivElement>(null);

    const isDraggingVolume = useRef(false);
    const isDraggingProgress = useRef(false);

    const [minimized, setMinimized] = useState(false);
    const [showQueue, setShowQueue] = useState(false);

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

    // ── Sync audio ──
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !currentTrack) return;
        const isSameUrl = audio.src === currentTrack.audioUrl ||
            audio.src === window.location.origin + currentTrack.audioUrl;
        if (!isSameUrl) {
            audio.src = currentTrack.audioUrl;
            audio.load();
            audio.currentTime = 0;
        }
    }, [currentTrack]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.volume = isMuted ? 0 : volume;
    }, [volume, isMuted]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        if (isPlaying) audio.play().catch(() => { });
        else audio.pause();
    }, [isPlaying, currentTrack]);

    useEffect(() => {
        setPlayCountService({
            recordPlay: (trackId) => trackService.incrementPlays(trackId),
        });
    }, []);

    // ── Progress drag ──
    const handleProgressMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!progressRef.current || !duration) return;
        isDraggingProgress.current = true;
        const apply = (clientX: number) => {
            const t = getRatio(progressRef.current!, clientX) * duration;
            seekTo(t);
            if (audioRef.current) audioRef.current.currentTime = t;
        };
        apply(e.clientX);
        const onMove = (ev: MouseEvent) => { if (isDraggingProgress.current) apply(ev.clientX); };
        const onUp = () => { isDraggingProgress.current = false; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    }, [duration, seekTo]);

    // ── Volume drag ──
    const handleVolumeMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!volumeRef.current) return;
        isDraggingVolume.current = true;
        const apply = (clientX: number) => setVolume(getRatio(volumeRef.current!, clientX));
        apply(e.clientX);
        const onMove = (ev: MouseEvent) => { if (isDraggingVolume.current) apply(ev.clientX); };
        const onUp = () => { isDraggingVolume.current = false; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    }, [setVolume]);

    // ── Đóng queue khi click ngoài ──
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
        if (currentTime > 3 && audioRef.current) {
            audioRef.current.currentTime = 0;  // reset audio element thật
        }
        prev();
    }, [prev]);

    const VolumeIcon = isMuted || volume === 0 ? FaVolumeMute
        : volume < 0.5 ? FaVolumeDown : FaVolumeUp;

    const pct = duration ? (currentTime / duration) * 100 : 0;

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
                @keyframes pbPulse {
                    0%,100% { opacity:1; transform:scale(1); }
                    50%     { opacity:.3; transform:scale(.6); }
                }
                @keyframes pbQueueIn {
                    from { opacity:0; transform:translateY(12px); }
                    to   { opacity:1; transform:translateY(0); }
                }
                @keyframes pbMinIn {
                    from { opacity:0; transform:translateY(20px); }
                    to   { opacity:1; transform:translateY(0); }
                }
                .pb-ctrl-btn {
                    display:flex; align-items:center; justify-content:center;
                    border-radius:50%; border:none; cursor:pointer;
                    transition:all .2s; background:transparent;
                }
                .pb-ctrl-btn:hover { background:#f3f4f6; }
                .pb-queue-item {
                    display:flex; align-items:center; gap:10px;
                    padding:8px 12px; border-radius:10px;
                    cursor:pointer; transition:background .15s;
                    position:relative;
                }
                .pb-queue-item:hover { background:#f0fdf4; }
                .pb-queue-item.active { background:#f0fdf4; }
            `}</style>

                    {/* ══════ QUEUE PANEL ══════ */}
                    {showQueue && (
                        <div
                            id="pb-queue-panel"
                            style={{
                                position: "fixed", bottom: 71, right: 16,
                                width: 320, maxHeight: 420,
                                background: "#fff",
                                border: "1px solid rgba(0,0,0,0.08)",
                                borderRadius: 16,
                                boxShadow: "0 -8px 40px rgba(0,0,0,0.12)",
                                zIndex: 51, overflow: "hidden",
                                display: "flex", flexDirection: "column",
                                animation: "pbQueueIn .2s ease",
                            }}
                        >
                            {/* Header */}
                            <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                                <div>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>Danh sách phát</p>
                                    <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{queue.length} bài hát</p>
                                </div>
                                <button onClick={() => setShowQueue(false)} className="pb-ctrl-btn" style={{ width: 28, height: 28, color: "#6b7280" }}>
                                    <FaTimes style={{ fontSize: 12 }} />
                                </button>
                            </div>

                            {/* Queue list */}
                            <div style={{ overflowY: "auto", flex: 1, padding: "8px" }}>
                                {queue.length === 0 ? (
                                    <div style={{ textAlign: "center", padding: "32px 0", color: "#9ca3af" }}>
                                        <div style={{ fontSize: 32, marginBottom: 8 }}>♪</div>
                                        <p style={{ fontSize: 13 }}>Danh sách trống</p>
                                    </div>
                                ) : queue.map((track, idx) => {
                                    const isCurrent = idx === queueIndex;
                                    return (
                                        <div key={`${track.id}-${idx}`} className={`pb-queue-item ${isCurrent ? "active" : ""}`}>
                                            {/* Cover */}
                                            <div style={{
                                                width: 40, height: 40, borderRadius: 8, overflow: "hidden", flexShrink: 0,
                                                background: "linear-gradient(135deg,#dcfce7,#86efac)",
                                                border: isCurrent ? "2px solid #16a34a" : "none",
                                            }}>
                                                {track.coverUrl
                                                    ? <img src={track.coverUrl} alt={track.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#16a34a" }}>♪</div>
                                                }
                                            </div>

                                            {/* Info */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ fontSize: 12, fontWeight: isCurrent ? 600 : 500, color: isCurrent ? "#16a34a" : "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                    {isCurrent && isPlaying && (
                                                        <span style={{ marginRight: 5 }}>▶</span>
                                                    )}
                                                    {track.title}
                                                </p>
                                                <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                    {track.artist}
                                                </p>
                                            </div>

                                            {/* Remove */}
                                            {!isCurrent && (
                                                <button
                                                    onClick={e => { e.stopPropagation(); removeFromQueue(idx); }}
                                                    className="pb-ctrl-btn"
                                                    style={{ width: 24, height: 24, color: "#d1d5db", flexShrink: 0, opacity: 0 }}
                                                    onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                                                    onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
                                                >
                                                    <FaTimes style={{ fontSize: 10 }} />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ══════ MINIMIZED BAR ══════ */}
                    {minimized && (
                        <div
                            style={{
                                position: "fixed", bottom: 16, right: 16, zIndex: 50,
                                display: "flex", alignItems: "center", gap: 10,
                                background: "#fff", borderRadius: 100,
                                padding: "8px 16px 8px 8px",
                                boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
                                border: "1px solid rgba(0,0,0,0.07)",
                                animation: "pbMinIn .25s ease",
                                cursor: "pointer",
                            }}
                            onClick={() => setMinimized(false)}
                        >
                            <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", flexShrink: 0 }}>
                                {currentTrack.coverUrl
                                    ? <img src={currentTrack.coverUrl} alt={currentTrack.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#16a34a" }}>♪</div>
                                }
                            </div>
                            <div style={{ maxWidth: 130 }}>
                                <p style={{ fontSize: 12, fontWeight: 500, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentTrack.title}</p>
                                <p style={{ fontSize: 10, color: "#9ca3af", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentTrack.artist}</p>
                            </div>
                            <button
                                onClick={e => { e.stopPropagation(); togglePlay(); }}
                                style={{ width: 32, height: 32, borderRadius: "50%", background: "#111827", border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
                            >
                                {isPlaying ? <FaPause style={{ fontSize: 11 }} /> : <FaPlay style={{ fontSize: 11, marginLeft: 1 }} />}
                            </button>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#f3f4f6", border: "none", color: "#374151", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                                <FaChevronUp style={{ fontSize: 10 }} />
                            </div>
                        </div>
                    )}

                    {/* ══════ MAIN BAR ══════ */}
                    {!minimized && (
                        <div className="fixed bottom-0 left-0 right-0 z-50" style={{ fontFamily: "'Be Vietnam Pro',sans-serif" }}>

                            {/* Progress scrubber */}
                            <div
                                ref={progressRef}
                                onMouseDown={handleProgressMouseDown}
                                className="relative w-full cursor-pointer group"
                                style={{ height: "3px", background: "rgba(0,0,0,0.06)", userSelect: "none" }}
                            >
                                <div className="absolute left-0 top-0 h-full" style={{ width: `${pct}%`, background: "#16a34a", transition: "width 0.15s linear" }} />
                                <div
                                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-[#16a34a] opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                    style={{ left: `calc(${pct}% - 6px)` }}
                                />
                            </div>

                            {/* Main bar */}
                            <div
                                className="flex items-center px-4 md:px-8 gap-4 md:gap-6"
                                style={{ height: "64px", background: "#ffffff", borderTop: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 -4px 24px rgba(0,0,0,0.06)" }}
                            >
                                {/* ── Trái ── */}
                                <div className="flex items-center gap-3 flex-shrink-0" style={{ width: "240px" }}>
                                    <div className="relative flex-shrink-0">
                                        <div className="w-10 h-10 rounded-md overflow-hidden flex items-center justify-center" style={{ background: "linear-gradient(135deg,#f0fdf4,#dcfce7)" }}>
                                            {currentTrack.coverUrl
                                                ? <img src={currentTrack.coverUrl} alt={currentTrack.title} className="w-full h-full object-cover" />
                                                : <span style={{ fontSize: "18px" }}>♪</span>
                                            }
                                        </div>
                                        {isPlaying && (
                                            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#16a34a] border-2 border-white" style={{ animation: "pbPulse 1.5s ease-in-out infinite" }} />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[13px] font-medium truncate leading-tight" style={{ color: "#111827" }}>
                                            {currentTrack.title}
                                        </p>
                                        <p className="text-[11px] truncate mt-0.5" style={{ color: "#6b7280" }}>
                                            {currentTrack.artist}
                                        </p>
                                    </div>
                                </div>

                                {/* ── Giữa ── */}
                                <div className="flex-1 flex flex-col items-center gap-1">
                                    <div className="flex items-center gap-2">
                                        <button onClick={toggleShuffle} title="Shuffle" className="pb-ctrl-btn w-8 h-8"
                                            style={{ color: isShuffle ? "#16a34a" : "#9ca3af", background: isShuffle ? "rgba(22,163,74,0.08)" : "transparent" }}>
                                            <FaRandom style={{ fontSize: "11px" }} />
                                        </button>
                                        <button onClick={handlePrev} className="pb-ctrl-btn w-8 h-8" style={{ color: "#374151" }}>
                                            <FaStepBackward style={{ fontSize: "13px" }} />
                                        </button>
                                        <button onClick={togglePlay} className="w-10 h-10 flex items-center justify-center rounded-full text-white transition-all hover:scale-105 active:scale-95"
                                            style={{ background: "#111827", boxShadow: "0 2px 12px rgba(0,0,0,0.2)", border: "none", cursor: "pointer" }}>
                                            {isPlaying ? <FaPause style={{ fontSize: "13px" }} /> : <FaPlay style={{ fontSize: "13px", marginLeft: "2px" }} />}
                                        </button>
                                        <button onClick={next} className="pb-ctrl-btn w-8 h-8" style={{ color: "#374151" }}>
                                            <FaStepForward style={{ fontSize: "13px" }} />
                                        </button>
                                        <button onClick={cycleRepeat} className="pb-ctrl-btn w-8 h-8 relative"
                                            title={repeatMode === "off" ? "Repeat off" : repeatMode === "all" ? "Repeat all" : "Repeat one"}
                                            style={{ color: repeatMode !== "off" ? "#16a34a" : "#9ca3af", background: repeatMode !== "off" ? "rgba(22,163,74,0.08)" : "transparent" }}>
                                            <FaRedo style={{ fontSize: "11px" }} />
                                            {repeatMode === "one" && (
                                                <span className="absolute font-bold" style={{ fontSize: "7px", top: "2px", right: "2px", lineHeight: 1, color: "#16a34a" }}>1</span>
                                            )}
                                        </button>
                                    </div>

                                    {/* Time row */}
                                    <div className="hidden md:flex items-center gap-2 w-full" style={{ maxWidth: "340px" }}>
                                        <span style={{ fontSize: "10px", color: "#9ca3af", minWidth: "28px", textAlign: "right" }}>{fmt(currentTime)}</span>
                                        <div className="flex-1 h-[2px] rounded-full" style={{ background: "#f3f4f6" }}>
                                            <div className="h-full rounded-full bg-[#16a34a]" style={{ width: `${pct}%`, transition: "width 0.15s linear" }} />
                                        </div>
                                        <span style={{ fontSize: "10px", color: "#9ca3af", minWidth: "28px" }}>{fmt(duration)}</span>
                                    </div>
                                </div>

                                {/* ── Phải ── */}
                                <div className="hidden md:flex items-center gap-2 flex-shrink-0 justify-end" style={{ width: "240px" }}>

                                    {/* Queue button — có badge số lượng */}
                                    <div style={{ position: "relative" }}>
                                        <button
                                            onClick={() => setShowQueue(v => !v)}
                                            className="pb-ctrl-btn w-8 h-8"
                                            title="Danh sách phát"
                                            style={{ color: showQueue ? "#16a34a" : "#9ca3af", background: showQueue ? "rgba(22,163,74,0.08)" : "transparent" }}
                                        >
                                            <FaListUl style={{ fontSize: "12px" }} />
                                        </button>
                                        {queue.length > 0 && (
                                            <span style={{
                                                position: "absolute", top: -4, right: -4,
                                                width: 16, height: 16, borderRadius: "50%",
                                                background: "#16a34a", color: "#fff",
                                                fontSize: 9, fontWeight: 700,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                border: "2px solid #fff",
                                            }}>
                                                {queue.length > 9 ? "9+" : queue.length}
                                            </span>
                                        )}
                                    </div>

                                    {/* Volume */}
                                    <div className="flex items-center gap-2">
                                        <button onClick={toggleMute} className="pb-ctrl-btn w-8 h-8" style={{ color: "#6b7280" }}>
                                            <VolumeIcon style={{ fontSize: "12px" }} />
                                        </button>
                                        <div
                                            ref={volumeRef}
                                            onMouseDown={handleVolumeMouseDown}
                                            className="relative cursor-pointer group rounded-full"
                                            style={{ width: "80px", height: "4px", background: "#e5e7eb", userSelect: "none" }}
                                        >
                                            <div
                                                className="absolute left-0 top-0 h-full rounded-full"
                                                style={{ width: `${isMuted ? 0 : volume * 100}%`, background: "#374151", transition: isDraggingVolume.current ? "none" : "width 0.1s" }}
                                            />
                                            <div
                                                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border border-gray-400 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                                                style={{ left: `calc(${isMuted ? 0 : volume * 100}% - 6px)` }}
                                            />
                                        </div>
                                        {/* Volume % */}
                                        <span style={{ fontSize: "10px", color: "#9ca3af", minWidth: "28px" }}>
                                            {isMuted ? "0" : Math.round(volume * 100)}%
                                        </span>
                                    </div>

                                    {/* Minimize */}
                                    <button
                                        onClick={() => setMinimized(true)}
                                        className="pb-ctrl-btn w-8 h-8"
                                        title="Thu nhỏ"
                                        style={{ color: "#9ca3af" }}
                                    >
                                        <FaChevronDown style={{ fontSize: "11px" }} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            <div style={{ height: currentTrack && !minimized ? "67px" : "0" }} />
        </>
    );
};

export default PlayerBar;