var authUserModel = require("../../models/AuthUser/authUserModel.js");
var crypto = require("crypto");
var UserToken = require("../../middleware/middleware.js").UserToken;
var CryptoJS = require("crypto-js");
var fs = require("fs");
var path = require("path");
var jwt = require("jsonwebtoken");
const {OAuth2Client} = require("google-auth-library");
const admin = require("../../config/firebase");

exports.updateProfile = async (req, res) => {
  const userId = req.user.id; // ✅ comes from JWT
  const updates = req.body;

  try {
    if (req.file) {
      updates.user_profile_photo = "authUser/" + req.file.filename; // store relative path
    }
    const user = await authUserModel.updateUserProfile(userId, updates);
    if (!user) {
      return res.status(400).json({error: "No valid fields to update"});
    }
    res.json({
      message: "Profile updated successfully",
      data: {
        //  id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        image: user.image,
        status: user.status,
        token: user.token,
        devicetype: user.devicetype,
        user_type: user.user_type,
        isVerified: user.isVerified,
        is_shop_admin: user.is_shop_admin,
        facebook_id: user.facebook_id,
        google_id: user.google_id,
        phone_id: user.phone_id,
        apple_id: user.apple_id,
        user_about_me: user.user_about_me,
        user_cover_photo: user.user_cover_photo,
        user_profile_photo: user.user_profile_photo,
        role_id: user.role_id,
        is_banned: user.is_banned,
        added_date: user.added_date,
        billing_first_name: user.billing_first_name,
        billing_last_name: user.billing_last_name,
        billing_company: user.billing_company,
        billing_address_1: user.billing_address_1,
        billing_address_2: user.billing_address_2,
        billing_country: user.billing_country,
        billing_state: user.billing_state,
        billing_city: user.billing_city,
        billing_postal_code: user.billing_postal_code,
        billing_email: user.billing_email,
        billing_phone: user.billing_phone,
        shipping_first_name: user.shipping_first_name,
        shipping_last_name: user.shipping_last_name,
        shipping_company: user.shipping_company,
        shipping_address_1: user.shipping_address_1,
        shipping_address_2: user.shipping_address_2,
        shipping_country: user.shipping_country,
        shipping_state: user.shipping_state,
        shipping_city: user.shipping_city,
        shipping_postal_code: user.shipping_postal_code,
        shipping_email: user.shipping_email,
        shipping_phone: user.shipping_phone,
        code: user.code,
        verify_types: user.verify_types,
        country_id: user.country_id,
        city_id: user.city_id,
        auth_token: user.auth_token,
        refresh_token: user.refresh_token,
      },
    });
    // res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (err) {
    res.status(500).json({error: "Server error", details: err.message});
  }
};

