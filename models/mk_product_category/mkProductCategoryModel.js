const db = require("../../config/DatabaseConnection");

const createProductCategory = (name, status, shop_id, userId,cat_id) => {
  console.log("=====Modal", name, status, shop_id, userId,cat_id);
  return new Promise((resolve, reject) => {
    const query = `INSERT INTO mk_subcategories (name, status,added_user_id, shop_id, cat_id) VALUES (?,?,?,?,?)`;
    db.query(query, [name, status,userId, shop_id,cat_id], (err, result) => {
      if (err) {
        reject(err);
      }
      console.log("resultssss", result);
      resolve(result);
    });
  });
};

// get all from mk_subcategories
const getAllProductCategory = () => {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM mk_subcategories`;
    db.query(query, (err, result) => {
      if (err) {
        reject(err);
      }
      resolve(result);
    });
  });
};



const PostProductCategoriesModel = (name,slug, status,image,added_user_id,shop_id) => {
  console.log("=====Modal", name,slug, status,image,shop_id);
  return new Promise((resolve, reject) => {
    const query = `INSERT INTO mk_categories (name,slug, status,image,added_user_id ,shop_id) VALUES (?,?,?,?,?,?)`;
    db.query(query, [name,slug, status,image,added_user_id, shop_id], (err, result) => {
      if (err) {
        reject(err);
      }
      console.log("resultssss", result);
      resolve(result);
    });
  });
};

const getProductCategoriesModel = () => {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM mk_categories`;
    db.query(query, (err, result) => {
      if (err) {
        reject(err);
      }
      resolve(result);
    });
  });
};


const getALlCategoryProductsCount = () => {
  return new Promise((resolve, reject) => {
    const query = `SELECT c.id AS category_id,c.slug, c.name AS category_name, COUNT(p.id) AS product_count FROM mk_categories c LEFT JOIN mk_products p ON c.id = p.cat_id GROUP BY c.id, c.name`;
    db.query(query, (err, result) => {
      if (err) {
        reject(err);
      }
      resolve(result);
    });
  });
};
const getSubCategoryForCategoryModel = (slug) => {
  return new Promise((resolve, reject) => {
    // First query to get the category ID based on the slug
    const queryCategory = `SELECT id FROM mk_categories WHERE slug = ?`;
    
    db.query(queryCategory, [slug], (err, categoryResult) => {
      if (err) {
        return reject(err);  // Return early in case of an error
      }

      if (categoryResult.length === 0) {
        return reject(new Error("Category not found"));  // Handle no results case
      }

      const categoryId = categoryResult[0].id;

      // Now use the category ID to fetch subcategories
     // const querySubCategory = `SELECT * FROM mk_subcategories WHERE cat_id = ?`;  // Make sure the column name is 'category_id'
      
       const querySubCategory = `SELECT * FROM mk_subcategories`;
       
      db.query(querySubCategory, [categoryId], (err, subCategoryResult) => {
        if (err) {
          return reject(err);  // Return early in case of an error
        }

        resolve(subCategoryResult);  // Successfully return subcategories
      });
    });
  });
};





module.exports = {
  createProductCategory,
  getAllProductCategory,
  PostProductCategoriesModel,
  getProductCategoriesModel,
  getALlCategoryProductsCount,
  getSubCategoryForCategoryModel
};
