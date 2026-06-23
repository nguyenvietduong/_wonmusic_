'use client';
import { useEffect } from "react";
import SEO from "@/components/frontend/SEO";
import AboutSection from "@/components/frontend/Contact/AboutSection";
import PageBannerSection from "@/components/frontend/Contact/PageBannerSection";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { contactPageText } from "@/locales/contactPage";
import { useSettingsStore } from "@/stores/useSettingsStore";

export default function ContactPage() {
    const { lang } = useLanguageStore();
    const t = contactPageText[lang];
    const {
        contactSeoTitleVi, contactSeoTitleEn,
        contactSeoDescVi, contactSeoDescEn,
        loaded, fetch: fetchSettings,
    } = useSettingsStore();

    useEffect(() => { if (!loaded) fetchSettings(); }, [loaded, fetchSettings]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    const isEn = lang === "en";
    const seoTitle = (isEn ? contactSeoTitleEn : contactSeoTitleVi) || t.seo.title;
    const seoDesc  = (isEn ? contactSeoDescEn  : contactSeoDescVi)  || t.seo.description;

    return (
        <>
            <SEO
                title={seoTitle}
                description={seoDesc}
                canonical="https://www.wonmedia.vn/lien-he"
                type="website"
            />

            <PageBannerSection />

            <AboutSection />
        </>
    );
}
