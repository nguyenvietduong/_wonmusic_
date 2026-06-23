'use client';
import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { useSettingsStore } from "@/stores/useSettingsStore";
import {
    Info, Image as ImageIcon, BarChart2, BookOpen, Users, Megaphone, Wrench,
    Save, CheckCircle, AlertCircle, Loader2, Plus, Trash2,
} from "lucide-react";

// ─── types ────────────────────────────────────────────────────────────────────
type Tab = "hero" | "stats" | "mission" | "services" | "team" | "cta";

const TABS: { key: Tab; label: string; Icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { key: "hero",     label: "Hero / Banner", Icon: ImageIcon  },
    { key: "stats",    label: "Thống kê",      Icon: BarChart2  },
    { key: "mission",  label: "Mission",        Icon: BookOpen   },
    { key: "services", label: "Dịch vụ",        Icon: Wrench     },
    { key: "team",     label: "Đội ngũ",        Icon: Users      },
    { key: "cta",      label: "CTA",            Icon: Megaphone  },
];

interface StatItem { value: string; label: string; icon: string }
interface TeamMember { name: string; role: string; initials: string }
interface ServiceItem { icon: string; title: string; desc: string }

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

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
    return <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />;
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

// ─── shared save hook ─────────────────────────────────────────────────────────
function useSave(onSave: (fields: Record<string, string>) => Promise<void>) {
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const submit = async (fields: Record<string, string>) => {
        setSaving(true);
        await onSave(fields);
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };
    return { saving, saved, submit };
}

// ─── Tab: Hero ────────────────────────────────────────────────────────────────
function HeroTab({ onSave, data }: { onSave: (f: Record<string, string>) => Promise<void>; data: Record<string, string> }) {
    const [lang, setLang] = useState<"vi" | "en">("vi");
    const [subtitleVi, setSubtitleVi] = useState(data.aboutHeroSubtitle || "");
    const [subtitleEn, setSubtitleEn] = useState(data.aboutHeroSubtitleEn || "");
    const { saving, saved, submit } = useSave(onSave);

    useEffect(() => {
        setSubtitleVi(data.aboutHeroSubtitle || "");
        setSubtitleEn(data.aboutHeroSubtitleEn || "");
    }, [data]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        submit({ aboutHeroSubtitle: subtitleVi, aboutHeroSubtitleEn: subtitleEn });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-600">Mô tả ngắn dưới tiêu đề banner</h3>
                <LangToggle lang={lang} setLang={setLang} />
            </div>
            <SectionCard title={`Subtitle (${lang.toUpperCase()})`}>
                <Field label={lang === "vi" ? "Mô tả (Tiếng Việt)" : "Description (English)"}
                    hint="Hiển thị ngay dưới tiêu đề hero trên trang Giới thiệu">
                    <Textarea
                        rows={3}
                        value={lang === "vi" ? subtitleVi : subtitleEn}
                        onChange={v => lang === "vi" ? setSubtitleVi(v) : setSubtitleEn(v)}
                        placeholder={lang === "vi"
                            ? "Won Music là nền tảng âm nhạc số hàng đầu Việt Nam..."
                            : "Won Music is Vietnam's leading digital music platform..."}
                    />
                </Field>
                {(lang === "vi" ? subtitleVi : subtitleEn) && (
                    <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 leading-relaxed italic">
                        "{lang === "vi" ? subtitleVi : subtitleEn}"
                    </div>
                )}
            </SectionCard>
            <div className="flex justify-end"><SaveBtn saving={saving} saved={saved} /></div>
        </form>
    );
}

const DEFAULT_STATS: StatItem[] = [
    { value: "500+",  label: "Nghệ sĩ hợp tác",    icon: "🎤" },
    { value: "10M+",  label: "Lượt nghe mỗi tháng", icon: "🎧" },
    { value: "5000+", label: "Bài hát phát hành",    icon: "🎵" },
    { value: "50+",   label: "Giải thưởng âm nhạc",  icon: "🏆" },
];