exports.registerUser = function (req, res) {
  var email = req.body.email,
    password = req.body.password,
    deviceType = req.body.devicetype,
    firebase_token = req.body.firebase_token;
  ((firstName = req.body.firstName), (lastName = req.body.lastName));

  const secretKey = "ZAQ123!12@assddfhex";
  // Decrypt the received password
  const decryptedBytes = CryptoJS.AES.decrypt(password, secretKey);
  const decryptedPassword = decryptedBytes.toString(CryptoJS.enc.Utf8);

  if (!decryptedPassword) {
    return res.status(401).json({message: "Invalid encrypted password"});
  }

  var hashedPassword = crypto
    .createHash("sha256")
    .update(decryptedPassword)
    .digest("hex");

  var image = req.file ? "authUser/" + req.file.filename : "default.png";

  authUserModel
    .signupUser(email, hashedPassword, image, firstName, lastName)
    .then(user => {
      var authToken = UserToken(user);
      if (!authToken)
        return res.status(500).json({message: "Token not generated!"});

      return authUserModel
        .updateUserAuthToken(user.id, authToken, firebase_token, deviceType)
        .then(data => {
          res.cookie("authToken", authToken.auth_token);
          res.status(201).json({
            message: "User registered successfully",
            data: {
              //  id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              phoneNumber: user.phoneNumber,
              image: user.image,
              status: user.status,
              token: user.token,
              devicetype: user.devicetype,
              user_type: user.user_type,
              isVerified: user.isVerified,
              is_shop_admin: user.is_shop_admin,
              facebook_id: user.facebook_id,
              google_id: user.google_id,
              phone_id: user.phone_id,
              apple_id: user.apple_id,
              user_about_me: user.user_about_me,
              user_cover_photo: user.user_cover_photo,
              user_profile_photo: user.user_profile_photo,
              role_id: user.role_id,
              is_banned: user.is_banned,
              added_date: user.added_date,
              billing_first_name: user.billing_first_name,
              billing_last_name: user.billing_last_name,
              billing_company: user.billing_company,
              billing_address_1: user.billing_address_1,
              billing_address_2: user.billing_address_2,
              billing_country: user.billing_country,
              billing_state: user.billing_state,
              billing_city: user.billing_city,
              billing_postal_code: user.billing_postal_code,
              billing_email: user.billing_email,
              billing_phone: user.billing_phone,
              shipping_first_name: user.shipping_first_name,
              shipping_last_name: user.shipping_last_name,
              shipping_company: user.shipping_company,
              shipping_address_1: user.shipping_address_1,
              shipping_address_2: user.shipping_address_2,
              shipping_country: user.shipping_country,
              shipping_state: user.shipping_state,
              shipping_city: user.shipping_city,
              shipping_postal_code: user.shipping_postal_code,
              shipping_email: user.shipping_email,
              shipping_phone: user.shipping_phone,
              code: user.code,
              verify_types: user.verify_types,
              country_id: user.country_id,
              city_id: user.city_id,
              auth_token: authToken.auth_token,
              refresh_token: authToken.refresh_token,
            },
          });
        });
      //   return authUserModel
      //     .updateUserAuthToken(result.id, authToken)
      //     .then((data) => {
      //       res.cookie("authToken", authToken);
      //       res.status(201).json({
      //         message: "User registered successfully",
      //         data: data,
      //       });
      //     });
    })
    .catch(err => {
      if (err.sqlMessage && err.sqlMessage.includes("email")) {
        res.status(400).json({message: "Email already exists!"});
      } else {
        res
          .status(500)
          .json({message: "Internal server error!", error: err.message});
      }
    });
};

exports.signinWithGoogle = async (req, res) => {
  const {token} = req.body;
  const {deviceType, firebase_token} = req.body;
  const client = new OAuth2Client(
    "876551009681-82kj7i7vq8hfcgji93qqfgcmv6lrr3ja.apps.googleusercontent.com",
  );

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience:
        "876551009681-82kj7i7vq8hfcgji93qqfgcmv6lrr3ja.apps.googleusercontent.com",
    });
    const payload = ticket.getPayload();

    // Check if the user exists
    authUserModel
      .loginUser_(payload.email)
      .then(user => {
        // User exists, proceed with login
        const authToken = UserToken(user);
        if (!authToken) {
          return res.status(500).json({message: "Token not generated!"});
        }

        authUserModel
          .updateUserAuthToken(user.id, authToken, firebase_token, deviceType)
          .then(() => {
            res.json({
              message: "Login successful",
              data: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                image: user.image,
                status: user.status,
                token: user.token,
                devicetype: user.devicetype,
                user_type: user.user_type,
                authToken: authToken,
              },
            });
          })
          .catch(error => {
            res.status(500).json({
              message: "Error updating user token",
              error: error.message,
            });
          });
      })
      .catch(async error => {
        if (error.message === "User not found") {
          // User does not exist, create new user
          try {
            const newUser = await authUserModel.signupWithGoogle(
              payload.given_name,
              payload.family_name,
              payload.email,
              payload.picture,
              payload.sub,
            );
            const authToken = UserToken(newUser);

            if (!authToken) {
              return res.status(500).json({message: "Token not generated!"});
            }

            authUserModel
              .updateUserAuthToken(
                newUser.id,
                authToken,
                firebase_token,
                deviceType,
              )
              .then(() => {
                res.json({
                  message: "New user created and login successful",
                  data: {
                    firstName: newUser.firstName,
                    lastName: newUser.lastName,
                    email: newUser.email,
                    phoneNumber: newUser.phoneNumber,
                    image: newUser.image,
                    status: newUser.status,
                    token: newUser.token,
                    devicetype: newUser.devicetype,
                    user_type: newUser.user_type,
                    authToken: authToken,
                  },
                });
              })
              .catch(error => {
                res.status(500).json({
                  message: "Error updating token for new user",
                  error: error.message,
                });
              });
          } catch (signupErr) {
            res.status(500).json({
              message: "Error signing up new user",
              error: signupErr.message,
            });
          }
        } else {
          res.status(500).json({
            message: "Error checking user existence",
            error: error.message,
          });
        }
      });
  } catch (error) {
    console.error("Error verifying Google token:", error);
    res
      .status(500)
      .json({message: "Error verifying Google token", error: error.message});
  }
};

