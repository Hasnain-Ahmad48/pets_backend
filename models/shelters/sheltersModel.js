var db = require("../../config/DatabaseConnection.js");



var getShelters = function (state, callback) {
  let query = "SELECT * FROM shelters";
  
  // Add filtering if a slug is provided
  if (state) {
    query += " WHERE state = ?";
  }

  db.query(query, state ? [state] : [], function (err, result) {
    if (err) return callback(err, null);
    return callback(null, result);
  });
};

module.exports = {
  getShelters,
};