// ─── Tab: Stats ───────────────────────────────────────────────────────────────
function StatsTab({ onSave, data }: { onSave: (f: Record<string, string>) => Promise<void>; data: Record<string, string> }) {
    const parseStats = (d: Record<string, string>) => {
        try { return d.aboutStats ? JSON.parse(d.aboutStats) : DEFAULT_STATS; } catch { return DEFAULT_STATS; }
    };
    const [stats, setStats] = useState<StatItem[]>(() => parseStats(data));
    const { saving, saved, submit } = useSave(onSave);

    useEffect(() => { setStats(parseStats(data)); }, [data]);

    const setField = (idx: number, field: keyof StatItem, value: string) =>
        setStats(s => s.map((item, i) => i === idx ? { ...item, [field]: value } : item));

    const addStat = () => setStats(s => [...s, { value: "", label: "", icon: "⭐" }]);
    const removeStat = (idx: number) => setStats(s => s.filter((_, i) => i !== idx));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        submit({ aboutStats: JSON.stringify(stats) });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Số liệu nổi bật (hiển thị dưới banner)</h3>
                <button type="button" onClick={addStat}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 transition-colors cursor-pointer">
                    <Plus size={12} /> Thêm
                </button>
            </div>
            {stats.map((stat, idx) => (
                <div key={idx} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Số liệu {idx + 1}</span>
                        <button type="button" onClick={() => removeStat(idx)}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer">
                            <Trash2 size={13} />
                        </button>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                        <Field label="Icon (emoji)">
                            <Input value={stat.icon} onChange={v => setField(idx, "icon", v)} placeholder="🎤" />
                        </Field>
                        <Field label="Giá trị">
                            <Input value={stat.value} onChange={v => setField(idx, "value", v)} placeholder="500+" />
                        </Field>
                        <div className="col-span-1 md:col-span-3">
                            <Field label="Nhãn">
                                <Input value={stat.label} onChange={v => setField(idx, "label", v)} placeholder="Nghệ sĩ hợp tác" />
                            </Field>
                        </div>
                    </div>
                    {/* Preview card */}
                    <div className="mt-3 p-3 bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 rounded-lg flex items-center gap-3">
                        <span className="text-2xl">{stat.icon || "⭐"}</span>
                        <div>
                            <div className="text-lg font-bold text-teal-700">{stat.value || "—"}</div>
                            <div className="text-xs text-gray-500">{stat.label || "Nhãn"}</div>
                        </div>
                    </div>
                </div>
            ))}
            <div className="flex justify-end"><SaveBtn saving={saving} saved={saved} /></div>
        </form>
    );
}

