'use client';
import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { useSettingsStore } from "@/stores/useSettingsStore";
import {
    Home, Image as ImageIcon, Wrench, Users, BarChart2,
    Save, CheckCircle, AlertCircle, Loader2, Plus, Trash2,
} from "lucide-react";

// ─── types ───────────────────────────────────────────────────────────────────
type Tab = "slider" | "services" | "artists" | "charts";

const TABS: { key: Tab; label: string; Icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { key: "slider",   label: "Slider / Banner",  Icon: ImageIcon  },
    { key: "services", label: "Dịch vụ",           Icon: Wrench     },
    { key: "artists",  label: "Nghệ sĩ",           Icon: Users      },
    { key: "charts",   label: "Bảng xếp hạng",     Icon: BarChart2  },
];

interface ServiceItem { icon: string; title: string; desc: string; tag: string; accent: string }

const DEFAULT_SERVICES_VI: ServiceItem[] = [
    { icon: "🎵", title: "Phân phối nhạc số",   desc: "Phát hành âm nhạc lên 150+ nền tảng toàn cầu chỉ trong 24 giờ, giữ 100% bản quyền của bạn.",                                tag: "150+ Nền tảng",  accent: "#4ade80" },
    { icon: "🎤", title: "Quản lý nghệ sĩ",     desc: "Dịch vụ quản lý toàn diện — booking, PR, social media và phát triển thương hiệu nghệ sĩ.",                                  tag: "All-in-one",    accent: "#34d399" },
    { icon: "🎙️", title: "Studio thu âm",        desc: "Studio đạt chuẩn quốc tế với thiết bị hiện đại nhất và đội ngũ sound engineer chuyên nghiệp.",                              tag: "Chuẩn quốc tế", accent: "#6ee7b7" },
    { icon: "©️", title: "Bản quyền âm nhạc",   desc: "Bảo vệ tác phẩm với hệ thống quản lý bản quyền thông minh, theo dõi doanh thu 24/7.",                                       tag: "Bảo vệ 360°",   accent: "#4ade80" },
    { icon: "📊", title: "Phân tích dữ liệu",   desc: "Dashboard insights thời gian thực — lượt nghe, xu hướng và hành vi người nghe chi tiết.",                                    tag: "Real-time",     accent: "#34d399" },
    { icon: "🎬", title: "Sản xuất MV",          desc: "Ekíp sản xuất video âm nhạc chuyên nghiệp, từ concept đến thành phẩm hoàn chỉnh.",                                          tag: "Full package",  accent: "#6ee7b7" },
];

const DEFAULT_SERVICES_EN: ServiceItem[] = [
    { icon: "🎵", title: "Digital Distribution",  desc: "Release music on 150+ global platforms within 24 hours while keeping 100% of your rights.",                                tag: "150+ Platforms", accent: "#4ade80" },
    { icon: "🎤", title: "Artist Management",     desc: "Full management services — booking, PR, social media and artist brand development.",                                          tag: "All-in-one",    accent: "#34d399" },
    { icon: "🎙️", title: "Recording Studio",      desc: "International-standard studio with state-of-the-art equipment and a professional sound engineering team.",                  tag: "Intl. Standard",accent: "#6ee7b7" },
    { icon: "©️", title: "Music Copyright",       desc: "Protect your work with a smart copyright management system, tracking revenue 24/7.",                                        tag: "360° Protection",accent: "#4ade80" },
    { icon: "📊", title: "Data Analytics",        desc: "Real-time dashboard insights — plays, trends and detailed listener behaviour.",                                              tag: "Real-time",     accent: "#34d399" },
    { icon: "🎬", title: "MV Production",         desc: "Professional music video production team, from concept to finished product.",                                                tag: "Full package",  accent: "#6ee7b7" },
];

// ─── Slider form state ───────────────────────────────────────────────────────
interface SliderForm {
    sliderBoldLine: string;
    sliderSpotifyUrl: string;
    sliderSoundcloudUrl: string;
    sliderAppleUrl: string;
}

// ─── Services form state ─────────────────────────────────────────────────────
interface ServicesForm {
    homepageSvcLabelVi: string; homepageSvcHeadingVi: string;
    homepageSvcHighlightVi: string; homepageSvcDescVi: string;
    homepageSvcLabelEn: string; homepageSvcHeadingEn: string;
    homepageSvcHighlightEn: string; homepageSvcDescEn: string;
    servicesVi: ServiceItem[];
    servicesEn: ServiceItem[];
}

