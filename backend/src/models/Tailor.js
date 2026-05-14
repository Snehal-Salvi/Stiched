import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true, min: 1 },
  priceMayVary: { type: Boolean, default: false },
  turnaroundDays: { type: Number, default: 7 },
  description: { type: String, default: '' },
});

const tailorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    shopName: { type: String, default: '' },
    description: { type: String, default: '' },
    experience: { type: Number, default: 0 },
    services: [serviceSchema],
    location: {
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },
    socialLinks: {
      instagram: { type: String, default: '' },
      whatsapp: { type: String, default: '' },
      facebook: { type: String, default: '' },
    },
    shopPhotos: [
      {
        image: String,
        caption: { type: String, default: '' },
      },
    ],
    workSamples: [
      {
        image: String,
        caption: { type: String, default: '' },
      },
    ],
    rating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Tailor', tailorSchema);