// ─── Tab: Mission ─────────────────────────────────────────────────────────────
function MissionTab({ onSave, data }: { onSave: (f: Record<string, string>) => Promise<void>; data: Record<string, string> }) {
    const [lang, setLang] = useState<"vi" | "en">("vi");
    const [headingVi,   setHeadingVi]   = useState(data.aboutMissionHeadingVi   || "");
    const [highlightVi, setHighlightVi] = useState(data.aboutMissionHighlightVi || "");
    const [headingEn,   setHeadingEn]   = useState(data.aboutMissionHeadingEn   || "");
    const [highlightEn, setHighlightEn] = useState(data.aboutMissionHighlightEn || "");
    const [p1Vi, setP1Vi] = useState(data.aboutMissionP1   || "");
    const [p2Vi, setP2Vi] = useState(data.aboutMissionP2   || "");
    const [p1En, setP1En] = useState(data.aboutMissionP1En || "");
    const [p2En, setP2En] = useState(data.aboutMissionP2En || "");
    const { saving, saved, submit } = useSave(onSave);

    useEffect(() => {
        setHeadingVi(data.aboutMissionHeadingVi || "");
        setHighlightVi(data.aboutMissionHighlightVi || "");
        setHeadingEn(data.aboutMissionHeadingEn || "");
        setHighlightEn(data.aboutMissionHighlightEn || "");
        setP1Vi(data.aboutMissionP1 || "");
        setP2Vi(data.aboutMissionP2 || "");
        setP1En(data.aboutMissionP1En || "");
        setP2En(data.aboutMissionP2En || "");
    }, [data]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        submit({
            aboutMissionHeadingVi: headingVi, aboutMissionHighlightVi: highlightVi,
            aboutMissionHeadingEn: headingEn, aboutMissionHighlightEn: highlightEn,
            aboutMissionP1: p1Vi, aboutMissionP2: p2Vi,
            aboutMissionP1En: p1En, aboutMissionP2En: p2En,
        });
    };

    const isVi = lang === "vi";

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-600">Phần Mission</h3>
                <LangToggle lang={lang} setLang={setLang} />
            </div>
            <SectionCard title={`Tiêu đề (${lang.toUpperCase()})`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Heading" hint='Phần đầu tiêu đề (VD: "Nâng tầm âm nhạc")'>
                        <Input
                            value={isVi ? headingVi : headingEn}
                            onChange={v => isVi ? setHeadingVi(v) : setHeadingEn(v)}
                            placeholder={isVi ? "Nâng tầm âm nhạc" : "Elevating Vietnamese"}
                        />
                    </Field>
                    <Field label="Highlight" hint='Phần tô màu xanh (VD: "Việt Nam")'>
                        <Input
                            value={isVi ? highlightVi : highlightEn}
                            onChange={v => isVi ? setHighlightVi(v) : setHighlightEn(v)}
                            placeholder={isVi ? "Việt Nam" : "Music"}
                        />
                    </Field>
                </div>
                {(isVi ? headingVi : headingEn) && (
                    <div className="p-3 bg-gray-50 rounded-lg text-sm">
                        Preview: <span className="font-bold text-gray-800">{isVi ? headingVi : headingEn} </span>
                        <span className="font-bold text-teal-600">{isVi ? highlightVi : highlightEn}</span>
                    </div>
                )}
            </SectionCard>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <SectionCard title={`Đoạn văn 1 (${lang.toUpperCase()})`}>
                    <Field label="Nội dung" hint="Viền xanh lá bên trái">
                        <Textarea
                            rows={5}
                            value={isVi ? p1Vi : p1En}
                            onChange={v => isVi ? setP1Vi(v) : setP1En(v)}
                            placeholder={isVi ? "Won Music ra đời với sứ mệnh..." : "Won Music was founded with the mission..."}
                        />
                    </Field>
                </SectionCard>
                <SectionCard title={`Đoạn văn 2 (${lang.toUpperCase()})`}>
                    <Field label="Nội dung" hint="Viền tím bên trái">
                        <Textarea
                            rows={5}
                            value={isVi ? p2Vi : p2En}
                            onChange={v => isVi ? setP2Vi(v) : setP2En(v)}
                            placeholder={isVi ? "Chúng tôi tin rằng mỗi giai điệu..." : "We believe that every melody..."}
                        />
                    </Field>
                </SectionCard>
            </div>
            <div className="flex justify-end"><SaveBtn saving={saving} saved={saved} /></div>
        </form>
    );
}

