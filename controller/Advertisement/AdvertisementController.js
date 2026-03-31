var AdvertisementModel = require("../../models/Advertiserment/AdvertisementModel.js");
var fs = require("fs");
var path = require("path");
var jwt = require("jsonwebtoken");
var __dirname = path.resolve(process.cwd()) + "/public/Advertisement";

exports.createAdvertiserment = async (req, res) => {
  const {
    title,
    description,
    price,
    address,
    latitude,
    longitude,
    city,
    views,
    status,
    advertisementtype,
    categoryid,
    healthcheck,
    verfied,
  } = req.body;
  const images = req.files;
  console.log("Request: ", req.body, images);
  const imagePath = [];
  images.forEach((image) => {
    imagePath.push(`/Advertisement/${image.filename}`);
  });

  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "HJSDHDSLDLSDJSL");
  const userid = decoded.id;

  try {
    console.log("Title: ", title);
    const result = await AdvertisementModel.createAdvertiserment(
      title,
      description,
      price,
      address,
      latitude,
      longitude,
      city,
      views,
      status,
      advertisementtype,
      categoryid,
      healthcheck,
      verfied,
      imagePath,
      userid
    );
    res.status(200).json({
      message: "Advertisement Created Successfully",
      result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.getAdvertisement = function (req, res) {
  var { page } = req.params || 1;
  try {
    var limit = parseInt(req.query.limit) || 20;
    AdvertisementModel.getAllAdvertisement(page, limit, function (err, data) {
      if (err) {
        return res.status(500).json({ message: err.message });
      } else {
        console.log("data", data);
        res.json(data);
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAdvertisementbyUserToken = function (req, res) {
  var token = req.headers.authorization.split(" ")[1];
  var decoded = jwt.verify(token, "HJSDHDSLDLSDJSL");
  var userid = decoded.id;
  var page = parseInt(req.query.page) || 1;
  var limit = parseInt(req.query.limit) || 20;
  try {
    AdvertisementModel.getAdvertisementByUserToken(
      userid,
      page,
      limit,
      function (err, data) {
        if (err) {
          return res.status(500).json({ message: err.message });
        } else {
          res.status(200).json({ data: data, page: page, limit: limit });
        }
      }
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAdvertisement = function (req, res) {
  AdvertisementModel.getAdvertisementById(req.params.id, function (err, data) {
    if (err) {
      return res.status(500).json({ message: err.message });
    } else {
      var newImagesPaths = [];
      data[0].imagePaths.forEach(function (imagePath) {
        imagePath = imagePath.slice(15, imagePath.length);
        newImagesPaths.push(imagePath);
      });

      // Delete each image

      newImagesPaths.forEach(function (imagePath) {
        fs.unlink(path.join(__dirname, imagePath), function (err) {
          if (err) {
            console.error(
              "Failed to delete image at " + imagePath + ": " + err.message
            );
          }
        });
      });

      // Delete the advertisement from the database
      AdvertisementModel.deleteAdvertisement(
        req.params.id,
        function (err, data) {
          if (err) {
            return res.status(500).json({ message: err.message });
          } else {
            res.json({
              message:
                "Advertisement and associated images deleted successfully.",
            });
          }
        }
      );
    }
  });
};
exports.getAdvertisementForStatusById = async function (req, res) {
  try {
    const id = req.params.id;
    const data = await AdvertisementModel.getAdvertisementByIdForStatus(id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateAvertisementStatus = async function (req, res) {
  try {
    const id = req.params.id;
    const status = req.body.status;

    console.log(id, status);

    const secondData = await AdvertisementModel.updateAdvertisementStatus(
      id,
      status
    );

    res.status(200).json({
      message: "Advertisement status updated successfully.",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