exports.signinUser = function (req, res) {
  var email = req.body.email,
    password = req.body.password,
    deviceType = req.body.devicetype,
    firebase_token = req.body.firebase_token;

  const secretKey = "ZAQ123!12@assddfhex";
  // Decrypt the received password
  const decryptedBytes = CryptoJS.AES.decrypt(password, secretKey);
  const decryptedPassword = decryptedBytes.toString(CryptoJS.enc.Utf8);

  if (!decryptedPassword) {
    return res.status(401).json({message: "Invalid encrypted password"});
  }

  authUserModel
    .loginUser_(email)
    .then(user => {
      if (!user || user.length === 0) {
        res.status(401).json({error: "The User does't exist"});
        return;
      }

      var hashedPassword = crypto
        .createHash("sha256")
        .update(decryptedPassword)
        .digest("hex");

      if (hashedPassword !== user.password) {
        res.status(401).json({error: "Invalid credentials"});
        return;
      }

      var id = user.id,
        firstName = user.firstName,
        lastName = user.lastName,
        email = user.email,
        phoneNumber = user.phoneNumber,
        image = user.image,
        status = user.status,
        token = user.token,
        devicetype = user.devicetype,
        user_type = user.user_type;

      var authToken = UserToken(user);
      if (!authToken)
        return res.status(500).json({message: "Token not generated!"});

      return authUserModel
        .updateUserAuthToken(id, authToken, firebase_token, deviceType)
        .then(data => {
          res.json({
            message: "Login successful",
            data: {
              //  id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              phoneNumber: user.phoneNumber,
              image: user.image,
              status: user.status,
              token: user.token,
              devicetype: user.devicetype,
              user_type: user.user_type,
              isVerified: user.isVerified,
              is_shop_admin: user.is_shop_admin,
              facebook_id: user.facebook_id,
              google_id: user.google_id,
              phone_id: user.phone_id,
              apple_id: user.apple_id,
              user_about_me: user.user_about_me,
              user_cover_photo: user.user_cover_photo,
              user_profile_photo: user.user_profile_photo,
              role_id: user.role_id,
              is_banned: user.is_banned,
              added_date: user.added_date,
              billing_first_name: user.billing_first_name,
              billing_last_name: user.billing_last_name,
              billing_company: user.billing_company,
              billing_address_1: user.billing_address_1,
              billing_address_2: user.billing_address_2,
              billing_country: user.billing_country,
              billing_state: user.billing_state,
              billing_city: user.billing_city,
              billing_postal_code: user.billing_postal_code,
              billing_email: user.billing_email,
              billing_phone: user.billing_phone,
              shipping_first_name: user.shipping_first_name,
              shipping_last_name: user.shipping_last_name,
              shipping_company: user.shipping_company,
              shipping_address_1: user.shipping_address_1,
              shipping_address_2: user.shipping_address_2,
              shipping_country: user.shipping_country,
              shipping_state: user.shipping_state,
              shipping_city: user.shipping_city,
              shipping_postal_code: user.shipping_postal_code,
              shipping_email: user.shipping_email,
              shipping_phone: user.shipping_phone,
              code: user.code,
              verify_types: user.verify_types,
              country_id: user.country_id,
              city_id: user.city_id,
              auth_token: authToken.auth_token,
              refresh_token: authToken.refresh_token,
              firebase_token: authToken.firebase_token,
            },
          });
        });
    })
    .catch(err => {
      console.error("Login error:", err);
      res.status(500).json({error: "Internal Server Error"});
    });
};

