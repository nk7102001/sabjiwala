// models/reviewModel.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    name: { type: String, required: true, trim: true }, // customer name
    rating: { type: Number, min: 1, max: 5, required: true },
    review: { type: String, required: true, trim: true } // text content
  },
  { timestamps: true }
);

// Optional: prevent duplicate reviews by same name on same product (soft guard)
// reviewSchema.index({ product: 1, name: 1 }, { unique: false });

module.exports = mongoose.model('Review', reviewSchema);
