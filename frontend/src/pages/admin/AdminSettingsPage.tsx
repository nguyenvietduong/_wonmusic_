'use client';
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useSettingsStore } from "@/stores/useSettingsStore";
import {
    Settings, Image as ImageIcon, Globe, Facebook,
    Instagram, Youtube, Share2, Mail, Phone, MapPin,
    Search, Save, CheckCircle, AlertCircle, Upload, Loader2,
    Info, Users, BarChart2, FileText, KeyRound, Eye, EyeOff,
} from "lucide-react";

// ─── types ──────────────────────────────────────────────────────────────────
interface SiteSettings {
    siteName:          string;
    tagline:           string;
    logoUrl:           string;
    logoBlackUrl:      string;
    faviconUrl:        string;
    facebook:          string;
    instagram:         string;
    youtube:           string;
    tiktok:            string;
    metaTitle:         string;
    metaDescription:   string;
    contactEmail:      string;
    contactPhone:      string;
    contactAddress:    string;
    aboutHeroSubtitle:    string;
    aboutMissionP1:       string;
    aboutMissionP2:       string;
    aboutCtaSubtitle:     string;
    aboutHeroSubtitleEn:  string;
    aboutMissionP1En:     string;
    aboutMissionP2En:     string;
    aboutCtaSubtitleEn:   string;
    aboutStats:           string;
    aboutTeam:            string;
    emailjsServiceId:     string;
    emailjsTemplateId:    string;
    emailjsPublicKey:     string;
    emailjsToEmail:       string;
}

const EMPTY: SiteSettings = {
    siteName: "", tagline: "", logoUrl: "", logoBlackUrl: "", faviconUrl: "",
    facebook: "", instagram: "", youtube: "", tiktok: "",
    metaTitle: "", metaDescription: "",
    contactEmail: "", contactPhone: "", contactAddress: "",
    aboutHeroSubtitle: "", aboutMissionP1: "", aboutMissionP2: "", aboutCtaSubtitle: "",
    aboutHeroSubtitleEn: "", aboutMissionP1En: "", aboutMissionP2En: "", aboutCtaSubtitleEn: "",
    aboutStats: "", aboutTeam: "",
    emailjsServiceId: "", emailjsTemplateId: "", emailjsPublicKey: "", emailjsToEmail: "",
};

type Tab = "branding" | "social" | "seo" | "contact" | "about" | "email";

const TABS: { key: Tab; label: string; Icon: any }[] = [
    { key: "branding", label: "Thương hiệu", Icon: ImageIcon },
    { key: "social",   label: "Mạng xã hội", Icon: Share2    },
    { key: "seo",      label: "SEO",          Icon: Search    },
    { key: "contact",  label: "Liên hệ",      Icon: Mail      },
    { key: "about",    label: "Về chúng tôi", Icon: Info      },
    { key: "email",    label: "Email / SMTP",  Icon: KeyRound  },
];

