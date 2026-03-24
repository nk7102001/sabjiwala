// models/adminModel.js
const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true }, // Hash in production before saving
    name: { type: String, trim: true }
  },
  { timestamps: true }
);

// Optional: method placeholder if you add hashing later
// adminSchema.methods.comparePassword = async function (candidate) {
//   // e.g., return await bcrypt.compare(candidate, this.password);
// };

module.exports = mongoose.model('Admin', adminSchema);
