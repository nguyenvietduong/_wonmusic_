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
    // About page — Mission section
    aboutMissionHeadingVi:   string;
    aboutMissionHighlightVi: string;
    aboutMissionHeadingEn:   string;
    aboutMissionHighlightEn: string;
    // About page — Services section
    aboutServicesVi: string; // JSON [{icon,title,desc}]
    aboutServicesEn: string;
    // About page — CTA section
    aboutCtaHeadingVi:   string;
    aboutCtaHighlightVi: string;
    aboutCtaHeadingEn:   string;
    aboutCtaHighlightEn: string;
    // EmailJS
    emailjsServiceId:     string;
    emailjsTemplateId:    string;
    emailjsPublicKey:     string;
    emailjsToEmail:       string;
    // Homepage — Slider
    sliderBoldLine:       string;
    sliderSpotifyUrl:     string;
    sliderSoundcloudUrl:  string;
    sliderAppleUrl:       string;
    // Homepage — Services section
    homepageSvcLabelVi:     string;
    homepageSvcHeadingVi:   string;
    homepageSvcHighlightVi: string;
    homepageSvcDescVi:      string;
    homepageSvcLabelEn:     string;
    homepageSvcHeadingEn:   string;
    homepageSvcHighlightEn: string;
    homepageSvcDescEn:      string;
    homepageServicesVi:     string; // JSON — [{icon,title,desc,tag,accent}]
    homepageServicesEn:     string; // JSON — [{icon,title,desc,tag,accent}]
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
        // About page — Mission section
        aboutMissionHeadingVi:   { type: String, default: "" },
        aboutMissionHighlightVi: { type: String, default: "" },
        aboutMissionHeadingEn:   { type: String, default: "" },
        aboutMissionHighlightEn: { type: String, default: "" },
        // About page — Services section
        aboutServicesVi: { type: String, default: "" },
        aboutServicesEn: { type: String, default: "" },
        // About page — CTA section
        aboutCtaHeadingVi:   { type: String, default: "" },
        aboutCtaHighlightVi: { type: String, default: "" },
        aboutCtaHeadingEn:   { type: String, default: "" },
        aboutCtaHighlightEn: { type: String, default: "" },
        // EmailJS
        emailjsServiceId:    { type: String, default: "" },
        emailjsTemplateId:   { type: String, default: "" },
        emailjsPublicKey:    { type: String, default: "" },
        emailjsToEmail:      { type: String, default: "" },
        // Homepage — Slider
        sliderBoldLine:      { type: String, default: "TO US DAILY" },
        sliderSpotifyUrl:    { type: String, default: "" },
        sliderSoundcloudUrl: { type: String, default: "" },
        sliderAppleUrl:      { type: String, default: "" },
        // Homepage — Services
        homepageSvcLabelVi:     { type: String, default: "" },
        homepageSvcHeadingVi:   { type: String, default: "" },
        homepageSvcHighlightVi: { type: String, default: "" },
        homepageSvcDescVi:      { type: String, default: "" },
        homepageSvcLabelEn:     { type: String, default: "" },
        homepageSvcHeadingEn:   { type: String, default: "" },
        homepageSvcHighlightEn: { type: String, default: "" },
        homepageSvcDescEn:      { type: String, default: "" },
        homepageServicesVi:     { type: String, default: "" },
        homepageServicesEn:     { type: String, default: "" },
        // Homepage — Artists section
        artistsHeadingVi:    { type: String, default: "" },
        artistsHighlightVi:  { type: String, default: "" },
        artistsHeadingEn:    { type: String, default: "" },
        artistsHighlightEn:  { type: String, default: "" },
        // Homepage — Charts section
        chartsHighlightVi:   { type: String, default: "" },
        chartsHeadingVi:     { type: String, default: "" },
        chartsHighlightEn:   { type: String, default: "" },
        chartsHeadingEn:     { type: String, default: "" },
        chartsLimitDay:      { type: Number, default: 5  },
        chartsLimitWeek:     { type: Number, default: 8  },
        chartsLimitMonth:    { type: Number, default: 6  },
        // Contact page — Banner
        contactBannerSubtitleVi: { type: String, default: "" },
        contactBannerSubtitleEn: { type: String, default: "" },
        contactBannerTitleVi:    { type: String, default: "" },
        contactBannerTitleEn:    { type: String, default: "" },
        // Contact page — Info
        contactAddressEn:    { type: String, default: "" },
        contactMapUrl:       { type: String, default: "" },
        contactWorkingHours: { type: String, default: "" },
        // Contact page — SEO
        contactSeoTitleVi: { type: String, default: "" },
        contactSeoTitleEn: { type: String, default: "" },
        contactSeoDescVi:  { type: String, default: "" },
        contactSeoDescEn:  { type: String, default: "" },
        // Contact page — Location section headings
        contactLocationLabelVi:     { type: String, default: "" },
        contactLocationLabelEn:     { type: String, default: "" },
        contactLocationHeadingVi:   { type: String, default: "" },
        contactLocationHeadingEn:   { type: String, default: "" },
        contactLocationHighlightVi: { type: String, default: "" },
        contactLocationHighlightEn: { type: String, default: "" },
        // Contact page — Form section headings
        contactFormLabelVi:     { type: String, default: "" },
        contactFormLabelEn:     { type: String, default: "" },
        contactFormHeadingVi:   { type: String, default: "" },
        contactFormHeadingEn:   { type: String, default: "" },
        contactFormHighlightVi: { type: String, default: "" },
        contactFormHighlightEn: { type: String, default: "" },
        // Artists page — SEO
        artistsSeoTitleVi: { type: String, default: "" },
        artistsSeoTitleEn: { type: String, default: "" },
        artistsSeoDescVi:  { type: String, default: "" },
        artistsSeoDescEn:  { type: String, default: "" },
        // Charts page — SEO
        chartsSeoTitleVi: { type: String, default: "" },
        chartsSeoTitleEn: { type: String, default: "" },
        chartsSeoDescVi:  { type: String, default: "" },
        chartsSeoDescEn:  { type: String, default: "" },
        wonmediaUrl:            { type: String, default: "" },
    },
    { timestamps: true }
);

// Xóa cache khi schema thay đổi (hot-reload trong dev, không chạy trong production)
if (process.env.NODE_ENV !== "production" && mongoose.models.SiteSettings) {
    delete (mongoose.models as Record<string, unknown>).SiteSettings;
}

export default mongoose.model<ISiteSettings>("SiteSettings", SiteSettingsSchema);
