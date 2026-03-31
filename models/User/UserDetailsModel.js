var db = require("../../config/DatabaseConnection.js");

var findByCredentials = function (email) {
  var query = "SELECT * FROM dashboard_user_table WHERE email='" + email + "'";
  return new Promise(function (resolve, reject) {
    db.query(query, [email], function (err, result) {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        console.log(result);
        resolve(result[0]);
      }
    });
  });
};

var getUserRoleWithPagePermission = function (roleId) {
  var query = `
    SELECT ur.id, ur.roleid, ur.pageid, ur.permissionid, r.roleName, p.pageName, per.permissionName
    FROM userrolepagepermission ur
    JOIN role r ON ur.roleid = r.roleid
    JOIN pages p ON ur.pageid = p.pageid
    JOIN permissions per ON ur.permissionid = per.permissionid
    WHERE ur.roleid = ?`;
  return new Promise(function (resolve, reject) {
    db.query(query, [roleId], function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

var clearSession = function (req, res) {
  req.session.destroy(function (err) {
    if (err) {
      console.error("Session clearing error:", err);
    }
  });

  res.clearCookie("token");
};

var getAllUser = function (callback) {
  var query =
    "SELECT d.id,d.first_name,d.last_name,d.email,d.image,d.status,d.phone,r.roleName FROM dashboard_user_table d JOIN role r ON d.roleid = r.roleid";
  db.query(query, function (err, result) {
    if (err) {
      return callback(err, null);
    } else {
      return callback(null, result);
    }
  });
};

var postUser = async function (
  first_name,
  last_name,
  roleid,
  email,
  imageUrl,
  status,
  phone,
  alternative_phone,
  note,
  hashedPassword,
  address,
  alternative_address,
  dob,
  gender,
  is_admin,
  enable_email_notification
) {
  dob = convertDateFormat(dob);

  var query =
    "INSERT INTO `dashboard_user_table` (first_name, last_name, roleid, email, image, status, phone, alternative_phone,note, password,  address, alternative_address, dob, gender, is_admin, enable_email_notification) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

  return new Promise(function (resolve, reject) {
    db.query(
      query,
      [
        first_name,
        last_name,
        roleid,
        email,
        imageUrl,
        status,
        phone,
        alternative_phone,
        note,
        hashedPassword,
        address,
        alternative_address,
        dob,
        gender,
        is_admin,
        enable_email_notification,
      ],
      function (err, result) {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          console.log(result);
          resolve(result);
        }
      }
    );
  });
};

var formatDate = function (date) {
  var d = new Date(date);
  var year = d.getFullYear();
  var month = String(d.getMonth() + 1).padStart(2, "0");
  var day = String(d.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
};

var updateUser = async function (
  id,
  first_name,
  last_name,
  roleid,
  email,
  imageUrl,
  status,
  phone,
  alternative_phone,
  note,
  hashPassword,
  address,
  alternative_address,
  dob,
  gender,
  is_admin,
  enable_email_notification
) {
  var dobs = formatDate(dob);
  var query;
  var values;

  if (imageUrl) {
    // If a new image is uploaded, update the image column as well
    query =
      "UPDATE `dashboard_user_table` SET first_name=?, last_name=?, roleid=?, email=?, image=?, status=?, phone=?, alternative_phone=?, note=?, password=?, address=?, alternative_address=?, dob=?, gender=?, is_admin=?, enable_email_notification=? WHERE id=?";
    values = [
      first_name,
      last_name,
      roleid,
      email,
      imageUrl,
      status,
      phone,
      alternative_phone,
      note,
      hashPassword,
      address,
      alternative_address,
      dobs,
      gender,
      is_admin,
      enable_email_notification,
      id,
    ];
  } else {
    // If no new image is uploaded, update without changing the image column
    query =
      "UPDATE `dashboard_user_table` SET first_name=?, last_name=?, roleid=?, email=?, status=?, phone=?, alternative_phone=?, note=?, password=?,  address=?, alternative_address=?, dob=?, gender=?, is_admin=?, enable_email_notification=? WHERE id=?";
    values = [
      first_name,
      last_name,
      roleid,
      email,
      status,
      phone,
      alternative_phone,
      note,
      hashPassword,
      address,
      alternative_address,
      dobs,
      gender,
      is_admin,
      enable_email_notification,
      id,
    ];
  }

  return new Promise(function (resolve, reject) {
    var queryExec = db.query(query, values, function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
    console.log(queryExec.sql);
  });
};

var getUserById = async function (id, imageUrl) {
  var query =
    "SELECT id, first_name, last_name, roleid, email, image, status, phone ,alternative_phone,note ,address, alternative_address ,dob,gender,is_admin ,enable_email_notification  FROM `dashboard_user_table` WHERE id=?";

  var values = [id, imageUrl];

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

var getUserByIdProfile = async function (id, imageUrl) {
  var query =
    "SELECT d.id, d.first_name, d.last_name, d.email, d.image, d.status, d.phone, r.roleName, d.alternative_phone, d.note,   d.address, d.alternative_address,  DATE_FORMAT(d.dob, '%Y-%m-%d') as dob, d.gender, d.is_admin, d.enable_email_notification FROM dashboard_user_table d JOIN role r ON d.roleid = r.roleid WHERE d.id=?;";

  var values = [id, imageUrl];

  console.log(values);

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
var getUserByIdfordelete = async function (id) {
  var query =
    "SELECT d.id, d.first_name, d.last_name, d.email, d.image, d.status, d.phone, r.roleName, d.alternative_phone, d.note,   d.address, d.alternative_address,  DATE_FORMAT(d.dob, '%Y-%m-%d') as dob, d.gender, d.is_admin, d.enable_email_notification FROM dashboard_user_table d JOIN role r ON d.roleid = r.roleid WHERE d.id=?;";

  var values = [id];

  console.log(values);

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

var deleteUserById = async function (id) {
  var query = "DELETE FROM `dashboard_user_table` WHERE id=?";

  return new Promise(function (resolve, reject) {
    db.query(query, [id], function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

// Count User

var getUserCount = function (callback) {
  var query = "SELECT COUNT(*) AS userCount FROM dashboard_user_table";
  db.query(query, function (err, result) {
    if (err) {
      return callback(err, null);
    } else {
      return callback(null, result);
    }
  });
};

function convertDateFormat(inputDateString) {
  var parts = inputDateString.split("/");
  if (parts.length === 3) {
    var month = parts[0],
      day = parts[1],
      year = parts[2];
    var formattedDate = year + "-" + month + "-" + day;
    return formattedDate;
  } else {
    console.error("Invalid date format");
    return null;
  }
}

module.exports = {
  getAllUser: getAllUser,
  postUser: postUser,
  updateUser: updateUser,
  getUserById: getUserById,
  deleteUserById: deleteUserById,
  getUserCount: getUserCount,
  getUserByIdProfile: getUserByIdProfile,
  findByCredentials: findByCredentials,
  clearSession: clearSession,
  getUserRoleWithPagePermission: getUserRoleWithPagePermission,
  getUserByIdfordelete: getUserByIdfordelete,
};
