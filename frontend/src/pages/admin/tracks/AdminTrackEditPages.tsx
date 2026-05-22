// src/pages/admin/AdminTrackEditPage.tsx
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import {
    ArrowLeft, Music, Save, X, Upload, Image as ImageIcon,
    Mic2, Tag, Calendar, FileAudio,
    CheckCircle2, XCircle, Eye, EyeOff,
    Loader2, AlertCircle, ChevronDown, Play, Pause,
    Volume2, VolumeX, Hash,
} from "lucide-react";
import axios from "axios";
import { trackService } from "@/services/trackService";
import { artistService } from "@/services/artistService";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

const WAVE = Array.from({ length: 48 }, (_, i) =>
    18 + Math.abs(Math.sin(i * 0.38) * 50 + Math.cos(i * 0.71) * 22)
);

const GENRES = [
    "Pop","R&B","Hip-Hop","Rock","Electronic","Jazz","Classical",
    "Folk","Indie","Country","Dance","Soul","Ballad","Lofi","EDM",
    "Metal","Blues","Reggae","Acoustic",
];

const API = import.meta.env.MODE === "development"
    ? "http://localhost:2004/api"
    : "https://wonmusic-api.up.railway.app/api";

// ─── Types ───────────────────────────────────────────────────────────────────
interface TrackForm {
    title:       string;
    artistId:    string;
    audioUrl:    string;
    coverUrl:    string;
    duration:    number;
    genre:       string;
    releaseYear: string;
    isPublished: boolean;
}

// Touched map — tracks which fields user has interacted with
type TouchedMap = Partial<Record<keyof TrackForm, boolean>>;

type Tab = "basic" | "media";

// ─── Validation helpers ───────────────────────────────────────────────────────
type FieldErrors = Partial<Record<keyof TrackForm, string>>;

function validate(form: TrackForm): FieldErrors {
    const errs: FieldErrors = {};
    if (!form.title.trim())          errs.title    = "Tên bài hát không được để trống.";
    if (!form.artistId)              errs.artistId = "Vui lòng chọn nghệ sĩ.";
    if (!form.audioUrl.trim())       errs.audioUrl = "URL file âm thanh không được để trống.";
    if (!form.duration || form.duration <= 0) errs.duration = "Thời lượng phải lớn hơn 0.";
    return errs;
}

