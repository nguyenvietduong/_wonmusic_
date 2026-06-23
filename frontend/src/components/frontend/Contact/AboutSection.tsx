'use client';
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
    const {
        fetch: fetchSettings, loaded: settingsLoaded,
        contactEmail, contactPhone, contactAddress,
        contactAddressEn, contactMapUrl, contactWorkingHours,
        contactLocationLabelVi, contactLocationLabelEn,
        contactLocationHeadingVi, contactLocationHeadingEn,
        contactLocationHighlightVi, contactLocationHighlightEn,
        contactFormLabelVi, contactFormLabelEn,
        contactFormHeadingVi, contactFormHeadingEn,
        contactFormHighlightVi, contactFormHighlightEn,
    } = useSettingsStore();
    const isMobile = useIsMobile();
    const t = footerText[lang].footer;

    useEffect(() => { if (!settingsLoaded) fetchSettings(); }, [settingsLoaded, fetchSettings]);

    const isEn = lang === "en";
    const displayPhone   = contactPhone   || companyConfig.hotline;
    const displayEmail   = contactEmail   || companyConfig.email.contact;
    const displayAddress = isEn
        ? (contactAddressEn || contactAddress || companyConfig.address.headquarter.en)
        : (contactAddress   || companyConfig.address.headquarter.vi);
    const displayMapUrl  = contactMapUrl  || companyConfig.urlMapGoogle;
    const displayHours   = contactWorkingHours || companyConfig.workingHours[lang];

    const displayLocationLabel     = (isEn ? contactLocationLabelEn     : contactLocationLabelVi)     || (isEn ? "Our Office"    : "Văn phòng");
    const displayLocationHeading   = (isEn ? contactLocationHeadingEn   : contactLocationHeadingVi)   || (isEn ? "Find"          : "Địa chỉ");
    const displayLocationHighlight = (isEn ? contactLocationHighlightEn : contactLocationHighlightVi) || (isEn ? "our location"  : "của chúng tôi");
    const displayFormLabel         = (isEn ? contactFormLabelEn         : contactFormLabelVi)         || (isEn ? "Contact"       : "Liên hệ");
    const displayFormHeading       = (isEn ? contactFormHeadingEn       : contactFormHeadingVi)       || (isEn ? "Send us"       : "Gửi");
    const displayFormHighlight     = (isEn ? contactFormHighlightEn     : contactFormHighlightVi)     || (isEn ? "a message"     : "tin nhắn cho chúng tôi");

    const aboutSection = aboutSectionText[lang];

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

    const SectionHead = ({ label, title, highlight, dark = false }: { label: string; title: string; highlight: string; dark?: boolean }) => (
        <div style={{ marginBottom: 36 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                <span style={{ width:24, height:2, background: dark ? "#34D4B8" : "#00A98F", borderRadius:2 }} />
                <span style={{ fontSize:10, fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", color: dark ? "#34D4B8" : "#00A98F", fontFamily:"'Space Grotesk',sans-serif" }}>{label}</span>
            </div>
            <h2 style={{ fontSize:"clamp(20px,2.5vw,30px)", fontWeight:800, lineHeight:1.2, letterSpacing:"-0.4px", margin:0, color: dark ? "#fff" : "#0D0D1A" }}>
                {title} <span style={{ color: dark ? "#34D4B8" : "#00A98F" }}>{highlight}</span>
            </h2>
        </div>
    );

    return (
        <div style={{ color: "#0D0D1A" }}>

            {/* ══ LOCATION & MAP ══ */}
            <section style={{ padding: isMobile ? "48px 0 56px" : "64px 0 72px", background:"var(--m-bg)" }}>
                <div style={{ maxWidth:1440, margin:"0 auto", padding:`0 ${isMobile ? "20px" : "32px"}` }}>
                    <SectionHead
                        label={displayLocationLabel}
                        title={displayLocationHeading}
                        highlight={displayLocationHighlight}
                    />

                    <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 32 : 48, alignItems:"start" }}>
                        {/* Info cards */}
                        <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} style={{ display:"flex", flexDirection:"column", gap:16 }}>
                            {/* Address */}
                            <div style={{ display:"flex", gap:14, padding:"20px", background:"var(--m-surface-1)", border:"1px solid var(--m-border)", borderRadius:14 }}>
                                <div style={{ width:42, height:42, borderRadius:10, background:"rgba(0,169,143,0.1)", border:"1px solid rgba(0,169,143,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                                    <MapPin size={18} color="#00A98F" />
                                </div>
                                <div>
                                    <p style={{ fontSize:10, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"var(--m-muted)", marginBottom:6 }}>{t.officeAddress}</p>
                                    <p style={{ fontSize:14, fontWeight:500, color:"var(--m-text)", lineHeight:1.6 }}>{displayAddress}</p>
                                </div>
                            </div>

                            {/* Phone + Email */}
                            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                                <div style={{ display:"flex", gap:12, padding:"16px", background:"var(--m-surface-1)", border:"1px solid var(--m-border)", borderRadius:14, alignItems:"center" }}>
                                    <div style={{ width:36, height:36, borderRadius:9, background:"rgba(0,169,143,0.1)", border:"1px solid rgba(0,169,143,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                                        <Phone size={15} color="#00A98F" />
                                    </div>
                                    <div>
                                        <p style={{ fontSize:9, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"var(--m-muted)", marginBottom:3 }}>Hotline</p>
                                        <p style={{ fontSize:13, fontWeight:700, color:"var(--m-text)" }}>{displayPhone}</p>
                                    </div>
                                </div>
                                <div style={{ display:"flex", gap:12, padding:"16px", background:"var(--m-surface-1)", border:"1px solid var(--m-border)", borderRadius:14, alignItems:"center" }}>
                                    <div style={{ width:36, height:36, borderRadius:9, background:"rgba(0,169,143,0.1)", border:"1px solid rgba(0,169,143,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                                        <Mail size={15} color="#00A98F" />
                                    </div>
                                    <div style={{ minWidth:0 }}>
                                        <p style={{ fontSize:9, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"var(--m-muted)", marginBottom:3 }}>Email</p>
                                        <p style={{ fontSize:12, fontWeight:700, color:"var(--m-text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{displayEmail}</p>
                                    </div>
                                </div>
                            </div>

                            <a href={displayMapUrl} target="_blank" rel="noreferrer"
                                style={{ display:"inline-flex", alignItems:"center", gap:8, background:"linear-gradient(135deg,#00A98F,#34D4B8)", color:"#fff", padding:"11px 22px", borderRadius:100, fontSize:13, fontWeight:700, textDecoration:"none", boxShadow:"0 6px 20px rgba(0,169,143,0.3)", alignSelf:"flex-start" }}>
                                <MapPin size={14} /> {aboutSection.openGoogleMaps} <ArrowUpRight size={14} />
                            </a>
                        </motion.div>

                        {/* Map */}
                        <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:0.1 }}
                            style={{ borderRadius:16, overflow:"hidden", border:"1px solid var(--m-border)", boxShadow:"0 8px 32px rgba(0,0,0,0.08)", height: isMobile ? 280 : 360 }}>
                            <iframe
                                src={displayMapUrl.includes("maps/embed") ? displayMapUrl : "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4602324225!2d106.6648812758832!3d10.776019359198188!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752edca2695555%3A0x6e9a66d8e8412e84!2sCompany%20Name!5e0!3m2!1svi!2s!4v1700000000000!5m2!1svi!2s"}
                                style={{ width:"100%", height:"100%", border:"none", display:"block" }}
                                allowFullScreen loading="lazy" title="office-map"
                            />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ══ CONTACT FORM ══ */}
            <section style={{ padding: isMobile ? "56px 0" : "80px 0", background:"#0a1220", position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:"linear-gradient(90deg,#00A98F,#34D4B8,#00A98F)" }} />
                <div style={{ position:"absolute", top:"-20%", right:"-5%", width:480, height:480, borderRadius:"50%", background:"radial-gradient(circle,rgba(0,169,143,0.09),transparent 65%)", pointerEvents:"none" }} />
                <div style={{ position:"absolute", bottom:"-15%", left:"5%", width:360, height:360, borderRadius:"50%", background:"radial-gradient(circle,rgba(52,211,184,0.06),transparent 65%)", pointerEvents:"none" }} />

                <div style={{ maxWidth:1440, margin:"0 auto", padding:`0 ${isMobile ? "20px" : "32px"}`, position:"relative", zIndex:1 }}>
                    <SectionHead
                        label={displayFormLabel}
                        title={displayFormHeading}
                        highlight={displayFormHighlight}
                        dark
                    />

                    <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 2fr", gap: isMobile ? 32 : 48, alignItems:"start" }}>

                        {/* Left: quick info */}
                        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                            {[
                                { icon: <Phone size={16} />, label: "Hotline", value: displayPhone },
                                { icon: <Mail size={16} />, value: displayEmail, label: "Email" },
                                { icon: <MapPin size={16} />, value: displayAddress, label: lang === "vi" ? "Địa chỉ" : "Address" },
                                { icon: <MessageCircle size={16} />, value: displayHours, label: lang === "vi" ? "Giờ làm việc" : "Working Hours" },
                            ].map(({ icon, label, value }, i) => (
                                <div key={i} style={{ display:"flex", gap:12, padding:"16px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, alignItems:"flex-start" }}>
                                    <div style={{ width:36, height:36, borderRadius:9, background:"rgba(0,169,143,0.12)", border:"1px solid rgba(0,169,143,0.2)", display:"flex", alignItems:"center", justifyContent:"center", color:"#34D4B8", flexShrink:0 }}>
                                        {icon}
                                    </div>
                                    <div>
                                        <p style={{ fontSize:9, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"rgba(255,255,255,0.35)", marginBottom:4 }}>{label}</p>
                                        <p style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.8)", lineHeight:1.5 }}>{value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Right: form */}
                        <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
                            style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding: isMobile ? "24px" : "36px" }}>
                            <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:18 }}>
                                <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:16 }}>
                                    <div>
                                        <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"rgba(255,255,255,0.4)", marginBottom:8 }}>
                                            {lang === "vi" ? "Họ và tên" : "Full name"}
                                        </label>
                                        <div style={{ position:"relative" }}>
                                            <User size={15} style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color: errors.name ? "#f87171" : "rgba(255,255,255,0.3)" }} />
                                            <input type="text" value={formData.name} placeholder="Nguyễn Văn A"
                                                style={{ width:"100%", padding:"11px 14px 11px 40px", background:"rgba(255,255,255,0.05)", border:`1px solid ${errors.name ? "rgba(248,113,113,0.5)" : "rgba(255,255,255,0.1)"}`, borderRadius:10, color:"#fff", fontSize:13, outline:"none", fontFamily:"inherit", boxSizing:"border-box" }}
                                                onChange={(e) => { setFormData({ ...formData, name: e.target.value }); if (errors.name) setErrors({ ...errors, name: undefined }); }}
                                            />
                                        </div>
                                        <ErrorLabel message={errors.name} />
                                    </div>
                                    <div>
                                        <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"rgba(255,255,255,0.4)", marginBottom:8 }}>Email</label>
                                        <div style={{ position:"relative" }}>
                                            <Mail size={15} style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color: errors.email ? "#f87171" : "rgba(255,255,255,0.3)" }} />
                                            <input type="email" value={formData.email} placeholder="example@gmail.com"
                                                style={{ width:"100%", padding:"11px 14px 11px 40px", background:"rgba(255,255,255,0.05)", border:`1px solid ${errors.email ? "rgba(248,113,113,0.5)" : "rgba(255,255,255,0.1)"}`, borderRadius:10, color:"#fff", fontSize:13, outline:"none", fontFamily:"inherit", boxSizing:"border-box" }}
                                                onChange={(e) => { setFormData({ ...formData, email: e.target.value }); if (errors.email) setErrors({ ...errors, email: undefined }); }}
                                            />
                                        </div>
                                        <ErrorLabel message={errors.email} />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"rgba(255,255,255,0.4)", marginBottom:8 }}>
                                        {lang === "vi" ? "Chủ đề" : "Subject"}
                                    </label>
                                    <div style={{ position:"relative" }}>
                                        <Edit3 size={15} style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color: errors.subject ? "#f87171" : "rgba(255,255,255,0.3)" }} />
                                        <input type="text" value={formData.subject}
                                            placeholder={lang === "vi" ? "Tôi muốn hợp tác..." : "I want to collaborate..."}
                                            style={{ width:"100%", padding:"11px 14px 11px 40px", background:"rgba(255,255,255,0.05)", border:`1px solid ${errors.subject ? "rgba(248,113,113,0.5)" : "rgba(255,255,255,0.1)"}`, borderRadius:10, color:"#fff", fontSize:13, outline:"none", fontFamily:"inherit", boxSizing:"border-box" }}
                                            onChange={(e) => { setFormData({ ...formData, subject: e.target.value }); if (errors.subject) setErrors({ ...errors, subject: undefined }); }}
                                        />
                                    </div>
                                    <ErrorLabel message={errors.subject} />
                                </div>

                                <div>
                                    <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"rgba(255,255,255,0.4)", marginBottom:8 }}>
                                        {lang === "vi" ? "Lời nhắn" : "Message"}
                                    </label>
                                    <textarea rows={5} value={formData.message}
                                        placeholder={lang === "vi" ? "Nội dung chi tiết..." : "How can we help?"}
                                        style={{ width:"100%", padding:"12px 14px", background:"rgba(255,255,255,0.05)", border:`1px solid ${errors.message ? "rgba(248,113,113,0.5)" : "rgba(255,255,255,0.1)"}`, borderRadius:10, color:"#fff", fontSize:13, outline:"none", fontFamily:"inherit", resize:"vertical", boxSizing:"border-box", lineHeight:1.6 }}
                                        onChange={(e) => { setFormData({ ...formData, message: e.target.value }); if (errors.message) setErrors({ ...errors, message: undefined }); }}
                                    />
                                    <ErrorLabel message={errors.message} />
                                </div>

                                <button type="submit" disabled={isSubmitting || countdown > 0}
                                    style={{
                                        display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                                        padding:"13px 28px", borderRadius:100, fontSize:13, fontWeight:700,
                                        border:"none", cursor: (isSubmitting || countdown > 0) ? "not-allowed" : "pointer",
                                        background: (isSubmitting || countdown > 0) ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg,#00A98F,#34D4B8)",
                                        color: (isSubmitting || countdown > 0) ? "rgba(255,255,255,0.3)" : "#fff",
                                        boxShadow: (isSubmitting || countdown > 0) ? "none" : "0 6px 20px rgba(0,169,143,0.35)",
                                        transition:"all .25s",
                                    }}>
                                    {isSubmitting ? (lang === "vi" ? "Đang gửi..." : "Sending...")
                                        : countdown > 0 ? (lang === "vi" ? `Chờ ${countdown}s` : `Wait ${countdown}s`)
                                        : (lang === "vi" ? "Gửi tin nhắn" : "Send Message")}
                                    {!isSubmitting && countdown === 0 && <Send size={15} />}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutSection;
