const db = require("../../config/DatabaseConnection");

const showAllCategory = (callback) => {
  const query = "SELECT * FROM articlecategory ";
  db.query(query, (err, result) => {
    if (err) return callback(err, null);
    return callback(null, result);
  });
};

const addCategory = (categoryName, description, imageUrl) => {
  const query =
    "INSERT INTO `articlecategory`(`categoryName`, `description`, `image`) VALUES (?,?,?)";
  return new Promise((resolve, reject) => {
    db.query(query, [categoryName, description, imageUrl], (err, result) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        console.log(result);
        resolve(result);
      }
    });
  });
};

const getCategoryInProfile = async (id, imageUrl) => {
  const query =
    "SELECT categoryid, categoryName, description, image FROM articlecategory WHERE categoryid=?  ";

  const values = [id, imageUrl];

  return new Promise((resolve, reject) => {
    db.query(query, values, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

const getCategoryById = async (id, imageUrl) => {
  const query =
    "SELECT categoryid , categoryName, description , image FROM articlecategory WHERE categoryid=?";

  const values = [id, imageUrl];

  return new Promise((resolve, reject) => {
    db.query(query, values, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};
const getCategoryByIdfordelete = async (id) => {
  const query =
    "SELECT categoryid , categoryName, description , image FROM articlecategory WHERE categoryid=?";

  const values = [id];

  return new Promise((resolve, reject) => {
    db.query(query, values, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

const updateCtegoryArticle = async (
  id,
  categoryName,
  description,
  imageUrl
) => {
  let query;
  let values;

  if (imageUrl) {
    query =
      "UPDATE `articlecategory` SET categoryName=? , description=? , image=?  WHERE categoryid=?";
    values = [categoryName, description, imageUrl, id];
  } else {
    query =
      "UPDATE `articlecategory` SET categoryName=? , description=?  WHERE categoryid=?";
    values = [categoryName, description, id];
  }

  return new Promise((resolve, reject) => {
    db.query(query, values, (err, result) => {
      if (err) {
        reject(`Error updating article: ${err.message}`);
      } else {
        resolve(result);
      }
    });
  });
};

const deleteCategory = async (id) => {
  const query = "DELETE FROM `articlecategory` WHERE categoryid=?";

  return new Promise((resolve, reject) => {
    db.query(query, [id], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

module.exports = {
  showAllCategory,
  addCategory,
  deleteCategory,
  getCategoryById,
  updateCtegoryArticle,
  getCategoryInProfile,
  getCategoryByIdfordelete,
};
