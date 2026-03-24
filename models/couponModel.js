// models/couponModel.js
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    discountType: {
      type: String,
      enum: ['percentage', 'amount'],
      required: true
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0
    },
    expiryDate: {
      type: Date,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Optional: compound index to speed up active, non-expired queries
couponSchema.index({ isActive: 1, expiryDate: 1 });

// Optional: helper to check if coupon is currently valid
couponSchema.methods.isCurrentlyValid = function () {
  return this.isActive && this.expiryDate >= new Date();
};

module.exports = mongoose.model('Coupon', couponSchema);