// ─── Heading form state ──────────────────────────────────────────────────────
interface HeadingForm {
    headingVi: string; highlightVi: string;
    headingEn: string; highlightEn: string;
}

// ─── Charts form state ───────────────────────────────────────────────────────
interface ChartsForm {
    headingVi: string; highlightVi: string;
    headingEn: string; highlightEn: string;
    limitDay: number; limitWeek: number; limitMonth: number;
}

// ─── UI helpers ──────────────────────────────────────────────────────────────
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

function Textarea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
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
        <button type="submit"
            disabled={saving}
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

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toast }: { toast: { type: "success" | "error"; msg: string } | null }) {
    if (!toast) return null;
    return (
        <div className={`fixed bottom-6 right-6 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl z-50 text-sm font-semibold animate-in slide-in-from-bottom-4 duration-300 ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
            {toast.type === "success" ? <CheckCircle size={17} /> : <AlertCircle size={17} />}
            {toast.msg}
        </div>
    );
}

// ─── Tab: Slider ─────────────────────────────────────────────────────────────
function SliderTab({ onSave }: { onSave: (fields: Record<string, string | number>) => Promise<void> }) {
    const [form, setForm] = useState<SliderForm>({ sliderBoldLine: "", sliderSpotifyUrl: "", sliderSoundcloudUrl: "", sliderAppleUrl: "" });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        axios.get("/api/settings").then(r => {
            if (r.data.success) {
                const d = r.data.data;
                setForm({
                    sliderBoldLine: d.sliderBoldLine || "TO US DAILY",
                    sliderSpotifyUrl: d.sliderSpotifyUrl || "",
                    sliderSoundcloudUrl: d.sliderSoundcloudUrl || "",
                    sliderAppleUrl: d.sliderAppleUrl || "",
                });
            }
        }).catch(() => {});
    }, []);

    const set = (k: keyof SliderForm) => (v: string) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        await onSave({ ...form });
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <SectionCard title="Văn bản chính">
                <div className="max-w-lg">
                    <Field label="Dòng chữ đậm" hint='Dòng chữ nổi bật trong hero section. Hiện tại: "TO US DAILY"'>
                        <Input value={form.sliderBoldLine} onChange={set("sliderBoldLine")} placeholder="TO US DAILY" />
                    </Field>
                </div>
            </SectionCard>
            <SectionCard title="Nút nền tảng nghe nhạc">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field label="URL Spotify">
                        <Input value={form.sliderSpotifyUrl} onChange={set("sliderSpotifyUrl")} placeholder="https://open.spotify.com/..." />
                    </Field>
                    <Field label="URL SoundCloud">
                        <Input value={form.sliderSoundcloudUrl} onChange={set("sliderSoundcloudUrl")} placeholder="https://soundcloud.com/..." />
                    </Field>
                    <Field label="URL Apple Music">
                        <Input value={form.sliderAppleUrl} onChange={set("sliderAppleUrl")} placeholder="https://music.apple.com/..." />
                    </Field>
                </div>
            </SectionCard>
            <div className="flex justify-end">
                <SaveBtn saving={saving} saved={saved} />
            </div>
        </form>
    );
}

// ─── Tab: Services ────────────────────────────────────────────────────────────
function ServicesTab({ onSave }: { onSave: (fields: Record<string, string | number>) => Promise<void> }) {
    const [lang, setLang] = useState<"vi" | "en">("vi");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [form, setForm] = useState<ServicesForm>({
        homepageSvcLabelVi: "Dịch vụ", homepageSvcHeadingVi: "Giải pháp âm nhạc",
        homepageSvcHighlightVi: "toàn diện", homepageSvcDescVi: "",
        homepageSvcLabelEn: "Services", homepageSvcHeadingEn: "Complete Music",
        homepageSvcHighlightEn: "Solutions", homepageSvcDescEn: "",
        servicesVi: DEFAULT_SERVICES_VI,
        servicesEn: DEFAULT_SERVICES_EN,
    });

    useEffect(() => {
        axios.get("/api/settings").then(r => {
            if (!r.data.success) return;
            const d = r.data.data;
            let svi = DEFAULT_SERVICES_VI;
            let sen = DEFAULT_SERVICES_EN;
            try { if (d.homepageServicesVi) svi = JSON.parse(d.homepageServicesVi); } catch {}
            try { if (d.homepageServicesEn) sen = JSON.parse(d.homepageServicesEn); } catch {}
            setForm({
                homepageSvcLabelVi: d.homepageSvcLabelVi || "Dịch vụ",
                homepageSvcHeadingVi: d.homepageSvcHeadingVi || "Giải pháp âm nhạc",
                homepageSvcHighlightVi: d.homepageSvcHighlightVi || "toàn diện",
                homepageSvcDescVi: d.homepageSvcDescVi || "",
                homepageSvcLabelEn: d.homepageSvcLabelEn || "Services",
                homepageSvcHeadingEn: d.homepageSvcHeadingEn || "Complete Music",
                homepageSvcHighlightEn: d.homepageSvcHighlightEn || "Solutions",
                homepageSvcDescEn: d.homepageSvcDescEn || "",
                servicesVi: svi,
                servicesEn: sen,
            });
        }).catch(() => {});
    }, []);

    const setMeta = (k: keyof Omit<ServicesForm, "servicesVi" | "servicesEn">) => (v: string) => setForm(f => ({ ...f, [k]: v }));

    const setServiceField = (idx: number, field: keyof ServiceItem, value: string) => {
        const key = lang === "vi" ? "servicesVi" : "servicesEn";
        setForm(f => {
            const items = [...f[key]];
            items[idx] = { ...items[idx], [field]: value };
            return { ...f, [key]: items };
        });
    };

    const addService = () => {
        const key = lang === "vi" ? "servicesVi" : "servicesEn";
        setForm(f => ({ ...f, [key]: [...f[key], { icon: "🎵", title: "", desc: "", tag: "", accent: "#4ade80" }] }));
    };

    const removeService = (idx: number) => {
        const key = lang === "vi" ? "servicesVi" : "servicesEn";
        setForm(f => ({ ...f, [key]: f[key].filter((_, i) => i !== idx) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        await onSave({
            homepageSvcLabelVi: form.homepageSvcLabelVi,
            homepageSvcHeadingVi: form.homepageSvcHeadingVi,
            homepageSvcHighlightVi: form.homepageSvcHighlightVi,
            homepageSvcDescVi: form.homepageSvcDescVi,
            homepageSvcLabelEn: form.homepageSvcLabelEn,
            homepageSvcHeadingEn: form.homepageSvcHeadingEn,
            homepageSvcHighlightEn: form.homepageSvcHighlightEn,
            homepageSvcDescEn: form.homepageSvcDescEn,
            homepageServicesVi: JSON.stringify(form.servicesVi),
            homepageServicesEn: JSON.stringify(form.servicesEn),
        });
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const isVi = lang === "vi";
    const services = isVi ? form.servicesVi : form.servicesEn;

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-600">Nội dung section</h3>
                <LangToggle lang={lang} setLang={setLang} />
            </div>

            <SectionCard title={`Tiêu đề section (${lang.toUpperCase()})`}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Field label="Label">
                        <Input
                            value={isVi ? form.homepageSvcLabelVi : form.homepageSvcLabelEn}
                            onChange={setMeta(isVi ? "homepageSvcLabelVi" : "homepageSvcLabelEn")}
                            placeholder={isVi ? "Dịch vụ" : "Services"}
                        />
                    </Field>
                    <Field label="Highlight">
                        <Input
                            value={isVi ? form.homepageSvcHighlightVi : form.homepageSvcHighlightEn}
                            onChange={setMeta(isVi ? "homepageSvcHighlightVi" : "homepageSvcHighlightEn")}
                            placeholder={isVi ? "toàn diện" : "Solutions"}
                        />
                    </Field>
                    <Field label="Heading" hint="Phần đầu của tiêu đề lớn">
                        <Input
                            value={isVi ? form.homepageSvcHeadingVi : form.homepageSvcHeadingEn}
                            onChange={setMeta(isVi ? "homepageSvcHeadingVi" : "homepageSvcHeadingEn")}
                            placeholder={isVi ? "Giải pháp âm nhạc" : "Complete Music"}
                        />
                    </Field>
                </div>
                <Field label="Mô tả">
                    <Textarea
                        value={isVi ? form.homepageSvcDescVi : form.homepageSvcDescEn}
                        onChange={setMeta(isVi ? "homepageSvcDescVi" : "homepageSvcDescEn")}
                        placeholder={isVi ? "Chúng tôi cung cấp..." : "We provide..."}
                        rows={2}
                    />
                </Field>
            </SectionCard>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                        Danh sách dịch vụ ({lang.toUpperCase()})
                    </h3>
                    <button type="button" onClick={addService}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 transition-colors cursor-pointer">
                        <Plus size={12} /> Thêm dịch vụ
                    </button>
                </div>
                {services.map((svc, idx) => (
                    <div key={idx} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Dịch vụ {idx + 1}</span>
                            <button type="button" onClick={() => removeService(idx)}
                                className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer">
                                <Trash2 size={13} />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <Field label="Icon (emoji)">
                                <Input value={svc.icon} onChange={v => setServiceField(idx, "icon", v)} placeholder="🎵" />
                            </Field>
                            <Field label="Tag">
                                <Input value={svc.tag} onChange={v => setServiceField(idx, "tag", v)} placeholder="150+ Nền tảng" />
                            </Field>
                            <Field label="Tiêu đề">
                                <Input value={svc.title} onChange={v => setServiceField(idx, "title", v)} placeholder="Phân phối nhạc số" />
                            </Field>
                            <Field label="Màu accent (hex)">
                                <div className="flex gap-2">
                                    <Input value={svc.accent} onChange={v => setServiceField(idx, "accent", v)} placeholder="#4ade80" />
                                    <input type="color" value={svc.accent} onChange={e => setServiceField(idx, "accent", e.target.value)}
                                        className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer flex-shrink-0 p-0.5" />
                                </div>
                            </Field>
                            <div className="col-span-2 md:col-span-4">
                                <Field label="Mô tả">
                                    <Textarea value={svc.desc} onChange={v => setServiceField(idx, "desc", v)} placeholder="Mô tả ngắn..." rows={2} />
                                </Field>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-end">
                <SaveBtn saving={saving} saved={saved} />
            </div>
        </form>
    );
}

// ─── Tab: Artists heading ─────────────────────────────────────────────────────
function ArtistsTab({ onSave }: { onSave: (fields: Record<string, string | number>) => Promise<void> }) {
    const [lang, setLang] = useState<"vi" | "en">("vi");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [form, setForm] = useState<HeadingForm>({
        headingVi: "Nghệ sĩ", highlightVi: "nổi bật",
        headingEn: "Featured", highlightEn: "Artists",
    });

    useEffect(() => {
        axios.get("/api/settings").then(r => {
            if (!r.data.success) return;
            const d = r.data.data;
            setForm({
                headingVi: d.artistsHeadingVi || "Nghệ sĩ",
                highlightVi: d.artistsHighlightVi || "nổi bật",
                headingEn: d.artistsHeadingEn || "Featured",
                highlightEn: d.artistsHighlightEn || "Artists",
            });
        }).catch(() => {});
    }, []);

    const set = (k: keyof HeadingForm) => (v: string) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        await onSave({
            artistsHeadingVi: form.headingVi, artistsHighlightVi: form.highlightVi,
            artistsHeadingEn: form.headingEn, artistsHighlightEn: form.highlightEn,
        });
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const isVi = lang === "vi";

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-600">Tiêu đề section nghệ sĩ</h3>
                <LangToggle lang={lang} setLang={setLang} />
            </div>
            <SectionCard title={`Tiêu đề (${lang.toUpperCase()})`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Heading" hint="Phần đầu của tiêu đề lớn">
                        <Input
                            value={isVi ? form.headingVi : form.headingEn}
                            onChange={set(isVi ? "headingVi" : "headingEn")}
                            placeholder={isVi ? "Nghệ sĩ" : "Featured"}
                        />
                    </Field>
                    <Field label="Highlight" hint="Phần được tô màu xanh (viết tiếp sau Heading)">
                        <Input
                            value={isVi ? form.highlightVi : form.highlightEn}
                            onChange={set(isVi ? "highlightVi" : "highlightEn")}
                            placeholder={isVi ? "nổi bật" : "Artists"}
                        />
                    </Field>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                    Preview: <span className="font-semibold text-gray-800">
                        {isVi ? form.headingVi : form.headingEn}{" "}
                    </span>
                    <span className="font-semibold text-indigo-600">
                        {isVi ? form.highlightVi : form.highlightEn}
                    </span>
                </div>
            </SectionCard>
            <div className="flex justify-end">
                <SaveBtn saving={saving} saved={saved} />
            </div>
        </form>
    );
}

// ─── Tab: Charts heading ──────────────────────────────────────────────────────
function ChartsTab({ onSave }: { onSave: (fields: Record<string, string | number>) => Promise<void> }) {
    const [lang, setLang] = useState<"vi" | "en">("vi");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [form, setForm] = useState<ChartsForm>({
        headingVi: "nhạc hot", highlightVi: "Top",
        headingEn: "Hot Music", highlightEn: "Top",
        limitDay: 5, limitWeek: 8, limitMonth: 6,
    });

    useEffect(() => {
        axios.get("/api/settings").then(r => {
            if (!r.data.success) return;
            const d = r.data.data;
            setForm({
                headingVi:   d.chartsHeadingVi   || "nhạc hot",
                highlightVi: d.chartsHighlightVi || "Top",
                headingEn:   d.chartsHeadingEn   || "Hot Music",
                highlightEn: d.chartsHighlightEn || "Top",
                limitDay:    d.chartsLimitDay   ?? 5,
                limitWeek:   d.chartsLimitWeek  ?? 8,
                limitMonth:  d.chartsLimitMonth ?? 6,
            });
        }).catch(() => {});
    }, []);

    const setStr = (k: "headingVi" | "highlightVi" | "headingEn" | "highlightEn") => (v: string) =>
        setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        await onSave({
            chartsHeadingVi:  form.headingVi,   chartsHighlightVi: form.highlightVi,
            chartsHeadingEn:  form.headingEn,   chartsHighlightEn: form.highlightEn,
            chartsLimitDay:   form.limitDay,
            chartsLimitWeek:  form.limitWeek,
            chartsLimitMonth: form.limitMonth,
        });
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const isVi = lang === "vi";

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-600">Tiêu đề section bảng xếp hạng</h3>
                <LangToggle lang={lang} setLang={setLang} />
            </div>
            <SectionCard title={`Tiêu đề (${lang.toUpperCase()})`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Highlight" hint="Phần được tô màu (thường đứng trước)">
                        <Input
                            value={isVi ? form.highlightVi : form.highlightEn}
                            onChange={setStr(isVi ? "highlightVi" : "highlightEn")}
                            placeholder="Top"
                        />
                    </Field>
                    <Field label="Heading" hint="Phần tiếp theo của tiêu đề">
                        <Input
                            value={isVi ? form.headingVi : form.headingEn}
                            onChange={setStr(isVi ? "headingVi" : "headingEn")}
                            placeholder={isVi ? "nhạc hot" : "Hot Music"}
                        />
                    </Field>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                    Preview: <span className="font-semibold text-indigo-600">
                        {isVi ? form.highlightVi : form.highlightEn}{" "}
                    </span>
                    <span className="font-semibold text-gray-800">
                        {isVi ? form.headingVi : form.headingEn}
                    </span>
                </div>
            </SectionCard>

            <SectionCard title="Giới hạn số bài hiển thị">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field label="Hôm nay" hint="Số bài — Tab Hôm nay">
                        <input type="number" min={1} max={50} value={form.limitDay}
                            onChange={e => setForm(f => ({ ...f, limitDay: +e.target.value }))}
                            className={inputCls} />
                    </Field>
                    <Field label="Tuần này" hint="Số bài — Tab Tuần này">
                        <input type="number" min={1} max={50} value={form.limitWeek}
                            onChange={e => setForm(f => ({ ...f, limitWeek: +e.target.value }))}
                            className={inputCls} />
                    </Field>
                    <Field label="Tháng này" hint="Số bài — Tab Tháng này">
                        <input type="number" min={1} max={50} value={form.limitMonth}
                            onChange={e => setForm(f => ({ ...f, limitMonth: +e.target.value }))}
                            className={inputCls} />
                    </Field>
                </div>
            </SectionCard>

            <div className="flex justify-end">
                <SaveBtn saving={saving} saved={saved} />
            </div>
        </form>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────
function AdminHomepagePageInner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const activeTab = (searchParams?.get("tab") as Tab) ?? "slider";
    const setActiveTab = (t: Tab) => router.replace(`?tab=${t}`, { scroll: false });

    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const showToast = (type: "success" | "error", msg: string) => {
        clearTimeout(toastTimer.current);
        setToast({ type, msg });
        toastTimer.current = setTimeout(() => setToast(null), 3500);
    };

    const handleSave = async (fields: Record<string, string | number>) => {
        try {
            const res = await axios.patch("/api/settings", fields);
            if (res.data.success) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                useSettingsStore.getState().update(fields as any);
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
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <Home size={18} className="text-indigo-600" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Quản lý trang chủ</h1>
                    <p className="text-sm text-gray-500">Chỉnh nội dung từng section của trang chủ</p>
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
                {activeTab === "slider"   && <SliderTab onSave={handleSave} />}
                {activeTab === "services" && <ServicesTab onSave={handleSave} />}
                {activeTab === "artists"  && <ArtistsTab onSave={handleSave} />}
                {activeTab === "charts"   && <ChartsTab onSave={handleSave} />}
            </div>

            <Toast toast={toast} />
        </div>
    );
}

export default function AdminHomepagePage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 size={24} className="animate-spin text-indigo-500" /></div>}>
            <AdminHomepagePageInner />
        </Suspense>
    );
}
