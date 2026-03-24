// models/productModel.js
const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema(
  {
    // Link to the Seller who added the product
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: true
    },
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true },
    category: { type: String, required: true, trim: true },
    pricePerKg: { type: Number, required: true, min: 0 },
    availableQty: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, trim: true },
    inStock: { type: Boolean, default: true }
  },
  { timestamps: true }
);


// 🆕 Auto-generate unique slug from name or provided slug
productSchema.pre('validate', async function (next) {
  try {
    // If neither name nor slug is present, skip slug generation (validation will catch required name)
    if (!this.name && !this.slug) return next();

    // Prefer explicitly provided slug; else derive from name
    const base = this.slug && this.slug.trim().length > 0 ? this.slug : this.name;
    const baseSlug = slugify(base, { lower: true, strict: true });

    if (!baseSlug) return next(); // nothing meaningful to slugify

    let slug = baseSlug;
    let counter = 1;

    // Ensure uniqueness (skip self)
    // Use lean and projection for performance
    // eslint-disable-next-line no-constant-condition
    while (await mongoose.models.Product.findOne({ slug, _id: { $ne: this._id } }).select('_id').lean()) {
      slug = `${baseSlug}-${counter}`;
      counter += 1;
    }

    this.slug = slug;
    return next();
  } catch (err) {
    return next(err);
  }
});

module.exports = mongoose.model('Product', productSchema);
