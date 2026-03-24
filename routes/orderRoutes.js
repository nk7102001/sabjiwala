// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const { isCustomer } = require('../middlewares/auth');
const Order = require('../models/orderModel');

// Create order from cart payload
router.post('/cart/checkout', isCustomer, async (req, res) => {
  try {
    const cart = req.body.cart;

    if (!Array.isArray(cart) || cart.length === 0) {
      return res.json({ success: false, message: 'Cart is empty' });
    }

    let total = 0;
    const items = cart.map((item) => {
      const price = Number(item.price) || 0;
      let qty = parseInt(item.qty, 10);
      if (isNaN(qty) || qty < 1) qty = 1;

      const subtotal = price * qty;
      total += subtotal;

      return {
        product: item.product,
        vendor: item.vendor,
        price,
        qty
        // If your Order schema supports items.subtotal, you can add: subtotal
      };
    });

    const order = new Order({
      user: req.user._id,
      items,
      total
    });

    await order.save();
    return res.json({ success: true, orderId: order._id });
  } catch (err) {
    console.error('Order Checkout Failed:', err);
    return res.json({ success: false, message: 'Order placement failed.' });
  }
});

// List current user's orders
router.get('/', isCustomer, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: 'items.product',
        select: 'name'
      })
      .populate({
        path: 'items.vendor',
        select: 'shopName name'
      })
      .lean();

    return res.render('orders', { orders });
  } catch (err) {
    console.error('Error loading orders:', err);
    req.flash('error_msg', 'Error loading orders');
    return res.redirect('/');
  }
});

module.exports = router;
