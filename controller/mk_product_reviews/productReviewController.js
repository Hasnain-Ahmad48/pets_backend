const { getReviews } = require('../../models/mk_product_reviews/productReviewModel');

const productReviewController = async (req, res) => {
  try {
    const { product_id, user_id, page, limit } = req.query;

    const result = await getReviews({ product_id, user_id, page, limit });

    res.status(200).json({
      message: 'Reviews fetched successfully',
      data: result
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error', error: err });
  }
};

module.exports = productReviewController;