// ─── Tab: Services (About page) ──────────────────────────────────────────────
const DEFAULT_ABOUT_SERVICES_VI: ServiceItem[] = [
    { icon: "🎼", title: "Phát hành âm nhạc",    desc: "Hỗ trợ nghệ sĩ phát hành nhạc trên toàn bộ nền tảng streaming quốc tế." },
    { icon: "⚖️", title: "Bảo vệ bản quyền",     desc: "Hệ thống bảo vệ bản quyền âm nhạc tiên tiến trên mọi nền tảng số." },
    { icon: "🎙️", title: "Sản xuất âm nhạc",     desc: "Studio thu âm chuyên nghiệp, đồng hành từ ý tưởng đến thành phẩm." },
    { icon: "📊", title: "Phân phối kỹ thuật số", desc: "Tối ưu doanh thu và tiếp cận hàng triệu người nghe toàn thế giới." },
    { icon: "🌐", title: "Quảng bá nghệ sĩ",      desc: "Chiến lược marketing toàn diện, xây dựng thương hiệu nghệ sĩ." },
    { icon: "🤝", title: "Kết nối hợp tác",        desc: "Cầu nối nghệ sĩ với nhãn hàng, sự kiện và truyền thông." },
];
const DEFAULT_ABOUT_SERVICES_EN: ServiceItem[] = [
    { icon: "🎼", title: "Music Release",          desc: "Supporting artists to release music on all international streaming platforms." },
    { icon: "⚖️", title: "Copyright Protection",   desc: "Advanced music copyright protection system across all digital platforms." },
    { icon: "🎙️", title: "Music Production",       desc: "Professional recording studio, from concept to final product." },
    { icon: "📊", title: "Digital Distribution",   desc: "Optimizing revenue and reaching millions of listeners worldwide." },
    { icon: "🌐", title: "Artist Promotion",        desc: "Comprehensive marketing strategy and brand building for artists." },
    { icon: "🤝", title: "Partnership Connections", desc: "Bridging artists with brands, events and media opportunities." },
];

function ServicesTab({ onSave, data }: { onSave: (f: Record<string, string>) => Promise<void>; data: Record<string, string> }) {
    const [lang, setLang] = useState<"vi" | "en">("vi");
    const parseServices = (raw: string, fallback: ServiceItem[]) => { try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } };
    const [servicesVi, setServicesVi] = useState<ServiceItem[]>(() => parseServices(data.aboutServicesVi, DEFAULT_ABOUT_SERVICES_VI));
    const [servicesEn, setServicesEn] = useState<ServiceItem[]>(() => parseServices(data.aboutServicesEn, DEFAULT_ABOUT_SERVICES_EN));
    const { saving, saved, submit } = useSave(onSave);

    useEffect(() => {
        setServicesVi(parseServices(data.aboutServicesVi, DEFAULT_ABOUT_SERVICES_VI));
        setServicesEn(parseServices(data.aboutServicesEn, DEFAULT_ABOUT_SERVICES_EN));
    }, [data]);

    const services = lang === "vi" ? servicesVi : servicesEn;
    const setServices = lang === "vi" ? setServicesVi : setServicesEn;

    const setField = (idx: number, field: keyof ServiceItem, value: string) =>
        setServices(s => s.map((item, i) => i === idx ? { ...item, [field]: value } : item));

    const addService  = () => setServices(s => [...s, { icon: "🎵", title: "", desc: "" }]);
    const removeService = (idx: number) => setServices(s => s.filter((_, i) => i !== idx));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        submit({ aboutServicesVi: JSON.stringify(servicesVi), aboutServicesEn: JSON.stringify(servicesEn) });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Danh sách dịch vụ trang Giới thiệu</h3>
                <div className="flex items-center gap-3">
                    <LangToggle lang={lang} setLang={setLang} />
                    <button type="button" onClick={addService}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 transition-colors cursor-pointer">
                        <Plus size={12} /> Thêm
                    </button>
                </div>
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
                            <Input value={svc.icon} onChange={v => setField(idx, "icon", v)} placeholder="🎼" />
                        </Field>
                        <div className="md:col-span-3">
                            <Field label="Tiêu đề">
                                <Input value={svc.title} onChange={v => setField(idx, "title", v)} placeholder="Phát hành âm nhạc" />
                            </Field>
                        </div>
                        <div className="col-span-2 md:col-span-4">
                            <Field label="Mô tả">
                                <Textarea value={svc.desc} onChange={v => setField(idx, "desc", v)} placeholder="Mô tả ngắn..." rows={2} />
                            </Field>
                        </div>
                    </div>
                </div>
            ))}
            <div className="flex justify-end"><SaveBtn saving={saving} saved={saved} /></div>
        </form>
    );
}

