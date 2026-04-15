var db = require("../../config/DatabaseConnection.js");

var signupUser = function (
  email,
  hashedPassword,
  image,
  firstName = null,
  lastName = null,
  status = "1",
) {
  var checkQuery = "SELECT COUNT(*) AS count FROM user_signup WHERE email = ?";
  var insertQuery = `INSERT INTO user_signup (email, password,  user_profile_photo, status,firstName,lastName) VALUES (?, ?, ?, ?,?,?)`;
  var selectQuery = "SELECT * FROM user_signup WHERE id = LAST_INSERT_ID()";

  return new Promise((resolve, reject) => {
    db.query(checkQuery, [email], function (checkErr, checkResult) {
      if (checkErr) {
        reject(checkErr);
      } else {
        var count = checkResult[0].count;
        if (count > 0) {
          reject(new Error("Email already exists"));
        } else {
          db.query(
            insertQuery,
            [email, hashedPassword, image, status,firstName,lastName],
            function (insertErr) {
              if (insertErr) {
                reject(insertErr);
              } else {
                db.query(selectQuery, function (selectErr, result) {
                  if (selectErr) {
                    reject(selectErr);
                  } else {
                    resolve(result[0]);
                  }
                });
              }
            },
          );
        }
      }
    });
  });
};



var signupWithGoogle = function (
  firstName,
  lastName,
  email,
  image,
  google_id,
  isVerified = "1",
  status = "1",
  user_type = "0",
) {
  var insertQuery = `INSERT INTO user_signup (user_type,isVerified, firstName, lastName, email, user_profile_photo,google_id, status) VALUES (?,?,?,?,?,?,?,?)`;
  var selectQuery = "SELECT * FROM user_signup WHERE id = LAST_INSERT_ID()";

  return new Promise((resolve, reject) => {
    // First, insert the new user into the user_signup table
    db.query(
      insertQuery,
      [
        user_type,
        isVerified,
        firstName,
        lastName,
        email,
        image,
        google_id,
        status,
      ],
      function (insertErr) {
        if (insertErr) {
          console.error("Error inserting user: ", insertErr);
          return reject({
            message: "Error inserting user into database",
            error: insertErr,
          });
        }

        // If insert is successful, get the newly inserted user
        db.query(selectQuery, function (selectErr, result) {
          if (selectErr) {
            console.error("Error fetching user after insert: ", selectErr);
            return reject({
              message: "Error fetching newly inserted user",
              error: selectErr,
            });
          }

          // If user is found, resolve the promise with the user data
          if (result.length > 0) {
            resolve(result[0]);
          } else {
            reject({message: "User not found after insertion"});
          }
        });
      },
    );
  });
};

// var signupUser = function (
//   firstName,
//   lastName,
//   email,
//   hashedPassword,
//   phoneNumber,
//   image,

//   billing_first_name,
//   billing_last_name,
//   billing_address_1,
//   billing_address_2,
//   billing_country,
//   billing_state,
//   billing_city,
//   billing_postal_code,
//   billing_email,
//   billing_phone,
//   shipping_first_name,
//   shipping_last_name,
//   shipping_address_1,
//   shipping_address_2,
//   shipping_country,
//   shipping_state,
//   shipping_city,
//   shipping_postal_code,
//   shipping_email,
//   shipping_phone
// ) {
//   var checkQuery = "SELECT COUNT(*) AS count FROM user_signup WHERE email = ?";
//   var insertQuery =
//     `INSERT INTO user_signup (
//       firstName, lastName, email, password, phoneNumber, user_profile_photo,
//       billing_first_name, billing_last_name, billing_address_1, billing_address_2, billing_country, billing_state, billing_city, billing_postal_code, billing_email, billing_phone,
//       shipping_first_name, shipping_last_name, shipping_address_1, shipping_address_2, shipping_country, shipping_state, shipping_city, shipping_postal_code, shipping_email, shipping_phone
//     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
//   var selectQuery = "SELECT * FROM user_signup WHERE id = LAST_INSERT_ID()";

