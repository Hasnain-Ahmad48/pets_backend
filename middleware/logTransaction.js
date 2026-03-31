// middleware/logTransaction.js
const db = require("../config/DatabaseConnection")

const logTransaction = async (transactionData) => {
  const {
    order_id,
    user_id,
    amount,
    currency ,
    payment_method ,
    payment_status,
    transaction_date,
    gateway_response,
    error_message = null
  } = transactionData;

  console.log(amount,"Log transaction")


  return new Promise((resolve, reject) => {
    const query1 = `
      INSERT INTO transaction_record (
        order_id,
        user_id,
        amount,
        currency,
        payment_method,
        payment_status,
        transaction_date,
        gateway_response,
        error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values1 = [
      order_id,
      user_id,
      amount,
      currency || "USD",
      payment_method || "Stripe",
      payment_status,
      transaction_date,
      gateway_response,
      error_message
    ];

    console.log(values1,"cghecking values")

    // First query - Insert into transaction_record
    db.query(query1, values1, (err, result1) => {
      if (err) {
        return reject(err);
      }

      // Third query - Update mk_transactions_header
      const query3 = `
        UPDATE mk_transactions_header
        SET payment_method = ? , trans_code =?
        WHERE user_id = ?
      `;
      const values3 = [payment_method, gateway_response, user_id];

      db.query(query3, values3, (err, result3) => {
        if (err) {
          return reject(err);
        }

        // Final success response
        console.log("Transaction logged successfully:", result1);
        console.log("mk_transaction_header updated successfully:", result3);
        resolve({ result1, result3 });
      });
    });
  });
};

module.exports = logTransaction;
