import mongoose from "mongoose"
import { existsSync } from "fs"
import { resolve } from "path"

const envFile = resolve(process.cwd(), ".env.local")
if (existsSync(envFile)) process.loadEnvFile(envFile)

const MONGODB_URI = process.env.MONGODB_CONNECTION_STRING!

const genreSchema = new mongoose.Schema(
    {
        name:        { type: String, required: true, unique: true, trim: true },
        color:       { type: String, default: "#6366f1" },
        description: { type: String, default: "" },
    },
    { timestamps: true }
)

const Genre = mongoose.models.Genre || mongoose.model("Genre", genreSchema)

const GENRES = [
    { name: "V-Pop",    color: "#f43f5e", description: "Nhạc pop Việt Nam hiện đại, giai điệu bắt tai và lời ca gần gũi." },
    { name: "Pop",      color: "#ec4899", description: "Nhạc đại chúng quốc tế, phong cách trẻ trung và dễ nghe." },
    { name: "Ballad",   color: "#6366f1", description: "Nhạc trữ tình, tiết tấu chậm và cảm xúc sâu lắng." },
    { name: "R&B",      color: "#8b5cf6", description: "Rhythm and Blues — âm nhạc da diết pha trộn soul và hip-hop." },
    { name: "Hip-Hop",  color: "#f97316", description: "Nhạc rap và beat mạnh, văn hóa đường phố đặc trưng." },
    { name: "EDM",      color: "#06b6d4", description: "Electronic Dance Music — nhạc điện tử sôi động dành cho sàn nhảy." },
    { name: "Rock",     color: "#ef4444", description: "Nhạc rock với guitar điện và trống mạnh mẽ, năng lượng cao." },
    { name: "Jazz",     color: "#eab308", description: "Nhạc jazz tinh tế, ngẫu hứng và bề dày lịch sử âm nhạc." },
    { name: "Acoustic", color: "#22c55e", description: "Âm thanh mộc, nhẹ nhàng và chân thực từ nhạc cụ không khuếch đại." },
    { name: "Indie",    color: "#14b8a6", description: "Nhạc độc lập, sáng tạo tự do không bị ràng buộc thương mại." },
    { name: "Chill",    color: "#3b82f6", description: "Nhạc thư giãn nhẹ nhàng, phù hợp làm việc và nghỉ ngơi." },
    { name: "K-Pop",    color: "#d946ef", description: "Nhạc pop Hàn Quốc — vũ đạo bắt mắt, sản xuất chuyên nghiệp." },
    { name: "Bolero",   color: "#a78bfa", description: "Dòng nhạc trữ tình truyền thống Việt Nam, giai điệu đằm thắm." },
    { name: "Nhạc Trẻ", color: "#fb923c", description: "Nhạc giải trí phổ biến trong giới trẻ Việt Nam." },
    { name: "Nhạc Vàng", color: "#facc15", description: "Dòng nhạc truyền thống mang hơi thở miền Nam, giàu cảm xúc." },
]

async function main() {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
    console.log("[seed-genres] Ket noi MongoDB thanh cong")

    let added = 0, skipped = 0

    for (const genre of GENRES) {
        const exists = await Genre.findOne({ name: genre.name })
        if (exists) {
            console.log(`[seed-genres]  BỎ QUA  ${genre.name} (đã tồn tại)`)
            skipped++
            continue
        }
        await Genre.create(genre)
        console.log(`[seed-genres]  ĐÃ THÊM  ${genre.name}`)
        added++
    }

    console.log(`\n[seed-genres] Hoàn tất: +${added} mới, ${skipped} bỏ qua`)
    await mongoose.disconnect()
    process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
