var jwt = require("jsonwebtoken");
const pagesModel = require("../models/Pages/PagesModel.js");
const SECRET = process.env.JWT_SECRET || "HJSDHDSLDLSDJSL";

exports.createToken = function (user) {
  var accessToken = jwt.sign(
    {
      id: user.id,
      email: user.email,
      roleid: user.roleid,
    },
    "HJSDHDSLDLSDJSL",
    {
      expiresIn: "1hr",
    }
  );

  return accessToken;
};


exports.validateToken = function (req, res, next) {
  var accessToken = req.headers["authorization"];
  if (typeof accessToken !== "undefined") {
    var bearer = accessToken.split(" ");
    var token = bearer[1];
    jwt.verify(token, "HJSDHDSLDLSDJSL", function (err, data) {
      if (err) {
        return res.status(401).json({ mssg: "Token invalid", err: err });
      } else {
        req.user = data; // ✅ attach decoded {id, email}
        console.log("Authentication success");
        next();
      }
    });
  } else {
    return res.status(403).json({ mssg: "No token provided" });
  }
};


// exports.validateToken = function (req, res, next) {
//   try {
//     const authHeader = req.headers["authorization"];
//     if (!authHeader) {
//       return res.status(401).json({ mssg: "Authorization header missing" });
//     }

//     // Expected format: "Bearer <token>"
//     const parts = authHeader.split(" ");
//     if (parts.length !== 2 || parts[0] !== "Bearer") {
//       return res.status(401).json({ mssg: "Invalid auth header format" });
//     }

//     const token = parts[1];

//     jwt.verify(token, SECRET, (err, decoded) => {
//       if (err) {
//         return res.status(401).json({ mssg: "Token invalid", err });
//       }
//       req.user = decoded; // ✅ attach decoded data to request
//       console.log("Authentication success", decoded);
//       next();
//     });
//   } catch (error) {
//     res.status(500).json({ mssg: "Auth check failed", error: error.message });
//   }
// };

// frontend User token

exports.UserToken = function (user) {
    
     const auth_token = jwt.sign(
    {
        id: user.id, email: user.email,
        },
     "HJSDHDSLDLSDJSL",
    { 
        expiresIn: "15m" 
        
    } // short life
  );
  
  const refresh_token = jwt.sign({ id: user.id }, "HJSDHDSLDLSDJSL", {
    expiresIn: "7d",
  });
  
   return { auth_token, refresh_token };
  //return accessToken;
  
//   var token = jwt.sign(
//     {
//       id: user.id,
//       email: user.email,
//     },
//     "HJSDHDSLDLSDJSL",
//     {
//       expiresIn: "10hr",
//     }
//   );
  
  

//   return token;
};

exports.refreshAccessToken = (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(403).json({ msg: "No refresh token provided" });

  jwt.verify(refreshToken,  "HJSDHDSLDLSDJSL", (err, decoded) => {
    if (err) return res.status(403).json({ msg: "Invalid refresh token" });

    const newAccessToken = jwt.sign(
      { id: decoded.id },
      "HJSDHDSLDLSDJSL",
      { expiresIn: "15m" }
    );

    res.json({ auth_token: newAccessToken });
  });
};

exports.verifyAccessToken = function (req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader)
    return res.status(403).json({ msg: "No token provided" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, "HJSDHDSLDLSDJSL", (err, user) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ msg: "TOKEN_EXPIRED" });
      }
      return res.status(401).json({ msg: "Invalid token" });
    }
    req.user = user;
    next();
  });
};

// exports.hasPermission = function (req, res, next) {
//   var accessToken = req.headers["authorization"];
//   if (typeof accessToken !== "undefined") {
//     var bearer = accessToken.split(" ");
//     var token = bearer[1];
//     console.log("Token: ", token);
//     if (!token) {
//       res.status(401).json({ mssg: "Token invalid" });
//     }

//     jwt.verify(token, "HJSDHDSLDLSDJSL", function (err, decoded) {
//       if (err) {
//         console.error("Error decoding token:", err);
//       } else {
//         console.log("Decoded token payload:", decoded);
//         const { roleid } = decoded;
//         console.log("Role ID:", roleid);
//         pagesModel.getPagePermissionForRole(roleid).then((result) => {
//           if (result.length > 0) {
//             console.log("Permission granted");

//             // console.log("------------------------------------");
//             // console.log(result);

//             // console.log("------------------------------------");

//             const page = req.originalUrl.split("/")[1];
//             console.log("******************************************");
//             console.log(page);
//             console.log("******************************************");
//             console.log(typeof result[8]);

//             const permission = result.filter((p) => p.pageName === page);
//             console.log("===========================================");
//             console.log(result[7]);
//             if (permission) {
//               console.log("Permission granted", permission);
//               next();
//             } else {
//               console.log("Permission denied");
//               res.status(401).json({ mssg: "Permission denied" });
//             }
//           }
//         });
//       }
//     });
//   }
// };

//Deprecated
exports.hasPermission = function (req, res, next) {
  var accessToken = req.headers["authorization"];
  if (typeof accessToken !== "undefined") {
    var bearer = accessToken.split(" ");
    var token = bearer[1];
    if (!token) {
      res.status(401).json({ mssg: "Token invalid" });
    }

    jwt.verify(token, "HJSDHDSLDLSDJSL", function (err, decoded) {
      if (err) {
        console.error("Error decoding token:", err);
      } else {
        console.log("Decoded token payload:", decoded);
        const { roleid } = decoded;
        console.log("Role ID:", roleid);
        pagesModel.getPagePermissionForRole(roleid).then((result) => {
          if (result.length > 0) {
            console.log("Permission granted");
            const isDuplicate = (arr, entry) => {
              return arr.some(
                (item) =>
                  item.id === entry.id &&
                  item.permissionid === entry.permissionid &&
                  item.pageid === entry.pageid
              );
            };

            // Use reduce to filter out duplicate entries
            const uniqueData = result.reduce((acc, entry) => {
              if (!isDuplicate(acc, entry)) {
                acc.push(entry);
              }
              return acc;
            }, []);

            const page = req.originalUrl.split("/")[1];
            console.log("******************************************");
            console.log(page);
            console.log("******************************************");

            const ourPermissions = uniqueData.find((p) => p.pageName === page);

            if (ourPermissions) {
              next();
            } else {
              console.log("Permission denied");
              res.status(401).json({ mssg: "Permission denied" });
            }
          }
        });
      }
    });
  }
};

//v2
exports.hasPermission_v2 = function (pageName, actionName) {
  return function (req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Token missing" });
    }

    jwt.verify(token, "HJSDHDSLDLSDJSL", (err, decoded) => {
      if (err) {
        console.log("❌ Invalid token:", err);
        return res.status(401).json({ message: "Invalid token" });
      }

      const roleId = decoded.roleid;

      pagesModel.getPagePermissionForRole(roleId).then((permissions) => {
        console.log("🔎 Permissions for role:", roleId);
       // console.table(permissions);

        const hasPerm = permissions.some((p) => {
          const match =
            p.pageName === pageName && p.permissionName === actionName;

          console.log(
            `Checking: DB(${p.pageName}, ${p.permissionName}) → Required(${pageName}, ${actionName}) → Match: ${match}`
          );

          return match;
        });

        console.log("Final permission result:", hasPerm);

        if (!hasPerm) {
          return res.status(403).json({ message: "Permission denied" });
        }

        next();
      });
    });
  };
};

