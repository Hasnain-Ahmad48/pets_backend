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
  tags = "",
) => {
  return new Promise((resolve, reject) => {
    db.beginTransaction(err => {
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
        async (err, result) => {
          if (err) {
            return db.rollback(() => reject(err));
          }

          const videoId = result.insertId;

          try {
            // Parse tag names
            let parsedTags = [];

            if (typeof tags === "string" && tags.trim()) {
              parsedTags = tags
                .split(",")
                .map(tag => tag.trim().toLowerCase())
                .filter(tag => tag);
            }

            const tagIds = [];

            //  Find or Create Tags
            for (const tagName of parsedTags) {
              const existingTag = await new Promise((res, rej) => {
                db.query(
                  "SELECT id FROM tags WHERE name = ?",
                  [tagName],
                  (err, rows) => {
                    if (err) return rej(err);
                    res(rows);
                  },
                );
              });

              let tagId;

              if (existingTag.length > 0) {
                tagId = existingTag[0].id;
              } else {
                const insertedTag = await new Promise((res, rej) => {
                  db.query(
                    "INSERT INTO tags (name) VALUES (?)",
                    [tagName],
                    (err, insertResult) => {
                      if (err) return rej(err);
                      res(insertResult);
                    },
                  );
                });

                tagId = insertedTag.insertId;
              }

              tagIds.push(tagId);
            }

            // Insert into video_tags
            if (tagIds.length > 0) {
              const uniqueTagIds = [...new Set(tagIds)];
              const values = uniqueTagIds.map(tagId => [videoId, tagId]);

              await new Promise((res, rej) => {
                db.query(
                  "INSERT INTO video_tags (video_id, tag_id) VALUES ?",
                  [values],
                  err => {
                    if (err) return rej(err);
                    res();
                  },
                );
              });
            }

            // Commit transaction
            db.commit(err => {
              if (err) return db.rollback(() => reject(err));
              resolve({
                video_id: videoId,
                tags_added: parsedTags,
              });
            });
          } catch (error) {
            db.rollback(() => reject(error));
          }
        },
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
        GROUP_CONCAT(CONCAT(t.id, ':', t.name)) AS tags
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

      const formatted = results.map(v => {
        let tags = [];

        if (v.tags) {
          tags = v.tags.split(",").map(t => {
            const [id, name] = t.split(":");
            return {
              id: parseInt(id),
              name,
            };
          });
        }

        return {
          ...v,
          tags,
        };
      });

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
  tags = "",
) => {
  return new Promise((resolve, reject) => {
    db.beginTransaction(async err => {
      if (err) return reject(err);

      try {
        // ✅ STEP 1: Update video basic info
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

        const updateResult = await new Promise((res, rej) => {
          db.query(query, values, (err, result) => {
            if (err) return rej(err);
            res(result);
          });
        });

        if (updateResult.affectedRows === 0) {
          await db.rollback();
          return resolve({notFound: true});
        }

        // ✅ STEP 2: Parse tags
        let parsedTags = [];

        if (typeof tags === "string" && tags.trim()) {
          parsedTags = tags
            .split(",")
            .map(tag => tag.trim().toLowerCase())
            .filter(tag => tag);
        }

        // ✅ STEP 3: Delete old tags
        await new Promise((res, rej) => {
          db.query("DELETE FROM video_tags WHERE video_id = ?", [id], err => {
            if (err) return rej(err);
            res();
          });
        });

        const tagIds = [];

        // ✅ STEP 4: Find or create new tags
        for (const tagName of parsedTags) {
          const existingTag = await new Promise((res, rej) => {
            db.query(
              "SELECT id FROM tags WHERE name = ?",
              [tagName],
              (err, rows) => {
                if (err) return rej(err);
                res(rows);
              },
            );
          });

          let tagId;

          if (existingTag.length > 0) {
            tagId = existingTag[0].id;
          } else {
            const insertedTag = await new Promise((res, rej) => {
              db.query(
                "INSERT INTO tags (name) VALUES (?)",
                [tagName],
                (err, result) => {
                  if (err) return rej(err);
                  res(result);
                },
              );
            });

            tagId = insertedTag.insertId;
          }

          tagIds.push(tagId);
        }

        // ✅ STEP 5: Insert new tags
        if (tagIds.length > 0) {
          const uniqueTagIds = [...new Set(tagIds)];
          const values = uniqueTagIds.map(tagId => [id, tagId]);

          await new Promise((res, rej) => {
            db.query(
              "INSERT INTO video_tags (video_id, tag_id) VALUES ?",
              [values],
              err => {
                if (err) return rej(err);
                res();
              },
            );
          });
        }

        // ✅ COMMIT
        db.commit(err => {
          if (err) return db.rollback(() => reject(err));
          resolve({
            success: true,
            updated_tags: parsedTags,
          });
        });
      } catch (error) {
        db.rollback(() => reject(error));
      }
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

//video views
const addView = (videoId, userId, watchTime = 0, isCompleted = 0) => {
  return new Promise((resolve, reject) => {
    db.beginTransaction(err => {
      if (err) return reject(err);

      // Insert into video_views
      db.query(
        `INSERT INTO pet_video_views 
        (video_id, user_id, watch_time_seconds, is_completed) 
        VALUES (?, ?, ?, ?)`,
        [videoId, userId, watchTime, isCompleted],
        err => {
          if (err) {
            return db.rollback(() => reject(err));
          }

          // Update total_views
          db.query(
            "UPDATE pet_videos SET total_views = total_views + 1 WHERE video_id = ?",
            [videoId],
            err => {
              if (err) {
                return db.rollback(() => reject(err));
              }

              db.commit(err => {
                if (err) return db.rollback(() => reject(err));

                resolve({
                  success: true,
                });
              });
            },
          );
        },
      );
    });
  });
};

//like counter
const addLike = (videoId, userId) => {
  return new Promise((resolve, reject) => {
    // Check if already liked
    db.query(
      "SELECT id FROM pet_video_likes WHERE video_id = ? AND user_id = ?",
      [videoId, userId],
      (err, rows) => {
        if (err) return reject(err);

        if (rows.length > 0) {
          return resolve({
            alreadyLiked: true,
          });
        }

        // Insert like
        db.query(
          "INSERT INTO pet_video_likes (video_id, user_id) VALUES (?, ?)",
          [videoId, userId],
          (err, result) => {
            if (err) return reject(err);

            // Update total_likes in video table
            db.query(
              "UPDATE pet_videos SET total_likes = total_likes + 1 WHERE video_id = ?",
              [videoId],
              err => {
                if (err) return reject(err);

                resolve({
                  success: true,
                });
              },
            );
          },
        );
      },
    );
  });
};

module.exports = {
  addVideo,
  getVideos,
  updateVideo,
  deleteVideo,
  addView,
  addLike,
};
