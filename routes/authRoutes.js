const express = require('express');
const passport = require('passport');
const router = express.Router();

// User Google OAuth Init with role saved in session
router.get('/auth/google', (req, res, next) => {
  // Role is 'user' by default; for delivery login pass ?role=delivery
  const role = req.query.role === 'delivery' ? 'delivery' : 'user';
  req.session.oauthRole = role; // Save role in session to use after callback
  const strategy = role === 'delivery' ? 'delivery-google' : 'user-google';
  passport.authenticate(strategy, { scope: ['profile', 'email'] })(req, res, next);
});

// Google OAuth Callback for both user and delivery
router.get(
  '/auth/google/callback',
  (req, res, next) => {
    const strategy = req.session.oauthRole === 'delivery' ? 'delivery-google' : 'user-google';
    passport.authenticate(strategy, {
      failureRedirect: req.session.oauthRole === 'delivery' ? '/delivery/login' : '/login',
      // failureFlash: true, // uncomment if using connect-flash
    })(req, res, next);
  },
  (req, res) => {
    // Redirect based on role after successful authentication
    const role = req.session.oauthRole || 'user';
    if (role === 'delivery') return res.redirect('/delivery/dashboard');
    return res.redirect('/');
  }
);

module.exports = router;
