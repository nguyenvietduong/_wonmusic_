import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─── Types ───────────────────────────────────────────────
export interface Track {
    id: string;
    title: string;
    artist: string;
    album?: string;
    coverUrl?: string;
    audioUrl: string;
    duration: number;
    genre?: string;
    releaseYear?: number;
    plays?: number;
}

// Inject từ ngoài — store không biết implementation
export interface PlayCountService {
    recordPlay: (trackId: string) => Promise<void>;
}

type RepeatMode = "off" | "one" | "all";

// ─── State & Actions ─────────────────────────────────────
interface PlayerState {
    queue: Track[];
    queueIndex: number;
    currentTrack: Track | null;
    isPlaying: boolean;
    currentTime: number;
    duration: number;

    volume: number;
    isMuted: boolean;
    repeatMode: RepeatMode;
    isShuffle: boolean;

    history: Track[];

    // ── Play count tracking ──
    playCountRecorded: boolean;     // đã tính lượt nghe cho bài hiện tại chưa
    playCountService: PlayCountService | null;

    play: (track: Track, queue?: Track[]) => void;
    pause: () => void;
    resume: () => void;
    togglePlay: () => void;

    next: () => void;
    prev: () => void;
    seekTo: (time: number) => void;
    setDuration: (duration: number) => void;
    setCurrentTime: (time: number) => void;

    setQueue: (tracks: Track[], startIndex?: number) => void;
    addToQueue: (track: Track) => void;
    removeFromQueue: (index: number) => void;
    clearQueue: () => void;

    setVolume: (volume: number) => void;
    toggleMute: () => void;

    setRepeatMode: (mode: RepeatMode) => void;
    toggleShuffle: () => void;

    clearHistory: () => void;

    // ── Service injection ──
    setPlayCountService: (service: PlayCountService) => void;
}

// ─── Helper ───────────────────────────────────────────────
const PLAY_THRESHOLD_SECONDS = 30;
const PLAY_THRESHOLD_PERCENT = 0.5;

function shouldRecordPlay(currentTime: number, duration: number): boolean {
    if (duration <= 0) return false;
    const passedSeconds  = currentTime >= PLAY_THRESHOLD_SECONDS;
    const passedPercent  = currentTime / duration >= PLAY_THRESHOLD_PERCENT;
    return passedSeconds || passedPercent;
}

