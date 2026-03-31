const db = require('../../config/DatabaseConnection');

// Function to fetch reviews with optional product_id and user_id filters
const getReviews = ({ product_id, user_id, page = 1, limit = 20 }) => {
  return new Promise((resolve, reject) => {
    const offset = (page - 1) * limit;
    const filters = [];
    const values = [];

    if (product_id) {
      filters.push('pr.product_id = ?');
      values.push(product_id);
    }
    if (user_id) {
      filters.push('pr.user_id = ?');
      values.push(user_id);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    const query = `
      SELECT 
        pr.review_id, pr.product_id, pr.user_id, pr.rating, pr.review_text, pr.created_at,
        u.firstName as user_name, u.user_profile_photo as user_avatar
      FROM mk_product_reviews pr
      LEFT JOIN user_signup u ON pr.user_id = u.id
      ${whereClause}
      ORDER BY pr.created_at DESC
      LIMIT ? OFFSET ?
    `;

    values.push(Number(limit), Number(offset));

    db.query(query, values, (err, rows) => {
      if (err) {
        return reject(err);
      }

      // Get total count for pagination
      const countQuery = `SELECT COUNT(*) as total FROM mk_product_reviews pr ${whereClause}`;
      db.query(countQuery, values.slice(0, values.length - 2), (err, countRows) => {
        if (err) return reject(err);

        resolve({
          currentPage: Number(page),
          totalPages: Math.ceil(countRows[0].total / limit),
          totalItems: countRows[0].total,
          reviews: rows
        });
      });
    });
  });
};

const verifyOrder = function(order_id, user_id) {
   return new Promise((resolve, reject) => {

      const query = `
        SELECT th.id, th.user_id, ts.title AS status_title
        FROM mk_transactions_header th
        LEFT JOIN mk_transactions_status ts ON th.trans_status_id = ts.id
        WHERE th.id = ? AND th.user_id = ? AND ts.title = 'Delivered'
      `;

      db.query(query, [order_id, user_id], (err, rows) => {
        if (err) return reject(err);

        if (rows.length === 0) return resolve(null); // Not delivered or not user's order

        resolve(rows[0]);
      });
    });
};

const addOrUpdateReview = function(order_id, user_id, rating, review) {
   return new Promise((resolve, reject) => {

      const checkQuery = `
        SELECT id FROM mk_transaction_reviews
        WHERE order_id = ? AND user_id = ?
      `;

      db.query(checkQuery, [order_id, user_id], (err, rows) => {
        if (err) return reject(err);

        if (rows.length > 0) {
          // UPDATE existing review
          const updateQuery = `
            UPDATE mk_transaction_reviews
            SET rating = ?, review = ?, updated_at = NOW()
            WHERE order_id = ? AND user_id = ?
          `;

          db.query(updateQuery, [rating, review, order_id, user_id], (err2) => {
            if (err2) return reject(err2);

            resolve({
              action: "update",
              data: { order_id, rating, review }
            });
          });

        } else {
          // INSERT new review
          const insertQuery = `
            INSERT INTO mk_transaction_reviews
            (order_id, user_id, rating, review, created_at)
            VALUES (?, ?, ?, ?, NOW())
          `;

          db.query(insertQuery, [order_id,user_id, rating, review], (err3, result) => {
            if (err3) return reject(err3);

            resolve({
              action: "insert",
              data: {  order_id, rating, review }
            });
          });
        }
      });
    });
};

const addOrUpdateProductReview = function(order_id, user_id, product_id, rating, review) {
  return new Promise((resolve, reject) => {
    const checkQuery = `
      SELECT review_id FROM mk_product_reviews
      WHERE order_id = ? AND user_id = ? AND product_id = ?
    `;
    db.query(checkQuery, [order_id, user_id, product_id], (err, rows) => {
      if (err) return reject(err);
      let query, params, action;
      if (rows.length > 0) {
        // UPDATE review
        query = `
          UPDATE mk_product_reviews
          SET rating = ?, review_text = ?, updated_at = NOW()
          WHERE order_id = ? AND user_id = ? AND product_id = ?
        `;
        params = [rating, review, order_id, user_id, product_id];
        action = "update";
      } else {
        // INSERT review
        query = `
          INSERT INTO mk_product_reviews
          (order_id, user_id, product_id, rating, review_text, created_at)
          VALUES (?, ?, ?, ?, ?, NOW())
        `;
        params = [order_id, user_id, product_id, rating, review];
        action = "insert";
      }

      db.query(query, params, (err2) => {
        if (err2) return reject(err2);

        //  UPDATE OVERALL PRODUCT RATING
        const updateRatingQuery = `
          UPDATE mk_products
          SET overall_rating = (
            SELECT ROUND(AVG(rating),1)
            FROM mk_product_reviews
            WHERE product_id = ?
          )
          WHERE id = ?
        `;

        db.query(updateRatingQuery, [product_id, product_id], (err3) => {
          if (err3) return reject(err3);
          resolve({
            action,
            data: { order_id, product_id, rating, review }
          });
        });
      });
    });
  }); 
};

module.exports = { getReviews, verifyOrder, addOrUpdateReview,addOrUpdateProductReview };