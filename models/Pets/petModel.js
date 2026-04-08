var db = require("../../config/DatabaseConnection.js");

var formatPetResponse = function (pet) {
  const petObj = { ...pet };

  // Remove unwanted internal IDs
  delete petObj.user_id;
  delete petObj.breed_id;
  delete petObj.country_id;

  // Parse images
  petObj.images = petObj.images
    ? petObj.images.split("|||").map((imgStr) => {
        const parts = imgStr.split(":::");
        return {
          image_id: parseInt(parts[0]),
          image_url: parts[1],
          image_type: parts[2],
          sort_order: parseInt(parts[3]),
        };
      })
    : [];

  // Parse tags
  petObj.tags = petObj.tags
    ? petObj.tags.split("|||").map((tagStr) => {
        const parts = tagStr.split(":::");
        return {
          id: parseInt(parts[0]),
          name: parts[1],
        };
      })
    : [];

  return petObj;
};

var generateUniqueSlug = function (baseSlug) {
  return new Promise((resolve, reject) => {
    const query = "SELECT slug FROM pets WHERE slug LIKE ?";

    db.query(query, [`${baseSlug}%`], (err, rows) => {
      if (err) return reject(err);

      if (rows.length === 0) {
        return resolve(baseSlug);
      }

      let newSlug = baseSlug;
      let counter = 1;

      const existingSlugs = rows.map(row => row.slug);

      while (existingSlugs.includes(newSlug)) {
        newSlug = `${baseSlug}-${counter}`;
        counter++;
      }

      resolve(newSlug);
    });
  });
};

// Create pet record
var createPet = async function (petData, tags = "") {
  petData.slug = await generateUniqueSlug(petData.slug);
  const insertQuery = `
    INSERT INTO pets (
      user_id, pet_name, slug, category_id, breed_id, gender, country_id, address,
      latitude, longitude, date_of_birth, color, size_category, neutered,
      microchipped, microchip_id, temperament, activity_level, adopted,
      adoption_date, adoption_source, is_active, is_deleted, is_visible_nearby
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
  `;

  return new Promise((resolve, reject) => {
    db.beginTransaction(err => {
      if (err) return reject(err);

      db.query(
        insertQuery,
        [
          petData.user_id,
          petData.pet_name,
          petData.slug,
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
          petData.is_visible_nearby !== undefined
            ? petData.is_visible_nearby
              ? 1
              : 0
            : 1,
        ],
        async function (insertErr, result) {
          if (insertErr) {
            return db.rollback(() => reject(insertErr));
          }

          const petId = result.insertId;

          try {
            let parsedTags = [];

            if (typeof tags === "string" && tags.trim()) {
              parsedTags = tags
                .split(",")
                .map(tag => tag.trim())
                .filter(tag => tag);
            }

            const tagIds = [];

            for (const tagName of parsedTags) {
              const existingTag = await new Promise((res, rej) => {
                db.query(
                  "SELECT id FROM tags WHERE name = ?",
                  [tagName],
                  (err, rows) => {
                    if (err) return rej(err);
                    res(rows);
                  },
                );
              });

              let tagId;

              if (existingTag.length > 0) {
                tagId = existingTag[0].id;
              } else {
                const insertedTag = await new Promise((res, rej) => {
                  db.query(
                    "INSERT INTO tags (name) VALUES (?)",
                    [tagName],
                    (err, insertResult) => {
                      if (err) return rej(err);
                      res(insertResult);
                    },
                  );
                });

                tagId = insertedTag.insertId;
              }

              tagIds.push(tagId);
            }

            if (tagIds.length > 0) {
              const uniqueTagIds = [...new Set(tagIds)];
              const tagData = uniqueTagIds.map(tagId => [petId, tagId]);

              await new Promise((res, rej) => {
                db.query(
                  "INSERT INTO pet_tags (pet_id, tag_id) VALUES ?",
                  [tagData],
                  err => {
                    if (err) return rej(err);
                    res();
                  },
                );
              });
            }

            db.commit(err => {
              if (err) return db.rollback(() => reject(err));
              resolve({pet_id: petId});
            });
          } catch (error) {
            db.rollback(() => reject(error));
          }
        },
      );
    });
  });
};

