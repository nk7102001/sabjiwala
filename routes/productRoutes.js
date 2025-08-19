// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const Product = require('../models/productModel');
const Seller = require('../models/sellerModel');
const Review = require('../models/reviewModel');

/**
 * GET: All products list
 * URL: /products
 */
router.get('/products', productController.getAllProducts);

/**
 * GET: Create a sample product for testing
 * URL: /products/create-sample
 */
router.get('/products/create-sample', productController.createSampleProduct);

/**
 * GET: Vendors list for a specific sabji
 * Purpose: Renders views/products/vendor-list.ejs
 * URL: /products/:slug
 */
router.get('/products/:slug', productController.listVendorsForSabji);

/**
 * GET: Detailed Product Page
 * Purpose: Shows single product info + available vendors + description + reviews
 * URL: /product/:slug
 */
router.get('/product/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug }).lean();
    if (!product) return res.status(404).send('Product not found');

    // Get vendors offering this product
    // Works if Seller.products is either:
    // - [{ product: ObjectId, ... }]  -> query "products.product": product._id
    // - [ObjectId]                    -> query "products": product._id
    const vendors = await Seller.find({
      $or: [
        { 'products.product': product._id },
        { products: product._id }
      ]
    })
      .select('shopName name products')
      .lean();

    // Get reviews for this product
    const reviews = await Review.find({ product: product._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.render('products/product-details', { product, vendors, reviews });
  } catch (err) {
    console.error('Error loading product details:', err);
    return res.status(500).send('Server Error');
  }
});

module.exports = router;