//   return new Promise((resolve, reject) => {
//     db.query(checkQuery, [email], function (checkErr, checkResult) {
//       console.log(checkResult,"model==========================")
//       if (checkErr) {
//         reject(checkErr);
//       } else {
//         var count = checkResult[0].count;
//         if (count > 0) {
//           reject(new Error("Email already exists"));
//         } else {
//           db.query(
//             insertQuery,
//             [
//               firstName, lastName, email, hashedPassword, phoneNumber, image,
//               billing_first_name, billing_last_name, billing_address_1, billing_address_2, billing_country, billing_state, billing_city, billing_postal_code, billing_email, billing_phone,
//               shipping_first_name, shipping_last_name, shipping_address_1, shipping_address_2, shipping_country, shipping_state, shipping_city, shipping_postal_code, shipping_email, shipping_phone
//             ],
//             function (insertErr) {
//               if (insertErr) {
//                 reject(insertErr);
//               } else {
//                 db.query(selectQuery, function (selectErr, result) {
//                   console.log(result,"model+++++++++++++++")
//                   if (selectErr) {
//                     reject(selectErr);
//                   } else {
//                     resolve({
//                       id: result[0].id,
//                       firstName: result[0].firstName,
//                       lastName: result[0].lastName,
//                       email: result[0].email,
//                       phoneNumber: result[0].phoneNumber,

//                       billing_first_name: result[0].billing_first_name,
//                       billing_last_name: result[0].billing_last_name,
//                       billing_address_1: result[0].billing_address_1,
//                       billing_address_2: result[0].billing_address_2,
//                       billing_country: result[0].billing_country,
//                       billing_state: result[0].billing_state,
//                       billing_city: result[0].billing_city,
//                       billing_postal_code: result[0].billing_postal_code,
//                       billing_email: result[0].billing_email,
//                       billing_phone: result[0].billing_phone,
//                       shipping_first_name: result[0].shipping_first_name,
//                       shipping_last_name: result[0].shipping_last_name,
//                       shipping_address_1: result[0].shipping_address_1,
//                       shipping_address_2: result[0].shipping_address_2,
//                       shipping_country: result[0].shipping_country,
//                       shipping_state: result[0].shipping_state,
//                       shipping_city: result[0].shipping_city,
//                       shipping_postal_code: result[0].shipping_postal_code,
//                       shipping_email: result[0].shipping_email,
//                       shipping_phone: result[0].shipping_phone,
//                     });
//                   }
//                 });
//               }
//             }
//           );
//         }
//       }
//     });
//   });
// };

var updateOnlyAuthToken = function (userId, tokens) {
  var updateQuery =
    "UPDATE user_signup SET auth_token = ?, refresh_token = ? WHERE id = ?";

  var selectQuery = "SELECT * FROM user_signup WHERE id = ?";

  return new Promise((resolve, reject) => {
    db.query(
      updateQuery,
      [tokens.auth_token, tokens.refresh_token, userId],
      function (updateErr, updateResult) {
        if (updateErr) {
          reject(updateErr);
        } else {
          // Fetch the updated user data
          db.query(selectQuery, [userId], function (selectErr, result) {
            if (selectErr) {
              reject(selectErr);
            } else {
              // Resolve with the updated user data
              resolve(result[0]);
            }
          });
        }
      },
    );
  });
};

var updateUserAuthToken = function (
  userId,
  tokens,
  firebaseToken = null,
  devicetype = null,
) {
  var updateQuery =
    "UPDATE user_signup SET devicetype = ?, firebase_token = ?, auth_token = ?, refresh_token = ? WHERE id = ?";

  var selectQuery = "SELECT * FROM user_signup WHERE id = ?";

  return new Promise((resolve, reject) => {
    db.query(
      updateQuery,
      [
        devicetype,
        firebaseToken,
        tokens.auth_token,
        tokens.refresh_token,
        userId,
      ],
      function (updateErr, updateResult) {
        if (updateErr) {
          reject(updateErr);
        } else {
          // Fetch the updated user data
          db.query(selectQuery, [userId], function (selectErr, result) {
            if (selectErr) {
              reject(selectErr);
            } else {
              // Resolve with the updated user data
              resolve(result[0]);
            }
          });
        }
      },
    );
  });
};

var clearUserTokens = function (userId) {
  const query =
    "UPDATE user_signup SET auth_token = NULL, refresh_token = NULL WHERE id = ?";
  return new Promise((resolve, reject) => {
    db.query(query, [userId], function (err) {
      if (err) reject(err);
      else resolve(true);
    });
  });
};

// var updateUserAuthToken = function (userId, tokens) {
//   const updateQuery =
//     "UPDATE user_signup SET auth_token = ?, refresh_token = ? WHERE id = ?";
//   const selectQuery = "SELECT * FROM user_signup WHERE id = ?";

//   return new Promise((resolve, reject) => {
//     db.query(
//       updateQuery,
//       [tokens.accessToken, tokens.refreshToken, userId],
//       function (updateErr) {
//         if (updateErr) return reject(updateErr);

//         db.query(selectQuery, [userId], function (selectErr, result) {
//           if (selectErr) return reject(selectErr);
//           resolve(result[0]);
//         });
//       }
//     );
//   });
// };

