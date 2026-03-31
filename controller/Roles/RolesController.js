const RolesModel = require("./../../models/Roles/RolesModel.js");
var RoleModel = require("./../../models/Roles/RolesModel.js");

// exports.getRoles = function (req, res) {
//   try {
//     RoleModel.getRoles(function (err, data) {
//       if (err) {
//         return res.status(500).json({ message: err.message });
//       } else {
//         res.json(data);
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

exports.getRoles = async function (req, res) {
  try {
    const roles = await RolesModel.getRoles();
    res.json(roles);
  } catch (error) {
    console.error("Error getting roles:", error.message);
    res.status(500).send("Internal Server Error");
  }
};

exports.getPagesForRoles = async function (req, res) {
  try {
    var roleid = req.body.roleid;
    console.log(roleid);

    var result = await RoleModel.getpagesForRole(roleid);

    res.status(200).json({ success: true, message: " successfully", result });
  } catch (error) {
    console.error("Error deleting user by ID:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.rolePagePermission = async function (req, res) {
  var roleName = req.body.roleName;
  var userrolepagepermission = req.body.userrolepagepermission;
  console.log("Request Body:", req.body); // Add this line for logging

  try {
    var result = await RoleModel.createRolewithPagePermission(
      roleName,
      userrolepagepermission
    );
    console.log("Result:", result); // Add this line for logging
    res.status(201).json(result);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.getRoleCount = function (req, res) {
  try {
    RoleModel.roleCount(function (err, data) {
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

exports.getAllPermissions = async (req, res) => {
  try {
    const permissions = await RolesModel.getAllPermissions();
    res.json(permissions);
  } catch (error) {
    console.error("Error getting all permissions:", error.message);
    res.status(500).send("Internal Server Error");
  }
};

// exports.updateRolePermissions = async function (req, res) {
//   var roleid = req.body.roleid;
//   var userrolepagepermission = req.body.userrolepagepermission;

//   try {
//     var result = await RoleModel.updateRolePermissions(
//       roleid,
//       userrolepagepermission
//     );
//     console.log(result, "result");
//     res.status(200).json(result);
//   } catch (error) {
//     console.error("Error:", error.message);
//     res.status(500).json({ error: error.message });
//   }
// };
exports.updateRolePermissions = async function (req, res) {
  var roleid = req.body.roleid;
  var selectedPermissions = req.body.selectedPermissions;
  console.log(selectedPermissions, "selectedPermissions");

  try {
    var result = await RoleModel.updateRolePermissions(
      roleid,
      selectedPermissions
    );
    console.log(result, "result");
    res.status(200).json(result);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.getPermissionsByRoleId = async function (req, res) {
  var roleid = req.params.roleid;

  try {
    var result = await RoleModel.getPermissionsByRoleId(roleid);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};
