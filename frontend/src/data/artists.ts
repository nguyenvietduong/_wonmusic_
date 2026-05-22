// src/data/artists.ts

export interface Artist {
    id: string;
    name: string;
    avatar?: string;
    bio?: string;
    genre?: string;
    followers?: string;
    verified?: boolean;
    socialLinks?: {
        facebook?: string;
        instagram?: string;
        youtube?: string;
        tiktok?: string;
    };
}

export const ARTISTS: Artist[] = [
    {
        id: "artist-1",
        name: "Sơn Tùng M-TP",
        avatar: "/covers/sontung-avatar.jpg",
        bio: "Ca sĩ, nhạc sĩ người Việt Nam nổi tiếng với dòng nhạc Pop, R&B.",
        genre: "Pop / R&B",
        followers: "12.4M",
        verified: true,
        socialLinks: {
            facebook:  "https://facebook.com/sontungmtp",
            instagram: "https://instagram.com/sontungmtp",
            youtube:   "https://youtube.com/sontungmtp",
        },
    },
    {
        id: "artist-2",
        name: "Hoàng Thùy Linh",
        avatar: "/covers/hoangthuylinh-avatar.jpg",
        bio: "Ca sĩ, diễn viên với phong cách âm nhạc độc đáo kết hợp dân gian hiện đại.",
        genre: "Pop / Folk",
        followers: "5.2M",
        verified: true,
        socialLinks: {
            facebook:  "https://facebook.com/hoangthuyli nh",
            instagram: "https://instagram.com/hoangthuyli nh",
        },
    },
];