// ─── Tab: Team ────────────────────────────────────────────────────────────────
function TeamTab({ onSave, data }: { onSave: (f: Record<string, string>) => Promise<void>; data: Record<string, string> }) {
    const parseMembers = (d: Record<string, string>) => { try { return d.aboutTeam ? JSON.parse(d.aboutTeam) : []; } catch { return []; } };
    const [members, setMembers] = useState<TeamMember[]>(() => parseMembers(data));
    const { saving, saved, submit } = useSave(onSave);

    useEffect(() => { setMembers(parseMembers(data)); }, [data]);

    const setField = (idx: number, field: keyof TeamMember, value: string) =>
        setMembers(m => m.map((item, i) => i === idx ? { ...item, [field]: value } : item));

    const addMember = () => setMembers(m => [...m, { name: "", role: "", initials: "" }]);
    const removeMember = (idx: number) => setMembers(m => m.filter((_, i) => i !== idx));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        submit({ aboutTeam: JSON.stringify(members) });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Thành viên đội ngũ</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Section đội ngũ chỉ hiển thị khi có ít nhất 1 thành viên</p>
                </div>
                <button type="button" onClick={addMember}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 transition-colors cursor-pointer">
                    <Plus size={12} /> Thêm thành viên
                </button>
            </div>

            {members.length === 0 && (
                <div className="text-center py-10 bg-white border border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
                    Chưa có thành viên nào. Nhấn "Thêm thành viên" để bắt đầu.
                </div>
            )}

            {members.map((member, idx) => (
                <div key={idx} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-teal-100 flex items-center justify-center text-sm font-bold text-indigo-600">
                                {member.initials || member.name.slice(0, 2).toUpperCase() || `${idx + 1}`}
                            </div>
                            <span className="text-sm font-semibold text-gray-700">{member.name || `Thành viên ${idx + 1}`}</span>
                        </div>
                        <button type="button" onClick={() => removeMember(idx)}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer">
                            <Trash2 size={13} />
                        </button>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                        <div className="col-span-2">
                            <Field label="Tên">
                                <Input value={member.name} onChange={v => setField(idx, "name", v)} placeholder="Nguyễn Văn A" />
                            </Field>
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <Field label="Chức vụ">
                                <Input value={member.role} onChange={v => setField(idx, "role", v)} placeholder="CEO / Producer" />
                            </Field>
                        </div>
                        <Field label="Chữ viết tắt" hint="Avatar">
                            <Input value={member.initials} onChange={v => setField(idx, "initials", v)} placeholder="NVA" />
                        </Field>
                    </div>
                </div>
            ))}

            <div className="flex justify-end"><SaveBtn saving={saving} saved={saved} /></div>
        </form>
    );
}