// ─── Store ────────────────────────────────────────────────
export const usePlayerStore = create<PlayerState>()(
    persist(
        (set, get) => ({
            queue:        [],
            queueIndex:   0,
            currentTrack: null,
            isPlaying:    false,
            currentTime:  0,
            duration:     0,
            history:      [],

            volume:     0.8,
            isMuted:    false,
            repeatMode: "off",
            isShuffle:  false,

            // ── Play count ──
            playCountRecorded: false,
            playCountService:  null,

            play: (track, queue) => {
                const { history } = get();
                const newHistory = history[0]?.id === track.id
                    ? history
                    : [track, ...history].slice(0, 50);
                const newQueue = queue ?? [track];
                const idx = newQueue.findIndex((t) => t.id === track.id);
                set({
                    currentTrack:      track,
                    isPlaying:         true,
                    currentTime:       0,
                    queue:             newQueue,
                    queueIndex:        idx >= 0 ? idx : 0,
                    history:           newHistory,
                    playCountRecorded: false,   // reset mỗi khi đổi bài
                });
            },

            pause:      () => set({ isPlaying: false }),
            resume:     () => set({ isPlaying: true }),
            togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),

            next: () => {
                const { queue, queueIndex, repeatMode, isShuffle, history } = get();
                if (!queue.length) return;

                if (repeatMode === "one") {
                    // Lặp lại cùng bài — KHÔNG reset playCountRecorded
                    set({ currentTime: 0, isPlaying: true });
                    set((s) => ({ currentTrack: { ...s.currentTrack! } }));
                    return;
                }

                let nextIndex: number;
                if (isShuffle) {
                    const available = queue.map((_, i) => i).filter((i) => i !== queueIndex);
                    nextIndex = available.length
                        ? available[Math.floor(Math.random() * available.length)]
                        : queueIndex;
                } else {
                    nextIndex = queueIndex + 1;
                    if (nextIndex >= queue.length) {
                        nextIndex = repeatMode === "all" ? 0 : queueIndex;
                        if (repeatMode === "off") {
                            set({ isPlaying: false });
                            return;
                        }
                    }
                }

                const track = queue[nextIndex];
                const newHistory = history[0]?.id === track.id
                    ? history
                    : [track, ...history].slice(0, 50);
                set({
                    queueIndex:        nextIndex,
                    currentTrack:      track,
                    currentTime:       0,
                    isPlaying:         true,
                    history:           newHistory,
                    playCountRecorded: false,   // reset khi next
                });
            },

            prev: () => {
                const { queue, queueIndex, currentTime } = get();
                if (!queue.length) return;
            
                if (currentTime > 3) {
                    // Rewind cùng bài — KHÔNG reset playCountRecorded
                    set({ currentTime: 0 });
                    return;
                }
            
                // Đổi bài thật → reset
                const prevIndex = queueIndex > 0 ? queueIndex - 1 : 0;
                set({
                    queueIndex:        prevIndex,
                    currentTrack:      queue[prevIndex],
                    currentTime:       0,
                    isPlaying:         true,
                    playCountRecorded: false,
                });
            },

            seekTo: (time) => set({ currentTime: time }),
            setDuration: (duration) => set({ duration }),

            // ── Tick chính: kiểm tra threshold ──
            setCurrentTime: (time) => {
                const { duration, playCountRecorded, playCountService, currentTrack } = get();
                set({ currentTime: time });
            
                // Chỉ record khi duration đã load xong (> 0) VÀ chưa record
                if (
                    !playCountRecorded &&
                    playCountService &&
                    currentTrack &&
                    duration > 0 &&           // ← bắt buộc duration phải có
                    shouldRecordPlay(time, duration)
                ) {
                    set({ playCountRecorded: true });
                    playCountService.recordPlay(currentTrack.id).catch(() => {
                        set({ playCountRecorded: false });
                    });
                }
            },

            setQueue: (tracks, startIndex = 0) => {
                const track = tracks[startIndex];
                if (!track) return;
                set({
                    queue:             tracks,
                    queueIndex:        startIndex,
                    currentTrack:      track,
                    currentTime:       0,
                    isPlaying:         true,
                    playCountRecorded: false,
                });
            },

            addToQueue:      (track) => set((s) => ({ queue: [...s.queue, track] })),
            removeFromQueue: (index) => set((s) => {
                const queue      = s.queue.filter((_, i) => i !== index);
                const queueIndex = index < s.queueIndex
                    ? s.queueIndex - 1
                    : Math.min(s.queueIndex, queue.length - 1);
                return { queue, queueIndex };
            }),
            clearQueue: () => set({ queue: [], queueIndex: 0, currentTrack: null, isPlaying: false }),

            setVolume:  (volume) => set({ volume: Math.min(1, Math.max(0, volume)), isMuted: false }),
            toggleMute: ()       => set((s) => ({ isMuted: !s.isMuted })),

            setRepeatMode: (mode) => set({ repeatMode: mode }),
            toggleShuffle: ()     => set((s) => ({ isShuffle: !s.isShuffle })),

            clearHistory: () => set({ history: [] }),

            // ── Inject service ──
            setPlayCountService: (service) => set({ playCountService: service }),
        }),

        {
            name: "wonmusic-player",
            partialize: (s) => ({
                volume:     s.volume,
                isMuted:    s.isMuted,
                repeatMode: s.repeatMode,
                isShuffle:  s.isShuffle,
            }),
        }
    )
);