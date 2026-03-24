// routes/sellerProductRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const Product = require('../models/productModel');
const Seller = require('../models/sellerModel');
const sellerAuth = require('../middlewares/sellerAuth');

// 📂 Multer config for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/products'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Small helper
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * ✅ My Products List (GET) — Safe version
 */
router.get('/seller/products', sellerAuth, async (req, res) => {
  try {
    const sellerIdStr = req.session?.seller?._id;
    if (!sellerIdStr || !isValidId(sellerIdStr)) {
      return res.redirect('/seller-login');
    }
    const sellerId = new mongoose.Types.ObjectId(sellerIdStr);

    // Direct fetch from Product model for logged-in seller
    const products = await Product.find({ seller: sellerId })
      .sort({ createdAt: -1 })
      .lean();

    return res.render('seller/products', { seller: req.session.seller, products });
  } catch (err) {
    console.error('❌ Error fetching products:', err);
    return res.render('seller/products', { seller: req.session.seller, products: [] });
  }
});

/**
 * ✅ Show Add Product Form (GET)
 */
router.get('/seller/products/add', sellerAuth, (req, res) => {
  return res.render('seller/add-product', { seller: req.session.seller });
});

/**
 * ✅ Handle Add Product (POST)
 */
router.post(
  '/seller/products/add',
  sellerAuth,
  upload.single('image'),
  async (req, res) => {
    try {
      const sellerIdStr = req.session?.seller?._id;
      if (!sellerIdStr || !isValidId(sellerIdStr)) {
        return res.redirect('/seller-login');
      }
      const sellerId = new mongoose.Types.ObjectId(sellerIdStr);

      const { name, category } = req.body;
      const pricePerKg = parseFloat(req.body.pricePerKg);
      const availableQty = parseFloat(req.body.availableQty);
      const description = req.body.description || '';

      const newProduct = await Product.create({
        seller: sellerId,
        name,
        category,
        pricePerKg: isNaN(pricePerKg) ? 0 : pricePerKg,
        availableQty: isNaN(availableQty) ? 0 : availableQty,
        description,
        imageUrl: req.file ? '/uploads/products/' + req.file.filename : null,
        inStock: !isNaN(availableQty) && availableQty > 0
      });

      // Also push reference in Seller's products array
      await Seller.findByIdAndUpdate(sellerId, {
        $push: {
          products: {
            product: newProduct._id,
            price: newProduct.pricePerKg,
            availableQty: newProduct.availableQty
          }
        }
      });

      return res.redirect('/seller/products');
    } catch (err) {
      console.error('❌ Error adding product:', err);
      return res.send('Error adding product');
    }
  }
);

/**
 * ✅ Edit Product Form (GET)
 */
router.get('/seller/products/edit/:id', sellerAuth, async (req, res) => {
  try {
    const sellerIdStr = req.session?.seller?._id;
    if (!sellerIdStr || !isValidId(sellerIdStr)) {
      return res.status(404).send('Product not found or not yours');
    }
    const sellerId = new mongoose.Types.ObjectId(sellerIdStr);

    if (!isValidId(req.params.id)) {
      return res.status(404).send('Product not found or not yours');
    }

    const product = await Product.findOne({
      _id: req.params.id,
      seller: sellerId
    }).lean();

    if (!product) {
      console.warn(`⚠️ Product not found or doesn't belong to seller ${sellerId}`);
      return res.status(404).send('Product not found or not yours');
    }

    return res.render('seller/edit-product', {
      seller: req.session.seller,
      product
    });
  } catch (err) {
    console.error('❌ Error fetching product for edit:', err);
    return res.status(500).send('Error loading edit form');
  }
});

/**
 * ✅ Handle Edit Product (POST)
 */
router.post(
  '/seller/products/edit/:id',
  sellerAuth,
  upload.single('image'),
  async (req, res) => {
    try {
      const sellerIdStr = req.session?.seller?._id;
      if (!sellerIdStr || !isValidId(sellerIdStr)) {
        return res.status(404).send('Product not found or not yours');
      }
      const sellerId = new mongoose.Types.ObjectId(sellerIdStr);

      if (!isValidId(req.params.id)) {
        return res.status(404).send('Product not found or not yours');
      }

      const product = await Product.findOne({
        _id: req.params.id,
        seller: sellerId
      });

      if (!product) {
        console.warn(`⚠️ Product not found or doesn't belong to seller ${sellerId}`);
        return res.status(404).send('Product not found or not yours');
      }

      // Update product fields
      product.name = req.body.name;
      product.category = req.body.category;
      const pricePerKg = parseFloat(req.body.pricePerKg);
      const availableQty = parseFloat(req.body.availableQty);
      product.pricePerKg = isNaN(pricePerKg) ? 0 : pricePerKg;
      product.availableQty = isNaN(availableQty) ? 0 : availableQty;
      product.inStock = product.availableQty > 0;
      product.description = req.body.description || '';
      if (req.file) {
        product.imageUrl = '/uploads/products/' + req.file.filename;
      }

      await product.save();
      console.log(`✅ Product "${product.name}" updated by seller ${sellerId}`);

      return res.redirect('/seller/products');
    } catch (err) {
      console.error('❌ Error updating product:', err);
      return res.send('Error updating product');
    }
  }
);

/**
 * ✅ Handle Delete Product (POST)
 */
router.post('/seller/products/delete/:id', sellerAuth, async (req, res) => {
  try {
    const sellerIdStr = req.session?.seller?._id;
    if (!sellerIdStr || !isValidId(sellerIdStr)) {
      return res.redirect('/seller/products');
    }
    const sellerId = new mongoose.Types.ObjectId(sellerIdStr);

    if (!isValidId(req.params.id)) {
      return res.redirect('/seller/products');
    }

    const result = await Product.deleteOne({
      _id: req.params.id,
      seller: sellerId
    });

    if (result.deletedCount === 0) {
      console.warn(`⚠️ Product not found for delete by seller ${sellerId}`);
    } else {
      console.log(`🗑 Product deleted by seller ${sellerId}`);
    }

    return res.redirect('/seller/products');
  } catch (err) {
    console.error('❌ Error deleting product:', err);
    return res.send('Error deleting product');
  }
});

module.exports = router;
