const recommendationModel = require("../../models/recommendation/recommendationModel");

const getRecommendations = async (req, res) => {
  try {
    const { type, id } = req.params;
    let { limit = 10 } = req.query;

    limit = Math.min(parseInt(limit) || 10, 50);

    const allowedTypes = ["product", "pet", "breed", "article"];

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid type",
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID is required",
      });
    }

    const data = await recommendationModel.getRecommendations(type, id, limit);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Recommendation Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  getRecommendations,
};


const searchWithRecommendations = async (req, res) => {
  try {
    const { q } = req.query;
    let { limit = 10 } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search query 'q' is required",
      });
    }

    limit = Math.min(parseInt(limit) || 10, 50);

    const data = await recommendationModel.searchWithRecommendations(q.trim(), limit);

    return res.status(200).json({
      success: true,
      query: q,
      data,
    });

  } catch (error) {
    console.error("Search Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports.searchWithRecommendations = searchWithRecommendations;