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
    emailjsServiceId:     string;
    emailjsTemplateId:    string;
    emailjsPublicKey:     string;
    emailjsToEmail:       string;
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
    emailjsServiceId:     "",
    emailjsTemplateId:    "",
    emailjsPublicKey:     "",
    emailjsToEmail:       "",
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
                set({ ...res.data.data, loaded: true });
            }
        } catch { /* keep defaults */ }
        finally { set({ loading: false }); }
    },

    update: (data) => set(data),
}));
