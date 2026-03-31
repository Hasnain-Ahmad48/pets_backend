var UserDetailsModel = require("../../models/User/UserDetailsModel");
const CryptoJS = require("crypto-js");

var fs = require("fs");
var path = require("path");

var __filename = path.resolve(process.cwd(), "../Backend/public/uploads");
var __dirname = path.dirname(__filename) + "/uploads";

var middleware = require("../../middleware/middleware");
var createToken = middleware.createToken;

exports.loginUser = function (req, res) {
  var email = req.body.email;
  var password = req.body.password;

  UserDetailsModel.findByCredentials(email)
    .then(function (user) {
      if (!user) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      const hashedPassword = CryptoJS.SHA256(password).toString(
        CryptoJS.enc.Hex
      );

      if (hashedPassword !== user.password) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      var accessToken = createToken(user);

      res.cookie("token", accessToken);

      req.session.user = {
        id: user.id,
        roleid: user.roleid,
        email: email,
      };

      var id = user.id;
      var roleid = user.roleid;

      res.json({
        message: "Login successful",
        accessToken: accessToken,
        id: id,
        roleid: roleid,
      });
    })
    .catch(function (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    });
};

exports.getRoleWithPagePermission = function (req, res) {
  var roleId = req.params.roleid;

  UserDetailsModel.getUserRoleWithPagePermission(roleId)
    .then(function (result) {
      res.json(result);
    })
    .catch(function (error) {
      console.error("Error fetching pages and permissions:", error);
      res.status(500).json({ error: "Internal Server Error" });
    });
};

exports.logoutUser = function (req, res) {
  try {
    UserDetailsModel.clearSession(req, res);

    res.json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getUserDetails = function (req, res) {
  try {
    UserDetailsModel.getAllUser(function (err, data) {
      if (err) {
        return res.status(500).json({ message: err.message });
      } else {
        res.json(data);
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addUser = async function (req, res) {
  var first_name = req.body.first_name;
  var last_name = req.body.last_name;
  var roleid = req.body.roleid;
  var email = req.body.email;
  var status = req.body.status;
  var phone = req.body.phone;
  var alternative_phone = req.body.alternative_phone;
  var note = req.body.note;
  var password = req.body.password;
  var address = req.body.address;
  var alternative_address = req.body.alternative_address;
  var dob = req.body.dob;
  var gender = req.body.gender;
  var is_admin = req.body.is_admin;
  var enable_email_notification = req.body.enable_email_notification;

  var imageUrl = req.file ? "uploads/" + req.file.filename : null;
  const hashedPassword = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);

  try {
    var result = await UserDetailsModel.postUser(
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
    );

    res.status(201).json({ message: "User Created Successfully", result });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({
      error: error.message,
      message: "Error while creating User",
    });
  }
};

exports.updateUserController = async function (req, res) {
  var first_name = req.body.first_name;
  var last_name = req.body.last_name;
  var roleid = req.body.roleid;
  var email = req.body.email;
  var phone = req.body.phone;
  var alternative_phone = req.body.alternative_phone;
  var status = req.body.status;
  var note = req.body.note;
  var password = req.body.password;
  var address = req.body.address;
  var alternative_address = req.body.alternative_address;
  var dob = req.body.dob;
  var gender = req.body.gender;
  var is_admin = req.body.is_admin;
  var enable_email_notification = req.body.enable_email_notification;

  var id = parseInt(req.params.id);
  var imageUrl = req.file ? "uploads/" + req.file.filename : null;
  const hashedPassword = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
  try {
    var result = await UserDetailsModel.updateUser(
      id,
      first_name,
      last_name,
      parseInt(roleid),
      email,
      imageUrl,
      parseInt(status),
      phone,
      alternative_phone,
      note,
      hashedPassword,
      address,
      alternative_address,
      dob,
      parseInt(gender),
      parseInt(is_admin),
      parseInt(enable_email_notification)
    );
    res.status(200).json({
      success: true,
      message: "User updated successfully",
      result: result,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getUserByIdController = async function (req, res) {
  try {
    var userId = req.params.id;
    var imageUrl = req.file ? "uploads/" + req.file.filename : null;

    var result = await UserDetailsModel.getUserById(userId, imageUrl);

    if (result.length > 0) {
      res.status(200).json({
        success: true,
        message: "User fetched successfully",
        data: result[0],
      });   
    } else {
      res.status(404).json({ success: false, message: "User not found" });
    }
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getUserById = async function (req, res) {
  try {
    var userId = req.params.id;
    var imageUrl = req.file ? "uploads/" + req.file.filename : null;

    var result = await UserDetailsModel.getUserByIdProfile(userId, imageUrl);

    if (result.length > 0) {
      res.status(200).json({
        success: true,
        message: "User fetched successfully",
        data: result[0],
      });
    } else {
      res.status(404).json({ success: false, message: "User not found" });
    }
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.deleteUserByIdController = async function (req, res) {
  var id = req.params.id;

  try {
    var result = await UserDetailsModel.getUserByIdfordelete(id);

    var newImagesPaths = result[0].image.slice(8, result[0].image.length);
    console.log("newImagesPaths", newImagesPaths);
    console.log("users", result[0].image);
    fs.unlink(path.join(__dirname, newImagesPaths), function (err) {
      if (err) {
        console.error(
          "Failed to delete image at " + newImagesPaths + ": " + err.message
        );
      }
    });

    var result1 = await UserDetailsModel.deleteUserById(id);
    res.status(200).json({
      message: "Article deleted successfully.",
      success: true,
      result1: result1,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// exports.deleteUserByIdController = function (req, res) {
//   var id = req.params.id;

//   try {
//     UserDetailsModel.getUserByIdfordelete(id, function (err, result) {
//       var newImagesPaths = result[0].image.slice(8, result[0].image.length);
//       console.log("newImagesPaths", newImagesPaths);
//       console.log("users", result[0].image);
//       fs.unlink(path.join(__dirname, newImagesPaths), function (err) {
//         if (err) {
//           console.error(
//             "Failed to delete image at " + newImagesPaths + ": " + err.message
//           );
//         }
//       });

//       UserDetailsModel.deleteUserById(id, function (err, result1) {
//         res.status(200).json({
//           message: "Article deleted successfully.",
//           success: true,
//           result1: result1,
//         });
//       });
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

exports.getUserCount = function (req, res) {
  try {
    UserDetailsModel.getUserCount(function (err, data) {
      if (err) {
        return res.status(500).json({ message: err.message });
      } else {
        res.json(data);
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