var loginUser = function (email) {
  var query = "SELECT * FROM user_signup WHERE email = ?";

  return new Promise((resolve, reject) => {
    db.query(query, [email], function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result[0]);
      }
    });
  });
};

////////////////////////

var loginUser_ = function (email) {
  var query = "SELECT * FROM user_signup WHERE email = ?";

  return new Promise((resolve, reject) => {
    db.query(query, [email], function (err, result) {
      if (err) {
        console.log(err);
        reject(err); // Reject the promise with the error if there's a DB issue
      } else if (result.length === 0) {
        // If no user is found (empty result)
        reject(new Error("User not found"));
      } else {
        console.log(result);
        resolve(result[0]); // Resolve the promise with the first result (the user object)
      }
    });
  });
};

var fetchUser = function (id) {
  var query = "SELECT * FROM user_signup WHERE id = ?";

  return new Promise((resolve, reject) => {
    db.query(query, [id], function (err, result) {
      if (err) {
        console.log(err);
        reject(err); // Reject the promise with the error if there's a DB issue
      } else if (result.length === 0) {
        // If no user is found (empty result)
        reject(new Error("User not found"));
      } else {
        console.log(result);
        resolve(result[0]); // Resolve the promise with the first result (the user object)
      }
    });
  });
};

/////////////////////

