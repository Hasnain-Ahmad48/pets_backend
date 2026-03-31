const db = require("../../config/DatabaseConnection");

const createSlider = async (
  title,
  description,
  status,
  imagePaths,
  url,
  defaultSlider,
  expiryDate
) => {
  try {
    const query = `INSERT INTO slider_images (title,description,status,images,url,defaultSlider,expiryDate) VALUES ?`;
    return new Promise((resolve, reject) => {
      const values = imagePaths.map((imagePath) => [
        title,
        description,
        status,
        imagePath,
        url,
        defaultSlider,
        expiryDate,
      ]);
      db.query(query, [values], (err, result) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          console.log("res", result);
          resolve(result);
        }
      });
    });
  } catch (error) {
    console.log(error);
  }
};
// get all slider
const getallimages = async () => {
  let currentDate = new Date().toISOString().slice(0, 10);
  let query = `SELECT * FROM slider_images ORDER BY id DESC`;
  try {
    return new Promise((resolve, reject) => {
      db.query(query, (err, result) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  } catch (error) {
    console.log(error);
  }
};

const deleteSlider = async (id) => {
  const query = `DELETE FROM slider_images WHERE id = ${id}`;
  try {
    return new Promise((resolve, reject) => {
      db.query(query, (err, result) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  } catch (error) {
    console.log(error);
  }
};
const getSliderById = async (id) => {
  const query = `SELECT * FROM slider_images WHERE id = ${id}`;
  try {
    return new Promise((resolve, reject) => {
      db.query(query, (err, result) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  } catch (error) {
    console.log(error);
  }
};

// update slider by id
const updateSlider = async (
  id,
  title,
  description,
  status,
  imagePath,
  url,
  defaultSlider,
  expiryDate
) => {
  if (imagePath.length > 0) {
    const query = `UPDATE slider_images SET title = '${title}', description = '${description}', status = '${status}', images='${imagePath}',url='${url}',defaultSlider='${defaultSlider}' ,expiryDate = '${expiryDate}' WHERE id = ${id}`;
    try {
      return new Promise((resolve, reject) => {
        db.query(query, (err, result) => {
          if (err) {
            console.log(err);
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    } catch (error) {
      console.log(error);
    }
  } else {
    const query = `UPDATE slider_images SET title = '${title}', description = '${description}', status = '${status}',url='${url}',defaultSlider='${defaultSlider}' ,expiryDate = '${expiryDate}' WHERE id = ${id}`;
    try {
      return new Promise((resolve, reject) => {
        db.query(query, (err, result) => {
          if (err) {
            console.log(err);
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    } catch (error) {
      console.log(error);
    }
  }
};

module.exports = {
  createSlider,
  getallimages,
  deleteSlider,
  getSliderById,
  updateSlider,
};
