var express = require("express");
var multer = require("multer");
var path = require("path");
var middleware = require("../../middleware/middleware.js");

var authUserController = require("../../controller/AuthUser/authUserController.js");

var router = express.Router();

var storage = multer.diskStorage({
  destination: "public/authUser/",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});
var upload = multer({ storage: storage });

router.post(
  "/registeruser",
  upload.single("image"),
  authUserController.registerUser
);
router.post("/signin", authUserController.signinUser);
router.post("/auth/google", authUserController.signinWithGoogle);
router.get("/appusers", authUserController.getAllAppuser);
router.get("/appusersbyid/:id", authUserController.getAllAppuserById);
router.patch("/updateProfile",  middleware.verifyAccessToken,upload.single("user_profile_photo"), authUserController.updateProfile);
router.post("/logout", middleware.verifyAccessToken, authUserController.logout);
router.delete("/deleteuser/:id", authUserController.deleteAppUser);
router.post("/addTrackingData", authUserController.addTrackingData);
router.post("/geofenceEvent", authUserController.geofenceEventNotification);
router.post("/getTrackingData", middleware.verifyAccessToken, authUserController.getTrackingData);
router.get("/getCountries", authUserController.getCountries);
router.post("/refresh-token", authUserController.refreshToken);

module.exports = router;
