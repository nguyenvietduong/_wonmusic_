/**
 * Chạy: node scripts/seed-genres.mjs
 * Seed / update danh sách thể loại nhạc vào MongoDB (upsert theo name)
 */
import mongoose from "mongoose"
import { existsSync } from "fs"
import { resolve } from "path"

const envFile = resolve(process.cwd(), ".env.local")
if (existsSync(envFile)) process.loadEnvFile(envFile)

const MONGODB_URI = process.env.MONGODB_CONNECTION_STRING
if (!MONGODB_URI) { console.error("[seed-genres] Thiếu MONGODB_CONNECTION_STRING trong .env.local"); process.exit(1) }

const genreSchema = new mongoose.Schema(
    {
        name:          { type: String, required: true, unique: true, trim: true },
        nameEn:        { type: String, default: "" },
        color:         { type: String, default: "#6366f1" },
        description:   { type: String, default: "" },
        descriptionEn: { type: String, default: "" },
    },
    { timestamps: true }
)

const Genre = mongoose.models.Genre ?? mongoose.model("Genre", genreSchema)

const GENRES = [
    {
        name: "V-Pop",      nameEn: "V-Pop",
        color: "#f43f5e",
        description:   "Nhạc pop Việt Nam hiện đại, giai điệu bắt tai và lời ca gần gũi.",
        descriptionEn: "Modern Vietnamese pop music with catchy melodies and relatable lyrics.",
    },
    {
        name: "Pop",        nameEn: "Pop",
        color: "#ec4899",
        description:   "Nhạc đại chúng quốc tế, phong cách trẻ trung và dễ nghe.",
        descriptionEn: "International mainstream music with youthful, accessible style.",
    },
    {
        name: "Ballad",     nameEn: "Ballad",
        color: "#6366f1",
        description:   "Nhạc trữ tình, tiết tấu chậm và cảm xúc sâu lắng.",
        descriptionEn: "Lyrical music with slow tempo and deep emotional expression.",
    },
    {
        name: "R&B",        nameEn: "R&B",
        color: "#8b5cf6",
        description:   "Rhythm and Blues — âm nhạc da diết pha trộn soul và hip-hop.",
        descriptionEn: "Rhythm and Blues — soulful music blending soul, funk and hip-hop influences.",
    },
    {
        name: "Hip-Hop",    nameEn: "Hip-Hop",
        color: "#f97316",
        description:   "Nhạc rap và beat mạnh, văn hóa đường phố đặc trưng.",
        descriptionEn: "Rap music with powerful beats, rooted in urban street culture.",
    },
    {
        name: "EDM",        nameEn: "EDM",
        color: "#06b6d4",
        description:   "Electronic Dance Music — nhạc điện tử sôi động dành cho sàn nhảy.",
        descriptionEn: "Electronic Dance Music — energetic electronic tracks made for the dancefloor.",
    },
    {
        name: "Rock",       nameEn: "Rock",
        color: "#ef4444",
        description:   "Nhạc rock với guitar điện và trống mạnh mẽ, năng lượng cao.",
        descriptionEn: "Rock music featuring electric guitars and powerful drums with high energy.",
    },
    {
        name: "Jazz",       nameEn: "Jazz",
        color: "#eab308",
        description:   "Nhạc jazz tinh tế, ngẫu hứng và bề dày lịch sử âm nhạc.",
        descriptionEn: "Sophisticated jazz music — improvisational and rich in musical history.",
    },
    {
        name: "Acoustic",   nameEn: "Acoustic",
        color: "#22c55e",
        description:   "Âm thanh mộc, nhẹ nhàng và chân thực từ nhạc cụ không khuếch đại.",
        descriptionEn: "Raw, natural sound from unamplified instruments — warm and authentic.",
    },
    {
        name: "Indie",      nameEn: "Indie",
        color: "#14b8a6",
        description:   "Nhạc độc lập, sáng tạo tự do không bị ràng buộc thương mại.",
        descriptionEn: "Independent music — creative and free from commercial constraints.",
    },
    {
        name: "Chill",      nameEn: "Chill",
        color: "#3b82f6",
        description:   "Nhạc thư giãn nhẹ nhàng, phù hợp làm việc và nghỉ ngơi.",
        descriptionEn: "Relaxing, laid-back music perfect for working, studying or unwinding.",
    },
    {
        name: "K-Pop",      nameEn: "K-Pop",
        color: "#d946ef",
        description:   "Nhạc pop Hàn Quốc — vũ đạo bắt mắt, sản xuất chuyên nghiệp.",
        descriptionEn: "Korean pop music — eye-catching choreography and top-tier production.",
    },
    {
        name: "Bolero",     nameEn: "Bolero",
        color: "#a78bfa",
        description:   "Dòng nhạc trữ tình truyền thống Việt Nam, giai điệu đằm thắm.",
        descriptionEn: "Traditional Vietnamese lyrical music with heartfelt, nostalgic melodies.",
    },
    {
        name: "Nhạc Trẻ",   nameEn: "Vietnamese Youth Music",
        color: "#fb923c",
        description:   "Nhạc giải trí phổ biến trong giới trẻ Việt Nam.",
        descriptionEn: "Popular Vietnamese entertainment music for the younger generation.",
    },
    {
        name: "Nhạc Vàng",  nameEn: "Golden Music",
        color: "#facc15",
        description:   "Dòng nhạc truyền thống mang hơi thở miền Nam, giàu cảm xúc.",
        descriptionEn: "Traditional Southern Vietnamese music — emotionally rich and timeless.",
    },
]

async function main() {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
    console.log("[seed-genres] Kết nối MongoDB thành công\n")

    let added = 0, updated = 0

    for (const genre of GENRES) {
        const result = await Genre.findOneAndUpdate(
            { name: genre.name },
            { $set: genre },
            { upsert: true, new: true }
        )
        if (result.createdAt?.getTime() === result.updatedAt?.getTime()) {
            console.log(`  ADD    ${genre.name}`)
            added++
        } else {
            console.log(`  UPDATE ${genre.name}`)
            updated++
        }
    }

    console.log(`\n[seed-genres] Xong: +${added} mới, ~${updated} cập nhật`)
    await mongoose.disconnect()
    process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
