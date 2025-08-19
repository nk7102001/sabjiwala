// routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

// POST review
router.post('/product/:productId/reviews', reviewController.addReview);

module.exports = router;
