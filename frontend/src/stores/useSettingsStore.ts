import { create } from "zustand";
import axios from "axios";

interface SiteSettings {
    siteName:           string;
    tagline:            string;
    logoUrl:            string;
    logoBlackUrl:       string;
    faviconUrl:         string;
    facebook:           string;
    instagram:          string;
    youtube:            string;
    tiktok:             string;
    metaTitle:          string;
    metaDescription:    string;
    contactEmail:       string;
    contactPhone:       string;
    contactAddress:     string;
    aboutHeroSubtitle:    string;
    aboutMissionP1:       string;
    aboutMissionP2:       string;
    aboutCtaSubtitle:     string;
    aboutHeroSubtitleEn:  string;
    aboutMissionP1En:     string;
    aboutMissionP2En:     string;
    aboutCtaSubtitleEn:   string;
    aboutStats:           string;
    aboutTeam:            string;
    // About page — Mission section
    aboutMissionHeadingVi:   string;
    aboutMissionHighlightVi: string;
    aboutMissionHeadingEn:   string;
    aboutMissionHighlightEn: string;
    // About page — Services section
    aboutServicesVi: string;
    aboutServicesEn: string;
    // About page — CTA section
    aboutCtaHeadingVi:   string;
    aboutCtaHighlightVi: string;
    aboutCtaHeadingEn:   string;
    aboutCtaHighlightEn: string;
    emailjsServiceId:     string;
    emailjsTemplateId:    string;
    emailjsPublicKey:     string;
    emailjsToEmail:       string;
    // Homepage — Slider
    sliderBoldLine:       string;
    sliderSpotifyUrl:     string;
    sliderSoundcloudUrl:  string;
    sliderAppleUrl:       string;
    // Homepage — Services
    homepageSvcLabelVi:     string;
    homepageSvcHeadingVi:   string;
    homepageSvcHighlightVi: string;
    homepageSvcDescVi:      string;
    homepageSvcLabelEn:     string;
    homepageSvcHeadingEn:   string;
    homepageSvcHighlightEn: string;
    homepageSvcDescEn:      string;
    homepageServicesVi:     string;
    homepageServicesEn:     string;
    // Homepage — Artists section
    artistsHeadingVi:    string;
    artistsHighlightVi:  string;
    artistsHeadingEn:    string;
    artistsHighlightEn:  string;
    // Homepage — Charts section
    chartsHighlightVi:   string;
    chartsHeadingVi:     string;
    chartsHighlightEn:   string;
    chartsHeadingEn:     string;
    chartsLimitDay:      number;
    chartsLimitWeek:     number;
    chartsLimitMonth:    number;
    // Contact page — Banner
    contactBannerSubtitleVi: string;
    contactBannerSubtitleEn: string;
    contactBannerTitleVi:    string;
    contactBannerTitleEn:    string;
    // Contact page — Info
    contactAddressEn:    string;
    contactMapUrl:       string;
    contactWorkingHours: string;
    // Contact page — SEO
    contactSeoTitleVi: string;
    contactSeoTitleEn: string;
    contactSeoDescVi:  string;
    contactSeoDescEn:  string;
    // Contact page — Location section headings
    contactLocationLabelVi:     string;
    contactLocationLabelEn:     string;
    contactLocationHeadingVi:   string;
    contactLocationHeadingEn:   string;
    contactLocationHighlightVi: string;
    contactLocationHighlightEn: string;
    // Contact page — Form section headings
    contactFormLabelVi:     string;
    contactFormLabelEn:     string;
    contactFormHeadingVi:   string;
    contactFormHeadingEn:   string;
    contactFormHighlightVi: string;
    contactFormHighlightEn: string;
    // Artists page — SEO
    artistsSeoTitleVi: string;
    artistsSeoTitleEn: string;
    artistsSeoDescVi:  string;
    artistsSeoDescEn:  string;
    // Charts page — SEO
    chartsSeoTitleVi: string;
    chartsSeoTitleEn: string;
    chartsSeoDescVi:  string;
    chartsSeoDescEn:  string;
    // Floating phone button — Wonmedia link
    wonmediaUrl: string;
}

interface SettingsState extends SiteSettings {
    loaded:  boolean;
    loading: boolean;
    fetch:   () => Promise<void>;
    update:  (data: Partial<SiteSettings>) => void;
}

