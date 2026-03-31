var express = require("express");
var multer = require("multer");
var path = require("path");

var categoryBreedsController = require("../../controller/Breeds/categoryBreedsController.js");
var BreedsController = require("../../controller/Breeds/BreedsController.js");
var middleware = require("../../middleware/middleware.js");

var router = express.Router();

var storage = multer.diskStorage({
  destination: "public/Breeds/",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});
var upload = multer({ storage: storage });

router.post(
  "/addbreed",
  // middleware.hasPermission,
  upload.single("image"),
  categoryBreedsController.addBreedCategory
);
router.get(
  "/getbreed",
  // middleware.hasPermission,
  categoryBreedsController.showCategory
);
router.get(
  "/getbreedbyid/:id",
  // middleware.hasPermission,
  categoryBreedsController.getBreedCategoryById
);
// router.get("/getSingleBreedById/:id", BreedsController.getBreedByBreedId);

router.put(
  "/updatebreedcategory/:id",
  middleware.validateToken,
  upload.single("image"),
  categoryBreedsController.updateBreedCategoryController
);
router.delete(
  "/deletebreedcategory/:id",
  middleware.validateToken,
  categoryBreedsController.deleteBreedCategoryController
);

// Breeds Calling

router.get(
  "/breedshow",
  // middleware.hasPermission,
  BreedsController.showBreedCategory
);
router.get(
  "/showallbreed/:page",
  // middleware.hasPermission,
  BreedsController.showBreed
);
router.get(
  "/getbreedByLetter/:letter/:page",
  // middleware.hasPermission,
  BreedsController.showBreedsByAlphabet
);
router.get(
  "/searchBreed/:title/:page",
  // middleware.hasPermission,
  BreedsController.searchBreedsByTitle
);
router.post(
  "/createbreeds",
  middleware.validateToken,
  upload.array("images"),
  BreedsController.insertBreedWithImageController
);

// delete breeds
router.delete(
  "/deletebreed/:id",
  middleware.validateToken,
  BreedsController.deleteBreedController
);
router.delete(
  "/deleteimage/:id",
  middleware.validateToken,
  BreedsController.deleteImageByid
);
// get breed by id
router.get(
  "/getbreedsbyid/:id",
  BreedsController.getBreedByBreedId
);

router.get(
  "/getsinglebreedbyid/:slug",
  BreedsController.getSingleBreedById
);

// update breed with image
router.put(
  "/updatebreedwithimage/:id",
  middleware.validateToken,
  upload.array("images"),
  BreedsController.BreedsupdateController
);

// get breeds by categoryid
router.get("/getAllBreedsbyCategory", BreedsController.getBreedByCategory);
router.get(
  "/getAllBreedsbyCategoryId/:id/:page",
  BreedsController.getBreedByCategoryId
);
router.get("/get10BreedsbyCategory", BreedsController.get10BreedsbyCategory);

router.post("/addtagsforbreed", BreedsController.addTagsForBreeds);

router.get("/getalltags", BreedsController.getAllTags);

module.exports = router;
