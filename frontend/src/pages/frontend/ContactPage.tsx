'use client';
import { useEffect } from "react";
import SEO from "@/components/frontend/SEO";
import AboutSection from "@/components/frontend/Contact/AboutSection";
import PageBannerSection from "@/components/frontend/Contact/PageBannerSection";

export default function AboutPage() {
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    return (
        <>
            <SEO
                title="Liên Hệ WON Media – Tư Vấn Nội Dung Số, Quản Lý Kênh & Bản Quyền"
                description="Liên hệ WON Media để được tư vấn về sản xuất nội dung số, quản lý kênh đa nền tảng, bảo vệ bản quyền và hợp tác phân phối nội dung trong nước & quốc tế."
                canonical="https://www.wonmedia.vn/lien-he"
                type="website"
            />

            <PageBannerSection />

            <AboutSection />
        </>
    );
}