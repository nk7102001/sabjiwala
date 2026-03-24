// routes/couponRoutes.js
const express = require('express');
const router = express.Router();
const Coupon = require('../models/couponModel');
const { ensureAuthenticated } = require('../middlewares/auth');

// Public coupons page (active and not expired)
router.get('/coupons', async (req, res) => {
  try {
    const today = new Date();

    // Find active, non-expired coupons
    const coupons = await Coupon.find({
      isActive: true,
      expiryDate: { $gte: today }
    })
      // .select('code discountType discountValue expiryDate minOrderValue description') // optional projection
      .lean();

    return res.render('coupons', { coupons, user: req.user });
  } catch (err) {
    console.error('Error loading coupons:', err);
    req.flash('error_msg', 'Could not load coupons');
    return res.redirect('/');
  }
});

module.exports = router;
