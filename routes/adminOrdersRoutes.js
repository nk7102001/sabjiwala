const express = require('express');
const router = express.Router();
const adminAuth = require('../middlewares/adminAuth');
const Order = require('../models/orderModel');
const Seller = require('../models/sellerModel');
const mongoose = require('mongoose');

// All Orders with filter options
router.get('/admin/orders', adminAuth, async (req, res) => {
  try {
    const { status, seller, customer, startDate, endDate } = req.query;

    const match = {};

    // Status filter
    if (status && status !== 'All') {
      match.status = status;
    }

    // Seller filter (handle ObjectId safely)
    if (seller && seller !== 'All') {
      if (mongoose.Types.ObjectId.isValid(seller)) {
        match['items.vendor'] = new mongoose.Types.ObjectId(seller);
      } else {
        // Invalid seller id => no results rather than error
        match['items.vendor'] = null; // ensures empty result
      }
    }

    // Customer name (guestInfo.name) case-insensitive
    if (customer) {
      match['guestInfo.name'] = new RegExp(customer.trim(), 'i');
    }

    // Date range filter (inclusive)
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        // End of day inclusive
        end.setHours(23, 59, 59, 999);
        match.createdAt = { $gte: start, $lte: end };
      }
    }

    const orders = await Order.find(match)
      .populate({ path: 'items.product' })
      .populate({ path: 'items.vendor' })
      .sort({ createdAt: -1 })
      .lean();

    const sellers = await Seller.find().select('shopName name').lean();

    return res.render('admin/orders', {
      orders,
      sellers,
      query: req.query
    });
  } catch (err) {
    console.error('Error loading admin orders:', err);
    // Non-breaking: keep response simple; if you have an admin flash layout, you can use it
    return res.status(500).send('Error loading orders');
  }
});

// Update Order Status
router.post('/admin/orders/:id/status', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      // Invalid id -> just return safely
      return res.redirect('/admin/orders');
    }

    // Optional: whitelist of statuses to prevent arbitrary values
    // const allowed = ['Pending', 'Processing', 'Assigned', 'Out for Delivery', 'Delivered', 'Canceled', 'Failed'];
    // if (!allowed.includes(status)) {
    //   return res.redirect('/admin/orders');
    // }

    await Order.findByIdAndUpdate(id, { status });
    return res.redirect('/admin/orders');
  } catch (err) {
    console.error('Error updating order status:', err);
    return res.status(500).send('Error updating status');
  }
});

module.exports = router;
