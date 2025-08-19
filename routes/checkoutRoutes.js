// routes/checkoutRoutes.js
const express = require("express");
const Razorpay = require("razorpay");
const router = express.Router();
const Order = require("../models/orderModel");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Checkout Page
router.get("/checkout", (req, res) => {
  let cart = req.session.cart || [];
  if (!Array.isArray(cart) || cart.length === 0) {
    return res.redirect("/cart");
  }

  // Ensure price/qty are numbers and subtotal calculated
  cart = cart.map((item) => {
    const price = Number(item.price) || 0;
    const qty = Number(item.qty) || 0;
    const subtotal =
      item.subtotal !== undefined ? Number(item.subtotal) : price * qty;
    return { ...item, price, qty, subtotal };
  });

  const total = cart.reduce((sum, item) => Number(sum) + Number(item.subtotal || 0), 0);

  return res.render("customer/checkout", {
    cart,
    total,
    customer: req.user,
    razorpayKey: process.env.RAZORPAY_KEY_ID,
  });
});

// Create Razorpay Order
router.post("/create-order", async (req, res) => {
  try {
    const totalAmount = Number(req.body.amount);
    if (!totalAmount || totalAmount < 1) {
      return res.status(400).json({
        error: "Invalid order amount",
        details: { totalAmount },
      });
    }

    const options = {
      amount: Math.round(totalAmount * 100), // convert to paise
      currency: "INR",
      receipt: `order_rcptid_${Date.now()}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);
    return res.json(razorpayOrder);
  } catch (err) {
    console.error("Error creating Razorpay order:", err);
    return res.status(500).send("Error creating Razorpay order");
  }
});

// Place Order after payment / COD
router.post("/checkout", async (req, res) => {
  try {
    const cart = Array.isArray(req.session.cart) ? req.session.cart : [];
    if (cart.length === 0) return res.redirect("/cart");

    const {
      name,
      phone,
      email,
      address,
      city,
      pincode,
      paymentMethod,
      paymentStatus,
    } = req.body;

    // Light normalization of cart items
    const items = cart.map((item) => {
      const price = Number(item.price) || 0;
      const qty = Number(item.qty) || 0;
      const subtotal =
        item.subtotal !== undefined ? Number(item.subtotal) : price * qty;
      return {
        product: item.productId,
        vendor: item.vendorId,
        name: item.name || item.productName,
        price,
        qty,
        subtotal,
      };
    });

    const total = items.reduce((sum, i) => Number(sum) + Number(i.subtotal || 0), 0);

    await Order.create({
      guestInfo: { name, phone, email },
      shippingAddress: { street: address, city, pincode },
      items,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === "Online" ? paymentStatus : "Unpaid",
      status: "Pending",
    });

    // Clear cart after successful order creation
    req.session.cart = [];
    return res.render("customer/order-success", { name });
  } catch (err) {
    console.error("Error placing order:", err);
    return res.status(500).send("Error placing order");
  }
});

module.exports = router;
