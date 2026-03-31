var express = require("express");
var PermissionController = require("./../../controller/permission/PermissionController.js");
const middleware = require("../../middleware/middleware.js");

var router = express.Router();

router.get(
  "/getpermission",

  PermissionController.getPermissions
);
router.get(
  "/getpermissioncount",

  PermissionController.getPermissionsCount
);

module.exports = router;
