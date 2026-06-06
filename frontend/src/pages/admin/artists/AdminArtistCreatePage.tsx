'use client';
// src/pages/admin/AdminArtistCreatePage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft, Mic2, X, Upload, Image as ImageIcon,
    Tag, CheckCircle2, XCircle,
    Loader2, AlertCircle, Plus, Sparkles,
    Facebook, Instagram, Youtube, Music,
    Users, BadgeCheck, FileText,
} from "lucide-react";
import { artistService } from "@/services/artistService";
import axios from "axios";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────
interface ArtistForm {
    name:      string;
    bio:       string;
    genre:     string;
    followers: string;
    verified:  boolean;
    socialLinks: {
        facebook:  string;
        instagram: string;
        youtube:   string;
        tiktok:    string;
    };
}

type Tab = "basic" | "social";
type FieldErrors = Partial<{
    name: string;
    genre: string;
    followers: string;
    bio: string;
    avatar: string;
    socialLinks: Partial<Record<keyof ArtistForm["socialLinks"], string>>;
}>;

const GENRES = [
    "Pop","R&B","Hip-Hop","Rock","Electronic","Jazz","Classical",
    "Folk","Indie","Country","Dance","Soul","Ballad","Lofi","EDM",
    "Metal","Blues","Reggae","Acoustic",
];

const EMPTY_FORM: ArtistForm = {
    name:      "",
    bio:       "",
    genre:     "",
    followers: "0",
    verified:  false,
    socialLinks: { facebook: "", instagram: "", youtube: "", tiktok: "" },
};

const API = "/api";

