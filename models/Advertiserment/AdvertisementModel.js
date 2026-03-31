var db = require("../../config/DatabaseConnection.js");

var createAdvertiserment = async (
  title,
  description,
  price,
  address,
  latitude,
  longitude,
  city,
  views,
  status,
  advertisementtype,
  categoryid,
  healthcheck,
  verfied,
  imagePath,
  userid
) => {
  let conn = db;

  try {
    // Begin the transaction
    await new Promise((resolve, reject) => {
      conn.beginTransaction((err) => {
        if (err) {
          console.error("Error beginning transaction:", err);
          reject({
            success: false,
            message: "Internal server error",
          });
        } else {
          resolve();
        }
      });
    });

    // Insert breed
    const breedResult = await new Promise((resolve, reject) => {
      const insertBreedQuery =
        "INSERT INTO advertisement (title, description,price,address,latitude,longitude,city,views,advertisement_type, healthchecked,verified,status, categoryid, userid) VALUES (?, ?, ?,?,?,?,?,?,?,?,?,?,?,?)";
      return conn.query(
        insertBreedQuery,
        [
          title,
          description,
          price,
          address,
          latitude,
          longitude,
          city,
          views,
          advertisementtype,
          healthcheck,
          verfied,
          status,
          categoryid,
          userid,
        ],
        (err, result) => {
          if (err) {
            console.error("Error inserting breed:", err);
            conn.rollback(() => {
              reject({
                success: false,
                message: "Internal server error due to breed insertion error",
              });
            });
          } else {
            resolve(result);
          }
        }
      );
    });

    const breedId = breedResult.insertId;

    //Insert images for the breed
    if (imagePath && imagePath.length > 0) {
      const insertImagesQuery =
        "INSERT INTO adertisementimages (images, advertisementid) VALUES ?";
      const values = imagePath.map((image) => [image, breedId]);

      console.log("Values: ", values);

      await new Promise((resolve, reject) => {
        conn.query(insertImagesQuery, [values], (err) => {
          if (err) {
            console.error("Error inserting images:", err);
            conn.rollback(() => {
              reject({
                success: false,
                message: "Internal server error due to image insertion error",
              });
            });
          } else {
            resolve();
          }
        });
      });
    }
    await new Promise((resolve, reject) => {
      conn.commit((err) => {
        if (err) {
          console.error("Error committing transaction:", err);
          conn.rollback(() => {
            reject({
              success: false,
              message: "Internal server error due to commit error",
            });
          });
        } else {
          resolve({
            success: true,
            message: "Advertisement with images  inserted successfully",
            data: { breedId },
          });
        }
      });
    });
  } catch (error) {
    console.error("Error:", error);
    // Rollback the transaction on error
    await new Promise((resolve) => {
      conn.rollback(() => {
        resolve();
      });
    });
    throw error;
  }
};

var getAllAdvertisement = function (page, limit, callback) {
  var offset = (page - 1) * limit;
  var query =
    "SELECT advertisement.*, GROUP_CONCAT(adertisementimages.images) AS imagePaths , breedcategory.title AS category_title FROM advertisement JOIN breedcategory ON advertisement.categoryid = breedcategory.id LEFT JOIN adertisementimages ON advertisement.id = adertisementimages.advertisementid GROUP BY advertisement.id LIMIT ? OFFSET ?";

  db.query(query, [limit, offset], function (err, result) {
    if (err) {
      return callback(err, null);
    } else if (result) {
      db.query(
        "SELECT COUNT(*) as total FROM advertisement",
        function (err, result1) {
          if (err) {
            return callback(err, null);
          }

          var totalAdvertisements = result1[0].total;

          return callback(null, {
            data: result,
            totalPages: Math.ceil(totalAdvertisements / limit),
          });
        }
      );
    }
  });
};

