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
    const {tag_ids,is_product,is_pets,is_article,is_breed} = req.body;
    let {limit = 10} = req.body;

    limit = Math.min(parseInt(limit) || 10, 50);

    console.log("tags id",tag_ids)

    if (!tag_ids) {
      return res.status(400).json({
        success: false,
        message: "Tags not found",
      });
    }

    const data = await recommendationModel.getRecommendations( tag_ids,is_product,is_pets,is_article,is_breed, limit);

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

// const searchWithRecommendations = async (req, res) => {
//   try {
//     const {q} = req.query;
//     let {limit = 10} = req.query;

//     if (!q || q.trim() === "") {
//       return res.status(400).json({
//         success: false,
//         message: "Search query 'q' is required",
//       });
//     }

//     limit = Math.min(parseInt(limit) || 10, 50);

//     const data = await recommendationModel.searchWithRecommendations(
//       q.trim(),
//       limit,
//     );

//     return res.status(200).json({
//       success: true,
//       query: q,
//       data,
//     });
//   } catch (error) {
//     console.error("Search Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

module.exports = {
  getRecommendations,
  // searchWithRecommendations,
};