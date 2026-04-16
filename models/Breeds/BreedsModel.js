var db = require("../../config/DatabaseConnection.js");

var showBreedsCategory = function (callback) {
  var query = "SELECT * FROM breedcategory ";
  db.query(query, function (err, result) {
    if (err) return callback(err, null);
    return callback(null, result);
  });
};

var insertBreedWithImage = function (
  title,
  slug,
  description,
  categoryid,
  imagePath,
  tags,
  lifespan,
  weight,
  height,
  shortDescription,
  qa = [],
) {
  return new Promise(function (resolve, reject) {
    var conn = db;

    conn.beginTransaction(async function (err) {
      if (err) return reject(err);

      try {
        // 1️⃣ Insert Breed
        const breedResult = await queryAsync(
          conn,
          "INSERT INTO breeds (title,slug,description,categoryid,lifespan,weight,height,shortDescription) VALUES (?,?,?,?,?,?,?,?)",
          [
            title,
            slug,
            description,
            categoryid,
            lifespan,
            weight,
            height,
            shortDescription,
          ],
        );

        const breedId = breedResult.insertId;

        // 2️⃣ INSERT TAGS (TEXT BASED SYSTEM)
        for (let tag of tags) {
          let tagRow = await queryAsync(
            conn,
            "SELECT id FROM tags WHERE name = ?",
            [tag],
          );

          let tagId;

          if (tagRow.length === 0) {
            const insertTag = await queryAsync(
              conn,
              "INSERT INTO tags (name) VALUES (?)",
              [tag],
            );
            tagId = insertTag.insertId;
          } else {
            tagId = tagRow[0].id;
          }

          await queryAsync(
            conn,
            "INSERT INTO breed_tags (breed_id, tag_id) VALUES (?, ?)",
            [breedId, tagId],
          );
        }

        // INSERT Q/A
        for (let q of qa) {
          await queryAsync(
            conn,
            "INSERT INTO `breedsq&a` (question, answer, extra, breed_id) VALUES (?, ?, ?, ?)",
            [q.question, q.answer, q.extra || null, breedId],
          );
        }

        // 4️⃣ INSERT IMAGES
        if (imagePath.length > 0) {
          const values = imagePath.map(img => [img, breedId]);

          await queryAsync(
            conn,
            "INSERT INTO breedsimages (image, breed_id) VALUES ?",
            [values],
          );
        }

        await commitAsync(conn);

        resolve({
          success: true,
          breedId,
        });
      } catch (error) {
        await rollbackAsync(conn);
        reject(error);
      }
    });
  });
};

