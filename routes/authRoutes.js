// routes/authRoutes.js
const express = require('express');
const passport = require('passport');
const router = express.Router();

// User Google OAuth Init
router.get(
  '/auth/google',
  passport.authenticate('user-google', { scope: ['profile', 'email'] })
);

// User Google OAuth Callback
router.get(
  '/auth/google/callback',
  passport.authenticate('user-google', {
    failureRedirect: '/login',
    // failureFlash: true, // uncomment if using connect-flash and want error messaging
  }),
  (req, res) => {
    // Successful authentication, redirect home (or to previous intended URL if you store it)
    return res.redirect('/');
  }
);

module.exports = router;
