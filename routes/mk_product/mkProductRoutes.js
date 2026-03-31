const express = require("express");
const multer = require("multer");
const mkProductController = require("../../controller/mk_product/mkProductController");
//const {logTrasactionResponse} = require("../../middleware/logTrasactionResponse");
var middleware = require("../../middleware/middleware.js");
var path = require("path");
const router = express.Router();

// Configure Multer for file uploads
var storage = multer.diskStorage({
  destination: "public/product/",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});
var upload = multer({ storage: storage });

router.post(
  "/createproduct",
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "featuredImage", maxCount: 10 },
  ]),
  mkProductController.mkProductController
);

router.get("/getSubProducts/:subCategory", mkProductController.getProductsSubCategory);
router.get(
  "/getProducts/:page",
  // middleware.hasPermission,
  mkProductController.getAllProducts
);
router.get("/searchProducts", mkProductController.searchProductsAndBreeds);
router.get("/getallproducts", mkProductController.getAllProductsController);
router.get("/getProductReviews", mkProductController.getProductReviews);
router.get("/getallfilterproducts/:slug", mkProductController.getAllFilterProductsController);
router.post("/getallfilterpriceProduct", mkProductController.getAllFilterPriceProductsController);

router.get("/getallproductbyShopId/:shop_id", mkProductController.getAllProductsbyShopId);

router.get("/productbyid/:id", mkProductController.getProductByIdController);
router.put(
  "/updateproduct/:id",
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "featuredImage", maxCount: 10 },
  ]),
  mkProductController.updateProduct
);
router.delete("/deleteproduct/:id", mkProductController.deleteProduct);
router.get(
  "/getallFeaturedProduct",
  mkProductController.getAllFeaturedProductsController
);

router.get(
  "/getProductImage/:id",
  mkProductController.getProductImageController
);

router.delete(
  "/deleteproductimages/:id",
  mkProductController.deleteProductImageController
);

router.get(
  "/productbyslug/:slug",
  mkProductController.getProductBySlugController
);

router.post("/createIntent",middleware.verifyAccessToken, mkProductController.createPaymentIntent );
router.post("/v2/createOrder",middleware.verifyAccessToken, mkProductController.placeOrder );
router.post("/createOrder", mkProductController.createOrder );
router.post('/order/review',middleware.verifyAccessToken, mkProductController.addOrUpdateOrderReview);
router.post('/product/review',middleware.verifyAccessToken, mkProductController.addOrUpdateProductReview);

router.get("/getAllOrder",
  middleware.hasPermission_v2(
      "Orders",
      "View"
    ),mkProductController.getAllOrderController)
router.get("/v2/getAllOrder",middleware.verifyAccessToken,mkProductController.getAllOrder)
router.get("/getAllOrderById/:id",middleware.verifyAccessToken,mkProductController.getAllOrderByIDController);
router.delete("/deleteOrder/:id",
  middleware.hasPermission_v2(
      "Orders",
      "Delete"
    ),mkProductController.deleteOrderController);
router.get("/getAllOrderStatus",mkProductController.getAllOrderStatus);
router.put("/updateOrderStatus/:id",middleware.hasPermission_v2(
      "Orders",
      "Update"
    ),mkProductController.updateOrderStatus);


router.get("/getTransactionRecord",
  middleware.hasPermission_v2(
      "Orders",
      "View"
    ),mkProductController.getTransactionRecordController);


var storage = multer.diskStorage({
  destination: "public/discount/",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});

var uploads = multer({ storage: storage });  // Use 'storage' here instead of 'store'

router.post("/createDiscount", uploads.single("image"), mkProductController.createDiscountController);


router.get("/getDiscountProduct",mkProductController.getDiscountProductController);

router.get("/getDiscountByid/:id",mkProductController.getDiscountbyIdController);

// router.put("/update-discount/:discountId",mkProductController.updateDiscountController)

router.put('/update-discount/:discountId', uploads.single('image'),mkProductController.updateDiscountController);

router.delete("/delete-discount/:id",mkProductController.deleteDiscount);
router.get('/discount-products', mkProductController.getDiscountedProducts);

router.get("/getDiscounts",mkProductController.getAllDiscountsContoroller);

router.get("/getmixprice",mkProductController.getMaxMinPriceController)


//brands routes
// Get all brands for filter
router.get("/brands", async (req, res) => {
  try {
    const brandModel = require("../../models/Brand/brandModel");
    const brands = await brandModel.getAllBrands();
    res.status(200).json({ 
      success: true,
      result: brands 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Internal server error", 
      error: error.message 
    });
  }
});

// Get products by brand
router.get("/brand/:brandSlug", async (req, res) => {
  try {
    const { brandSlug } = req.params;
    const brandModel = require("../../models/Brand/brandModel");
    
    // Get brand by slug
    const brand = await brandModel.getBrandBySlug(brandSlug);
    
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found"
      });
    }
    
    // Get products for this brand
    const mkProductModel = require("../../models/mk_product/mkProductModel");
    const products = await mkProductModel.getProductsByBrandId(brand.id);
    
    res.status(200).json({
      success: true,
      brand: brand,
      result: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

module.exports = router;