const queryAsync = (conn, query, values) => {
  return new Promise((resolve, reject) => {
    conn.query(query, values, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

const commitAsync = conn => {
  return new Promise((resolve, reject) => {
    conn.commit(err => {
      if (err) reject(err);
      else resolve();
    });
  });
};

const rollbackAsync = conn => {
  return new Promise(resolve => {
    conn.rollback(() => resolve());
  });
};

const searchBreeds = (query, limit = 20) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT b.id AS breed_id,
    b.title AS breed_title,
    b.slug,
  
             GROUP_CONCAT(DISTINCT img.image) AS breed_images
      FROM breeds AS b
      LEFT JOIN breedsimages AS img ON b.id = img.breed_id
      WHERE MATCH(b.title) AGAINST (? IN NATURAL LANGUAGE MODE) 
      GROUP BY b.id
      ORDER BY b.id ASC
      LIMIT ?;
    `;

    db.query(sql, [`%${query}%`, limit], (err, result) => {
      if (err) {
        console.error("Search breeds error:", err);
        return reject(err);
      }

      const breeds = result.map(breed => {
        const breed_images = breed.breed_images
          ? breed.breed_images.split(",")
          : [];
        return {...breed, breed_images};
      });

      resolve(breeds);
    });
  });
};

// var updateBreedWithImage = function (
//   title,
//   description,
//   categoryid,
//   imagePath,
//    lifespan,weight,height,shortDescription,
//   id
// ) {
//   var conn = db;
//   var updateBreedResult;
//   return new Promise(function (resolve, reject) {
//     conn.beginTransaction(function (err) {
//       if (err) {
//         console.error("Error beginning transaction:", err);
//         reject({
//           success: false,
//           message: "Internal server error",
//         });
//       } else {
//         var checkCategoryIdQuery = "SELECT id FROM breedcategory WHERE id = ?";
//         conn.query(checkCategoryIdQuery, [categoryid], function (err, result) {
//           console.log("Check  category result", result);
//           if (err) {
//             console.error("Error checking categoryid:", err);
//             conn.rollback(function () {
//               reject({
//                 success: false,
//                 message: "Internal server error",
//               });
//             });
//           } else {
//             var categoryExists = result.length > 0;
//             if (!categoryExists) {
//               reject(
//                 new Error("Category with id " + categoryid + " does not exist")
//               );
//               return;
//             }
//             var updateBreedQuery =
//               "UPDATE breeds SET title=?, description=?, categoryid=?, lifespan=?,weight=?,height=?,shortDescription=? WHERE id = ?";
//             conn.query(
//               updateBreedQuery,
//               [title, description, categoryid,lifespan,weight,height,shortDescription, id],
//               function (err, result) {
//                 console.log("Check result", result);
//                 if (err) {
//                   console.error("Error updating breed:", err);
//                   conn.rollback(function () {
//                     reject({
//                       success: false,
//                       message: "Internal server error",
//                     });
//                   });
//                 } else {
//                   updateBreedResult = result;

//                   if (imagePath && imagePath.length > 0) {
//                     var insertImagesQuery =
//                       "INSERT INTO breedsimages (image, breed_id) VALUES (?, ?)";
//                     var values = imagePath.map(function (image) {
//                       return { image: image, id: id };
//                     });
//                     var _loop_1 = function (value) {
//                       conn.query(
//                         insertImagesQuery,
//                         [value.image, value.id],
//                         function (err) {
//                           if (err) {
//                             console.error("Error inserting images:", err);
//                             conn.rollback(function () {
//                               reject({
//                                 success: false,
//                                 message: "Internal server error",
//                               });
//                             });
//                           }
//                         }
//                       );
//                     };
//                     for (
//                       var _i = 0, values_1 = values;
//                       _i < values_1.length;
//                       _i++
//                     ) {
//                       var value = values_1[_i];
//                       _loop_1(value);
//                     }
//                   }
//                   conn.commit(function (err) {
//                     if (err) {
//                       console.error("Error committing transaction:", err);
//                       conn.rollback(function () {
//                         reject({
//                           success: false,
//                           message: "Internal server error",
//                         });
//                       });
//                     } else {
//                       resolve(updateBreedResult);
//                     }
//                   });
//                 }
//               }
//             );
//           }
//         });
//       }
//     });
//   });
// };

// var updateBreedWithImage = function (
//   title,
//   description,
//   categoryid,
//   imagePath,
//   lifespan,
//   weight,
//   height,
//   shortDescription,
//   id,
//   tags = [],
//   qa = [],
// ) {
//   var conn = db;
//   var updateBreedResult;

//   return new Promise(function (resolve, reject) {
//     conn.beginTransaction(function (err) {
//       if (err) {
//         console.error("Error beginning transaction:", err);
//         reject({success: false, message: "Internal server error"});
//       } else {
//         var checkCategoryIdQuery = "SELECT id FROM breedcategory WHERE id = ?";
//         conn.query(checkCategoryIdQuery, [categoryid], function (err, result) {
//           if (err) {
//             console.error("Error checking categoryid:", err);
//             conn.rollback(() =>
//               reject({success: false, message: "Internal server error"}),
//             );
//           } else {
//             if (result.length === 0) {
//               return reject(
//                 new Error("Category with id " + categoryid + " does not exist"),
//               );
//             }

//             var updateBreedQuery =
//               "UPDATE breeds SET title=?, description=?, categoryid=?, lifespan=?, weight=?, height=?, shortDescription=? WHERE id=?";

//             conn.query(
//               updateBreedQuery,
//               [
//                 title,
//                 description,
//                 categoryid,
//                 lifespan,
//                 weight,
//                 height,
//                 shortDescription,
//                 id,
//               ],
//               async function (err, result) {
//                 if (err) {
//                   console.error("Error updating breed:", err);
//                   conn.rollback(() =>
//                     reject({success: false, message: "Internal server error"}),
//                   );
//                 } else {
//                   updateBreedResult = result;

//                   // ==============================================================
//                   // ✅ TAG UPDATE
//                   // ==============================================================

//                   try {
//                     // Convert all tags to numbers
//                     tags = tags.map(t => Number(t));

//                     // Fetch current tags
//                     const currentTags = await new Promise((res, rej) => {
//                       conn.query(
//                         "SELECT tag_id FROM breed_tags WHERE breed_id=?",
//                         [id],
//                         (err, rows) => {
//                           if (err) rej(err);
//                           else res(rows.map(r => Number(r.tag_id)));
//                         },
//                       );
//                     });

//                     try {
//                       await new Promise((res, rej) =>
//                         conn.query(
//                           "DELETE FROM `breedsq&a` WHERE breed_id=?",
//                           [id],
//                           err => (err ? rej(err) : res()),
//                         ),
//                       );

//                       if (qa && qa.length > 0) {
//                         const qaValues = qa.map(q => [
//                           q.question,
//                           q.answer,
//                           q.extra || null,
//                           id,
//                         ]);

//                         await new Promise((res, rej) =>
//                           conn.query(
//                             "INSERT INTO `breedsq&a` (question, answer, extra, breed_id) VALUES ?",
//                             [qaValues],
//                             err => (err ? rej(err) : res()),
//                           ),
//                         );
//                       }
//                     } catch (err) {
//                       console.error("Error updating Q/A:", err);
//                       return conn.rollback(() =>
//                         reject({
//                           success: false,
//                           message: "Internal server error",
//                         }),
//                       );
//                     }

//                     // Determine what to add/remove
//                     const tagsToAdd = tags.filter(
//                       tag => !currentTags.includes(tag),
//                     );
//                     const tagsToRemove = currentTags.filter(
//                       tag => !tags.includes(tag),
//                     );

//                     // Insert new tags
//                     if (tagsToAdd.length > 0) {
//                       const insertValues = tagsToAdd.map(tag => [id, tag]);
//                       await new Promise((res, rej) =>
//                         conn.query(
//                           "INSERT INTO breed_tags (breed_id, tag_id) VALUES ?",
//                           [insertValues],
//                           err => (err ? rej(err) : res()),
//                         ),
//                       );
//                     }

//                     // Remove deleted tags
//                     if (tagsToRemove.length > 0) {
//                       await new Promise((res, rej) =>
//                         conn.query(
//                           "DELETE FROM breed_tags WHERE breed_id=? AND tag_id IN (?)",
//                           [id, tagsToRemove],
//                           err => (err ? rej(err) : res()),
//                         ),
//                       );
//                     }
//                   } catch (err) {
//                     console.error("Error updating tags:", err);
//                     return conn.rollback(() =>
//                       reject({
//                         success: false,
//                         message: "Internal server error",
//                       }),
//                     );
//                   }

//                   // ==============================================================
//                   // TAG UPDATE
//                   // ==============================================================

//                   // Insert images (your original logic)
//                   if (imagePath && imagePath.length > 0) {
//                     var insertImagesQuery =
//                       "INSERT INTO breedsimages (image, breed_id) VALUES (?, ?)";
//                     var values = imagePath.map(img => ({image: img, id: id}));

//                     for (let value of values) {
//                       conn.query(
//                         insertImagesQuery,
//                         [value.image, value.id],
//                         function (err) {
//                           if (err) {
//                             console.error("Error inserting images:", err);
//                             return conn.rollback(() =>
//                               reject({
//                                 success: false,
//                                 message: "Internal server error",
//                               }),
//                             );
//                           }
//                         },
//                       );
//                     }
//                   }

//                   // Commit the whole transaction
//                   conn.commit(function (err) {
//                     if (err) {
//                       console.error("Error committing transaction:", err);
//                       conn.rollback(() =>
//                         reject({
//                           success: false,
//                           message: "Internal server error",
//                         }),
//                       );
//                     } else {
//                       resolve(updateBreedResult);
//                     }
//                   });
//                 }
//               },
//             );
//           }
//         });
//       }
//     });
//   });
// };

var updateBreedWithImage = function (
  title,
  description,
  categoryid,
  imagePath,
  lifespan,
  weight,
  height,
  shortDescription,
  id,
  tags = [],
  qa = [],
) {
  var conn = db;

  return new Promise(function (resolve, reject) {
    conn.beginTransaction(async function (err) {
      if (err) {
        console.error("Error beginning transaction:", err);
        return reject({
          success: false,
          message: "Internal server error",
        });
      }

      try {
        const categoryCheck = await new Promise((res, rej) =>
          conn.query(
            "SELECT id FROM breedcategory WHERE id = ?",
            [categoryid],
            (err, rows) => (err ? rej(err) : res(rows)),
          ),
        );

        if (categoryCheck.length === 0) {
          await new Promise(res => conn.rollback(() => res()));
          return reject(
            new Error("Category with id " + categoryid + " does not exist"),
          );
        }
        const updateBreedResult = await new Promise((res, rej) =>
          conn.query(
            `UPDATE breeds 
             SET title=?, description=?, categoryid=?, lifespan=?, weight=?, height=?, shortDescription=? 
             WHERE id=?`,
            [
              title,
              description,
              categoryid,
              lifespan,
              weight,
              height,
              shortDescription,
              id,
            ],
            (err, result) => (err ? rej(err) : res(result)),
          ),
        );

        try {
          // remove old tag mappings
          await new Promise((res, rej) =>
            conn.query("DELETE FROM breed_tags WHERE breed_id=?", [id], err =>
              err ? rej(err) : res(),
            ),
          );

          // reinsert fresh tags
          for (let tag of tags) {
            tag = tag.trim();

            let tagRow = await new Promise((res, rej) =>
              conn.query(
                "SELECT id FROM tags WHERE name=?",
                [tag],
                (err, rows) => (err ? rej(err) : res(rows)),
              ),
            );

            let tagId;

            if (tagRow.length === 0) {
              const insertTag = await new Promise((res, rej) =>
                conn.query(
                  "INSERT INTO tags (name) VALUES (?)",
                  [tag],
                  (err, result) => (err ? rej(err) : res(result)),
                ),
              );

              tagId = insertTag.insertId;
            } else {
              tagId = tagRow[0].id;
            }

            await new Promise((res, rej) =>
              conn.query(
                "INSERT INTO breed_tags (breed_id, tag_id) VALUES (?, ?)",
                [id, tagId],
                err => (err ? rej(err) : res()),
              ),
            );
          }
        } catch (err) {
          console.error("Error updating tags:", err);
          return conn.rollback(() =>
            reject({
              success: false,
              message: "Internal server error",
            }),
          );
        }

        await new Promise((res, rej) =>
          conn.query("DELETE FROM `breedsq&a` WHERE breed_id=?", [id], err =>
            err ? rej(err) : res(),
          ),
        );

        if (qa && qa.length > 0) {
          const qaValues = qa.map(q => [
            q.question,
            q.answer,
            q.extra || null,
            id,
          ]);

          await new Promise((res, rej) =>
            conn.query(
              "INSERT INTO `breedsq&a` (question, answer, extra, breed_id) VALUES ?",
              [qaValues],
              err => (err ? rej(err) : res()),
            ),
          );
        }

        if (imagePath && imagePath.length > 0) {
          const imageValues = imagePath.map(img => [img, id]);

          await new Promise((res, rej) =>
            conn.query(
              "INSERT INTO breedsimages (image, breed_id) VALUES ?",
              [imageValues],
              err => (err ? rej(err) : res()),
            ),
          );
        }

        await new Promise((res, rej) =>
          conn.commit(err => (err ? rej(err) : res())),
        );

        resolve(updateBreedResult);
      } catch (error) {
        console.error("Update breed error:", error);

        conn.rollback(() => {
          reject({
            success: false,
            message: error.message || "Internal server error",
          });
        });
      }
    });
  });
};

var showBreeds = function (page, limit, callback) {
  var query = `
    SELECT 
      b.id AS breed_id, 
      b.title AS breed_title, 
      b.slug, 
      b.shortDescription AS breed_description, 
      b.lifespan AS lifespan, 
      b.weight AS weight, 
      b.height AS height, 
      bc.title AS category_title, 

      GROUP_CONCAT(DISTINCT bi.image) AS breed_images,
      GROUP_CONCAT(DISTINCT t.name) AS tags

    FROM breeds b 
    JOIN breedcategory bc ON b.categoryid = bc.id 

    LEFT JOIN breedsimages bi ON b.id = bi.breed_id 

    LEFT JOIN breed_tags bt ON b.id = bt.breed_id
    LEFT JOIN tags t ON t.id = bt.tag_id

    GROUP BY b.id

    LIMIT ? OFFSET ?
  `;

  var countQuery = "SELECT COUNT(*) AS total FROM breeds";

  var startIndex = (page - 1) * limit;

  db.query(countQuery, function (err, countResult) {
    if (err) {
      return callback(err, null, null);
    }

    db.query(query, [limit, startIndex], function (err, result) {
      if (err) {
        return callback(err, null, null);
      }

      var processedResult = result.map(function (row) {
        return {
          breed_id: row.breed_id,
          breed_title: row.breed_title,
          slug: row.slug,
          breed_description: row.breed_description,
          category_title: row.category_title,
          lifeSpan: row.lifespan,
          weight: row.weight,
          height: row.height,

          breed_images: row.breed_images ? row.breed_images.split(",") : [],

          tags: row.tags ? row.tags.split(",") : [],
        };
      });

      var total = countResult[0].total;

      return callback(null, processedResult, total);
    });
  });
};

var showBreedsByAlphabet = function (alphabet, page, limit, callback) {
  var query = `
    SELECT 
        b.id AS breed_id, 
        b.title AS breed_title, 
        b.slug, 
        b.shortDescription AS breed_description, 
        b.lifespan AS lifespan, 
        b.weight AS weight, 
        b.height AS height, 
        bc.title AS category_title, 
        GROUP_CONCAT(DISTINCT bi.image) AS breed_images,
        GROUP_CONCAT(DISTINCT CONCAT(t.id, ':', t.name)) AS tags

    FROM breeds b 
    JOIN breedcategory bc ON b.categoryid = bc.id 
    LEFT JOIN breedsimages bi ON b.id = bi.breed_id 

    LEFT JOIN breed_tags bt ON b.id = bt.breed_id
    LEFT JOIN tags t ON t.id = bt.tag_id

    WHERE b.title LIKE ? 

    GROUP BY b.id

    LIMIT ? OFFSET ?;
  `;

  // FIXED count query
  var countQuery = `
    SELECT COUNT(*) AS total 
    FROM breeds 
    WHERE title LIKE ?
  `;

  var startIndex = (page - 1) * limit;

  db.query(countQuery, [alphabet + "%"], function (err, countResult) {
    if (err) {
      return callback(err, null, null);
    }

    db.query(
      query,
      [alphabet + "%", limit, startIndex],
      function (err, result) {
        if (err) {
          return callback(err, null, null);
        }

        const processedResult = result.map(row => ({
          breed_id: row.breed_id,
          breed_title: row.breed_title,
          slug: row.slug,
          breed_description: row.breed_description,
          category_title: row.category_title,
          lifespan: row.lifespan,
          weight: row.weight,
          height: row.height,
          breed_images: row.breed_images ? row.breed_images.split(",") : [],
          tags: row.tags
            ? row.tags.split(",").map(tag => {
                const [id, name] = tag.split(":");
                return {
                  id: Number(id),
                  name,
                };
              })
            : [],
        }));

        var total = countResult[0].total;

        return callback(null, processedResult, total);
      },
    );
  });
};

const searchBreedsByTitle = function (title, page, limit, callback) {
  const startIndex = (page - 1) * limit;

  const query = `
    SELECT 
        b.id AS breed_id, 
        b.title AS breed_title, 
        b.slug, 
        b.shortDescription AS breed_description, 
        b.lifespan AS lifespan, 
        b.weight AS weight, 
        b.height AS height, 
        bc.title AS category_title, 
        GROUP_CONCAT(DISTINCT bi.image) AS breed_images,
        GROUP_CONCAT(DISTINCT CONCAT(t.id, ':', t.name)) AS tags

    FROM breeds b 
    JOIN breedcategory bc ON b.categoryid = bc.id 
    LEFT JOIN breedsimages bi ON b.id = bi.breed_id 
    LEFT JOIN breed_tags bt ON b.id = bt.breed_id
    LEFT JOIN tags t ON t.id = bt.tag_id

    WHERE b.title LIKE ? 

    GROUP BY b.id

    LIMIT ? OFFSET ?;
  `;

  const countQuery = `
    SELECT COUNT(*) AS total 
    FROM breeds b 
    WHERE b.title LIKE ?;
  `;

  db.query(countQuery, [`%${title}%`], (err, countResult) => {
    if (err) {
      return callback(err, null, null);
    }

    const total = countResult[0].total;

    db.query(query, [`%${title}%`, limit, startIndex], (err, result) => {
      if (err) {
        return callback(err, null, null);
      }

      const processedResult = result.map(row => ({
        breed_id: row.breed_id,
        breed_title: row.breed_title,
        slug: row.slug,
        breed_description: row.breed_description,
        category_title: row.category_title,
        lifespan: row.lifespan,
        weight: row.weight,
        height: row.height,
        breed_images: row.breed_images ? row.breed_images.split(",") : [],
        tags: row.tags
          ? row.tags.split(",").map(tag => {
              const [id, name] = tag.split(":");
              return {
                id: Number(id),
                name,
              };
            })
          : [],
      }));

      return callback(null, processedResult, total);
    });
  });
};

// delete breed
var deleteBreed = function (id) {
  return new Promise(function (resolve, reject) {
    var query = "DELETE FROM breeds WHERE id = ?";
    db.query(query, [id], function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

var getBreedById = function (id) {
  var query = `
    SELECT 
      b.id AS breed_id, 
      b.title AS breed_title, 
      b.slug, 
      b.description AS breed_description,
      b.categoryid,
      bc.title AS category_title,
      b.lifespan,
      b.weight,
      b.height,
      b.shortDescription,
      bi.id AS image_id,
      bi.image AS image,
      b.meta_title, 
      b.meta_description,
      b.meta_keywords,
      b.meta_image,
      b.meta_canonical, 
      b.is_indexed, 
      b.og_type,
      
      t.id AS tag_id,
      t.name AS tag_name

    FROM breeds b
    JOIN breedcategory bc ON b.categoryid = bc.id
    LEFT JOIN breedsimages bi ON b.id = bi.breed_id
    LEFT JOIN breed_tags bt ON b.id = bt.breed_id
    LEFT JOIN tags t ON t.id = bt.tag_id
    WHERE b.id = ?
  `;

  return new Promise(function (resolve, reject) {
    db.query(query, [id], function (err, rows) {
      if (err) return reject(err);

      if (rows.length === 0) return resolve([]);

      const breed = {
        breed_id: rows[0].breed_id,
        breed_title: rows[0].breed_title,
        slug: rows[0].slug,
        breed_description: rows[0].breed_description,
        categoryid: rows[0].categoryid,
        category_title: rows[0].category_title,
        lifespan: rows[0].lifespan,
        weight: rows[0].weight,
        height: rows[0].height,
        shortDescription: rows[0].shortDescription,
        meta_title: rows[0].meta_title,
        meta_description: rows[0].meta_description,
        meta_keywords: rows[0].meta_keywords,
        meta_image: rows[0].meta_image,
        meta_canonical: rows[0].meta_canonical,
        is_indexed: rows[0].is_indexed,
        og_type: rows[0].og_type,

        images: [],
        tags: [],
        qa: [],
      };

      const imageSet = new Set();
      const tagSet = new Set();

      rows.forEach(r => {
        // Images
        if (r.image_id && !imageSet.has(r.image_id)) {
          breed.images.push({
            id: r.image_id,
            image: r.image,
          });
          imageSet.add(r.image_id);
        }

        // Tags
        if (r.tag_id && !tagSet.has(r.tag_id)) {
          breed.tags.push({
            id: r.tag_id,
            name: r.tag_name,
          });
          tagSet.add(r.tag_id);
        }
      });

      // ✅ FETCH QA SEPARATELY
      const qaQuery = `
        SELECT id, question, answer, extra
        FROM \`breedsq&a\`
        WHERE breed_id = ?
        ORDER BY id ASC
      `;

      db.query(qaQuery, [id], function (qaErr, qaRows) {
        if (qaErr) return reject(qaErr);

        breed.qa = qaRows.map(q => ({
          id: q.id,
          question: q.question,
          answer: q.answer,
          extra: q.extra,
        }));

        resolve([breed]);
      });
    });
  });
};

