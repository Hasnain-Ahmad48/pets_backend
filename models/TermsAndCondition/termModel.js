const db = require("../../config/DatabaseConnection");

// create privacy model
const createTerms = (title, description) => {
  return new Promise((resolve, reject) => {
    const query = `INSERT INTO term_and_condition ( title, description) VALUES (?, ?)`;
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
const getTerms = () => {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM term_and_condition`;
    db.query(query, (err, result) => {
      if (err) {
        reject(err);
      }
      resolve(result);
    });
  });
};

// get privacy by id
const getTermsbyid = (id) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM term_and_condition WHERE termid = ?`;
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
const updateterms = (title, description, id) => {
  return new Promise((resolve, reject) => {
    const query = `UPDATE term_and_condition SET title = ?, description = ? WHERE termid = ?`;
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
const deleteTerms = (id) => {
  return new Promise((resolve, reject) => {
    const query = `DELETE  FROM term_and_condition WHERE termid = ?`;
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
  createTerms,
  getTerms,
  getTermsbyid,
  updateterms,
  deleteTerms,
};
