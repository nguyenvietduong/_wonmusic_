import { Helmet } from "react-helmet-async";
import { useLanguageStore } from "@/stores/useLanguageStore";

const DEFAULT_IMAGE = "/og-image.jpg";
const SITE_NAME     = "Won Music";
const LOGO_URL      = "https://www.wonmusic.vn/logo.png";
const TWITTER_SITE  = "@wonmusic_vn";

interface SEOProps {
    title: string;
    description: string;
    canonical: string;
    image?: string;
    imageAlt?: string;
    type?: "website" | "artist";
    name?: string;
    genre?: string;
    robots?: string;
}

export default function SEO({
    title,
    description,
    canonical,
    image,
    imageAlt,
    type = "website",
    name,
    genre,
    robots = "index, follow",
}: SEOProps) {
    const { lang } = useLanguageStore();
    const ogLocale    = lang === "en" ? "en_US" : "vi_VN";
    const resolvedImg = image || DEFAULT_IMAGE;
    const resolvedAlt = imageAlt || title;
    const schemaName  = name || title.split("|")[0].trim();

    const schema = type === "artist"
        ? {
            "@context": "https://schema.org",
            "@type": "MusicGroup",
            name: schemaName,
            description,
            url: canonical,
            image: resolvedImg,
            ...(genre ? { genre } : {}),
        }
        : {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: schemaName,
            description,
            url: canonical,
            image: resolvedImg,
            publisher: {
                "@type": "Organization",
                name: SITE_NAME,
                logo: { "@type": "ImageObject", url: LOGO_URL },
            },
        };

    return (
        <Helmet>
            {/* Basic */}
            <title>{title}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={canonical} />
            <meta name="robots" content={robots} />

            {/* Open Graph */}
            <meta property="og:locale" content={ogLocale} />
            <meta property="og:type" content="website" />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:url" content={canonical} />
            <meta property="og:site_name" content={SITE_NAME} />
            <meta property="og:image" content={resolvedImg} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:alt" content={resolvedAlt} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:site" content={TWITTER_SITE} />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={resolvedImg} />
            <meta name="twitter:image:alt" content={resolvedAlt} />

            {/* Schema.org */}
            <script type="application/ld+json">{JSON.stringify(schema)}</script>

            {/* Preload hero image */}
            <link rel="preload" href={resolvedImg} as="image" />
        </Helmet>
    );
}
