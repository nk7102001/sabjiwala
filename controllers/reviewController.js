// controllers/reviewController.js
const mongoose = require('mongoose');
const Review = require('../models/reviewModel');
const Product = require('../models/productModel');

// Add review
exports.addReview = async (req, res) => {
  const name = (req.body.name || '').trim();
  const reviewText = (req.body.review || '').trim();
  const productId = req.params.productId;
  const productSlug = (req.body.productSlug || '').trim();

  // Parse rating safely and clamp between 1 and 5
  let ratingNum = Number(req.body.rating);
  if (isNaN(ratingNum)) ratingNum = 0;
  ratingNum = Math.max(1, Math.min(5, ratingNum));

  try {
    // Basic validation
    if (!name || !ratingNum || !reviewText) {
      return res.status(400).send('All fields are required');
    }

    // Validate product id format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).send('Invalid product');
    }

    // Optional: ensure product exists (non-breaking, but safer)
    const product = await Product.findById(productId).select('_id slug').lean();
    if (!product) {
      return res.status(404).send('Product not found');
    }

    await Review.create({
      product: productId,
      name,
      rating: ratingNum,
      review: reviewText
    });

    // Prefer server-known slug if present; fall back to provided slug; else go to product page base
    const redirectSlug = product?.slug || productSlug;
    const redirectUrl = redirectSlug ? `/product/${redirectSlug}#reviews` : `/product/${productId}#reviews`;

    return res.redirect(redirectUrl);
  } catch (err) {
    console.error('Error adding review:', err);
    return res.status(500).send('Error adding review');
  }
};
