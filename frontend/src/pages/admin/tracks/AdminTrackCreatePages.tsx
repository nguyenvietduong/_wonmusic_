'use client';
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ChevronLeft, Music, Upload, Image as ImageIcon,
    Mic2, Tag, Calendar, FileAudio,
    CheckCircle2, XCircle, Eye, EyeOff,
    Loader2, AlertCircle, ChevronDown, Play, Pause,
    Volume2, VolumeX, Plus, Link2, X,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { artistService } from "@/services/artistService";
import { genreService } from "@/services/genreService";
import { SearchableSelect, type SelectOption } from "@/components/admin/SearchableSelect";

const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

const WAVE = Array.from({ length: 40 }, (_, i) =>
    18 + Math.abs(Math.sin(i * 0.38) * 50 + Math.cos(i * 0.71) * 22)
);

interface TrackForm {
    title: string;
    artistId: string;
    duration: number;
    genre: string;
    releaseYear: string;
    isPublished: boolean;
    audioUrl: string;
    coverUrl: string;
}

type SourceMode = "upload" | "url";

const EMPTY: TrackForm = {
    title: "", artistId: "",
    duration: 0, genre: "",
    releaseYear: String(new Date().getFullYear()),
    isPublished: true,
    audioUrl: "", coverUrl: "",
};

const inputCls = "w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400 bg-white transition-shadow";
const selectCls = `${inputCls} appearance-none pr-10 cursor-pointer`;

