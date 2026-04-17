var categoryModel = require("../../models/CategoryModel/ArticlesCategoryModel.js");
var fs = require("fs");
var path = require("path");
const slugify = require("slugify");

var __dirname = path.resolve(process.cwd()) + "/public/articles";

exports.addTagsForArticle = async function (req, res) {
  try {
    const {tags} = req.body;
    console.log("Controller Tags", tags);
    var result = await categoryModel.addArticleTags(tags);
    res.status(200).json({message: "Tags added successfully", result});
  } catch (error) {
    console.error("Error adding tags:", error);
    res.status(500).json({message: "Failed to add tags"});
  }
};

exports.getAllTags = async function (req, res) {
  try {
    var result = await categoryModel.getAllTags();
    res.status(200).json({message: "Tags fetched successfully", result});
  } catch (error) {
    console.error("Error fetching tags:", error);
    res.status(500).json({message: "Failed to fetch tags"});
  }
};

exports.getArticleCategory = async function (req, res) {
  const page = parseInt(req.params.page) || 1;
  try {
    const limit = parseInt(req.query.limit) || 20;
    const totalArticles = await categoryModel.getTotalArticles();
    categoryModel
      .getArticles(page, limit)
      .then(data => {
        if (data.length > 0) {
          res.json({
            totalItems: totalArticles,
            currentPage: page,
            totalPages: Math.ceil(totalArticles / limit),
            articles: data,
          });
        } else {
          res.status(404).json({message: "No articles found"});
        }
      })
      .catch(error => {
        res.status(500).json({message: error.message});
      });
  } catch (error) {
    res.status(500).json({message: error.message});
  }
};

exports.getCategories = function (req, res) {
  try {
    categoryModel.getCategories(function (err, data) {
      if (err) {
        return res.status(500).json({message: err.message});
      } else {
        res.json(data);
      }
    });
  } catch (error) {
    res.status(500).json({message: error.message});
  }
};

exports.addArticle = async function (req, res) {
  var title = req.body.title,
    description = req.body.description,
    categoryid = req.body.categoryid,
    userid = req.body.userid,
    tags = req.body.tags
      ? typeof req.body.tags === "string"
        ? JSON.parse(req.body.tags)
        : req.body.tags
      : [];
  qa = req.body.qa ? JSON.parse(req.body.qa) : [];
  var imageUrl = req.file ? "articles/" + req.file.filename : null;
  console.log("Tags", tags);
  // Generate a unique slug
  const baseSlug = slugify(title, {
    lower: true,
    strict: true,
  });
  let slug = baseSlug;
  let slugExists = await categoryModel.checkSlugExists(slug);
  let slugCounter = 1;

  // If slug exists, append a counter to it until a unique slug is found
  while (slugExists) {
    slug = `${baseSlug}-${slugCounter}`;
    slugExists = await categoryModel.checkSlugExists(slug);
    slugCounter++;
  }

  try {
    var categoryExists = await categoryModel.checkCategoryExists(categoryid);
    if (!categoryExists) {
      return res.status(400).json({message: "Category does not exist"});
    }
    var result = await categoryModel.addArticle(
      title,
      slug,
      description,
      imageUrl,
      categoryid,
      userid,
      tags,
      qa,
    );
    res.status(201).json({message: "Article Created Successfully", result});
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .json({error: error.message, message: "Error while creating Article"});
  }
};

exports.deleteArticleController = async function (req, res) {
  var id = req.params.id;

  try {
    var result = await categoryModel.getArticleByIdfordelete(id);
    var newImagesPaths = result[0].image.slice(9, result[0].image.length);
    console.log("newImagesPaths", newImagesPaths);
    fs.unlink(path.join(__dirname, newImagesPaths), function (err) {
      if (err) {
        console.error(
          "Failed to delete image at " + newImagesPaths + ": " + err.message,
        );
      }
    });

    var result1 = await categoryModel.deleteArticle(id);
    res.status(200).json({
      message: "Article deleted successfully.",
      success: true,
      result1,
    });
  } catch (error) {
    res.status(500).json({message: error.message});
  }
};

// exports.getArticleById = async function (req, res) {
//   try {
//     var articleId = req.params.id;
//     var imageUrl = req.file ? "articles/" + req.file.filename : null;

//     var result = await categoryModel.getArticleById(articleId, imageUrl);
//     console.log("Checking article", result);
//     if (result.length > 0) {
//       res.status(200).json({
//         success: true,
//         message: "Article fetched successfully",
//         data: result[0],
//       });
//     } else {
//       res.status(404).json({ success: false, message: "Article not found" });
//     }
//   } catch (error) {
//     console.error("Error fetching Article by ID:", error);
//     res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };

exports.getArticleById = async function (req, res) {
  try {
    var articleId = req.params.id;

    var rows = await categoryModel.getArticleById(articleId);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    // Base article data from the first row
    var article = {
      id: rows[0].id,
      title: rows[0].title,
      slug: rows[0].slug,
      description: rows[0].description,
      image: rows[0].image,
      categoryid: rows[0].categoryid,
      tags: [],
    };

    // Push tags (only if tag exists)
    rows.forEach(row => {
      if (row.tag_id) {
        article.tags.push({
          id: row.tag_id,
          name: row.tag_name,
        });
      }
    });

    res.status(200).json({
      success: true,
      message: "Article fetched successfully",
      data: article,
    });
  } catch (error) {
    console.error("Error fetching Article by ID:", error);
    res.status(500).json({success: false, message: "Internal server error"});
  }
};