// Get pet by slug
var getPetBySlug = function (slug) {
  var query = `
    SELECT 
      p.*,

      GROUP_CONCAT(
        DISTINCT CONCAT(
          pi.image_id, ':::',
          pi.image_url, ':::',
          IFNULL(pi.image_type, 'gallery'), ':::',
          IFNULL(pi.sort_order, 0)
        )
        ORDER BY pi.sort_order
        SEPARATOR '|||'
      ) AS images,

      GROUP_CONCAT(
        DISTINCT CONCAT(
          t.id, ':::',
          t.name
        )
        ORDER BY t.name
        SEPARATOR '|||'
      ) AS tags

    FROM pets p
    LEFT JOIN pet_images pi ON p.pet_id = pi.pet_id
    LEFT JOIN pet_tags pt ON p.pet_id = pt.pet_id
    LEFT JOIN tags t ON pt.tag_id = t.id
    WHERE p.slug = ? AND p.is_deleted = 0
    GROUP BY p.pet_id
  `;

  return new Promise((resolve, reject) => {
    db.query(query, [slug], function (err, result) {
      if (err) return reject(err);
      if (result.length === 0) return resolve(null);

      const pet = result[0];

      // Parse images
      resolve(formatPetResponse(result[0]));
    });
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
    img.image_type || "gallery",
    img.sort_order || index,
  ]);

  return new Promise((resolve, reject) => {
    db.query(insertQuery, [values], function (err, result) {
      if (err) {
        reject(err);
      } else {
        // Fetch inserted images
        var selectQuery =
          "SELECT * FROM pet_images WHERE pet_id = ? ORDER BY sort_order";
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

// Get user pets

var getUserPets = function (userId, page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM pets
    WHERE user_id = ? AND is_deleted = 0
  `;

  const dataQuery = `
    SELECT 
      p.*,
      b.title AS breed,
      c.name AS country,

      GROUP_CONCAT(
        DISTINCT CONCAT(
          pi.image_id, ':::', 
          pi.image_url, ':::', 
          IFNULL(pi.image_type, 'gallery'), ':::', 
          IFNULL(pi.sort_order, 0)
        )
        ORDER BY pi.sort_order
        SEPARATOR '|||'
      ) AS images,

      GROUP_CONCAT(
        DISTINCT CONCAT(
          t.id, ':::', t.name
        )
        SEPARATOR '|||'
      ) AS tags

    FROM pets p
    LEFT JOIN pet_images pi ON p.pet_id = pi.pet_id
    LEFT JOIN pet_tags pt ON p.pet_id = pt.pet_id
    LEFT JOIN tags t ON pt.tag_id = t.id
    LEFT JOIN breeds b ON p.breed_id = b.id
    LEFT JOIN countries c ON p.country_id = c.id
    WHERE p.user_id = ? AND p.is_deleted = 0
    GROUP BY p.pet_id
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `;

  return new Promise((resolve, reject) => {
    db.query(countQuery, [userId], function (countErr, countResult) {
      if (countErr) return reject(countErr);

      const total = countResult[0].total;

      db.query(
        dataQuery,
        [userId, limit, offset],
        function (err, result) {
          if (err) return reject(err);

          const pets = result.map(formatPetResponse);

          resolve({
            total,
            pets,
          });
        }
      );
    });
  });
};

// Get pet by ID
// Get pet by ID with images + tags


var getPetById = function (petId, userId) {
  var query = `
    SELECT 
      p.*,
      GROUP_CONCAT(
        DISTINCT CONCAT(
          pi.image_id, ':::', 
          pi.image_url, ':::', 
          IFNULL(pi.image_type, 'gallery'), ':::', 
          IFNULL(pi.sort_order, 0)
        )
        ORDER BY pi.sort_order
        SEPARATOR '|||'
      ) AS images,

      GROUP_CONCAT(
        DISTINCT t.name
        SEPARATOR ','
      ) AS tags

    FROM pets p
    LEFT JOIN pet_images pi ON p.pet_id = pi.pet_id
    LEFT JOIN pet_tags pt ON p.pet_id = pt.pet_id
    LEFT JOIN tags t ON pt.tag_id = t.id
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

        // Parse images
        if (pet.images) {
          pet.images = pet.images.split("|||").map(imgStr => {
            var parts = imgStr.split(":::");
            return {
              image_id: parseInt(parts[0]),
              image_url: parts[1],
              image_type: parts[2],
              sort_order: parseInt(parts[3]),
            };
          });
        } else {
          pet.images = [];
        }

        // Parse tags
        pet.tags = pet.tags ? pet.tags.split(",").map(tag => tag.trim()) : [];

        resolve(pet);
      }
    });
  });
};

// Update pet
var updatePet = function (petId, userId, updates) {
  var allowedFields = [
    "pet_name",
    "category_id",
    "breed_id",
    "gender",
    "country_id",
    "address",
    "latitude",
    "longitude",
    "date_of_birth",
    "color",
    "size_category",
    "neutered",
    "microchipped",
    "microchip_id",
    "temperament",
    "activity_level",
    "adopted",
    "adoption_date",
    "adoption_source",
    "is_active",
    "is_deleted",
    "is_visible_nearby",
  ];

  var fields = Object.keys(updates).filter(
    key => updates[key] !== undefined && allowedFields.includes(key),
  );

  if (fields.length === 0) {
    return Promise.reject(new Error("No valid fields to update"));
  }

  // Convert boolean values to 0/1
  var values = fields.map(field => {
    var value = updates[field];
    if (typeof value === "boolean") {
      return value ? 1 : 0;
    }
    return value;
  });

  var setClause = fields.map(field => `${field} = ?`).join(", ");
  var sql = `UPDATE pets SET ${setClause} WHERE pet_id = ? AND user_id = ?`;
  values.push(petId, userId);

  return new Promise((resolve, reject) => {
    db.query(sql, values, function (err, result) {
      if (err) {
        reject(err);
      } else {
        // Fetch updated pet
        getPetById(petId, userId)
          .then(pet => resolve(pet))
          .catch(err => reject(err));
      }
    });
  });
};

// Update pet tags
var updatePetTags = function (petId, tags = "") {
  return new Promise(async (resolve, reject) => {
    try {
      await new Promise((res, rej) => {
        db.query("DELETE FROM pet_tags WHERE pet_id = ?", [petId], err => {
          if (err) return rej(err);
          res();
        });
      });

      if (!tags || !tags.trim()) {
        return resolve(true);
      }

      const parsedTags = tags
        .split(",")
        .map(tag => tag.trim())
        .filter(tag => tag);

      const tagIds = [];

      for (const tagName of parsedTags) {
        const existingTag = await new Promise((res, rej) => {
          db.query(
            "SELECT id FROM tags WHERE name = ?",
            [tagName],
            (err, rows) => {
              if (err) return rej(err);
              res(rows);
            },
          );
        });

        let tagId;

        if (existingTag.length > 0) {
          tagId = existingTag[0].id;
        } else {
          const insertedTag = await new Promise((res, rej) => {
            db.query(
              "INSERT INTO tags (name) VALUES (?)",
              [tagName],
              (err, result) => {
                if (err) return rej(err);
                res(result);
              },
            );
          });

          tagId = insertedTag.insertId;
        }

        tagIds.push(tagId);
      }

      const values = [...new Set(tagIds)].map(tagId => [petId, tagId]);

      if (values.length > 0) {
        await new Promise((res, rej) => {
          db.query(
            "INSERT INTO pet_tags (pet_id, tag_id) VALUES ?",
            [values],
            err => {
              if (err) return rej(err);
              res();
            },
          );
        });
      }

      resolve(true);
    } catch (error) {
      reject(error);
    }
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
  var updateQuery =
    "UPDATE pet_devices SET unassigned_at = ? WHERE id = ? AND pet_id = ?";
  var selectQuery = "SELECT * FROM pet_devices WHERE id = ?";

  return new Promise((resolve, reject) => {
    db.query(verifyQuery, [petId, userId], function (verifyErr, verifyResult) {
      if (verifyErr) {
        reject(verifyErr);
      } else if (verifyResult.length === 0) {
        reject(new Error("Pet not found or access denied"));
      } else {
        var unassignedAt = updates.unassigned_at || new Date();
        db.query(
          updateQuery,
          [unassignedAt, deviceId, petId],
          function (updateErr) {
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
          },
        );
      }
    });
  });
};

// Reassign device to pet
var reassignPetDevice = function (deviceId, petId, userId) {
  // Verify pet belongs to user
  var verifyQuery = "SELECT pet_id FROM pets WHERE pet_id = ? AND user_id = ?";
  var updateQuery =
    "UPDATE pet_devices SET unassigned_at = NULL, assigned_at = ? WHERE id = ? AND pet_id = ?";
  var selectQuery = "SELECT * FROM pet_devices WHERE id = ?";

  return new Promise((resolve, reject) => {
    db.query(verifyQuery, [petId, userId], function (verifyErr, verifyResult) {
      if (verifyErr) {
        reject(verifyErr);
      } else if (verifyResult.length === 0) {
        reject(new Error("Pet not found or access denied"));
      } else {
        var assignedAt = new Date();
        db.query(
          updateQuery,
          [assignedAt, deviceId, petId],
          function (updateErr) {
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
          },
        );
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
    limit,
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
    db.query(dataQuery, [...params, limit, offset], function (err, result) {
  if (err) return reject(err);

  const pets = result.map(formatPetResponse);

  resolve({  pets });
});
  });
};

var addListingPet = function (listingData) {
  const checkQuery = `
    SELECT listing_id
    FROM pet_listing
    WHERE pet_id = ?
    LIMIT 1
  `;

  const insertQuery = `
    INSERT INTO pet_listing (
      pet_id,
      type,
      price,
      description,
      status
    ) VALUES (?, ?, ?, ?, 'active')
  `;

  const updateQuery = `
    UPDATE pet_listing
    SET
      type = ?,
      price = ?,
      description = ?,
      status = 'active',
      updated_at = CURRENT_TIMESTAMP
    WHERE listing_id = ?
  `;

  return new Promise((resolve, reject) => {
    db.query(checkQuery, [listingData.pet_id], function (checkErr, rows) {
      if (checkErr) return reject(checkErr);

      // ✅ UPDATE existing listing
      if (rows.length > 0) {
        const listingId = rows[0].listing_id;

        db.query(
          updateQuery,
          [
            listingData.type,
            listingData.price,
            listingData.description,
            listingId,
          ],
          function (updateErr) {
            if (updateErr) return reject(updateErr);

            db.query(
              "SELECT * FROM pet_listing WHERE listing_id = ?",
              [listingId],
              function (selectErr, result) {
                if (selectErr) return reject(selectErr);
                resolve(result[0]);
              }
            );
          }
        );
      }

      // ✅ INSERT new listing
      else {
        db.query(
          insertQuery,
          [
            listingData.pet_id,
            listingData.type,
            listingData.price,
            listingData.description,
          ],
          function (insertErr, result) {
            if (insertErr) return reject(insertErr);

            db.query(
              "SELECT * FROM pet_listing WHERE listing_id = ?",
              [result.insertId],
              function (selectErr, rows) {
                if (selectErr) return reject(selectErr);
                resolve(rows[0]);
              }
            );
          }
        );
      }
    });
  });
};

//get listing pets by id
var getPetListingByPetId = function (petId) {
  const query = `
    SELECT *
    FROM pet_listing
    WHERE pet_id = ?
   
    ORDER BY created_at DESC
    
  `;

  return new Promise((resolve, reject) => {
    db.query(query, [petId], function (err, result) {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

var getAllListPet = function (page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM pet_listing pl
    WHERE pl.status = 'active'
  `;

  const dataQuery = `
    SELECT
      pl.listing_id,
      pl.type,
      pl.price,
      pl.description,
      pl.status,
      pl.created_at AS listing_created_at,

      p.pet_id,
      p.pet_name,
      p.slug,
      p.gender,
      p.color,

      b.title AS breed,
      c.name AS country,

      GROUP_CONCAT(
        DISTINCT CONCAT(
          pi.image_id, ':::',
          pi.image_url, ':::',
          IFNULL(pi.image_type, 'gallery'), ':::',
          IFNULL(pi.sort_order, 0)
        )
        ORDER BY pi.sort_order
        SEPARATOR '|||'
      ) AS images

    FROM pet_listing pl
    INNER JOIN pets p ON pl.pet_id = p.pet_id
    LEFT JOIN breeds b ON p.breed_id = b.id
    LEFT JOIN countries c ON p.country_id = c.id
    LEFT JOIN pet_images pi ON p.pet_id = pi.pet_id

    WHERE pl.status = 'active'
      AND p.is_deleted = 0

    GROUP BY pl.listing_id
    ORDER BY pl.created_at DESC
    LIMIT ? OFFSET ?
  `;

  return new Promise((resolve, reject) => {
    db.query(countQuery, function (countErr, countResult) {
      if (countErr) return reject(countErr);

      const total = countResult[0].total;

      db.query(dataQuery, [limit, offset], function (err, result) {
        if (err) return reject(err);

        const listings = result.map((item) => ({
          ...item,
          images: item.images
            ? item.images.split("|||").map((imgStr) => {
                const parts = imgStr.split(":::");
                return {
                  image_id: parseInt(parts[0]),
                  image_url: parts[1],
                  image_type: parts[2],
                  sort_order: parseInt(parts[3]),
                };
              })
            : [],
        }));

        resolve({
          total,
          listings,
        });
      });
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
  getNearbyPets: getNearbyPets,
  updatePetTags: updatePetTags,
  getPetBySlug: getPetBySlug,
  addListingPet: addListingPet,
getPetListingByPetId: getPetListingByPetId,
getAllListPet: getAllListPet,
};