var getBreedByIdfordelete = function (id) {
  var query =
    "SELECT b.id AS breed_id, b.title AS breed_title, b.description AS breed_description,b.categoryid ,bc.title AS category_title, GROUP_CONCAT(bi.image) AS breed_images, GROUP_CONCAT(bi.id) AS id FROM breeds b JOIN breedcategory bc ON b.categoryid = bc.id LEFT JOIN breedsimages bi ON b.id = bi.breed_id WHERE b.id =? GROUP BY b.id, b.title, b.description, bc.title";

  var values = [id];

  return new Promise(function (resolve, reject) {
    db.query(query, values, function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

// breed image from breedimages table
var deletesinglebreedimagebyid = function (id) {
  var query = "Delete FROM breedsimages WHERE id=?";

  var values = [Number(id)];

  return new Promise(function (resolve, reject) {
    db.query(query, values, function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

var getbreedimagebyid = function (id) {
  var query = "Select * FROM breedsimages WHERE id=?";

  var values = [Number(id)];

  return new Promise(function (resolve, reject) {
    db.query(query, values, function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

// get breeds by category
var getBreedByCategory = function (id) {
  var query =
    "SELECT b.id AS breed_id, b.title AS breed_title, b.slug,b.description AS breed_description, bc.title AS category_title,  bc.id AS category_id, GROUP_CONCAT(bi.image SEPARATOR '|') AS breed_images FROM breeds b JOIN breedcategory bc ON b.categoryid = bc.id LEFT JOIN breedsimages bi ON b.id = bi.breed_id  GROUP BY b.id, b.title, b.description, bc.title";

  return new Promise(function (resolve, reject) {
    db.query(query, [id], function (err, result) {
      if (err) {
        reject(err);
      } else {
        var breeds = result.map(function (breed) {
          return {
            breed_id: breed.breed_id,
            breed_title: breed.breed_title,
            slug: breed.slug,
            breed_description: breed.breed_description,
            category_title: breed.category_title,
            breed_images: breed.breed_images.split("|"),
          };
        });
        resolve(breeds);
      }
    });
  });
};

// get breeds by categoryid
var getBreedByCategoryId = function (id, startIndex, limit) {
  var query =
    "SELECT b.id AS breed_id, b.title AS breed_title, b.slug, b.description AS breed_description, bc.title AS category_title, bc.id AS category_id, GROUP_CONCAT(DISTINCT bi.image SEPARATOR '|') AS breed_images, GROUP_CONCAT(DISTINCT t.name) AS tags FROM breeds b JOIN breedcategory bc ON b.categoryid = bc.id LEFT JOIN breedsimages bi ON b.id = bi.breed_id LEFT JOIN breed_tags bt ON b.id = bt.breed_id LEFT JOIN tags t ON t.id = bt.tag_id WHERE b.categoryid = ? GROUP BY b.id LIMIT ? OFFSET ?";

  var countQuery =
    "SELECT COUNT(*) as total FROM breeds b WHERE b.categoryid = ?";
  return new Promise(function (resolve, reject) {
    db.query(countQuery, [id], function (err, countResult) {
      if (err) {
        reject(err);
      } else {
        var totalRecords = countResult[0].total;
        var totalPages = Math.ceil(totalRecords / limit);

        db.query(query, [id, limit, startIndex], function (err, result) {
          if (err) {
            reject(err);
          } else {
            var breeds = result.map(function (breed) {
              return {
                breed_id: breed.breed_id,
                breed_title: breed.breed_title,
                slug: breed.slug,
                breed_description: breed.breed_description,
                category_title: breed.category_title,
                breed_images: breed.breed_images
                  ? breed.breed_images.split("|")
                  : [],
                tags: breed.tags ? breed.tags.split(",") : [],
              };
            });

            resolve({breeds: breeds, totalPages: totalPages});
          }
        });
      }
    });
  });
};

const get10BreedsByCategory = () => {
  const query = `
  SELECT 
    breed_id, breed_title, slug, lifespan, weight, height, 
    category_title, category_id, breed_images, tags
  FROM (
    SELECT  
      b.id AS breed_id,
      b.title AS breed_title,
      b.slug,
      b.lifespan, 
      b.weight,
      b.height,
      bc.title AS category_title,
      bc.id AS category_id,
      GROUP_CONCAT(DISTINCT bi.image SEPARATOR '|') AS breed_images,
      GROUP_CONCAT(DISTINCT CONCAT(t.id, ':', t.name)) AS tags,
      ROW_NUMBER() OVER (PARTITION BY bc.id ORDER BY b.id DESC) AS rn

    FROM breeds b
    JOIN breedcategory AS bc ON b.categoryid = bc.id
    LEFT JOIN breedsimages AS bi ON b.id = bi.breed_id

    LEFT JOIN breed_tags bt ON b.id = bt.breed_id
    LEFT JOIN tags t ON t.id = bt.tag_id

    GROUP BY b.id
  ) AS subquery
  WHERE rn <= 10
  ORDER BY category_id, breed_id DESC;
  `;

  return new Promise((resolve, reject) => {
    db.query(query, (err, result) => {
      if (err) {
        reject(err);
      } else {
        const breeds = result.map(row => ({
          breed_id: row.breed_id,
          breed_title: row.breed_title,
          slug: row.slug,
          breed_description: row.breed_description,
          category_title: row.category_title,
          lifespan: row.lifespan,
          weight: row.weight,
          height: row.height,
          breed_images: row.breed_images ? row.breed_images.split(",") : [],
          tags: row.tags
            ? row.tags.split(",").map(tag => {
                const [id, name] = tag.split(":");
                return {
                  id: Number(id),
                  name,
                };
              })
            : [],
        }));
        resolve(breeds);
      }
    });
  });
};

// Tags

const getSingleBreedById = slug => {
  const breedQuery = `
    SELECT
      b.id AS breed_id,
      b.title AS breed_title,
      b.slug,
      b.description AS breed_description,
      bc.title AS category_title,
      b.lifespan,
      b.weight,
      b.height,
      b.shortDescription,
      GROUP_CONCAT(DISTINCT bi.image SEPARATOR '|') AS breed_images,
      GROUP_CONCAT(DISTINCT CONCAT(t.id, ':', t.name)) AS tags,
      b.meta_title,
      b.meta_description,
      b.meta_keywords,
      b.meta_image,
      b.meta_canonical,
      b.is_indexed,
      b.og_type
    FROM breeds b
    LEFT JOIN breedsimages bi ON b.id = bi.breed_id
    JOIN breedcategory bc ON b.categoryid = bc.id
    LEFT JOIN breed_tags bt ON b.id = bt.breed_id
    LEFT JOIN tags t ON t.id = bt.tag_id
    WHERE b.slug = ?
    GROUP BY b.id
    LIMIT 1
  `;

  const qaQuery = `
    SELECT 
      id,
      question,
      answer,
      extra
    FROM \`breedsq&a\`
    WHERE breed_id = ?
    ORDER BY id ASC
  `;

  return new Promise((resolve, reject) => {
    db.query(breedQuery, [slug], (err, result) => {
      if (err) return reject(err);

      if (!result || result.length === 0) {
        return resolve(null);
      }

      const breedData = result[0];

      const breed = {
        breed_id: breedData.breed_id,
        breed_title: breedData.breed_title,
        slug: breedData.slug,
        breed_description: breedData.breed_description,
        category_title: breedData.category_title,
        lifespan: breedData.lifespan,
        weight: breedData.weight,
        height: breedData.height,
        shortDescription: breedData.shortDescription,

        breed_images: breedData.breed_images
          ? breedData.breed_images.split("|")
          : [],
        meta_title: breedData.meta_title,
        meta_description: breedData.meta_description,
        meta_keywords: breedData.meta_keywords,
        meta_image: breedData.meta_image,
        meta_canonical: breedData.meta_canonical,
        is_indexed: breedData.is_indexed,
        og_type: breedData.og_type,
        tags: breedData.tags
          ? breedData.tags.split(",").map(tag => {
              const [id, name] = tag.split(":");
              return {
                id: Number(id),
                name,
              };
            })
          : [],
        qa: [],
      };

      // ✅ Fetch QA separately
      db.query(qaQuery, [breed.breed_id], (qaErr, qaResult) => {
        if (qaErr) return reject(qaErr);

        breed.qa = qaResult.map(q => ({
          id: q.id,
          question: q.question,
          answer: q.answer,
          extra: q.extra,
        }));

        resolve(breed);
      });
    });
  });
};

// var addBreedTags = function (tags) {
//   return new Promise((resolve, reject) => {
//     if (!tags) return reject("Tags required");

//     if (typeof tags === "string") {
//       tags = tags.split(",").map(t => t.trim());
//     }

//     if (!Array.isArray(tags) || tags.length === 0) {
//       return reject("Invalid tags");
//     }

//     tags = [...new Set(tags)];

//     const values = tags.map(tag => [tag]);

//     const query = "INSERT IGNORE INTO tags (name) VALUES ?";

//     db.query(query, [values], (err, result) => {
//       if (err) return reject(err);
//       resolve(result);
//     });
//   });
// };

var addBreedTags = function (tags) {
  return new Promise((resolve, reject) => {
    if (!tags) return reject(new Error("Tags required"));

    // Convert string → array
    if (typeof tags === "string") {
      tags = tags.split(",").map(t => t.trim());
    }

    // Validate
    if (!Array.isArray(tags) || tags.length === 0) {
      return reject(new Error("Invalid tags"));
    }

    // Remove duplicates from request
    tags = [...new Set(tags.map(t => t.trim()).filter(Boolean))];

    // Check existing tags
    const checkQuery = "SELECT name FROM tags WHERE name IN (?)";

    db.query(checkQuery, [tags], (err, existingRows) => {
      if (err) return reject(err);

      const existingTags = existingRows.map(row => row.name);

      const newTags = tags.filter(tag => !existingTags.includes(tag));

      // If all already exist
      if (newTags.length === 0) {
        return resolve({
          inserted: [],
          existing: existingTags,
          message: "All tags already exist",
        });
      }

      const values = newTags.map(tag => [tag]);

      const insertQuery = "INSERT INTO tags (name) VALUES ?";

      db.query(insertQuery, [values], (err, result) => {
        if (err) return reject(err);

        resolve({
          inserted: newTags,
          existing: existingTags,
          affectedRows: result.affectedRows,
          message: "New tags added successfully",
        });
      });
    });
  });
};

const getTagByName = name => {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM tags WHERE name = ?", [name], (err, result) => {
      if (err) reject(err);
      else resolve(result[0]);
    });
  });
};

const createTag = name => {
  return new Promise((resolve, reject) => {
    db.query("INSERT INTO tags (name) VALUES (?)", [name], (err, result) => {
      if (err) reject(err);
      else resolve(result.insertId);
    });
  });
};

const insertBreedTags = (breedId, tagIds) => {
  return new Promise((resolve, reject) => {
    const values = tagIds.map(tagId => [breedId, tagId]);

    db.query(
      "INSERT INTO breed_tags (breed_id, tag_id) VALUES ?",
      [values],
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      },
    );
  });
};

const insertBreedImages = (breedId, images) => {
  return new Promise((resolve, reject) => {
    const values = images.map(img => [img, breedId]);

    db.query(
      "INSERT INTO breedsimages (image, breed_id) VALUES ?",
      [values],
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      },
    );
  });
};

const createBreedOnly = (
  title,
  slug,
  description,
  categoryid,
  lifespan,
  weight,
  height,
  shortDescription,
) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO breeds 
      (title, slug, description, categoryid, lifespan, weight, height, shortDescription)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      query,
      [
        title,
        slug,
        description,
        categoryid,
        lifespan,
        weight,
        height,
        shortDescription,
      ],
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      },
    );
  });
};

const checkTagExists = id => {
  return new Promise((resolve, reject) => {
    db.query("SELECT id FROM tags WHERE id = ?", [id], (err, result) => {
      if (err) reject(err);
      else resolve(result.length > 0);
    });
  });
};

var getAllTags = function () {
  var query = "SELECT * FROM tags";
  return new Promise(function (resolve, reject) {
    db.query(query, function (err, result) {
      if (err) {
        console.error("Error fetching tags:", err);
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};
module.exports = {
  showBreedsCategory: showBreedsCategory,
  insertBreedWithImage: insertBreedWithImage,
  showBreeds: showBreeds,
  showBreedsByAlphabet: showBreedsByAlphabet,
  searchBreedsByTitle: searchBreedsByTitle,
  updateBreedWithImage: updateBreedWithImage,
  deleteBreed: deleteBreed,
  getBreedById: getBreedById,
  deletesinglebreedimagebyid: deletesinglebreedimagebyid,
  getBreedByCategory: getBreedByCategory,
  get10BreedsByCategory: get10BreedsByCategory,
  getBreedByCategoryId: getBreedByCategoryId,
  getBreedByIdfordelete: getBreedByIdfordelete,
  getbreedimagebyid: getbreedimagebyid,
  getSingleBreedById,
  addBreedTags,
  getAllTags,
  searchBreeds,
  getTagByName,
  createTag,
  createBreedOnly,
  checkTagExists,
  insertBreedTags,
  insertBreedImages,
};
