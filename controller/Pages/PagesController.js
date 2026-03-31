var PagesModel = require("../../models/Pages/PagesModel.js");

exports.getPages = function (req, res) {
  try {
    PagesModel.findPages(function (err, data) {
      if (err) {
        return res.status(500).json({ message: err.message });
      }

      res.json(data);
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPageCount = function (req, res) {
  try {
    PagesModel.countPage(function (err, data) {
      if (err) {
        return res.status(500).json({ message: err.message });
      }

      res.json(data);
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
