// src/seed.js
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import Artist   from './models/Artist.js';
import Album    from './models/Album.js';
import Track    from './models/Track.js';
import Playlist from './models/Playlist.js';

const seedArtists = [
    {
        name:      "Sơn Tùng M-TP",
        avatar:    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/S%C6%A1n_T%C3%B9ng_M-TP.jpg/440px-S%C6%A1n_T%C3%B9ng_M-TP.jpg",
        bio:       "Ca sĩ, nhạc sĩ người Việt Nam nổi tiếng với dòng nhạc Pop, R&B.",
        genre:     "Pop / R&B",
        followers: 12400000,
        verified:  true,
        socialLinks: {
            facebook:  "https://facebook.com/sontungmtp",
            instagram: "https://instagram.com/sontungmtp",
            youtube:   "https://youtube.com/sontungmtp",
        },
    },
    {
        name:      "Hoàng Thùy Linh",
        avatar:    "https://upload.wikimedia.org/wikipedia/commons/4/4e/Ho%C3%A0ng_Th%C3%B9y_Linh_2019.jpg",
        bio:       "Ca sĩ với phong cách âm nhạc kết hợp dân gian hiện đại.",
        genre:     "Pop / Folk",
        followers: 5200000,
        verified:  true,
        socialLinks: {
            facebook:  "https://facebook.com/hoangthuylinhofficial",
            instagram: "https://instagram.com/hoangthuylinh",
        },
    },
    {
        name:      "Đen Vâu",
        avatar:    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Den_Vau.jpg/440px-Den_Vau.jpg",
        bio:       "Rapper, nhạc sĩ với lối viết lời gần gũi, sâu sắc.",
        genre:     "Hip-hop / Rap",
        followers: 4800000,
        verified:  true,
        socialLinks: {
            facebook: "https://facebook.com/denvau",
            youtube:  "https://youtube.com/denvau",
        },
    },
    {
        name:      "MONO",
        avatar:    "https://i.imgur.com/placeholder-mono.jpg",
        bio:       "Ca sĩ trẻ với giọng hát nội lực và phong cách R&B đặc trưng.",
        genre:     "R&B / Pop",
        followers: 3100000,
        verified:  true,
        socialLinks: {
            instagram: "https://instagram.com/mono.wearefriends",
            tiktok:    "https://tiktok.com/@mono",
        },
    },
];

