var PermissionModel = require("./../../models/permission/PermissionModel.js");

exports.getPermissions = function (req, res) {
  try {
    PermissionModel.findPages(function (err, data) {
      if (err) {
        return res.status(500).json({ message: err.message });
      }
      res.json(data);
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPermissionsCount = function (req, res) {
  try {
    PermissionModel.permissionCount(function (err, data) {
      if (err) {
        return res.status(500).json({ message: err.message });
      }
      res.json(data);
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
