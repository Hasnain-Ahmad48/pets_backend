var db = require("../../config/DatabaseConnection.js");

var getRoles = async function () {
  var query = "SELECT * FROM role";
  return new Promise(function (resolve, reject) {
    db.query(query, function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

var createRolewithPagePermission = async function (
  roleName,
  userRolePagePermission
) {
  const connection = db;

  // Start the transaction
  await new Promise((resolve, reject) => {
    connection.beginTransaction((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });

  try {
    // Create Role
    const role = await new Promise((resolve, reject) => {
      const query = "INSERT INTO role (roleName) VALUES(?)";
      connection.query(query, [roleName], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    const roleId = role.insertId;

    // Create userRolePagePermission promises
    const userRolePagePermissionPromises = userRolePagePermission.flatMap(
      (permission) => {
        const { pageid, permissionid } = permission;

        const permissionIds = Array.isArray(permissionid)
          ? permissionid
          : [permissionid];

        return permissionIds.map((pid) => {
          return new Promise((resolve, reject) => {
            const query =
              "INSERT INTO userrolepagepermission (userid, roleid, pageid, permissionid) VALUES (1, ?, ?, ?)";
            connection.query(query, [roleId, pageid, pid], (err, result) => {
              if (err) {
                reject(err);
              } else {
                resolve(result);
              }
            });
          });
        });
      }
    );

    await Promise.all(userRolePagePermissionPromises);

    await new Promise((resolve, reject) => {
      connection.commit((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

    return { message: "Role with Page Permission created successfully" };
  } catch (error) {
    await new Promise((resolve) => {
      connection.rollback(() => {
        resolve();
      });
    });
    console.error("Error creating Role with Page Permission:", error);
    throw new Error("Internal Server Error");
  }
};

//   roleName,
//   userRolePagePermission
// ) {
//   try {
//     var connection = db;

//     // Start the transaction
//     await new Promise(function (resolve, reject) {
//       connection.beginTransaction(function (error) {
//         if (error) {
//           reject(error);
//         } else {
//           resolve();
//         }
//       });
//     });

//     try {
//       // Create Role
//       var role = await new Promise(function (resolve, reject) {
//         var query = "INSERT INTO role (roleName) VALUES(?)";
//         return connection.query(query, [roleName], function (err, result) {
//           if (err) {
//             reject(err);
//           } else {
//             resolve(result);
//           }
//         });
//       });

//       var userRolePagePermissionPromises = userRolePagePermission.map(function (
//         permission
//       ) {
//         var pageid = permission.pageid,
//           permissionid = permission.permissionid;

//         return permissionid.map(function (pid) {
//           return new Promise(function (resolve, reject) {
//             var query =
//               "INSERT INTO userrolepagepermission (userid,roleid, pageid, permissionid) VALUES (1, ?, ?, ?)";
//             connection.query(
//               query,
//               [role.insertId, pageid, pid],
//               function (err, result) {
//                 if (err) {
//                   reject(err);
//                 } else {
//                   resolve(result);
//                 }
//               }
//             );
//           });
//         });
//       });

//       await Promise.all(userRolePagePermissionPromises);

//       // Commit the transaction
//       await new Promise(function (resolve, reject) {
//         connection.commit(function (error) {
//           if (error) {
//             reject(error);
//           } else {
//             resolve();
//           }
//         });
//       });

//       return { message: "Role with Page Permission created successfully" };
//     } catch (error) {
//       // Rollback the transaction in case of an error
//       await new Promise(function (resolve) {
//         connection.rollback(function () {
//           resolve();
//         });
//       });
//       throw error;
//     }
//   } catch (error) {
//     console.error("Error creating Role with Page Permission:", error);
//     throw new Error("Internal Server Error");
//   }
// };

var roleCount = function (callback) {
  var query = "SELECT COUNT(*) AS roleCount FROM role";
  db.query(query, function (err, result) {
    if (err) {
      return callback(err, null);
    } else {
      return callback(null, result);
    }
  });
};

var getpagesForRole = async function (roleid) {
  var query =
    "Select p.PageName from userrolepagepermission u JOIN pages p ON u.pageid = p.PageID Where u.roleid=? ";
  var values = [roleid];

  return new Promise(function (resolve, reject) {
    db.query(query, values, function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

var getAllPermissions = async function () {
  var query = "SELECT * FROM permissions";
  return new Promise(function (resolve, reject) {
    db.query(query, function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

var updateRolePermissions = async function (roleid, selectedPermissions) {
  try {
    var connection = db;

    await new Promise(function (resolve, reject) {
      connection.beginTransaction(function (error) {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

    try {
      // Delete existing permissions for the role
      await new Promise(function (resolve, reject) {
        var query = "DELETE FROM userrolepagepermission WHERE roleid = ?";
        connection.query(query, [roleid], function (err, result) {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });

      // Insert new permissions for each page
      var userRolePagePermissionPromises = Object.entries(
        selectedPermissions
      ).map(async ([pageid, permissionIds]) => {
        for (const permissionid of permissionIds) {
          await new Promise(function (resolve, reject) {
            var query =
              "INSERT INTO userrolepagepermission (userid, roleid, pageid, permissionid) VALUES (1, ?, ?, ?)";
            connection.query(
              query,
              [roleid, pageid, permissionid],
              function (err, result) {
                if (err) {
                  reject(err);
                } else {
                  resolve(result);
                }
              }
            );
          });
        }
      });

      await Promise.all(userRolePagePermissionPromises);

      await new Promise(function (resolve, reject) {
        connection.commit(function (error) {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });

      return { message: "Role permissions updated successfully" };
    } catch (error) {
      await new Promise(function (resolve) {
        connection.rollback(function () {
          resolve();
        });
      });
      throw error;
    }
  } catch (error) {
    console.error("Error updating role permissions:", error);
    throw new Error("Internal Server Error");
  }
};

// var updateRolePermissions = async function (roleid, userRolePagePermission) {
//   try {
//     var connection = db;

//     await new Promise(function (resolve, reject) {
//       connection.beginTransaction(function (error) {
//         if (error) {
//           reject(error);
//         } else {
//           resolve();
//         }
//       });
//     });

//     try {
//       // Delete existing permissions for the role
//       await new Promise(function (resolve, reject) {
//         var query = "DELETE FROM userrolepagepermission WHERE roleid = ?";
//         connection.query(query, [roleid], function (err, result) {
//           if (err) {
//             reject(err);
//           } else {
//             resolve(result);
//           }
//         });
//       });

//       // Insert new permissions for the role
//       var userRolePagePermissionPromises = userRolePagePermission.map(function (
//         permission
//       ) {
//         var pageid = permission.pageid;
//         var permissionids = permission.permissionid;

//         var permissionPromises = permissionids.map(function (permissionid) {
//           return new Promise(function (resolve, reject) {
//             var query =
//               "INSERT INTO userrolepagepermission (userid, roleid, pageid, permissionid) VALUES (1, ?, ?, ?)";
//             connection.query(
//               query,
//               [roleid, pageid, permissionid],
//               function (err, result) {
//                 if (err) {
//                   reject(err);
//                 } else {
//                   resolve(result);
//                 }
//               }
//             );
//           });
//         });

//         return Promise.all(permissionPromises);
//       });

//       await Promise.all(userRolePagePermissionPromises);

//       await new Promise(function (resolve, reject) {
//         connection.commit(function (error) {
//           if (error) {
//             reject(error);
//           } else {
//             resolve();
//           }
//         });
//       });

//       return { message: "Role permissions updated successfully" };
//     } catch (error) {
//       await new Promise(function (resolve) {
//         connection.rollback(function () {
//           resolve();
//         });
//       });
//       throw error;
//     }
//   } catch (error) {
//     console.error("Error updating role permissions:", error);
//     throw new Error("Internal Server Error");
//   }
// };

var getPermissionsByRoleId = async function (roleid) {
  try {
    var query =
      "SELECT pageid, permissionid FROM userrolepagepermission WHERE roleid = ?";
    var values = [roleid];

    return new Promise(function (resolve, reject) {
      db.query(query, values, function (err, result) {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  } catch (error) {
    console.error("Error getting permissions by role ID:", error);
    throw new Error("Internal Server Error");
  }
};

module.exports = {
  getRoles: getRoles,
  createRolewithPagePermission: createRolewithPagePermission,
  roleCount: roleCount,
  getpagesForRole: getpagesForRole,
  getAllPermissions: getAllPermissions,
  updateRolePermissions: updateRolePermissions,
  getPermissionsByRoleId: getPermissionsByRoleId,
};
