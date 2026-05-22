import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendMail } from '@/services/sendMail';
import {
    Phone, Mail, MapPin, MessageCircle,
    ArrowUpRight, Send, User, Edit3, AlertCircle
} from 'lucide-react';

import { useLanguageStore } from '@/stores/useLanguageStore';
import { footerText } from '@/locales/footer';
import { aboutSectionText } from '@/locales/contact/aboutSection';
import { bannerSectionText } from "@/locales/contact/bannerSection";
import { companyConfig } from "@/config/company.config";
import Breadcrumb from '../Breadcrumb';
import { toast } from 'sonner';

// Định nghĩa kiểu dữ liệu cho lỗi
interface FormErrors {
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
}

const AboutSection = () => {
    const { lang } = useLanguageStore();
    const t = footerText[lang].footer;
    const aboutSection = aboutSectionText[lang];
    const bannerSection = bannerSectionText[lang];

    // --- STATES ---
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [countdown, setCountdown] = useState(0); // Đếm ngược thời gian chống spam

    // --- LOGIC CHỐNG SPAM ---
    // Kiểm tra xem người dùng có vừa gửi mail gần đây không (trong vòng 60s)
    useEffect(() => {
        const lastSent = localStorage.getItem('last_contact_sent');
        if (lastSent) {
            const diff = Date.now() - parseInt(lastSent);
            if (diff < 60000) {
                setCountdown(Math.ceil((60000 - diff) / 1000));
            }
        }
    }, []);

    // Xử lý bộ đếm ngược
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // --- VALIDATION LOGIC ---
    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!formData.name.trim()) {
            newErrors.name = lang === 'vi' ? "Vui lòng nhập họ tên" : "Name is required";
        }
        if (!formData.email.trim()) {
            newErrors.email = lang === 'vi' ? "Vui lòng nhập email" : "Email is required";
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = lang === 'vi' ? "Email không đúng định dạng" : "Invalid email format";
        }
        if (!formData.subject.trim()) {
            newErrors.subject = lang === 'vi' ? "Vui lòng nhập chủ đề" : "Subject is required";
        }
        if (!formData.message.trim()) {
            newErrors.message = lang === 'vi' ? "Nội dung lời nhắn không được để trống" : "Message cannot be empty";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Chặn nếu đang trong thời gian cooldown chống spam
        if (countdown > 0) {
            toast.warning(lang === 'vi' ? `Vui lòng đợi ${countdown}s trước khi gửi lại.` : `Please wait ${countdown}s.`);
            return;
        }

        // 2. Chạy validate
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            await sendMail(formData);
            
            // Thành công: Thông báo, reset form và đặt cooldown chống spam
            toast.success(lang === 'vi' ? "✅ Gửi thành công! Chúng tôi sẽ phản hồi sớm." : "✅ Sent successfully!");
            localStorage.setItem('last_contact_sent', Date.now().toString());
            setCountdown(60); 
            
            setFormData({ name: '', email: '', subject: '', message: '' });
            setErrors({});
        } catch (error) {
            console.error("Mail Error:", error);
            toast.error(lang === 'vi' ? "❌ Lỗi hệ thống, vui lòng thử lại sau." : "❌ Error, please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- RENDER HELPER ---
    // Component nhỏ hiển thị lỗi dưới input để code chính gọn hơn
    const ErrorLabel = ({ message }: { message?: string }) => (
        <AnimatePresence>
            {message && (
                <motion.span 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-red-500 text-[11px] font-medium flex items-center gap-1 mt-1 ml-1"
                >
                    <AlertCircle size={12} /> {message}
                </motion.span>
            )}
        </AnimatePresence>
    );

    return (
        <div className="bg-white min-h-screen">
            {/* 1. BREADCRUMB */}
            <section className="py-12 container mx-auto px-6">
                <Breadcrumb paths={[{ label: bannerSection.title }]} />
            </section>

            {/* 2. OFFICE LOCATION & MAP */}
            <section className="pb-20 bg-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/world-map.png')] grayscale" />
                <div className="container mx-auto px-6 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* THÔNG TIN CHI TIẾT */}
                        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 rounded-2xl bg-green-700 flex items-center justify-center text-white shadow-lg shadow-green-100">
                                    <MapPin size={28} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-green-700 uppercase tracking-[0.2em]">{t.headquarterLabel}</p>
                                    <h3 className="text-2xl md:text-3xl font-black text-[#0b2a59] uppercase">{t.hcmBranchLabel}</h3>
                                </div>
                            </div>

                            <div className="space-y-8 border-l-2 border-green-100 pl-8 ml-7 text-left">
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.officeAddress}</p>
                                    <p className="text-lg text-slate-700 leading-relaxed font-medium">{companyConfig.address.headquarter[lang]}</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email</p>
                                        <p className="text-slate-900 font-bold flex items-center gap-2">
                                            <Mail size={16} className="text-green-600" /> {companyConfig.email.contact}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hotline</p>
                                        <p className="text-slate-900 font-bold flex items-center gap-2">
                                            <Phone size={16} className="text-green-600" /> {companyConfig.hotline}
                                        </p>
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <a href={companyConfig.urlMapGoogle} target="_blank" rel="noreferrer"
                                       className="inline-flex items-center gap-3 px-6 py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-green-700 transition-all duration-300 shadow-xl">
                                        {aboutSection.openGoogleMaps} <ArrowUpRight size={16} />
                                    </a>
                                </div>
                            </div>
                        </motion.div>

                        {/* BẢN ĐỒ */}
                        <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                                    className="relative h-[400px] w-full rounded-[40px] overflow-hidden shadow-2xl border-8 border-slate-50">
                            <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4602324225!2d106.6648812758832!3d10.776019359198188!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752edca2695555%3A0x6e9a66d8e8412e84!2sCompany%20Name!5e0!3m2!1svi!2s!4v1700000000000!5m2!1svi!2s" 
                                    className="absolute inset-0 w-full h-full border-none" allowFullScreen loading="lazy" title="office-map" />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 3. CONTACT FORM SECTION */}
            <section className="py-24 bg-slate-50 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="bg-white shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-100">
                        {/* Sidebar mời gọi */}
                        <div className="md:w-2/5 bg-green-700 p-12 text-white flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                            <div className="relative z-10 text-left">
                                <h2 className="text-4xl font-black leading-tight mb-6 uppercase">
                                    {lang === 'vi' ? "Gửi tin nhắn cho chúng tôi" : "Get in touch with us"}
                                </h2>
                                <p className="text-green-50/80 leading-relaxed font-medium mb-8">
                                    {lang === 'vi' 
                                        ? "Đừng ngần ngại liên hệ! Chúng tôi luôn sẵn sàng lắng nghe và hợp tác cùng bạn." 
                                        : "Don't hesitate to reach out! We are ready to listen and collaborate."}
                                </p>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><MessageCircle size={20} /></div>
                                        <p className="text-sm font-bold">{lang === 'vi' ? "Hỗ trợ 24/7" : "Support 24/7"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* FORM CHÍNH */}
                        <div className="md:w-3/5 p-8 md:p-12">
                            <form onSubmit={handleSubmit} className="space-y-5 text-left">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    {/* Input Họ Tên */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Họ và tên</label>
                                        <div className="relative">
                                            <User className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.name ? 'text-red-400' : 'text-slate-300'}`} size={18} />
                                            <input
                                                type="text"
                                                value={formData.name}
                                                placeholder="Nguyễn Văn A"
                                                className={`w-full pl-12 pr-4 py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:bg-white transition-all 
                                                    ${errors.name ? 'border-red-300 ring-4 ring-red-50' : 'border-slate-100 focus:border-green-500'}`}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, name: e.target.value });
                                                    if (errors.name) setErrors({ ...errors, name: undefined }); // Xóa lỗi khi gõ
                                                }}
                                            />
                                        </div>
                                        <ErrorLabel message={errors.name} />
                                    </div>

                                    {/* Input Email */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email</label>
                                        <div className="relative">
                                            <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.email ? 'text-red-400' : 'text-slate-300'}`} size={18} />
                                            <input
                                                type="email"
                                                value={formData.email}
                                                placeholder="example@gmail.com"
                                                className={`w-full pl-12 pr-4 py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:bg-white transition-all 
                                                    ${errors.email ? 'border-red-300 ring-4 ring-red-50' : 'border-slate-100 focus:border-green-500'}`}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, email: e.target.value });
                                                    if (errors.email) setErrors({ ...errors, email: undefined });
                                                }}
                                            />
                                        </div>
                                        <ErrorLabel message={errors.email} />
                                    </div>
                                </div>

                                {/* Chủ đề */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Chủ đề</label>
                                    <div className="relative">
                                        <Edit3 className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.subject ? 'text-red-400' : 'text-slate-300'}`} size={18} />
                                        <input
                                            type="text"
                                            value={formData.subject}
                                            placeholder={lang === 'vi' ? "Tôi muốn hợp tác..." : "I want to collaborate..."}
                                            className={`w-full pl-12 pr-4 py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:bg-white transition-all 
                                                ${errors.subject ? 'border-red-300 ring-4 ring-red-50' : 'border-slate-100 focus:border-green-500'}`}
                                            onChange={(e) => {
                                                setFormData({ ...formData, subject: e.target.value });
                                                if (errors.subject) setErrors({ ...errors, subject: undefined });
                                            }}
                                        />
                                    </div>
                                    <ErrorLabel message={errors.subject} />
                                </div>

                                {/* Lời nhắn */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Lời nhắn</label>
                                    <textarea
                                        rows={4}
                                        value={formData.message}
                                        placeholder={lang === 'vi' ? "Nội dung chi tiết..." : "How can we help?"}
                                        className={`w-full p-4 bg-slate-50 border rounded-2xl focus:outline-none focus:bg-white transition-all resize-none 
                                            ${errors.message ? 'border-red-300 ring-4 ring-red-50' : 'border-slate-100 focus:border-green-500'}`}
                                        onChange={(e) => {
                                            setFormData({ ...formData, message: e.target.value });
                                            if (errors.message) setErrors({ ...errors, message: undefined });
                                        }}
                                    />
                                    <ErrorLabel message={errors.message} />
                                </div>

                                {/* Nút Gửi */}
                                <button
                                    type="submit"
                                    disabled={isSubmitting || countdown > 0}
                                    className={`group w-full py-5 text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all duration-300 flex items-center justify-center gap-3 shadow-xl 
                                        ${(isSubmitting || countdown > 0) 
                                            ? 'bg-slate-400 cursor-not-allowed shadow-none' 
                                            : 'bg-green-600 hover:bg-slate-900 shadow-green-100 hover:shadow-slate-200'}`}
                                >
                                    {isSubmitting ? (lang === 'vi' ? "Đang xử lý..." : "Processing...") : 
                                     countdown > 0 ? (lang === 'vi' ? `Chờ ${countdown}s` : `Wait ${countdown}s`) :
                                     (lang === 'vi' ? "Gửi yêu cầu ngay" : "Send Message")}
                                    {!isSubmitting && countdown === 0 && <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
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