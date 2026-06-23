'use client';
import { useState, useRef, useEffect }  from "react";

import SEO                              from "@/components/frontend/SEO";
import Slider                           from "@/components/frontend/Slider";
import { useSettingsStore }             from "@/stores/useSettingsStore";

// Music Sections
import ServicesSection                  from "@/components/frontend/Home/ServicesSection";
import ArtistsSection                   from "@/components/frontend/Home/ArtistsSection";
import ChartsSection                    from "@/components/frontend/Home/ChartsSection";

const allSections = [
    ServicesSection,
    ArtistsSection,
    ChartsSection,
];

const BATCH_SIZE = 4;

const HomePage = () => {
    const { metaTitle, metaDescription } = useSettingsStore();
    const [loadedCount, setLoadedCount] = useState(BATCH_SIZE);
    const triggerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    useEffect(() => {
        if (!triggerRef.current) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setLoadedCount((prev) => Math.min(prev + BATCH_SIZE, allSections.length));
                }
            },
            { threshold: 0.2 }
        );
        observer.observe(triggerRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <>
            <SEO
                title={metaTitle || "Won Music – Nền Tảng Âm Nhạc Hàng Đầu Việt Nam"}
                description={metaDescription || "Won Music cung cấp dịch vụ nghe nhạc trực tuyến, phát hành và quản lý bản quyền âm nhạc, kết nối nghệ sĩ với khán giả trên mọi nền tảng."}
                canonical="https://www.wonmusic.vn/"
                type="website"
            />

            <Slider />

            {/* Các section load lazy */}
            {allSections.slice(0, loadedCount).map((Section, idx) => (
                <Section key={idx} />
            ))}

            {loadedCount < allSections.length && (
                <div ref={triggerRef} className="h-px" />
            )}
        </>
    );
};

export default HomePage;