// ─── Tab: CTA ────────────────────────────────────────────────────────────────
function CtaTab({ onSave, data }: { onSave: (f: Record<string, string>) => Promise<void>; data: Record<string, string> }) {
    const [lang, setLang] = useState<"vi" | "en">("vi");
    const [headingVi,   setHeadingVi]   = useState(data.aboutCtaHeadingVi   || "");
    const [highlightVi, setHighlightVi] = useState(data.aboutCtaHighlightVi || "");
    const [headingEn,   setHeadingEn]   = useState(data.aboutCtaHeadingEn   || "");
    const [highlightEn, setHighlightEn] = useState(data.aboutCtaHighlightEn || "");
    const [subtitleVi,  setSubtitleVi]  = useState(data.aboutCtaSubtitle    || "");
    const [subtitleEn,  setSubtitleEn]  = useState(data.aboutCtaSubtitleEn  || "");
    const { saving, saved, submit } = useSave(onSave);

    useEffect(() => {
        setHeadingVi(data.aboutCtaHeadingVi || "");
        setHighlightVi(data.aboutCtaHighlightVi || "");
        setHeadingEn(data.aboutCtaHeadingEn || "");
        setHighlightEn(data.aboutCtaHighlightEn || "");
        setSubtitleVi(data.aboutCtaSubtitle || "");
        setSubtitleEn(data.aboutCtaSubtitleEn || "");
    }, [data]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        submit({
            aboutCtaHeadingVi: headingVi, aboutCtaHighlightVi: highlightVi,
            aboutCtaHeadingEn: headingEn, aboutCtaHighlightEn: highlightEn,
            aboutCtaSubtitle: subtitleVi, aboutCtaSubtitleEn: subtitleEn,
        });
    };

    const isVi = lang === "vi";

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-600">Section kêu gọi hành động (cuối trang)</h3>
                <LangToggle lang={lang} setLang={setLang} />
            </div>
            <SectionCard title={`Tiêu đề (${lang.toUpperCase()})`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Heading" hint='Dòng đầu (VD: "Sẵn sàng đưa âm nhạc")'>
                        <Input
                            value={isVi ? headingVi : headingEn}
                            onChange={v => isVi ? setHeadingVi(v) : setHeadingEn(v)}
                            placeholder={isVi ? "Sẵn sàng đưa âm nhạc" : "Ready to take your music"}
                        />
                    </Field>
                    <Field label="Highlight" hint='Dòng tô màu xanh (VD: "của bạn lên tầm cao mới?")'>
                        <Input
                            value={isVi ? highlightVi : highlightEn}
                            onChange={v => isVi ? setHighlightVi(v) : setHighlightEn(v)}
                            placeholder={isVi ? "của bạn lên tầm cao mới?" : "to the next level?"}
                        />
                    </Field>
                </div>
            </SectionCard>
            <SectionCard title={`Mô tả (${lang.toUpperCase()})`}>
                <Field label="Nội dung" hint="Đoạn text màu nhạt dưới tiêu đề">
                    <Textarea
                        rows={3}
                        value={isVi ? subtitleVi : subtitleEn}
                        onChange={v => isVi ? setSubtitleVi(v) : setSubtitleEn(v)}
                        placeholder={isVi ? "Cùng nhau tạo nên những giai điệu..." : "Let's create melodies that resonate..."}
                    />
                </Field>
                {(isVi ? subtitleVi : subtitleEn) && (
                    <div className="p-4 bg-gray-900 rounded-lg text-sm text-gray-300 leading-relaxed italic border border-gray-700">
                        "{isVi ? subtitleVi : subtitleEn}"
                    </div>
                )}
            </SectionCard>
            <div className="flex justify-end"><SaveBtn saving={saving} saved={saved} /></div>
        </form>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────
function AdminAboutPageInner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const activeTab = (searchParams?.get("tab") as Tab) ?? "hero";
    const setActiveTab = (t: Tab) => router.replace(`?tab=${t}`, { scroll: false });

    const [settingsData, setSettingsData] = useState<Record<string, string>>({});
    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        axios.get("/api/settings").then(r => {
            if (r.data.success) setSettingsData(r.data.data);
        }).catch(() => {});
    }, []);

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
                <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center">
                    <Info size={18} className="text-teal-600" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Quản lý trang Giới thiệu</h1>
                    <p className="text-sm text-gray-500">Chỉnh nội dung từng section của trang Về chúng tôi</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-1 p-1 bg-gray-100 rounded-xl w-fit">
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
                {activeTab === "hero"     && <HeroTab     onSave={handleSave} data={settingsData} />}
                {activeTab === "stats"    && <StatsTab    onSave={handleSave} data={settingsData} />}
                {activeTab === "mission"  && <MissionTab  onSave={handleSave} data={settingsData} />}
                {activeTab === "services" && <ServicesTab onSave={handleSave} data={settingsData} />}
                {activeTab === "team"     && <TeamTab     onSave={handleSave} data={settingsData} />}
                {activeTab === "cta"      && <CtaTab      onSave={handleSave} data={settingsData} />}
            </div>

            <Toast toast={toast} />
        </div>
    );
}

export default function AdminAboutPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 size={24} className="animate-spin text-indigo-500" /></div>}>
            <AdminAboutPageInner />
        </Suspense>
    );
}
