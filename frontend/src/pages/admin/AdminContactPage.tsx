'use client';
import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { useSettingsStore } from "@/stores/useSettingsStore";
import {
    Phone, Mail, MapPin, MessageSquare, Image as ImageIcon, Type,
    Save, CheckCircle, AlertCircle, Loader2, ExternalLink,
} from "lucide-react";

// ─── types ────────────────────────────────────────────────────────────────────
type Tab = "banner" | "info" | "sections" | "form";

const TABS: { key: Tab; label: string; Icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { key: "banner",   label: "Banner",       Icon: ImageIcon    },
    { key: "info",     label: "Thông tin",    Icon: MapPin       },
    { key: "sections", label: "Tiêu đề",      Icon: Type         },
    { key: "form",     label: "Form liên hệ", Icon: MessageSquare },
];

// ─── UI helpers ───────────────────────────────────────────────────────────────
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
            {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
            {children}
        </div>
    );
}

const inputCls = "w-full px-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400 transition-all";

function Input({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
    return <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />;
}

function Textarea({ value, onChange, placeholder, rows = 2 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
    return <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={`${inputCls} resize-none`} />;
}

function LangToggle({ lang, setLang }: { lang: "vi" | "en"; setLang: (l: "vi" | "en") => void }) {
    return (
        <div className="flex gap-1 p-0.5 bg-gray-100 rounded-lg w-fit">
            {(["vi", "en"] as const).map(l => (
                <button key={l} type="button" onClick={() => setLang(l)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${lang === l ? "bg-white shadow text-indigo-600" : "text-gray-500 hover:text-gray-700"}`}>
                    {l.toUpperCase()}
                </button>
            ))}
        </div>
    );
}

function SaveBtn({ saving, saved }: { saving: boolean; saved: boolean }) {
    return (
        <button type="submit" disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors cursor-pointer">
            {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <CheckCircle size={15} /> : <Save size={15} />}
            {saving ? "Đang lưu..." : saved ? "Đã lưu!" : "Lưu thay đổi"}
        </button>
    );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">{title}</h3>
            <div className="space-y-4">{children}</div>
        </div>
    );
}

function Toast({ toast }: { toast: { type: "success" | "error"; msg: string } | null }) {
    if (!toast) return null;
    return (
        <div className={`fixed bottom-6 right-6 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl z-50 text-sm font-semibold ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
            {toast.type === "success" ? <CheckCircle size={17} /> : <AlertCircle size={17} />}
            {toast.msg}
        </div>
    );
}

// ─── Tab: Banner ──────────────────────────────────────────────────────────────
function BannerTab({ onSave }: { onSave: (f: Record<string, string>) => Promise<void> }) {
    const [lang, setLang] = useState<"vi" | "en">("vi");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [form, setForm] = useState({
        contactBannerSubtitleVi: "", contactBannerSubtitleEn: "",
        contactBannerTitleVi:    "", contactBannerTitleEn:    "",
        contactSeoTitleVi: "", contactSeoTitleEn: "",
        contactSeoDescVi:  "", contactSeoDescEn:  "",
    });

    useEffect(() => {
        axios.get("/api/settings").then(r => {
            if (!r.data.success) return;
            const d = r.data.data;
            setForm({
                contactBannerSubtitleVi: d.contactBannerSubtitleVi || "",
                contactBannerSubtitleEn: d.contactBannerSubtitleEn || "",
                contactBannerTitleVi:    d.contactBannerTitleVi    || "",
                contactBannerTitleEn:    d.contactBannerTitleEn    || "",
                contactSeoTitleVi: d.contactSeoTitleVi || "",
                contactSeoTitleEn: d.contactSeoTitleEn || "",
                contactSeoDescVi:  d.contactSeoDescVi  || "",
                contactSeoDescEn:  d.contactSeoDescEn  || "",
            });
        }).catch(() => {});
    }, []);

    const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        await onSave(form);
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const isVi = lang === "vi";

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-600">Văn bản trên banner đầu trang liên hệ</h3>
                <LangToggle lang={lang} setLang={setLang} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <SectionCard title={`Banner text (${lang.toUpperCase()})`}>
                    <Field label="Subtitle / Eyebrow" hint="Dòng nhỏ phía trên tiêu đề (màu xanh)">
                        <Input
                            value={isVi ? form.contactBannerSubtitleVi : form.contactBannerSubtitleEn}
                            onChange={set(isVi ? "contactBannerSubtitleVi" : "contactBannerSubtitleEn")}
                            placeholder={isVi ? "Kết nối & Tư vấn dịch vụ" : "Service Connection & Consulting"}
                        />
                    </Field>
                    <Field label="Tiêu đề chính" hint="Heading lớn trên banner">
                        <Input
                            value={isVi ? form.contactBannerTitleVi : form.contactBannerTitleEn}
                            onChange={set(isVi ? "contactBannerTitleVi" : "contactBannerTitleEn")}
                            placeholder={isVi ? "LIÊN HỆ VỚI CHÚNG TÔI" : "CONTACT US"}
                        />
                    </Field>
                </SectionCard>

                {/* Preview */}
                <div className="p-6 bg-gray-900 rounded-xl flex flex-col justify-center">
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-4 font-semibold">Preview</p>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="w-5 h-0.5 bg-teal-400 rounded" />
                        <span className="text-[10px] font-bold tracking-widest uppercase text-teal-400">
                            {(isVi ? form.contactBannerSubtitleVi : form.contactBannerSubtitleEn) || "Subtitle"}
                        </span>
                    </div>
                    <div className="text-white font-black text-2xl leading-tight">
                        {(() => {
                            const words = ((isVi ? form.contactBannerTitleVi : form.contactBannerTitleEn) || "TIÊU ĐỀ BANNER").split(" ");
                            return words.map((w, i) =>
                                i === words.length - 1
                                    ? <span key={i} className="text-teal-400">{w}</span>
                                    : <span key={i}>{w} </span>
                            );
                        })()}
                    </div>
                    <div className="w-10 h-0.5 bg-gradient-to-r from-teal-400 to-teal-300 rounded mt-4" />
                </div>
            </div>

            <SectionCard title={`SEO (${lang.toUpperCase()})`}>
                <Field label="Tiêu đề trang (SEO title)" hint="Hiển thị trên tab trình duyệt và kết quả tìm kiếm">
                    <Input
                        value={isVi ? form.contactSeoTitleVi : form.contactSeoTitleEn}
                        onChange={set(isVi ? "contactSeoTitleVi" : "contactSeoTitleEn")}
                        placeholder={isVi ? "Liên Hệ WON Media – Tư Vấn Nội Dung Số..." : "Contact WON Media – Digital Content..."}
                    />
                </Field>
                <Field label="Mô tả SEO" hint="Đoạn mô tả ngắn hiển thị trên kết quả tìm kiếm (150–160 ký tự)">
                    <Textarea
                        value={isVi ? form.contactSeoDescVi : form.contactSeoDescEn}
                        onChange={set(isVi ? "contactSeoDescVi" : "contactSeoDescEn")}
                        placeholder={isVi ? "Liên hệ WON Media để được tư vấn..." : "Contact WON Media for consultation..."}
                        rows={3}
                    />
                </Field>
            </SectionCard>

            <div className="flex justify-end"><SaveBtn saving={saving} saved={saved} /></div>
        </form>
    );
}

// ─── Tab: Info ────────────────────────────────────────────────────────────────
function InfoTab({ onSave }: { onSave: (f: Record<string, string>) => Promise<void> }) {
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [form, setForm] = useState({
        contactPhone:       "",
        contactEmail:       "",
        contactAddress:     "",
        contactAddressEn:   "",
        contactWorkingHours:"",
        contactMapUrl:      "",
    });

    useEffect(() => {
        axios.get("/api/settings").then(r => {
            if (!r.data.success) return;
            const d = r.data.data;
            setForm({
                contactPhone:        d.contactPhone        || "",
                contactEmail:        d.contactEmail        || "",
                contactAddress:      d.contactAddress      || "",
                contactAddressEn:    d.contactAddressEn    || "",
                contactWorkingHours: d.contactWorkingHours || "",
                contactMapUrl:       d.contactMapUrl       || "",
            });
        }).catch(() => {});
    }, []);

    const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        await onSave(form);
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <SectionCard title="Liên hệ & Giờ làm việc">
                    <Field label="Số điện thoại / Hotline">
                        <div className="relative">
                            <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="tel" value={form.contactPhone} onChange={e => set("contactPhone")(e.target.value)}
                                placeholder="0347835103"
                                className="w-full pl-9 pr-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400 transition-all" />
                        </div>
                    </Field>
                    <Field label="Email liên hệ">
                        <div className="relative">
                            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="email" value={form.contactEmail} onChange={e => set("contactEmail")(e.target.value)}
                                placeholder="contact@wonmusic.vn"
                                className="w-full pl-9 pr-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400 transition-all" />
                        </div>
                    </Field>
                    <Field label="Giờ làm việc" hint="Sidebar form liên hệ">
                        <Input value={form.contactWorkingHours} onChange={set("contactWorkingHours")}
                            placeholder="08:30 – 17:30 (Thứ 2 – Thứ 7)" />
                    </Field>
                </SectionCard>

                <SectionCard title="Địa chỉ">
                    <Field label="Tiếng Việt">
                        <Textarea value={form.contactAddress} onChange={set("contactAddress")}
                            placeholder="Tầng 2 tòa nhà Audi, số 8 đường Phạm Hùng..." rows={3} />
                    </Field>
                    <Field label="English">
                        <Textarea value={form.contactAddressEn} onChange={set("contactAddressEn")}
                            placeholder="2nd Floor, Audi Building, No. 8 Pham Hung Street..." rows={3} />
                    </Field>
                </SectionCard>

                <SectionCard title="Bản đồ">
                    <Field label="URL Google Maps hoặc embed src"
                        hint='Dùng "Chia sẻ > Nhúng bản đồ" để lấy src cho iframe.'>
                        <Textarea value={form.contactMapUrl} onChange={set("contactMapUrl")}
                            placeholder="https://www.google.com/maps/embed?pb=..." rows={5} />
                    </Field>
                    {form.contactMapUrl && (
                        <a href={form.contactMapUrl.includes("maps/embed") ? "#" : form.contactMapUrl}
                            target={form.contactMapUrl.includes("maps/embed") ? "_self" : "_blank"}
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:underline">
                            <ExternalLink size={12} />
                            {form.contactMapUrl.includes("maps/embed") ? "URL embed hợp lệ" : "Mở Google Maps"}
                        </a>
                    )}
                </SectionCard>
            </div>

            <div className="flex justify-end"><SaveBtn saving={saving} saved={saved} /></div>
        </form>
    );
}

// ─── Tab: Sections (headings) ─────────────────────────────────────────────────
function SectionsTab({ onSave }: { onSave: (f: Record<string, string>) => Promise<void> }) {
    const [lang, setLang] = useState<"vi" | "en">("vi");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [form, setForm] = useState({
        contactLocationLabelVi: "",     contactLocationLabelEn: "",
        contactLocationHeadingVi: "",   contactLocationHeadingEn: "",
        contactLocationHighlightVi: "", contactLocationHighlightEn: "",
        contactFormLabelVi: "",         contactFormLabelEn: "",
        contactFormHeadingVi: "",       contactFormHeadingEn: "",
        contactFormHighlightVi: "",     contactFormHighlightEn: "",
    });

    useEffect(() => {
        axios.get("/api/settings").then(r => {
            if (!r.data.success) return;
            const d = r.data.data;
            setForm({
                contactLocationLabelVi:     d.contactLocationLabelVi     || "",
                contactLocationLabelEn:     d.contactLocationLabelEn     || "",
                contactLocationHeadingVi:   d.contactLocationHeadingVi   || "",
                contactLocationHeadingEn:   d.contactLocationHeadingEn   || "",
                contactLocationHighlightVi: d.contactLocationHighlightVi || "",
                contactLocationHighlightEn: d.contactLocationHighlightEn || "",
                contactFormLabelVi:     d.contactFormLabelVi     || "",
                contactFormLabelEn:     d.contactFormLabelEn     || "",
                contactFormHeadingVi:   d.contactFormHeadingVi   || "",
                contactFormHeadingEn:   d.contactFormHeadingEn   || "",
                contactFormHighlightVi: d.contactFormHighlightVi || "",
                contactFormHighlightEn: d.contactFormHighlightEn || "",
            });
        }).catch(() => {});
    }, []);

    const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));
    const isVi = lang === "vi";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        await onSave(form);
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-600">Tiêu đề các section trên trang Liên hệ</h3>
                <LangToggle lang={lang} setLang={setLang} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <SectionCard title="Section: Địa chỉ & Bản đồ">
                    <Field label="Label / Eyebrow" hint={`Dòng nhỏ trên tiêu đề (vd: ${isVi ? "Văn phòng" : "Our Office"})`}>
                        <Input
                            value={isVi ? form.contactLocationLabelVi : form.contactLocationLabelEn}
                            onChange={set(isVi ? "contactLocationLabelVi" : "contactLocationLabelEn")}
                            placeholder={isVi ? "Văn phòng" : "Our Office"}
                        />
                    </Field>
                    <Field label="Heading" hint={`Phần trước highlight (vd: ${isVi ? "Địa chỉ" : "Find"})`}>
                        <Input
                            value={isVi ? form.contactLocationHeadingVi : form.contactLocationHeadingEn}
                            onChange={set(isVi ? "contactLocationHeadingVi" : "contactLocationHeadingEn")}
                            placeholder={isVi ? "Địa chỉ" : "Find"}
                        />
                    </Field>
                    <Field label="Highlight" hint={`Phần tô màu xanh (vd: ${isVi ? "của chúng tôi" : "our location"})`}>
                        <Input
                            value={isVi ? form.contactLocationHighlightVi : form.contactLocationHighlightEn}
                            onChange={set(isVi ? "contactLocationHighlightVi" : "contactLocationHighlightEn")}
                            placeholder={isVi ? "của chúng tôi" : "our location"}
                        />
                    </Field>
                </SectionCard>

                <SectionCard title="Section: Form liên hệ">
                    <Field label="Label / Eyebrow" hint={`Dòng nhỏ trên tiêu đề (vd: ${isVi ? "Liên hệ" : "Contact"})`}>
                        <Input
                            value={isVi ? form.contactFormLabelVi : form.contactFormLabelEn}
                            onChange={set(isVi ? "contactFormLabelVi" : "contactFormLabelEn")}
                            placeholder={isVi ? "Liên hệ" : "Contact"}
                        />
                    </Field>
                    <Field label="Heading" hint={`Phần trước highlight (vd: ${isVi ? "Gửi" : "Send us"})`}>
                        <Input
                            value={isVi ? form.contactFormHeadingVi : form.contactFormHeadingEn}
                            onChange={set(isVi ? "contactFormHeadingVi" : "contactFormHeadingEn")}
                            placeholder={isVi ? "Gửi" : "Send us"}
                        />
                    </Field>
                    <Field label="Highlight" hint={`Phần tô màu xanh (vd: ${isVi ? "tin nhắn cho chúng tôi" : "a message"})`}>
                        <Input
                            value={isVi ? form.contactFormHighlightVi : form.contactFormHighlightEn}
                            onChange={set(isVi ? "contactFormHighlightVi" : "contactFormHighlightEn")}
                            placeholder={isVi ? "tin nhắn cho chúng tôi" : "a message"}
                        />
                    </Field>
                </SectionCard>
            </div>

            <div className="flex justify-end"><SaveBtn saving={saving} saved={saved} /></div>
        </form>
    );
}

// ─── Tab: Form liên hệ ────────────────────────────────────────────────────────
function ContactFormTab() {
    const router = useRouter();
    return (
        <div className="space-y-4">
            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <MessageSquare size={18} className="text-amber-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-1">Cấu hình EmailJS</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            Form liên hệ sử dụng EmailJS để gửi email. Các key cấu hình được quản lý trong tab
                            <strong className="text-gray-700"> Email / SMTP</strong> của trang Cài đặt hệ thống.
                        </p>
                        <button
                            type="button"
                            onClick={() => router.push("/admin/settings?tab=email")}
                            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors cursor-pointer">
                            Đến Cài đặt Email
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Cần cấu hình</h3>
                <ul className="space-y-2.5">
                    {[
                        { label: "EmailJS Service ID", hint: "ID dịch vụ email (vd: service_xxxxxx)" },
                        { label: "EmailJS Template ID", hint: "ID template email (vd: template_xxxxxx)" },
                        { label: "EmailJS Public Key", hint: "Public key từ tài khoản EmailJS" },
                        { label: "Email nhận thư", hint: "Địa chỉ email nhận tin nhắn từ form" },
                    ].map(({ label, hint }) => (
                        <li key={label} className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                            <div>
                                <span className="text-sm font-semibold text-gray-700">{label}</span>
                                <p className="text-xs text-gray-400">{hint}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────
function AdminContactPageInner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const activeTab = (searchParams?.get("tab") as Tab) ?? "banner";
    const setActiveTab = (t: Tab) => router.replace(`?tab=${t}`, { scroll: false });

    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const showToast = (type: "success" | "error", msg: string) => {
        clearTimeout(toastTimer.current);
        setToast({ type, msg });
        toastTimer.current = setTimeout(() => setToast(null), 3500);
    };

    const handleSave = async (fields: Record<string, string>) => {
        try {
            const res = await axios.patch("/api/settings", fields);
            if (res.data.success) {
                useSettingsStore.getState().update(fields);
                showToast("success", "Đã lưu thay đổi!");
            } else showToast("error", res.data.message || "Lỗi khi lưu");
        } catch {
            showToast("error", "Lỗi kết nối server");
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center">
                    <Phone size={18} className="text-rose-600" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Quản lý trang Liên hệ</h1>
                    <p className="text-sm text-gray-500">Chỉnh nội dung banner, thông tin liên hệ và form gửi tin nhắn</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
                {TABS.map(({ key, label, Icon }) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setActiveTab(key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${activeTab === key ? "bg-white shadow text-indigo-600 font-semibold" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        <Icon size={14} />
                        {label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div>
                {activeTab === "banner"   && <BannerTab   onSave={handleSave} />}
                {activeTab === "info"     && <InfoTab     onSave={handleSave} />}
                {activeTab === "sections" && <SectionsTab onSave={handleSave} />}
                {activeTab === "form"     && <ContactFormTab />}
            </div>

            <Toast toast={toast} />
        </div>
    );
}

export default function AdminContactPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 size={24} className="animate-spin text-indigo-500" /></div>}>
            <AdminContactPageInner />
        </Suspense>
    );
}
