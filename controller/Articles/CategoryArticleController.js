var ArticlesCategoryModel = require("../../models/CategoryModel/CategoryArticleModel.js");
var fs = require("fs");
var path = require("path");

var __dirname = path.resolve(process.cwd()) + "/public/categoryArticle";

exports.showCategory = function (req, res) {
  try {
    ArticlesCategoryModel.showAllCategory(function (err, data) {
      if (err) {
        return res.status(500).json({ message: err.message });
      } else {
        res.json(data);
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addCategoryArticle = async function (req, res) {
  var categoryName = req.body.categoryName,
    description = req.body.description;
  var imageUrl = req.file ? "categoryArticle/" + req.file.filename : null;

  try {
    var result = await ArticlesCategoryModel.addCategory(
      categoryName,
      description,
      imageUrl
    );
    res
      .status(201)
      .json({ message: "Category Article Created Successfully", result });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({
      error: error.message,
      message: "Error while creating Category Article",
    });
  }
};

exports.getCategoryById = async function (req, res) {
  try {
    var categoryid = req.params.id;
    var imageUrl = req.file ? "categoryArticle/" + req.file.filename : null;

    var result = await ArticlesCategoryModel.getCategoryById(
      categoryid,
      imageUrl
    );
    console.log("Checking article", result);
    if (result.length > 0) {
      res.status(200).json({
        success: true,
        message: "Category fetched successfully",
        data: result[0],
      });
    } else {
      res.status(404).json({ success: false, message: "Category not found" });
    }
  } catch (error) {
    console.error("Error fetching Article by ID:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getCategoryInProfileController = async function (req, res) {
  try {
    var articleId = req.params.id;
    var imageUrl = req.file ? "categoryArticle/" + req.file.filename : null;

    var result = await ArticlesCategoryModel.getCategoryInProfile(
      articleId,
      imageUrl
    );
    console.log("Checking article", result);
    if (result.length > 0) {
      res.status(200).json({
        success: true,
        message: "Category fetched successfully",
        data: result[0],
      });
    } else {
      res.status(404).json({ success: false, message: "Category not found" });
    }
  } catch (error) {
    console.error("Error fetching Category by ID:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.deleteCategoryController = async function (req, res) {
  var id = req.params.id;

  try {
    var result = await ArticlesCategoryModel.getCategoryByIdfordelete(id);
    var newImagesPaths = result[0].image.slice(16, result[0].image.length);

    fs.unlink(path.join(__dirname, newImagesPaths), function (err) {
      if (err) {
        console.error(
          "Failed to delete image at " + newImagesPaths + ": " + err.message
        );
      }
    });

    var result1 = await ArticlesCategoryModel.deleteCategory(id);
    res.status(200).json({
      message: "Category Article deleted successfully.",
      success: true,
      result1,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCategoryController = async function (req, res) {
  var categoryName = req.body.categoryName,
    description = req.body.description;
  var id = req.params.id;
  var imageUrl = req.file ? "categoryArticle/" + req.file.filename : null;

  try {
    var result = await ArticlesCategoryModel.updateCtegoryArticle(
      id,
      categoryName,
      description,
      imageUrl
    );
    res.status(200).json({
      success: true,
      message: "Category Article  updated successfully",
      result,
    });
  } catch (error) {
    console.error("Error updating Category Article", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