exports.getArticleByCategoryid = async function (req, res) {
  try {
    var categoryid = req.params.id;
    console.log(categoryid);
    var imageUrl = req.file ? "articles/" + req.file.filename : null;

    var result = await categoryModel.getArticlebyCategory(categoryid, imageUrl);

    console.log("Checking article", result);
    if (result) {
      res.status(200).json({
        success: true,
        message: "Article fetched successfully",
        data: result,
      });
    } else {
      res.status(404).json({success: false, message: "Articles not found"});
    }
  } catch (error) {
    console.error("Error fetching Article by ID:", error);
    res.status(500).json({success: false, message: "Internal server error"});
  }
};

exports.getArticleInProfileController = async function (req, res) {
  try {
    var articleId = req.params.id;
    var imageUrl = req.file ? "articles/" + req.file.filename : null;

    var result = await categoryModel.getArticlesInProfile(articleId, imageUrl);
    console.log("Checking article", result);
    if (result.length > 0) {
      res.status(200).json({
        success: true,
        message: "Article fetched successfully",
        data: result[0],
      });
    } else {
      res.status(404).json({success: false, message: "Article not found"});
    }
  } catch (error) {
    console.error("Error fetching Article by ID:", error);
    res.status(500).json({success: false, message: "Internal server error"});
  }
};

// exports.updateArticleController = async function (req, res) {
//   var title = req.body.title,
//     description = req.body.description,
//     categoryid = req.body.categoryid;
//   var id = req.params.id;
//   var imageUrl = req.file ? "articles/" + req.file.filename : null;

//   try {
//     var result = await categoryModel.updateArticle(
//       id,
//       title,
//       description,
//       imageUrl,
//       categoryid
//     );
//     res
//       .status(200)
//       .json({ success: true, message: "User updated successfully", result });
//   } catch (error) {
//     console.error("Error updating user:", error);
//     res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };

// exports.updateArticleController = async function (req, res) {
//   const {title, description, categoryid, tags} = req.body;
//   const id = req.params.id;

//   const imageUrl = req.file ? "articles/" + req.file.filename : null;

//   try {
//     const result = await categoryModel.updateArticle(
//       id,
//       title,
//       description,
//       imageUrl,
//       categoryid,
//       Array.isArray(tags) ? tags : [], // <-- ensure array
//     );

//     res.status(200).json({
//       success: true,
//       message: "Article updated successfully",
//       result,
//     });
//   } catch (error) {
//     console.error("Error updating article:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

exports.updateArticleController = async function (req, res) {
  try {
    const id = parseInt(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Article ID is required",
      });
    }

    let {title, description, categoryid, tags} = req.body;

    // ✅ Handle image
    const imageUrl = req.file ? "articles/" + req.file.filename : null;

    // ✅ FIX 1 — Parse tags properly (handles JSON + form-data)
    let parsedTags = [];

    if (typeof tags === "string") {
      try {
        parsedTags = JSON.parse(tags);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: "Invalid tags format. Must be JSON array",
        });
      }
    } else if (Array.isArray(tags)) {
      parsedTags = tags;
    }

    // ✅ Ensure all tags are numbers
    parsedTags = parsedTags.map(t => Number(t)).filter(t => !isNaN(t));

    // ✅ Optional: Basic validation
    if (!title || !description || !categoryid) {
      return res.status(400).json({
        success: false,
        message: "Title, description and categoryid are required",
      });
    }

    let parsedQA = [];

    if (typeof req.body.qa === "string") {
      parsedQA = JSON.parse(req.body.qa);
    } else if (Array.isArray(req.body.qa)) {
      parsedQA = req.body.qa;
    }

    // ✅ Call model
    const result = await categoryModel.updateArticle(
      id,
      title,
      description,
      imageUrl,
      categoryid,
      parsedTags,
      parsedQA,
    );

    return res.status(200).json({
      success: true,
      message: "Article updated successfully",
      result,
    });
  } catch (error) {
    console.error("Error updating article:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.get10ArticleCategory = function (req, res) {
  try {
    categoryModel.get10Articles(function (err, data) {
      if (err) {
        return res.status(500).json({message: err.message});
      } else {
        res.json(data);
      }
    });
  } catch (error) {
    res.status(500).json({message: error.message});
  }
};

// search Article  by title
exports.searchArticle = async function (req, res) {
  const {title} = req.params;
  try {
    const result = await categoryModel.searchArticle(title);
    if (result.length > 0) {
      res.status(200).json({message: "Article found", data: result});
    } else {
      res.status(404).json({message: "No article found"});
    }
  } catch (error) {
    res.status(500).json({message: error.message});
  }
};

exports.getSingleArticleById = async function (req, res) {
  const {slug} = req.params;
  console.log("controller article slug", slug);
  try {
    const result = await categoryModel.getSingleArticleById(slug);

    res.status(200).json({message: "Article found", data: result});
  } catch (error) {
    res.status(500).json({message: error.message});
  }
};
