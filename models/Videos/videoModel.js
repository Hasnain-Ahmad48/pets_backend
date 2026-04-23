const db = require("../../config/DatabaseConnection.js");

// CREATE VIDEO
const addVideo = (
  title,
  description,
  video_url,
  thumbnail_url,
  duration_seconds,
  category_id,
  is_featured,
  is_active,
  tags = ""
) => {
  return new Promise((resolve, reject) => {

    db.beginTransaction((err) => {
      if (err) return reject(err);

      const insertQuery = `
        INSERT INTO pet_videos 
        (title, description, video_url, thumbnail_url, duration_seconds, category_id, is_featured, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        insertQuery,
        [
          title,
          description,
          video_url,
          thumbnail_url,
          duration_seconds,
          category_id || null,
          is_featured || false,
          is_active !== undefined ? is_active : true,
        ],
        (err, result) => {
          if (err) {
            return db.rollback(() => reject(err));
          }

          const videoId = result.insertId;

          // ✅ STEP 1: parse tag IDs directly
          let tagIds = [];

          if (tags && typeof tags === "string") {
            tagIds = tags
              .split(",")
              .map(t => parseInt(t.trim()))
              .filter(t => !isNaN(t));
          }

          // If no tags → just commit video
          if (tagIds.length === 0) {
            return db.commit(err => {
              if (err) return db.rollback(() => reject(err));
              resolve({ video_id: videoId });
            });
          }

          // ✅ STEP 2: insert into pivot table directly
          const values = tagIds.map(tagId => [videoId, tagId]);

          db.query(
            "INSERT INTO video_tags (video_id, tag_id) VALUES ?",
            [values],
            (err) => {
              if (err) {
                return db.rollback(() => reject(err));
              }

              db.commit(err => {
                if (err) return db.rollback(() => reject(err));
                resolve({ video_id: videoId });
              });
            }
          );
        }
      );
    });
  });
};

// GET VIDEOS (id OR title OR all)
const getVideos = (id, title) => {
  return new Promise((resolve, reject) => {

    let query = `
      SELECT 
        v.*,
        c.name AS category_name,
        GROUP_CONCAT(DISTINCT t.id) AS tag_ids,
        GROUP_CONCAT(DISTINCT t.name) AS tag_names
      FROM pet_videos v
      LEFT JOIN video_categories c ON v.category_id = c.category_id
      LEFT JOIN video_tags vt ON v.video_id = vt.video_id
      LEFT JOIN tags t ON vt.tag_id = t.id
    `;

    const conditions = [];
    const values = [];

    if (id) {
      conditions.push("v.video_id = ?");
      values.push(id);
    }

    if (title) {
      conditions.push("v.title LIKE ?");
      values.push(`%${title}%`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " GROUP BY v.video_id ORDER BY v.video_id DESC";

    db.query(query, values, (err, results) => {
      if (err) return reject(err);

      // ✅ format tags nicely
      const formatted = results.map(v => ({
        ...v,
        tags: v.tag_ids
          ? v.tag_ids.split(",").map((id, i) => ({
              id: parseInt(id),
              name: v.tag_names.split(",")[i]
            }))
          : []
      }));

      resolve(formatted);
    });
  });
};

// UPDATE VIDEO
const updateVideo = (
  id,
  title,
  description,
  video_url,
  thumbnail_url,
  duration_seconds,
  category_id,
  is_featured,
  is_active,
) => {
  return new Promise((resolve, reject) => {
    let query = `
      UPDATE pet_videos SET
        title = ?,
        description = ?,
        duration_seconds = ?,
        category_id = ?,
        is_featured = ?,
        is_active = ?
    `;

    const values = [
      title,
      description,
      duration_seconds,
      category_id || null,
      is_featured || false,
      is_active !== undefined ? is_active : true,
    ];

    if (video_url) {
      query += ", video_url = ?";
      values.push(video_url);
    }

    if (thumbnail_url) {
      query += ", thumbnail_url = ?";
      values.push(thumbnail_url);
    }

    query += " WHERE video_id = ?";
    values.push(id);

    db.query(query, values, (err, result) => {
      if (err) return reject(err);

      if (result.affectedRows === 0) {
        return resolve({notFound: true});
      }

      resolve({success: true});
    });
  });
};

// DELETE VIDEO
const deleteVideo = id => {
  return new Promise((resolve, reject) => {
    const query = `DELETE FROM pet_videos WHERE video_id = ?`;

    db.query(query, [id], err => {
      if (err) return reject(err);
      resolve(true);
    });
  });
};

module.exports = {
  addVideo,
  getVideos,
  updateVideo,
  deleteVideo,
};
