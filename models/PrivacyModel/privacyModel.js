const db = require("../../config/DatabaseConnection");

// create privacy model
const createPrivacy = (title, description) => {
  return new Promise((resolve, reject) => {
    const query = `INSERT INTO privacy ( title, description) VALUES (?, ?)`;
    const value = [title, description];
    db.query(query, value, (err, result) => {
      if (err) {
        reject(err);
      }
      resolve(result);
    });
  });
};

// get privacy model
const getPrivacy = () => {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM privacy`;
    db.query(query, (err, result) => {
      if (err) {
        reject(err);
      }
      resolve(result);
    });
  });
};

// get privacy by id
const getPrivacybyid = (id) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM privacy WHERE privacyid = ?`;
    const value = [id];
    db.query(query, value, (err, result) => {
      if (err) {
        reject(err);
      }
      resolve(result);
    });
  });
};

// update privacy model
const updatePrivacy = (title, description, id) => {
  return new Promise((resolve, reject) => {
    const query = `UPDATE privacy SET title = ?, description = ? WHERE privacyid = ?`;
    const value = [title, description, id];
    db.query(query, value, (err, result) => {
      if (err) {
        reject(err);
      }
      resolve(result);
    });
  });
};

// delete privacy
const deletePrivacy = (id) => {
  return new Promise((resolve, reject) => {
    const query = `DELETE  FROM privacy WHERE privacyid = ?`;
    const value = [id];
    db.query(query, value, (err, result) => {
      if (err) {
        reject(err);
      }
      resolve(result);
    });
  });
};

module.exports = {
  createPrivacy,
  getPrivacy,
  updatePrivacy,
  getPrivacybyid,
  deletePrivacy,
};
