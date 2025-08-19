// models/userModel.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true },
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    country: { type: String, default: 'India', trim: true }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name:      { type: String, required: true, trim: true },
    email:     { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password:  { type: String }, // optional when using Google auth
    googleId:  { type: String },
    phone:     { type: String, default: '', trim: true },
    addresses: [addressSchema],
    isBlocked: { type: Boolean, default: false }, // ✅ existing field
    role:      { type: String, enum: ['customer', 'admin'], default: 'customer' } // ✅ new field
  },
  { timestamps: true }
);

// Password hash before save (only if modified and non-empty)
userSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('password')) return next();
    if (!this.password) return next(); // e.g., Google-only accounts
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

// Match password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
