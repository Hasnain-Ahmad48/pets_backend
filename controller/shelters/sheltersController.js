const ShelterModel = require("../../models/shelters/sheltersModel.js");
const fs = require("fs");
const { get } = require("http");
const path = require("path");
const slugify = require("slugify");



const getShelters = async (req, res) => {
  try {
    const slug = req.params.slug || null; // Optional slug filter
    ShelterModel.getShelters(slug, (err, shelters) => {
      if (err) {
        console.error("Error fetching shelters:", err);
        return res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }

      res.status(200).json({
        success: true,
        data: shelters,
      });
    });
  } catch (error) {
    console.error("Error fetching shelters:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  getShelters,
};