// routes/vendorRoutes.js
const express = require('express');
const router = express.Router();
const Seller = require('../models/sellerModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const mongoose = require('mongoose');
const sellerAuth = require('../middlewares/sellerAuth'); // Use existing middleware

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Vendor Products Page (Existing)
 */
router.get('/vendor/:id', async (req, res) => {
  try {
    const vendorId = req.params.id;
    if (!isValidId(vendorId)) {
      req.flash('error_msg', 'Vendor not found');
      return res.redirect('/');
    }
    const vendorObjId = new mongoose.Types.ObjectId(vendorId);

    const vendor = await Seller.aggregate([
      { $match: { _id: vendorObjId } },
      { $addFields: { avgRating: { $avg: '$products.rating' } } }
    ]);

    if (!vendor || vendor.length === 0) {
      req.flash('error_msg', 'Vendor not found');
      return res.redirect('/');
    }

    const vendorData = vendor[0];

    const products = await Product.find({ seller: vendorObjId, inStock: true })
      .sort({ createdAt: -1 })
      .lean();

    return res.render('vendor-products', {
      vendor: vendorData,
      products
    });
  } catch (err) {
    console.error('❌ Error loading vendor products:', err);
    req.flash('error_msg', 'Could not load vendor products');
    return res.redirect('/');
  }
});

/**
 * Vendor Dashboard - Show Orders Assigned to This Vendor (Pending or Processing)
 */
router.get('/vendor/:id/orders', sellerAuth, async (req, res) => {
  try {
    const vendorId = req.params.id;
    if (!isValidId(vendorId)) {
      req.flash('error_msg', 'Invalid vendor');
      return res.redirect('/');
    }
    const vendorObjId = new mongoose.Types.ObjectId(vendorId);

    const orders = await Order.find({
      'items.vendor': vendorObjId,
      status: { $in: ['Pending', 'Processing'] }
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.render('vendor-orders', {
      vendorId,
      orders
    });
  } catch (err) {
    console.error('❌ Error loading vendor orders:', err);
    req.flash('error_msg', 'Could not load orders');
    return res.redirect(`/vendor/${req.params.id}`);
  }
});

/**
 * Mark Order as Packed (Assign Delivery Guy and Set status "Assigned")
 */
router.post('/vendor/order/:orderId/packed', sellerAuth, async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!isValidId(orderId)) {
      req.flash('error_msg', 'Order not found');
      return res.redirect('/seller/dashboard');
    }

    // NOTE: In production, deliveryGuyId should come from assignment logic, not hard-coded.
    const deliveryGuyId = '68a2c37e383e49f94c025b5f';

    const order = await Order.findById(orderId);
    if (!order) {
      req.flash('error_msg', 'Order not found');
      return res.redirect('/seller/dashboard');
    }

    order.status = 'Assigned';
    order.deliveryGuy = deliveryGuyId;
    await order.save();

    req.flash('success_msg', 'Order marked as packed and assigned to delivery guy');
    return res.redirect('/seller/dashboard');
  } catch (err) {
    console.error('❌ Error updating order status:', err);
    req.flash('error_msg', 'Could not update order status');
    return res.redirect('/seller/dashboard');
  }
});

module.exports = router;
