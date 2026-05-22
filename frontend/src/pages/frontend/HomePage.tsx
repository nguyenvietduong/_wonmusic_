import { useLocation }                  from "react-router-dom";
import { useState, useRef, useEffect }  from "react";

import SEO                              from "@/components/frontend/SEO";
import Slider                           from "@/components/frontend/Slider";

// Music Sections
import ServicesSection                  from "@/components/frontend/Home/ServicesSection";
import FeaturedTrackSection             from "@/components/frontend/Home/FeaturedTrackSection";
import ArtistsSection                   from "@/components/frontend/Home/ArtistsSection";
import ChartsSection                    from "@/components/frontend/Home/ChartsSection";

const allSections = [
    ServicesSection,
    FeaturedTrackSection,
    ArtistsSection,
    ChartsSection,
];

const BATCH_SIZE = 4;

const HomePage = () => {
    const [loadedCount, setLoadedCount] = useState(BATCH_SIZE);
    const triggerRef = useRef<HTMLDivElement>(null);
    const location = useLocation();
    const shouldShowIntro = Boolean(location.state?.fromLanding);
    const [showLoading, setShowLoading] = useState(shouldShowIntro);

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

    useEffect(() => {
        if (typeof window !== "undefined") {
            window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
        }
    }, []);

    useEffect(() => {
        if (!shouldShowIntro) return;
        const timer = setTimeout(() => {
            setShowLoading(false);
            window.history.replaceState({}, document.title);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        document.body.style.overflow = showLoading ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [showLoading]);

    return (
        <>
            <SEO
                title="Won Music – Nền Tảng Âm Nhạc Hàng Đầu Việt Nam"
                description="Won Music cung cấp dịch vụ nghe nhạc trực tuyến, phát hành và quản lý bản quyền âm nhạc, kết nối nghệ sĩ với khán giả trên mọi nền tảng."
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