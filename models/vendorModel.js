// models/vendorModel.js
const mongoose = require('mongoose');

const vendorProductSchema = new mongoose.Schema(
  {
    product:      { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    price:        { type: Number, required: true, min: 0 },
    availableQty: { type: Number, default: 0, min: 0 },
    rating:       { type: Number, default: null, min: 0, max: 5 }
  },
  { _id: false }
);

const vendorSchema = new mongoose.Schema(
  {
    name:      { type: String, required: true, trim: true },
    shopName:  { type: String, trim: true },
    phone:     { type: String, required: true, trim: true },
    address:   { type: String, trim: true },
    city:      { type: String, default: 'Local Market', trim: true },
    password:  { type: String, required: true }, // hashed
    status:    { type: String, enum: ['Pending', 'Approved'], default: 'Pending' },
    isBlocked: { type: Boolean, default: false },
    products:  [vendorProductSchema]
  },
  { timestamps: true }
);

// Helpful indexes for admin filtering/moderation
vendorSchema.index({ status: 1, isBlocked: 1 });

module.exports = mongoose.model('Vendor', vendorSchema);