exports.fetchUser = function (req, res) {
  var id = req.user.id;

  authUserModel
    .fetchUser(id)
    .then(user => {
      if (!user || user.length === 0) {
        res.status(401).json({error: "The User does't exist"});
        return;
      }
      res.json({
        message: "User fetched successfully",
        data: {
          //  id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          image: user.image,
          status: user.status,
          token: user.token,
          devicetype: user.devicetype,
          user_type: user.user_type,
          isVerified: user.isVerified,
          is_shop_admin: user.is_shop_admin,
          facebook_id: user.facebook_id,
          google_id: user.google_id,
          phone_id: user.phone_id,
          apple_id: user.apple_id,
          user_about_me: user.user_about_me,
          user_cover_photo: user.user_cover_photo,
          user_profile_photo: user.user_profile_photo,
          role_id: user.role_id,
          is_banned: user.is_banned,
          added_date: user.added_date,
          billing_first_name: user.billing_first_name,
          billing_last_name: user.billing_last_name,
          billing_company: user.billing_company,
          billing_address_1: user.billing_address_1,
          billing_address_2: user.billing_address_2,
          billing_country: user.billing_country,
          billing_state: user.billing_state,
          billing_city: user.billing_city,
          billing_postal_code: user.billing_postal_code,
          billing_email: user.billing_email,
          billing_phone: user.billing_phone,
          shipping_first_name: user.shipping_first_name,
          shipping_last_name: user.shipping_last_name,
          shipping_company: user.shipping_company,
          shipping_address_1: user.shipping_address_1,
          shipping_address_2: user.shipping_address_2,
          shipping_country: user.shipping_country,
          shipping_state: user.shipping_state,
          shipping_city: user.shipping_city,
          shipping_postal_code: user.shipping_postal_code,
          shipping_email: user.shipping_email,
          shipping_phone: user.shipping_phone,
          code: user.code,
          verify_types: user.verify_types,
          country_id: user.country_id,
          city_id: user.city_id,
          auth_token: user.auth_token,
          refresh_token: user.refresh_token,
          firebase_token: user.firebase_token,
        },
      });
    })
    .catch(err => {
      console.error("Login error:", err);
      res.status(500).json({error: "Internal Server Error"});
    });
};

exports.getAllAppuser = async (req, res) => {
  try {
    const result = await authUserModel.getAllAppUsers();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({message: "Internal server error!"});
  }
};

