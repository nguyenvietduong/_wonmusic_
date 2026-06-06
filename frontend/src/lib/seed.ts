import bcrypt from 'bcryptjs'
import { connectDB } from './mongodb'
import Artist from '@/models/Artist'
import Track from '@/models/Track'
import User from '@/models/User'

// --------------- Seed data ---------------

const SEED_ARTISTS = [
    {
        name: 'Sơn Tùng M-TP',
        avatar: 'https://picsum.photos/seed/sontung/300/300',
        bio: 'Ca sĩ, nhạc sĩ người Việt Nam nổi tiếng với dòng nhạc Pop, R&B và nhiều bản hit triệu view.',
        genre: 'Pop / R&B',
        followers: 12_400_000,
        verified: true,
        socialLinks: {
            facebook: 'https://facebook.com/sontungmtp',
            instagram: 'https://instagram.com/sontungmtp',
            youtube: 'https://youtube.com/@sontungmtp',
        },
    },
    {
        name: 'Hoàng Thùy Linh',
        avatar: 'https://picsum.photos/seed/hoangthuyli/300/300',
        bio: 'Ca sĩ, diễn viên với phong cách âm nhạc độc đáo kết hợp dân gian hiện đại và pop.',
        genre: 'Pop / Folk',
        followers: 5_200_000,
        verified: true,
        socialLinks: {
            facebook: 'https://facebook.com/hoangthuyli nh',
            instagram: 'https://instagram.com/hoangthuyli nh',
        },
    },
    {
        name: 'Đen Vâu',
        avatar: 'https://picsum.photos/seed/denvau/300/300',
        bio: 'Rapper, nhạc sĩ nổi bật với lời nhạc gần gũi, sâu sắc và phong cách underground.',
        genre: 'Rap / Hip-hop',
        followers: 3_800_000,
        verified: true,
        socialLinks: {
            facebook: 'https://facebook.com/denvau',
            youtube: 'https://youtube.com/@denvau',
        },
    },
    {
        name: 'Mỹ Tâm',
        avatar: 'https://picsum.photos/seed/mytam/300/300',
        bio: 'Diva nhạc Việt với hơn 20 năm sự nghiệp, nổi tiếng với giọng hát nội lực và đầy cảm xúc.',
        genre: 'Pop / Ballad',
        followers: 8_900_000,
        verified: true,
        socialLinks: {
            facebook: 'https://facebook.com/mytam',
            instagram: 'https://instagram.com/my.tam',
        },
    },
    {
        name: 'Đức Phúc',
        avatar: 'https://picsum.photos/seed/ducphuc/300/300',
        bio: 'Quán quân Vietnam Idol 2015, giọng ca trữ tình với nhiều bài ballad chạm đến trái tim.',
        genre: 'Pop / Ballad',
        followers: 4_100_000,
        verified: true,
        socialLinks: {
            facebook: 'https://facebook.com/ducphucofficial',
            instagram: 'https://instagram.com/ducphuc_official',
        },
    },
    {
        name: 'Bích Phương',
        avatar: 'https://picsum.photos/seed/bichphuong/300/300',
        bio: 'Ca sĩ trẻ năng động với phong cách pop R&B hiện đại, nhiều hit viral trên mạng xã hội.',
        genre: 'Pop / R&B',
        followers: 3_200_000,
        verified: false,
        socialLinks: {
            facebook: 'https://facebook.com/bichphuong',
            instagram: 'https://instagram.com/bichphuong',
        },
    },
]