// ─── Component ───────────────────────────────────────────────────────────────
export default function AdminArtistCreatePage() {
    const router = useRouter();

    const [saving,         setSaving]         = useState(false);
    const [error,          setError]          = useState<string | null>(null);
    const [fieldErrors,    setFieldErrors]    = useState<FieldErrors>({});
    const [activeTab,      setActiveTab]      = useState<Tab>("basic");
    const [coverDrag,      setCoverDrag]      = useState(false);
    const [avatarPreview,  setAvatarPreview]  = useState<string>("");
    const [uploadingAvatar,setUploadingAvatar]= useState(false);

    const avatarInputRef    = useRef<HTMLInputElement>(null);
    const pendingAvatarFile = useRef<File | null>(null);
    const avatarBlobUrl     = useRef<string>("");

    // Cleanup blob URL on unmount to prevent memory leak
    useEffect(() => {
        return () => { if (avatarBlobUrl.current) URL.revokeObjectURL(avatarBlobUrl.current); };
    }, []);

    const [form, setForm] = useState<ArtistForm>(EMPTY_FORM);

    const set = (field: keyof ArtistForm, value: any) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const setSocial = (platform: keyof ArtistForm["socialLinks"], value: string) =>
        setForm(prev => ({
            ...prev,
            socialLinks: { ...prev.socialLinks, [platform]: value },
        }));

    // ── File select → local preview ──
    const handleFileSelect = (file: File) => {
        const maxBytes = 5 * 1024 * 1024;
        if (!file.type.startsWith("image/")) {
            setFieldErrors(prev => ({ ...prev, avatar: "File phải là hình ảnh (JPG/PNG/WEBP)." }));
            return;
        }
        if (file.size > maxBytes) {
            setFieldErrors(prev => ({ ...prev, avatar: "Ảnh quá lớn. Vui lòng chọn ảnh <= 5MB." }));
            return;
        }
        setFieldErrors(prev => ({ ...prev, avatar: undefined }));
        pendingAvatarFile.current = file;
        if (avatarBlobUrl.current) URL.revokeObjectURL(avatarBlobUrl.current);
        const url = URL.createObjectURL(file);
        avatarBlobUrl.current = url;
        setAvatarPreview(url);
    };

    // ── Upload avatar via PUT after create ──
    const uploadAvatar = async (artistId: string, file: File) => {
        const fd = new FormData();
        fd.append("avatar", file);
        const res = await axios.put(`${API}/artists/${artistId}`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data;
    };

    const isProbablyUrl = (raw: string) => {
        const v = raw.trim();
        if (!v) return true;
        try {
            const u = new URL(v);
            return u.protocol === "http:" || u.protocol === "https:";
        } catch {
            return false;
        }
    };

    // ── Validate ──
    const validate = (): FieldErrors => {
        const next: FieldErrors = {};

        if (!form.name.trim()) next.name = "Tên nghệ sĩ là bắt buộc.";
        if (!form.genre.trim()) next.genre = "Vui lòng chọn thể loại.";

        const followersNum = Number(form.followers);
        if (form.followers === "" || Number.isNaN(followersNum)) next.followers = "Số followers phải là số.";
        else if (followersNum < 0) next.followers = "Số followers không được âm.";

        if (form.bio.length > 500) next.bio = "Tiểu sử tối đa 500 ký tự.";

        const socialErrs: NonNullable<FieldErrors["socialLinks"]> = {};
        (Object.keys(form.socialLinks) as Array<keyof ArtistForm["socialLinks"]>).forEach((k) => {
            const v = form.socialLinks[k];
            if (v.trim() && !isProbablyUrl(v)) {
                socialErrs[k] = "Link không hợp lệ (cần bắt đầu bằng http(s)://).";
            }
        });
        if (Object.keys(socialErrs).length) next.socialLinks = socialErrs;

        if (pendingAvatarFile.current) {
            const f = pendingAvatarFile.current;
            const maxBytes = 5 * 1024 * 1024;
            if (!f.type.startsWith("image/")) next.avatar = "File avatar phải là hình ảnh.";
            else if (f.size > maxBytes) next.avatar = "Ảnh avatar phải <= 5MB.";
        }

        return next;
    };

    const isValid = useMemo(() => {
        const errs = validate();
        return !errs.name && !errs.genre && !errs.followers && !errs.bio && !errs.avatar && !errs.socialLinks;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form, avatarPreview]);

    // ── Completion steps ──
    const steps = [
        { label: "Tên nghệ sĩ",  done: !!form.name.trim() },
        { label: "Thể loại",     done: !!form.genre },
        { label: "Ảnh đại diện", done: !!pendingAvatarFile.current },
        { label: "Mạng xã hội",  done: Object.values(form.socialLinks).some(v => !!v.trim()) },
    ];
    const doneCount = steps.filter(s => s.done).length;

    // ── Create ──
    const handleCreate = async () => {
        const errs = validate();
        setFieldErrors(errs);

        const firstError =
            errs.name ||
            errs.genre ||
            errs.followers ||
            errs.bio ||
            errs.avatar ||
            errs.socialLinks?.facebook ||
            errs.socialLinks?.instagram ||
            errs.socialLinks?.youtube ||
            errs.socialLinks?.tiktok ||
            null;

        if (firstError) {
            setError(firstError);
            if (errs.name || errs.genre || errs.followers || errs.bio) setActiveTab("basic");
            else setActiveTab("social");
            return;
        }

        setSaving(true);
        setError(null);
        setFieldErrors({});

        try {
            const payload = {
                name:        form.name.trim(),
                bio:         form.bio.trim() || undefined,
                genre:       form.genre     || undefined,
                followers:   Number(form.followers) || 0,
                verified:    form.verified,
                socialLinks: {
                    facebook:  form.socialLinks.facebook.trim()  || undefined,
                    instagram: form.socialLinks.instagram.trim() || undefined,
                    youtube:   form.socialLinks.youtube.trim()   || undefined,
                    tiktok:    form.socialLinks.tiktok.trim()    || undefined,
                },
            };

            const res           = await artistService.create(payload as any);
            const newId: string = res._id;

            // Upload avatar nếu có
            if (pendingAvatarFile.current) {
                setUploadingAvatar(true);
                try {
                    await uploadAvatar(newId, pendingAvatarFile.current);
                } catch {
                    toast.error("Nghệ sĩ đã được tạo nhưng upload ảnh thất bại. Bạn có thể thử lại từ trang chỉnh sửa.");
                } finally {
                    setUploadingAvatar(false);
                }
            }

            toast.success("Tạo nghệ sĩ thành công!");
            router.push(`/admin/artists/${newId}`);
        } catch (e: any) {
            setError(e?.response?.data?.message ?? e?.message ?? "Tạo nghệ sĩ thất bại.");
        } finally {
            setSaving(false);
            setUploadingAvatar(false);
        }
    };

    const savingLabel = uploadingAvatar ? "Đang upload ảnh đại diện..." : "Đang tạo nghệ sĩ...";

    return (
        <div style={{ fontFamily: "'Be Vietnam Pro',sans-serif", maxWidth: 900, paddingBottom: 80 }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');

                @keyframes ahFadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
                @keyframes ahPulse  { 0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,.35)} 50%{box-shadow:0 0 0 6px rgba(74,222,128,0)} }
                @keyframes ahSpin   { to{transform:rotate(360deg)} }
                @keyframes shake    { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-4px)} 40%,80%{transform:translateX(4px)} }
                @keyframes stepIn   { from{opacity:0;transform:scale(.7)} to{opacity:1;transform:scale(1)} }
                @keyframes ahScale  { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }

                .ac-card {
                    border-radius:18px;
                    border:1px solid rgba(255,255,255,.07);
                    background:rgba(255,255,255,.025);
                }
                .ac-input, .ac-select, .ac-textarea {
                    width:100%; box-sizing:border-box;
                    background:rgba(255,255,255,.04);
                    border:1px solid rgba(255,255,255,.08);
                    border-radius:11px; padding:11px 14px;
                    color:#fff; font-size:14px; font-weight:500;
                    font-family:'Be Vietnam Pro',sans-serif; outline:none;
                    transition:border-color .18s, background .18s, box-shadow .18s;
                }
                .ac-input:focus, .ac-select:focus, .ac-textarea:focus {
                    border-color:rgba(74,222,128,.45);
                    background:rgba(74,222,128,.04);
                    box-shadow:0 0 0 3px rgba(74,222,128,.08);
                }
                .ac-textarea {
                    resize:vertical; min-height:90px; line-height:1.6;
                }
                .ac-input::placeholder,
                .ac-textarea::placeholder { color:rgba(255,255,255,.22); font-weight:400; }
                .ac-input.err { border-color:rgba(248,113,113,.5)!important; box-shadow:0 0 0 3px rgba(248,113,113,.08)!important; }
                .ac-select { padding-right:38px; -webkit-appearance:none; appearance:none; cursor:pointer; }
                .ac-select option { background:#141a14; }

                .ac-label {
                    display:flex; align-items:center; gap:5px;
                    font-size:11px; font-weight:700; color:rgba(255,255,255,.3);
                    letter-spacing:1.8px; text-transform:uppercase; margin-bottom:7px;
                }
                .ac-field { margin-bottom:18px; position:relative; }
                .ac-req   { color:#f87171; }

                .ac-pill-btn {
                    display:inline-flex; align-items:center; gap:7px;
                    padding:8px 15px; border-radius:100px;
                    border:1px solid rgba(255,255,255,.09);
                    background:rgba(255,255,255,.03);
                    color:rgba(255,255,255,.5); font-size:13px; font-weight:500;
                    text-decoration:none; cursor:pointer;
                    font-family:'Be Vietnam Pro',sans-serif; transition:all .18s;
                }
                .ac-pill-btn:hover { background:rgba(255,255,255,.07); color:#fff; border-color:rgba(255,255,255,.15); }

                .ac-tab {
                    padding:8px 20px; border-radius:100px;
                    font-size:13px; font-weight:600; cursor:pointer;
                    border:1px solid transparent; transition:all .18s;
                    font-family:'Be Vietnam Pro',sans-serif;
                    color:rgba(255,255,255,.38); background:transparent;
                }
                .ac-tab:hover  { color:rgba(255,255,255,.7); }
                .ac-tab.active { color:#4ade80; border-color:rgba(74,222,128,.22); background:rgba(74,222,128,.07); }

                .ac-drop {
                    border:2px dashed rgba(255,255,255,.1); border-radius:14px;
                    padding:28px 20px; text-align:center; cursor:pointer;
                    transition:all .2s; background:rgba(255,255,255,.02);
                }
                .ac-drop:hover, .ac-drop.drag {
                    border-color:rgba(74,222,128,.45);
                    background:rgba(74,222,128,.05);
                }

                .ac-toggle {
                    position:relative; width:46px; height:26px;
                    background:rgba(255,255,255,.1); border-radius:100px;
                    cursor:pointer; transition:background .22s;
                    flex-shrink:0; border:none; outline:none;
                }
                .ac-toggle::after {
                    content:''; position:absolute; top:4px; left:4px;
                    width:18px; height:18px; border-radius:50%;
                    background:rgba(255,255,255,.45); transition:all .22s;
                }
                .ac-toggle.on { background:linear-gradient(135deg,#16a34a,#4ade80); animation:ahPulse 1.5s ease 1; }
                .ac-toggle.on::after { left:24px; background:#fff; }

                .ac-create-btn {
                    display:inline-flex; align-items:center; gap:8px;
                    padding:12px 30px; border-radius:12px;
                    font-size:14px; font-weight:700; cursor:pointer;
                    font-family:'Be Vietnam Pro',sans-serif; border:none; transition:all .2s;
                    background:linear-gradient(135deg,#16a34a,#4ade80);
                    color:#071207; box-shadow:0 4px 20px rgba(74,222,128,.3);
                }
                .ac-create-btn:hover:not(:disabled) { transform:translateY(-2px); filter:brightness(1.08); box-shadow:0 8px 28px rgba(74,222,128,.4); }
                .ac-create-btn:disabled { opacity:.55; cursor:not-allowed; transform:none!important; }

                .ac-stitle {
                    font-size:11px; color:rgba(255,255,255,.28);
                    letter-spacing:2px; text-transform:uppercase; font-weight:700;
                    margin-bottom:20px; display:flex; align-items:center; gap:8px;
                }
                .ac-stitle::after { content:''; flex:1; height:1px; background:rgba(255,255,255,.05); }

                .ac-step-dot {
                    width:22px; height:22px; border-radius:50%;
                    display:flex; align-items:center; justify-content:center;
                    font-size:10px; font-weight:700; flex-shrink:0; transition:all .25s;
                }
                .ac-step-dot.done    { background:rgba(74,222,128,.15); border:1.5px solid #4ade80; color:#4ade80; animation:stepIn .25s ease; }
                .ac-step-dot.pending { background:rgba(255,255,255,.04); border:1.5px solid rgba(255,255,255,.1); color:rgba(255,255,255,.25); }

                .ac-prog-bar  { height:3px; border-radius:3px; overflow:hidden; background:rgba(255,255,255,.06); margin-top:6px; }
                .ac-prog-fill { height:100%; border-radius:3px; background:linear-gradient(90deg,#16a34a,#4ade80); transition:width .4s cubic-bezier(.4,0,.2,1); }

                .ac-social-row {
                    display:flex; align-items:center; gap:10px;
                }
                .ac-social-icon-wrap {
                    width:38px; height:38px; border-radius:10px; flex-shrink:0;
                    display:flex; align-items:center; justify-content:center;
                    border:1px solid rgba(255,255,255,.08);
                    background:rgba(255,255,255,.04);
                }

                .ac-saving-overlay {
                    position:fixed; inset:0; z-index:9999;
                    background:rgba(0,0,0,.7); backdrop-filter:blur(6px);
                    display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px;
                }

                .ac-chev {
                    position:absolute; right:12px; top:50%; transform:translateY(-50%);
                    pointer-events:none; color:rgba(255,255,255,.3);
                }
            `}</style>

            {/* Hidden file input */}
            <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = ""; }}
            />

            {/* ── Saving overlay ── */}
            {saving && (
                <div className="ac-saving-overlay">
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
                            { label: "Tạo nghệ sĩ",       done: uploadingAvatar, active: false },
                            { label: "Upload ảnh đại diện", done: false,           active: uploadingAvatar },
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
                <Link href="/admin/artists" className="ac-pill-btn"><ArrowLeft size={13} /> Nghệ sĩ</Link>
                <span style={{ color: "rgba(255,255,255,.18)", fontSize: 12 }}>/</span>
                <span style={{ fontSize: 13, color: "#4ade80", fontWeight: 600 }}>Tạo mới</span>
            </div>

            {/* ── Header ── */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, animation: "ahFadeUp .35s both", flexWrap: "wrap", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 54, height: 54, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "linear-gradient(135deg,#052e16,#14532d)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(74,222,128,.2)" }}>
                        {avatarPreview
                            ? <img src={avatarPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : <Sparkles size={20} color="rgba(74,222,128,.35)" />
                        }
                    </div>
                    <div>
                        <p style={{ fontSize: 11, color: "#4ade80", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 4 }}>
                            Tạo nghệ sĩ mới
                        </p>
                        <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 30, color: "#fff", letterSpacing: 2, lineHeight: 1 }}>
                            {form.name || <span style={{ color: "rgba(255,255,255,.2)" }}>Chưa có tên...</span>}
                        </h1>
                    </div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <Link href="/admin/artists" className="ac-pill-btn"><X size={13} /> Huỷ</Link>
                    <button className="ac-create-btn" onClick={handleCreate} disabled={saving || !isValid}>
                        <Plus size={15} /> Tạo nghệ sĩ
                    </button>
                </div>
            </div>

            {/* ── Completion progress ── */}
            <div style={{ marginBottom: 22, animation: "ahFadeUp .38s both" }}>
                <div className="ac-card" style={{ padding: "14px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,.3)", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase" }}>
                            Tiến độ điền thông tin
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: doneCount === 4 ? "#4ade80" : "rgba(255,255,255,.5)" }}>
                            {doneCount}/4
                            {doneCount === 4 && <span style={{ marginLeft: 6, fontSize: 12 }}>✓ Sẵn sàng tạo</span>}
                        </span>
                    </div>
                    <div className="ac-prog-bar">
                        <div className="ac-prog-fill" style={{ width: `${(doneCount / 4) * 100}%` }} />
                    </div>
                    <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
                        {steps.map(s => (
                            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <div className={`ac-step-dot ${s.done ? "done" : "pending"}`}>
                                    {s.done ? "✓" : "·"}
                                </div>
                                <span style={{ fontSize: 12, color: s.done ? "rgba(255,255,255,.6)" : "rgba(255,255,255,.25)", fontWeight: s.done ? 600 : 400, transition: "color .2s" }}>
                                    {s.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Error ── */}
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
                {(["basic", "social"] as Tab[]).map(tab => (
                    <button key={tab} className={`ac-tab ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
                        {{ basic: "Thông tin cơ bản", social: "Mạng xã hội & Ảnh" }[tab]}
                        {tab === "basic" && !form.name && (
                            <span style={{ marginLeft: 6, width: 6, height: 6, borderRadius: "50%", background: "#f87171", display: "inline-block", verticalAlign: "middle" }} />
                        )}
                    </button>
                ))}
            </div>

            {/* ════════ Tab: Basic ════════ */}
            {activeTab === "basic" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, animation: "ahFadeUp .3s both" }}>

                    {/* Left */}
                    <div className="ac-card" style={{ padding: "22px 24px" }}>
                        <p className="ac-stitle">Thông tin nghệ sĩ</p>

                        {/* Name */}
                        <div className="ac-field">
                            <label className="ac-label"><Mic2 size={10} /> Tên nghệ sĩ <span className="ac-req">*</span></label>
                            <div style={{ position: "relative" }}>
                                <input
                                    className={`ac-input ${fieldErrors.name ? "err" : ""}`}
                                    value={form.name}
                                    onChange={e => {
                                        set("name", e.target.value);
                                        if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: undefined }));
                                    }}
                                    placeholder="Nhập tên nghệ sĩ..."
                                    maxLength={100}
                                    autoFocus
                                />
                                <span style={{ position: "absolute", right: 12, bottom: 11, fontSize: 10, color: "rgba(255,255,255,.18)", pointerEvents: "none" }}>
                                    {form.name.length}/100
                                </span>
                            </div>
                            {fieldErrors.name && (
                                <div style={{ marginTop: 6, fontSize: 12, color: "#f87171", fontWeight: 600 }}>
                                    {fieldErrors.name}
                                </div>
                            )}
                        </div>

                        {/* Genre */}
                        <div className="ac-field">
                            <label className="ac-label"><Tag size={10} /> Thể loại <span className="ac-req">*</span></label>
                            <div style={{ position: "relative" }}>
                                <select
                                    className={`ac-select ${fieldErrors.genre ? "err" : ""}`}
                                    value={form.genre}
                                    onChange={e => {
                                        set("genre", e.target.value);
                                        if (fieldErrors.genre) setFieldErrors(prev => ({ ...prev, genre: undefined }));
                                    }}
                                >
                                    <option value="">-- Chọn thể loại --</option>
                                    {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                                <span className="ac-chev">▾</span>
                            </div>
                            {fieldErrors.genre && (
                                <div style={{ marginTop: 6, fontSize: 12, color: "#f87171", fontWeight: 600 }}>
                                    {fieldErrors.genre}
                                </div>
                            )}
                        </div>

                        {/* Followers */}
                        <div className="ac-field">
                            <label className="ac-label"><Users size={10} /> Số followers</label>
                            <input
                                className={`ac-input ${fieldErrors.followers ? "err" : ""}`}
                                type="number"
                                min={0}
                                value={form.followers}
                                onChange={e => {
                                    set("followers", e.target.value);
                                    if (fieldErrors.followers) setFieldErrors(prev => ({ ...prev, followers: undefined }));
                                }}
                                placeholder="0"
                            />
                            {fieldErrors.followers && (
                                <div style={{ marginTop: 6, fontSize: 12, color: "#f87171", fontWeight: 600 }}>
                                    {fieldErrors.followers}
                                </div>
                            )}
                        </div>

                        {/* Bio */}
                        <div className="ac-field" style={{ marginBottom: 0 }}>
                            <label className="ac-label"><FileText size={10} /> Tiểu sử</label>
                            <textarea
                                className={`ac-textarea ${fieldErrors.bio ? "err" : ""}`}
                                value={form.bio}
                                onChange={e => {
                                    set("bio", e.target.value);
                                    if (fieldErrors.bio) setFieldErrors(prev => ({ ...prev, bio: undefined }));
                                }}
                                placeholder="Mô tả ngắn về nghệ sĩ..."
                                maxLength={500}
                            />
                            <span style={{ fontSize: 10, color: "rgba(255,255,255,.18)", float: "right", marginTop: 4 }}>
                                {form.bio.length}/500
                            </span>
                            {fieldErrors.bio && (
                                <div style={{ marginTop: 6, fontSize: 12, color: "#f87171", fontWeight: 600, clear: "both" }}>
                                    {fieldErrors.bio}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                        {/* Verified toggle */}
                        <div className="ac-card" style={{ padding: "20px 22px" }}>
                            <p className="ac-stitle">Xác minh</p>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: form.verified ? "rgba(74,222,128,.1)" : "rgba(255,255,255,.05)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background .2s" }}>
                                        {form.verified
                                            ? <BadgeCheck size={16} color="#4ade80" />
                                            : <Mic2 size={16} color="rgba(255,255,255,.28)" />
                                        }
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 13, fontWeight: 700, color: form.verified ? "#fff" : "rgba(255,255,255,.45)", marginBottom: 3, transition: "color .2s" }}>
                                            {form.verified ? "Nghệ sĩ xác minh" : "Chưa xác minh"}
                                        </p>
                                        <p style={{ fontSize: 11, color: "rgba(255,255,255,.25)" }}>
                                            {form.verified ? "Hiển thị badge xác minh" : "Tài khoản thông thường"}
                                        </p>
                                    </div>
                                </div>
                                <button className={`ac-toggle ${form.verified ? "on" : ""}`} onClick={() => set("verified", !form.verified)} />
                            </div>
                            <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,.05)", display: "flex", alignItems: "center", gap: 6 }}>
                                {form.verified
                                    ? <><CheckCircle2 size={13} color="#4ade80" /><span style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>Badge: <span style={{ color: "#4ade80", fontWeight: 700 }}>Đã xác minh ✓</span></span></>
                                    : <><XCircle size={13} color="#f87171" /><span style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>Badge: <span style={{ color: "rgba(255,255,255,.3)", fontWeight: 700 }}>Thường</span></span></>
                                }
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="ac-card" style={{ padding: "18px 20px", flex: 1 }}>
                            <p className="ac-stitle">Lưu ý</p>
                            {[
                                "Ảnh đại diện sẽ được upload lên Cloudinary sau khi tạo.",
                                "Bạn có thể cập nhật thêm thông tin sau từ trang chỉnh sửa.",
                                "Tên nghệ sĩ là trường bắt buộc duy nhất.",
                                "Sau khi tạo, nghệ sĩ có thể được gán vào bài hát.",
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

            {/* ════════ Tab: Social & Avatar ════════ */}
            {activeTab === "social" && (
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 16, animation: "ahFadeUp .3s both" }}>

                    {/* ── Avatar upload ── */}
                    <div className="ac-card" style={{ padding: "22px 24px", minWidth: 0 }}>
                        <p className="ac-stitle">Ảnh đại diện</p>

                        {/* Preview */}
                        <div style={{ position: "relative", marginBottom: 16, borderRadius: 14, overflow: "hidden", height: 200, background: "linear-gradient(135deg,#052e16,#14532d)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {avatarPreview
                                ? <>
                                    <img src={avatarPreview} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    <button
                                        onClick={() => avatarInputRef.current?.click()}
                                        style={{ position: "absolute", bottom: 10, right: 10, display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 100, background: "rgba(0,0,0,.6)", border: "1px solid rgba(255,255,255,.15)", color: "rgba(255,255,255,.8)", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Be Vietnam Pro',sans-serif", backdropFilter: "blur(4px)" }}
                                    >
                                        <Upload size={11} /> Đổi ảnh
                                    </button>
                                  </>
                                : <div style={{ textAlign: "center" }}>
                                    <ImageIcon size={36} color="rgba(74,222,128,.22)" style={{ margin: "0 auto 10px", display: "block" }} />
                                    <p style={{ fontSize: 13, color: "rgba(255,255,255,.25)", marginBottom: 4 }}>Chưa có ảnh đại diện</p>
                                    <p style={{ fontSize: 11, color: "rgba(255,255,255,.15)" }}>Kéo thả hoặc chọn file bên dưới</p>
                                  </div>
                            }
                        </div>

                        {/* Drop zone */}
                        <div
                            className={`ac-drop ${coverDrag ? "drag" : ""}`}
                            onClick={() => avatarInputRef.current?.click()}
                            onDragOver={e => { e.preventDefault(); setCoverDrag(true); }}
                            onDragLeave={() => setCoverDrag(false)}
                            onDrop={e => { e.preventDefault(); setCoverDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f); }}
                        >
                            <Upload size={22} color={coverDrag ? "#4ade80" : "rgba(255,255,255,.2)"} style={{ margin: "0 auto 10px", display: "block", transition: "color .2s" }} />
                            <p style={{ fontSize: 13, color: coverDrag ? "#4ade80" : "rgba(255,255,255,.3)", fontWeight: 500, transition: "color .2s" }}>
                                Kéo thả hoặc <span style={{ color: "#4ade80" }}>chọn file ảnh</span>
                            </p>
                            <p style={{ fontSize: 11, color: "rgba(255,255,255,.18)", marginTop: 5 }}>JPG, PNG, WEBP · tối đa 5MB</p>
                            {fieldErrors.avatar && (
                                <div style={{ marginTop: 10, fontSize: 12, color: "#f87171", fontWeight: 600 }}>
                                    {fieldErrors.avatar}
                                </div>
                            )}
                            {pendingAvatarFile.current && (
                                <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 12px", borderRadius: 100, background: "rgba(74,222,128,.1)", border: "1px solid rgba(74,222,128,.2)" }}>
                                    <CheckCircle2 size={11} color="#4ade80" />
                                    <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 600, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pendingAvatarFile.current.name}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Social links ── */}
                    <div className="ac-card" style={{ padding: "22px 24px", minWidth: 0 }}>
                        <p className="ac-stitle">Mạng xã hội</p>

                        {/* Facebook */}
                        <div className="ac-field">
                            <label className="ac-label"><Facebook size={10} /> Facebook</label>
                            <div className="ac-social-row">
                                <div className="ac-social-icon-wrap">
                                    <Facebook size={16} color="#60a5fa" />
                                </div>
                                <input
                                    className={`ac-input ${fieldErrors.socialLinks?.facebook ? "err" : ""}`}
                                    value={form.socialLinks.facebook}
                                    onChange={e => {
                                        setSocial("facebook", e.target.value);
                                        if (fieldErrors.socialLinks?.facebook) {
                                            setFieldErrors(prev => ({
                                                ...prev,
                                                socialLinks: { ...(prev.socialLinks ?? {}), facebook: undefined },
                                            }));
                                        }
                                    }}
                                    placeholder="https://facebook.com/..."
                                />
                            </div>
                            {fieldErrors.socialLinks?.facebook && (
                                <div style={{ marginTop: 6, fontSize: 12, color: "#f87171", fontWeight: 600 }}>
                                    {fieldErrors.socialLinks.facebook}
                                </div>
                            )}
                        </div>

                        {/* Instagram */}
                        <div className="ac-field">
                            <label className="ac-label"><Instagram size={10} /> Instagram</label>
                            <div className="ac-social-row">
                                <div className="ac-social-icon-wrap">
                                    <Instagram size={16} color="#f472b6" />
                                </div>
                                <input
                                    className={`ac-input ${fieldErrors.socialLinks?.instagram ? "err" : ""}`}
                                    value={form.socialLinks.instagram}
                                    onChange={e => {
                                        setSocial("instagram", e.target.value);
                                        if (fieldErrors.socialLinks?.instagram) {
                                            setFieldErrors(prev => ({
                                                ...prev,
                                                socialLinks: { ...(prev.socialLinks ?? {}), instagram: undefined },
                                            }));
                                        }
                                    }}
                                    placeholder="https://instagram.com/..."
                                />
                            </div>
                            {fieldErrors.socialLinks?.instagram && (
                                <div style={{ marginTop: 6, fontSize: 12, color: "#f87171", fontWeight: 600 }}>
                                    {fieldErrors.socialLinks.instagram}
                                </div>
                            )}
                        </div>

                        {/* YouTube */}
                        <div className="ac-field">
                            <label className="ac-label"><Youtube size={10} /> YouTube</label>
                            <div className="ac-social-row">
                                <div className="ac-social-icon-wrap">
                                    <Youtube size={16} color="#f87171" />
                                </div>
                                <input
                                    className={`ac-input ${fieldErrors.socialLinks?.youtube ? "err" : ""}`}
                                    value={form.socialLinks.youtube}
                                    onChange={e => {
                                        setSocial("youtube", e.target.value);
                                        if (fieldErrors.socialLinks?.youtube) {
                                            setFieldErrors(prev => ({
                                                ...prev,
                                                socialLinks: { ...(prev.socialLinks ?? {}), youtube: undefined },
                                            }));
                                        }
                                    }}
                                    placeholder="https://youtube.com/..."
                                />
                            </div>
                            {fieldErrors.socialLinks?.youtube && (
                                <div style={{ marginTop: 6, fontSize: 12, color: "#f87171", fontWeight: 600 }}>
                                    {fieldErrors.socialLinks.youtube}
                                </div>
                            )}
                        </div>

                        {/* TikTok */}
                        <div className="ac-field" style={{ marginBottom: 0 }}>
                            <label className="ac-label"><Music size={10} /> TikTok</label>
                            <div className="ac-social-row">
                                <div className="ac-social-icon-wrap">
                                    <Music size={16} color="rgba(255,255,255,.5)" />
                                </div>
                                <input
                                    className={`ac-input ${fieldErrors.socialLinks?.tiktok ? "err" : ""}`}
                                    value={form.socialLinks.tiktok}
                                    onChange={e => {
                                        setSocial("tiktok", e.target.value);
                                        if (fieldErrors.socialLinks?.tiktok) {
                                            setFieldErrors(prev => ({
                                                ...prev,
                                                socialLinks: { ...(prev.socialLinks ?? {}), tiktok: undefined },
                                            }));
                                        }
                                    }}
                                    placeholder="https://tiktok.com/@..."
                                />
                            </div>
                            {fieldErrors.socialLinks?.tiktok && (
                                <div style={{ marginTop: 6, fontSize: 12, color: "#f87171", fontWeight: 600 }}>
                                    {fieldErrors.socialLinks.tiktok}
                                </div>
                            )}
                        </div>

                        {/* Social preview */}
                        {Object.values(form.socialLinks).some(v => !!v.trim()) && (
                            <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,.05)" }}>
                                <p style={{ fontSize: 11, color: "rgba(255,255,255,.28)", letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: 700, marginBottom: 10 }}>
                                    Preview
                                </p>
                                <div style={{ display: "flex", gap: 8 }}>
                                    {form.socialLinks.facebook  && <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 100, background: "rgba(96,165,250,.1)", border: "1px solid rgba(96,165,250,.2)" }}><Facebook size={11} color="#60a5fa" /><span style={{ fontSize: 11, color: "#60a5fa", fontWeight: 600 }}>Facebook</span></div>}
                                    {form.socialLinks.instagram && <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 100, background: "rgba(244,114,182,.1)", border: "1px solid rgba(244,114,182,.2)" }}><Instagram size={11} color="#f472b6" /><span style={{ fontSize: 11, color: "#f472b6", fontWeight: 600 }}>Instagram</span></div>}
                                    {form.socialLinks.youtube   && <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 100, background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.2)" }}><Youtube size={11} color="#f87171" /><span style={{ fontSize: 11, color: "#f87171", fontWeight: 600 }}>YouTube</span></div>}
                                    {form.socialLinks.tiktok    && <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 100, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)" }}><Music size={11} color="rgba(255,255,255,.5)" /><span style={{ fontSize: 11, color: "rgba(255,255,255,.5)", fontWeight: 600 }}>TikTok</span></div>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Bottom bar ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,.06)", animation: "ahFadeUp .5s both", flexWrap: "wrap" }}>
                <Link href="/admin/artists" style={{ fontSize: 13, color: "rgba(255,255,255,.3)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <ArrowLeft size={13} /> Quay lại danh sách
                </Link>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {doneCount < 2 && (
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,.3)" }}>
                            Còn thiếu thông tin bắt buộc
                        </span>
                    )}
                    <Link href="/admin/artists" className="ac-pill-btn"><X size={13} /> Huỷ</Link>
                    <button className="ac-create-btn" onClick={handleCreate} disabled={saving || !isValid}>
                        <Plus size={15} /> Tạo nghệ sĩ
                    </button>
                </div>
            </div>
        </div>
    );
}