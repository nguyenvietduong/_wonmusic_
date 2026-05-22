// test-upload.js
import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key:    process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
});

const result = await cloudinary.uploader.upload("./src/noinaycoanh.mp3", {
    resource_type: "video",
    folder:        "wonmusic/tracks",
    public_id:     "noinaycoanh",
});

console.log("✅ Upload thành công!");
console.log("URL:", result.secure_url);