// controllers/trackController.ts
import Track from "../models/Track.js";
import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";

// GET /api/tracks
export const getTracks = async (req, res) => {
    try {
        const { page = 1, limit = 20, artistId, genre } = req.query;

        const filter = { isPublished: true };
        if (artistId) filter.artistId = artistId;
        if (genre)    filter.genre    = { $regex: genre, $options: "i" };

        const [tracks, total] = await Promise.all([
            Track.find(filter)
                .populate("artistId", "name avatar verified")
                .sort({ plays: -1 })
                .skip((+page - 1) * +limit)
                .limit(+limit),
            Track.countDocuments(filter),
        ]);

        res.json({
            success: true,
            data: tracks,
            pagination: { page: +page, limit: +limit, total },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

// GET /api/tracks/:id
export const getTrackById = async (req, res) => {
    try {
        const track = await Track.findById(req.params.id)
            .populate("artistId", "name avatar verified")

        if (!track) return res.status(404).json({ success: false, message: "Không tìm thấy bài hát" });

        res.json({ success: true, data: track });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

// GET /api/tracks/search?q=keyword
export const searchTracks = async (req, res) => {
    try {
        const { q, limit = 10 } = req.query;
        if (!q) return res.json({ success: true, data: [] });

        const tracks = await Track.find({
            isPublished: true,
            $or: [
                { title:  { $regex: q, $options: "i" } },
                { genre:  { $regex: q, $options: "i" } },
            ],
        })
            .populate("artistId", "name avatar")
            .limit(+limit);

        res.json({ success: true, data: tracks });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

// GET /api/tracks/top?limit=10
export const getTopTracks = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const tracks = await Track.find({ isPublished: true })
            .populate("artistId", "name avatar verified")
            .sort({ plays: -1 })
            .limit(+limit);

        res.json({ success: true, data: tracks });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

// POST /api/tracks
export const createTrack = async (req, res) => {
    try {
        // Kiểm tra bắt buộc phải có file audio
        if (!req.files?.audio) {
            return res.status(400).json({ 
                success: false, 
                message: "File audio là bắt buộc" 
            });
        }

        // Tạo document tạm để lấy _id, chưa save
        const track = new Track(req.body);

        // ── Upload audio (bắt buộc) ──
        const audioResult = await uploadToCloudinary(req.files.audio.data, {
            resource_type: "video",
            folder:        "wonmusic/tracks",
            public_id:     `track_${track._id}`,
            overwrite:     true,
        });

        if (!audioResult?.secure_url) {
            return res.status(500).json({ 
                success: false, 
                message: "Upload audio thất bại" 
            });
        }

        track.audioUrl = audioResult.secure_url;

        // ── Upload cover (tuỳ chọn) ──
        if (req.files?.cover) {
            const coverResult = await uploadToCloudinary(req.files.cover.data, {
                resource_type: "image",
                folder:        "wonmusic/covers",
                public_id:     `cover_${track._id}`,
                overwrite:     true,
            });

            if (coverResult?.secure_url) {
                track.coverUrl = coverResult.secure_url;
            }
        }

        await track.save();
        res.status(201).json({ success: true, data: track });

    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// ── Helper: upload buffer lên Cloudinary ──
const uploadToCloudinary = (buffer, options) =>
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
        Readable.from(buffer).pipe(stream);
    });

// PUT /api/tracks/:id
export const updateTrack = async (req, res) => {
    try {
        const updateData = { ...req.body };

        // ── Nếu có file audio upload ──
        if (req.files?.audio) {
            const audio = req.files.audio;
            const result = await uploadToCloudinary(audio.data, {
                resource_type: "video",          // audio dùng type "video"
                folder:        "wonmusic/tracks",
                public_id:     `track_${req.params.id}`,
                overwrite:     true,
            });
            updateData.audioUrl = result.secure_url;
        }

        // ── Nếu có file ảnh bìa upload ──
        if (req.files?.cover) {
            const cover = req.files.cover;
            const result = await uploadToCloudinary(cover.data, {
                resource_type: "image",
                folder:        "wonmusic/covers",
                public_id:     `cover_${req.params.id}`,
                overwrite:     true,
            });
            updateData.coverUrl = result.secure_url;
        }

        const track = await Track.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!track) return res.status(404).json({ success: false, message: "Không tìm thấy bài hát" });

        res.json({ success: true, data: track });

    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// PATCH /api/tracks/:id/play — tăng lượt nghe
export const incrementPlays = async (req, res) => {
    try {
        await Track.findByIdAndUpdate(req.params.id, { $inc: { plays: 1 } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

// DELETE /api/tracks/:id
export const deleteTrack = async (req, res) => {
    try {
        const track = await Track.findByIdAndDelete(req.params.id);
        if (!track) return res.status(404).json({ success: false, message: "Không tìm thấy bài hát" });

        res.json({ success: true, message: "Đã xóa bài hát" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
};