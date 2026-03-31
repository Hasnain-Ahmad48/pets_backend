var express = require("express");
var RolesController = require("../../controller/Roles/RolesController.js");
var middleware = require("../../middleware/middleware.js");

var router = express.Router();

router.get("/role",middleware.validateToken, RolesController.getRoles);
router.get(
  "/getPermissions",

  RolesController.getAllPermissions
);
router.get(
  "/getpermissionsbyroleid/:roleid",

  RolesController.getPermissionsByRoleId
);

router.put("/updaterolepermissions", RolesController.updateRolePermissions);
router.post("/getpageswithrole", RolesController.getPagesForRoles);
router.get(
  "/countrole",

  RolesController.getRoleCount
);
router.post(
  "/createrolewithpagepermission",
  middleware.validateToken,
  RolesController.rolePagePermission
);

module.exports = router;
