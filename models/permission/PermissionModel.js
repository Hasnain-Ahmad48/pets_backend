var db = require("../../config/DatabaseConnection.js");

var findPages = function (callback) {
  var query = "SELECT * FROM permissions";
  db.query(query, function (err, result) {
    if (err) return callback(err, null);
    return callback(null, result);
  });
};

var permissionCount = function (callback) {
  var query = "SELECT COUNT(*) AS permissionCount FROM permissions";
  db.query(query, function (err, result) {
    if (err) return callback(err, null);
    return callback(null, result);
  });
};

module.exports = {
  findPages: findPages,
  permissionCount: permissionCount,
};
