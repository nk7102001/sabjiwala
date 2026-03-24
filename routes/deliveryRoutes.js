// routes/deliveryRoutes.js
const express = require("express");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const mongoose = require("mongoose");
const DeliveryGuy = require("../models/DeliveryGuy");
const Order = require("../models/orderModel"); // Add order model

const router = express.Router();

// Middleware to check authentication
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  return res.redirect("/delivery/login");
}

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Login page GET
router.get("/delivery/login", (req, res) => {
  return res.render("delivery/login"); // login EJS page
});

// Login POST (local passport login)
router.post("/delivery/login", (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/delivery/dashboard",
    failureRedirect: "/delivery/login",
    failureFlash: true, // if using connect-flash
  })(req, res, next);
});

// Signup page GET
router.get("/delivery/signup", (req, res) => {
  return res.render("delivery/signup", { errors: [], formData: {} });
});

// Signup POST (normal signup with password)
router.post("/delivery/signup", async (req, res) => {
  const { name, mobile, password } = req.body;
  if (!name || !mobile || !password) {
    return res.status(400).send("Please fill all required fields.");
  }
  try {
    let user = await DeliveryGuy.findOne({ mobile });
    if (user) return res.status(400).send("Mobile number already registered.");

    const hashedPassword = await bcrypt.hash(password, 10);
    user = new DeliveryGuy({ name, mobile, password: hashedPassword });
    await user.save();

    req.login(user, (err) => {
      if (err) throw err;
      return res.redirect("/delivery/dashboard");
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).send("Server error");
  }
});

// Google OAuth Init for Delivery Guy
router.get(
  "/delivery/auth/google",
  passport.authenticate("delivery-google", { scope: ["profile", "email"] })
);

// Google OAuth Callback
router.get(
  "/delivery/auth/google/callback",
  passport.authenticate("delivery-google", {
    failureRedirect: "/delivery/signup",
    successRedirect: "/delivery/dashboard",
  })
);

// Delivery Dashboard with real orders fetched from DB
router.get("/delivery/dashboard", ensureAuthenticated, async (req, res) => {
  try {
    // Fetch active orders assigned to this delivery guy
    const orders = await Order.find({
      deliveryGuy: req.user._id,
      status: { $in: ["Assigned", "Accepted", "Picked Up"] },
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.render("delivery/dashboard", {
      deliveryGuy: req.user,
      orders,
    });
  } catch (err) {
    console.error("Error fetching orders:", err);
    return res.render("delivery/dashboard", {
      deliveryGuy: req.user,
      orders: [],
    });
  }
});

// Order Status Update Route
router.post(
  "/delivery/order/:id/status",
  ensureAuthenticated,
  async (req, res) => {
    const { status } = req.body;
    const allowedStatus = ["Accepted", "Picked Up", "Delivered", "Cancelled"];

    if (!allowedStatus.includes(status)) {
      return res.status(400).send("Invalid status");
    }

    try {
      const { id } = req.params;
      if (!isValidId(id)) return res.status(404).send("Order not found");

      const order = await Order.findOne({
        _id: id,
        deliveryGuy: req.user._id,
      });
      if (!order) return res.status(404).send("Order not found");

      order.status = status;
      await order.save();

      return res.redirect("/delivery/dashboard");
    } catch (err) {
      console.error("Error updating order status:", err);
      return res.status(500).send("Server error");
    }
  }
);

// Logout
router.get("/delivery/logout", (req, res) => {
  req.session.destroy(() => {
    return res.redirect("/delivery/login");
  });
});

module.exports = router;
