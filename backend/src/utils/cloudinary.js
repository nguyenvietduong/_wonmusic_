// src/utils/cloudinary.js
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key:    process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
});

export const uploadAudio = async (filePath) => {
    const result = await cloudinary.uploader.upload(filePath, {
        resource_type: "video",       // audio dùng type "video"
        folder:        "wonmusic/tracks",
    });
    return result.secure_url;
};

export const uploadImage = async (filePath) => {
    const result = await cloudinary.uploader.upload(filePath, {
        resource_type: "image",
        folder:        "wonmusic/covers",
    });
    return result.secure_url;
};

export default cloudinary;