// src/pages/admin/tracks/Admintrackcreatepage.tsx
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
    ArrowLeft, Music, X, Upload, Image as ImageIcon,
    Mic2, Tag, Calendar, FileAudio,
    CheckCircle2, XCircle, Eye, EyeOff,
    Loader2, AlertCircle, ChevronDown, Play, Pause,
    Volume2, VolumeX, Plus, Sparkles,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { artistService } from "@/services/artistService";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

const WAVE = Array.from({ length: 48 }, (_, i) =>
    18 + Math.abs(Math.sin(i * 0.38) * 50 + Math.cos(i * 0.71) * 22)
);

const GENRES = [
    "Pop", "R&B", "Hip-Hop", "Rock", "Electronic", "Jazz", "Classical",
    "Folk", "Indie", "Country", "Dance", "Soul", "Ballad", "Lofi", "EDM",
    "Metal", "Blues", "Reggae", "Acoustic",
];

const API = import.meta.env.MODE === "development"
    ? "http://localhost:2004/api"
    : "https://wonmusic-api.up.railway.app/api";

// ─── Types ───────────────────────────────────────────────────────────────────
interface TrackForm {
    title: string;
    artistId: string;
    duration: number;
    genre: string;
    releaseYear: string;
    isPublished: boolean;
}

type Tab = "basic" | "media";

