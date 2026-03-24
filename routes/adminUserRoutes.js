// routes/adminUserRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const adminAuth = require('../middlewares/adminAuth');
const User = require('../models/userModel');

// Helper to validate ObjectId
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// All users + search
router.get('/admin/users', adminAuth, async (req, res) => {
  try {
    const search = (req.query && req.query.search ? String(req.query.search) : '').trim();
    let query = {};

    if (search) {
      const re = new RegExp(search, 'i');
      query = { $or: [{ name: re }, { email: re }] };
    }

    const users = await User.find(query).sort({ createdAt: -1 }).lean();
    return res.render('admin/users', { users, search });
  } catch (err) {
    console.error('Error loading users:', err);
    return res.status(500).send('Error loading users');
  }
});

// Block user
router.post('/admin/users/:id/block', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.redirect('/admin/users');

    await User.findByIdAndUpdate(id, { isBlocked: true });
    return res.redirect('/admin/users');
  } catch (err) {
    console.error('Error blocking user:', err);
    return res.status(500).send('Error blocking user');
  }
});

// Unblock user
router.post('/admin/users/:id/unblock', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.redirect('/admin/users');

    await User.findByIdAndUpdate(id, { isBlocked: false });
    return res.redirect('/admin/users');
  } catch (err) {
    console.error('Error unblocking user:', err);
    return res.status(500).send('Error unblocking user');
  }
});

module.exports = router;
