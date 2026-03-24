const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/auth');
const User = require('../models/userModel');

// GET: Saved addresses
router.get('/address/saved', ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();
    if (!user) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/');
    }
    const addresses = Array.isArray(user.addresses) ? user.addresses : [];
    return res.render('addressSaved', { addresses });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading saved addresses');
    return res.redirect('/');
  }
});

// POST: Add saved address
router.post('/address/saved', ensureAuthenticated, async (req, res) => {
  try {
    const { label, name, phone, street, city, state, pincode, country } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/address/saved');
    }

    if (!Array.isArray(user.addresses)) {
      user.addresses = [];
    }

    user.addresses.push({
      label,
      name,
      phone,
      street,
      city,
      state,
      pincode,
      country: country || 'India'
    });

    await user.save();
    req.flash('success_msg', 'Address added successfully');
    return res.redirect('/address/saved');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error adding address');
    return res.redirect('/address/saved');
  }
});

// POST: Delete saved address
router.post('/address/delete/:id', ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/address/saved');
    }

    if (!Array.isArray(user.addresses)) {
      user.addresses = [];
    }

    user.addresses = user.addresses.filter(addr => String(addr._id) !== String(req.params.id));
    await user.save();

    req.flash('success_msg', 'Address removed');
    return res.redirect('/address/saved');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting address');
    return res.redirect('/address/saved');
  }
});

module.exports = router;
