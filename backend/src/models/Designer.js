import mongoose from 'mongoose';

const designerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    bio: { type: String, default: '' },
    specialties: [{ type: String }],
    pricePerHour: { type: Number, default: 0 },
    experience: { type: Number, default: 0 },
    location: { type: String, default: '' },
    portfolio: [
      {
        image: String,
        title: String,
        description: String,
      },
    ],
    rating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
    languages: [{ type: String }],
    socialLinks: {
      instagram: { type: String, default: '' },
      pinterest: { type: String, default: '' },
      website: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

export default mongoose.model('Designer', designerSchema);
