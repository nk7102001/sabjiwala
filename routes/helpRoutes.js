// routes/helpRoutes.js
const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/auth'); // kept for consistency if you later protect it

router.get('/help-center', (req, res) => {
  return res.render('helpCenter', { user: req.user });
});

module.exports = router;
