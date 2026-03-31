var brandModel = require("../../models/Brand/brandModel");
var slugify = require("slugify");

// Add brand
exports.addBrand = async function (req, res) {
  try {
    const { name, description, website, status } = req.body;
    const logo = req.file ? req.file.filename : null;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Brand name is required",
      });
    }

    const slug = slugify(name, { lower: true });

    const brandData = {
      name,
      slug,
      description: description || null,
      logo,
      website: website || null,
      status: status !== undefined ? status : 1,
    };

    const brand = await brandModel.createBrand(brandData);

    res.status(201).json({
      success: true,
      message: "Brand added successfully",
      data: brand,
    });
  } catch (error) {
    console.error("Add brand error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


// Get all brands
exports.getBrands = async function (req, res) {
  try {
    const brands = await brandModel.getAllBrands();

    res.status(200).json({
      success: true,
      message: "Brands fetched successfully",
      data: brands,
    });
  } catch (error) {
    console.error("Get brands error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get single brand
exports.getBrandById = async function (req, res) {
  try {
    const id = parseInt(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Brand ID is required",
      });
    }

    const brand = await brandModel.getBrandById(id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Brand fetched successfully",
      data: brand,
    });
  } catch (error) {
    console.error("Get brand error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get brand by slug
exports.getBrandBySlug = async function (req, res) {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Brand slug is required"
      });
    }

    const brand = await brandModel.getBrandBySlug(slug);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Brand fetched successfully",
      data: brand
    });

  } catch (error) {
    console.error("Get brand by slug error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Update brand
exports.updateBrand = async function (req, res) {
  try {
    const id = parseInt(req.params.id);
    const { name, description, website, status } = req.body;
    const logo = req.file ? req.file.filename : req.body.logo;

    if (!id || !name) {
      return res.status(400).json({
        success: false,
        message: "Brand ID and name are required",
      });
    }

    const slug = slugify(name, { lower: true });

    const brandData = {
      name,
      slug,
      description: description || null,
      logo,
      website: website || null,
      status: status !== undefined ? status : 1,
    };

    await brandModel.updateBrand(id, brandData);

    res.status(200).json({
      success: true,
      message: "Brand updated successfully",
    });
  } catch (error) {
    console.error("Update brand error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


// Delete brand
exports.deleteBrand = async function (req, res) {
  try {
    const id = parseInt(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Brand ID is required",
      });
    }

    await brandModel.deleteBrand(id);

    res.status(200).json({
      success: true,
      message: "Brand deleted successfully",
    });
  } catch (error) {
    console.error("Delete brand error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


// Search brand using brand_id
exports.searchBrand = async function (req, res) {
  try {
    const { brand_id } = req.query;

    if (!brand_id) {
      return res.status(400).json({
        success: false,
        message: "brand_id is required for search",
      });
    }

    const brand = await brandModel.searchBrandById(brand_id);

    if (!brand || brand.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Brand search result",
      data: brand,
    });
  } catch (error) {
    console.error("Search brand error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};