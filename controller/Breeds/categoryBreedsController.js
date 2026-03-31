const categoryBreedModel = require("../../models/Breeds/categoryBreedModel.js");
const fs = require("fs");
const path = require("path");

// Show Breed Category
const showCategory = (req, res) => {
  try {
    categoryBreedModel.showBreedCategory((err, data) => {
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

// Add Breed Category
const addBreedCategory = async (req, res) => {
  const { title, description } = req.body;
  const imageUrl = req.file ? `Breeds/${req.file.filename}` : null;

  try {
    const result = await categoryBreedModel.addCategory(
      title,
      description,
      imageUrl
    );
    res
      .status(201)
      .json({ message: "Breeds Category  Created Successfully", result });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({
      error: error.message,
      message: "Error while creating Breeds Category ",
    });
  }
};

// Get Breed Category By Id
const getBreedCategoryById = async (req, res) => {
  try {
    const categoryid = req.params.id;
    const imageUrl = req.file ? `Breeds/${req.file.filename}` : null;

    const result = await categoryBreedModel.getBreedCategoryById(
      categoryid,
      imageUrl
    );
    console.log("Checking Breeds", result);
    if (result.length > 0) {
      res.status(200).json({
        success: true,
        message: "Breed Category fetched successfully",
        data: result[0],
      });
    } else {
      res
        .status(404)
        .json({ success: false, message: "Breed Category not found" });
    }
  } catch (error) {
    console.error("Error fetching Article by ID:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get Breed Category By Id For Deletion
const getBreedCategoryByIdForDelete = async (req, res) => {
  try {
    const categoryid = req.params.id;

    const result = await categoryBreedModel.getBreedCategoryByIdForDelete(
      categoryid
    );
    if (result.length > 0) {
      res.status(200).json({
        success: true,
        message: "Breed Category fetched successfully",
        data: result[0],
      });
    } else {
      res
        .status(404)
        .json({ success: false, message: "Breed Category not found" });
    }
  } catch (error) {
    console.error("Error fetching Breed Category by ID:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Delete Breed Category and delete the image from the public/Breeds folder
const deleteBreedCategoryController = async (req, res) => {
  try {
    const categoryid = req.params.id;
    const result = await categoryBreedModel.getBreedCategoryByIdForDelete(
      categoryid
    );
    if (result.length > 0) {
      const image = result[0].image;
      const queryResult = await categoryBreedModel.deleteBreedCategory(
        categoryid
      );
      if (queryResult.affectedRows > 0) {
        if (image) {
          fs.unlink(`public/${image}`, (err) => {
            if (err) {
              console.error("Error deleting Breed Category image", err);
            } else {
              console.log("Breed Category image deleted successfully");
            }
          });
        }
        res.status(200).json({
          success: true,
          message: "Breed Category deleted successfully",
        });
      }
    } else {
      res
        .status(404)
        .json({ success: false, message: "Breed Category not found" });
    }
  } catch (error) {
    console.error("Error deleting Breed Category:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Update Breed Category
const updateBreedCategoryController = async (req, res) => {
  const { title, description } = req.body;
  const id = req.params.id;
  const imageUrl = req.file ? `Breeds/${req.file.filename}` : null;

  try {
    const result = await categoryBreedModel.updateBreedCtegory(
      id,
      title,
      description,
      imageUrl
    );
    res.status(200).json({
      success: true,
      message: "Breeds Category updated successfully",
      result,
    });
  } catch (error) {
    console.error("Error updating Breeds Category ", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  showCategory,
  addBreedCategory,
  getBreedCategoryById,
  getBreedCategoryByIdForDelete,
  deleteBreedCategoryController,
  updateBreedCategoryController,
};
