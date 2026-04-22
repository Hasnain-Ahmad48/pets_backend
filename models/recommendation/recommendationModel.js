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
  HAVING relevance > 0
  ORDER BY relevance DESC, e.${config.id} DESC
  LIMIT ?
`;

    db.query(query, [tagIds, excludeId, limit], (err, results) => {
      if (err) return reject(err);
      attachTagsToResults(type, results)
        .then(data => resolve(data))
        .catch(err => reject(err));
    });
  });
};

// helper: get tags for multiple entities
const getTagsForEntities = (type, entityIds) => {
  return new Promise((resolve, reject) => {
    if (!entityIds.length) return resolve({});

    const config = ENTITY_CONFIG[type];

    const query = `
      SELECT 
        t.id, 
        t.name, 
        bt.${config.tagForeignKey} AS entity_id
      FROM ${config.tagTable} bt
      JOIN tags t ON t.id = bt.tag_id
      WHERE bt.${config.tagForeignKey} IN (?)
    `;

    db.query(query, [entityIds], (err, results) => {
      if (err) return reject(err);

      const tagMap = {};

      results.forEach(row => {
        if (!tagMap[row.entity_id]) {
          tagMap[row.entity_id] = [];
        }

        tagMap[row.entity_id].push({
          id: row.id,
          name: row.name,
        });
      });

      resolve(tagMap);
    });
  });
};

//helper function to get tags of an entity

const attachTagsToResults = async (type, items) => {
  if (!items.length) return items;

  const config = ENTITY_CONFIG[type];

  const ids = items.map(item => item[config.id]);

  const tagMap = await getTagsForEntities(type, ids);

  return items.map(item => ({
    ...item,
    tags: tagMap[item[config.id]] || [],
  }));
};

// 3. Main function
const getRecommendations = async (tag_ids,is_product,is_pets,is_article,is_breed, limit) => {
  // const tagIds = await getTagsByEntity(type, id);

  // if (!tagIds.length) {
  //   return {};
  // }

   const results = {};

if(is_product==true){
  // await Promise.all(
  //   (async  => {
      const data = await getRelatedEntities("product", tag_ids,0, limit);
      results["product" + "s"] = data; // products, pets, breeds...
  //   }),
  // );
}

if(is_pets==true){
      const data = await getRelatedEntities("pet", tag_ids, limit);
      results["pet" + "s"] = data; // products, pets, breeds...
}
if(is_article==true){
      const data = await getRelatedEntities("article", tag_ids, limit);
      results["article" + "s"] = data; // products, pets, breeds...
}
if(is_breed==true){
      const data = await getRelatedEntities("breed", tag_ids, limit);
      results["breed" + "s"] = data; // products, pets, breeds...
}
  return results;
};

// 4. Search entities (LIKE based - no DB change)
// const searchEntities = (type, searchTerm, limit = 10) => {
//   return new Promise((resolve, reject) => {
//     const config = ENTITY_CONFIG[type];

//     // Define searchable columns per entity
//     const SEARCH_COLUMNS = {
//       product: ["name", "description"],
//       pet: ["pet_name", "slug"],
//       breed: ["title", "slug"],
//       article: ["title", "description"],
//     };

//     const columns = SEARCH_COLUMNS[type];

//     const likeClause = columns.map(col => `${col} LIKE ?`).join(" OR ");
//     const likeValues = columns.map(() => `%${searchTerm}%`);

//     const query = `
//       SELECT *
//       FROM ${config.table}
//       WHERE ${likeClause}
//       LIMIT ?
//     `;

//     db.query(query, [...likeValues, limit], (err, results) => {
//       if (err) return reject(err);
//       attachTagsToResults(type, results)
//         .then(data => resolve(data))
//         .catch(err => reject(err));
//     });
//   });
// };

// 5. Combined Search + Tag Recommendation
// const searchWithRecommendations = async (searchTerm, limit = 10) => {
//   const types = ["product", "pet", "breed", "article"];
//   const results = {};

//   await Promise.all(
//     types.map(async type => {
//       const directResults = await searchEntities(type, searchTerm, limit);

//       // Extract IDs → fetch tags → expand
//       let expandedResults = [];

//       if (directResults.length > 0) {
//         const firstItem = directResults[0];

//         // get tags of first matched item
//         const config = ENTITY_CONFIG[type];
//         const entityId = firstItem[config.id];

//         const tagIds = await getTagsByEntity(type, entityId);

//         if (tagIds.length > 0) {
//           expandedResults = await getRelatedEntities(type, tagIds, 0, limit);
//         }
//       }

//       results[type + "s"] = [...directResults, ...expandedResults];
//     }),
//   );

//   return results;
// };

module.exports = {
  getRecommendations,
  // searchWithRecommendations
};