const DEFAULTS: SiteSettings = {
    siteName:           "Won Music",
    tagline:            "Nghe nhạc mọi lúc, mọi nơi",
    logoUrl:            "/logo.png",
    logoBlackUrl:       "/logoBlack.png",
    faviconUrl:         "/favicon.ico",
    facebook:           "",
    instagram:          "",
    youtube:            "",
    tiktok:             "",
    metaTitle:          "Won Music – Nghe nhạc trực tuyến",
    metaDescription:    "",
    contactEmail:       "",
    contactPhone:       "",
    contactAddress:     "",
    aboutHeroSubtitle:    "",
    aboutMissionP1:       "",
    aboutMissionP2:       "",
    aboutCtaSubtitle:     "",
    aboutHeroSubtitleEn:  "",
    aboutMissionP1En:     "",
    aboutMissionP2En:     "",
    aboutCtaSubtitleEn:   "",
    aboutStats:           "",
    aboutTeam:            "",
    aboutMissionHeadingVi:   "",
    aboutMissionHighlightVi: "",
    aboutMissionHeadingEn:   "",
    aboutMissionHighlightEn: "",
    aboutServicesVi: "",
    aboutServicesEn: "",
    aboutCtaHeadingVi:   "",
    aboutCtaHighlightVi: "",
    aboutCtaHeadingEn:   "",
    aboutCtaHighlightEn: "",
    emailjsServiceId:     "",
    emailjsTemplateId:    "",
    emailjsPublicKey:     "",
    emailjsToEmail:       "",
    sliderBoldLine:       "TO US DAILY",
    sliderSpotifyUrl:     "",
    sliderSoundcloudUrl:  "",
    sliderAppleUrl:       "",
    homepageSvcLabelVi:     "",
    homepageSvcHeadingVi:   "",
    homepageSvcHighlightVi: "",
    homepageSvcDescVi:      "",
    homepageSvcLabelEn:     "",
    homepageSvcHeadingEn:   "",
    homepageSvcHighlightEn: "",
    homepageSvcDescEn:      "",
    homepageServicesVi:     "",
    homepageServicesEn:     "",
    artistsHeadingVi:    "",
    artistsHighlightVi:  "",
    artistsHeadingEn:    "",
    artistsHighlightEn:  "",
    chartsHighlightVi:   "",
    chartsHeadingVi:     "",
    chartsHighlightEn:   "",
    chartsHeadingEn:     "",
    chartsLimitDay:      5,
    chartsLimitWeek:     8,
    chartsLimitMonth:    6,
    contactBannerSubtitleVi: "",
    contactBannerSubtitleEn: "",
    contactBannerTitleVi:    "",
    contactBannerTitleEn:    "",
    contactAddressEn:    "",
    contactMapUrl:       "",
    contactWorkingHours: "",
    contactSeoTitleVi: "",
    contactSeoTitleEn: "",
    contactSeoDescVi:  "",
    contactSeoDescEn:  "",
    contactLocationLabelVi:     "",
    contactLocationLabelEn:     "",
    contactLocationHeadingVi:   "",
    contactLocationHeadingEn:   "",
    contactLocationHighlightVi: "",
    contactLocationHighlightEn: "",
    contactFormLabelVi:     "",
    contactFormLabelEn:     "",
    contactFormHeadingVi:   "",
    contactFormHeadingEn:   "",
    contactFormHighlightVi: "",
    contactFormHighlightEn: "",
    artistsSeoTitleVi: "",
    artistsSeoTitleEn: "",
    artistsSeoDescVi:  "",
    artistsSeoDescEn:  "",
    chartsSeoTitleVi: "",
    chartsSeoTitleEn: "",
    chartsSeoDescVi:  "",
    chartsSeoDescEn:  "",
    wonmediaUrl:            "",
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
    ...DEFAULTS,
    loaded:  false,
    loading: false,

    fetch: async () => {
        if (get().loaded || get().loading) return;
        set({ loading: true });
        try {
            const res = await axios.get("/api/settings");
            if (res.data?.success) {
                set({ ...res.data.data, loaded: true, loading: false });
            } else {
                set({ loaded: true, loading: false });
            }
        } catch {
            set({ loaded: true, loading: false });
        }
    },

    update: (data) => set(data),
}));
