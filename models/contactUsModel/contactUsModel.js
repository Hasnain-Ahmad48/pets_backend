const db = require("../../config/DatabaseConnection");

// create contactUs page
const createContactUs = (
  contact_category_id,
  contact_reason_id,
  message,
  FirstName,
  LastName,
  Address1,
  Address2,
  city,
  state,
  zipCode,
  email,
  emailRequestFeedback,
  callRequestFeedback,
  receiveEmailMarketing,
  ticketNo,
  status
) => {
  return new Promise((resolve, reject) => {
    const query =
      "INSERT INTO contact_us (contact_category_id ,contact_reason_id,message,FirstName,LastName,Address1,Address2,city,state,zipCode,email,emailRequestFeedback,callRequestFeedback ,receiveEmailMarketing ,ticketNo,status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
    const values = [
      contact_category_id,
      contact_reason_id,
      message,
      FirstName,
      LastName,
      Address1,
      Address2,
      city,
      state,
      zipCode,
      email,
      emailRequestFeedback,
      callRequestFeedback,
      receiveEmailMarketing,
      ticketNo,
      status,
    ];
    db.query(query, values, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

// get contact us
const getContactus = () => {
  return new Promise((resolve, reject) => {
    const query = `SELECT con.* , category.title AS category_title, reason.title AS reason_title FROM contact_us AS con JOIN contact_us_category AS category ON con.contact_category_id = category.contact_us_category_id JOIN contact_us_reason AS reason ON con.contact_reason_id = reason.contact_us_reason_id `;
    db.query(query, (err, result) => {
      if (err) {
        reject(err);
      }
      resolve(result);
    });
  });
};

// delete contact us
const deleteContactus = (id) => {
  return new Promise((resolve, reject) => {
    const query = `DELETE FROM contact_us WHERE id = ?`;
    db.query(query, id, (err, result) => {
      if (err) {
        reject(err);
      }
      resolve(result);
    });
  });
};

// Contact Us Category

// create Contact Us Category
const createContactUsCategory = (title) => {
  return new Promise((resolve, reject) => {
    const query = `INSERT INTO contact_us_category (title) VALUES (?)`;
    db.query(query, title, (err, result) => {
      if (err) {
        reject(err);
      }
      resolve(result);
    });
  });
};

// get Contact us category
const getContactUsCategory = () => {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM contact_us_category `;
    db.query(query, (err, result) => {
      if (err) {
        reject(err);
      }
      resolve(result);
    });
  });
};

// Contact Us Reason

// create Contact Us Reason
const createContactUsReason = (title) => {
  return new Promise((resolve, reject) => {
    const query = `INSERT INTO contact_us_reason (title) VALUES (?)`;
    db.query(query, title, (err, result) => {
      if (err) {
        reject(err);
      }
      resolve(result);
    });
  });
};

//get Contact Us Reason
const getContactUsReason = () => {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM  contact_us_reason`;
    db.query(query, (err, result) => {
      if (err) {
        reject(err);
      }
      resolve(result);
    });
  });
};

module.exports = {
  createContactUs,
  getContactus,
  deleteContactus,
  createContactUsCategory,
  getContactUsCategory,
  createContactUsReason,
  getContactUsReason,
};