// ─── helpers ────────────────────────────────────────────────────────────────
function Field({
    label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
            {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
            {children}
        </div>
    );
}

function Input({
    value, onChange, placeholder, type = "text",
}: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
    return (
        <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400 transition-all"
        />
    );
}

function Textarea({
    value, onChange, placeholder, rows = 3,
}: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
    return (
        <textarea
            rows={rows}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400 transition-all resize-none"
        />
    );
}

// ─── Logo upload box ─────────────────────────────────────────────────────────
function LogoUpload({
    label, hint, currentUrl, file, onChange, bust = 0,
}: {
    label: string; hint: string; currentUrl: string;
    file: File | null; onChange: (f: File) => void; bust?: number;
}) {
    const ref = useRef<HTMLInputElement>(null);
    // file object URL khi mới chọn, hoặc URL server + cache-bust sau khi lưu
    const preview = file
        ? URL.createObjectURL(file)
        : currentUrl ? `${currentUrl}?t=${bust}` : "";

    return (
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
            <p className="text-xs text-gray-400 mb-2">{hint}</p>
            <div className="flex items-center gap-4">
                <div className="w-24 h-14 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {preview
                        ? <img src={preview} alt={label} className="max-w-full max-h-full object-contain p-1" />
                        : <ImageIcon size={20} className="text-gray-300" />
                    }
                </div>
                <div>
                    <button
                        type="button"
                        onClick={() => ref.current?.click()}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 text-sm font-semibold hover:bg-indigo-100 transition-colors cursor-pointer"
                    >
                        <Upload size={13} /> Chọn ảnh
                    </button>
                    {file && <p className="text-xs text-gray-500 mt-1.5 truncate max-w-[180px]">{file.name}</p>}
                </div>
                <input
                    ref={ref} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) onChange(f); }}
                />
            </div>
        </div>
    );
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function AdminSettingsPage() {
    const updateStore = useSettingsStore(s => s.update);
    const [form,         setForm]         = useState<SiteSettings>(EMPTY);
    const [activeTab,    setActiveTab]    = useState<Tab>("branding");
    const [loading,      setLoading]      = useState(true);
    const [saving,       setSaving]       = useState(false);
    const [aboutLang,    setAboutLang]    = useState<"vi" | "en">("vi");
    const [toast,        setToast]        = useState<{ type: "success" | "error"; msg: string } | null>(null);
    // cache-bust timestamp — append to image src after save to force browser reload
    const [bust,         setBust]         = useState(() => Date.now());
    const [showKey,      setShowKey]      = useState(false);

    // logo files
    const [logoFile,      setLogoFile]      = useState<File | null>(null);
    const [logoBlackFile, setLogoBlackFile] = useState<File | null>(null);
    const [faviconFile,   setFaviconFile]   = useState<File | null>(null);

    const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        (async () => {
            try {
                const res = await axios.get("/api/settings");
                if (res.data.success) setForm({ ...EMPTY, ...res.data.data });
            } catch { /* use defaults */ }
            finally { setLoading(false); }
        })();
    }, []);

    const showToast = (type: "success" | "error", msg: string) => {
        setToast({ type, msg });
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(null), 3500);
    };

    const save = async () => {
        setSaving(true);
        try {
            const hasFile = logoFile || logoBlackFile || faviconFile;
            let res;
            if (hasFile) {
                const fd = new FormData();
                Object.entries(form).forEach(([k, v]) => fd.append(k, v));
                if (logoFile)      fd.append("logoFile",      logoFile);
                if (logoBlackFile) fd.append("logoBlackFile", logoBlackFile);
                if (faviconFile)   fd.append("faviconFile",   faviconFile);
                res = await axios.patch("/api/settings", fd);
            } else {
                res = await axios.patch("/api/settings", form);
            }
            // cập nhật form + store + cache-bust để browser reload ảnh ngay lập tức
            if (res.data?.success) {
                setForm({ ...EMPTY, ...res.data.data });
                updateStore(res.data.data);
                setBust(Date.now());
            }
            setLogoFile(null); setLogoBlackFile(null); setFaviconFile(null);
            showToast("success", "Đã lưu cấu hình thành công!");
        } catch {
            showToast("error", "Lưu thất bại. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

    const set = (k: keyof SiteSettings) => (v: string) =>
        setForm(f => ({ ...f, [k]: v }));

    if (loading) return (
        <div className="flex items-center justify-center py-24">
            <Loader2 size={24} className="text-indigo-400 animate-spin" />
        </div>
    );

    return (
        <div>
            <style>{`
                @keyframes stUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
                @keyframes stIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
            `}</style>

            {/* Toast */}
            {toast && (
                <div
                    className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold
                        ${toast.type === "success"
                            ? "bg-white border-emerald-200 text-emerald-700"
                            : "bg-white border-red-200 text-red-600"
                        }`}
                    style={{ animation: "stIn .25s both" }}
                >
                    {toast.type === "success"
                        ? <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
                        : <AlertCircle size={16} className="text-red-500 flex-shrink-0"   />
                    }
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="mb-6" style={{ animation: "stUp .3s both" }}>
                <div className="flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" />
                    <span className="text-[11px] text-indigo-500 tracking-widest uppercase font-semibold">Won Music Admin</span>
                </div>
                <div className="flex items-end justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Cài đặt hệ thống</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Cấu hình thương hiệu, mạng xã hội và thông tin liên hệ</p>
                    </div>
                    <button
                        onClick={save}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold cursor-pointer transition-colors shadow-sm"
                    >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                </div>
            </div>

            {/* Tabs + Content */}
            <div className="flex gap-5 items-start" style={{ animation: "stUp .4s both" }}>

                {/* Tab sidebar */}
                <div className="w-44 flex-shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm p-2 sticky top-0">
                    {TABS.map(({ key, label, Icon }) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer text-left mb-0.5
                                ${activeTab === key
                                    ? "bg-indigo-600 text-white"
                                    : "text-gray-600 hover:bg-gray-100"
                                }`}
                        >
                            <Icon size={14} className={activeTab === key ? "text-white/80" : "text-gray-400"} />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Content panel */}
                <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">

                    {/* ── Thương hiệu ── */}
                    {activeTab === "branding" && (
                        <>
                            <SectionTitle Icon={ImageIcon} title="Thương hiệu" desc="Logo, tên site và slogan hiển thị trên trang web" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <Field label="Tên site" hint='Ví dụ: "Won Music"'>
                                    <Input value={form.siteName} onChange={set("siteName")} placeholder="Won Music" />
                                </Field>
                                <Field label="Tagline" hint="Slogan ngắn hiển thị dưới logo">
                                    <Input value={form.tagline} onChange={set("tagline")} placeholder="Nghe nhạc mọi lúc, mọi nơi" />
                                </Field>
                            </div>

                            <div className="pt-2 border-t border-gray-100" />

                            <div className="grid grid-cols-1 gap-6">
                                <LogoUpload
                                    label="Logo chính (nền tối)"
                                    hint="File PNG/WebP nền trong suốt, tối thiểu 200×60px"
                                    currentUrl={form.logoUrl}
                                    file={logoFile}
                                    onChange={setLogoFile}
                                    bust={bust}
                                />
                                <LogoUpload
                                    label="Logo đen (nền sáng)"
                                    hint="Dùng trên background trắng / header sáng"
                                    currentUrl={form.logoBlackUrl}
                                    file={logoBlackFile}
                                    onChange={setLogoBlackFile}
                                    bust={bust}
                                />
                                <LogoUpload
                                    label="Favicon"
                                    hint="File ICO hoặc PNG 32×32px, hiển thị trên tab trình duyệt"
                                    currentUrl={form.faviconUrl}
                                    file={faviconFile}
                                    onChange={setFaviconFile}
                                    bust={bust}
                                />
                            </div>
                        </>
                    )}

                    {/* ── Mạng xã hội ── */}
                    {activeTab === "social" && (
                        <>
                            <SectionTitle Icon={Share2} title="Mạng xã hội" desc="URL trang mạng xã hội chính thức của Won Music" />

                            <div className="space-y-4">
                                {[
                                    { key: "facebook" as const,  Icon: Facebook,  label: "Facebook",  ph: "https://facebook.com/wonmusic",  color: "text-blue-500"  },
                                    { key: "instagram" as const, Icon: Instagram, label: "Instagram", ph: "https://instagram.com/wonmusic", color: "text-pink-500"  },
                                    { key: "youtube" as const,   Icon: Youtube,   label: "YouTube",   ph: "https://youtube.com/@wonmusic",  color: "text-red-500"   },
                                    { key: "tiktok" as const,    Icon: Share2,    label: "TikTok",    ph: "https://tiktok.com/@wonmusic",   color: "text-gray-700"  },
                                ].map(({ key, Icon, label, ph, color }) => (
                                    <Field key={key} label={label}>
                                        <div className="relative">
                                            <Icon size={14} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${color} pointer-events-none`} />
                                            <input
                                                type="url"
                                                value={form[key]}
                                                onChange={e => set(key)(e.target.value)}
                                                placeholder={ph}
                                                className="w-full pl-9 pr-4 py-2.5 text-sm text-gray-800 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400 transition-all"
                                            />
                                        </div>
                                    </Field>
                                ))}
                            </div>
                        </>
                    )}

                    {/* ── SEO ── */}
                    {activeTab === "seo" && (
                        <>
                            <SectionTitle Icon={Search} title="Tối ưu SEO" desc="Tiêu đề và mô tả mặc định hiển thị trên Google" />

                            <Field label="Meta Title" hint="Tiêu đề trang chủ trên kết quả tìm kiếm (50–60 ký tự)">
                                <Input
                                    value={form.metaTitle}
                                    onChange={set("metaTitle")}
                                    placeholder="Won Music – Nghe nhạc trực tuyến"
                                />
                                <p className={`text-[11px] mt-1 ${form.metaTitle.length > 60 ? "text-red-500" : "text-gray-400"}`}>
                                    {form.metaTitle.length} / 60 ký tự
                                </p>
                            </Field>

                            <Field label="Meta Description" hint="Mô tả ngắn hiển thị dưới tiêu đề trên Google (120–160 ký tự)">
                                <Textarea
                                    rows={4}
                                    value={form.metaDescription}
                                    onChange={set("metaDescription")}
                                    placeholder="Won Music – nền tảng nghe nhạc trực tuyến với hàng nghìn bài hát chất lượng cao..."
                                />
                                <p className={`text-[11px] mt-1 ${form.metaDescription.length > 160 ? "text-red-500" : "text-gray-400"}`}>
                                    {form.metaDescription.length} / 160 ký tự
                                </p>
                            </Field>

                            {/* Preview */}
                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Xem trước kết quả Google</p>
                                <div className="text-[12px] text-green-700">wonmusic.vn</div>
                                <div className="text-[18px] text-blue-700 font-medium leading-snug mt-0.5 hover:underline cursor-pointer">
                                    {form.metaTitle || "Won Music – Nghe nhạc trực tuyến"}
                                </div>
                                <div className="text-[13px] text-gray-600 mt-1 leading-relaxed">
                                    {form.metaDescription || "Mô tả trang sẽ hiển thị ở đây..."}
                                </div>
                            </div>
                        </>
                    )}

                    {/* ── Liên hệ ── */}
                    {activeTab === "contact" && (
                        <>
                            <SectionTitle Icon={Mail} title="Thông tin liên hệ" desc="Hiển thị trên trang Liên hệ và footer" />

                            <div className="space-y-4">
                                <Field label="Email">
                                    <div className="relative">
                                        <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        <input
                                            type="email"
                                            value={form.contactEmail}
                                            onChange={e => set("contactEmail")(e.target.value)}
                                            placeholder="contact@wonmusic.vn"
                                            className="w-full pl-9 pr-4 py-2.5 text-sm text-gray-800 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400 transition-all"
                                        />
                                    </div>
                                </Field>

                                <Field label="Số điện thoại">
                                    <div className="relative">
                                        <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        <input
                                            type="tel"
                                            value={form.contactPhone}
                                            onChange={e => set("contactPhone")(e.target.value)}
                                            placeholder="+84 28 1234 5678"
                                            className="w-full pl-9 pr-4 py-2.5 text-sm text-gray-800 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400 transition-all"
                                        />
                                    </div>
                                </Field>

                                <Field label="Địa chỉ">
                                    <div className="relative">
                                        <MapPin size={14} className="absolute left-3.5 top-3.5 text-gray-400 pointer-events-none" />
                                        <Textarea
                                            rows={2}
                                            value={form.contactAddress}
                                            onChange={set("contactAddress")}
                                            placeholder="123 Nguyễn Huệ, Quận 1, TP.HCM"
                                        />
                                    </div>
                                </Field>
                            </div>
                        </>
                    )}

                    {/* ── Về chúng tôi ── */}
                    {activeTab === "about" && (
                        <>
                            <SectionTitle Icon={Info} title="Về chúng tôi" desc="Nội dung trang Giới thiệu — để trống sẽ dùng văn bản mặc định" />

                            {/* Language toggle */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 font-medium">Ngôn ngữ:</span>
                                {(["vi", "en"] as const).map(l => (
                                    <button
                                        key={l}
                                        type="button"
                                        onClick={() => setAboutLang(l)}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer
                                            ${aboutLang === l
                                                ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                                                : "bg-white border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600"
                                            }`}
                                    >
                                        <span>{l === "vi" ? "🇻🇳" : "🇬🇧"}</span>
                                        {l === "vi" ? "Tiếng Việt" : "English"}
                                    </button>
                                ))}
                            </div>

                            <Field
                                label="Hero subtitle"
                                hint="Mô tả ngắn hiển thị dưới tiêu đề trang hero"
                            >
                                <Textarea
                                    rows={3}
                                    value={aboutLang === "vi" ? form.aboutHeroSubtitle : form.aboutHeroSubtitleEn}
                                    onChange={aboutLang === "vi" ? set("aboutHeroSubtitle") : set("aboutHeroSubtitleEn")}
                                    placeholder={aboutLang === "vi"
                                        ? "Nền tảng âm nhạc trực tuyến hàng đầu Việt Nam..."
                                        : "Vietnam's leading online music platform..."}
                                />
                            </Field>

                            <div className="pt-1 border-t border-gray-100" />

                            <SectionTitle Icon={FileText} title="Sứ mệnh" desc="Hai đoạn văn trong phần Mission" />

                            <Field label={aboutLang === "vi" ? "Đoạn 1" : "Paragraph 1"}>
                                <Textarea
                                    rows={4}
                                    value={aboutLang === "vi" ? form.aboutMissionP1 : form.aboutMissionP1En}
                                    onChange={aboutLang === "vi" ? set("aboutMissionP1") : set("aboutMissionP1En")}
                                    placeholder={aboutLang === "vi"
                                        ? "Won Music ra đời với sứ mệnh..."
                                        : "Won Music was founded with the mission..."}
                                />
                            </Field>

                            <Field label={aboutLang === "vi" ? "Đoạn 2" : "Paragraph 2"}>
                                <Textarea
                                    rows={4}
                                    value={aboutLang === "vi" ? form.aboutMissionP2 : form.aboutMissionP2En}
                                    onChange={aboutLang === "vi" ? set("aboutMissionP2") : set("aboutMissionP2En")}
                                    placeholder={aboutLang === "vi"
                                        ? "Chúng tôi tin rằng..."
                                        : "We believe that..."}
                                />
                            </Field>

                            <div className="pt-1 border-t border-gray-100" />

                            <SectionTitle Icon={BarChart2} title="Thống kê nổi bật" desc="4 chỉ số hiển thị trong phần Stats — dùng chung cả hai ngôn ngữ" />
                            <StatsEditor
                                value={form.aboutStats}
                                onChange={v => setForm(f => ({ ...f, aboutStats: v }))}
                            />

                            <div className="pt-1 border-t border-gray-100" />

                            <SectionTitle Icon={Users} title="Đội ngũ" desc="Để trống → ẩn phần Đội ngũ trên trang client" />
                            <TeamEditor
                                value={form.aboutTeam}
                                onChange={v => setForm(f => ({ ...f, aboutTeam: v }))}
                            />

                            <div className="pt-1 border-t border-gray-100" />

                            <Field
                                label="CTA subtitle"
                                hint="Mô tả trong phần Call-to-Action cuối trang"
                            >
                                <Textarea
                                    rows={3}
                                    value={aboutLang === "vi" ? form.aboutCtaSubtitle : form.aboutCtaSubtitleEn}
                                    onChange={aboutLang === "vi" ? set("aboutCtaSubtitle") : set("aboutCtaSubtitleEn")}
                                    placeholder={aboutLang === "vi"
                                        ? "Hãy cùng chúng tôi xây dựng nền âm nhạc Việt Nam..."
                                        : "Join us in building Vietnam's music ecosystem..."}
                                />
                            </Field>
                        </>
                    )}

                    {/* ── Email / EmailJS ── */}
                    {activeTab === "email" && (
                        <>
                            <SectionTitle Icon={KeyRound} title="EmailJS" desc="Cấu hình dịch vụ gửi email từ form liên hệ — lấy key tại emailjs.com" />

                            {/* Hướng dẫn */}
                            <div className="flex gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                                <span className="flex-shrink-0 mt-0.5">⚠️</span>
                                <div className="text-sm text-amber-800 leading-relaxed space-y-1">
                                    <p><strong>Cách lấy key:</strong> Đăng nhập <strong>emailjs.com</strong> → <strong>Email Services</strong> (Service ID) → <strong>Email Templates</strong> (Template ID) → <strong>Account → API Keys</strong> (Public Key).</p>
                                    <p className="text-amber-600">Public Key là thông tin nhạy cảm — không chia sẻ công khai.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Field label="Service ID" hint="Ví dụ: service_abc1234 — tìm trong Email Services">
                                    <div className="relative">
                                        <KeyRound size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        <input
                                            type="text"
                                            value={form.emailjsServiceId}
                                            onChange={e => set("emailjsServiceId")(e.target.value)}
                                            placeholder="service_xxxxxxx"
                                            className="w-full pl-9 pr-4 py-2.5 text-sm font-mono text-gray-800 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400 transition-all"
                                        />
                                    </div>
                                </Field>

                                <Field label="Template ID" hint="Ví dụ: template_abc1234 — tìm trong Email Templates">
                                    <div className="relative">
                                        <KeyRound size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        <input
                                            type="text"
                                            value={form.emailjsTemplateId}
                                            onChange={e => set("emailjsTemplateId")(e.target.value)}
                                            placeholder="template_xxxxxxx"
                                            className="w-full pl-9 pr-4 py-2.5 text-sm font-mono text-gray-800 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400 transition-all"
                                        />
                                    </div>
                                </Field>

                                <Field label="Public Key" hint="Tìm trong Account → API Keys (còn gọi là User ID)">
                                    <div className="relative">
                                        <KeyRound size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        <input
                                            type={showKey ? "text" : "password"}
                                            value={form.emailjsPublicKey}
                                            onChange={e => set("emailjsPublicKey")(e.target.value)}
                                            placeholder="••••••••••••••••••••"
                                            className="w-full pl-9 pr-10 py-2.5 text-sm font-mono text-gray-800 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400 transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowKey(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                        >
                                            {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
                                </Field>

                                <div className="pt-2 border-t border-gray-100" />

                                <Field label="Email nhận thông báo" hint="Địa chỉ email sẽ nhận tin nhắn từ form liên hệ">
                                    <div className="relative">
                                        <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        <input
                                            type="email"
                                            value={form.emailjsToEmail}
                                            onChange={e => set("emailjsToEmail")(e.target.value)}
                                            placeholder="admin@wonmusic.vn"
                                            className="w-full pl-9 pr-4 py-2.5 text-sm text-gray-800 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400 transition-all"
                                        />
                                    </div>
                                </Field>
                            </div>

                            {/* Status indicator */}
                            {(() => {
                                const missing = [
                                    !form.emailjsServiceId  && "Service ID",
                                    !form.emailjsTemplateId && "Template ID",
                                    !form.emailjsPublicKey  && "Public Key",
                                ].filter(Boolean);
                                const ready = missing.length === 0;
                                return (
                                    <div className={`space-y-2 p-3.5 rounded-xl border text-sm ${
                                        ready ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
                                    }`}>
                                        <div className={`flex items-center gap-2 font-medium ${ready ? "text-emerald-700" : "text-red-700"}`}>
                                            {ready
                                                ? <><CheckCircle size={15} className="text-emerald-500 flex-shrink-0" /> EmailJS đã sẵn sàng — form liên hệ sẽ hoạt động.</>
                                                : <><AlertCircle size={15} className="text-red-500 flex-shrink-0" /> Còn thiếu: <strong>{missing.join(", ")}</strong></>
                                            }
                                        </div>
                                        <div className="text-xs text-gray-500 flex items-center gap-1.5">
                                            <Mail size={11} />
                                            Email nhận:{" "}
                                            <strong className="text-gray-700">
                                                {form.emailjsToEmail || form.contactEmail || "(dùng mặc định trong code)"}
                                            </strong>
                                        </div>
                                    </div>
                                );
                            })()}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Stats row editor ────────────────────────────────────────────────────────
const DEFAULT_STATS = [
    { value: "500+", label: "Bài hát",     icon: "🎵" },
    { value: "200+", label: "Nghệ sĩ",     icon: "🎤" },
    { value: "50K+", label: "Người dùng",  icon: "👥" },
    { value: "1M+",  label: "Lượt nghe",   icon: "🎧" },
];

function StatsEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    let rows: typeof DEFAULT_STATS;
    try { rows = value ? JSON.parse(value) : DEFAULT_STATS; }
    catch { rows = DEFAULT_STATS; }
    while (rows.length < 4) rows.push({ value: "", label: "", icon: "" });
    rows = rows.slice(0, 4);

    const update = (i: number, field: string, v: string) => {
        const next = rows.map((r, idx) => idx === i ? { ...r, [field]: v } : r);
        onChange(JSON.stringify(next));
    };

    return (
        <div className="space-y-2.5">
            <div className="grid grid-cols-[16px_48px_1fr_1fr] gap-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                <span>#</span><span>Icon</span><span>Số / Giá trị</span><span>Nhãn</span>
            </div>
            {rows.map((row, i) => (
                <div key={i} className="grid grid-cols-[16px_48px_1fr_1fr] gap-2 items-center p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-xs text-gray-300 font-mono">{i + 1}</span>
                    <input
                        value={row.icon} onChange={e => update(i, "icon", e.target.value)}
                        placeholder="🎵"
                        className="w-full px-1.5 py-2 text-center text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                    <input
                        value={row.value} onChange={e => update(i, "value", e.target.value)}
                        placeholder="500+"
                        className="w-full px-3 py-2 text-sm text-gray-800 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                    <input
                        value={row.label} onChange={e => update(i, "label", e.target.value)}
                        placeholder="Bài hát"
                        className="w-full px-3 py-2 text-sm text-gray-800 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                </div>
            ))}
        </div>
    );
}

// ─── Team row editor ─────────────────────────────────────────────────────────
const DEFAULT_TEAM = [
    { name: "Nguyễn Văn Minh", role: "CEO & Founder",  initials: "NM" },
    { name: "Trần Thị Lan",    role: "Head of Music",   initials: "TL" },
    { name: "Lê Quang Hùng",  role: "Lead Producer",   initials: "LH" },
    { name: "Phạm Thùy Dung", role: "Artist Manager",  initials: "PD" },
];

function TeamEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    let rows: typeof DEFAULT_TEAM;
    try { rows = value ? JSON.parse(value) : DEFAULT_TEAM; }
    catch { rows = DEFAULT_TEAM; }
    while (rows.length < 4) rows.push({ name: "", role: "", initials: "" });
    rows = rows.slice(0, 4);

    const update = (i: number, field: string, v: string) => {
        const next = rows.map((r, idx) => idx === i ? { ...r, [field]: v } : r);
        onChange(JSON.stringify(next));
    };

    return (
        <div className="space-y-2.5">
            <div className="grid grid-cols-[16px_56px_1fr_1fr] gap-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                <span>#</span><span>Viết tắt</span><span>Họ và tên</span><span>Vai trò</span>
            </div>
            {rows.map((row, i) => (
                <div key={i} className="grid grid-cols-[16px_56px_1fr_1fr] gap-2 items-center p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-xs text-gray-300 font-mono">{i + 1}</span>
                    <input
                        value={row.initials} onChange={e => update(i, "initials", e.target.value.toUpperCase())}
                        placeholder="NM" maxLength={3}
                        className="w-full px-1.5 py-2 text-center text-sm font-bold text-indigo-600 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white uppercase"
                    />
                    <input
                        value={row.name} onChange={e => update(i, "name", e.target.value)}
                        placeholder="Họ và tên"
                        className="w-full px-3 py-2 text-sm text-gray-800 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                    <input
                        value={row.role} onChange={e => update(i, "role", e.target.value)}
                        placeholder="CEO & Founder"
                        className="w-full px-3 py-2 text-sm text-gray-800 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                </div>
            ))}
        </div>
    );
}

// ─── Section title ───────────────────────────────────────────────────────────
function SectionTitle({ Icon, title, desc }: { Icon: any; title: string; desc: string }) {
    return (
        <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon size={16} className="text-indigo-600" />
            </div>
            <div>
                <h2 className="text-base font-bold text-gray-900">{title}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </div>
        </div>
    );
}