exports.getAllAppuserById = async (req, res) => {
  const user_id = req.params.id;
  try {
    const result = await authUserModel.getAllAppUsersById(user_id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({message: "Internal server error!"});
  }
};

exports.deleteAppUser = async (req, res) => {
  const id = req.params.id;
  try {
    const result1 = await authUserModel.getAppUserByIdfordeleteImage(id);
    const image =
      result1[0] && result1[0].image ? result1[0].image : "default.png";
    console.log(__dirname, image);
    if (image && !image.includes("default.png")) {
      fs.unlink(path.join(__dirname, "../../public/", image), err => {
        if (err) {
          console.error("Error deleting image:", err);
        }
      });
    }
    const result = await authUserModel.deleteAppUser(id);
    res
      .status(200)
      .json({success: true, message: "User deleted successfully!"});
  } catch (error) {
    res.status(500).json({message: "Internal server error!"});
  }
};

// exports.logout = async (req, res) => {
//   try {
//     // userId is coming from JWT middleware
//     const userId = req.user.id;

//     await authUserModel.logoutUser(userId);

//     return res.status(200).json({
//       success: true,
//       message: "Logged out successfully",
//     });
//   } catch (error) {
//     console.error("Logout error:", error);
//     return res.status(500).json({ success: false,  error: "Logout failed"  });
//   // return res.status(500).json({ success: false,  error: error.message || "Logout failed"  });
//   }
// };

// ✅ Logout API
exports.logout = async (req, res) => {
  try {
    await authUserModel.clearUserTokens(req.user.id);
    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({error: "Internal Server Error"});
  }
};

// ✅ Refresh Token API
exports.refreshToken = async (req, res) => {
  try {
    const {refreshToken} = req.body;
    if (!refreshToken)
      return res.status(400).json({message: "Refresh token required"});

    const user = await authUserModel.getUserByRefreshToken(refreshToken);
    if (!user) return res.status(401).json({message: "Invalid refresh token"});

    const decoded = jwt.verify(refreshToken, "HJSDHDSLDLSDJSL");
    const newTokens = UserToken(user);
    await authUserModel.updateOnlyAuthToken(user.id, newTokens);

    res.json({
      message: "Tokens refreshed",
      tokens: newTokens,
    });
  } catch (err) {
    console.error("Refresh error:", err);
    res.status(500).json({error: "Internal Server Error"});
  }
};

exports.addTrackingData = async (req, res) => {
  await authUserModel.addApiLog("/addTrackingData", "POST", req.body);

  try {
    const data = req.body;

    const tracker = await authUserModel.addTrackingData(data);

    return res.status(201).json({
      success: true,
      message: "Tracking data inserted successfully",
      data: tracker,
    });
  } catch (error) {
    console.error("Tracking insert error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error!",
      error: error.message,
    });
  }
};

exports.getTrackingData = async (req, res) => {
  try {
    const {trackerId, startDate, startTime, endDate, endTime} = req.body;

    if (!trackerId) {
      return res.status(400).json({
        success: false,
        message: "trackerId is required",
      });
    }

    const rows = await authUserModel.getTrackingData(
      trackerId,
      startDate,
      startTime,
      endDate,
      endTime,
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No tracking data found",
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Tracking data fetched successfully",
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching tracking data:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getCountries = async (req, res) => {
  try {
    const rows = await authUserModel.getCountries();
    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No countries data found",
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Countries data fetched successfully",
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching countries data:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.geofenceEventNotification = async (req, res) => {
  try {
    const internalKey = req.headers["x-internal-key"];
    if (internalKey !== "secret") {
      return res.status(401).json({success: false, message: "Unauthorized"});
    }

    const {imei, geofence_id, user_id, event, time, lat, lng} = req.body;

    if (!user_id || !event) {
      return res.status(400).json({success: false, message: "Invalid payload"});
    }

    /** Get user */
    const user = await authUserModel.getUserToken(user_id);
    if (!user || !user.firebase_token) {
      return res.status(404).json({
        success: false,
        message: "User or Firebase token not found",
      });
    }

    /** Firebase Notification */
    const message = {
      token: user.firebase_token,
      notification: {
        title: "Geofence Alert",
        body: `Your pet has ${event} the geofence`,
      },
      data: {
        imei: String(imei),
        geofence_id: String(geofence_id),
        event: String(event),
        lat: String(lat),
        lng: String(lng),
        time: String(time),
      },
    };

    const response = await admin.messaging().send(message);

    return res.status(200).json({
      success: true,
      message: "Notification sent",
      firebase_response: response,
    });
  } catch (error) {
    console.error("Error Notification:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
