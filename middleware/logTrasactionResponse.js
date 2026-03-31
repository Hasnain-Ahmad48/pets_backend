const db = require('../config/DatabaseConnection');

const logTrasactionResponse = (data) => {

const {order_id,paymentIntent} = data
 
return new Promise((resolve, reject) => {
   const response = JSON.stringify(paymentIntent);

db.query(
      'INSERT INTO mk_trasaction_logs (order_id, response) VALUES (?, ?)',
      [order_id,response],
      (error, results) => {
        if (error) {
          console.error('Failed to log transaction:', error);
        reject(error);
        }
        resolve(results)  
      
      }
    );

})

};

module.exports = logTrasactionResponse
