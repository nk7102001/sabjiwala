// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Seller = require('../models/sellerModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel'); // required for dashboard recent orders
const { ensureAuthenticated, isAdmin } = require('../middlewares/auth'); // admin guards

// Helper to validate ObjectId safely
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Show all sellers (latest first)
router.get('/admin/sellers', ensureAuthenticated, isAdmin, async (req, res) => {
  try {
    const sellers = await Seller.find().sort({ createdAt: -1 }).lean();
    return res.render('admin/seller-list', { sellers, admin: req.user });
  } catch (err) {
    console.error('Error loading sellers:', err);
    return res.status(500).send('Error loading sellers');
  }
});

// Seller overview page (Fix for "Cannot GET /admin/seller")
router.get('/admin/seller', ensureAuthenticated, isAdmin, async (req, res) => {
  try {
    const sellers = await Seller.find().sort({ createdAt: -1 }).lean();
    return res.render('admin/sellers', {
      sellers,
      admin: req.user,
      search: (req.query && req.query.search) || ''
    });
  } catch (err) {
    console.error('Error loading seller details:', err);
    return res.status(500).send('Error loading seller details');
  }
});

// Approve seller
router.post('/admin/sellers/:id/approve', ensureAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.redirect('/admin/sellers');
    await Seller.findByIdAndUpdate(id, { status: 'Approved' });
    return res.redirect('/admin/sellers');
  } catch (err) {
    console.error('Error approving seller:', err);
    return res.status(500).send('Error approving seller');
  }
});

// Reject seller
router.post('/admin/sellers/:id/reject', ensureAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.redirect('/admin/sellers');
    await Seller.findByIdAndUpdate(id, { status: 'Rejected' });
    return res.redirect('/admin/sellers');
  } catch (err) {
    console.error('Error rejecting seller:', err);
    return res.status(500).send('Error rejecting seller');
  }
});

// Admin dashboard
router.get('/admin/dashboard', ensureAuthenticated, isAdmin, async (req, res) => {
  try {
    // Parallel queries for performance (non-breaking)
    const [pendingProducts, sellerCount, sellers, orders] = await Promise.all([
      Product.countDocuments({ approved: false }),
      Seller.countDocuments(),
      Seller.find().sort({ createdAt: -1 }).lean(),
      Order.find().sort({ createdAt: -1 }).limit(10).lean()
    ]);

    return res.render('admin/dashboard', {
      pendingProducts,
      sellerCount,
      sellers,
      orders,
      admin: req.user,
      query: req.query || {}
    });
  } catch (err) {
    console.error('Error loading dashboard:', err);
    return res.status(500).send('Error loading dashboard');
  }
});

// Show products pending approval
router.get('/admin/pending-products', ensureAuthenticated, isAdmin, async (req, res) => {
  try {
    const products = await Product.find({ approved: false })
      .populate('seller')
      .lean();

    return res.render('admin/pending-products', { products, admin: req.user });
  } catch (err) {
    console.error('Error loading pending products:', err);
    return res.status(500).send('Error loading pending products');
  }
});

// Approve product
router.post('/admin/products/:id/approve', ensureAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.redirect('/admin/pending-products');
    await Product.findByIdAndUpdate(id, { approved: true });
    return res.redirect('/admin/pending-products');
  } catch (err) {
    console.error('Error approving product:', err);
    return res.status(500).send('Error approving product');
  }
});

// Reject (delete) product
router.post('/admin/products/:id/reject', ensureAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.redirect('/admin/pending-products');
    await Product.findByIdAndDelete(id);
    return res.redirect('/admin/pending-products');
  } catch (err) {
    console.error('Error rejecting product:', err);
    return res.status(500).send('Error rejecting product');
  }
});

// Single Seller Details Page
router.get('/admin/sellers/:id', ensureAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(404).send('Seller not found');

    // Adjust as per your Seller model:
    // - If products: [{ product: ObjectId, ... }], keep populate('products.product')
    // - If products: [ObjectId], change to populate('products')
    const seller = await Seller.findById(id)
      .populate('products.product')
      .lean();

    if (!seller) {
      return res.status(404).send('Seller not found');
    }

    return res.render('admin/seller-details', {
      seller,
      admin: req.user
    });
  } catch (err) {
    console.error('Error loading seller details:', err);
    return res.status(500).send('Error loading seller details');
  }
});

module.exports = router;
