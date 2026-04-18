// const express = require("express");
// const router = express.Router();
// const recommendationController = require("../../controller/recommendation/recommendationController.js");

// // Define the recommendation endpoint
// router.post("/get-recommendations", recommendationController.getRecommendations);

// module.exports = router;


const express = require("express");
const router = express.Router();
const recommendationController = require("../../controller/recommendation/recommendationController");

// GET recommendations based on entity
router.get("/:type/:id", recommendationController.getRecommendations);

module.exports = router;