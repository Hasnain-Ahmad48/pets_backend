var express = require("express");
var multer = require("multer");
var path = require("path");
const middleware = require("../../middleware/middleware.js");

var CategoryArticleController = require("../../controller/Articles/CategoryArticleController.js");

var router = express.Router();
var storage = multer.diskStorage({
  destination: "public/categoryArticle/",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});
var upload = multer({ storage: storage });

router.get(
  "/showcategoryarticle",
  middleware.hasPermission,
  CategoryArticleController.showCategory
);
router.get(
  "/getcategorybyid/:id",
  middleware.hasPermission,
  CategoryArticleController.getCategoryById
);
router.get(
  "/profilecategory/:id",
  middleware.hasPermission,
  CategoryArticleController.getCategoryInProfileController
);

router.post(
  "/addcategory",
  middleware.validateToken,
  upload.single("image"),
  CategoryArticleController.addCategoryArticle
);
router.delete(
  "/deletecategory/:id",
  middleware.validateToken,
  CategoryArticleController.deleteCategoryController
);
router.put(
  "/updatecategory/:id",
  middleware.validateToken,
  upload.single("image"),
  CategoryArticleController.updateCategoryController
);

module.exports = router;
