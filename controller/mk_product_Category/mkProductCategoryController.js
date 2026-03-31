const mkProductCategoryModel = require("../../models/mk_product_category/mkProductCategoryModel");

const slugify = require('slugify'); // Install if not already: npm install slugify

const createProductCategory = async (req, res) => {
  // Destructure from req.body based on the actual keys sent
  const { SubcategoryName: name, subcategoryStatus: status, shopId: shop_id, userId, cat_id } = req.body;

  console.log("================", req.body); // This will still log the full req.body object
  
  try {
    // Pass the correct values to the model function
    const result = await mkProductCategoryModel.createProductCategory(
      name,
      status,
      shop_id,
      userId,
      cat_id
    );

    console.log("result", result);
    res
      .status(200)
      .json({ message: "Subcategory Created Successfully", result });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


// get all from mk_subcategories
const getAllProductCategory = async (req, res) => {
  try {
    const result = await mkProductCategoryModel.getAllProductCategory();
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const PostProductCategoriesController = async (req, res) => {
  const { name, status, added_user_id,shop_id } = req.body;
  console.log("================", req.body);

  // Handle image
  const image = req.file ? "mkProductCategory/" + req.file.filename : "";
  console.log("================", image);

  try {
    // Generate initial slug from name
    let slug = slugify(name, { lower: true, strict: true });

    // Check if slug already exists
    
   
      // If slug exists, append a number to make it unique
      let counter = 1;
      let newSlug = slug;

    
        newSlug = `${slug}-${counter}`;
        counter++;
      

      slug = newSlug; // Use the new unique slug
    

    // Insert new category with unique slug
    const result = await mkProductCategoryModel.PostProductCategoriesModel(
      name,
      slug,
      status,
      image,
      added_user_id,
      shop_id
    );

    console.log("result", result);
    res
      .status(200)
      .json({ message: "Category Created Successfully", result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getAllProductCategoriesController = async (req, res) => {
  try {
    const result = await mkProductCategoryModel.getProductCategoriesModel();
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getAllProductCategoryCountController = async (req, res) => {
  try {
    const result = await mkProductCategoryModel.getALlCategoryProductsCount();
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};
const getSubCategoryForCategoryController = async (req, res) => {
  const {slug} = req.params;
  try {
    const result = await mkProductCategoryModel.getSubCategoryForCategoryModel(slug);
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};



module.exports = {
  createProductCategory,
  getAllProductCategory,
  PostProductCategoriesController,
  getAllProductCategoriesController,
  getAllProductCategoryCountController,
  getSubCategoryForCategoryController
  
};
