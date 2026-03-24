// routes/sellerDashboardRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const sellerAuth = require('../middlewares/sellerAuth');
const Order = require('../models/orderModel');

// Seller Analytics Dashboard
router.get('/seller/analytics', sellerAuth, async (req, res) => {
  try {
    const sellerIdStr = req.session?.seller?._id;
    if (!sellerIdStr || !mongoose.Types.ObjectId.isValid(sellerIdStr)) {
      // If session missing or malformed, send to login
      return res.redirect('/seller-login');
    }
    const sellerId = new mongoose.Types.ObjectId(sellerIdStr);

    // ---- Summary Stats ----
    const stats = await Order.aggregate([
      { $unwind: '$items' }, // break array of items into separate docs
      { $match: { 'items.vendor': sellerId } }, // only this seller's products
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalEarnings: { $sum: '$items.subtotal' },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
          },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, 1, 0] }
          }
        }
      }
    ]);

    const summary = stats[0] || {
      totalOrders: 0,
      totalEarnings: 0,
      pendingOrders: 0,
      completedOrders: 0
    };

    // ---- Recent Orders Table ----
    const recentOrders = await Order.aggregate([
      { $unwind: '$items' },
      { $match: { 'items.vendor': sellerId } },
      {
        $project: {
          customerName: { $ifNull: ['$guestInfo.name', 'Guest User'] },
          productName: '$items.name',
          qty: '$items.qty',
          price: '$items.price',
          subtotal: '$items.subtotal',
          status: '$status',
          createdAt: '$createdAt'
        }
      },
      { $sort: { createdAt: -1 } },
      { $limit: 5 }
    ]);

    return res.render('seller/analytics', {
      seller: req.session.seller,
      summary,
      recentOrders
    });
  } catch (err) {
    console.error('Error loading analytics:', err);
    return res.status(500).send('Error loading analytics');
  }
});

module.exports = router;
