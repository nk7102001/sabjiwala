// routes/cartRoutes.js
const express = require("express");
const router = express.Router();
const { isCustomer } = require("../middlewares/auth");
const Product = require("../models/productModel");
const Order = require("../models/orderModel");

// ---------------- Add to cart ----------------
router.post("/cart/add", isCustomer, async (req, res) => {
  try {
    const { vendorId, vendorName, productId, productName, price, qty } = req.body;

    if (!req.session.cart) req.session.cart = [];
    const cart = req.session.cart;

    // Parse and normalize numeric inputs safely
    const unitPrice = Number(price);
    let quantity = parseInt(qty, 10);
    if (isNaN(quantity) || quantity < 1) quantity = 1;

    // Find existing item by vendor+product
    const existingIndex = cart.findIndex(
      (item) => item.vendorId === vendorId && item.productId === productId
    );

    if (existingIndex > -1) {
      cart[existingIndex].qty += quantity;
      cart[existingIndex].subtotal = Number(cart[existingIndex].price) * Number(cart[existingIndex].qty);
    } else {
      cart.push({
        vendorId,
        vendorName,
        productId,
        name: productName,
        price: unitPrice,
        qty: quantity,
        subtotal: unitPrice * quantity,
      });
    }

    req.session.cart = cart;
    return res.json({ success: true, cartCount: cart.length });
  } catch (err) {
    console.error("Error adding to cart:", err);
    return res.status(500).send("Error adding to cart");
  }
});

// ---------------- View cart ----------------
router.get("/cart", isCustomer, (req, res) => {
  const cart = req.session.cart || [];
  const total = cart.reduce((sum, item) => Number(sum) + Number(item.subtotal || 0), 0);
  return res.render("cart", { cart, total, customer: req.user }); // pass customer to frontend
});

// ---------------- Update quantity ----------------
router.post("/cart/update/:productId", isCustomer, (req, res) => {
  const cart = req.session.cart || [];
  const item = cart.find((i) => i.productId === req.params.productId);
  if (item) {
    let qty = parseInt(req.body.qty, 10);
    if (isNaN(qty) || qty < 1) qty = 1;
    item.qty = qty;
    item.subtotal = Number(item.price) * Number(qty);
  }
  req.session.cart = cart;
  return res.redirect("/cart");
});

// ---------------- Remove item ----------------
router.post("/cart/remove/:productId", isCustomer, (req, res) => {
  req.session.cart = (req.session.cart || []).filter(
    (i) => i.productId !== req.params.productId
  );
  return res.redirect("/cart");
});

// ---------------- Save localStorage cart to session before checkout ----------------
router.post("/set-cart", isCustomer, (req, res) => {
  try {
    const raw = req.body.cartData || "[]";
    const cartData = JSON.parse(raw);

    // Normalize numbers and structure to avoid NaN totals later
    const normalized = Array.isArray(cartData)
      ? cartData.map((it) => {
          const price = Number(it.price);
          let qty = parseInt(it.qty, 10);
          if (isNaN(qty) || qty < 1) qty = 1;
          return {
            vendorId: it.vendorId,
            vendorName: it.vendorName,
            productId: it.productId,
            name: it.name || it.productName,
            price,
            qty,
            subtotal: price * qty,
          };
        })
      : [];

    req.session.cart = normalized;
    return res.redirect("/checkout");
  } catch (error) {
    console.error("Error setting cart:", error);
    return res.redirect("/cart");
  }
});

module.exports = router;
