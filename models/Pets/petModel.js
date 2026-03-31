var db = require("../../config/DatabaseConnection.js");

// Create pet record
var createPet = function (petData) {
  var insertQuery = `INSERT INTO pets (
    user_id, pet_name, category_id, breed_id, gender, country_id, address, 
    latitude, longitude, date_of_birth, color, size_category, neutered, 
    microchipped, microchip_id, temperament, activity_level, adopted, 
    adoption_date, adoption_source, is_active, is_deleted, is_visible_nearby
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  var selectQuery = "SELECT * FROM pets WHERE pet_id = LAST_INSERT_ID()";

  return new Promise((resolve, reject) => {
    db.query(
      insertQuery,
      [
        petData.user_id,
        petData.pet_name,
        petData.category_id,
        petData.breed_id,
        petData.gender || null,
        petData.country_id,
        petData.address || null,
        petData.latitude || null,
        petData.longitude || null,
        petData.date_of_birth || null,
        petData.color || null,
        petData.size_category || null,
        petData.neutered ? 1 : 0,
        petData.microchipped ? 1 : 0,
        petData.microchip_id || null,
        petData.temperament || null,
        petData.activity_level || null,
        petData.adopted !== undefined ? (petData.adopted ? 1 : 0) : 1,
        petData.adoption_date || null,
        petData.adoption_source || null,
        petData.is_active !== undefined ? (petData.is_active ? 1 : 0) : 1,
        petData.is_deleted !== undefined ? (petData.is_deleted ? 1 : 0) : 0,
        petData.is_visible_nearby !== undefined ? (petData.is_visible_nearby ? 1 : 0) : 1,
      ],
      function (insertErr) {
        if (insertErr) {
          reject(insertErr);
        } else {
          db.query(selectQuery, function (selectErr, result) {
            if (selectErr) {
              reject(selectErr);
            } else {
              resolve(result[0]);
            }
          });
        }
      }
    );
  });
};

// Create pet images
var createPetImages = function (petId, images) {
  if (!images || images.length === 0) {
    return Promise.resolve([]);
  }

  var insertQuery = `INSERT INTO pet_images (pet_id, image_url, image_type, sort_order) VALUES ?`;
  
  var values = images.map((img, index) => [
    petId,
    img.image_url,
    img.image_type || 'gallery',
    img.sort_order || index
  ]);

  return new Promise((resolve, reject) => {
    db.query(insertQuery, [values], function (err, result) {
      if (err) {
        reject(err);
      } else {
        // Fetch inserted images
        var selectQuery = "SELECT * FROM pet_images WHERE pet_id = ? ORDER BY sort_order";
        db.query(selectQuery, [petId], function (selectErr, imagesResult) {
          if (selectErr) {
            reject(selectErr);
          } else {
            resolve(imagesResult);
          }
        });
      }
    });
  });
};

// Get user pets with images
var getUserPets = function (userId) {
  var query = `
    SELECT 
      p.*,
      GROUP_CONCAT(
        CONCAT(pi.image_id, ':::', pi.image_url, ':::', IFNULL(pi.image_type, 'gallery'), ':::', IFNULL(pi.sort_order, 0))
        ORDER BY pi.sort_order
        SEPARATOR '|||'
      ) AS images
    FROM pets p
    LEFT JOIN pet_images pi ON p.pet_id = pi.pet_id
    WHERE p.user_id = ? AND p.is_deleted = 0
    GROUP BY p.pet_id
    ORDER BY p.created_at DESC
  `;

  return new Promise((resolve, reject) => {
    db.query(query, [userId], function (err, result) {
      if (err) {
        reject(err);
      } else {
        // Parse images from concatenated string
        var pets = result.map((pet) => {
          var petObj = { ...pet };
          if (pet.images) {
            petObj.images = pet.images.split('|||').map((imgStr) => {
              var parts = imgStr.split(':::');
              if (parts.length === 4) {
                return {
                  image_id: parseInt(parts[0]),
                  image_url: parts[1],
                  image_type: parts[2],
                  sort_order: parseInt(parts[3])
                };
              }
              return null;
            }).filter(img => img !== null);
          } else {
            petObj.images = [];
          }
          return petObj;
        });
        resolve(pets);
      }
    });
  });
};

// Get pet by ID
var getPetById = function (petId, userId) {
  var query = `
    SELECT 
      p.*,
      GROUP_CONCAT(
        CONCAT(pi.image_id, ':::', pi.image_url, ':::', IFNULL(pi.image_type, 'gallery'), ':::', IFNULL(pi.sort_order, 0))
        ORDER BY pi.sort_order
        SEPARATOR '|||'
      ) AS images
    FROM pets p
    LEFT JOIN pet_images pi ON p.pet_id = pi.pet_id
    WHERE p.pet_id = ? AND p.user_id = ? AND p.is_deleted = 0
    GROUP BY p.pet_id
  `;

  return new Promise((resolve, reject) => {
    db.query(query, [petId, userId], function (err, result) {
      if (err) {
        reject(err);
      } else if (result.length === 0) {
        resolve(null);
      } else {
        var pet = result[0];
        if (pet.images) {
          pet.images = pet.images.split('|||').map((imgStr) => {
            var parts = imgStr.split(':::');
            if (parts.length === 4) {
              return {
                image_id: parseInt(parts[0]),
                image_url: parts[1],
                image_type: parts[2],
                sort_order: parseInt(parts[3])
              };
            }
            return null;
          }).filter(img => img !== null);
        } else {
          pet.images = [];
        }
        resolve(pet);
      }
    });
  });
};

// Update pet
var updatePet = function (petId, userId, updates) {
  var allowedFields = [
    'pet_name', 'category_id', 'breed_id', 'gender', 'country_id', 'address',
    'latitude', 'longitude', 'date_of_birth', 'color', 'size_category',
    'neutered', 'microchipped', 'microchip_id', 'temperament', 'activity_level',
    'adopted', 'adoption_date', 'adoption_source', 'is_active', 'is_deleted',
    'is_visible_nearby'
  ];

  var fields = Object.keys(updates).filter(
    (key) => updates[key] !== undefined && allowedFields.includes(key)
  );

  if (fields.length === 0) {
    return Promise.reject(new Error("No valid fields to update"));
  }

  // Convert boolean values to 0/1
  var values = fields.map((field) => {
    var value = updates[field];
    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }
    return value;
  });
  
  var setClause = fields.map((field) => `${field} = ?`).join(", ");
  var sql = `UPDATE pets SET ${setClause} WHERE pet_id = ? AND user_id = ?`;
  values.push(petId, userId);

  return new Promise((resolve, reject) => {
    db.query(sql, values, function (err, result) {
      if (err) {
        reject(err);
      } else {
        // Fetch updated pet
        getPetById(petId, userId)
          .then((pet) => resolve(pet))
          .catch((err) => reject(err));
      }
    });
  });
};

// Delete pet image
var deletePetImage = function (imageId, petId, userId) {
  // Verify pet belongs to user
  var verifyQuery = "SELECT pet_id FROM pets WHERE pet_id = ? AND user_id = ?";
  var deleteQuery = "DELETE FROM pet_images WHERE image_id = ? AND pet_id = ?";

  return new Promise((resolve, reject) => {
    db.query(verifyQuery, [petId, userId], function (verifyErr, verifyResult) {
      if (verifyErr) {
        reject(verifyErr);
      } else if (verifyResult.length === 0) {
        reject(new Error("Pet not found or access denied"));
      } else {
        db.query(deleteQuery, [imageId, petId], function (deleteErr, result) {
          if (deleteErr) {
            reject(deleteErr);
          } else {
            resolve(result);
          }
        });
      }
    });
  });
};

// Add pet device
var addPetDevice = function (petId, deviceId, userId) {
  // Verify pet belongs to user
  var verifyQuery = "SELECT pet_id FROM pets WHERE pet_id = ? AND user_id = ?";
  var insertQuery = "INSERT INTO pet_devices (pet_id, device_id) VALUES (?, ?)";
  var selectQuery = "SELECT * FROM pet_devices WHERE id = LAST_INSERT_ID()";

  return new Promise((resolve, reject) => {
    db.query(verifyQuery, [petId, userId], function (verifyErr, verifyResult) {
      if (verifyErr) {
        reject(verifyErr);
      } else if (verifyResult.length === 0) {
        reject(new Error("Pet not found or access denied"));
      } else {
        db.query(insertQuery, [petId, deviceId], function (insertErr) {
          if (insertErr) {
            reject(insertErr);
          } else {
            db.query(selectQuery, function (selectErr, result) {
              if (selectErr) {
                reject(selectErr);
              } else {
                resolve(result[0]);
              }
            });
          }
        });
      }
    });
  });
};

// Get pet devices
var getPetDevices = function (petId, userId) {
  var query = `
    SELECT 
      pd.*,
      d.imei,
      d.devicetype,
      d.activated_at,
      d.deactivated_at
    FROM pet_devices pd
    INNER JOIN pets p ON pd.pet_id = p.pet_id
    LEFT JOIN devices d ON pd.device_id = d.id
    WHERE pd.pet_id = ? AND p.user_id = ? AND pd.unassigned_at IS NULL
    ORDER BY pd.assigned_at DESC
  `;

  return new Promise((resolve, reject) => {
    db.query(query, [petId, userId], function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

// Update pet device (unassign/assign)
var updatePetDevice = function (deviceId, petId, userId, updates) {
  // Verify pet belongs to user
  var verifyQuery = "SELECT pet_id FROM pets WHERE pet_id = ? AND user_id = ?";
  var updateQuery = "UPDATE pet_devices SET unassigned_at = ? WHERE id = ? AND pet_id = ?";
  var selectQuery = "SELECT * FROM pet_devices WHERE id = ?";

  return new Promise((resolve, reject) => {
    db.query(verifyQuery, [petId, userId], function (verifyErr, verifyResult) {
      if (verifyErr) {
        reject(verifyErr);
      } else if (verifyResult.length === 0) {
        reject(new Error("Pet not found or access denied"));
      } else {
        var unassignedAt = updates.unassigned_at || new Date();
        db.query(updateQuery, [unassignedAt, deviceId, petId], function (updateErr) {
          if (updateErr) {
            reject(updateErr);
          } else {
            db.query(selectQuery, [deviceId], function (selectErr, result) {
              if (selectErr) {
                reject(selectErr);
              } else {
                resolve(result[0]);
              }
            });
          }
        });
      }
    });
  });
};

// Reassign device to pet
var reassignPetDevice = function (deviceId, petId, userId) {
  // Verify pet belongs to user
  var verifyQuery = "SELECT pet_id FROM pets WHERE pet_id = ? AND user_id = ?";
  var updateQuery = "UPDATE pet_devices SET unassigned_at = NULL, assigned_at = ? WHERE id = ? AND pet_id = ?";
  var selectQuery = "SELECT * FROM pet_devices WHERE id = ?";

  return new Promise((resolve, reject) => {
    db.query(verifyQuery, [petId, userId], function (verifyErr, verifyResult) {
      if (verifyErr) {
        reject(verifyErr);
      } else if (verifyResult.length === 0) {
        reject(new Error("Pet not found or access denied"));
      } else {
        var assignedAt = new Date();
        db.query(updateQuery, [assignedAt, deviceId, petId], function (updateErr) {
          if (updateErr) {
            reject(updateErr);
          } else {
            db.query(selectQuery, [deviceId], function (selectErr, result) {
              if (selectErr) {
                reject(selectErr);
              } else {
                resolve(result[0]);
              }
            });
          }
        });
      }
    });
  });
};

// Get nearby pets with optional filters + pagination
var getNearbyPets = function (filters) {
  const {
    category_id,
    breed_id,
    country_id,
    gender,
    latitude,
    longitude,
    radius,
    page,
    limit
  } = filters;

  const offset = (page - 1) * limit;

  let whereConditions = `
    p.is_deleted = 0
    AND p.is_active = 1
    AND p.is_visible_nearby = 1
  `;

  let params = [];

  if (category_id) {
    whereConditions += " AND p.category_id = ?";
    params.push(category_id);
  }

  if (breed_id) {
    whereConditions += " AND p.breed_id = ?";
    params.push(breed_id);
  }

  if (country_id) {
    whereConditions += " AND p.country_id = ?";
    params.push(country_id);
  }

  if (gender) {
    whereConditions += " AND p.gender = ?";
    params.push(gender);
  }

  // Distance filter (only if lat/lng provided)
  let distanceSelect = "";
  let distanceHaving = "";

  if (latitude && longitude) {
    distanceSelect = `,
      (6371 * ACOS(
        COS(RADIANS(?)) *
        COS(RADIANS(p.latitude)) *
        COS(RADIANS(p.longitude) - RADIANS(?)) +
        SIN(RADIANS(?)) *
        SIN(RADIANS(p.latitude))
      )) AS distance
    `;
    distanceHaving = " HAVING distance <= ?";
    params.unshift(latitude, longitude, latitude);
    params.push(radius);
  }

  const dataQuery = `
    SELECT 
      p.*,
      GROUP_CONCAT(
        CONCAT(pi.image_id, ':::', pi.image_url, ':::', IFNULL(pi.image_type,'gallery'), ':::', IFNULL(pi.sort_order,0))
        ORDER BY pi.sort_order
        SEPARATOR '|||'
      ) AS images
      ${distanceSelect}
    FROM pets p
    LEFT JOIN pet_images pi ON p.pet_id = pi.pet_id
    WHERE ${whereConditions}
    GROUP BY p.pet_id
    ${distanceHaving}
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const countQuery = `
    SELECT COUNT(DISTINCT p.pet_id) AS total
    FROM pets p
    WHERE ${whereConditions}
  `;

  return new Promise((resolve, reject) => {
    db.query(countQuery, params.slice(0, params.length - (latitude && longitude ? 4 : 0)), function (err, countResult) {
      if (err) return reject(err);

      const total = countResult[0].total;

      db.query(
        dataQuery,
        [...params, limit, offset],
        function (err, result) {
          if (err) return reject(err);

          const pets = result.map(pet => {
            if (pet.images) {
              pet.images = pet.images.split("|||").map(img => {
                const parts = img.split(":::");
                return {
                  image_id: parseInt(parts[0]),
                  image_url: parts[1],
                  image_type: parts[2],
                  sort_order: parseInt(parts[3])
                };
              });
            } else {
              pet.images = [];
            }
            return pet;
          });

          resolve({ total, pets });
        }
      );
    });
  });
};


module.exports = {
  createPet: createPet,
  createPetImages: createPetImages,
  getUserPets: getUserPets,
  getPetById: getPetById,
  updatePet: updatePet,
  deletePetImage: deletePetImage,
  addPetDevice: addPetDevice,
  getPetDevices: getPetDevices,
  updatePetDevice: updatePetDevice,
  reassignPetDevice: reassignPetDevice,
  getNearbyPets: getNearbyPets
};

