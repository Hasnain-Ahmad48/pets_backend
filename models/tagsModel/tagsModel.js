const db = require("../../config/DatabaseConnection.js");

const createtags = (name, userId) => {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT id FROM tags WHERE name=? AND user_id=?",
      [name, userId],
      (err, rows) => {
        if (err) return reject(err);

        if (rows.length > 0) {
          return resolve({alreadyExists: true});
        }

        db.query(
          "INSERT INTO tags (name,user_id) VALUES (?,?)",
          [name, userId],
          (err, result) => {
            if (err) return reject(err);

            resolve({
              id: result,

              name,
            });
          },
        );
      },
    );
  });
};

const updateTag = (tagId, name,
   userId
  ) => {
  return new Promise((resolve, reject) => {
    // Check if new name already exists
    db.query(
      "SELECT id FROM tags WHERE name = ? AND user_id = ? AND id != ?",
      [name, userId, tagId],
      (err, rows) => {
        if (err) return reject(err);

        if (rows.length > 0) {
          return resolve({alreadyExists: true});
        }

        // Update
        db.query(
          "UPDATE tags SET name = ? WHERE id = ? AND user_id = ?",
          [name, tagId, userId],
          (err, result) => {
            if (err) return reject(err);

            if (result.affectedRows === 0) {
              return resolve({notFound: true});
            }

            resolve({success: true});
          },
        );
      },
    );
  });
};

const getTags = () => {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM tags ORDER BY id DESC", (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

const deleteTag = (tagId, userId) => {
  return new Promise((resolve, reject) => {
    db.query(
      "DELETE FROM tags WHERE id = ? AND user_id = ?",
      [tagId, userId],
      (err, result) => {
        if (err) return reject(err);

        if (result.affectedRows === 0) {
          return resolve({notFound: true});
        }

        resolve({success: true});
      },
    );
  });
};

module.exports = {
  createtags,
  getTags,
  updateTag,
  deleteTag,
};
