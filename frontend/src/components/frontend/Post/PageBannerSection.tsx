import { bannerSectionText } from "@/locales/post/bannerSection";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { motion } from "framer-motion";

const PageBannerSection = () => {
    const { lang } = useLanguageStore();
    const t = bannerSectionText[lang];

    return (
        <div
            className="relative mt-18 sm:mt-18 lg:mt-0 w-full h-60 sm:h-[650px] xl:h-[547px] overflow-hidden text-white select-none z-30"
        >
            {/* Background Image với hiệu ứng Zoom lặp lại khi cuộn */}
            <motion.div
                initial={{ scale: 1.15 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: false }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute inset-0 -z-10"
                style={{
                    backgroundImage: `url('/banners/post-banner.png')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            />

            {/* Overlay mờ dần ra vào */}
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                viewport={{ once: false }}
                transition={{ duration: 1 }}
                className="absolute inset-0 bg-black/60"
            />

            {/* Content Container */}
            <div className="relative group z-10 h-full flex items-center">
                <div className="container mx-auto px-4">
                    <div className="max-w-xl">

                        {/* Subtitle Area: Lướt từ trái sang, biến mất khi cuộn đi */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: false, amount: 0.3 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="flex items-center gap-3 mb-4"
                        >
                            <span
                                className="
                                    w-10 xl:w-20 xl:-ml-24
                                    h-[3px]
                                    bg-green-700
                                    origin-center
                                    transition-all duration-500 ease-out
                                    xl:group-hover:rotate-90
                                "
                            />
                            <span className="text-xl text-gray-200">
                                {t.subtitle}
                            </span>
                        </motion.div>

                        {/* Title: Trượt từ dưới lên + Blur, biến mất khi cuộn đi */}
                        <motion.h1
                            initial={{ opacity: 0, y: 50, filter: "blur(10px)" }}
                            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            viewport={{ once: false, amount: 0.3 }}
                            transition={{
                                duration: 1,
                                delay: 0.4,
                                ease: [0.16, 1, 0.3, 1]
                            }}
                            className="text-3xl sm:text-4xl font-bold uppercase leading-tight"
                        >
                            {t.title}
                        </motion.h1>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PageBannerSection;