var db = require("../../config/DatabaseConnection.js");

var getArticles = function (page, limit) {
  var offset = (page - 1) * limit;
  var query = `SELECT a.id, a.title ,a.slug, a.description , a.image ,c.categoryName FROM articles a JOIN articlecategory c ON a.categoryid = c.categoryid LIMIT ${limit} OFFSET ${offset}`;
  return new Promise(function (resolve, reject) {
    db.query(query, function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

var getTotalArticles = function () {
  var query = `SELECT COUNT(*) as total FROM articles`;
  return new Promise(function (resolve, reject) {
    db.query(query, function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result[0].total);
      }
    });
  });
};

var getArticlesInProfile = async function (id, imageUrl) {
  var query =
    "SELECT a.id, a.title , a.description , a.image ,c.categoryName FROM articles a JOIN articlecategory c ON a.categoryid = c.categoryid WHERE a.id =? ";

  var values = [id, imageUrl];

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

var getCategories = function (callback) {
  var query = "SELECT * FROM articlecategory ";
  db.query(query, function (err, result) {
    if (err) return callback(err, null);
    return callback(null, result);
  });
};

var checkCategoryExists = function (categoryid) {
  return new Promise(function (resolve, reject) {
    var sql = "SELECT * FROM articlecategory WHERE categoryid = ?";
    db.query(sql, [categoryid], function (err, result) {
      if (err) {
        console.error("Database query error:", err);
        reject(err);
      } else {
        resolve(result.length > 0);
      }
    });
  });
};

var getArticlebyCategory = function (categoryid) {
  return new Promise(function (resolve, reject) {
    var sql = `SELECT articles.title,articles.slug,articles.description, articles.image, articles.categoryid,  articlecategory.categoryName FROM articles JOIN articlecategory ON articles.categoryid = articlecategory.categoryid WHERE articles.categoryid =${categoryid}  `;
    db.query(sql, [categoryid], function (err, result) {
      if (err) {
        console.error("Database query error:", err);
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

// var addArticle = function (
//   title,
//   slug,
//   description,
//   imageUrl,
//   categoryid,
//   userid
// ) {
//   var query =
//     "INSERT INTO `articles`(`title`,`slug`, `description`, `image`, `categoryid`, `userid`) VALUES (?,?,?,?,?,?)";
//   return new Promise(function (resolve, reject) {
//     db.query(
//       query,
//       [title, slug, description, imageUrl, categoryid, userid],
//       function (err, result) {
//         if (err) {
//           console.error(err);
//           reject(err);
//         } else {
//           console.log(result);
//           resolve(result);
//         }
//       }
//     );
//   });
// };
var addArticleTags = function (tags) {
  // here tags is an array of tags strings
  console.log("Model tags", tags);
  var values = tags.map((tag) => [tag]);
  var query = "INSERT INTO `tags`(`name`) VALUES ?";
  return new Promise(function (resolve, reject) {
    db.query(query, [values], function (err, result) {
      if (err) {
        console.error("Error inserting tags:", err);
        reject(err);
      } else {
        console.log("Tags inserted successfully");
        resolve(result);
      }
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

var addArticle = function (
  title,
  slug,
  description,
  imageUrl,
  categoryid,
  userid,
  tags
) {
  return new Promise(function (resolve, reject) {
    db.beginTransaction(function (err) {
      if (err) return reject(err);

      // ✅ FIX TAGS FIRST
      if (typeof tags === "string") {
        tags = tags.split(",").map((t) => Number(t.trim()));
      }

      if (!Array.isArray(tags)) {
        tags = [];
      }

      tags = tags.map((t) => Number(t)).filter(Boolean);

      // Check if slug already exists
      var checkSlugQuery =
        "SELECT COUNT(*) AS count FROM articles WHERE slug = ?";

      db.query(checkSlugQuery, [slug], function (err, result) {
        if (err) {
          return db.rollback(() => reject(err));
        }

        var count = result[0].count;
        var finalSlug = count > 0 ? slug + "-" + Date.now() : slug;

        var insertArticleQuery = `
          INSERT INTO articles
          (title, slug, description, image, categoryid, userid)
          VALUES (?,?,?,?,?,?)
        `;

        db.query(
          insertArticleQuery,
          [title, finalSlug, description, imageUrl, categoryid, userid],
          function (err, result) {
            if (err) {
              return db.rollback(() => reject(err));
            }

            var articleId = result.insertId;

            // ✅ If no tags, commit directly
            if (tags.length === 0) {
              return db.commit((err) => {
                if (err) return db.rollback(() => reject(err));
                resolve({ articleId });
              });
            }

            // ✅ Insert tags
            var insertTagsQuery =
              "INSERT INTO article_tags (article_id, tag_id) VALUES ?";

            var tagData = tags.map((tagId) => [articleId, tagId]);

            db.query(insertTagsQuery, [tagData], function (err) {
              if (err) {
                return db.rollback(() => reject(err));
              }

              db.commit(function (err) {
                if (err) {
                  return db.rollback(() => reject(err));
                }

                resolve({ articleId });
              });
            });
          }
        );
      });
    });
  });
};

// var getArticleById = async function (id, imageUrl) {
//   var query =
//     "SELECT id, title,slug , description , image ,categoryid FROM articles WHERE id=?";

//   var values = [id, imageUrl];

//   return new Promise(function (resolve, reject) {
//     db.query(query, values, function (err, result) {
//       if (err) {
//         reject(err);
//       } else {
//         resolve(result);
//       }
//     });
//   });
// };

var getArticleById = async function (id) {
  var query = `
    SELECT 
      a.id,
      a.title,
      a.slug,
      a.description,
      a.image,
      a.categoryid,
      t.id AS tag_id,
      t.name AS tag_name
    FROM articles a
    LEFT JOIN article_tags at ON a.id = at.article_id
    LEFT JOIN tags t ON at.tag_id = t.id
    WHERE a.id = ?;
  `;

  return new Promise(function (resolve, reject) {
    db.query(query, [id], function (err, result) {
      if (err) reject(err);
      else resolve(result);
    });
  });
};


var getArticleByIdfordelete = async function (id) {
  var query =
    "SELECT id, title , description , image ,categoryid FROM articles WHERE id=?";

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

// var updateArticle = async function (
//   id,
//   title,
//   description,
//   imageUrl,
//   categoryid
// ) {
//   var query;
//   var values;

//   if (imageUrl) {
//     query =
//       "UPDATE `articles` SET title=? , description=? , image=? , categoryid=? WHERE id=?";
//     values = [title, description, imageUrl, categoryid, id];
//   } else {
//     query =
//       "UPDATE `articles` SET title=? , description=? ,  categoryid=? WHERE id=?";
//     values = [title, description, categoryid, id];
//   }

//   return new Promise(function (resolve, reject) {
//     db.query(query, values, function (err, result) {
//       if (err) {
//         reject("Error updating article: " + err.message);
//       } else {
//         resolve(result);
//       }
//     });
//   });
// };

var updateArticle = async function (
  id,
  title,
  description,
  imageUrl,
  categoryid,
  tags = []
) {
  return new Promise((resolve, reject) => {
    let query;
    let values;

    if (imageUrl) {
      query =
        "UPDATE articles SET title=?, description=?, image=?, categoryid=? WHERE id=?";
      values = [title, description, imageUrl, categoryid, id];
    } else {
      query =
        "UPDATE articles SET title=?, description=?, categoryid=? WHERE id=?";
      values = [title, description, categoryid, id];
    }

    db.query(query, values, async (err) => {
      if (err) return reject("Error updating article: " + err.message);

      try {
        // *** FIX 1 — convert tags to integers ***
        tags = tags.map(t => Number(t));

        // 1. Get current tags
        const currentTags = await new Promise((res, rej) => {
          db.query(
            "SELECT tag_id FROM article_tags WHERE article_id=?",
            [id],
            (err, rows) => {
              if (err) rej(err);
              else res(rows.map(r => Number(r.tag_id))); // FIX 2 — number convert
            }
          );
        });

        // 2. Compare properly
        const tagsToAdd = tags.filter(tag => !currentTags.includes(tag));
        const tagsToRemove = currentTags.filter(tag => !tags.includes(tag));

        // 3. Insert new tags
        if (tagsToAdd.length > 0) {
          const insertValues = tagsToAdd.map(tag => [id, tag]);
          await new Promise((res, rej) =>
            db.query(
              "INSERT INTO article_tags (article_id, tag_id) VALUES ?",
              [insertValues],
              (err) => (err ? rej(err) : res())
            )
          );
        }

        // 4. Delete removed tags
        if (tagsToRemove.length > 0) {
          await new Promise((res, rej) =>
            db.query(
              "DELETE FROM article_tags WHERE article_id=? AND tag_id IN (?)",
              [id, tagsToRemove],
              (err) => (err ? rej(err) : res())
            )
          );
        }

        resolve({ message: "Article updated and tags synced" });

      } catch (error) {
        reject("Error updating tags: " + error.message);
      }
    });
  });
};


var deleteArticle = async function (id) {
  var query = "DELETE FROM `articles` WHERE id=?";

  return new Promise(function (resolve, reject) {
    db.query(query, [id], function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

var get10Articles = function (callback) {
  var query = `WITH RankedArticles AS (
    SELECT
        a.id,
        a.title,
        a.slug,
        CONCAT(LEFT(a.description, 150), '...') AS description,
        a.image,
        c.categoryName,
        ROW_NUMBER() OVER (ORDER BY a.id DESC) AS RowNum
    FROM
        articles a
    JOIN articlecategory c ON a.categoryid = c.categoryid
)
SELECT
    id,
    title,
    slug,
    description,
    image,
    categoryName
FROM
    RankedArticles
WHERE
    RowNum <= 10;
`;
  db.query(query, function (err, result) {
    if (err) return callback(err, null);
    return callback(null, result);
  });
};

// Search api for articles search by title
var searchArticle = (title) => {
  var query =
    "SELECT a.id, a.title,a.slug , a.description , a.image ,c.categoryName FROM articles a JOIN articlecategory c ON a.categoryid = c.categoryid WHERE a.title LIKE ?";
  var titleParam = "%" + title + "%";

  return new Promise(function (resolve, reject) {
    db.query(query, titleParam, function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

// check slug exists
var checkSlugExists = function (slug) {
  return new Promise(function (resolve, reject) {
    var sql = "SELECT * FROM articles WHERE slug = ?";
    db.query(sql, [slug], function (err, result) {
      if (err) {
        console.error("Database query error:", err);
        reject(err);
      } else {
        resolve(result.length > 0);
      }
    });
  });
};

const getSingleArticleById = (slug) => {
  
  return new Promise((resolve, reject) => {
    var query = `SELECT a.id, a.title,a.slug , a.description , a.image ,c.categoryName,a.meta_title,a.meta_description FROM articles a JOIN articlecategory c ON a.categoryid = c.categoryid WHERE a.slug = ?`;
    db.query(query, [slug], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

module.exports = {
  getArticles: getArticles,
  addArticle: addArticle,
  checkCategoryExists: checkCategoryExists,
  getCategories: getCategories,
  deleteArticle: deleteArticle,
  getArticleById: getArticleById,
  updateArticle: updateArticle,
  getArticlesInProfile: getArticlesInProfile,
  getArticlebyCategory: getArticlebyCategory,
  get10Articles: get10Articles,
  getArticleByIdfordelete: getArticleByIdfordelete,
  getTotalArticles: getTotalArticles,
  searchArticle: searchArticle,
  getSingleArticleById: getSingleArticleById,
  checkSlugExists: checkSlugExists,
  addArticleTags: addArticleTags,
  getAllTags: getAllTags,
};
