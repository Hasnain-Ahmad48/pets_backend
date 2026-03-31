var db = require("../../config/DatabaseConnection.js");

var findPages = function (callback) {
  var query = "SELECT * FROM pages";
  db.query(query, function (err, result) {
    if (err) return callback(err, null);
    return callback(null, result);
  });
};

var countPage = function (callback) {
  var query = "SELECT COUNT(*) AS pageCount FROM pages";
  db.query(query, function (err, result) {
    if (err) return callback(err, null);
    return callback(null, result);
  });
};

const getPagePermissionForRole = (roleid) => {
  return new Promise((resolve, reject) => {
    var query = `SELECT u.*, p.pageName, per.permissionName FROM userrolepagepermission AS u
                JOIN dashboard_user_table as d ON u.userid = d.id
JOIN role AS r ON u.roleid = ${roleid}
JOIN pages AS p ON u.pageid = p.PageID
JOIN permissions AS per ON u.permissionid = per.permissionID;`;
    db.query(query, function (err, result) {
      if (err) reject(err);
      resolve(result);
    });
  });
};

module.exports = {
  findPages: findPages,
  countPage: countPage,
  getPagePermissionForRole: getPagePermissionForRole,
};
