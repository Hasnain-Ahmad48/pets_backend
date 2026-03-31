const express = require('express');
const router = express.Router();
const productReviewController = require('../../controller/mk_product_reviews/productReviewController.js');
// GET /api/reviews?product_id=1&user_id=2&page=1&limit=20
router.get('/', productReviewController);

module.exports = router;
