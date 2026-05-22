import { useRef } from "react";
import "@/styles/music-theme.css";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { musicServicesText } from "@/locales/home/musicServices";

const ServicesSection = () => {
    const sectionRef = useRef<HTMLDivElement>(null);
    const lang = useLanguageStore((s) => s.lang);
    const t = musicServicesText[lang];

    return (
        <section className="music-section services-section" ref={sectionRef}>
            <div className="music-container">
                <div className="section-label">
                    <span className="section-line" />
                    <span className="section-tag">{t.label}</span>
                </div>

                <h2 className="section-title">
                    {t.heading}<br />
                    <span className="text-green">{t.highlight}</span>
                </h2>

                <p className="section-desc">
                    {t.desc}
                </p>

                <div className="services-grid">
                    {t.services.map((service, idx) => (
                        <div
                            key={idx}
                            className="service-card"
                            style={{ animationDelay: `${idx * 0.08}s` }}
                        >
                            <div className="service-icon-wrap">
                                <span className="service-icon">{service.icon}</span>
                            </div>
                            <h3 className="service-title">{service.title}</h3>
                            <p className="service-desc">{service.desc}</p>
                            <span className="service-tag">{service.tag}</span>
                            <div
                                className="service-card-glow"
                                style={{ background: service.accent }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ServicesSection;