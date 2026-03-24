// routes/sellerRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const Seller = require('../models/sellerModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel'); // Import Order model
const sellerAuth = require('../middlewares/sellerAuth');

// Multer for seller docs
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/sellers'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Become Seller
router.get('/become-seller', (req, res) => res.render('seller/become-seller'));

router.post(
  '/become-seller',
  upload.fields([{ name: 'idProof' }, { name: 'shopPhoto' }]),
  async (req, res) => {
    try {
      const {
        name,
        email,
        phone,
        shopName,
        address,
        city,
        state,
        businessType,
        password
      } = req.body;

      if (
        !name || !email || !phone || !shopName ||
        !address || !city || !state || !businessType || !password
      ) {
        return res.render('seller/become-seller', { error: 'All fields required' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const idProofFile =
        req.files && req.files['idProof'] && req.files['idProof'][0]
          ? '/uploads/sellers/' + req.files['idProof'].filename
          : null;

      const shopPhotoFile =
        req.files && req.files['shopPhoto'] && req.files['shopPhoto']
          ? '/uploads/sellers/' + req.files['shopPhoto'].filename
          : null;

      const newSeller = new Seller({
        name,
        email: String(email).toLowerCase(),
        phone,
        shopName,
        address,
        city,
        state,
        businessType,
        password: hashedPassword,
        status: 'Pending',
        idProof: idProofFile,
        shopPhoto: shopPhotoFile
      });

      await newSeller.save();

      return res.render('seller/become-seller', {
        success: 'Registration submitted! Wait for approval.'
      });
    } catch (err) {
      console.error(err);
      return res.render('seller/become-seller', { error: 'Something went wrong' });
    }
  }
);

// Login
router.get('/seller/login', (req, res) => {
  return res.render('seller/login', {
    error: req.flash('error'),
    success_msg: req.flash('success_msg')
  });
});

router.post('/seller/login', async (req, res) => {
  const email = (req.body.email || '').toLowerCase().trim();
  const { password } = req.body;

  try {
    const seller = await Seller.findOne({ email });
    if (!seller) {
      req.flash('error', 'Seller not found');
      return res.redirect('/seller/login');
    }

    if (seller.isBlocked) {
      req.flash('error', 'Account blocked');
      return res.redirect('/seller/login');
    }

    if (seller.status !== 'Approved') {
      req.flash('error', `Your account is ${seller.status}`);
      return res.redirect('/seller/login');
    }

    const match = await bcrypt.compare(password, seller.password || '');
    if (!match) {
      req.flash('error', 'Invalid password');
      return res.redirect('/seller/login');
    }

    req.session.seller = {
      _id: seller._id.toString(),
      name: seller.name,
      email: seller.email,
      status: seller.status,
      isBlocked: seller.isBlocked
    };

    return res.redirect('/seller/dashboard');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Login error');
    return res.redirect('/seller/login');
  }
});

// Dashboard
router.get('/seller/dashboard', sellerAuth, async (req, res) => {
  try {
    const sellerId = req.session.seller._id;
    const orders = await Order.find({
      'items.vendor': sellerId,
      status: { $in: ['Pending', 'Processing'] }
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.render('seller/dashboard', { seller: req.session.seller, orders });
  } catch (err) {
    console.error('Error loading seller dashboard orders:', err);
    req.flash('error_msg', 'Could not load orders');
    return res.render('seller/dashboard', { seller: req.session.seller, orders: [] });
  }
});

// Analytics (placeholder demo data as in your original)
router.get('/seller/analytics', sellerAuth, async (req, res) => {
  const summary = {
    totalOrders: 25,
    pendingOrders: 5,
    completedOrders: 18,
    canceledOrders: 2,
    totalSales: 15000
  };
  const recentOrders = [
    { orderId: '101', customerName: 'John Doe', date: '2025-08-10', total: 1200, status: 'Completed' },
    { orderId: '102', customerName: 'Jane Smith', date: '2025-08-11', total: 2300, status: 'Pending' }
  ];
  return res.render('seller/analytics', { seller: req.session.seller, summary, recentOrders });
});

// Logout
router.get('/seller/logout', (req, res) => req.session.destroy(() => res.redirect('/seller/login')));

module.exports = router;
