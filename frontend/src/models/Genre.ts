import mongoose from 'mongoose';

const genreSchema = new mongoose.Schema(
    {
        name:          { type: String, required: true, unique: true, trim: true },
        nameEn:        { type: String, default: '' },
        color:         { type: String, default: '#6366f1' },
        description:   { type: String, default: '' },
        descriptionEn: { type: String, default: '' },
    },
    { timestamps: true }
);

if (process.env.NODE_ENV !== 'production' && mongoose.models.Genre) {
    delete (mongoose.models as Record<string, unknown>).Genre;
}

const Genre = mongoose.models.Genre || mongoose.model('Genre', genreSchema);
export default Genre;
