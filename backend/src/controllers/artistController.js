// controllers/artistController.ts
import Artist from "../models/Artist.js";
import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";

// ── Helper upload ──
const uploadToCloudinary = (buffer, options) =>
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
        Readable.from(buffer).pipe(stream);
    });

// GET /api/artists
export const getArtists = async (req, res) => {
    try {
        const { page = 1, limit = 20, genre } = req.query;

        const filter = {};
        if (genre) filter.genre = { $regex: genre, $options: "i" };

        const [artists, total] = await Promise.all([
            Artist.find(filter)
                .sort({ followers: -1 })
                .skip((+page - 1) * +limit)
                .limit(+limit),
            Artist.countDocuments(filter),
        ]);

        res.json({
            success: true,
            data: artists,
            pagination: { page: +page, limit: +limit, total },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

// GET /api/artists/:id
export const getArtistById = async (req, res) => {
    try {
        const artist = await Artist.findById(req.params.id);
        if (!artist) return res.status(404).json({ success: false, message: "Không tìm thấy nghệ sĩ" });

        res.json({ success: true, data: artist });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

// POST /api/artists
export const createArtist = async (req, res) => {
    try {
        const artist = new Artist(req.body);

        // ── Upload avatar nếu có ──
        if (req.files?.avatar) {
            const result = await uploadToCloudinary(req.files.avatar.data, {
                resource_type: "image",
                folder:        "wonmusic/artists",
                public_id:     `artist_${artist._id}`,
                overwrite:     true,
            });

            if (!result?.secure_url) {
                return res.status(500).json({ success: false, message: "Upload avatar thất bại" });
            }

            artist.avatar = result.secure_url;
        }

        await artist.save();
        res.status(201).json({ success: true, data: artist });

    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// PUT /api/artists/:id
export const updateArtist = async (req, res) => {
    try {
        const updateData = { ...req.body };

        // ── Upload avatar nếu có ──
        if (req.files?.avatar) {
            const result = await uploadToCloudinary(req.files.avatar.data, {
                resource_type: "image",
                folder:        "wonmusic/artists",
                public_id:     `artist_${req.params.id}`,
                overwrite:     true,
            });

            if (!result?.secure_url) {
                return res.status(500).json({ success: false, message: "Upload avatar thất bại" });
            }

            updateData.avatar = result.secure_url;
        }

        const artist = await Artist.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!artist) return res.status(404).json({ success: false, message: "Không tìm thấy nghệ sĩ" });

        res.json({ success: true, data: artist });

    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}; 

// DELETE /api/artists/:id
export const deleteArtist = async (req, res) => {
    try {
        const artist = await Artist.findByIdAndDelete(req.params.id);
        if (!artist) return res.status(404).json({ success: false, message: "Không tìm thấy nghệ sĩ" });

        res.json({ success: true, message: "Đã xóa nghệ sĩ" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
};