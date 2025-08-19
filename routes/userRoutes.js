// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const { ensureAuthenticated } = require('../middlewares/auth');
const User = require('../models/userModel');

// Signup page (GET)
router.get('/signup', (req, res) => {
  return res.render('users/signup', {
    error: req.flash('error'),
    success_msg: req.flash('success_msg')
  });
});

// Signup (POST)
router.post('/signup', async (req, res) => {
  const name = (req.body.name || '').trim();
  const email = (req.body.email || '').toLowerCase().trim();
  const password = req.body.password || '';
  const confirmPassword = req.body.confirmPassword || '';

  const errors = [];

  if (!name || !email || !password || !confirmPassword) {
    errors.push('Please fill in all fields.');
  }
  if (password !== confirmPassword) {
    errors.push('Passwords do not match.');
  }
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters.');
  }

  if (errors.length > 0) {
    return res.render('users/signup', { error: errors, name, email });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      errors.push('Email is already registered.');
      return res.render('users/signup', { error: errors, name, email });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword
    });

    await newUser.save();

    req.flash('success_msg', 'You are now registered and can log in');
    return res.redirect('/login');
  } catch (err) {
    console.error('❌ Signup error:', err);
    return res.render('users/signup', {
      error: ['Something went wrong, please try again.'],
      name,
      email
    });
  }
});

// Login page (GET)
router.get('/login', (req, res) => {
  return res.render('users/login', {
    error: req.flash('error'),
    success_msg: req.flash('success_msg')
  });
});

// Login (POST) with role-based redirect
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error('❌ Passport error:', err);
      return next(err);
    }

    if (!user) {
      req.flash('error', (info && info.message) || 'Invalid email or password');
      return res.redirect('/login');
    }

    req.logIn(user, (err2) => {
      if (err2) {
        console.error('❌ req.logIn error:', err2);
        return next(err2);
      }

      // 🎯 Role-based redirect
      if (user.role === 'admin') {
        return res.redirect('/admin/dashboard');
      }
      return res.redirect('/');
    });
  })(req, res, next);
});

// Profile edit page (GET)
router.get('/profile/edit', ensureAuthenticated, (req, res) => {
  return res.render('editProfile', { user: req.user });
});

// Profile edit (POST)
router.post('/profile/edit', ensureAuthenticated, async (req, res) => {
  try {
    const name = (req.body.name || '').trim();
    const email = (req.body.email || '').toLowerCase().trim();
    const phone = (req.body.phone || '').trim();

    const user = await User.findById(req.user._id);
    if (!user) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/profile/edit');
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;

    await user.save();

    req.flash('success_msg', 'Profile updated successfully');
    return res.redirect('/profile/edit');
  } catch (err) {
    console.error('❌ Profile update error:', err);
    req.flash('error_msg', 'Error updating profile');
    return res.redirect('/profile/edit');
  }
});

module.exports = router;
