// models/sellerModel.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const sellerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    shopName: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    businessType: {
      type: String,
      enum: ['Local Vendor', 'Farmer', 'Wholesaler'],
      required: true
    },
    idProof: { type: String, trim: true },   // file path or cloud URL
    shopPhoto: { type: String, trim: true }, // file path or cloud URL
    password: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    isBlocked: { type: Boolean, default: false },

    // Embedded product details so price/qty can also be stored
    products: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        price: { type: Number, min: 0 },
        availableQty: { type: Number, min: 0 },
        rating: { type: Number, min: 0, max: 5 }
      }
    ]
  },
  { timestamps: true }
);


// Compare password method
sellerSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Seller', sellerSchema);
