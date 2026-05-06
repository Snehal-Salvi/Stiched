import mongoose from 'mongoose';

const GARMENT_TYPES = [
  'blouse', 'salwar_kameez', 'lehenga', 'dress',
  'mens_shirt', 'mens_pants', 'kurta', 'alteration', 'other',
];

const orderSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tailor: { type: mongoose.Schema.Types.ObjectId, ref: 'Tailor', required: true },
    serviceName: { type: String, required: true },
    garmentType: { type: String, enum: GARMENT_TYPES, required: true },
    measurementType: { type: String, enum: ['custom', 'send_sample'], required: true },
    measurements: { type: mongoose.Schema.Types.Mixed, default: {} },
    notes: { type: String, default: '' },
    price: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['card', 'cod'], required: true },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    deliveryDate: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'rejected'],
      default: 'pending',
    },
    review: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String },
      createdAt: { type: Date },
    },
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);
