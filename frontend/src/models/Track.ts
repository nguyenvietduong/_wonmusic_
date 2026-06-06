import mongoose from 'mongoose'

const trackSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        artistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Artist', required: true },
        audioUrl: { type: String, required: true },
        audioId: { type: String },
        coverUrl: { type: String },
        coverId: { type: String },
        duration: { type: Number, required: true, default: 0 },
        genre: { type: String },
        releaseYear: { type: Number },
        plays: { type: Number, default: 0 },
        isPublished: { type: Boolean, default: true },
        lyrics: { type: String },
    },
    { timestamps: true }
)

trackSchema.index({ title: 'text', genre: 1 })
trackSchema.index({ artistId: 1 })
trackSchema.index({ plays: -1 })

const Track = mongoose.models.Track || mongoose.model('Track', trackSchema)
export default Track
