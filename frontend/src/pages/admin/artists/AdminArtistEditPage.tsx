// src/pages/admin/AdminArtistEditPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import {
    ArrowLeft, Mic2, Save, X, Upload, Image as ImageIcon,
    Tag, CheckCircle2, XCircle,
    Loader2, AlertCircle, ChevronDown,
    Facebook, Instagram, Youtube, Music,
    Users, BadgeCheck, FileText, Hash, Calendar,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { artistService } from "@/services/artistService";

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

const API = import.meta.env.MODE === "development"
    ? "http://localhost:2004/api"
    : "https://wonmusic-api.up.railway.app/api";

// ─── Component ───────────────────────────────────────────────────────────────
export default function AdminArtistEditPage() {
    const { id } = useParams<{ id: string }>();

    const [artist,         setArtist]         = useState<any>(null);
    const [loading,        setLoading]        = useState(true);
    const [saving,         setSaving]         = useState(false);
    const [saved,          setSaved]          = useState(false);
    const [error,          setError]          = useState<string | null>(null);
    const [fieldErrors,    setFieldErrors]    = useState<FieldErrors>({});
    const [activeTab,      setActiveTab]      = useState<Tab>("basic");
    const [coverDrag,      setCoverDrag]      = useState(false);
    const [uploadingAvatar,setUploadingAvatar]= useState(false);

    const avatarInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState<ArtistForm>({
        name: "", bio: "", genre: "", followers: "0", verified: false,
        socialLinks: { facebook: "", instagram: "", youtube: "", tiktok: "" },
    });

    const set = (field: keyof ArtistForm, value: any) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const setSocial = (platform: keyof ArtistForm["socialLinks"], value: string) =>
        setForm(prev => ({
            ...prev,
            socialLinks: { ...prev.socialLinks, [platform]: value },
        }));

    // ── Load artist ──
    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                setLoading(true);
                const res = await artistService.getById(id);
                const data = res;
                setArtist(data);
                if (data) {
                    setForm({
                        name:      data.name      ?? "",
                        bio:       data.bio       ?? "",
                        genre:     data.genre     ?? "",
                        followers: String(data.followers ?? 0),
                        verified:  data.verified  ?? false,
                        socialLinks: {
                            facebook:  data.socialLinks?.facebook  ?? "",
                            instagram: data.socialLinks?.instagram ?? "",
                            youtube:   data.socialLinks?.youtube   ?? "",
                            tiktok:    data.socialLinks?.tiktok    ?? "",
                        },
                    });
                }
            } catch {
                setError("Không thể tải thông tin nghệ sĩ.");
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    // ── Upload avatar ──
    const handleUploadAvatar = async (file: File) => {
        const maxBytes = 5 * 1024 * 1024;
        if (!file.type.startsWith("image/")) {
            setFieldErrors(prev => ({ ...prev, avatar: "File phải là hình ảnh (JPG/PNG/WEBP)." }));
            setError("File avatar không hợp lệ.");
            return;
        }
        if (file.size > maxBytes) {
            setFieldErrors(prev => ({ ...prev, avatar: "Ảnh quá lớn. Vui lòng chọn ảnh <= 5MB." }));
            setError("Ảnh avatar quá lớn.");
            return;
        }

        setUploadingAvatar(true);
        setError(null);
        setFieldErrors(prev => ({ ...prev, avatar: undefined }));
        try {
            const fd = new FormData();
            fd.append("avatar", file);
            const res = await axios.put(`${API}/artists/${id}`, fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const updated = res.data.data;
            setArtist((prev: any) => ({ ...prev, avatar: updated.avatar }));
        } catch (e: any) {
            setError(e?.response?.data?.message ?? "Upload ảnh thất bại.");
        } finally {
            setUploadingAvatar(false);
        }
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

        return next;
    };

    const isValid = useMemo(() => {
        const errs = validate();
        return !errs.name && !errs.genre && !errs.followers && !errs.bio && !errs.avatar && !errs.socialLinks;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form, artist?.avatar]);

    // ── Save ──
    const handleSave = async () => {
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
        try {
            await artistService.update(id!, {
                name:        form.name.trim(),
                bio:         form.bio.trim()       || undefined,
                genre:       form.genre            || undefined,
                followers:   Number(form.followers) || 0,
                verified:    form.verified,
                socialLinks: {
                    facebook:  form.socialLinks.facebook.trim()  || undefined,
                    instagram: form.socialLinks.instagram.trim() || undefined,
                    youtube:   form.socialLinks.youtube.trim()   || undefined,
                    tiktok:    form.socialLinks.tiktok.trim()    || undefined,
                },
            } as any);
            setSaved(true);
            toast.success("Lưu thay đổi thành công!");
            setTimeout(() => setSaved(false), 2800);
        } catch (e: any) {
            setError(e?.response?.data?.message ?? "Lưu thất bại. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

    // ── Loading skeleton ──
    if (loading) return (
        <div style={{ fontFamily: "'Be Vietnam Pro',sans-serif" }}>
            <style>{`@keyframes sk{0%,100%{opacity:.35}50%{opacity:.75}}`}</style>
            <div style={{ animation: "sk 1.5s ease-in-out infinite" }}>
                <div style={{ width: 130, height: 14, borderRadius: 6, background: "rgba(255,255,255,.07)", marginBottom: 28 }} />
                {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{ height: 52, borderRadius: 12, background: "rgba(255,255,255,.04)", marginBottom: 12 }} />
                ))}
            </div>
        </div>
    );

    if (!artist && !loading) return (
        <div style={{ fontFamily: "'Be Vietnam Pro',sans-serif", padding: "60px 0", textAlign: "center" }}>
            <AlertCircle size={36} color="rgba(248,113,113,.5)" style={{ margin: "0 auto 12px", display: "block" }} />
            <p style={{ color: "rgba(255,255,255,.3)", fontSize: 14 }}>Không tìm thấy nghệ sĩ</p>
            <Link to="/admin/artists" style={{ color: "#4ade80", fontSize: 13, textDecoration: "none", marginTop: 10, display: "inline-block" }}>
                ← Quay lại
            </Link>
        </div>
    );

    return (
        <div style={{ fontFamily: "'Be Vietnam Pro',sans-serif", maxWidth: 900, paddingBottom: 80 }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');

                @keyframes ahFadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
                @keyframes ahPulse   { 0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,.35)} 50%{box-shadow:0 0 0 6px rgba(74,222,128,0)} }
                @keyframes ahSpin    { to{transform:rotate(360deg)} }
                @keyframes savedPop  { 0%{transform:scale(.8);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
                @keyframes shake     { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-4px)} 40%,80%{transform:translateX(4px)} }

                .ae-card {
                    border-radius:18px;
                    border:1px solid rgba(255,255,255,.07);
                    background:rgba(255,255,255,.025);
                }
                .ae-input, .ae-select, .ae-textarea {
                    width:100%; box-sizing:border-box;
                    background:rgba(255,255,255,.04);
                    border:1px solid rgba(255,255,255,.08);
                    border-radius:11px; padding:11px 14px;
                    color:#fff; font-size:14px; font-weight:500;
                    font-family:'Be Vietnam Pro',sans-serif; outline:none;
                    transition:border-color .18s, background .18s, box-shadow .18s;
                }
                .ae-input:focus, .ae-select:focus, .ae-textarea:focus {
                    border-color:rgba(74,222,128,.45);
                    background:rgba(74,222,128,.04);
                    box-shadow:0 0 0 3px rgba(74,222,128,.08);
                }
                .ae-textarea { resize:vertical; min-height:90px; line-height:1.6; }
                .ae-input::placeholder,
                .ae-textarea::placeholder { color:rgba(255,255,255,.22); font-weight:400; }
                .ae-input.err { border-color:rgba(248,113,113,.5)!important; box-shadow:0 0 0 3px rgba(248,113,113,.08)!important; }
                .ae-select { padding-right:38px; -webkit-appearance:none; appearance:none; cursor:pointer; }
                .ae-select option { background:#141a14; }

                .ae-label {
                    display:flex; align-items:center; gap:5px;
                    font-size:11px; font-weight:700; color:rgba(255,255,255,.3);
                    letter-spacing:1.8px; text-transform:uppercase; margin-bottom:7px;
                }
                .ae-field { margin-bottom:18px; position:relative; }
                .ae-req   { color:#f87171; }

                .ae-pill-btn {
                    display:inline-flex; align-items:center; gap:7px;
                    padding:8px 15px; border-radius:100px;
                    border:1px solid rgba(255,255,255,.09);
                    background:rgba(255,255,255,.03);
                    color:rgba(255,255,255,.5); font-size:13px; font-weight:500;
                    text-decoration:none; cursor:pointer;
                    font-family:'Be Vietnam Pro',sans-serif; transition:all .18s;
                }
                .ae-pill-btn:hover { background:rgba(255,255,255,.07); color:#fff; border-color:rgba(255,255,255,.15); }

                .ae-tab {
                    padding:8px 20px; border-radius:100px;
                    font-size:13px; font-weight:600; cursor:pointer;
                    border:1px solid transparent; transition:all .18s;
                    font-family:'Be Vietnam Pro',sans-serif;
                    color:rgba(255,255,255,.38); background:transparent;
                }
                .ae-tab:hover  { color:rgba(255,255,255,.7); }
                .ae-tab.active { color:#4ade80; border-color:rgba(74,222,128,.22); background:rgba(74,222,128,.07); }

                .ae-drop {
                    border:2px dashed rgba(255,255,255,.1); border-radius:14px;
                    padding:24px 20px; text-align:center; cursor:pointer;
                    transition:all .2s; background:rgba(255,255,255,.02);
                }
                .ae-drop:hover, .ae-drop.drag {
                    border-color:rgba(74,222,128,.45);
                    background:rgba(74,222,128,.05);
                }

                .ae-toggle {
                    position:relative; width:46px; height:26px;
                    background:rgba(255,255,255,.1); border-radius:100px;
                    cursor:pointer; transition:background .22s;
                    flex-shrink:0; border:none; outline:none;
                }
                .ae-toggle::after {
                    content:''; position:absolute; top:4px; left:4px;
                    width:18px; height:18px; border-radius:50%;
                    background:rgba(255,255,255,.45); transition:all .22s;
                }
                .ae-toggle.on { background:linear-gradient(135deg,#16a34a,#4ade80); animation:ahPulse 1.5s ease 1; }
                .ae-toggle.on::after { left:24px; background:#fff; }

                .ae-save {
                    display:inline-flex; align-items:center; gap:8px;
                    padding:11px 28px; border-radius:12px;
                    font-size:14px; font-weight:700; cursor:pointer;
                    font-family:'Be Vietnam Pro',sans-serif; border:none; transition:all .18s;
                }
                .ae-save:hover:not(:disabled) { transform:translateY(-1px); filter:brightness(1.08); }
                .ae-save:disabled { opacity:.55; cursor:not-allowed; }

                .ae-stitle {
                    font-size:11px; color:rgba(255,255,255,.28);
                    letter-spacing:2px; text-transform:uppercase; font-weight:700;
                    margin-bottom:20px; display:flex; align-items:center; gap:8px;
                }
                .ae-stitle::after { content:''; flex:1; height:1px; background:rgba(255,255,255,.05); }

                .ae-social-row { display:flex; align-items:center; gap:10px; }
                .ae-social-icon-wrap {
                    width:38px; height:38px; border-radius:10px; flex-shrink:0;
                    display:flex; align-items:center; justify-content:center;
                    border:1px solid rgba(255,255,255,.08);
                    background:rgba(255,255,255,.04);
                }

                .ae-info-row {
                    display:flex; align-items:center; gap:10px;
                    padding:8px 0; border-bottom:1px solid rgba(255,255,255,.04);
                }
                .ae-info-row:last-child { border-bottom:none; }
            `}</style>

            {/* Hidden file input */}
            <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadAvatar(f); e.target.value = ""; }}
            />

            {/* ── Breadcrumb ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22, animation: "ahFadeUp .3s both", flexWrap: "wrap" }}>
                <Link to="/admin/artists" className="ae-pill-btn"><ArrowLeft size={13} /> Nghệ sĩ</Link>
                <span style={{ color: "rgba(255,255,255,.18)", fontSize: 12 }}>/</span>
                <Link to={`/admin/artists/${id}`} style={{ fontSize: 13, color: "rgba(255,255,255,.4)", textDecoration: "none", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {artist?.name ?? id}
                </Link>
                <span style={{ color: "rgba(255,255,255,.18)", fontSize: 12 }}>/</span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,.4)" }}>Chỉnh sửa</span>
            </div>

            {/* ── Header ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, animation: "ahFadeUp .35s both", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    {/* Avatar preview */}
                    <div style={{ position: "relative", flexShrink: 0 }}>
                        <div style={{ width: 54, height: 54, borderRadius: "50%", overflow: "hidden", background: "linear-gradient(135deg,#052e16,#14532d)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(74,222,128,.2)" }}>
                            {artist?.avatar
                                ? <img src={artist.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                : <Mic2 size={20} color="rgba(74,222,128,.3)" />
                            }
                        </div>
                        {uploadingAvatar && (
                            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Loader2 size={16} color="#4ade80" style={{ animation: "ahSpin .7s linear infinite" }} />
                            </div>
                        )}
                    </div>
                    <div>
                        <p style={{ fontSize: 11, color: "#4ade80", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 4 }}>
                            Chỉnh sửa nghệ sĩ
                        </p>
                        <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 30, color: "#fff", letterSpacing: 2, lineHeight: 1 }}>
                            {form.name || artist?.name || "—"}
                        </h1>
                    </div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <Link to={`/admin/artists/${id}`} className="ae-pill-btn"><X size={13} /> Huỷ</Link>
                    <SaveBtn saving={saving} saved={saved} onClick={handleSave} disabled={!isValid || uploadingAvatar} />
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
                    <button key={tab} className={`ae-tab ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
                        {{ basic: "Thông tin cơ bản", social: "Mạng xã hội & Ảnh" }[tab]}
                    </button>
                ))}
            </div>

            {/* ════════ Tab: Basic ════════ */}
            {activeTab === "basic" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, animation: "ahFadeUp .3s both" }}>

                    {/* Left */}
                    <div className="ae-card" style={{ padding: "22px 24px" }}>
                        <p className="ae-stitle">Thông tin nghệ sĩ</p>

                        {/* Name */}
                        <div className="ae-field">
                            <label className="ae-label"><Mic2 size={10} /> Tên nghệ sĩ <span className="ae-req">*</span></label>
                            <div style={{ position: "relative" }}>
                                <input
                                    className={`ae-input ${fieldErrors.name ? "err" : ""}`}
                                    value={form.name}
                                    onChange={e => {
                                        set("name", e.target.value);
                                        if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: undefined }));
                                    }}
                                    placeholder="Nhập tên nghệ sĩ..."
                                    maxLength={100}
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
                        <div className="ae-field">
                            <label className="ae-label"><Tag size={10} /> Thể loại <span className="ae-req">*</span></label>
                            <div style={{ position: "relative" }}>
                                <select
                                    className={`ae-select ${fieldErrors.genre ? "err" : ""}`}
                                    value={form.genre}
                                    onChange={e => {
                                        set("genre", e.target.value);
                                        if (fieldErrors.genre) setFieldErrors(prev => ({ ...prev, genre: undefined }));
                                    }}
                                >
                                    <option value="">-- Chọn thể loại --</option>
                                    {!!form.genre && !GENRES.includes(form.genre) && (
                                        <option value={form.genre}>{form.genre} (hiện tại)</option>
                                    )}
                                    {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                                <ChevronDown size={13} color="rgba(255,255,255,.3)" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                            </div>
                            {fieldErrors.genre && (
                                <div style={{ marginTop: 6, fontSize: 12, color: "#f87171", fontWeight: 600 }}>
                                    {fieldErrors.genre}
                                </div>
                            )}
                        </div>

                        {/* Followers */}
                        <div className="ae-field">
                            <label className="ae-label"><Users size={10} /> Số followers</label>
                            <input
                                className={`ae-input ${fieldErrors.followers ? "err" : ""}`}
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
                        <div className="ae-field" style={{ marginBottom: 0 }}>
                            <label className="ae-label"><FileText size={10} /> Tiểu sử</label>
                            <textarea
                                className={`ae-textarea ${fieldErrors.bio ? "err" : ""}`}
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
                        <div className="ae-card" style={{ padding: "20px 22px" }}>
                            <p className="ae-stitle">Xác minh</p>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: form.verified ? "rgba(74,222,128,.1)" : "rgba(255,255,255,.05)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background .2s" }}>
                                        {form.verified
                                            ? <BadgeCheck size={16} color="#4ade80" />
                                            : <Mic2      size={16} color="rgba(255,255,255,.28)" />
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
                                <button className={`ae-toggle ${form.verified ? "on" : ""}`} onClick={() => set("verified", !form.verified)} />
                            </div>
                            <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,.05)", display: "flex", alignItems: "center", gap: 6 }}>
                                {form.verified
                                    ? <><CheckCircle2 size={13} color="#4ade80" /><span style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>Badge: <span style={{ color: "#4ade80", fontWeight: 700 }}>Đã xác minh ✓</span></span></>
                                    : <><XCircle size={13} color="#f87171" /><span style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>Badge: <span style={{ color: "rgba(255,255,255,.3)", fontWeight: 700 }}>Thường</span></span></>
                                }
                            </div>
                        </div>

                        {/* System info */}
                        <div className="ae-card" style={{ padding: "20px 22px", flex: 1 }}>
                            <p className="ae-stitle">Thông tin hệ thống</p>
                            {[
                                { label: "Artist ID",  value: id,                                                                               icon: Hash     },
                                { label: "Ngày tạo",   value: artist?.createdAt ? new Date(artist.createdAt).toLocaleDateString("vi-VN") : "—", icon: Calendar },
                                { label: "Cập nhật",   value: artist?.updatedAt ? new Date(artist.updatedAt).toLocaleDateString("vi-VN") : "—", icon: Calendar },
                                { label: "Followers",  value: Number(form.followers).toLocaleString("vi"),                                      icon: Users    },
                            ].map(({ label, value, icon: Icon }) => (
                                <div key={label} className="ae-info-row">
                                    <Icon size={12} color="rgba(74,222,128,.4)" style={{ flexShrink: 0 }} />
                                    <span style={{ fontSize: 12, color: "rgba(255,255,255,.3)", width: 86, flexShrink: 0 }}>{label}</span>
                                    <span style={{ fontSize: 12, color: "rgba(255,255,255,.6)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {value}
                                    </span>
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
                    <div className="ae-card" style={{ padding: "22px 24px", minWidth: 0 }}>
                        <p className="ae-stitle">Ảnh đại diện</p>

                        {/* Preview */}
                        <div style={{ position: "relative", marginBottom: 16, borderRadius: 14, overflow: "hidden", height: 200, background: "linear-gradient(135deg,#052e16,#14532d)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {artist?.avatar
                                ? <>
                                    <img src={artist.avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
                                  </div>
                            }
                            {uploadingAvatar && (
                                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.65)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Loader2 size={28} color="#4ade80" style={{ animation: "ahSpin .7s linear infinite" }} />
                                </div>
                            )}
                        </div>

                        {/* Drop zone */}
                        <div
                            className={`ae-drop ${coverDrag ? "drag" : ""}`}
                            onClick={() => avatarInputRef.current?.click()}
                            onDragOver={e => { e.preventDefault(); setCoverDrag(true); }}
                            onDragLeave={() => setCoverDrag(false)}
                            onDrop={e => {
                                e.preventDefault(); setCoverDrag(false);
                                const f = e.dataTransfer.files[0];
                                if (f) handleUploadAvatar(f);
                            }}
                        >
                            {uploadingAvatar ? (
                                <><Loader2 size={20} color="#4ade80" style={{ margin: "0 auto 8px", display: "block", animation: "ahSpin .7s linear infinite" }} />
                                <p style={{ fontSize: 13, color: "#4ade80" }}>Đang upload...</p></>
                            ) : (
                                <><Upload size={20} color={coverDrag ? "#4ade80" : "rgba(255,255,255,.2)"} style={{ margin: "0 auto 8px", display: "block", transition: "color .2s" }} />
                                <p style={{ fontSize: 13, color: coverDrag ? "#4ade80" : "rgba(255,255,255,.3)", fontWeight: 500, transition: "color .2s" }}>
                                    Kéo thả hoặc <span style={{ color: "#4ade80" }}>chọn file ảnh</span>
                                </p>
                                <p style={{ fontSize: 11, color: "rgba(255,255,255,.18)", marginTop: 4 }}>JPG, PNG, WEBP · tối đa 5MB</p></>
                            )}
                        </div>
                        {fieldErrors.avatar && (
                            <div style={{ marginTop: 10, fontSize: 12, color: "#f87171", fontWeight: 600 }}>
                                {fieldErrors.avatar}
                            </div>
                        )}

                        {/* URL hiện tại */}
                        {artist?.avatar && (
                            <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 9, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)" }}>
                                <p style={{ fontSize: 10, color: "rgba(255,255,255,.25)", letterSpacing: "1px", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>URL hiện tại</p>
                                <p style={{ fontSize: 11, color: "rgba(74,222,128,.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {artist.avatar}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* ── Social links ── */}
                    <div className="ae-card" style={{ padding: "22px 24px", minWidth: 0 }}>
                        <p className="ae-stitle">Mạng xã hội</p>

                        {[
                            { key: "facebook"  as const, label: "Facebook",  icon: Facebook,  color: "#60a5fa", placeholder: "https://facebook.com/..."  },
                            { key: "instagram" as const, label: "Instagram", icon: Instagram, color: "#f472b6", placeholder: "https://instagram.com/..." },
                            { key: "youtube"   as const, label: "YouTube",   icon: Youtube,   color: "#f87171", placeholder: "https://youtube.com/..."   },
                            { key: "tiktok"    as const, label: "TikTok",    icon: Music,     color: "rgba(255,255,255,.5)", placeholder: "https://tiktok.com/@..."    },
                        ].map(({ key, label, icon: Icon, color, placeholder }) => (
                            <div key={key} className="ae-field" style={{ marginBottom: key === "tiktok" ? 0 : 18 }}>
                                <label className="ae-label"><Icon size={10} /> {label}</label>
                                <div className="ae-social-row">
                                    <div className="ae-social-icon-wrap">
                                        <Icon size={16} color={color} />
                                    </div>
                                    <input
                                        className={`ae-input ${fieldErrors.socialLinks?.[key] ? "err" : ""}`}
                                        value={form.socialLinks[key]}
                                        onChange={e => {
                                            setSocial(key, e.target.value);
                                            if (fieldErrors.socialLinks?.[key]) {
                                                setFieldErrors(prev => ({
                                                    ...prev,
                                                    socialLinks: { ...(prev.socialLinks ?? {}), [key]: undefined },
                                                }));
                                            }
                                        }}
                                        placeholder={placeholder}
                                    />
                                </div>
                                {fieldErrors.socialLinks?.[key] && (
                                    <div style={{ marginTop: 6, fontSize: 12, color: "#f87171", fontWeight: 600 }}>
                                        {fieldErrors.socialLinks[key]}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Social preview */}
                        {Object.values(form.socialLinks).some(v => !!v.trim()) && (
                            <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,.05)" }}>
                                <p style={{ fontSize: 11, color: "rgba(255,255,255,.28)", letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: 700, marginBottom: 10 }}>
                                    Preview
                                </p>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
                <Link to={`/admin/artists/${id}`} style={{ fontSize: 13, color: "rgba(255,255,255,.3)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <ArrowLeft size={13} /> Quay lại chi tiết
                </Link>
                <div style={{ display: "flex", gap: 10 }}>
                    <Link to={`/admin/artists/${id}`} className="ae-pill-btn"><X size={13} /> Huỷ thay đổi</Link>
                    <SaveBtn saving={saving} saved={saved} onClick={handleSave} disabled={!isValid || uploadingAvatar} />
                </div>
            </div>
        </div>
    );
}

// ─── Save Button ─────────────────────────────────────────────────────────────
function SaveBtn({ saving, saved, onClick, disabled }: { saving: boolean; saved: boolean; onClick: () => void; disabled?: boolean }) {
    return (
        <button
            className="ae-save"
            onClick={onClick}
            disabled={saving || !!disabled}
            style={{
                background: saved
                    ? "linear-gradient(135deg,#166534,#22c55e)"
                    : "linear-gradient(135deg,#16a34a,#4ade80)",
                color: "#0a1a0a",
                boxShadow: "0 4px 18px rgba(74,222,128,.25)",
                animation: saved ? "savedPop .35s ease" : undefined,
            }}
        >
            {saving ? (
                <><Loader2 size={15} style={{ animation: "ahSpin .7s linear infinite" }} /> Đang lưu...</>
            ) : saved ? (
                <><CheckCircle2 size={15} /> Đã lưu!</>
            ) : (
                <><Save size={15} /> Lưu thay đổi</>
            )}
        </button>
    );
}