const seedData = async () => {
    try {
        await connectDB();

        // ── Xóa data cũ ──
        await Promise.all([
            Artist.deleteMany({}),
            Album.deleteMany({}),
            Track.deleteMany({}),
            Playlist.deleteMany({}),
        ]);
        console.log("🗑️  Đã xóa data cũ");

        // ── Tạo Artists ──
        const artists = await Artist.insertMany(seedArtists);
        console.log(`✅ Đã tạo ${artists.length} nghệ sĩ`);

        const [sontung, hoangthuylnh, denvau, mono] = artists;

        // ── Tạo Albums ──
        const albums = await Album.insertMany([
            {
                title:       "Sky Tour",
                artistId:    sontung._id,
                coverUrl:    "https://i.imgur.com/placeholder-skytour.jpg",
                releaseYear: 2019,
                genre:       "Pop",
                description: "Album phòng thu đầu tiên của Sơn Tùng M-TP",
            },
            {
                title:       "HOÀNG",
                artistId:    hoangthuylnh._id,
                coverUrl:    "https://i.imgur.com/placeholder-hoang.jpg",
                releaseYear: 2019,
                genre:       "Pop / Folk",
                description: "Album đánh dấu sự trưởng thành của Hoàng Thùy Linh",
            },
            {
                title:       "Mang Tiền Về Cho Mẹ",
                artistId:    denvau._id,
                coverUrl:    "https://i.imgur.com/placeholder-denvau.jpg",
                releaseYear: 2021,
                genre:       "Hip-hop",
                description: "Album gây tiếng vang lớn của Đen Vâu",
            },
            {
                title:       "Tự Tâm",
                artistId:    mono._id,
                coverUrl:    "https://i.imgur.com/placeholder-tutam.jpg",
                releaseYear: 2022,
                genre:       "R&B",
                description: "Album debut của MONO",
            },
        ]);
        console.log(`✅ Đã tạo ${albums.length} album`);

        const [skyTour, hoang, mangTien, tuTam] = albums;

        // ── Tạo Tracks ──
        const tracks = await Track.insertMany([
            // Sơn Tùng
            {
                title:       "Nơi Này Có Anh",
                artistId:    sontung._id,
                albumId:     skyTour._id,
                audioUrl:    "https://drive.google.com/uc?export=download&id=YOUR_FILE_ID_1",
                coverUrl:    "https://i.imgur.com/placeholder-1.jpg",
                duration:    258,
                genre:       "Pop",
                releaseYear: 2017,
                plays:       24000000,
                isPublished: true,
            },
            {
                title:       "Lạc Trôi",
                artistId:    sontung._id,
                albumId:     skyTour._id,
                audioUrl:    "https://drive.google.com/uc?export=download&id=YOUR_FILE_ID_2",
                coverUrl:    "https://i.imgur.com/placeholder-2.jpg",
                duration:    235,
                genre:       "Pop",
                releaseYear: 2017,
                plays:       18000000,
                isPublished: true,
            },
            {
                title:       "Chạy Ngay Đi",
                artistId:    sontung._id,
                albumId:     skyTour._id,
                audioUrl:    "https://drive.google.com/uc?export=download&id=YOUR_FILE_ID_3",
                coverUrl:    "https://i.imgur.com/placeholder-3.jpg",
                duration:    243,
                genre:       "Pop",
                releaseYear: 2018,
                plays:       15000000,
                isPublished: true,
            },
            // Hoàng Thùy Linh
            {
                title:       "Để Mị Nói Cho Mà Nghe",
                artistId:    hoangthuylnh._id,
                albumId:     hoang._id,
                audioUrl:    "https://drive.google.com/uc?export=download&id=YOUR_FILE_ID_4",
                coverUrl:    "https://i.imgur.com/placeholder-4.jpg",
                duration:    210,
                genre:       "Pop / Folk",
                releaseYear: 2019,
                plays:       12000000,
                isPublished: true,
            },
            {
                title:       "Kẻ Cắp Gặp Bà Già",
                artistId:    hoangthuylnh._id,
                albumId:     hoang._id,
                audioUrl:    "https://drive.google.com/uc?export=download&id=YOUR_FILE_ID_5",
                coverUrl:    "https://i.imgur.com/placeholder-5.jpg",
                duration:    198,
                genre:       "Pop / Folk",
                releaseYear: 2019,
                plays:       9000000,
                isPublished: true,
            },
            // Đen Vâu
            {
                title:       "Mang Tiền Về Cho Mẹ",
                artistId:    denvau._id,
                albumId:     mangTien._id,
                audioUrl:    "https://drive.google.com/uc?export=download&id=YOUR_FILE_ID_6",
                coverUrl:    "https://i.imgur.com/placeholder-6.jpg",
                duration:    225,
                genre:       "Hip-hop",
                releaseYear: 2021,
                plays:       20000000,
                isPublished: true,
            },
            {
                title:       "Đưa Nhau Đi Trốn",
                artistId:    denvau._id,
                albumId:     mangTien._id,
                audioUrl:    "https://drive.google.com/uc?export=download&id=YOUR_FILE_ID_7",
                coverUrl:    "https://i.imgur.com/placeholder-7.jpg",
                duration:    214,
                genre:       "Hip-hop",
                releaseYear: 2020,
                plays:       16000000,
                isPublished: true,
            },
            // MONO
            {
                title:       "Waiting For You",
                artistId:    mono._id,
                albumId:     tuTam._id,
                audioUrl:    "https://drive.google.com/uc?export=download&id=YOUR_FILE_ID_8",
                coverUrl:    "https://i.imgur.com/placeholder-8.jpg",
                duration:    232,
                genre:       "R&B",
                releaseYear: 2022,
                plays:       11000000,
                isPublished: true,
            },
            {
                title:       "Tự Tâm",
                artistId:    mono._id,
                albumId:     tuTam._id,
                audioUrl:    "https://drive.google.com/uc?export=download&id=YOUR_FILE_ID_9",
                coverUrl:    "https://i.imgur.com/placeholder-9.jpg",
                duration:    219,
                genre:       "R&B",
                releaseYear: 2022,
                plays:       8000000,
                isPublished: true,
            },
        ]);
        console.log(`✅ Đã tạo ${tracks.length} bài hát`);

        // ── Tạo Playlist ──
        await Playlist.insertMany([
            {
                title:       "Top Hits Việt Nam",
                description: "Những bài hát Việt Nam hot nhất hiện nay",
                coverUrl:    "https://i.imgur.com/placeholder-playlist1.jpg",
                tracks:      tracks.map((t) => t._id),
                isPublic:    true,
            },
            {
                title:       "Nhạc Indie Việt",
                description: "Tuyển tập nhạc indie Việt Nam chất lượng",
                coverUrl:    "https://i.imgur.com/placeholder-playlist2.jpg",
                tracks:      [tracks[3]._id, tracks[4]._id, tracks[5]._id, tracks[6]._id],
                isPublic:    true,
            },
            {
                title:       "Chill & Relax",
                description: "Nhạc thư giãn cho cuối ngày",
                coverUrl:    "https://i.imgur.com/placeholder-playlist3.jpg",
                tracks:      [tracks[0]._id, tracks[7]._id, tracks[8]._id],
                isPublic:    true,
            },
        ]);
        console.log("✅ Đã tạo 3 playlist");

        console.log("\n🎉 Seed data thành công!");
        process.exit(0);

    } catch (err) {
        console.error("❌ Seed thất bại:", err.message);
        process.exit(1);
    }
};

seedData();