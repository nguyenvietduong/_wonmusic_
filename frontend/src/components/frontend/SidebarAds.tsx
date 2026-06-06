import { blogTranslations } from '@/locales/blogTranslation';
import { useLanguageStore } from '@/stores/useLanguageStore';

const SidebarAds = () => {
    const { lang } = useLanguageStore();
    const t = blogTranslations[lang].sidebar.ads;

    return (
        <div className="rounded-3xl p-8 text-white relative overflow-hidden group shadow-xl" style={{ background:"linear-gradient(135deg,#00A98F,#007D69)", boxShadow:"0 20px 48px rgba(0,169,143,0.3)" }}>
            {/* Hiệu ứng Decor phía sau */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-700"></div>
            <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-black/10 rounded-full blur-xl group-hover:bg-black/20 transition-all duration-700"></div>

            {/* Nội dung */}
            <div className="relative z-10">
                <h4
                    className="text-xl font-black mb-4 uppercase leading-tight tracking-tight"
                    dangerouslySetInnerHTML={{ __html: t.title }}
                />

                <p className="text-white/80 text-sm mb-6 leading-relaxed">
                    {t.description}
                </p>

                <a
                    href={t.link}
                    className="inline-block bg-white text-[#007D69] px-6 py-3 rounded-xl font-black text-[11px] uppercase tracking-[0.1em] hover:bg-[#f0faf8] hover:scale-105 active:scale-95 transition-all shadow-lg"
                >
                    {t.buttonText}
                </a>
            </div>

            {/* Một chút hiệu ứng ánh sáng chạy ngang khi hover */}
            <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
        </div>
    );
};

export default SidebarAds;