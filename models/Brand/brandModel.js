var db = require("../../config/DatabaseConnection.js");

// Create brand
exports.createBrand = (data) => {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO brands (name, slug, description, logo, website, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
      sql,
      [data.name, data.slug, data.description, data.logo, data.website, data.status],
      (err, result) => {
        if (err) return reject(err);
        resolve({ id: result.insertId, ...data });
      }
    );
  });
};

// Get all brands
exports.getAllBrands = () => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM brands ORDER BY id DESC";
    db.query(sql, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

// Get brand by id
exports.getBrandById = (id) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM brands WHERE id = ?";
    db.query(sql, [id], (err, result) => {
      if (err) return reject(err);
      resolve(result[0]);
    });
  });
};

// Update brand
exports.updateBrand = (id, data) => {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE brands
      SET name=?, slug=?, description=?, logo=?, website=?, status=?
      WHERE id=?
    `;

    db.query(
      sql,
      [data.name, data.slug, data.description, data.logo, data.website, data.status, id],
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
};

// Delete brand
exports.deleteBrand = (id) => {
  return new Promise((resolve, reject) => {
    const sql = "DELETE FROM brands WHERE id=?";
    db.query(sql, [id], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};


//helper function to get brand by slug
// Get brand by slug
exports.getBrandBySlug = (slug) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM brands WHERE slug = ?";
    db.query(sql, [slug], (err, result) => {
      if (err) return reject(err);
      resolve(result[0]);
    });
  });
};


// Search brand by id
exports.searchBrandById = (id) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM brands WHERE id = ?";
    db.query(sql, [id], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};