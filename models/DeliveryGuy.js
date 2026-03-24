// models/DeliveryGuy.js
const mongoose = require("mongoose");

const deliveryGuySchema = new mongoose.Schema(
  {
    name: { type: String, trim: true }, // optional if Google login
    mobile: { type: String, trim: true }, // optional; consider unique if required
    password: { type: String }, // hash it if provided (optional if Google login)
    googleId: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    profilePic: { type: String, trim: true },
    isApproved: { type: Boolean, default: false }, // for admin approval
  },
  { timestamps: true }
);



module.exports = mongoose.model("DeliveryGuy", deliveryGuySchema);
