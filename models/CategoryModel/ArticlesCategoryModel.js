var db = require("../../config/DatabaseConnection.js");

var getArticles = function (page, limit) {
  var offset = (page - 1) * limit;

  var query = `
    SELECT
      a.id,
      a.title,
      a.slug,
      a.description,
      a.image,
      c.categoryName,
      GROUP_CONCAT(t.name) AS tag_names
    FROM articles a
    JOIN articlecategory c 
      ON a.categoryid = c.categoryid
    LEFT JOIN article_tags at 
      ON a.id = at.article_id
    LEFT JOIN tags t 
      ON at.tag_id = t.id
    GROUP BY a.id
    ORDER BY a.id DESC
    LIMIT ? OFFSET ?
  `;

  return new Promise(function (resolve, reject) {
    db.query(query, [limit, offset], function (err, result) {
      if (err) {
        reject(err);
      } else {
        const formatted = result.map((article) => ({
          ...article,
          tags: {
            id: article.id,
            names: article.tag_names ? article.tag_names.split(",") : [],
          },
        }));

        // remove raw SQL field
        const cleaned = formatted.map(({ tag_names, ...rest }) => rest);

        resolve(cleaned);
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
  tags = [],
  qa = []
) {
  return new Promise(function (resolve, reject) {
    db.beginTransaction(function (err) {
      if (err) return reject(err);

      var checkSlugQuery =
        "SELECT COUNT(*) AS count FROM articles WHERE slug = ?";

      db.query(checkSlugQuery, [slug], function (err, result) {
        if (err) {
          return db.rollback(() => reject(err));
        }

        var finalSlug = slug;
        if (result[0].count > 0) {
          finalSlug = slug + "-" + Date.now();
        }

        var insertArticleQuery =
          "INSERT INTO articles (title, slug, description, image, categoryid, userid) VALUES (?,?,?,?,?,?)";

        db.query(
          insertArticleQuery,
          [title, finalSlug, description, imageUrl, categoryid, userid],
          function (err, result) {
            if (err) {
              return db.rollback(() => reject(err));
            }

            var articleId = result.insertId;

            const saveTags = () => {
              if (!Array.isArray(tags) || tags.length === 0) {
                return saveQA();
              }

              const tagData = tags.map((tagId) => [
                articleId,
                Number(tagId),
              ]);

              db.query(
                "INSERT INTO article_tags (article_id, tag_id) VALUES ?",
                [tagData],
                function (err) {
                  if (err) {
                    return db.rollback(() => reject(err));
                  }
                  saveQA();
                }
              );
            };

            const saveQA = () => {
              if (!Array.isArray(qa) || qa.length === 0) {
                return db.commit((err) => {
                  if (err) return db.rollback(() => reject(err));
                  resolve({ articleId });
                });
              }

              const qaValues = qa.map((item) => [
                item.question || "",
                item.answer || "",
                item.extra || "",
                articleId,
              ]);

              db.query(
                "INSERT INTO article_qa (question, answer, extra, article_id) VALUES ?",
                [qaValues],
                function (err) {
                  if (err) {
                    return db.rollback(() => reject(err));
                  }

                  db.commit((err) => {
                    if (err) return db.rollback(() => reject(err));
                    resolve({ articleId });
                  });
                }
              );
            };

            saveTags();
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
  tags = [],
  qa = []
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
        // ================= TAGS =================
        tags = tags.map(t => Number(t));

        const currentTags = await new Promise((res, rej) => {
          db.query(
            "SELECT tag_id FROM article_tags WHERE article_id=?",
            [id],
            (err, rows) => {
              if (err) rej(err);
              else res(rows.map(r => Number(r.tag_id)));
            }
          );
        });

        const tagsToAdd = tags.filter(tag => !currentTags.includes(tag));
        const tagsToRemove = currentTags.filter(tag => !tags.includes(tag));

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

        if (tagsToRemove.length > 0) {
          await new Promise((res, rej) =>
            db.query(
              "DELETE FROM article_tags WHERE article_id=? AND tag_id IN (?)",
              [id, tagsToRemove],
              (err) => (err ? rej(err) : res())
            )
          );
        }

        // ================= QA =================
        // Get existing QA
        const existingQA = await new Promise((res, rej) => {
          db.query(
            "SELECT id FROM article_qa WHERE article_id=?",
            [id],
            (err, rows) => {
              if (err) rej(err);
              else res(rows.map(r => r.id));
            }
          );
        });

        const incomingQAIds = qa
          .filter(q => q.id)
          .map(q => Number(q.id));

        const qaToDelete = existingQA.filter(qId => !incomingQAIds.includes(qId));

        // DELETE removed QA
        if (qaToDelete.length > 0) {
          await new Promise((res, rej) =>
            db.query(
              "DELETE FROM article_qa WHERE id IN (?)",
              [qaToDelete],
              (err) => (err ? rej(err) : res())
            )
          );
        }

        // INSERT / UPDATE QA
        for (let q of qa) {
          if (q.id) {
            // UPDATE
            await new Promise((res, rej) =>
              db.query(
                "UPDATE article_qa SET question=?, answer=?, extra=? WHERE id=?",
                [q.question, q.answer, q.extra || null, q.id],
                (err) => (err ? rej(err) : res())
              )
            );
          } else {
            // INSERT
            await new Promise((res, rej) =>
              db.query(
                "INSERT INTO article_qa (question, answer, extra, article_id) VALUES (?, ?, ?, ?)",
                [q.question, q.answer, q.extra || null, id],
                (err) => (err ? rej(err) : res())
              )
            );
          }
        }

        resolve({
          message: "Article, tags, and QA updated successfully",
        });

      } catch (error) {
        reject("Error updating article data: " + error.message);
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
  var query = `
    WITH RankedArticles AS (
      SELECT
          a.id,
          a.title,
          a.slug,
          CONCAT(LEFT(a.description, 150), '...') AS description,
          a.image,
          c.categoryName,
          GROUP_CONCAT(t.name) AS tags,
          ROW_NUMBER() OVER (ORDER BY a.id DESC) AS RowNum
      FROM articles a
      JOIN articlecategory c 
          ON a.categoryid = c.categoryid
      LEFT JOIN article_tags at 
          ON a.id = at.article_id
      LEFT JOIN tags t 
          ON at.tag_id = t.id
      GROUP BY a.id
    )
    SELECT
        id,
        title,
        slug,
        description,
        image,
        categoryName,
        tags
    FROM RankedArticles
    WHERE RowNum <= 10;
  `;

  db.query(query, function (err, result) {
    if (err) return callback(err, null);

    // ✅ convert comma string into array
    const formatted = result.map(article => ({
      ...article,
      tags: article.tags ? article.tags.split(",") : [],
    }));

    return callback(null, formatted);
  });
};

// Search api for articles search by title
var searchArticle = (title) => {
  var query = `
    SELECT 
      a.id,
      a.title,
      a.slug,
      a.description,
      a.image,
      c.categoryName,
      t.id AS tag_id,
      t.name AS tag_name
    FROM articles a
    JOIN articlecategory c 
      ON a.categoryid = c.categoryid
    LEFT JOIN article_tags at 
      ON a.id = at.article_id
    LEFT JOIN tags t 
      ON at.tag_id = t.id
    WHERE a.title LIKE ?
    ORDER BY a.id DESC
  `;

  var titleParam = "%" + title + "%";

  return new Promise(function (resolve, reject) {
    db.query(query, [titleParam], function (err, rows) {
      if (err) {
        reject(err);
      } else {
        const articlesMap = {};

        rows.forEach((row) => {
          if (!articlesMap[row.id]) {
            articlesMap[row.id] = {
              id: row.id,
              title: row.title,
              slug: row.slug,
              description: row.description,
              image: row.image,
              categoryName: row.categoryName,
              tags: [],
            };
          }

          if (row.tag_id) {
            articlesMap[row.id].tags.push({
              id: row.tag_id,
              name: row.tag_name,
            });
          }
        });

        resolve(Object.values(articlesMap));
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
    const articleQuery = `
      SELECT 
        a.id,
        a.title,
        a.slug,
        a.description,
        a.image,
        c.categoryName,
        a.meta_title,
        a.meta_description
      FROM articles a
      JOIN articlecategory c
        ON a.categoryid = c.categoryid
      WHERE a.slug = ?
    `;

    db.query(articleQuery, [slug], (err, articleRows) => {
      if (err) return reject(err);
      if (!articleRows.length) return resolve([]);

      const article = {
        ...articleRows[0],
        tags: [],
        qa: [],
      };

      const articleId = article.id;

      const tagQuery = `
        SELECT t.id, t.name
        FROM article_tags at
        JOIN tags t ON at.tag_id = t.id
        WHERE at.article_id = ?
      `;

      const qaQuery = `
        SELECT id, question, answer, extra
        FROM article_qa
        WHERE article_id = ?
      `;

      db.query(tagQuery, [articleId], (err, tagRows) => {
        if (err) return reject(err);

        article.tags = tagRows || [];

        db.query(qaQuery, [articleId], (err, qaRows) => {
          if (err) return reject(err);

          article.qa = qaRows || [];

          resolve(article);
        });
      });
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
