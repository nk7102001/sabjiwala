// routes/adminSellerRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const adminAuth = require('../middlewares/adminAuth');
const Seller = require('../models/sellerModel');

// Helper to validate ObjectId
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// View all sellers with filters
router.get('/admin/sellers', adminAuth, async (req, res) => {
  try {
    const search = (req.query && req.query.search ? String(req.query.search) : '').trim();
    let query = {};

    if (search) {
      // Case-insensitive search on name/shopName/email
      const re = new RegExp(search, 'i');
      query = { $or: [{ name: re }, { shopName: re }, { email: re }] };
    }

    const sellers = await Seller.find(query).sort({ createdAt: -1 }).lean();
    return res.render('admin/sellers', { sellers, search });
  } catch (err) {
    console.error('Error loading sellers:', err);
    return res.status(500).send('Error loading sellers');
  }
});

// Approve seller
router.post('/admin/sellers/:id/approve', adminAuth, async (req, res) => {
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

// Block seller
router.post('/admin/sellers/:id/block', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.redirect('/admin/sellers');

    await Seller.findByIdAndUpdate(id, { isBlocked: true });
    return res.redirect('/admin/sellers');
  } catch (err) {
    console.error('Error blocking seller:', err);
    return res.status(500).send('Error blocking seller');
  }
});

// Unblock seller
router.post('/admin/sellers/:id/unblock', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.redirect('/admin/sellers');

    await Seller.findByIdAndUpdate(id, { isBlocked: false });
    return res.redirect('/admin/sellers');
  } catch (err) {
    console.error('Error unblocking seller:', err);
    return res.status(500).send('Error unblocking seller');
  }
});

module.exports = router;
