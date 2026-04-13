var express = require("express");
var multer = require("multer");
var path = require("path");
var middleware = require("../../middleware/middleware.js");
var petController = require("../../controller/Pets/petController.js");

var router = express.Router();

// Configure Multer for handling pet image uploads
var storage = multer.diskStorage({
  destination: "public/user_pets/",
  filename: function (req, file, cb) {
    cb(null, "image_" + Date.now() + path.extname(file.originalname));
  },
});

var upload = multer({storage: storage});

router.post(
  "/addpet",
  middleware.validateToken,
  upload.array("images"),
  petController.addPet,
);

// Get user pets (auth required)
router.get("/getUserPets", middleware.validateToken, petController.getUserPets);

router.get("/getpetbyslug/:slug", petController.getPetBySlug);

// Update pet (auth required)
router.patch(
  "/updatePet/:petId",
  middleware.verifyAccessToken,
  upload.array("images", 10), // Allow up to 10 images
  petController.updatePet,
);

//delete pet
router.delete("/deletePet/:petId",
   middleware.validateToken,
   petController.deletePet);



// Add pet device (auth required)
router.post(
  "/addPetDevice",
  middleware.verifyAccessToken,
  petController.addPetDevice,
);

// Get pet devices (auth required)
router.get(
  "/getPetDevices/:petId",
  middleware.verifyAccessToken,
  petController.getPetDevices,
);

// Update pet device (auth required)
router.patch(
  "/updatePetDevice/:id",
  middleware.verifyAccessToken,
  petController.updatePetDevice,
);

// Get nearby pets (public or auth-based – confirm with mentor)
router.get(
  "/getNearbyPets",
  middleware.verifyAccessToken,
  petController.getNearbyPets,
);

//listing routes
router.post(
  "/addListingPet",
  middleware.verifyAccessToken,
  petController.addListingPet
);

router.get("/pet-listings", petController.getPetListings);

router.put(
  "/updateListingPet/:listingId",
  middleware.validateToken,
  petController.updateListingPet
);

router.delete(
  "/deleteListingPet/:listingId",
  middleware.validateToken,
  petController.deleteListingPet
);

module.exports = router;
