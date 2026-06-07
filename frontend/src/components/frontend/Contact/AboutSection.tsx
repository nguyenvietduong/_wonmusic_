import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendMail } from '@/services/sendMail';
import { useIsMobile } from '@/hooks/use-mobile';
import {
    Phone, Mail, MapPin, MessageCircle,
    ArrowUpRight, Send, User, Edit3, AlertCircle
} from 'lucide-react';

import { useLanguageStore } from '@/stores/useLanguageStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { footerText } from '@/locales/footer';
import { aboutSectionText } from '@/locales/contact/aboutSection';
import { bannerSectionText } from "@/locales/contact/bannerSection";
import { companyConfig } from "@/config/company.config";
import Breadcrumb from '../Breadcrumb';
import { toast } from 'sonner';

interface FormErrors {
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
}

const AboutSection = () => {
    const { lang } = useLanguageStore();
    const { fetch: fetchSettings, loaded: settingsLoaded } = useSettingsStore();
    const isMobile = useIsMobile();
    const t = footerText[lang].footer;

    // Đảm bảo settings (EmailJS keys) đã load trước khi user submit form
    useEffect(() => { if (!settingsLoaded) fetchSettings(); }, [settingsLoaded, fetchSettings]);
    const aboutSection = aboutSectionText[lang];
    const bannerSection = bannerSectionText[lang];

    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [countdown, setCountdown] = useState(0);

    useEffect(() => {
        const lastSent = localStorage.getItem('last_contact_sent');
        if (lastSent) {
            const diff = Date.now() - parseInt(lastSent);
            if (diff < 60000) setCountdown(Math.ceil((60000 - diff) / 1000));
        }
    }, []);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.name.trim()) newErrors.name = lang === 'vi' ? "Vui lòng nhập họ tên" : "Name is required";
        if (!formData.email.trim()) newErrors.email = lang === 'vi' ? "Vui lòng nhập email" : "Email is required";
        else if (!emailRegex.test(formData.email)) newErrors.email = lang === 'vi' ? "Email không đúng định dạng" : "Invalid email format";
        if (!formData.subject.trim()) newErrors.subject = lang === 'vi' ? "Vui lòng nhập chủ đề" : "Subject is required";
        if (!formData.message.trim()) newErrors.message = lang === 'vi' ? "Nội dung lời nhắn không được để trống" : "Message cannot be empty";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (countdown > 0) {
            toast.warning(lang === 'vi' ? `Vui lòng đợi ${countdown}s trước khi gửi lại.` : `Please wait ${countdown}s.`);
            return;
        }
        if (!validateForm()) return;
        setIsSubmitting(true);
        try {
            await sendMail(formData);
            toast.success(lang === 'vi' ? "✅ Gửi thành công! Chúng tôi sẽ phản hồi sớm." : "✅ Sent successfully!");
            localStorage.setItem('last_contact_sent', Date.now().toString());
            setCountdown(60);
            setFormData({ name: '', email: '', subject: '', message: '' });
            setErrors({});
        } catch (error) {
            console.error("Mail Error:", error);
            const msg = error instanceof Error ? error.message : (lang === 'vi' ? "Lỗi hệ thống, vui lòng thử lại sau." : "Error, please try again.");
            toast.error(`❌ ${msg}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const ErrorLabel = ({ message }: { message?: string }) => (
        <AnimatePresence>
            {message && (
                <motion.span
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-red-400 text-[11px] font-medium flex items-center gap-1 mt-1 ml-1"
                >
                    <AlertCircle size={12} /> {message}
                </motion.span>
            )}
        </AnimatePresence>
    );

    const inputBase = "w-full py-4 bg-[rgba(0,0,0,0.04)] border rounded-2xl focus:outline-none transition-all text-[#0D0D1A] placeholder:text-[rgba(0,0,0,0.35)]";
    const inputNormal = `${inputBase} pl-12 pr-4 border-[rgba(0,0,0,0.08)] focus:border-[#00A98F] focus:bg-[rgba(0,169,143,0.06)]`;
    const inputError  = `${inputBase} pl-12 pr-4 border-red-500/50 ring-2 ring-red-500/20`;

    return (
        <div style={{ background: "#F8F8FC", color: "#0D0D1A", minHeight: "100vh" }}>
            {/* 2. OFFICE LOCATION & MAP */}
            <section style={{ paddingBottom:80, position:"relative", overflow:"hidden", background:"#F8F8FC" }}>
                {/* Subtle grid lines */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: "linear-gradient(rgba(52,212,184,1) 1px,transparent 1px),linear-gradient(90deg,rgba(52,212,184,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

                <div style={{ maxWidth:1440, margin:"0 auto", padding:`0 ${isMobile ? "16px" : "32px"}`, position:"relative", zIndex:10 }}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Contact info */}
                        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-[#242424]"
                                    style={{ background: "linear-gradient(135deg,#00A98F,#34D4B8)", boxShadow: "0 8px 24px rgba(0,169,143,0.35)" }}>
                                    <MapPin size={28} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "#34D4B8" }}>{t.headquarterLabel}</p>
                                    <h3 className="text-2xl md:text-3xl font-black uppercase" style={{ color: "#0D0D1A" }}>{t.hcmBranchLabel}</h3>
                                </div>
                            </div>

                            <div className="space-y-8 pl-8 ml-7 text-left border-l-2" style={{ borderColor: "rgba(0,169,143,0.25)" }}>
                                <div className="space-y-2">
                                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(0,0,0,.4)" }}>{t.officeAddress}</p>
                                    <p className="text-lg leading-relaxed font-medium" style={{ color: "rgba(0,0,0,.6)" }}>{companyConfig.address.headquarter[lang]}</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(0,0,0,.4)" }}>Email</p>
                                        <p className="font-bold flex items-center gap-2" style={{ color: "#0D0D1A" }}>
                                            <Mail size={16} style={{ color: "#34D4B8" }} /> {companyConfig.email.contact}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(0,0,0,.4)" }}>Hotline</p>
                                        <p className="font-bold flex items-center gap-2" style={{ color: "#0D0D1A" }}>
                                            <Phone size={16} style={{ color: "#34D4B8" }} /> {companyConfig.hotline}
                                        </p>
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <a href={companyConfig.urlMapGoogle} target="_blank" rel="noreferrer"
                                        className="inline-flex items-center gap-3 px-6 py-3 text-[#242424] text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300"
                                        style={{ background: "linear-gradient(135deg,#00A98F,#34D4B8)", boxShadow: "0 8px 24px rgba(0,169,143,0.3)" }}>
                                        {aboutSection.openGoogleMaps} <ArrowUpRight size={16} />
                                    </a>
                                </div>
                            </div>
                        </motion.div>

                        {/* Map */}
                        <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                            className="relative h-[400px] w-full rounded-[32px] overflow-hidden"
                            style={{ border: "2px solid rgba(0,169,143,0.25)", boxShadow: "0 24px 64px rgba(0,0,0,0.12)" }}>
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4602324225!2d106.6648812758832!3d10.776019359198188!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752edca2695555%3A0x6e9a66d8e8412e84!2sCompany%20Name!5e0!3m2!1svi!2s!4v1700000000000!5m2!1svi!2s"
                                className="absolute inset-0 w-full h-full border-none"
                                allowFullScreen loading="lazy" title="office-map"
                            />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 3. CONTACT FORM SECTION */}
            <section style={{ padding:"80px 0", position:"relative", background:"#F4F4FC" }}>
                {/* Teal glow bg */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
                    style={{ background: "radial-gradient(ellipse,rgba(0,169,143,0.07) 0%,transparent 70%)" }} />

                <div style={{ maxWidth:1440, margin:"0 auto", padding:`0 ${isMobile ? "16px" : "32px"}`, position:"relative", zIndex:10 }}>
                    <div className="overflow-hidden flex flex-col md:flex-row rounded-2xl"
                        style={{ border: "1px solid rgba(0,169,143,0.18)", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(16px)", boxShadow:"0 24px 64px rgba(0,0,0,.12)" }}>

                        {/* Sidebar */}
                        <div className="md:w-2/5 p-8 md:p-12 flex flex-col justify-between relative overflow-hidden"
                            style={{ background: "linear-gradient(135deg,#00A98F 0%,#007D69 100%)" }}>
                            <div className="absolute top-0 right-0 w-48 h-48 rounded-full -mr-16 -mt-16"
                                style={{ background: "rgba(255,255,255,0.08)", filter: "blur(40px)" }} />
                            <div className="relative z-10 text-left">
                                <h2 className="text-2xl md:text-4xl font-black leading-tight mb-6 uppercase" style={{ color: "#fff" }}>
                                    {lang === 'vi' ? "Gửi tin nhắn cho chúng tôi" : "Get in touch with us"}
                                </h2>
                                <p className="leading-relaxed font-medium mb-8" style={{ color: "rgba(255,255,255,0.75)" }}>
                                    {lang === 'vi'
                                        ? "Đừng ngần ngại liên hệ! Chúng tôi luôn sẵn sàng lắng nghe và hợp tác cùng bạn."
                                        : "Don't hesitate to reach out! We are ready to listen and collaborate."}
                                </p>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
                                            <MessageCircle size={20} color="#fff" />
                                        </div>
                                        <p className="text-sm font-bold text-white">{lang === 'vi' ? "Hỗ trợ 24/7" : "Support 24/7"}</p>
                                    </div>
                                </div>
                            </div>
                            {/* EQ decoration */}
                            <div className="flex items-flex-end gap-[3px] h-10 mt-8">
                                {[35,55,42,78,48,68,35,88,52,62].map((h, i) => (
                                    <div key={i} style={{
                                        width: 4, height: `${h}%`,
                                        background: "rgba(255,255,255,0.35)",
                                        borderRadius: 2, alignSelf: "flex-end",
                                    }} />
                                ))}
                            </div>
                        </div>

                        {/* Form */}
                        <div className="md:w-3/5 p-8 md:p-12">
                            <form onSubmit={handleSubmit} className="space-y-5 text-left">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: "rgba(0,0,0,.45)" }}>Họ và tên</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors" size={18}
                                                style={{ color: errors.name ? "#f87171" : "rgba(0,0,0,.4)" }} />
                                            <input
                                                type="text"
                                                value={formData.name}
                                                placeholder="Nguyễn Văn A"
                                                className={errors.name ? inputError : inputNormal}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, name: e.target.value });
                                                    if (errors.name) setErrors({ ...errors, name: undefined });
                                                }}
                                            />
                                        </div>
                                        <ErrorLabel message={errors.name} />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: "rgba(0,0,0,.45)" }}>Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors" size={18}
                                                style={{ color: errors.email ? "#f87171" : "rgba(0,0,0,.4)" }} />
                                            <input
                                                type="email"
                                                value={formData.email}
                                                placeholder="example@gmail.com"
                                                className={errors.email ? inputError : inputNormal}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, email: e.target.value });
                                                    if (errors.email) setErrors({ ...errors, email: undefined });
                                                }}
                                            />
                                        </div>
                                        <ErrorLabel message={errors.email} />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: "rgba(0,0,0,.45)" }}>Chủ đề</label>
                                    <div className="relative">
                                        <Edit3 className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors" size={18}
                                            style={{ color: errors.subject ? "#f87171" : "rgba(0,0,0,.4)" }} />
                                        <input
                                            type="text"
                                            value={formData.subject}
                                            placeholder={lang === 'vi' ? "Tôi muốn hợp tác..." : "I want to collaborate..."}
                                            className={errors.subject ? inputError : inputNormal}
                                            onChange={(e) => {
                                                setFormData({ ...formData, subject: e.target.value });
                                                if (errors.subject) setErrors({ ...errors, subject: undefined });
                                            }}
                                        />
                                    </div>
                                    <ErrorLabel message={errors.subject} />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: "rgba(0,0,0,.45)" }}>Lời nhắn</label>
                                    <textarea
                                        rows={4}
                                        value={formData.message}
                                        placeholder={lang === 'vi' ? "Nội dung chi tiết..." : "How can we help?"}
                                        className={`${errors.message
                                            ? "w-full p-4 bg-[rgba(0,0,0,0.04)] border border-red-500/50 ring-2 ring-red-500/20 rounded-2xl focus:outline-none transition-all resize-none text-[#0D0D1A] placeholder:text-[rgba(0,0,0,0.35)]"
                                            : "w-full p-4 bg-[rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.08)] rounded-2xl focus:outline-none focus:border-[#00A98F] focus:bg-[rgba(0,169,143,0.06)] transition-all resize-none text-[#0D0D1A] placeholder:text-[rgba(0,0,0,0.35)]"
                                        }`}
                                        onChange={(e) => {
                                            setFormData({ ...formData, message: e.target.value });
                                            if (errors.message) setErrors({ ...errors, message: undefined });
                                        }}
                                    />
                                    <ErrorLabel message={errors.message} />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting || countdown > 0}
                                    className="group w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all duration-300 flex items-center justify-center gap-3"
                                    style={
                                        (isSubmitting || countdown > 0)
                                            ? { background: "rgba(0,0,0,0.07)", color: "rgba(0,0,0,.4)", cursor: "not-allowed" }
                                            : { background: "linear-gradient(135deg,#00A98F,#34D4B8)", color: "#242424", boxShadow: "0 8px 28px rgba(0,169,143,0.35)" }
                                    }
                                >
                                    {isSubmitting
                                        ? (lang === 'vi' ? "Đang xử lý..." : "Processing...")
                                        : countdown > 0
                                            ? (lang === 'vi' ? `Chờ ${countdown}s` : `Wait ${countdown}s`)
                                            : (lang === 'vi' ? "Gửi yêu cầu ngay" : "Send Message")}
                                    {!isSubmitting && countdown === 0 &&
                                        <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutSection;
