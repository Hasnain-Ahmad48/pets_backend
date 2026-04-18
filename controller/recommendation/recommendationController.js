// const recommendationModel = require("../../models/recommendation/recommendationModel.js");

// const getRecommendations = async (req, res) => {
//   try {
//     const {
//       tag_ids,
//       is_product,
//       is_pets,
//       is_breed,
//       is_article,
//       limit = 10,
//     } = req.body;

//     // Validation: tag_ids must be a non-empty array
//     if (!tag_ids || !Array.isArray(tag_ids) || tag_ids.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "A non-empty array of 'tag_ids' is required.",
//       });
//     }

//     const data = {};
//     const tasks = [];

//     // Map flags to their respective table configurations
//     // Products table is 'mk_products'
//   if (is_product) {
//   tasks.push(
//     recommendationModel.getRelatedEntities('mk_products', 'mk_product_tags', 'id', 'product_id', tag_ids, limit)
//       .then(res => data.products = res)
//       .catch(e => console.error("Product Table Error:", e))
//   );
// }

//     // Pets table is 'pets'
//     if (is_pets) {
//       tasks.push(
//         recommendationModel
//           .getRelatedEntities(
//             "pets",
//             "pet_tags",
//             "pet_id",
//             "pet_id",
//             tag_ids,
//             limit,
//           )
//           .then(results => (data.pets = results)),
//       );
//     }

//     // Breeds table is 'breeds'
//     if (is_breed) {
//       tasks.push(
//         recommendationModel
//           .getRelatedEntities(
//             "breeds",
//             "breed_tags",
//             "id",
//             "breed_id",
//             tag_ids,
//             limit,
//           )
//           .then(results => (data.breeds = results)),
//       );
//     }

//     // Articles table is 'articles'
//     if (is_article) {
//       tasks.push(
//         recommendationModel
//           .getRelatedEntities(
//             "articles",
//             "article_tags",
//             "id",
//             "article_id",
//             tag_ids,
//             limit,
//           )
//           .then(results => (data.articles = results)),
//       );
//     }

//     // Execute all enabled entity queries in parallel for better performance
//     await Promise.all(tasks);

//     return res.status(200).json({
//       success: true,
//       data,
//     });
//   } catch (error) {
//     console.error("Recommendation API Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error.",
//     });
//   }
// };

// module.exports = {
//   getRecommendations,
// };





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