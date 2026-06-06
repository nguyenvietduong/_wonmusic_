import mongoose, { Schema, Document } from "mongoose";

export interface ISiteSettings extends Document {
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
    // About page — Vietnamese
    aboutHeroSubtitle:    string;
    aboutMissionP1:       string;
    aboutMissionP2:       string;
    aboutCtaSubtitle:     string;
    // About page — English
    aboutHeroSubtitleEn:  string;
    aboutMissionP1En:     string;
    aboutMissionP2En:     string;
    aboutCtaSubtitleEn:   string;
    // About page — shared
    aboutStats:           string; // JSON string — [{value,label,icon}]
    aboutTeam:            string; // JSON string — [{name,role,initials}]
    // EmailJS
    emailjsServiceId:     string;
    emailjsTemplateId:    string;
    emailjsPublicKey:     string;
    emailjsToEmail:       string;
}

const SiteSettingsSchema = new Schema<ISiteSettings>(
    {
        siteName:        { type: String, default: "Won Music" },
        tagline:         { type: String, default: "Nghe nhạc mọi lúc, mọi nơi" },
        logoUrl:         { type: String, default: "/logo.png" },
        logoBlackUrl:    { type: String, default: "/logoBlack.png" },
        faviconUrl:      { type: String, default: "/favicon.ico" },
        facebook:        { type: String, default: "" },
        instagram:       { type: String, default: "" },
        youtube:         { type: String, default: "" },
        tiktok:          { type: String, default: "" },
        metaTitle:       { type: String, default: "Won Music – Nghe nhạc trực tuyến" },
        metaDescription: { type: String, default: "" },
        contactEmail:    { type: String, default: "" },
        contactPhone:    { type: String, default: "" },
        contactAddress:  { type: String, default: "" },
        // About page — Vietnamese
        aboutHeroSubtitle:   { type: String, default: "" },
        aboutMissionP1:      { type: String, default: "" },
        aboutMissionP2:      { type: String, default: "" },
        aboutCtaSubtitle:    { type: String, default: "" },
        // About page — English
        aboutHeroSubtitleEn: { type: String, default: "" },
        aboutMissionP1En:    { type: String, default: "" },
        aboutMissionP2En:    { type: String, default: "" },
        aboutCtaSubtitleEn:  { type: String, default: "" },
        // About page — shared
        aboutStats:          { type: String, default: "" },
        aboutTeam:           { type: String, default: "" },
        // EmailJS
        emailjsServiceId:    { type: String, default: "" },
        emailjsTemplateId:   { type: String, default: "" },
        emailjsPublicKey:    { type: String, default: "" },
        emailjsToEmail:      { type: String, default: "" },
    },
    { timestamps: true }
);

// Xóa cache khi schema thay đổi (hot-reload trong dev, không chạy trong production)
if (process.env.NODE_ENV !== "production" && mongoose.models.SiteSettings) {
    delete (mongoose.models as Record<string, unknown>).SiteSettings;
}

export default mongoose.model<ISiteSettings>("SiteSettings", SiteSettingsSchema);
