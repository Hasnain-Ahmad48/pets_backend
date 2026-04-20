const express = require("express");
const router = express.Router();
const recommendationController = require("../../controller/recommendation/recommendationController");

// GET recommendations based on entity
router.get("/:type/:id", recommendationController.getRecommendations);
// Search API
router.get("/search", recommendationController.searchWithRecommendations);

module.exports = router;