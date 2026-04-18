// const db = require("../../config/DatabaseConnection.js");

// /**
//  * Fetches entities related by tags, sorted by relevance (match count).
//  * @param {string} tableName - The target entity table (e.g., 'pets').
//  * @param {string} bridgeTable - The tag mapping table (e.g., 'pet_tags').
//  * @param {string} idColumn - Primary key of the entity table.
//  * @param {string} bridgeIdColumn - Foreign key in the bridge table.
//  * @param {Array} tagIds - Array of tag IDs to match.
//  * @param {number} limit - Number of results to return.
//  */
// const getRelatedEntities = (tableName, bridgeTable, idColumn, bridgeIdColumn, tagIds, limit) => {
//   return new Promise((resolve, reject) => {
//     // We use a subquery to count tag matches first to ensure efficiency and 
//     // compatibility with strict MySQL GROUP BY modes.
//     const query = `
//       SELECT e.*, relevance_count.tag_match_count
//       FROM ${tableName} e
//       INNER JOIN (
//         SELECT ${bridgeIdColumn}, COUNT(tag_id) AS tag_match_count
//         FROM ${bridgeTable}
//         WHERE tag_id IN (?)
//         GROUP BY ${bridgeIdColumn}
//       ) relevance_count ON e.${idColumn} = relevance_count.${bridgeIdColumn}
//       ORDER BY relevance_count.tag_match_count DESC
//       LIMIT ?
//     `;

//     db.query(query, [tagIds, limit], (err, results) => {
//       if (err) {
//         console.error(`Error fetching related ${tableName}:`, err);
//         return reject(err);
//       }
//       resolve(results);
//     });
//   });
// };

// module.exports = {
//   getRelatedEntities,
// };



const db = require("../../config/DatabaseConnection.js");

// Central config (SAFE)
const ENTITY_CONFIG = {
  product: {
    table: "mk_products",
    tagTable: "mk_product_tags",
    id: "id",
    tagForeignKey: "product_id",
  },
  pet: {
    table: "pets",
    tagTable: "pet_tags",
    id: "pet_id",
    tagForeignKey: "pet_id",
  },
  breed: {
    table: "breeds",
    tagTable: "breed_tags",
    id: "id",
    tagForeignKey: "breed_id",
  },
  article: {
    table: "articles",
    tagTable: "article_tags",
    id: "id",
    tagForeignKey: "article_id",
  },
};

// 1. Get tags of current entity
const getTagsByEntity = (type, id) => {
  return new Promise((resolve, reject) => {
    const config = ENTITY_CONFIG[type];

    const query = `
      SELECT tag_id
      FROM ${config.tagTable}
      WHERE ${config.tagForeignKey} = ?
    `;

    db.query(query, [id], (err, results) => {
      if (err) return reject(err);

      const tagIds = results.map(r => r.tag_id);
      resolve(tagIds);
    });
  });
};

// 2. Get related entities
const getRelatedEntities = (type, tagIds, excludeId, limit = 10) => {
  return new Promise((resolve, reject) => {
    const config = ENTITY_CONFIG[type];

    const query = `
      SELECT e.*, COUNT(DISTINCT t.tag_id) AS relevance
      FROM ${config.table} e
      JOIN ${config.tagTable} t 
        ON e.${config.id} = t.${config.tagForeignKey}
      WHERE t.tag_id IN (?)
      AND e.${config.id} != ?
      GROUP BY e.${config.id}
      ORDER BY relevance DESC
      LIMIT ?
    `;

    db.query(query, [tagIds, excludeId, limit], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// 3. Main function
const getRecommendations = async (type, id, limit) => {
  const tagIds = await getTagsByEntity(type, id);

  if (!tagIds.length) {
    return {};
  }

  const types = ["product", "pet", "breed", "article"];

  // exclude current type
  const targetTypes = types.filter(t => t !== type);

  const results = {};

  await Promise.all(
    targetTypes.map(async (t) => {
      const data = await getRelatedEntities(t, tagIds, id, limit);
      results[t + "s"] = data; // products, pets, breeds...
    })
  );

  return results;
};

module.exports = {
  getRecommendations,
};