// Public sample audio (soundhelix - free, no auth needed)
const AUDIO = [
    { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', duration: 230 },
    { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', duration: 198 },
    { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', duration: 267 },
    { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', duration: 311 },
    { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', duration: 244 },
    { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', duration: 189 },
    { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3', duration: 215 },
    { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', duration: 276 },
    { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3', duration: 222 },
    { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3', duration: 258 },
    { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3', duration: 303 },
    { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3', duration: 195 },
]

// artistIndex = chỉ số artist trong SEED_ARTISTS, audioIndex = chỉ số trong AUDIO
const SEED_TRACKS = [
    // Sơn Tùng M-TP (0)
    { title: 'Nơi Này Có Anh', artistIndex: 0, audioIndex: 0, coverSeed: 'noinaycoanh', genre: 'Pop', releaseYear: 2017, plays: 24_000_000 },
    { title: 'Lạc Trôi', artistIndex: 0, audioIndex: 1, coverSeed: 'lactroi', genre: 'Pop', releaseYear: 2017, plays: 18_000_000 },
    // Hoàng Thùy Linh (1)
    { title: 'Để Mị Nói Cho Mà Nghe', artistIndex: 1, audioIndex: 2, coverSeed: 'deminoi', genre: 'Pop / Folk', releaseYear: 2019, plays: 15_000_000 },
    { title: 'Kẻ Cắp Gặp Bà Già', artistIndex: 1, audioIndex: 3, coverSeed: 'kecapgapbagia', genre: 'Pop / Folk', releaseYear: 2020, plays: 9_500_000 },
    // Đen Vâu (2)
    { title: 'Bài Này Chill Phết', artistIndex: 2, audioIndex: 4, coverSeed: 'bainarychi', genre: 'Rap', releaseYear: 2019, plays: 22_000_000 },
    { title: 'Mang Tiền Về Cho Mẹ', artistIndex: 2, audioIndex: 5, coverSeed: 'mangtienvecome', genre: 'Rap', releaseYear: 2021, plays: 35_000_000 },
    // Mỹ Tâm (3)
    { title: 'Đừng Hỏi Em', artistIndex: 3, audioIndex: 6, coverSeed: 'dunghoi', genre: 'Ballad', releaseYear: 2016, plays: 11_000_000 },
    { title: 'Hẹn Một Mai', artistIndex: 3, audioIndex: 7, coverSeed: 'henmotmai', genre: 'Ballad', releaseYear: 2018, plays: 8_200_000 },
    // Đức Phúc (4)
    { title: 'Sau Tất Cả', artistIndex: 4, audioIndex: 8, coverSeed: 'sautatca', genre: 'Pop', releaseYear: 2015, plays: 14_000_000 },
    { title: 'Khi Anh Nhìn Vào Mắt Em', artistIndex: 4, audioIndex: 9, coverSeed: 'khianhnhin', genre: 'Ballad', releaseYear: 2017, plays: 7_800_000 },
    // Bích Phương (5)
    { title: 'Bùa Yêu', artistIndex: 5, audioIndex: 10, coverSeed: 'buayeu', genre: 'Pop / R&B', releaseYear: 2018, plays: 19_000_000 },
    { title: 'Làm Gì Đây Em Ơi', artistIndex: 5, audioIndex: 11, coverSeed: 'lamgidayemoi', genre: 'Pop', releaseYear: 2020, plays: 6_500_000 },
]

const SEED_USERS = [
    {
        username: 'admin',
        password: 'admin123',
        email: 'admin@wonmusic.vn',
        displayName: 'Quản trị viên',
        role: 'admin' as const,
    },
    {
        username: 'user',
        password: 'user123',
        email: 'user@wonmusic.vn',
        displayName: 'Người dùng mẫu',
        role: 'user' as const,
    },
]

// --------------- Main seed function ---------------

export async function seedDB() {
    try {
        await connectDB()

        // Kiểm tra idempotent — bỏ qua nếu đã có dữ liệu
        const existingCount = await Artist.countDocuments()
        if (existingCount > 0) {
            console.log('[Seed] DB đã có dữ liệu, bỏ qua seed.')
            return
        }

        console.log('[Seed] Bắt đầu tạo dữ liệu mẫu...')

        // 1. Users
        for (const { password, ...rest } of SEED_USERS) {
            const exists = await User.findOne({ username: rest.username })
            if (!exists) {
                const hashedPassword = await bcrypt.hash(password, 10)
                await User.create({ ...rest, hashedPassword })
            }
        }
        console.log('[Seed] ✓ Users')

        // 2. Artists
        const artistDocs = await Artist.insertMany(SEED_ARTISTS)
        console.log(`[Seed] ✓ ${artistDocs.length} Artists`)

        // 3. Tracks
        const trackPayloads = SEED_TRACKS.map((t) => ({
            title: t.title,
            artistId: artistDocs[t.artistIndex]._id,
            audioUrl: AUDIO[t.audioIndex].url,
            duration: AUDIO[t.audioIndex].duration,
            coverUrl: `https://picsum.photos/seed/${t.coverSeed}/400/400`,
            genre: t.genre,
            releaseYear: t.releaseYear,
            plays: t.plays,
            isPublished: true,
        }))
        const trackDocs = await Track.insertMany(trackPayloads)
        console.log(`[Seed] ✓ ${trackDocs.length} Tracks`)

        console.log('[Seed] Hoàn thành! Tài khoản admin: admin / admin123')
    } catch (err) {
        console.error('[Seed] Lỗi:', err)
    }
}