const EMPTY_FORM: TrackForm = {
    title: "", artistId: "",
    duration: 0, genre: "",
    releaseYear: String(new Date().getFullYear()),
    isPublished: true,
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function AdminTrackCreatePages() {
    const navigate = useNavigate();

    const [artists, setArtists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>("basic");

    // ── Audio player state ──
    const audioRef = useRef<HTMLAudioElement>(null);
    const rafRef = useRef<number>(0);
    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(80);

    // ── Upload / preview state ──
    const [coverDrag, setCoverDrag] = useState(false);
    const [audioDrag, setAudioDrag] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [uploadingAudio, setUploadingAudio] = useState(false);
    const [coverPreview, setCoverPreview] = useState<string>("");
    const [audioPreview, setAudioPreview] = useState<string>("");
    const coverInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);

    // ── Pending files (upload AFTER track created) ──
    const pendingCoverFile = useRef<File | null>(null);
    const pendingAudioFile = useRef<File | null>(null);
    const coverBlobUrl     = useRef<string>("");
    const audioBlobUrl     = useRef<string>("");

    // Cleanup blob URLs on unmount to prevent memory leak
    useEffect(() => {
        return () => {
            if (coverBlobUrl.current) URL.revokeObjectURL(coverBlobUrl.current);
            if (audioBlobUrl.current) URL.revokeObjectURL(audioBlobUrl.current);
        };
    }, []);

    // ── Form & Validation state ──
    const [form, setForm] = useState<TrackForm>(EMPTY_FORM);
    const set = (field: keyof TrackForm, value: any) =>
        setForm(prev => ({ ...prev, [field]: value }));

    // Track which fields the user has interacted with
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const touch = (field: string) =>
        setTouched(prev => ({ ...prev, [field]: true }));

    // ── Derived validation ──
    const titleValid = !!form.title.trim();
    const artistValid = !!form.artistId;
    const audioValid = !!pendingAudioFile.current;
    const isValid = titleValid && artistValid && audioValid;

    const missingFields = [
        !titleValid && "tên bài hát",
        !artistValid && "nghệ sĩ",
        !audioValid && "file audio",
    ].filter(Boolean) as string[];

    // ── Load artists ──
    useEffect(() => {
        (async () => {
            try {
                const res = await artistService.getAll({ limit: 200 });
                setArtists(Array.isArray(res) ? res : res?.data ?? []);
            } catch {
                // non-critical
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // ── Sync audio volume / mute ──
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.volume = volume / 100;
        audio.muted = muted;
    }, [volume, muted]);

    // ── Player ──
    const tick = () => {
        const audio = audioRef.current;
        if (!audio) return;
        setCurrentTime(audio.currentTime);
        setProgress((audio.currentTime / (audio.duration || 1)) * 100);
        rafRef.current = requestAnimationFrame(tick);
    };

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (playing) { audio.pause(); cancelAnimationFrame(rafRef.current); }
        else { audio.play(); rafRef.current = requestAnimationFrame(tick); }
        setPlaying(p => !p);
    };

    const seek = (e: React.MouseEvent<HTMLDivElement>) => {
        const audio = audioRef.current;
        if (!audio) return;
        const rect = e.currentTarget.getBoundingClientRect();
        audio.currentTime = ((e.clientX - rect.left) / rect.width) * (audio.duration || 0);
    };

    // ── Select file → local preview only ──
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
            // Auto-read duration
            const tmp = new Audio(url);
            tmp.onloadedmetadata = () => {
                const dur = Math.round(tmp.duration);
                if (dur && isFinite(dur)) set("duration", dur);
            };
            setPlaying(false); setProgress(0); setCurrentTime(0);
            cancelAnimationFrame(rafRef.current);
        }
    };

    // ── Validate ──
    const validate = (): string | null => {
        if (!form.title.trim()) return "Tên bài hát không được để trống.";
        if (!form.artistId) return "Vui lòng chọn nghệ sĩ.";
        if (!pendingAudioFile.current) return "Vui lòng chọn file âm thanh.";
        return null;
    };

    // ── Create ──
    const handleCreate = async () => {
        // Touch all required fields to show all errors at once
        setTouched({ title: true, artistId: true, audio: true });

        const err = validate();
        if (err) { setError(err); return; }

        setSaving(true);
        setError(null);

        try {
            const formData = new FormData();

            formData.append("title", form.title);
            formData.append("artistId", form.artistId);
            formData.append("duration", String(form.duration));
            formData.append("genre", form.genre);
            formData.append("isPublished", String(form.isPublished));
            if (form.releaseYear) {
                formData.append("releaseYear", form.releaseYear);
            }

            if (pendingAudioFile.current) {
                formData.append("audio", pendingAudioFile.current);
            }
            if (pendingCoverFile.current) {
                formData.append("cover", pendingCoverFile.current);
            }

            setUploadingAudio(true);
            const res = await axios.post(`${API}/tracks`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setUploadingAudio(false);

            const newId = res.data.data._id;
            toast.success("Tạo bài hát thành công!");
            navigate(`/admin/tracks/${newId}`);

        } catch (e: any) {
            setError(e?.response?.data?.message ?? "Tạo bài hát thất bại. Vui lòng thử lại.");
        } finally {
            setSaving(false);
            setUploadingAudio(false);
            setUploadingCover(false);
        }
    };

    // ── Derived ──
    const activeAudioSrc = audioPreview;
    const activeCoverSrc = coverPreview;

    const steps = [
        { label: "Tên bài hát", done: titleValid },
        { label: "Nghệ sĩ", done: artistValid },
        { label: "File audio", done: audioValid },
        { label: "Ảnh bìa", done: !!pendingCoverFile.current },
    ];
    const doneCount = steps.filter(s => s.done).length;

    // ── Saving overlay label ──
    const savingLabel = uploadingCover
        ? "Đang upload ảnh bìa..."
        : uploadingAudio
            ? "Đang upload audio..."
            : "Đang tạo bài hát...";

    return (
        <div style={{ fontFamily: "'Be Vietnam Pro',sans-serif", maxWidth: 900, paddingBottom: 80 }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');

                @keyframes ahFadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
                @keyframes ahPulse  { 0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,.35)} 50%{box-shadow:0 0 0 6px rgba(74,222,128,0)} }
                @keyframes ahSpin   { to{transform:rotate(360deg)} }
                @keyframes ahEq     { 0%,100%{transform:scaleY(.2)} 50%{transform:scaleY(1)} }
                @keyframes shake    { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-4px)} 40%,80%{transform:translateX(4px)} }
                @keyframes stepIn   { from{opacity:0;transform:scale(.7)} to{opacity:1;transform:scale(1)} }
                @keyframes errFade  { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }

                .tc-card {
                    border-radius:18px;
                    border:1px solid rgba(255,255,255,.07);
                    background:rgba(255,255,255,.025);
                }
                .tc-input, .tc-select {
                    width:100%; box-sizing:border-box;
                    background:rgba(255,255,255,.04);
                    border:1px solid rgba(255,255,255,.08);
                    border-radius:11px; padding:11px 14px;
                    color:#fff; font-size:14px; font-weight:500;
                    font-family:'Be Vietnam Pro',sans-serif; outline:none;
                    transition:border-color .18s, background .18s, box-shadow .18s;
                }
                .tc-input:focus, .tc-select:focus {
                    border-color:rgba(74,222,128,.45);
                    background:rgba(74,222,128,.04);
                    box-shadow:0 0 0 3px rgba(74,222,128,.08);
                }
                .tc-input::placeholder { color:rgba(255,255,255,.22); font-weight:400; }
                .tc-input.err, .tc-select.err {
                    border-color:rgba(248,113,113,.5)!important;
                    box-shadow:0 0 0 3px rgba(248,113,113,.08)!important;
                    animation: shake .3s ease;
                }
                .tc-select { padding-right:38px; -webkit-appearance:none; appearance:none; cursor:pointer; }
                .tc-select option { background:#141a14; }

                .tc-label {
                    display:flex; align-items:center; gap:5px;
                    font-size:11px; font-weight:700; color:rgba(255,255,255,.3);
                    letter-spacing:1.8px; text-transform:uppercase; margin-bottom:7px;
                }
                .tc-field-err {
                    font-size:11px; color:#f87171; margin-top:5px;
                    display:flex; align-items:center; gap:4px;
                    animation: errFade .2s ease;
                }
                .tc-field { margin-bottom:18px; position:relative; }
                .tc-req   { color:#f87171; }

                .tc-pill-btn {
                    display:inline-flex; align-items:center; gap:7px;
                    padding:8px 15px; border-radius:100px;
                    border:1px solid rgba(255,255,255,.09);
                    background:rgba(255,255,255,.03);
                    color:rgba(255,255,255,.5); font-size:13px; font-weight:500;
                    text-decoration:none; cursor:pointer;
                    font-family:'Be Vietnam Pro',sans-serif; transition:all .18s;
                }
                .tc-pill-btn:hover { background:rgba(255,255,255,.07); color:#fff; border-color:rgba(255,255,255,.15); }

                .tc-tab {
                    padding:8px 20px; border-radius:100px;
                    font-size:13px; font-weight:600; cursor:pointer;
                    border:1px solid transparent; transition:all .18s;
                    font-family:'Be Vietnam Pro',sans-serif;
                    color:rgba(255,255,255,.38); background:transparent;
                }
                .tc-tab:hover { color:rgba(255,255,255,.7); }
                .tc-tab.active { color:#4ade80; border-color:rgba(74,222,128,.22); background:rgba(74,222,128,.07); }

                .tc-drop {
                    border:2px dashed rgba(255,255,255,.1); border-radius:14px;
                    padding:30px 20px; text-align:center; cursor:pointer;
                    transition:all .2s; background:rgba(255,255,255,.02);
                }
                .tc-drop:hover, .tc-drop.drag { border-color:rgba(74,222,128,.45); background:rgba(74,222,128,.05); }
                .tc-drop.err-drop { border-color:rgba(248,113,113,.35); background:rgba(248,113,113,.03); }

                .tc-toggle {
                    position:relative; width:46px; height:26px;
                    background:rgba(255,255,255,.1); border-radius:100px;
                    cursor:pointer; transition:background .22s;
                    flex-shrink:0; border:none; outline:none;
                }
                .tc-toggle::after {
                    content:''; position:absolute; top:4px; left:4px;
                    width:18px; height:18px; border-radius:50%;
                    background:rgba(255,255,255,.45); transition:all .22s;
                }
                .tc-toggle.on { background:linear-gradient(135deg,#16a34a,#4ade80); animation:ahPulse 1.5s ease 1; }
                .tc-toggle.on::after { left:24px; background:#fff; }

                .tc-create-btn {
                    display:inline-flex; align-items:center; gap:8px;
                    padding:12px 30px; border-radius:12px;
                    font-size:14px; font-weight:700; cursor:pointer;
                    font-family:'Be Vietnam Pro',sans-serif; border:none; transition:all .2s;
                    background:linear-gradient(135deg,#16a34a,#4ade80);
                    color:#071207; box-shadow:0 4px 20px rgba(74,222,128,.3);
                    position: relative;
                }
                .tc-create-btn:hover:not(:disabled) { transform:translateY(-2px); filter:brightness(1.08); box-shadow:0 8px 28px rgba(74,222,128,.4); }
                .tc-create-btn:disabled {
                    opacity:.35; cursor:not-allowed; transform:none!important;
                    background: rgba(255,255,255,.08);
                    color: rgba(255,255,255,.3);
                    box-shadow: none;
                    border: 1px solid rgba(255,255,255,.08);
                }

                .tc-stitle {
                    font-size:11px; color:rgba(255,255,255,.28);
                    letter-spacing:2px; text-transform:uppercase; font-weight:700;
                    margin-bottom:20px; display:flex; align-items:center; gap:8px;
                }
                .tc-stitle::after { content:''; flex:1; height:1px; background:rgba(255,255,255,.05); }

                .tc-progress { position:relative; height:32px; cursor:pointer; border-radius:6px; overflow:hidden; }
                .tc-thumb {
                    position:absolute; top:50%; width:10px; height:10px;
                    border-radius:50%; background:#4ade80;
                    transform:translate(-50%,-50%);
                    box-shadow:0 0 6px rgba(74,222,128,.5);
                    pointer-events:none; transition:left .05s linear;
                }
                .tc-vol {
                    -webkit-appearance:none; appearance:none;
                    width:68px; height:3px; border-radius:3px; cursor:pointer; outline:none;
                    background:linear-gradient(90deg,#4ade80 var(--v),rgba(255,255,255,.1) var(--v));
                }
                .tc-vol::-webkit-slider-thumb {
                    -webkit-appearance:none; width:10px; height:10px;
                    border-radius:50%; background:#4ade80; cursor:pointer;
                }

                .tc-step-dot {
                    width:22px; height:22px; border-radius:50%;
                    display:flex; align-items:center; justify-content:center;
                    font-size:10px; font-weight:700; flex-shrink:0; transition:all .25s;
                }
                .tc-step-dot.done { background:rgba(74,222,128,.15); border:1.5px solid #4ade80; color:#4ade80; animation:stepIn .25s ease; }
                .tc-step-dot.pending { background:rgba(255,255,255,.04); border:1.5px solid rgba(255,255,255,.1); color:rgba(255,255,255,.25); }
                .tc-step-dot.required { background:rgba(248,113,113,.08); border:1.5px solid rgba(248,113,113,.3); color:rgba(248,113,113,.6); }

                .tc-prog-bar { height:3px; border-radius:3px; overflow:hidden; background:rgba(255,255,255,.06); margin-top:6px; }
                .tc-prog-fill { height:100%; border-radius:3px; background:linear-gradient(90deg,#16a34a,#4ade80); transition:width .4s cubic-bezier(.4,0,.2,1); }

                .tc-saving-overlay {
                    position:fixed; inset:0; z-index:9999;
                    background:rgba(0,0,0,.7); backdrop-filter:blur(6px);
                    display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px;
                }

                .tc-missing-badge {
                    display:inline-flex; align-items:center; gap:5px;
                    padding:5px 12px; border-radius:100px;
                    background:rgba(248,113,113,.08);
                    border:1px solid rgba(248,113,113,.2);
                    font-size:11px; color:rgba(248,113,113,.8); font-weight:600;
                    animation: errFade .25s ease;
                }
            `}</style>

            {/* Hidden audio player */}
            {activeAudioSrc && (
                <audio
                    ref={audioRef}
                    src={activeAudioSrc}
                    onEnded={() => {
                        setPlaying(false); setProgress(0); setCurrentTime(0);
                        cancelAnimationFrame(rafRef.current);
                    }}
                />
            )}

            {/* Hidden file inputs */}
            <input ref={coverInputRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f, "cover"); e.target.value = ""; }} />
            <input ref={audioInputRef} type="file" accept="audio/*" style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f, "audio"); e.target.value = ""; }} />

            {/* ── Saving overlay ── */}
            {saving && (
                <div className="tc-saving-overlay">
                    <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(74,222,128,.1)", border: "1px solid rgba(74,222,128,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Loader2 size={28} color="#4ade80" style={{ animation: "ahSpin .7s linear infinite" }} />
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <p style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, color: "#fff", letterSpacing: 1.5, marginBottom: 4 }}>
                            {savingLabel}
                        </p>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,.35)" }}>Vui lòng không đóng trang</p>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                        {[
                            { label: "Tạo bài hát", done: !!(uploadingCover || uploadingAudio) },
                            { label: "Upload ảnh bìa", done: !!uploadingAudio, active: uploadingCover },
                            { label: "Upload audio", done: false, active: uploadingAudio },
                        ].map((s, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 100, background: s.active ? "rgba(74,222,128,.12)" : s.done ? "rgba(74,222,128,.06)" : "rgba(255,255,255,.04)", border: `1px solid ${s.active ? "rgba(74,222,128,.3)" : s.done ? "rgba(74,222,128,.15)" : "rgba(255,255,255,.07)"}` }}>
                                {s.active
                                    ? <Loader2 size={11} color="#4ade80" style={{ animation: "ahSpin .7s linear infinite" }} />
                                    : s.done
                                        ? <CheckCircle2 size={11} color="#4ade80" />
                                        : <div style={{ width: 11, height: 11, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,.2)" }} />
                                }
                                <span style={{ fontSize: 11, color: s.active ? "#4ade80" : s.done ? "rgba(74,222,128,.7)" : "rgba(255,255,255,.3)", fontWeight: s.active ? 700 : 400 }}>
                                    {s.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Breadcrumb ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22, animation: "ahFadeUp .3s both", flexWrap: "wrap" }}>
                <Link to="/admin/tracks" className="tc-pill-btn"><ArrowLeft size={13} /> Bài hát</Link>
                <span style={{ color: "rgba(255,255,255,.18)", fontSize: 12 }}>/</span>
                <span style={{ fontSize: 13, color: "#4ade80", fontWeight: 600 }}>Tạo mới</span>
            </div>

            {/* ── Header ── */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, animation: "ahFadeUp .35s both", flexWrap: "wrap", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 54, height: 54, borderRadius: 13, overflow: "hidden", flexShrink: 0, background: "linear-gradient(135deg,#052e16,#14532d)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(74,222,128,.15)" }}>
                        {activeCoverSrc
                            ? <img src={activeCoverSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : <Sparkles size={20} color="rgba(74,222,128,.35)" />
                        }
                    </div>
                    <div>
                        <p style={{ fontSize: 11, color: "#4ade80", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 4 }}>
                            Tạo bài hát mới
                        </p>
                        <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 30, color: "#fff", letterSpacing: 2, lineHeight: 1 }}>
                            {form.title || <span style={{ color: "rgba(255,255,255,.2)" }}>Chưa có tên...</span>}
                        </h1>
                    </div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <Link to="/admin/tracks" className="tc-pill-btn"><X size={13} /> Huỷ</Link>

                    {/* Missing fields hint next to button */}
                    {!isValid && missingFields.length > 0 && (
                        <span className="tc-missing-badge">
                            <AlertCircle size={10} />
                            Thiếu: {missingFields.join(", ")}
                        </span>
                    )}

                    <button
                        className="tc-create-btn"
                        onClick={handleCreate}
                        disabled={saving || !isValid}
                        title={!isValid ? `Vui lòng điền đủ: ${missingFields.join(", ")}` : ""}
                    >
                        <Plus size={15} /> Tạo bài hát
                    </button>
                </div>
            </div>

            {/* ── Completion progress ── */}
            <div style={{ marginBottom: 22, animation: "ahFadeUp .38s both" }}>
                <div className="tc-card" style={{ padding: "14px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,.3)", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase" }}>
                            Tiến độ điền thông tin
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: isValid ? "#4ade80" : "rgba(255,255,255,.5)" }}>
                            {doneCount}/4
                            {isValid && <span style={{ marginLeft: 6, fontSize: 12 }}>✓ Sẵn sàng tạo</span>}
                        </span>
                    </div>
                    <div className="tc-prog-bar">
                        <div className="tc-prog-fill" style={{ width: `${(doneCount / 4) * 100}%` }} />
                    </div>
                    <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
                        {steps.map(s => {
                            // Show as required-error if touched and not done and it's a required field
                            const isRequired = s.label !== "Ảnh bìa";
                            const showErr = isRequired && !s.done && touched[
                                s.label === "Tên bài hát" ? "title" : s.label === "Nghệ sĩ" ? "artistId" : "audio"
                            ];
                            return (
                                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <div className={`tc-step-dot ${s.done ? "done" : showErr ? "required" : "pending"}`}>
                                        {s.done ? "✓" : showErr ? "!" : "·"}
                                    </div>
                                    <span style={{ fontSize: 12, color: s.done ? "rgba(255,255,255,.6)" : showErr ? "rgba(248,113,113,.7)" : "rgba(255,255,255,.25)", fontWeight: s.done ? 600 : 400, transition: "color .2s" }}>
                                        {s.label}
                                        {isRequired && !s.done && <span style={{ color: "#f87171", marginLeft: 2 }}>*</span>}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── Error banner ── */}
            {error && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, background: "rgba(248,113,113,.08)", border: "1px solid rgba(248,113,113,.2)", marginBottom: 18, animation: "shake .35s ease" }}>
                    <AlertCircle size={15} color="#f87171" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "#f87171", flex: 1 }}>{error}</span>
                    <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "rgba(248,113,113,.5)", cursor: "pointer", padding: 0 }}>
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* ── Tabs ── */}
            <div style={{ display: "flex", gap: 6, marginBottom: 20, animation: "ahFadeUp .4s both" }}>
                {(["basic", "media"] as Tab[]).map(tab => (
                    <button key={tab} className={`tc-tab ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
                        {{ basic: "Thông tin cơ bản", media: "Media & Audio" }[tab]}
                        {/* Red dot — required fields missing */}
                        {tab === "basic" && (!titleValid || !artistValid) && (
                            <span style={{ marginLeft: 6, width: 6, height: 6, borderRadius: "50%", background: "#f87171", display: "inline-block", verticalAlign: "middle" }} />
                        )}
                        {tab === "media" && !audioValid && (
                            <span style={{ marginLeft: 6, width: 6, height: 6, borderRadius: "50%", background: "#fb923c", display: "inline-block", verticalAlign: "middle" }} />
                        )}
                    </button>
                ))}
            </div>

            {/* ════════ Tab: Basic ════════ */}
            {activeTab === "basic" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, animation: "ahFadeUp .3s both" }}>

                    {/* Left */}
                    <div className="tc-card" style={{ padding: "22px 24px" }}>
                        <p className="tc-stitle">Thông tin bài hát</p>

                        {/* Title */}
                        <div className="tc-field">
                            <label className="tc-label"><Music size={10} /> Tên bài hát <span className="tc-req">*</span></label>
                            <div style={{ position: "relative" }}>
                                <input
                                    className={`tc-input ${touched.title && !titleValid ? "err" : ""}`}
                                    value={form.title}
                                    onChange={e => set("title", e.target.value)}
                                    onBlur={() => touch("title")}
                                    placeholder="Nhập tên bài hát..."
                                    maxLength={120}
                                    autoFocus
                                />
                                <span style={{ position: "absolute", right: 12, bottom: 11, fontSize: 10, color: "rgba(255,255,255,.18)", pointerEvents: "none" }}>
                                    {form.title.length}/120
                                </span>
                            </div>
                            {touched.title && !titleValid && (
                                <p className="tc-field-err">
                                    <AlertCircle size={10} /> Tên bài hát không được để trống
                                </p>
                            )}
                        </div>

                        {/* Artist */}
                        <div className="tc-field">
                            <label className="tc-label"><Mic2 size={10} /> Nghệ sĩ <span className="tc-req">*</span></label>
                            <div style={{ position: "relative" }}>
                                <select
                                    className={`tc-select ${touched.artistId && !artistValid ? "err" : ""}`}
                                    value={form.artistId}
                                    onChange={e => set("artistId", e.target.value)}
                                    onBlur={() => touch("artistId")}
                                    disabled={loading}
                                >
                                    <option value="">{loading ? "Đang tải..." : "-- Chọn nghệ sĩ --"}</option>
                                    {artists.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                                </select>
                                {loading
                                    ? <Loader2 size={13} color="rgba(255,255,255,.3)" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", animation: "ahSpin .7s linear infinite", pointerEvents: "none" }} />
                                    : <ChevronDown size={13} color="rgba(255,255,255,.3)" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                                }
                            </div>
                            {touched.artistId && !artistValid && (
                                <p className="tc-field-err">
                                    <AlertCircle size={10} /> Vui lòng chọn nghệ sĩ
                                </p>
                            )}
                        </div>

                        {/* Genre */}
                        <div className="tc-field">
                            <label className="tc-label"><Tag size={10} /> Thể loại</label>
                            <div style={{ position: "relative" }}>
                                <select className="tc-select" value={form.genre} onChange={e => set("genre", e.target.value)}>
                                    <option value="">-- Chọn thể loại --</option>
                                    {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                                <ChevronDown size={13} color="rgba(255,255,255,.3)" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                            </div>
                        </div>

                        {/* Release year */}
                        <div className="tc-field" style={{ marginBottom: 0 }}>
                            <label className="tc-label"><Calendar size={10} /> Năm phát hành</label>
                            <input
                                className="tc-input" type="number"
                                value={form.releaseYear}
                                onChange={e => set("releaseYear", e.target.value)}
                                placeholder={String(new Date().getFullYear())}
                                min={1900} max={new Date().getFullYear() + 1}
                            />
                        </div>
                    </div>

                    {/* Right */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                        {/* Published toggle */}
                        <div className="tc-card" style={{ padding: "20px 22px" }}>
                            <p className="tc-stitle">Trạng thái</p>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: form.isPublished ? "rgba(74,222,128,.1)" : "rgba(255,255,255,.05)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background .2s" }}>
                                        {form.isPublished ? <Eye size={16} color="#4ade80" /> : <EyeOff size={16} color="rgba(255,255,255,.28)" />}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 13, fontWeight: 700, color: form.isPublished ? "#fff" : "rgba(255,255,255,.45)", marginBottom: 3, transition: "color .2s" }}>
                                            {form.isPublished ? "Xuất bản ngay" : "Lưu nháp"}
                                        </p>
                                        <p style={{ fontSize: 11, color: "rgba(255,255,255,.25)" }}>
                                            {form.isPublished ? "Bài hát sẽ hiển thị với người dùng" : "Bài hát sẽ ẩn sau khi tạo"}
                                        </p>
                                    </div>
                                </div>
                                <button className={`tc-toggle ${form.isPublished ? "on" : ""}`} onClick={() => set("isPublished", !form.isPublished)} />
                            </div>
                            <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,.05)", display: "flex", alignItems: "center", gap: 6 }}>
                                {form.isPublished
                                    ? <><CheckCircle2 size={13} color="#4ade80" /><span style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>Sẽ xuất bản ngay sau khi tạo</span></>
                                    : <><XCircle size={13} color="#f87171" /><span style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>Lưu dưới dạng nháp</span></>
                                }
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="tc-card" style={{ padding: "18px 20px", flex: 1 }}>
                            <p className="tc-stitle">Lưu ý</p>
                            {[
                                "File audio và ảnh bìa sẽ tự động upload lên Cloudinary sau khi tạo.",
                                "Thời lượng được tự động đọc khi bạn chọn file audio.",
                                "Sau khi tạo, bạn có thể chỉnh sửa thêm từ trang chi tiết.",
                                "Track ID sẽ được cấp bởi hệ thống sau khi tạo.",
                            ].map((note, i) => (
                                <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,.04)" : "none" }}>
                                    <span style={{ fontSize: 11, color: "rgba(74,222,128,.4)", flexShrink: 0, marginTop: 1 }}>→</span>
                                    <span style={{ fontSize: 12, color: "rgba(255,255,255,.38)", lineHeight: 1.55 }}>{note}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ════════ Tab: Media ════════ */}
            {activeTab === "media" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, animation: "ahFadeUp .3s both" }}>

                    {/* ── Cover ── */}
                    <div className="tc-card" style={{ padding: "22px 24px" }}>
                        <p className="tc-stitle">Ảnh bìa</p>

                        {/* Preview */}
                        <div style={{ position: "relative", marginBottom: 16, borderRadius: 14, overflow: "hidden", height: 200, background: "linear-gradient(135deg,#052e16,#14532d)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {activeCoverSrc
                                ? <>
                                    <img src={activeCoverSrc} alt="cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    <button
                                        onClick={() => coverInputRef.current?.click()}
                                        style={{ position: "absolute", bottom: 10, right: 10, display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 100, background: "rgba(0,0,0,.6)", border: "1px solid rgba(255,255,255,.15)", color: "rgba(255,255,255,.8)", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Be Vietnam Pro',sans-serif", backdropFilter: "blur(4px)" }}
                                    >
                                        <Upload size={11} /> Đổi ảnh
                                    </button>
                                </>
                                : <div style={{ textAlign: "center" }}>
                                    <ImageIcon size={36} color="rgba(74,222,128,.22)" style={{ margin: "0 auto 10px", display: "block" }} />
                                    <p style={{ fontSize: 13, color: "rgba(255,255,255,.25)", marginBottom: 4 }}>Chưa có ảnh bìa</p>
                                    <p style={{ fontSize: 11, color: "rgba(255,255,255,.15)" }}>Kéo thả hoặc chọn file bên dưới</p>
                                </div>
                            }
                        </div>

                        {/* Drop zone */}
                        <div
                            className={`tc-drop ${coverDrag ? "drag" : ""}`}
                            onClick={() => coverInputRef.current?.click()}
                            onDragOver={e => { e.preventDefault(); setCoverDrag(true); }}
                            onDragLeave={() => setCoverDrag(false)}
                            onDrop={e => { e.preventDefault(); setCoverDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f, "cover"); }}
                        >
                            <Upload size={22} color={coverDrag ? "#4ade80" : "rgba(255,255,255,.2)"} style={{ margin: "0 auto 10px", display: "block", transition: "color .2s" }} />
                            <p style={{ fontSize: 13, color: coverDrag ? "#4ade80" : "rgba(255,255,255,.3)", fontWeight: 500, transition: "color .2s" }}>
                                Kéo thả hoặc <span style={{ color: "#4ade80" }}>chọn file ảnh</span>
                            </p>
                            <p style={{ fontSize: 11, color: "rgba(255,255,255,.18)", marginTop: 5 }}>JPG, PNG, WEBP · tối đa 5MB</p>
                            {pendingCoverFile.current && (
                                <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 12px", borderRadius: 100, background: "rgba(74,222,128,.1)", border: "1px solid rgba(74,222,128,.2)" }}>
                                    <CheckCircle2 size={11} color="#4ade80" />
                                    <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 600 }}>{pendingCoverFile.current.name}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Audio ── */}
                    <div className="tc-card" style={{ padding: "22px 24px" }}>
                        <p className="tc-stitle">File âm thanh <span className="tc-req" style={{ fontSize: 10 }}>*</span></p>

                        {/* Mini player */}
                        {activeAudioSrc && (
                            <div style={{ marginBottom: 16, padding: "14px 16px", borderRadius: 14, background: "rgba(74,222,128,.05)", border: "1px solid rgba(74,222,128,.12)" }}>
                                {pendingAudioFile.current && (
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, padding: "5px 10px", borderRadius: 8, background: "rgba(74,222,128,.08)" }}>
                                        <span style={{ fontSize: 11 }}>📎</span>
                                        <span style={{ fontSize: 11, color: "rgba(74,222,128,.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                                            {pendingAudioFile.current.name}
                                        </span>
                                        <span style={{ fontSize: 10, color: "rgba(255,255,255,.28)", flexShrink: 0 }}>
                                            {(pendingAudioFile.current.size / 1024 / 1024).toFixed(1)} MB
                                        </span>
                                    </div>
                                )}
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                                    <button
                                        onClick={togglePlay}
                                        style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg,#16a34a,#4ade80)", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                                    >
                                        {playing ? <Pause size={14} color="#0a1a0a" /> : <Play size={14} color="#0a1a0a" style={{ marginLeft: 2 }} />}
                                    </button>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: 10, color: "rgba(255,255,255,.28)", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
                                            {fmt(currentTime)} / {fmt(form.duration)}
                                        </p>
                                    </div>
                                    <button onClick={() => setMuted(m => !m)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,.3)", padding: 0 }}>
                                        {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                                    </button>
                                    <input
                                        type="range" min={0} max={100} value={muted ? 0 : volume}
                                        className="tc-vol"
                                        style={{ "--v": `${muted ? 0 : volume}%` } as any}
                                        onChange={e => { setVolume(+e.target.value); if (+e.target.value > 0) setMuted(false); }}
                                    />
                                </div>
                                {/* Waveform */}
                                <div className="tc-progress" onClick={seek}>
                                    <div style={{ display: "flex", alignItems: "flex-end", gap: 1.5, height: "100%" }}>
                                        {WAVE.map((h, i) => {
                                            const filled = (i / WAVE.length) * 100 <= progress;
                                            return (
                                                <div key={i} style={{
                                                    flex: 1, height: `${Math.min(h, 100)}%`, borderRadius: 2,
                                                    background: filled
                                                        ? `rgba(74,222,128,${.45 + (h / 100) * .55})`
                                                        : `rgba(255,255,255,${.05 + (h / 100) * .04})`,
                                                    ...(playing && filled ? { animation: `ahEq ${.4 + (i % 5) * .1}s ease-in-out infinite`, animationDelay: `${i * .02}s` } : {}),
                                                }} />
                                            );
                                        })}
                                    </div>
                                    <div className="tc-thumb" style={{ left: `${progress}%` }} />
                                </div>
                            </div>
                        )}

                        {/* Drop zone — shows error border if touched and empty */}
                        <div
                            className={`tc-drop ${audioDrag ? "drag" : ""} ${touched.audio && !audioValid ? "err-drop" : ""}`}
                            onClick={() => audioInputRef.current?.click()}
                            onDragOver={e => { e.preventDefault(); setAudioDrag(true); }}
                            onDragLeave={() => setAudioDrag(false)}
                            onDrop={e => { e.preventDefault(); setAudioDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f, "audio"); }}
                        >
                            <FileAudio
                                size={22}
                                color={
                                    audioDrag ? "#4ade80"
                                        : pendingAudioFile.current ? "rgba(74,222,128,.6)"
                                            : touched.audio && !audioValid ? "rgba(248,113,113,.5)"
                                                : "rgba(255,255,255,.2)"
                                }
                                style={{ margin: "0 auto 10px", display: "block", transition: "color .2s" }}
                            />
                            <p style={{ fontSize: 13, color: audioDrag ? "#4ade80" : touched.audio && !audioValid ? "rgba(248,113,113,.6)" : "rgba(255,255,255,.3)", fontWeight: 500, transition: "color .2s" }}>
                                {pendingAudioFile.current
                                    ? <span style={{ color: "rgba(255,255,255,.4)" }}>Đổi file khác</span>
                                    : <>Kéo thả hoặc <span style={{ color: touched.audio && !audioValid ? "#f87171" : "#4ade80" }}>chọn file audio</span></>
                                }
                            </p>
                            <p style={{ fontSize: 11, color: "rgba(255,255,255,.18)", marginTop: 5 }}>MP3, WAV, FLAC · tối đa 50MB</p>
                        </div>

                        {/* Audio error message */}
                        {touched.audio && !audioValid && (
                            <p className="tc-field-err" style={{ marginTop: 8 }}>
                                <AlertCircle size={10} /> Vui lòng chọn file âm thanh
                            </p>
                        )}

                        {/* Duration */}
                        <div className="tc-field" style={{ marginTop: 16, marginBottom: 0 }}>
                            <label className="tc-label"><Music size={10} /> Thời lượng (giây)</label>
                            <div style={{ position: "relative" }}>
                                <input
                                    className="tc-input"
                                    type="number"
                                    value={form.duration || ""}
                                    onChange={e => set("duration", Number(e.target.value))}
                                    placeholder="Tự động khi chọn file..."
                                    min={1}
                                />
                                {form.duration > 0 && (
                                    <span style={{ position: "absolute", right: 12, bottom: 11, fontSize: 10, color: "rgba(74,222,128,.6)", pointerEvents: "none", fontWeight: 600 }}>
                                        {fmt(form.duration)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Bottom bar ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,.06)", animation: "ahFadeUp .5s both", flexWrap: "wrap" }}>
                <Link to="/admin/tracks" style={{ fontSize: 13, color: "rgba(255,255,255,.3)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <ArrowLeft size={13} /> Quay lại danh sách
                </Link>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    {/* Dynamic missing hint */}
                    {!isValid && missingFields.length > 0 && (
                        <span style={{ fontSize: 12, color: "rgba(248,113,113,.6)", display: "flex", alignItems: "center", gap: 4 }}>
                            <AlertCircle size={11} />
                            Còn thiếu: {missingFields.join(", ")}
                        </span>
                    )}
                    <Link to="/admin/tracks" className="tc-pill-btn"><X size={13} /> Huỷ</Link>
                    <button
                        className="tc-create-btn"
                        onClick={handleCreate}
                        disabled={saving || !isValid}
                        title={!isValid ? `Vui lòng điền đủ: ${missingFields.join(", ")}` : ""}
                    >
                        <Plus size={15} /> Tạo bài hát
                    </button>
                </div>
            </div>
        </div>
    );
}