var getAllAppUsers = () => {
  const query = `SELECT id,firstName,lastName,email, phoneNumber, user_profile_photo as image, status,auth_token as token,isVerified, user_type from user_signup `;

  return new Promise((resolve, reject) => {
    db.query(query, (err, result) => {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

var getAllAppUsersById = id => {
  const query = `SELECT id,email, 	
billing_first_name,	
billing_last_name,

billing_company	,
billing_address_1	,
billing_address_2,	
billing_country,	
billing_state,
billing_city	,
billing_postal_code	,
billing_email	,
billing_phone	,
shipping_first_name,	
shipping_last_name	,
shipping_company	,
shipping_address_1,	
shipping_address_2,	
shipping_country	,
shipping_state,
shipping_city	,
shipping_postal_code,	
shipping_email	,
shipping_phone  from user_signup WHERE id = ? `;

  return new Promise((resolve, reject) => {
    db.query(query, [id], (err, result) => {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

var deleteAppUser = id => {
  const query = `DELETE FROM user_signup WHERE id = ?`;
  return new Promise((resolve, reject) => {
    db.query(query, [id], (err, result) => {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};
// GET APP USER BY ID
var getAppUserByIdfordeleteImage = id => {
  const query = `SELECT * FROM user_signup WHERE id = ?`;
  return new Promise((resolve, reject) => {
    db.query(query, [id], (err, result) => {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

function updateUserProfile(userId, updates) {
  const allowedFields = [
    "firstName",
    "lastName",
    "phoneNumber",
    "image",
    "status",
    "devicetype",
    "user_type",
    "isVerified",
    "is_shop_admin",
    "facebook_id",
    "google_id",
    "phone_id",
    "apple_id",
    "user_about_me",
    "user_cover_photo",
    "user_profile_photo",
    "role_id",
    "is_banned",
    "billing_first_name",
    "billing_last_name",
    "billing_company",
    "billing_address_1",
    "billing_address_2",
    "billing_country",
    "billing_state",
    "billing_city",
    "billing_postal_code",
    "billing_email",
    "billing_phone",
    "shipping_first_name",
    "shipping_last_name",
    "shipping_company",
    "shipping_address_1",
    "shipping_address_2",
    "shipping_country",
    "shipping_state",
    "shipping_city",
    "shipping_postal_code",
    "shipping_email",
    "shipping_phone",
    "code",
    "verify_types",
    "country_id",
    "city_id",
  ];

  const fields = Object.keys(updates).filter(
    key => updates[key] !== undefined && allowedFields.includes(key),
  );

  if (fields.length === 0) {
    return Promise.reject(new Error("No valid fields to update"));
  }

  const values = fields.map(field => updates[field]);
  const setClause = fields.map(field => `${field} = ?`).join(", ");
  const sql = `UPDATE user_signup SET ${setClause} WHERE id = ?`;
  values.push(userId);

  return new Promise((resolve, reject) => {
    db.query(sql, values, function (err, result) {
      if (err) {
        return reject(err);
      }

      // Fetch updated user
      db.query(
        "SELECT * FROM user_signup WHERE id = ?",
        [userId],
        function (selectErr, rows) {
          if (selectErr) {
            return reject(selectErr);
          }
          resolve(rows[0]); // return updated user row
        },
      );
    });
  });
}

var getUserByRefreshToken = function (token) {
  var query = "SELECT * FROM user_signup WHERE refresh_token = ?";

  return new Promise((resolve, reject) => {
    db.query(query, [token], function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result[0]);
      }
    });
  });
};

async function getUserByToken(token) {
  const [rows] = await db.query(
    "SELECT * FROM user_signup WHERE auth_token = ?",
    [token],
  );
  return rows[0];
}

async function logoutUser(userId) {
  const sql = `UPDATE user_signup SET auth_token = NULL WHERE id = ?`;
  await db.query(sql, [userId]);
  return {message: "User logged out successfully"};
}

async function getUserToken(userId) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT firebase_token FROM user_signup WHERE id = ? LIMIT 1`;

    db.query(sql, [userId], (err, rows) => {
      if (err) return reject(err);
      resolve(rows.length ? rows[0] : null);
    });
  });
}

function addTrackingData(data) {
  const sql = `
    INSERT INTO tracker 
      (imei, name, outsiders, uploadTime, flat, floor, x, y, address, electricity, altitude) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    data.imei,
    data.name,
    data.outsiders,
    data.uploadTime,
    data.flat,
    data.floor,
    data.x,
    data.y,
    data.address,
    data.electricity,
    data.altitude,
  ];

  return new Promise((resolve, reject) => {
    db.query(sql, values, function (err, result) {
      if (err) {
        return reject(err);
      }

      // Fetch the inserted record using the auto-increment id
      db.query(
        "SELECT * FROM tracker WHERE id = LAST_INSERT_ID()",
        function (selectErr, rows) {
          if (selectErr) {
            return reject(selectErr);
          }
          resolve(rows[0]); // return inserted tracker record
        },
      );
    });
  });
}

async function addApiLog(endpoint, method, requestBody) {
  const sql = `
    INSERT INTO api_logs (endpoint, method, request_body)
    VALUES (?, ?, ?)
  `;

  try {
    await db.query(sql, [endpoint, method, JSON.stringify(requestBody)]);
  } catch (error) {
    console.error("❌ Failed to insert API log:", error);
  }
}

function getTrackingData(trackerId, startDate, startTime, endDate, endTime) {
  return new Promise((resolve, reject) => {
    let sql = `
      SELECT id, name, altitude, bodyTemperature, electricity, flat, floor, heart, imei,
             outsiders, oxy, seq, speed, steps, uploadTime, version, x, y, address, created_at 
      FROM tracker
      WHERE imei = ?`;
    const params = [trackerId];

    // if dates/times provided, build BETWEEN filter
    if (startDate && endDate) {
      const start = `${startDate} ${startTime || "00:00:00"}`;
      const end = `${endDate} ${endTime || "23:59:59"}`;
      sql += ` AND created_at BETWEEN ? AND ? ORDER BY created_at ASC`;
      params.push(start, end);
    } else {
      // if no dates provided → only last record
      sql += ` ORDER BY created_at DESC LIMIT 1`;
    }

    db.query(sql, params, (err, results) => {
      if (err) {
        return reject(err);
      }
      resolve(results);
    });
  });
}

function getCountries() {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        name, 
        iso2, 
        iso3, 
        phone_code, 
        capital, 
        currency_code, 
        currency_name, 
        currency_symbol, 
        region, 
        subregion 
      FROM countries 
      WHERE is_active = 1 
      ORDER BY name ASC
    `;

    db.query(sql, (err, results) => {
      if (err) {
        console.error("Error fetching countries:", err);
        return reject(new Error("Failed to fetch countries"));
      }
      resolve(results);
    });
  });
}

module.exports = {
  signupUser: signupUser,
  loginUser: loginUser,
  loginUser_: loginUser_,
  signupWithGoogle: signupWithGoogle,
  updateUserAuthToken: updateUserAuthToken,
  getAllAppUsers: getAllAppUsers,
  getAllAppUsersById: getAllAppUsersById,
  deleteAppUser: deleteAppUser,
  getAppUserByIdfordeleteImage: getAppUserByIdfordeleteImage,
  updateUserProfile: updateUserProfile,
  getUserByToken: getUserByToken,
  logoutUser: logoutUser,
  addTrackingData: addTrackingData,
  addApiLog: addApiLog,
  getTrackingData: getTrackingData,
  clearUserTokens: clearUserTokens,
  getUserByRefreshToken: getUserByRefreshToken,
  getCountries: getCountries,
  getUserToken: getUserToken,
  updateOnlyAuthToken: updateOnlyAuthToken,
  fetchUser: fetchUser,
};
