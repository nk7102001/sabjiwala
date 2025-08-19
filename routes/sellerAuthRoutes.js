// routes/sellerRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Seller = require('../models/sellerModel');
const sellerAuth = require('../middlewares/sellerAuth');

/**
 * ✅ Seller Login Page (GET)
 */
router.get('/seller-login', (req, res) => {
  return res.render('seller/login'); // views/seller/login.ejs
});

/**
 * ✅ Seller Login Handler (POST)
 */
router.post('/seller-login', async (req, res) => {
  const email = (req.body.email || '').trim();
  const password = req.body.password || '';

  try {
    const seller = await Seller.findOne({ email });
    if (!seller) {
      return res.render('seller/login', { error: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, seller.password || '');
    if (!match) {
      return res.render('seller/login', { error: 'Invalid email or password' });
    }

    if (seller.isBlocked) {
      return res.render('seller/login', { error: 'Your account has been blocked. Contact admin.' });
    }
    if (seller.status !== 'Approved') {
      return res.render('seller/login', { error: 'Your account is not approved yet.' });
    }

    // ✅ Save seller to session (_id as STRING)
    req.session.seller = {
      _id: seller._id.toString(),
      name: seller.name,
      email: seller.email,
      status: seller.status,
      isBlocked: seller.isBlocked
    };

    console.log(`✅ Seller logged in: ${seller._id}`);
    return res.redirect('/seller-dashboard');
  } catch (err) {
    console.error('❌ Login error:', err);
    return res.render('seller/login', { error: 'Something went wrong. Please try again.' });
  }
});

/**
 * ✅ Seller Dashboard (GET)
 */
router.get('/seller-dashboard', sellerAuth, (req, res) => {
  return res.render('seller/dashboard', { seller: req.session.seller });
});

/**
 * ✅ Seller Logout
 */
router.get('/seller-logout', (req, res) => {
  req.session.destroy(() => res.redirect('/seller-login'));
});

module.exports = router;