export default function AdminTrackCreatePages() {
    const router = useRouter();

    const [artists, setArtists]             = useState<any[]>([]);
    const [loadingArtists, setLoadingArtists] = useState(true);
    const [genreList, setGenreList]         = useState<string[]>([]);
    const [saving, setSaving]         = useState(false);
    const [error, setError]           = useState<string | null>(null);
    const [sourceMode, setSourceMode] = useState<SourceMode>("upload");

    // ── audio player ──
    const audioRef  = useRef<HTMLAudioElement>(null);
    const rafRef    = useRef<number>(0);
    const [playing, setPlaying]       = useState(false);
    const [muted, setMuted]           = useState(false);
    const [progress, setProgress]     = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume]         = useState(80);

    // ── files ──
    const [coverDrag, setCoverDrag]   = useState(false);
    const [audioDrag, setAudioDrag]   = useState(false);
    const [coverPreview, setCoverPreview] = useState("");
    const [audioPreview, setAudioPreview] = useState("");
    const coverInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);
    const pendingCoverFile = useRef<File | null>(null);
    const pendingAudioFile = useRef<File | null>(null);
    const coverBlobUrl     = useRef("");
    const audioBlobUrl     = useRef("");

    // ── form ──
    const [form, setForm]     = useState<TrackForm>(EMPTY);
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const set   = (k: keyof TrackForm, v: any) => setForm(p => ({ ...p, [k]: v }));
    const touch = (k: string) => setTouched(p => ({ ...p, [k]: true }));

    // ── validation ──
    const titleOk  = !!form.title.trim();
    const artistOk = !!form.artistId;
    const audioOk  = sourceMode === "url" ? !!form.audioUrl.trim() : !!pendingAudioFile.current;
    const isValid  = titleOk && artistOk && audioOk;

    const missing = [
        !titleOk  && "tên bài hát",
        !artistOk && "nghệ sĩ",
        !audioOk  && "audio",
    ].filter(Boolean) as string[];

    useEffect(() => {
        return () => {
            if (coverBlobUrl.current) URL.revokeObjectURL(coverBlobUrl.current);
            if (audioBlobUrl.current) URL.revokeObjectURL(audioBlobUrl.current);
        };
    }, []);

    useEffect(() => {
        artistService.getAll({ limit: 200 })
            .then(res => setArtists(Array.isArray(res) ? res : res?.data ?? []))
            .catch(() => {})
            .finally(() => setLoadingArtists(false));

        genreService.getAll()
            .then(list => setGenreList(list.map(g => g.name)))
            .catch(() => {});
    }, []);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.volume = volume / 100;
        audio.muted  = muted;
    }, [volume, muted]);

    const tick = () => {
        const a = audioRef.current;
        if (!a) return;
        setCurrentTime(a.currentTime);
        setProgress((a.currentTime / (a.duration || 1)) * 100);
        rafRef.current = requestAnimationFrame(tick);
    };

    const togglePlay = () => {
        const a = audioRef.current;
        if (!a) return;
        if (playing) { a.pause(); cancelAnimationFrame(rafRef.current); }
        else { a.play(); rafRef.current = requestAnimationFrame(tick); }
        setPlaying(p => !p);
    };

    const seek = (e: React.MouseEvent<HTMLDivElement>) => {
        const a = audioRef.current;
        if (!a) return;
        const r = e.currentTarget.getBoundingClientRect();
        a.currentTime = ((e.clientX - r.left) / r.width) * (a.duration || 0);
    };

    const handleFileSelect = (file: File, type: "cover" | "audio") => {
        if (type === "cover") {
            pendingCoverFile.current = file;
            if (coverBlobUrl.current) URL.revokeObjectURL(coverBlobUrl.current);
            const url = URL.createObjectURL(file);
            coverBlobUrl.current = url;
            setCoverPreview(url);
            touch("cover");
        } else {
            pendingAudioFile.current = file;
            if (audioBlobUrl.current) URL.revokeObjectURL(audioBlobUrl.current);
            const url = URL.createObjectURL(file);
            audioBlobUrl.current = url;
            setAudioPreview(url);
            touch("audio");
            const tmp = new Audio(url);
            tmp.onloadedmetadata = () => {
                if (tmp.duration && isFinite(tmp.duration))
                    set("duration", Math.round(tmp.duration));
            };
            setPlaying(false); setProgress(0); setCurrentTime(0);
            cancelAnimationFrame(rafRef.current);
        }
    };

    const handleCreate = async () => {
        setTouched({ title: true, artistId: true, audio: true });
        if (!titleOk)  { setError("Tên bài hát không được để trống."); return; }
        if (!artistOk) { setError("Vui lòng chọn nghệ sĩ."); return; }
        if (!audioOk)  { setError(sourceMode === "url" ? "Vui lòng nhập URL audio." : "Vui lòng chọn file âm thanh."); return; }

        setSaving(true); setError(null);
        try {
            let res;
            if (sourceMode === "url") {
                res = await axios.post("/api/tracks", {
                    title: form.title, artistId: form.artistId,
                    duration: form.duration, genre: form.genre,
                    releaseYear: form.releaseYear || undefined,
                    isPublished: form.isPublished,
                    audioUrl: form.audioUrl,
                    coverUrl: form.coverUrl || undefined,
                });
            } else {
                const fd = new FormData();
                fd.append("title", form.title);
                fd.append("artistId", form.artistId);
                fd.append("duration", String(form.duration));
                fd.append("genre", form.genre);
                fd.append("isPublished", String(form.isPublished));
                if (form.releaseYear) fd.append("releaseYear", form.releaseYear);
                if (pendingAudioFile.current) fd.append("audio", pendingAudioFile.current);
                if (pendingCoverFile.current) fd.append("cover", pendingCoverFile.current);
                res = await axios.post("/api/tracks", fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            }
            toast.success("Tạo bài hát thành công!");
            router.push(`/admin/tracks/${res.data.data._id}`);
        } catch (e: any) {
            setError(e?.response?.data?.message ?? "Tạo bài hát thất bại. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

    const steps = [
        { label: "Tên bài hát", done: titleOk,  required: true  },
        { label: "Nghệ sĩ",     done: artistOk, required: true  },
        { label: "Audio",        done: audioOk,  required: true  },
        { label: "Ảnh bìa",     done: !!pendingCoverFile.current || !!form.coverUrl, required: false },
    ];

    // ── Saving overlay ──
    if (saving) return (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center">
                <Loader2 size={28} className="text-indigo-600 animate-spin" />
            </div>
            <div className="text-center">
                <p className="text-base font-semibold text-gray-800">Đang tạo bài hát...</p>
                <p className="text-sm text-gray-400 mt-1">Vui lòng không đóng trang</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-full pb-10">

            {/* Hidden audio + file inputs */}
            {audioPreview && (
                <audio ref={audioRef} src={audioPreview}
                    onEnded={() => { setPlaying(false); setProgress(0); setCurrentTime(0); cancelAnimationFrame(rafRef.current); }}
                />
            )}
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f, "cover"); e.target.value = ""; }} />
            <input ref={audioInputRef} type="file" accept="audio/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f, "audio"); e.target.value = ""; }} />

            {/* ── Page header ── */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-4">
                    <Link href="/admin/tracks"
                        className="w-9 h-9 rounded-full border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-all shadow-sm">
                        <ChevronLeft size={18} />
                    </Link>
                    <div>
                        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                            <Link href="/admin/tracks" className="hover:text-indigo-600 transition-colors">Bài hát</Link>
                            <span>/</span>
                            <span className="text-gray-700 font-medium">Tạo mới</span>
                        </nav>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                            {form.title || <span className="text-gray-300 font-normal">Chưa có tên...</span>}
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {!isValid && missing.length > 0 && (
                        <span className="hidden sm:flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                            <AlertCircle size={12} /> Thiếu: {missing.join(", ")}
                        </span>
                    )}
                    <Link href="/admin/tracks"
                        className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                        Huỷ
                    </Link>
                    <button
                        onClick={handleCreate}
                        disabled={!isValid}
                        className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
                    >
                        <Plus size={15} /> Tạo bài hát
                    </button>
                </div>
            </div>

            {/* ── Error ── */}
            {error && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-6">
                    <AlertCircle size={15} className="flex-shrink-0" />
                    <span className="flex-1">{error}</span>
                    <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 cursor-pointer">
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* ── Content grid ── */}
            <div className="grid grid-cols-3 gap-7 items-start">

                {/* ══════ Left: form (2/3) ══════ */}
                <div className="col-span-2 space-y-5">

                    {/* Section: thông tin cơ bản */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
                            <div className="w-1 h-4 rounded-full bg-indigo-600 flex-shrink-0" />
                            <h2 className="text-sm font-semibold text-gray-800">Thông tin bài hát</h2>
                        </div>
                        <div className="px-6 py-6 space-y-5">

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tên bài hát <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        autoFocus
                                        value={form.title}
                                        onChange={e => set("title", e.target.value)}
                                        onBlur={() => touch("title")}
                                        placeholder="Nhập tên bài hát..."
                                        maxLength={120}
                                        className={`${inputCls} ${touched.title && !titleOk ? "border-red-400 ring-2 ring-red-100" : ""}`}
                                    />
                                    <span className="absolute right-3 bottom-3 text-[10px] text-gray-300 pointer-events-none">
                                        {form.title.length}/120
                                    </span>
                                </div>
                                {touched.title && !titleOk && (
                                    <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
                                        <AlertCircle size={10} /> Tên bài hát không được để trống
                                    </p>
                                )}
                            </div>

                            {/* Artist + Genre */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nghệ sĩ <span className="text-red-500">*</span>
                                    </label>
                                    {loadingArtists ? (
                                        <div className={`${inputCls} flex items-center gap-2 text-gray-400`}>
                                            <Loader2 size={13} className="animate-spin" /> Đang tải...
                                        </div>
                                    ) : (
                                        <SearchableSelect
                                            options={artists.map(a => ({ value: a._id, label: a.name }))}
                                            value={form.artistId}
                                            onChange={v => { set("artistId", v); touch("artistId"); }}
                                            onBlur={() => touch("artistId")}
                                            placeholder="-- Chọn nghệ sĩ --"
                                            searchPlaceholder="Tìm nghệ sĩ..."
                                            hasError={touched.artistId && !artistOk}
                                            theme="light"
                                        />
                                    )}
                                    {touched.artistId && !artistOk && (
                                        <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
                                            <AlertCircle size={10} /> Vui lòng chọn nghệ sĩ
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Thể loại
                                    </label>
                                    <SearchableSelect
                                        options={genreList.map(g => ({ value: g, label: g }))}
                                        value={form.genre}
                                        onChange={v => set("genre", v)}
                                        placeholder="-- Chọn thể loại --"
                                        searchPlaceholder="Tìm thể loại..."
                                        theme="light"
                                    />
                                </div>
                            </div>

                            {/* Release year */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Năm phát hành</label>
                                    <input
                                        type="number"
                                        value={form.releaseYear}
                                        onChange={e => set("releaseYear", e.target.value)}
                                        placeholder={String(new Date().getFullYear())}
                                        min={1900} max={new Date().getFullYear() + 1}
                                        className={inputCls}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Thời lượng (giây)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={form.duration || ""}
                                            onChange={e => set("duration", Number(e.target.value))}
                                            placeholder="Tự động khi chọn file..."
                                            min={1}
                                            className={inputCls}
                                        />
                                        {form.duration > 0 && (
                                            <span className="absolute right-3 bottom-3 text-xs font-mono text-indigo-500 pointer-events-none">
                                                {fmt(form.duration)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: audio */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
                            <div className="w-1 h-4 rounded-full bg-indigo-600 flex-shrink-0" />
                            <h2 className="text-sm font-semibold text-gray-800">
                                File âm thanh <span className="text-red-500">*</span>
                            </h2>
                            {/* Source mode toggle */}
                            <div className="ml-auto flex items-center rounded-lg border border-gray-200 overflow-hidden">
                                {(["upload", "url"] as SourceMode[]).map(mode => (
                                    <button
                                        key={mode}
                                        type="button"
                                        onClick={() => setSourceMode(mode)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${sourceMode === mode ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}
                                    >
                                        {mode === "upload" ? <><Upload size={11} /> Upload</> : <><Link2 size={11} /> URL</>}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="px-6 py-6">

                            {/* URL mode */}
                            {sourceMode === "url" && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            URL Audio <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={form.audioUrl}
                                            onChange={e => {
                                                set("audioUrl", e.target.value);
                                                if (e.target.value.trim()) {
                                                    const tmp = new Audio(e.target.value.trim());
                                                    tmp.onloadedmetadata = () => {
                                                        if (tmp.duration && isFinite(tmp.duration))
                                                            set("duration", Math.round(tmp.duration));
                                                    };
                                                }
                                            }}
                                            onBlur={() => touch("audio")}
                                            placeholder="https://... hoặc /audio/tenfile.mp3"
                                            className={`${inputCls} ${touched.audio && !audioOk ? "border-red-400 ring-2 ring-red-100" : ""}`}
                                        />
                                        {touched.audio && !audioOk && (
                                            <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
                                                <AlertCircle size={10} /> Vui lòng nhập URL audio
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">URL Ảnh bìa <span className="text-gray-400 text-xs font-normal">(tuỳ chọn)</span></label>
                                        <input
                                            type="text"
                                            value={form.coverUrl}
                                            onChange={e => set("coverUrl", e.target.value)}
                                            placeholder="https://..."
                                            className={inputCls}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Upload mode */}
                            {sourceMode === "upload" && (
                                <div className="space-y-4">
                                    {/* Audio drop zone */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            File âm thanh <span className="text-red-500">*</span>
                                        </label>
                                        <div
                                            onClick={() => audioInputRef.current?.click()}
                                            onDragOver={e => { e.preventDefault(); setAudioDrag(true); }}
                                            onDragLeave={() => setAudioDrag(false)}
                                            onDrop={e => { e.preventDefault(); setAudioDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f, "audio"); }}
                                            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                                                audioDrag
                                                    ? "border-indigo-400 bg-indigo-50"
                                                    : pendingAudioFile.current
                                                    ? "border-green-300 bg-green-50"
                                                    : touched.audio && !audioOk
                                                    ? "border-red-300 bg-red-50"
                                                    : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
                                            }`}
                                        >
                                            <FileAudio size={24} className={`mx-auto mb-2 ${
                                                audioDrag ? "text-indigo-500"
                                                    : pendingAudioFile.current ? "text-green-500"
                                                    : touched.audio && !audioOk ? "text-red-400"
                                                    : "text-gray-300"
                                            }`} />
                                            {pendingAudioFile.current ? (
                                                <div>
                                                    <p className="text-sm font-semibold text-green-700">{pendingAudioFile.current.name}</p>
                                                    <p className="text-xs text-green-600 mt-0.5">
                                                        {(pendingAudioFile.current.size / 1024 / 1024).toFixed(1)} MB
                                                        {form.duration > 0 && ` · ${fmt(form.duration)}`}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">Click để đổi file khác</p>
                                                </div>
                                            ) : (
                                                <div>
                                                    <p className="text-sm text-gray-500">
                                                        Kéo thả hoặc <span className="text-indigo-600 font-medium">chọn file</span>
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">MP3, WAV, FLAC · tối đa 50MB</p>
                                                </div>
                                            )}
                                        </div>
                                        {touched.audio && !audioOk && (
                                            <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
                                                <AlertCircle size={10} /> Vui lòng chọn file âm thanh
                                            </p>
                                        )}
                                    </div>

                                    {/* Mini player */}
                                    {audioPreview && (
                                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                            <div className="flex items-center gap-3 mb-3">
                                                <button
                                                    onClick={togglePlay}
                                                    className="w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer"
                                                >
                                                    {playing
                                                        ? <Pause size={14} className="text-white" />
                                                        : <Play size={14} className="text-white ml-0.5" />
                                                    }
                                                </button>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-gray-700 truncate">
                                                        {pendingAudioFile.current?.name}
                                                    </p>
                                                    <p className="text-xs text-gray-400 font-mono">
                                                        {fmt(currentTime)} / {fmt(form.duration)}
                                                    </p>
                                                </div>
                                                <button onClick={() => setMuted(m => !m)} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                                                    {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                                                </button>
                                                <input
                                                    type="range" min={0} max={100} value={muted ? 0 : volume}
                                                    className="w-16 accent-indigo-600"
                                                    onChange={e => { setVolume(+e.target.value); if (+e.target.value > 0) setMuted(false); }}
                                                />
                                            </div>
                                            {/* Waveform */}
                                            <div
                                                className="relative h-8 cursor-pointer rounded overflow-hidden"
                                                onClick={seek}
                                            >
                                                <div className="flex items-end gap-0.5 h-full">
                                                    {WAVE.map((h, i) => {
                                                        const filled = (i / WAVE.length) * 100 <= progress;
                                                        return (
                                                            <div
                                                                key={i}
                                                                className="flex-1 rounded-sm transition-colors"
                                                                style={{
                                                                    height: `${Math.min(h, 100)}%`,
                                                                    background: filled ? "#6366f1" : "#e2e8f0",
                                                                }}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section: ảnh bìa (upload mode only) */}
                    {sourceMode === "upload" && (
                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
                                <div className="w-1 h-4 rounded-full bg-indigo-600 flex-shrink-0" />
                                <h2 className="text-sm font-semibold text-gray-800">Ảnh bìa <span className="text-gray-400 text-xs font-normal">(tuỳ chọn)</span></h2>
                            </div>
                            <div className="px-6 py-6">
                                <div className="grid grid-cols-2 gap-5 items-start">
                                    {/* Drop zone */}
                                    <div
                                        onClick={() => coverInputRef.current?.click()}
                                        onDragOver={e => { e.preventDefault(); setCoverDrag(true); }}
                                        onDragLeave={() => setCoverDrag(false)}
                                        onDrop={e => { e.preventDefault(); setCoverDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f, "cover"); }}
                                        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                                            coverDrag ? "border-indigo-400 bg-indigo-50"
                                                : pendingCoverFile.current ? "border-green-300 bg-green-50"
                                                : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
                                        }`}
                                    >
                                        <ImageIcon size={24} className={`mx-auto mb-2 ${coverDrag ? "text-indigo-500" : pendingCoverFile.current ? "text-green-500" : "text-gray-300"}`} />
                                        {pendingCoverFile.current ? (
                                            <div>
                                                <p className="text-sm font-semibold text-green-700">{pendingCoverFile.current.name}</p>
                                                <p className="text-xs text-gray-400 mt-1">Click để đổi ảnh</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="text-sm text-gray-500">Kéo thả hoặc <span className="text-indigo-600 font-medium">chọn ảnh</span></p>
                                                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP · tối đa 5MB</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Cover preview */}
                                    <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center border border-gray-200">
                                        {coverPreview
                                            ? <img src={coverPreview} alt="cover" className="w-full h-full object-cover" />
                                            : <Music size={32} className="text-indigo-200" />
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ══════ Right: sidebar (1/3) ══════ */}
                <div className="sticky top-4 space-y-4">

                    {/* Progress */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/60">
                            <div className="w-1 h-4 rounded-full bg-gray-300 flex-shrink-0" />
                            <h2 className="text-sm font-semibold text-gray-800">Tiến độ</h2>
                            <span className="ml-auto text-xs font-bold text-indigo-600">
                                {steps.filter(s => s.done).length}/{steps.length}
                            </span>
                        </div>
                        <div className="px-5 py-4">
                            {/* Progress bar */}
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
                                <div
                                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                                    style={{ width: `${(steps.filter(s => s.done).length / steps.length) * 100}%` }}
                                />
                            </div>
                            <div className="space-y-2.5">
                                {steps.map(s => (
                                    <div key={s.label} className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                                            s.done
                                                ? "bg-green-100 border border-green-300"
                                                : s.required ? "bg-red-50 border border-red-200" : "bg-gray-100 border border-gray-200"
                                        }`}>
                                            {s.done
                                                ? <CheckCircle2 size={12} className="text-green-600" />
                                                : <span className={`text-[9px] font-bold ${s.required ? "text-red-400" : "text-gray-300"}`}>
                                                    {s.required ? "!" : "·"}
                                                </span>
                                            }
                                        </div>
                                        <span className={`text-xs transition-colors ${s.done ? "text-gray-700 font-medium" : s.required ? "text-red-400" : "text-gray-400"}`}>
                                            {s.label}
                                            {s.required && !s.done && <span className="text-red-400 ml-0.5">*</span>}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            {isValid && (
                                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100">
                                    <CheckCircle2 size={13} className="text-green-500" />
                                    <span className="text-xs text-green-600 font-medium">Sẵn sàng tạo bài hát</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Status */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/60">
                            <div className="w-1 h-4 rounded-full bg-gray-300 flex-shrink-0" />
                            <h2 className="text-sm font-semibold text-gray-800">Trạng thái</h2>
                        </div>
                        <div className="px-5 py-4">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${form.isPublished ? "bg-indigo-50" : "bg-gray-100"}`}>
                                        {form.isPublished
                                            ? <Eye size={16} className="text-indigo-600" />
                                            : <EyeOff size={16} className="text-gray-400" />
                                        }
                                    </div>
                                    <div>
                                        <p className={`text-sm font-semibold transition-colors ${form.isPublished ? "text-gray-900" : "text-gray-500"}`}>
                                            {form.isPublished ? "Xuất bản ngay" : "Lưu nháp"}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {form.isPublished ? "Hiển thị với người dùng" : "Ẩn sau khi tạo"}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => set("isPublished", !form.isPublished)}
                                    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 cursor-pointer border-0 ${form.isPublished ? "bg-indigo-600" : "bg-gray-200"}`}
                                >
                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${form.isPublished ? "translate-x-5" : "translate-x-0"}`} />
                                </button>
                            </div>
                            <div className={`flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100 text-xs ${form.isPublished ? "text-indigo-500" : "text-gray-400"}`}>
                                {form.isPublished
                                    ? <><CheckCircle2 size={12} /> Sẽ xuất bản ngay sau khi tạo</>
                                    : <><XCircle size={12} /> Lưu dưới dạng bản nháp</>
                                }
                            </div>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/60">
                            <div className="w-1 h-4 rounded-full bg-gray-300 flex-shrink-0" />
                            <h2 className="text-sm font-semibold text-gray-800">Xem trước</h2>
                        </div>
                        <div className="p-5">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center flex-shrink-0 border border-gray-100">
                                    {coverPreview
                                        ? <img src={coverPreview} alt="cover" className="w-full h-full object-cover" />
                                        : <Music size={18} className="text-indigo-300" />
                                    }
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-gray-900 truncate">
                                        {form.title || <span className="text-gray-300 font-normal italic">Tên bài hát</span>}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate mt-0.5">
                                        {artists.find(a => a._id === form.artistId)?.name || <span className="italic">Nghệ sĩ</span>}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {form.genre && (
                                            <span className="text-[10px] bg-indigo-50 text-indigo-600 font-semibold px-2 py-0.5 rounded-full">
                                                {form.genre}
                                            </span>
                                        )}
                                        {form.duration > 0 && (
                                            <span className="text-[10px] text-gray-400 font-mono">{fmt(form.duration)}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
