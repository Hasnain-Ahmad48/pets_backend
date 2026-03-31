const db = require("../../config/DatabaseConnection.js");

const showBreedCategory = (callback) => {
  const query = "SELECT * FROM breedcategory ";
  db.query(query, (err, result) => {
    if (err) return callback(err, null);
    return callback(null, result);
  });
};

const addCategory = (title, description, imageUrl) => {
  const query =
    "INSERT INTO `breedcategory`(`title`, `description`, `image`) VALUES (?,?,?)";
  return new Promise((resolve, reject) => {
    db.query(query, [title, description, imageUrl], (err, result) => {
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

const getBreedCategoryById = async (id, imageUrl) => {
  const query =
    "SELECT id , title, description , image FROM breedcategory WHERE id=?";

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

const getBreedCategoryByIdForDelete = async (id) => {
  const query = "SELECT * FROM breedcategory WHERE id=?";

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

const updateBreedCtegory = async (id, title, description, imageUrl) => {
  let query;
  let values;

  if (imageUrl) {
    query =
      "UPDATE `breedcategory` SET title=? , description=? , image=?  WHERE id=?";
    values = [title, description, imageUrl, id];
  } else {
    query = "UPDATE `breedcategory` SET title=? , description=?  WHERE id=?";
    values = [title, description, id];
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

const deleteBreedCategory = async (id) => {
  const query = "DELETE FROM `breedcategory` WHERE id=?";

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
  addCategory,
  showBreedCategory,
  getBreedCategoryById,
  getBreedCategoryByIdForDelete,
  updateBreedCtegory,
  deleteBreedCategory,
};