// var getAllAdvertisement = function (page, limit, callback) {
//   var offset = (page - 1) * limit;
//   var query =
//     "SELECT advertisement.*, GROUP_CONCAT(adertisementimages.images) AS imagePaths , breedcategory.title AS category_title FROM advertisement JOIN breedcategory ON advertisement.categoryid = breedcategory.id LEFT JOIN adertisementimages ON advertisement.id = adertisementimages.advertisementid GROUP BY advertisement.id LIMIT ? OFFSET ?";

//   db.query(query, [limit, offset], function (err, result) {
//     if (err) {
//       return callback(err, null);
//     }
//     var processedResult = result.map(function (item) {
//       return {
//         ...item,
//         imagePaths: item.imagePaths.split(","),
//       };
//     });
//     return callback(null, processedResult);
//   });
// };

var getAdvertisementById = function (id, callback) {
  var query =
    "SELECT advertisement.*, GROUP_CONCAT(adertisementimages.images) AS imagePaths , breedcategory.title AS category_title  FROM advertisement JOIN breedcategory ON advertisement.categoryid = breedcategory.id LEFT JOIN adertisementimages ON advertisement.id = adertisementimages.advertisementid WHERE advertisement.id = ? GROUP BY advertisement.id";
  db.query(query, [id], function (err, result) {
    if (err) {
      return callback(err, null);
    }
    var processedResult = result.map(function (item) {
      return {
        ...item,
        imagePaths: item.imagePaths.split(","),
      };
    });
    return callback(null, processedResult);
  });
};
var getAdvertisementByIdForStatus = function (id) {
  return new Promise((resolve, reject) => {
    var query =
      "SELECT advertisement.*, GROUP_CONCAT(adertisementimages.images) AS imagePaths , breedcategory.title AS category_title  FROM advertisement JOIN breedcategory ON advertisement.categoryid = breedcategory.id LEFT JOIN adertisementimages ON advertisement.id = adertisementimages.advertisementid WHERE advertisement.id = ? GROUP BY advertisement.id";
    db.query(query, [id], function (err, result) {
      if (err) {
        reject(err);
      } else {
        var processedResult = result.map(function (item) {
          return {
            ...item,
            imagePaths: item.imagePaths.split(","),
          };
        });
        resolve(processedResult);
      }
    });
  });
};
var updateAdvertisementStatus = function (id, status) {
  return new Promise((resolve, reject) => {
    var query = `UPDATE advertisement SET status = ${status} WHERE id = ${id}`;
    db.query(query, function (err, result) {
      if (err) {
        reject(err);
      } else if (result.affectedRows === 0) {
        reject("No advertisement found with the given id");
      } else {
        resolve(result);
      }
    });
  });
};

var getAdvertisementByUserToken = function (id, page, limit, callback) {
  var offset = (page - 1) * limit;
  var query = `SELECT advertisement.*, GROUP_CONCAT(adertisementimages.images) AS imagePaths ,  breedcategory.title AS category_title FROM advertisement JOIN breedcategory ON advertisement.categoryid = breedcategory.id LEFT JOIN adertisementimages ON advertisement.id = adertisementimages.advertisementid WHERE advertisement.userid = ${id} GROUP BY advertisement.id LIMIT ${limit} OFFSET ${offset}`;
  db.query(query, function (err, result) {
    if (err) {
      return callback(err, null);
    }
    var processedResult = result.map(function (item) {
      return {
        ...item,
        imagePaths: item.imagePaths.split(","),
      };
    });
    return callback(null, processedResult);
  });
};

var deleteAdvertisement = function (id, callback) {
  var query = "DELETE FROM advertisement WHERE id = ?";
  db.query(query, [id], function (err, result) {
    if (err) {
      return callback(err, null);
    }
    return callback(null, result);
  });
};

module.exports = {
  createAdvertiserment: createAdvertiserment,
  getAllAdvertisement: getAllAdvertisement,
  deleteAdvertisement: deleteAdvertisement,
  getAdvertisementById: getAdvertisementById,
  getAdvertisementByUserToken: getAdvertisementByUserToken,
  updateAdvertisementStatus: updateAdvertisementStatus,
  getAdvertisementByIdForStatus: getAdvertisementByIdForStatus,
};
