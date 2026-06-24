'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendMail } from '@/services/sendMail';
import { useIsMobile } from '@/hooks/use-mobile';
import {
    Phone, Mail, MapPin, MessageCircle, Clock,
    ArrowUpRight, Send, User, Edit3, AlertCircle,
} from 'lucide-react';

import { useLanguageStore } from '@/stores/useLanguageStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { footerText } from '@/locales/footer';
import { aboutSectionText } from '@/locales/contact/aboutSection';
import { companyConfig } from "@/config/company.config";
import { toast } from 'sonner';

interface FormErrors {
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
}

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 22 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number], delay },
});

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
    const [focusedField, setFocusedField] = useState<string | null>(null);

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
        if (!formData.name.trim())    newErrors.name    = lang === 'vi' ? "Vui lòng nhập họ tên" : "Name is required";
        if (!formData.email.trim())   newErrors.email   = lang === 'vi' ? "Vui lòng nhập email" : "Email is required";
        else if (!emailRegex.test(formData.email)) newErrors.email = lang === 'vi' ? "Email không đúng định dạng" : "Invalid email format";
        if (!formData.subject.trim()) newErrors.subject = lang === 'vi' ? "Vui lòng nhập chủ đề" : "Subject is required";
        if (!formData.message.trim()) newErrors.message = lang === 'vi' ? "Nội dung không được để trống" : "Message cannot be empty";
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
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    style={{ display:"flex", alignItems:"center", gap:5, marginTop:6, fontSize:11, fontWeight:600, color:"#f87171" }}
                >
                    <AlertCircle size={11} /> {message}
                </motion.span>
            )}
        </AnimatePresence>
    );

    const inputStyle = (field: string, error?: string): React.CSSProperties => ({
        width: "100%",
        padding: "12px 14px 12px 42px",
        background: error ? "rgba(248,113,113,0.05)" : focusedField === field ? "rgba(0,169,143,0.06)" : "rgba(255,255,255,0.04)",
        border: `1.5px solid ${error ? "rgba(248,113,113,0.5)" : focusedField === field ? "rgba(0,169,143,0.6)" : "rgba(255,255,255,0.1)"}`,
        borderRadius: 12,
        color: "#fff",
        fontSize: 13,
        outline: "none",
        fontFamily: "inherit",
        boxSizing: "border-box",
        transition: "all 0.2s ease",
        boxShadow: focusedField === field && !error ? "0 0 0 3px rgba(0,169,143,0.12)" : "none",
    });

    const contactItems = [
        { icon: <Phone size={15} />, label: "Hotline", value: displayPhone },
        { icon: <Mail size={15} />, label: "Email", value: displayEmail },
        { icon: <MapPin size={15} />, label: isEn ? "Address" : "Địa chỉ", value: displayAddress },
        { icon: <Clock size={15} />, label: isEn ? "Working Hours" : "Giờ làm việc", value: displayHours },
    ];

    const locationItems = [
        { icon: <Phone size={16} />, label: "Hotline", value: displayPhone },
        { icon: <Mail size={16} />, label: "Email", value: displayEmail },
        { icon: <Clock size={16} />, label: isEn ? "Working hours" : "Giờ làm việc", value: displayHours },
    ];

    return (
        <div style={{ color: "#0D0D1A" }}>

            {/* ══ CONTACT FORM ══ */}
            <section style={{ position: "relative", overflow: "hidden", background: "#080f1c" }}>

                {/* Background decoration */}
                <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle at 70% 20%, rgba(0,169,143,0.07) 0%, transparent 55%), radial-gradient(circle at 10% 80%, rgba(52,212,184,0.05) 0%, transparent 50%)", pointerEvents:"none" }} />
                <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize:"60px 60px", pointerEvents:"none", opacity:0.5 }} />
                <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg, transparent, #00A98F 30%, #34D4B8 70%, transparent)" }} />

                <div style={{ maxWidth:1440, margin:"0 auto", padding: isMobile ? "56px 20px 64px" : "80px 40px 96px", position:"relative", zIndex:1 }}>

                    {/* Section header */}
                    <motion.div {...fadeUp(0)} style={{ marginBottom: isMobile ? 40 : 56 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                            <span style={{ width:32, height:2, background:"linear-gradient(90deg,#00A98F,#34D4B8)", borderRadius:2 }} />
                            <span style={{ fontSize:10, fontWeight:700, letterSpacing:"2.5px", textTransform:"uppercase", color:"#34D4B8", fontFamily:"'Space Grotesk',sans-serif" }}>{displayFormLabel}</span>
                        </div>
                        <h2 style={{ fontSize: isMobile ? "clamp(24px,6vw,32px)" : "clamp(28px,2.8vw,40px)", fontWeight:800, lineHeight:1.15, letterSpacing:"-0.5px", margin:0, color:"#fff" }}>
                            {displayFormHeading}{" "}
                            <span style={{ background:"linear-gradient(135deg,#00A98F,#34D4B8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>{displayFormHighlight}</span>
                        </h2>
                    </motion.div>

                    <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "5fr 7fr", gap: isMobile ? 32 : 48, alignItems:"start" }}>

                        {/* LEFT — contact info */}
                        <motion.div {...fadeUp(0.1)} style={{ display:"flex", flexDirection:"column", gap:0 }}>
                            <p style={{ fontSize:14, color:"rgba(255,255,255,0.5)", lineHeight:1.7, marginBottom:28 }}>
                                {isEn
                                    ? "We'd love to hear from you. Fill out the form and our team will get back to you as soon as possible."
                                    : "Chúng tôi luôn sẵn sàng lắng nghe bạn. Điền form và đội ngũ của chúng tôi sẽ phản hồi sớm nhất có thể."}
                            </p>

                            <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                                {contactItems.map(({ icon, label, value }, i) => (
                                    <motion.div key={i} {...fadeUp(0.15 + i * 0.07)}
                                        style={{ display:"flex", gap:14, padding:"14px 16px", borderRadius:14, alignItems:"flex-start", borderBottom: i < contactItems.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                                        <div style={{ width:38, height:38, borderRadius:10, background:"rgba(0,169,143,0.1)", border:"1px solid rgba(0,169,143,0.2)", display:"flex", alignItems:"center", justifyContent:"center", color:"#34D4B8", flexShrink:0, marginTop:1 }}>
                                            {icon}
                                        </div>
                                        <div>
                                            <p style={{ fontSize:9, fontWeight:700, letterSpacing:"1.8px", textTransform:"uppercase", color:"rgba(255,255,255,0.3)", marginBottom:4 }}>{label}</p>
                                            <p style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.8)", lineHeight:1.55, margin:0 }}>{value}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* RIGHT — form */}
                        <motion.div {...fadeUp(0.15)}
                            style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:20, padding: isMobile ? "28px 20px" : "40px 36px", backdropFilter:"blur(12px)" }}>

                            <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:20 }}>

                                {/* Name + Email row */}
                                <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:16 }}>
                                    {/* Name */}
                                    <div>
                                        <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:"1.8px", textTransform:"uppercase", color:"rgba(255,255,255,0.35)", marginBottom:8 }}>
                                            {isEn ? "Full name" : "Họ và tên"}
                                        </label>
                                        <div style={{ position:"relative" }}>
                                            <User size={14} style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color: errors.name ? "#f87171" : focusedField === "name" ? "#34D4B8" : "rgba(255,255,255,0.25)", pointerEvents:"none" }} />
                                            <input type="text" value={formData.name} placeholder="Nguyễn Văn A"
                                                style={inputStyle("name", errors.name)}
                                                onFocus={() => setFocusedField("name")}
                                                onBlur={() => setFocusedField(null)}
                                                onChange={(e) => { setFormData({ ...formData, name: e.target.value }); if (errors.name) setErrors({ ...errors, name: undefined }); }}
                                            />
                                        </div>
                                        <ErrorLabel message={errors.name} />
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:"1.8px", textTransform:"uppercase", color:"rgba(255,255,255,0.35)", marginBottom:8 }}>Email</label>
                                        <div style={{ position:"relative" }}>
                                            <Mail size={14} style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color: errors.email ? "#f87171" : focusedField === "email" ? "#34D4B8" : "rgba(255,255,255,0.25)", pointerEvents:"none" }} />
                                            <input type="email" value={formData.email} placeholder="example@gmail.com"
                                                style={inputStyle("email", errors.email)}
                                                onFocus={() => setFocusedField("email")}
                                                onBlur={() => setFocusedField(null)}
                                                onChange={(e) => { setFormData({ ...formData, email: e.target.value }); if (errors.email) setErrors({ ...errors, email: undefined }); }}
                                            />
                                        </div>
                                        <ErrorLabel message={errors.email} />
                                    </div>
                                </div>

                                {/* Subject */}
                                <div>
                                    <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:"1.8px", textTransform:"uppercase", color:"rgba(255,255,255,0.35)", marginBottom:8 }}>
                                        {isEn ? "Subject" : "Chủ đề"}
                                    </label>
                                    <div style={{ position:"relative" }}>
                                        <Edit3 size={14} style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color: errors.subject ? "#f87171" : focusedField === "subject" ? "#34D4B8" : "rgba(255,255,255,0.25)", pointerEvents:"none" }} />
                                        <input type="text" value={formData.subject}
                                            placeholder={isEn ? "I'd like to collaborate..." : "Tôi muốn hợp tác..."}
                                            style={inputStyle("subject", errors.subject)}
                                            onFocus={() => setFocusedField("subject")}
                                            onBlur={() => setFocusedField(null)}
                                            onChange={(e) => { setFormData({ ...formData, subject: e.target.value }); if (errors.subject) setErrors({ ...errors, subject: undefined }); }}
                                        />
                                    </div>
                                    <ErrorLabel message={errors.subject} />
                                </div>

                                {/* Message */}
                                <div>
                                    <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:"1.8px", textTransform:"uppercase", color:"rgba(255,255,255,0.35)", marginBottom:8 }}>
                                        {isEn ? "Message" : "Lời nhắn"}
                                    </label>
                                    <textarea rows={5} value={formData.message}
                                        placeholder={isEn ? "How can we help you?" : "Nội dung chi tiết..."}
                                        style={{
                                            ...inputStyle("message", errors.message),
                                            padding: "12px 14px",
                                            resize: "vertical",
                                            lineHeight: 1.65,
                                        }}
                                        onFocus={() => setFocusedField("message")}
                                        onBlur={() => setFocusedField(null)}
                                        onChange={(e) => { setFormData({ ...formData, message: e.target.value }); if (errors.message) setErrors({ ...errors, message: undefined }); }}
                                    />
                                    <ErrorLabel message={errors.message} />
                                </div>

                                {/* Submit */}
                                <button type="submit" disabled={isSubmitting || countdown > 0}
                                    style={{
                                        width: "100%",
                                        display:"flex", alignItems:"center", justifyContent:"center", gap:9,
                                        padding:"14px 28px", borderRadius:14, fontSize:14, fontWeight:700,
                                        border:"none", cursor: (isSubmitting || countdown > 0) ? "not-allowed" : "pointer",
                                        background: (isSubmitting || countdown > 0)
                                            ? "rgba(255,255,255,0.06)"
                                            : "linear-gradient(135deg,#00A98F 0%,#34D4B8 100%)",
                                        color: (isSubmitting || countdown > 0) ? "rgba(255,255,255,0.25)" : "#fff",
                                        boxShadow: (isSubmitting || countdown > 0) ? "none" : "0 8px 28px rgba(0,169,143,0.35)",
                                        transition: "all 0.25s ease",
                                        marginTop: 4,
                                        letterSpacing: "0.3px",
                                    }}>
                                    {isSubmitting
                                        ? (isEn ? "Sending..." : "Đang gửi...")
                                        : countdown > 0
                                            ? (isEn ? `Wait ${countdown}s` : `Chờ ${countdown}s`)
                                            : (isEn ? "Send Message" : "Gửi tin nhắn")}
                                    {!isSubmitting && countdown === 0 && <Send size={15} />}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ══ LOCATION & MAP ══ */}
            <section style={{ background:"var(--m-bg)", padding: isMobile ? "56px 0 64px" : "80px 0 96px", position:"relative", overflow:"hidden" }}>

                <div style={{ maxWidth:1440, margin:"0 auto", padding:`0 ${isMobile ? "20px" : "40px"}` }}>

                    {/* Section header */}
                    <motion.div {...fadeUp(0)} style={{ marginBottom: isMobile ? 36 : 52 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                            <span style={{ width:32, height:2, background:"linear-gradient(90deg,#00A98F,#34D4B8)", borderRadius:2 }} />
                            <span style={{ fontSize:10, fontWeight:700, letterSpacing:"2.5px", textTransform:"uppercase", color:"#00A98F", fontFamily:"'Space Grotesk',sans-serif" }}>{displayLocationLabel}</span>
                        </div>
                        <h2 style={{ fontSize: isMobile ? "clamp(24px,6vw,32px)" : "clamp(28px,2.8vw,40px)", fontWeight:800, lineHeight:1.15, letterSpacing:"-0.5px", margin:0, color:"var(--m-text)" }}>
                            {displayLocationHeading}{" "}
                            <span style={{ color:"#00A98F" }}>{displayLocationHighlight}</span>
                        </h2>
                    </motion.div>

                    {/* Map + Info grid */}
                    <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "7fr 5fr", gap: isMobile ? 28 : 40, alignItems:"stretch" }}>

                        {/* Map — left, full height */}
                        <motion.div {...fadeUp(0.1)}
                            style={{ borderRadius:20, overflow:"hidden", border:"1px solid var(--m-border)", boxShadow:"0 12px 40px rgba(0,0,0,0.09)", minHeight: isMobile ? 280 : 420 }}>
                            <iframe
                                src={displayMapUrl.includes("maps/embed") ? displayMapUrl : "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4602324225!2d106.6648812758832!3d10.776019359198188!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752edca2695555%3A0x6e9a66d8e8412e84!2sCompany%20Name!5e0!3m2!1svi!2s!4v1700000000000!5m2!1svi!2s"}
                                style={{ width:"100%", height:"100%", border:"none", display:"block", minHeight: isMobile ? 280 : 420 }}
                                allowFullScreen loading="lazy" title="office-map"
                            />
                        </motion.div>

                        {/* Info — right */}
                        <motion.div {...fadeUp(0.15)} style={{ display:"flex", flexDirection:"column", gap:12 }}>

                            {/* Address card — prominent */}
                            <div style={{ padding:"22px 20px", background:"var(--m-surface-1)", border:"1px solid var(--m-border)", borderRadius:16, borderLeft:"3px solid #00A98F" }}>
                                <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                                    <div style={{ width:42, height:42, borderRadius:12, background:"rgba(0,169,143,0.1)", border:"1px solid rgba(0,169,143,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                                        <MapPin size={18} color="#00A98F" />
                                    </div>
                                    <div>
                                        <p style={{ fontSize:9, fontWeight:700, letterSpacing:"1.8px", textTransform:"uppercase", color:"var(--m-muted)", marginBottom:6 }}>{t.officeAddress}</p>
                                        <p style={{ fontSize:14, fontWeight:500, color:"var(--m-text)", lineHeight:1.65, margin:0 }}>{displayAddress}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Other info cards */}
                            {locationItems.map(({ icon, label, value }, i) => (
                                <motion.div key={i} {...fadeUp(0.2 + i * 0.06)}
                                    style={{ display:"flex", gap:14, padding:"16px 18px", background:"var(--m-surface-1)", border:"1px solid var(--m-border)", borderRadius:14, alignItems:"center" }}>
                                    <div style={{ width:38, height:38, borderRadius:10, background:"rgba(0,169,143,0.08)", border:"1px solid rgba(0,169,143,0.15)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                                        {React.cloneElement(icon as React.ReactElement<{ color?: string }>, { color: "#00A98F" })}
                                    </div>
                                    <div style={{ minWidth:0 }}>
                                        <p style={{ fontSize:9, fontWeight:700, letterSpacing:"1.8px", textTransform:"uppercase", color:"var(--m-muted)", marginBottom:3 }}>{label}</p>
                                        <p style={{ fontSize:13, fontWeight:600, color:"var(--m-text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", margin:0 }}>{value}</p>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Google Maps CTA */}
                            <motion.a {...fadeUp(0.38)} href={displayMapUrl} target="_blank" rel="noreferrer"
                                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, background:"linear-gradient(135deg,#00A98F,#34D4B8)", color:"#fff", padding:"14px 22px", borderRadius:14, fontSize:13, fontWeight:700, textDecoration:"none", boxShadow:"0 8px 24px rgba(0,169,143,0.28)", marginTop:4, letterSpacing:"0.2px" }}>
                                <MapPin size={15} /> {aboutSection.openGoogleMaps} <ArrowUpRight size={15} />
                            </motion.a>
                        </motion.div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutSection;
