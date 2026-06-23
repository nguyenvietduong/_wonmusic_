'use client';
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ChevronLeft, Mic2, X, Upload, Image as ImageIcon,
    Tag, CheckCircle2, XCircle,
    Loader2, AlertCircle, Plus,
    Facebook, Instagram, Youtube, Music,
    Users, BadgeCheck, FileText,
} from "lucide-react";
import { artistService } from "@/services/artistService";
import axios from "axios";
import { toast } from "sonner";
import { MultiSelect } from "@/components/admin/MultiSelect";

// ─── Types ───────────────────────────────────────────────────────────────────
interface ArtistForm {
    name:      string;
    bio:       string;
    genres:    string[];
    followers: string;
    verified:  boolean;
    socialLinks: {
        facebook:  string;
        instagram: string;
        youtube:   string;
        tiktok:    string;
    };
}

type FieldErrors = Partial<{
    name: string;
    genres: string;
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
    genres:    [],
    followers: "0",
    verified:  false,
    socialLinks: { facebook: "", instagram: "", youtube: "", tiktok: "" },
};

const API = "/api";

const inputCls = "w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400 bg-white transition-shadow";

// ─── Component ───────────────────────────────────────────────────────────────
export default function AdminArtistCreatePage() {
    const router = useRouter();

    const [saving,          setSaving]          = useState(false);
    const [error,           setError]           = useState<string | null>(null);
    const [fieldErrors,     setFieldErrors]     = useState<FieldErrors>({});
    const [coverDrag,       setCoverDrag]       = useState(false);
    const [avatarPreview,   setAvatarPreview]   = useState<string>("");
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const avatarInputRef    = useRef<HTMLInputElement>(null);
    const pendingAvatarFile = useRef<File | null>(null);
    const avatarBlobUrl     = useRef<string>("");

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
        return !errs.name && !errs.followers && !errs.bio && !errs.avatar && !errs.socialLinks;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form, avatarPreview]);

    // ── Completion steps ──
    const steps = [
        { label: "Tên nghệ sĩ",  done: !!form.name.trim() },
        { label: "Thể loại",     done: form.genres.length > 0 },
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
            return;
        }

        setSaving(true);
        setError(null);
        setFieldErrors({});

        try {
            const payload = {
                name:        form.name.trim(),
                bio:         form.bio.trim() || undefined,
                genres:      form.genres,
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

    // ── Saving overlay ──
    if (saving) return (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center">
                <Loader2 size={28} className="text-indigo-600 animate-spin" />
            </div>
            <div className="text-center">
                <p className="text-base font-semibold text-gray-800">{savingLabel}</p>
                <p className="text-sm text-gray-400 mt-1">Vui lòng không đóng trang</p>
            </div>
            <div className="flex items-center gap-3">
                {[
                    { label: "Tạo nghệ sĩ",        done: uploadingAvatar, active: !uploadingAvatar },
                    { label: "Upload ảnh đại diện", done: false,           active: uploadingAvatar },
                ].map((s, i) => (
                    <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        s.active ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                        : s.done  ? "bg-green-50 border-green-200 text-green-600"
                        : "bg-gray-50 border-gray-200 text-gray-400"
                    }`}>
                        {s.active
                            ? <Loader2 size={11} className="animate-spin" />
                            : s.done ? <CheckCircle2 size={11} />
                            : <span className="w-2.5 h-2.5 rounded-full border border-current opacity-30" />
                        }
                        {s.label}
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="min-h-full pb-10">

            {/* Hidden file input */}
            <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = ""; }}
            />

            {/* ── Page header ── */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/artists"
                        className="w-9 h-9 rounded-full border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-all shadow-sm"
                    >
                        <ChevronLeft size={18} />
                    </Link>
                    <div>
                        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                            <Link href="/admin/artists" className="hover:text-indigo-600 transition-colors">Nghệ sĩ</Link>
                            <span>/</span>
                            <span className="text-gray-700 font-medium">Thêm mới</span>
                        </nav>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                            {form.name || <span className="text-gray-300 font-normal">Chưa có tên...</span>}
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {!isValid && (
                        <span className="hidden sm:flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                            <AlertCircle size={12} /> Còn thiếu thông tin bắt buộc
                        </span>
                    )}
                    <Link
                        href="/admin/artists"
                        className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        Huỷ
                    </Link>
                    <button
                        onClick={handleCreate}
                        disabled={!isValid}
                        className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
                    >
                        <Plus size={15} /> Tạo nghệ sĩ
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
                            <h2 className="text-sm font-semibold text-gray-800">Thông tin cơ bản</h2>
                        </div>
                        <div className="px-6 py-6 space-y-5">

                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tên nghệ sĩ <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        autoFocus
                                        value={form.name}
                                        onChange={e => {
                                            set("name", e.target.value);
                                            if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: undefined }));
                                        }}
                                        placeholder="Nhập tên nghệ sĩ..."
                                        maxLength={100}
                                        className={`${inputCls} ${fieldErrors.name ? "border-red-400 ring-2 ring-red-100" : ""}`}
                                    />
                                    <span className="absolute right-3 bottom-3 text-[10px] text-gray-300 pointer-events-none">
                                        {form.name.length}/100
                                    </span>
                                </div>
                                {fieldErrors.name && (
                                    <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
                                        <AlertCircle size={10} /> {fieldErrors.name}
                                    </p>
                                )}
                            </div>

                            {/* Genre + Followers */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Thể loại <span className="text-red-500">*</span>
                                    </label>
                                    <MultiSelect
                                        options={GENRES.map(g => ({ value: g, label: g }))}
                                        values={form.genres}
                                        onChange={v => set("genres", v)}
                                        placeholder="-- Chọn thể loại --"
                                        searchPlaceholder="Tìm thể loại..."
                                        theme="light"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Số followers</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={form.followers}
                                        onChange={e => {
                                            set("followers", e.target.value);
                                            if (fieldErrors.followers) setFieldErrors(prev => ({ ...prev, followers: undefined }));
                                        }}
                                        placeholder="0"
                                        className={`${inputCls} ${fieldErrors.followers ? "border-red-400 ring-2 ring-red-100" : ""}`}
                                    />
                                    {fieldErrors.followers && (
                                        <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
                                            <AlertCircle size={10} /> {fieldErrors.followers}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Bio */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tiểu sử <span className="text-gray-400 text-xs font-normal">(tuỳ chọn)</span></label>
                                <textarea
                                    rows={4}
                                    value={form.bio}
                                    onChange={e => {
                                        set("bio", e.target.value);
                                        if (fieldErrors.bio) setFieldErrors(prev => ({ ...prev, bio: undefined }));
                                    }}
                                    placeholder="Mô tả ngắn về nghệ sĩ..."
                                    maxLength={500}
                                    className={`${inputCls} resize-none ${fieldErrors.bio ? "border-red-400 ring-2 ring-red-100" : ""}`}
                                />
                                <p className="text-xs text-gray-400 mt-1 text-right">{form.bio.length}/500</p>
                                {fieldErrors.bio && (
                                    <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
                                        <AlertCircle size={10} /> {fieldErrors.bio}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Section: mạng xã hội */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
                            <div className="w-1 h-4 rounded-full bg-indigo-600 flex-shrink-0" />
                            <h2 className="text-sm font-semibold text-gray-800">Mạng xã hội <span className="text-gray-400 text-xs font-normal">(tuỳ chọn)</span></h2>
                        </div>
                        <div className="px-6 py-6 space-y-4">
                            {[
                                { key: "facebook"  as const, label: "Facebook",  Icon: Facebook,  iconColor: "text-blue-500",  bgColor: "bg-blue-50",  placeholder: "https://facebook.com/..."  },
                                { key: "instagram" as const, label: "Instagram", Icon: Instagram, iconColor: "text-pink-500",  bgColor: "bg-pink-50",  placeholder: "https://instagram.com/..." },
                                { key: "youtube"   as const, label: "YouTube",   Icon: Youtube,   iconColor: "text-red-500",   bgColor: "bg-red-50",   placeholder: "https://youtube.com/..."   },
                                { key: "tiktok"    as const, label: "TikTok",    Icon: Music,     iconColor: "text-gray-600",  bgColor: "bg-gray-100", placeholder: "https://tiktok.com/@..."   },
                            ].map(({ key, label, Icon, iconColor, bgColor, placeholder }) => (
                                <div key={key}>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-200 ${bgColor}`}>
                                            <Icon size={16} className={iconColor} />
                                        </div>
                                        <input
                                            type="text"
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
                                            className={`${inputCls} ${fieldErrors.socialLinks?.[key] ? "border-red-400 ring-2 ring-red-100" : ""}`}
                                        />
                                    </div>
                                    {fieldErrors.socialLinks?.[key] && (
                                        <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
                                            <AlertCircle size={10} /> {fieldErrors.socialLinks[key]}
                                        </p>
                                    )}
                                </div>
                            ))}

                            {/* Social preview badges */}
                            {Object.values(form.socialLinks).some(v => !!v.trim()) && (
                                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                                    {form.socialLinks.facebook  && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100"><Facebook size={10} /> Facebook</span>}
                                    {form.socialLinks.instagram && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-pink-50 text-pink-600 border border-pink-100"><Instagram size={10} /> Instagram</span>}
                                    {form.socialLinks.youtube   && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-100"><Youtube size={10} /> YouTube</span>}
                                    {form.socialLinks.tiktok    && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200"><Music size={10} /> TikTok</span>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ══════ Right: sidebar (1/3) ══════ */}
                <div className="sticky top-4 space-y-4">

                    {/* Avatar card */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/60">
                            <div className="w-1 h-4 rounded-full bg-gray-300 flex-shrink-0" />
                            <h2 className="text-sm font-semibold text-gray-800">Ảnh đại diện <span className="text-gray-400 text-xs font-normal">(tuỳ chọn)</span></h2>
                        </div>
                        <div className="p-5">
                            {/* Circle preview */}
                            <div className="flex justify-center mb-4">
                                <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center border-2 border-indigo-100 flex-shrink-0">
                                    {avatarPreview
                                        ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                                        : <Mic2 size={24} className="text-indigo-300" />
                                    }
                                    {avatarPreview && (
                                        <button
                                            onClick={() => avatarInputRef.current?.click()}
                                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-full cursor-pointer border-0"
                                        >
                                            <Upload size={14} className="text-white" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Drop zone */}
                            <div
                                onClick={() => avatarInputRef.current?.click()}
                                onDragOver={e => { e.preventDefault(); setCoverDrag(true); }}
                                onDragLeave={() => setCoverDrag(false)}
                                onDrop={e => { e.preventDefault(); setCoverDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f); }}
                                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                                    coverDrag ? "border-indigo-400 bg-indigo-50"
                                    : pendingAvatarFile.current ? "border-green-300 bg-green-50"
                                    : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
                                }`}
                            >
                                <ImageIcon size={18} className={`mx-auto mb-1.5 ${
                                    coverDrag ? "text-indigo-400"
                                    : pendingAvatarFile.current ? "text-green-500"
                                    : "text-gray-300"
                                }`} />
                                {pendingAvatarFile.current ? (
                                    <div>
                                        <p className="text-xs font-semibold text-green-700 truncate max-w-full">{pendingAvatarFile.current.name}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">Click để đổi ảnh</p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-xs text-gray-500">Kéo thả hoặc <span className="text-indigo-600 font-medium">chọn ảnh</span></p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">JPG, PNG, WEBP · tối đa 5MB</p>
                                    </div>
                                )}
                            </div>
                            {fieldErrors.avatar && (
                                <p className="flex items-center gap-1 text-xs text-red-500 mt-2">
                                    <AlertCircle size={10} /> {fieldErrors.avatar}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Verified card */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/60">
                            <div className="w-1 h-4 rounded-full bg-gray-300 flex-shrink-0" />
                            <h2 className="text-sm font-semibold text-gray-800">Xác minh</h2>
                        </div>
                        <div className="px-5 py-4">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${form.verified ? "bg-indigo-50" : "bg-gray-100"}`}>
                                        {form.verified
                                            ? <BadgeCheck size={16} className="text-indigo-600" />
                                            : <Mic2 size={16} className="text-gray-400" />
                                        }
                                    </div>
                                    <div>
                                        <p className={`text-sm font-semibold transition-colors ${form.verified ? "text-gray-900" : "text-gray-500"}`}>
                                            {form.verified ? "Đã xác minh" : "Chưa xác minh"}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {form.verified ? "Hiển thị badge xác minh" : "Tài khoản thông thường"}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => set("verified", !form.verified)}
                                    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 cursor-pointer border-0 ${form.verified ? "bg-indigo-600" : "bg-gray-200"}`}
                                >
                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${form.verified ? "translate-x-5" : "translate-x-0"}`} />
                                </button>
                            </div>
                            <div className={`flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100 text-xs ${form.verified ? "text-indigo-500" : "text-gray-400"}`}>
                                {form.verified
                                    ? <><CheckCircle2 size={12} /> Badge xác minh sẽ hiển thị</>
                                    : <><XCircle size={12} /> Không có badge xác minh</>
                                }
                            </div>
                        </div>
                    </div>

                    {/* Progress card */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/60">
                            <div className="w-1 h-4 rounded-full bg-gray-300 flex-shrink-0" />
                            <h2 className="text-sm font-semibold text-gray-800">Tiến độ</h2>
                            <span className="ml-auto text-xs font-bold text-indigo-600">{doneCount}/{steps.length}</span>
                        </div>
                        <div className="px-5 py-4">
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
                                <div
                                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                                    style={{ width: `${(doneCount / steps.length) * 100}%` }}
                                />
                            </div>
                            <div className="space-y-2.5">
                                {steps.map(s => (
                                    <div key={s.label} className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                                            s.done ? "bg-green-100 border border-green-300" : "bg-gray-100 border border-gray-200"
                                        }`}>
                                            {s.done
                                                ? <CheckCircle2 size={12} className="text-green-600" />
                                                : <span className="text-[9px] font-bold text-gray-300">·</span>
                                            }
                                        </div>
                                        <span className={`text-xs transition-colors ${s.done ? "text-gray-700 font-medium" : "text-gray-400"}`}>
                                            {s.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            {isValid && (
                                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100">
                                    <CheckCircle2 size={13} className="text-green-500" />
                                    <span className="text-xs text-green-600 font-medium">Sẵn sàng tạo nghệ sĩ</span>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
