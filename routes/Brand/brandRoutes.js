var express = require("express");
var router = express.Router();
var middleware = require("../../middleware/middleware.js");
var brandController = require("../../controller/Brand/brandController");
var multer = require("multer");
var path = require("path");

/* Multer Storage */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/brand"); // 👈 folder
  },
  filename: function (req, file, cb) {
    cb(
      null,
      Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });


// Add brand (auth required)
router.post(
  "/addBrand",
  middleware.verifyAccessToken,
  upload.single("logo"),   
  brandController.addBrand
);

// Get all brands
router.get(
  "/getBrands",
  middleware.verifyAccessToken,
  brandController.getBrands
);

// Get single brand
router.get(
  "/getBrand/:id",
  middleware.verifyAccessToken,
  brandController.getBrandById
);

// Get brand by slug
router.get(
  "/getBrandBySlug/:slug",
  middleware.verifyAccessToken,
  brandController.getBrandBySlug
);

// Update brand
router.patch(
  "/updateBrand/:id",
  middleware.verifyAccessToken,
  upload.single("logo"),
  brandController.updateBrand
);

// Delete brand
router.delete(
  "/deleteBrand/:id",
  middleware.verifyAccessToken,
  brandController.deleteBrand
);


// Search brand
router.get(
  "/searchBrand",
  middleware.verifyAccessToken,
  brandController.searchBrand
);


module.exports = router;