function isFormValid(form: TrackForm): boolean {
    return Object.keys(validate(form)).length === 0;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function AdminTrackEditPages() {
    const { id } = useParams<{ id: string }>();

    const [track,     setTrack]     = useState<any>(null);
    const [artists,   setArtists]   = useState<any[]>([]);
    const [loading,   setLoading]   = useState(true);
    const [saving,    setSaving]    = useState(false);
    const [saved,     setSaved]     = useState(false);
    const [apiError,  setApiError]  = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>("basic");

    // Per-field errors (shown only after field is touched)
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    // Which fields have been blurred / interacted with
    const [touched, setTouched] = useState<TouchedMap>({});
    // Whether user clicked Save at least once (show all errors after that)
    const [submitted, setSubmitted] = useState(false);

    // ── Audio player state ──
    const audioRef    = useRef<HTMLAudioElement>(null);
    const rafRef      = useRef<number>(0);
    const [playing,     setPlaying]     = useState(false);
    const [muted,       setMuted]       = useState(false);
    const [progress,    setProgress]    = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume,      setVolume]      = useState(80);

    // ── Upload state ──
    const [coverDrag,      setCoverDrag]      = useState(false);
    const [audioDrag,      setAudioDrag]      = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [uploadingAudio, setUploadingAudio] = useState(false);
    const coverInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);

    // ── Form ──
    const [form, setForm] = useState<TrackForm>({
        title: "", artistId: "", audioUrl: "",
        coverUrl: "", duration: 0, genre: "", releaseYear: "",
        isPublished: true,
    });

    // Re-run validation whenever form changes
    useEffect(() => {
        setFieldErrors(validate(form));
    }, [form]);

    const set = (field: keyof TrackForm, value: any) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const touch = (field: keyof TrackForm) =>
        setTouched(prev => ({ ...prev, [field]: true }));

    // Returns the error string for a field only when it should be visible
    const fieldErr = (field: keyof TrackForm): string | undefined => {
        if (submitted || touched[field]) return fieldErrors[field];
        return undefined;
    };

    // ── Load data ──
    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                setLoading(true);
                const [trackRes, artistRes] = await Promise.all([
                    trackService.getById(id),
                    artistService.getAll({ limit: 100 }),
                ]);

                const data       = trackRes;
                const artistList = artistRes?.data ?? [];

                setArtists(artistList);

                if (data) {
                    setTrack(data);
                    const artist = data.artistId;
                    setForm({
                        title:       data.title       ?? "",
                        artistId:    artist?._id      ?? artist ?? "",
                        audioUrl:    data.audioUrl    ?? "",
                        coverUrl:    data.coverUrl    ?? "",
                        duration:    data.duration    ?? 0,
                        genre:       data.genre       ?? "",
                        releaseYear: data.releaseYear ? String(data.releaseYear) : "",
                        isPublished: data.isPublished ?? true,
                    });
                }
            } catch {
                setApiError("Không thể tải thông tin bài hát.");
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    // ── Sync audio volume/mute ──
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.volume = volume / 100;
        audio.muted  = muted;
    }, [volume, muted]);

    // ── Player controls ──
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
        if (playing) {
            audio.pause();
            cancelAnimationFrame(rafRef.current);
        } else {
            audio.play();
            rafRef.current = requestAnimationFrame(tick);
        }
        setPlaying(p => !p);
    };

    const seek = (e: React.MouseEvent<HTMLDivElement>) => {
        const audio = audioRef.current;
        if (!audio) return;
        const rect = e.currentTarget.getBoundingClientRect();
        audio.currentTime = ((e.clientX - rect.left) / rect.width) * (audio.duration || 0);
    };

    // ── Upload file → Cloudinary via API ──
    const handleUpload = async (file: File, type: "cover" | "audio") => {
        const formData = new FormData();
        formData.append(type === "cover" ? "cover" : "audio", file);

        if (type === "cover") setUploadingCover(true);
        else                  setUploadingAudio(true);
        setApiError(null);

        try {
            const res = await axios.put(`${API}/tracks/${id}`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const updated = res.data.data;
            if (type === "cover") {
                set("coverUrl", updated.coverUrl);
            } else {
                set("audioUrl", updated.audioUrl);
                touch("audioUrl");
                // Reset player
                setPlaying(false);
                setProgress(0);
                setCurrentTime(0);
                cancelAnimationFrame(rafRef.current);
            }
        } catch (e: any) {
            setApiError(e?.response?.data?.message ?? "Upload thất bại. Vui lòng thử lại.");
        } finally {
            if (type === "cover") setUploadingCover(false);
            else                  setUploadingAudio(false);
        }
    };

    // ── Save ──
    const handleSave = async () => {
        setSubmitted(true);
        const errs = validate(form);
        if (Object.keys(errs).length > 0) {
            // Switch to tab that contains the first error
            const basicFields: (keyof TrackForm)[] = ["title", "artistId"];
            const mediaFields: (keyof TrackForm)[] = ["audioUrl", "duration"];
            const errKeys = Object.keys(errs) as (keyof TrackForm)[];
            if (errKeys.some(k => basicFields.includes(k))) setActiveTab("basic");
            else if (errKeys.some(k => mediaFields.includes(k))) setActiveTab("media");
            return;
        }
        setSaving(true);
        setApiError(null);
        try {
            await trackService.update(id!, {
                ...form,
                releaseYear: form.releaseYear ? Number(form.releaseYear) : undefined,
            } as any);
            setSaved(true);
            setTimeout(() => setSaved(false), 2800);
        } catch (e: any) {
            setApiError(e?.response?.data?.message ?? "Lưu thất bại. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

    const formValid  = isFormValid(form);
    // Count errors per tab for the badge indicators
    const basicErrCount = (["title","artistId"] as (keyof TrackForm)[])
        .filter(k => !!fieldErrors[k]).length;
    const mediaErrCount = (["audioUrl","duration"] as (keyof TrackForm)[])
        .filter(k => !!fieldErrors[k]).length;

    // ── Loading skeleton ──
    if (loading) return (
        <div style={{ fontFamily:"'Be Vietnam Pro',sans-serif" }}>
            <style>{`@keyframes sk{0%,100%{opacity:.35}50%{opacity:.75}}`}</style>
            <div style={{ animation:"sk 1.5s ease-in-out infinite" }}>
                <div style={{ width:130, height:14, borderRadius:6, background:"rgba(255,255,255,.07)", marginBottom:28 }} />
                {[1,2,3,4].map(i => (
                    <div key={i} style={{ height:52, borderRadius:12, background:"rgba(255,255,255,.04)", marginBottom:12 }} />
                ))}
            </div>
        </div>
    );

    if (!track && !loading) return (
        <div style={{ fontFamily:"'Be Vietnam Pro',sans-serif", padding:"60px 0", textAlign:"center" }}>
            <AlertCircle size={36} color="rgba(248,113,113,.5)" style={{ margin:"0 auto 12px", display:"block" }} />
            <p style={{ color:"rgba(255,255,255,.3)", fontSize:14 }}>Không tìm thấy bài hát</p>
            <Link to="/admin/tracks" style={{ color:"#4ade80", fontSize:13, textDecoration:"none", marginTop:10, display:"inline-block" }}>
                ← Quay lại
            </Link>
        </div>
    );

    return (
        <div style={{ fontFamily:"'Be Vietnam Pro',sans-serif", maxWidth:900, paddingBottom:80 }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');

                @keyframes ahFadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
                @keyframes ahPulse   { 0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,.35)} 50%{box-shadow:0 0 0 6px rgba(74,222,128,0)} }
                @keyframes ahSpin    { to{transform:rotate(360deg)} }
                @keyframes ahEq      { 0%,100%{transform:scaleY(.2)} 50%{transform:scaleY(1)} }
                @keyframes savedPop  { 0%{transform:scale(.8);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
                @keyframes shake     { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-4px)} 40%,80%{transform:translateX(4px)} }
                @keyframes errIn     { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }

                .te-card {
                    border-radius:18px;
                    border:1px solid rgba(255,255,255,.07);
                    background:rgba(255,255,255,.025);
                }
                .te-input, .te-select {
                    width:100%; box-sizing:border-box;
                    background:rgba(255,255,255,.04);
                    border:1px solid rgba(255,255,255,.08);
                    border-radius:11px; padding:11px 14px;
                    color:#fff; font-size:14px; font-weight:500;
                    font-family:'Be Vietnam Pro',sans-serif; outline:none;
                    transition:border-color .18s, background .18s, box-shadow .18s;
                }
                .te-input:focus, .te-select:focus {
                    border-color:rgba(74,222,128,.45);
                    background:rgba(74,222,128,.04);
                    box-shadow:0 0 0 3px rgba(74,222,128,.08);
                }
                .te-input::placeholder { color:rgba(255,255,255,.22); font-weight:400; }
                .te-input.err, .te-select.err {
                    border-color:rgba(248,113,113,.55) !important;
                    background:rgba(248,113,113,.04) !important;
                    box-shadow:0 0 0 3px rgba(248,113,113,.08) !important;
                }

                .te-select {
                    padding-right:38px;
                    -webkit-appearance:none; appearance:none; cursor:pointer;
                }
                .te-select option { background:#141a14; }

                .te-label {
                    display:flex; align-items:center; gap:5px;
                    font-size:11px; font-weight:700;
                    color:rgba(255,255,255,.3);
                    letter-spacing:1.8px; text-transform:uppercase;
                    margin-bottom:7px;
                }
                .te-field { margin-bottom:18px; position:relative; }
                .te-req   { color:#f87171; }

                .te-field-err {
                    display:flex; align-items:center; gap:5px;
                    font-size:11px; color:#f87171; margin-top:5px;
                    animation:errIn .2s ease;
                }

                .te-pill-btn {
                    display:inline-flex; align-items:center; gap:7px;
                    padding:8px 15px; border-radius:100px;
                    border:1px solid rgba(255,255,255,.09);
                    background:rgba(255,255,255,.03);
                    color:rgba(255,255,255,.5); font-size:13px; font-weight:500;
                    text-decoration:none; cursor:pointer;
                    font-family:'Be Vietnam Pro',sans-serif; transition:all .18s;
                }
                .te-pill-btn:hover {
                    background:rgba(255,255,255,.07);
                    color:#fff; border-color:rgba(255,255,255,.15);
                }

                .te-tab {
                    position:relative;
                    padding:8px 20px; border-radius:100px;
                    font-size:13px; font-weight:600; cursor:pointer;
                    border:1px solid transparent; transition:all .18s;
                    font-family:'Be Vietnam Pro',sans-serif;
                    color:rgba(255,255,255,.38); background:transparent;
                }
                .te-tab:hover { color:rgba(255,255,255,.7); }
                .te-tab.active {
                    color:#4ade80;
                    border-color:rgba(74,222,128,.22);
                    background:rgba(74,222,128,.07);
                }
                .te-tab.has-err {
                    border-color:rgba(248,113,113,.25) !important;
                }
                .te-tab.has-err:not(.active) {
                    color:rgba(248,113,113,.7);
                }

                .te-err-badge {
                    display:inline-flex; align-items:center; justify-content:center;
                    width:16px; height:16px; border-radius:50%;
                    background:#f87171; color:#fff;
                    font-size:9px; font-weight:800;
                    margin-left:4px; line-height:1;
                }

                .te-drop {
                    border:2px dashed rgba(255,255,255,.1); border-radius:14px;
                    padding:24px 20px; text-align:center; cursor:pointer;
                    transition:all .2s; background:rgba(255,255,255,.02);
                }
                .te-drop:hover, .te-drop.drag {
                    border-color:rgba(74,222,128,.45);
                    background:rgba(74,222,128,.05);
                }

                .te-toggle {
                    position:relative; width:46px; height:26px;
                    background:rgba(255,255,255,.1); border-radius:100px;
                    cursor:pointer; transition:background .22s;
                    flex-shrink:0; border:none; outline:none;
                }
                .te-toggle::after {
                    content:''; position:absolute; top:4px; left:4px;
                    width:18px; height:18px; border-radius:50%;
                    background:rgba(255,255,255,.45); transition:all .22s;
                }
                .te-toggle.on {
                    background:linear-gradient(135deg,#16a34a,#4ade80);
                    animation:ahPulse 1.5s ease 1;
                }
                .te-toggle.on::after { left:24px; background:#fff; }

                .te-save {
                    display:inline-flex; align-items:center; gap:8px;
                    padding:11px 28px; border-radius:12px;
                    font-size:14px; font-weight:700; cursor:pointer;
                    font-family:'Be Vietnam Pro',sans-serif; border:none; transition:all .18s;
                }
                .te-save:hover:not(:disabled) { transform:translateY(-1px); filter:brightness(1.08); }
                .te-save:disabled { opacity:.55; cursor:not-allowed; }

                .te-stitle {
                    font-size:11px; color:rgba(255,255,255,.28);
                    letter-spacing:2px; text-transform:uppercase; font-weight:700;
                    margin-bottom:20px; display:flex; align-items:center; gap:8px;
                }
                .te-stitle::after {
                    content:''; flex:1; height:1px; background:rgba(255,255,255,.05);
                }

                .te-progress {
                    position:relative; height:32px; cursor:pointer;
                    border-radius:6px; overflow:hidden;
                }
                .te-thumb {
                    position:absolute; top:50%; width:10px; height:10px;
                    border-radius:50%; background:#4ade80;
                    transform:translate(-50%,-50%);
                    box-shadow:0 0 6px rgba(74,222,128,.5);
                    pointer-events:none; transition:left .05s linear;
                }
                .te-vol {
                    -webkit-appearance:none; appearance:none;
                    width:68px; height:3px; border-radius:3px;
                    cursor:pointer; outline:none;
                    background:linear-gradient(90deg,#4ade80 var(--v),rgba(255,255,255,.1) var(--v));
                }
                .te-vol::-webkit-slider-thumb {
                    -webkit-appearance:none; width:10px; height:10px;
                    border-radius:50%; background:#4ade80; cursor:pointer;
                }

                /* Validation summary banner */
                .te-val-banner {
                    display:flex; align-items:flex-start; gap:10px;
                    padding:12px 16px; border-radius:12px;
                    background:rgba(248,113,113,.08);
                    border:1px solid rgba(248,113,113,.2);
                    margin-bottom:18px; animation:shake .35s ease;
                }
                .te-val-banner ul {
                    margin:4px 0 0; padding-left:16px;
                    display:flex; flex-direction:column; gap:3px;
                }
                .te-val-banner li { font-size:12px; color:rgba(248,113,113,.9); }
            `}</style>

            {/* Hidden audio */}
            {form.audioUrl && (
                <audio
                    ref={audioRef}
                    src={form.audioUrl}
                    onEnded={() => {
                        setPlaying(false); setProgress(0); setCurrentTime(0);
                        cancelAnimationFrame(rafRef.current);
                    }}
                />
            )}

            {/* Hidden file inputs */}
            <input ref={coverInputRef} type="file" accept="image/*" style={{ display:"none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f, "cover"); }} />
            <input ref={audioInputRef} type="file" accept="audio/*" style={{ display:"none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f, "audio"); }} />

            {/* ── Breadcrumb ── */}
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:22, animation:"ahFadeUp .3s both", flexWrap:"wrap" }}>
                <Link to="/admin/tracks" className="te-pill-btn"><ArrowLeft size={13} /> Bài hát</Link>
                <span style={{ color:"rgba(255,255,255,.18)", fontSize:12 }}>/</span>
                <span style={{ fontSize:13, color:"rgba(255,255,255,.4)", maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {track?.title ?? id}
                </span>
                <span style={{ color:"rgba(255,255,255,.18)", fontSize:12 }}>/</span>
                <span style={{ fontSize:13, color:"rgba(255,255,255,.4)" }}>Chỉnh sửa</span>
            </div>

            {/* ── Header ── */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24, animation:"ahFadeUp .35s both", flexWrap:"wrap", gap:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                    <div style={{ width:54, height:54, borderRadius:13, overflow:"hidden", flexShrink:0, background:"linear-gradient(135deg,#052e16,#14532d)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        {form.coverUrl
                            ? <img src={form.coverUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                            : <Music size={20} color="rgba(74,222,128,.3)" />
                        }
                    </div>
                    <div>
                        <p style={{ fontSize:11, color:"#4ade80", fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", marginBottom:4 }}>
                            Chỉnh sửa bài hát
                        </p>
                        <h1 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:30, color:"#fff", letterSpacing:2, lineHeight:1 }}>
                            {form.title || track?.title || "—"}
                        </h1>
                    </div>
                </div>
                <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                    <Link to="/admin/tracks" className="te-pill-btn"><X size={13} /> Huỷ</Link>
                    <SaveBtn saving={saving} saved={saved} valid={formValid} onClick={handleSave} />
                </div>
            </div>

            {/* ── API Error ── */}
            {apiError && (
                <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px", borderRadius:12, background:"rgba(248,113,113,.08)", border:"1px solid rgba(248,113,113,.2)", marginBottom:18, animation:"shake .35s ease" }}>
                    <AlertCircle size={15} color="#f87171" style={{ flexShrink:0 }} />
                    <span style={{ fontSize:13, color:"#f87171", flex:1 }}>{apiError}</span>
                    <button onClick={() => setApiError(null)} style={{ background:"none", border:"none", color:"rgba(248,113,113,.5)", cursor:"pointer", padding:0 }}>
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* ── Validation summary (shown after first submit attempt) ── */}
            {submitted && !formValid && (
                <div className="te-val-banner">
                    <AlertCircle size={15} color="#f87171" style={{ flexShrink:0, marginTop:1 }} />
                    <div>
                        <p style={{ fontSize:13, color:"#f87171", fontWeight:700, marginBottom:0 }}>
                            Vui lòng điền đầy đủ các trường bắt buộc:
                        </p>
                        <ul>
                            {Object.values(fieldErrors).map((msg, i) => (
                                <li key={i}>{msg}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* ── Tabs ── */}
            <div style={{ display:"flex", gap:6, marginBottom:20, animation:"ahFadeUp .4s both" }}>
                {(["basic","media"] as Tab[]).map(tab => {
                    const errCount = tab === "basic" ? basicErrCount : mediaErrCount;
                    const showBadge = submitted && errCount > 0;
                    return (
                        <button
                            key={tab}
                            className={`te-tab ${activeTab===tab?"active":""} ${showBadge?"has-err":""}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {{ basic:"Thông tin cơ bản", media:"Media & Audio" }[tab]}
                            {showBadge && <span className="te-err-badge">{errCount}</span>}
                        </button>
                    );
                })}
            </div>

            {/* ════════ Tab: Basic ════════ */}
            {activeTab === "basic" && (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, animation:"ahFadeUp .3s both" }}>

                    {/* Left */}
                    <div className="te-card" style={{ padding:"22px 24px" }}>
                        <p className="te-stitle">Thông tin bài hát</p>

                        {/* Title */}
                        <div className="te-field">
                            <label className="te-label"><Music size={10} /> Tên bài hát <span className="te-req">*</span></label>
                            <div style={{ position:"relative" }}>
                                <input
                                    className={`te-input ${fieldErr("title") ? "err" : ""}`}
                                    value={form.title}
                                    onChange={e => set("title", e.target.value)}
                                    onBlur={() => touch("title")}
                                    placeholder="Nhập tên bài hát..."
                                    maxLength={120}
                                />
                                <span style={{ position:"absolute", right:12, bottom:11, fontSize:10, color:"rgba(255,255,255,.18)", pointerEvents:"none" }}>
                                    {form.title.length}/120
                                </span>
                            </div>
                            {fieldErr("title") && (
                                <p className="te-field-err">
                                    <AlertCircle size={10} /> {fieldErr("title")}
                                </p>
                            )}
                        </div>

                        {/* Artist */}
                        <div className="te-field">
                            <label className="te-label"><Mic2 size={10} /> Nghệ sĩ <span className="te-req">*</span></label>
                            <div style={{ position:"relative" }}>
                                <select
                                    className={`te-select ${fieldErr("artistId") ? "err" : ""}`}
                                    value={form.artistId}
                                    onChange={e => { set("artistId", e.target.value); touch("artistId"); }}
                                    onBlur={() => touch("artistId")}
                                >
                                    <option value="">-- Chọn nghệ sĩ --</option>
                                    {artists.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                                </select>
                                <ChevronDown size={13} color="rgba(255,255,255,.3)" style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} />
                            </div>
                            {fieldErr("artistId") && (
                                <p className="te-field-err">
                                    <AlertCircle size={10} /> {fieldErr("artistId")}
                                </p>
                            )}
                        </div>

                        {/* Genre */}
                        <div className="te-field">
                            <label className="te-label"><Tag size={10} /> Thể loại</label>
                            <div style={{ position:"relative" }}>
                                <select className="te-select" value={form.genre} onChange={e => set("genre", e.target.value)}>
                                    <option value="">-- Chọn thể loại --</option>
                                    {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                                <ChevronDown size={13} color="rgba(255,255,255,.3)" style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} />
                            </div>
                        </div>

                        {/* Release year */}
                        <div className="te-field" style={{ marginBottom:0 }}>
                            <label className="te-label"><Calendar size={10} /> Năm phát hành</label>
                            <input
                                className="te-input" type="number"
                                value={form.releaseYear}
                                onChange={e => set("releaseYear", e.target.value)}
                                placeholder={String(new Date().getFullYear())}
                                min={1900} max={new Date().getFullYear() + 1}
                            />
                        </div>
                    </div>

                    {/* Right */}
                    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

                        {/* Published toggle */}
                        <div className="te-card" style={{ padding:"20px 22px" }}>
                            <p className="te-stitle">Trạng thái</p>
                            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
                                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                                    <div style={{ width:40, height:40, borderRadius:11, flexShrink:0, background:form.isPublished?"rgba(74,222,128,.1)":"rgba(255,255,255,.05)", display:"flex", alignItems:"center", justifyContent:"center", transition:"background .2s" }}>
                                        {form.isPublished
                                            ? <Eye size={16} color="#4ade80" />
                                            : <EyeOff size={16} color="rgba(255,255,255,.28)" />
                                        }
                                    </div>
                                    <div>
                                        <p style={{ fontSize:13, fontWeight:700, color:form.isPublished?"#fff":"rgba(255,255,255,.45)", marginBottom:3, transition:"color .2s" }}>
                                            {form.isPublished ? "Đã xuất bản" : "Chưa xuất bản"}
                                        </p>
                                        <p style={{ fontSize:11, color:"rgba(255,255,255,.25)" }}>
                                            {form.isPublished ? "Người dùng có thể tìm và nghe" : "Bài hát ẩn với công chúng"}
                                        </p>
                                    </div>
                                </div>
                                <button className={`te-toggle ${form.isPublished?"on":""}`} onClick={() => set("isPublished", !form.isPublished)} />
                            </div>
                            <div style={{ marginTop:14, paddingTop:12, borderTop:"1px solid rgba(255,255,255,.05)", display:"flex", alignItems:"center", gap:6 }}>
                                {form.isPublished
                                    ? <><CheckCircle2 size={13} color="#4ade80" /><span style={{ fontSize:12, color:"rgba(255,255,255,.4)" }}>Badge: <span style={{ color:"#4ade80", fontWeight:700 }}>Đã xuất bản</span></span></>
                                    : <><XCircle size={13} color="#f87171" /><span style={{ fontSize:12, color:"rgba(255,255,255,.4)" }}>Badge: <span style={{ color:"#f87171", fontWeight:700 }}>Chưa xuất bản</span></span></>
                                }
                            </div>
                        </div>

                        {/* System info */}
                        <div className="te-card" style={{ padding:"20px 22px", flex:1 }}>
                            <p className="te-stitle">Thông tin hệ thống</p>
                            {[
                                { label:"Track ID",  value: id,                                                                             icon: Hash     },
                                { label:"Lượt nghe", value: (track?.plays ?? 0).toLocaleString("vi"),                                      icon: Music    },
                                { label:"Ngày tạo",  value: track?.createdAt ? new Date(track.createdAt).toLocaleDateString("vi-VN") : "—", icon: Calendar },
                                { label:"Cập nhật",  value: track?.updatedAt ? new Date(track.updatedAt).toLocaleDateString("vi-VN") : "—", icon: Calendar },
                            ].map(({ label, value, icon:Icon }) => (
                                <div key={label} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,.04)" }}>
                                    <Icon size={12} color="rgba(74,222,128,.4)" style={{ flexShrink:0 }} />
                                    <span style={{ fontSize:12, color:"rgba(255,255,255,.3)", width:90, flexShrink:0 }}>{label}</span>
                                    <span style={{ fontSize:12, color:"rgba(255,255,255,.6)", fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                        {value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ════════ Tab: Media ════════ */}
            {activeTab === "media" && (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, animation:"ahFadeUp .3s both" }}>

                    {/* ── Cover ── */}
                    <div className="te-card" style={{ padding:"22px 24px" }}>
                        <p className="te-stitle">Ảnh bìa</p>

                        {/* Preview */}
                        <div style={{ position:"relative", marginBottom:16, borderRadius:14, overflow:"hidden", height:190, background:"linear-gradient(135deg,#052e16,#14532d)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                            {form.coverUrl
                                ? <img src={form.coverUrl} alt="cover" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                                : <div style={{ textAlign:"center" }}>
                                    <ImageIcon size={32} color="rgba(74,222,128,.22)" style={{ margin:"0 auto 8px", display:"block" }} />
                                    <p style={{ fontSize:12, color:"rgba(255,255,255,.2)" }}>Chưa có ảnh bìa</p>
                                  </div>
                            }
                            {uploadingCover && (
                                <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                    <Loader2 size={28} color="#4ade80" style={{ animation:"ahSpin .7s linear infinite" }} />
                                </div>
                            )}
                        </div>

                        {/* URL input */}
                        <div className="te-field">
                            <label className="te-label"><ImageIcon size={10} /> URL ảnh bìa</label>
                            <input
                                className="te-input"
                                value={form.coverUrl}
                                onChange={e => set("coverUrl", e.target.value)}
                                placeholder="https://..."
                            />
                        </div>

                        {/* Drop zone */}
                        <div
                            className={`te-drop ${coverDrag?"drag":""}`}
                            onClick={() => coverInputRef.current?.click()}
                            onDragOver={e => { e.preventDefault(); setCoverDrag(true); }}
                            onDragLeave={() => setCoverDrag(false)}
                            onDrop={e => {
                                e.preventDefault(); setCoverDrag(false);
                                const f = e.dataTransfer.files[0];
                                if (f) handleUpload(f, "cover");
                            }}
                        >
                            {uploadingCover ? (
                                <><Loader2 size={20} color="#4ade80" style={{ margin:"0 auto 8px", display:"block", animation:"ahSpin .7s linear infinite" }} />
                                <p style={{ fontSize:13, color:"#4ade80" }}>Đang upload...</p></>
                            ) : (
                                <><Upload size={20} color={coverDrag?"#4ade80":"rgba(255,255,255,.2)"} style={{ margin:"0 auto 8px", display:"block", transition:"color .2s" }} />
                                <p style={{ fontSize:13, color:coverDrag?"#4ade80":"rgba(255,255,255,.3)", fontWeight:500, transition:"color .2s" }}>
                                    Kéo thả hoặc <span style={{ color:"#4ade80" }}>chọn file</span>
                                </p>
                                <p style={{ fontSize:11, color:"rgba(255,255,255,.18)", marginTop:4 }}>JPG, PNG, WEBP · tối đa 5MB</p></>
                            )}
                        </div>
                    </div>

                    {/* ── Audio ── */}
                    <div className="te-card" style={{ padding:"22px 24px" }}>
                        <p className="te-stitle">File âm thanh</p>

                        {/* Mini player */}
                        {form.audioUrl && (
                            <div style={{ marginBottom:16, padding:"14px 16px", borderRadius:14, background:"rgba(74,222,128,.05)", border:"1px solid rgba(74,222,128,.12)" }}>
                                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                                    <button
                                        onClick={togglePlay}
                                        style={{ width:36, height:36, borderRadius:"50%", flexShrink:0, background:"linear-gradient(135deg,#16a34a,#4ade80)", border:"none", cursor:"pointer", display:"inline-flex", alignItems:"center", justifyContent:"center" }}
                                    >
                                        {playing
                                            ? <Pause size={14} color="#0a1a0a" />
                                            : <Play  size={14} color="#0a1a0a" style={{ marginLeft:2 }} />
                                        }
                                    </button>
                                    <div style={{ flex:1, minWidth:0 }}>
                                        <p style={{ fontSize:11, color:"rgba(255,255,255,.55)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                            {form.audioUrl.split("/").pop()}
                                        </p>
                                        <p style={{ fontSize:10, color:"rgba(255,255,255,.28)", marginTop:2 }}>
                                            {fmt(currentTime)} / {fmt(form.duration)}
                                        </p>
                                    </div>
                                    <button onClick={() => setMuted(m => !m)} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,.3)", padding:0 }}>
                                        {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                                    </button>
                                    <input
                                        type="range" min={0} max={100} value={muted ? 0 : volume}
                                        className="te-vol"
                                        style={{ "--v":`${muted ? 0 : volume}%` } as any}
                                        onChange={e => { setVolume(+e.target.value); if (+e.target.value > 0) setMuted(false); }}
                                    />
                                </div>
                                {/* Waveform progress */}
                                <div className="te-progress" onClick={seek}>
                                    <div style={{ display:"flex", alignItems:"flex-end", gap:1.5, height:"100%" }}>
                                        {WAVE.map((h, i) => {
                                            const filled = (i / WAVE.length) * 100 <= progress;
                                            return (
                                                <div key={i} style={{
                                                    flex:1, height:`${Math.min(h,100)}%`, borderRadius:2,
                                                    background: filled
                                                        ? `rgba(74,222,128,${.45+(h/100)*.55})`
                                                        : `rgba(255,255,255,${.05+(h/100)*.04})`,
                                                    ...(playing && filled ? {
                                                        animation:`ahEq ${.4+(i%5)*.1}s ease-in-out infinite`,
                                                        animationDelay:`${i*.02}s`,
                                                    } : {}),
                                                }} />
                                            );
                                        })}
                                    </div>
                                    <div className="te-thumb" style={{ left:`${progress}%` }} />
                                </div>
                            </div>
                        )}

                        {/* Audio URL input */}
                        <div className="te-field">
                            <label className="te-label"><FileAudio size={10} /> URL file âm thanh <span className="te-req">*</span></label>
                            <input
                                className={`te-input ${fieldErr("audioUrl") ? "err" : ""}`}
                                value={form.audioUrl}
                                onChange={e => set("audioUrl", e.target.value)}
                                onBlur={() => touch("audioUrl")}
                                placeholder="https://..."
                            />
                            {fieldErr("audioUrl") && (
                                <p className="te-field-err">
                                    <AlertCircle size={10} /> {fieldErr("audioUrl")}
                                </p>
                            )}
                        </div>

                        {/* Drop zone */}
                        <div
                            className={`te-drop ${audioDrag?"drag":""}`}
                            onClick={() => audioInputRef.current?.click()}
                            onDragOver={e => { e.preventDefault(); setAudioDrag(true); }}
                            onDragLeave={() => setAudioDrag(false)}
                            onDrop={e => {
                                e.preventDefault(); setAudioDrag(false);
                                const f = e.dataTransfer.files[0];
                                if (f) handleUpload(f, "audio");
                            }}
                        >
                            {uploadingAudio ? (
                                <><Loader2 size={20} color="#4ade80" style={{ margin:"0 auto 8px", display:"block", animation:"ahSpin .7s linear infinite" }} />
                                <p style={{ fontSize:13, color:"#4ade80" }}>Đang upload lên Cloudinary...</p></>
                            ) : (
                                <><FileAudio size={20} color={audioDrag?"#4ade80":"rgba(255,255,255,.2)"} style={{ margin:"0 auto 8px", display:"block", transition:"color .2s" }} />
                                <p style={{ fontSize:13, color:audioDrag?"#4ade80":"rgba(255,255,255,.3)", fontWeight:500, transition:"color .2s" }}>
                                    Kéo thả hoặc <span style={{ color:"#4ade80" }}>chọn file âm thanh</span>
                                </p>
                                <p style={{ fontSize:11, color:"rgba(255,255,255,.18)", marginTop:4 }}>MP3, WAV, FLAC · tối đa 50MB</p></>
                            )}
                        </div>

                        {/* Duration */}
                        <div className="te-field" style={{ marginTop:16, marginBottom:0 }}>
                            <label className="te-label"><Music size={10} /> Thời lượng (giây) <span className="te-req">*</span></label>
                            <div style={{ position:"relative" }}>
                                <input
                                    className={`te-input ${fieldErr("duration") ? "err" : ""}`}
                                    type="number"
                                    value={form.duration || ""}
                                    onChange={e => set("duration", Number(e.target.value))}
                                    onBlur={() => touch("duration")}
                                    placeholder="213"
                                    min={1}
                                />
                                {form.duration > 0 && (
                                    <span style={{ position:"absolute", right:12, bottom:11, fontSize:10, color:"rgba(74,222,128,.6)", pointerEvents:"none", fontWeight:600 }}>
                                        {fmt(form.duration)}
                                    </span>
                                )}
                            </div>
                            {fieldErr("duration") && (
                                <p className="te-field-err">
                                    <AlertCircle size={10} /> {fieldErr("duration")}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Bottom bar ── */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, marginTop:24, paddingTop:20, borderTop:"1px solid rgba(255,255,255,.06)", animation:"ahFadeUp .5s both", flexWrap:"wrap" }}>
                <Link to="/admin/tracks" style={{ fontSize:13, color:"rgba(255,255,255,.3)", textDecoration:"none", display:"inline-flex", alignItems:"center", gap:5 }}>
                    <ArrowLeft size={13} /> Quay lại danh sách
                </Link>
                <div style={{ display:"flex", gap:10 }}>
                    <Link to="/admin/tracks" className="te-pill-btn"><X size={13} /> Huỷ thay đổi</Link>
                    <SaveBtn saving={saving} saved={saved} valid={formValid} onClick={handleSave} />
                </div>
            </div>
        </div>
    );
}

// ─── Save Button ─────────────────────────────────────────────────────────────
function SaveBtn({
    saving, saved, valid, onClick,
}: {
    saving: boolean;
    saved:  boolean;
    valid:  boolean;
    onClick: () => void;
}) {
    // Button is always rendered but visually disabled + tooltip when invalid
    return (
        <button
            className="te-save"
            onClick={onClick}
            disabled={saving}
            title={!valid ? "Vui lòng điền đầy đủ các trường bắt buộc trước khi lưu" : undefined}
            style={{
                background: saved
                    ? "linear-gradient(135deg,#166534,#22c55e)"
                    : valid
                        ? "linear-gradient(135deg,#16a34a,#4ade80)"
                        : "rgba(255,255,255,.07)",
                color:      valid || saved ? "#0a1a0a" : "rgba(255,255,255,.25)",
                boxShadow:  valid || saved ? "0 4px 18px rgba(74,222,128,.25)" : "none",
                border:     valid || saved ? "none" : "1px solid rgba(255,255,255,.09)",
                cursor:     saving ? "not-allowed" : valid ? "pointer" : "not-allowed",
                animation:  saved ? "savedPop .35s ease" : undefined,
                transition: "all .22s",
            }}
        >
            {saving ? (
                <><Loader2 size={15} style={{ animation:"ahSpin .7s linear infinite" }} /> Đang lưu...</>
            ) : saved ? (
                <><CheckCircle2 size={15} /> Đã lưu!</>
            ) : !valid ? (
                <><AlertCircle size={15} /> Chưa đủ thông tin</>
            ) : (
                <><Save size={15} /> Lưu thay đổi</>
            )}
        </button>
    );
}