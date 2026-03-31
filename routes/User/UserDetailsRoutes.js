var express = require("express");
var multer = require("multer");
var path = require("path");
var UserDetailsController = require("../../controller/User/UserDetailsController.js");
var middleware = require("../../middleware/middleware.js");

var router = express.Router();

var storage = multer.diskStorage({
  destination: "public/uploads/",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});
var upload = multer({ storage: storage });

router.post("/login", UserDetailsController.loginUser);
router.get(
  "/logout",
  middleware.hasPermission,
  UserDetailsController.logoutUser
);
router.get(
  "/getalluser",

  UserDetailsController.getUserDetails
);
router.get(
  "/getuserbyid/:id",

  UserDetailsController.getUserByIdController
);
router.get(
  "/getuserprofilebyid/:id",

  UserDetailsController.getUserById
);
router.post(
  "/adduser",
  middleware.validateToken,
  upload.single("image"),
  UserDetailsController.addUser
);
router.put(
  "/updateuser/:id",
  middleware.validateToken,
  upload.single("image"),
  UserDetailsController.updateUserController
);
router.delete(
  "/deleteuser/:id",
  middleware.validateToken,
  UserDetailsController.deleteUserByIdController
);
router.get(
  "/allusers",

  UserDetailsController.getUserCount
);
router.get(
  "/pageAndpermission/:roleid",

  UserDetailsController.getRoleWithPagePermission
);

module.exports = router;
