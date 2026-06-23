'use client';
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
    ChevronLeft, Mic2, Save, X, Upload, Image as ImageIcon,
    Tag, CheckCircle2, XCircle,
    Loader2, AlertCircle,
    Facebook, Instagram, Youtube, Music,
    Users, BadgeCheck, FileText, Hash, Calendar,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { artistService } from "@/services/artistService";
import { MultiSelect } from "@/components/admin/MultiSelect";

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

const API = "/api";

const inputCls = "w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400 bg-white transition-shadow";

export default function AdminArtistEditPage() {
    const params = useParams();
    const id = params?.id as string;

    const [artist,          setArtist]          = useState<any>(null);
    const [loading,         setLoading]         = useState(true);
    const [saving,          setSaving]          = useState(false);
    const [saved,           setSaved]           = useState(false);
    const [error,           setError]           = useState<string | null>(null);
    const [fieldErrors,     setFieldErrors]     = useState<FieldErrors>({});
    const [coverDrag,       setCoverDrag]       = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const avatarInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState<ArtistForm>({
        name: "", bio: "", genres: [], followers: "0", verified: false,
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
                        genres:    data.genres?.length ? data.genres : (data.genre ? [data.genre] : []),
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
        return !errs.name && !errs.followers && !errs.bio && !errs.avatar && !errs.socialLinks;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form, artist?.avatar]);

    // ── Save ──
    const handleSave = async () => {
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
        try {
            await artistService.update(id!, {
                name:        form.name.trim(),
                bio:         form.bio.trim()       || undefined,
                genres:      form.genres,
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

    const genreOptions = GENRES.map(g => ({ value: g, label: g }));

    // ── Loading skeleton ──
    if (loading) return (
        <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded-xl w-48" />
            <div className="h-4 bg-gray-100 rounded-xl w-32" />
            <div className="grid grid-cols-3 gap-7 mt-6">
                <div className="col-span-2 space-y-4">
                    <div className="h-56 bg-gray-100 rounded-2xl" />
                    <div className="h-40 bg-gray-100 rounded-2xl" />
                </div>
                <div className="space-y-4">
                    <div className="h-48 bg-gray-100 rounded-2xl" />
                    <div className="h-32 bg-gray-100 rounded-2xl" />
                </div>
            </div>
        </div>
    );

    if (!artist && !loading) return (
        <div className="py-20 text-center">
            <AlertCircle size={40} className="text-red-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm mb-4">Không tìm thấy nghệ sĩ</p>
            <Link href="/admin/artists" className="text-indigo-600 text-sm hover:underline inline-flex items-center gap-1">
                <ChevronLeft size={14} /> Quay lại danh sách
            </Link>
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
                onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadAvatar(f); e.target.value = ""; }}
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
                            <Link href={`/admin/artists/${id}`} className="hover:text-indigo-600 transition-colors truncate max-w-[160px]">
                                {artist?.name ?? id}
                            </Link>
                            <span>/</span>
                            <span className="text-gray-700 font-medium">Chỉnh sửa</span>
                        </nav>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                            {form.name || <span className="text-gray-300 font-normal">Chưa có tên...</span>}
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href={`/admin/artists/${id}`}
                        className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        Huỷ
                    </Link>
                    <button
                        onClick={handleSave}
                        disabled={saving || !isValid || uploadingAvatar}
                        className={`px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm cursor-pointer disabled:cursor-not-allowed ${
                            saved
                                ? "bg-green-600 text-white"
                                : isValid && !uploadingAvatar
                                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                                : "bg-gray-100 text-gray-400"
                        }`}
                    >
                        {saving
                            ? <><Loader2 size={15} className="animate-spin" /> Đang lưu...</>
                            : saved
                            ? <><CheckCircle2 size={15} /> Đã lưu!</>
                            : <><Save size={15} /> Lưu thay đổi</>
                        }
                    </button>
                </div>
            </div>

            {/* ── Error ── */}
            {error && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-6">
                    <AlertCircle size={15} className="flex-shrink-0" />
                    <span className="flex-1">{error}</span>
                    <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 transition-colors cursor-pointer">
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* ── Content grid ── */}
            <div className="grid grid-cols-3 gap-7 items-start">

                {/* ══════ Left (2/3) ══════ */}
                <div className="col-span-2 space-y-5">

                    {/* Section: Thông tin cơ bản */}
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
                                        Thể loại <span className="text-gray-400 text-xs font-normal">(tuỳ chọn)</span>
                                    </label>
                                    <MultiSelect
                                        options={genreOptions}
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tiểu sử <span className="text-gray-400 text-xs font-normal">(tuỳ chọn)</span>
                                </label>
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
                                <div className="flex items-center justify-between mt-1">
                                    {fieldErrors.bio
                                        ? <p className="flex items-center gap-1 text-xs text-red-500"><AlertCircle size={10} /> {fieldErrors.bio}</p>
                                        : <span />
                                    }
                                    <span className="text-xs text-gray-300 ml-auto">{form.bio.length}/500</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Mạng xã hội */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
                            <div className="w-1 h-4 rounded-full bg-indigo-600 flex-shrink-0" />
                            <h2 className="text-sm font-semibold text-gray-800">
                                Mạng xã hội <span className="text-gray-400 text-xs font-normal">(tuỳ chọn)</span>
                            </h2>
                        </div>
                        <div className="px-6 py-6 space-y-4">
                            {([
                                { key: "facebook"  as const, label: "Facebook",  Icon: Facebook,  iconCls: "text-blue-400",  placeholder: "https://facebook.com/..."  },
                                { key: "instagram" as const, label: "Instagram", Icon: Instagram, iconCls: "text-pink-400",  placeholder: "https://instagram.com/..." },
                                { key: "youtube"   as const, label: "YouTube",   Icon: Youtube,   iconCls: "text-red-400",   placeholder: "https://youtube.com/..."   },
                                { key: "tiktok"    as const, label: "TikTok",    Icon: Music,     iconCls: "text-gray-500",  placeholder: "https://tiktok.com/@..."   },
                            ]).map(({ key, label, Icon, iconCls, placeholder }) => (
                                <div key={key}>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0">
                                            <Icon size={16} className={iconCls} />
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
                                        <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5 ml-12">
                                            <AlertCircle size={10} /> {fieldErrors.socialLinks[key]}
                                        </p>
                                    )}
                                </div>
                            ))}

                            {/* Social preview badges */}
                            {Object.values(form.socialLinks).some(v => !!v.trim()) && (
                                <div className="pt-4 border-t border-gray-100">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Preview</p>
                                    <div className="flex flex-wrap gap-2">
                                        {form.socialLinks.facebook  && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100"><Facebook  size={11} /> Facebook</span>}
                                        {form.socialLinks.instagram && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-pink-50 text-pink-600 border border-pink-100"><Instagram size={11} /> Instagram</span>}
                                        {form.socialLinks.youtube   && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-500 border border-red-100"><Youtube   size={11} /> YouTube</span>}
                                        {form.socialLinks.tiktok    && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200"><Music     size={11} /> TikTok</span>}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ══════ Right sidebar (1/3) ══════ */}
                <div className="sticky top-4 space-y-4">

                    {/* Avatar card */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/60">
                            <div className="w-1 h-4 rounded-full bg-gray-300 flex-shrink-0" />
                            <h2 className="text-sm font-semibold text-gray-800">Ảnh đại diện</h2>
                        </div>
                        <div className="p-5 space-y-4">
                            {/* Preview */}
                            <div className="relative mx-auto w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-gray-200 flex items-center justify-center">
                                {artist?.avatar
                                    ? <img src={artist.avatar} alt="avatar" className="w-full h-full object-cover" />
                                    : <Mic2 size={24} className="text-indigo-300" />
                                }
                                {uploadingAvatar && (
                                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                        <Loader2 size={18} className="text-white animate-spin" />
                                    </div>
                                )}
                            </div>

                            {/* Drop zone */}
                            <div
                                onClick={() => avatarInputRef.current?.click()}
                                onDragOver={e => { e.preventDefault(); setCoverDrag(true); }}
                                onDragLeave={() => setCoverDrag(false)}
                                onDrop={e => { e.preventDefault(); setCoverDrag(false); const f = e.dataTransfer.files[0]; if (f) handleUploadAvatar(f); }}
                                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                                    coverDrag ? "border-indigo-400 bg-indigo-50"
                                        : uploadingAvatar ? "border-indigo-200 bg-indigo-50"
                                        : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
                                }`}
                            >
                                {uploadingAvatar ? (
                                    <p className="text-xs text-indigo-500 font-medium">Đang upload...</p>
                                ) : (
                                    <>
                                        <Upload size={16} className={`mx-auto mb-1.5 ${coverDrag ? "text-indigo-500" : "text-gray-300"}`} />
                                        <p className="text-xs text-gray-500">
                                            Kéo thả hoặc <span className="text-indigo-600 font-medium">chọn ảnh</span>
                                        </p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">JPG, PNG, WEBP · tối đa 5MB</p>
                                    </>
                                )}
                            </div>

                            {fieldErrors.avatar && (
                                <p className="flex items-center gap-1 text-xs text-red-500">
                                    <AlertCircle size={10} /> {fieldErrors.avatar}
                                </p>
                            )}

                            {/* Current URL */}
                            {artist?.avatar && (
                                <div className="bg-gray-50 rounded-lg border border-gray-100 px-3 py-2">
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">URL hiện tại</p>
                                    <p className="text-xs text-indigo-500 truncate">{artist.avatar}</p>
                                </div>
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
                                            : <Mic2      size={16} className="text-gray-400" />
                                        }
                                    </div>
                                    <div>
                                        <p className={`text-sm font-semibold transition-colors ${form.verified ? "text-gray-900" : "text-gray-500"}`}>
                                            {form.verified ? "Đã xác minh" : "Chưa xác minh"}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {form.verified ? "Hiển thị badge ✓" : "Tài khoản thông thường"}
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
                                    ? <><CheckCircle2 size={12} /> Badge: Đã xác minh ✓</>
                                    : <><XCircle      size={12} /> Badge: Thường</>
                                }
                            </div>
                        </div>
                    </div>

                    {/* System info card */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/60">
                            <div className="w-1 h-4 rounded-full bg-gray-300 flex-shrink-0" />
                            <h2 className="text-sm font-semibold text-gray-800">Thông tin hệ thống</h2>
                        </div>
                        <div className="px-5 py-4 space-y-2">
                            {[
                                { label: "Artist ID",  value: id,                                                                               Icon: Hash     },
                                { label: "Ngày tạo",   value: artist?.createdAt ? new Date(artist.createdAt).toLocaleDateString("vi-VN") : "—", Icon: Calendar },
                                { label: "Cập nhật",   value: artist?.updatedAt ? new Date(artist.updatedAt).toLocaleDateString("vi-VN") : "—", Icon: Calendar },
                                { label: "Followers",  value: Number(form.followers).toLocaleString("vi"),                                      Icon: Users    },
                            ].map(({ label, value, Icon }) => (
                                <div key={label} className="flex items-center gap-2.5 py-1.5 border-b border-gray-50 last:border-0">
                                    <Icon size={12} className="text-indigo-400 flex-shrink-0" />
                                    <span className="text-xs text-gray-400 w-20 flex-shrink-0">{label}</span>
                                    <span className="text-xs text-gray-700 font-semibold truncate">{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
