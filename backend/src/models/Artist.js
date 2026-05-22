import mongoose from "mongoose";

const artistSchema = new mongoose.Schema(
    {
        name:      { type: String, required: true, trim: true },
        avatar:    { type: String },
        bio:       { type: String },
        genre:     { type: String },
        followers: { type: Number, default: 0 },
        verified:  { type: Boolean, default: false },
        socialLinks: {
            facebook:  String,
            instagram: String,
            youtube:   String,
            tiktok:    String,
        },
    }, 
    { timestamps: true }
);

const Artist = mongoose.model("Artist", artistSchema);

export default Artist;